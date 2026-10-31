import { afterEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("@aws-sdk/client-sesv2", () => {
  return {
    SESv2Client: class {
      send = sendMock;
    },
    SendEmailCommand: class {
      kind = "SendEmail" as const;
      input: unknown;
      constructor(input: unknown) {
        this.input = input;
      }
    },
    GetSuppressedDestinationCommand: class {
      kind = "GetSuppressedDestination" as const;
      input: unknown;
      constructor(input: unknown) {
        this.input = input;
      }
    },
  };
});

type MockCommand = {
  kind?: "SendEmail" | "GetSuppressedDestination";
  input: Record<string, unknown>;
};

function notFound() {
  const error = new Error("not on suppression list");
  error.name = "NotFoundException";
  return error;
}

describe("sendEmail", () => {
  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.SES_FROM_EMAIL;
    delete process.env.SES_FROM_NAME;
    delete process.env.SES_CONFIGURATION_SET;
  });

  it("throws when SES is not configured and does not call the client", async () => {
    const { sendEmail } = await import("./ses");
    await expect(
      sendEmail({
        to: "landlord@acme.co",
        subject: "Your VergeCare link",
        html: "<p>Hi</p>",
        text: "Hi",
      }),
    ).rejects.toThrow(/SES_FROM_EMAIL/);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends through SES when a sender is configured", async () => {
    process.env.SES_FROM_EMAIL = "noreply@goverge.app";
    process.env.SES_FROM_NAME = "VergeCare";
    sendMock.mockImplementation(async (command: MockCommand) => {
      if (command.kind === "GetSuppressedDestination") throw notFound();
      return { MessageId: "mid" };
    });
    const { sendEmail } = await import("./ses");
    await sendEmail({
      to: "landlord@acme.co",
      subject: "Your VergeCare link",
      html: "<p>Hi</p>",
      text: "Hi",
    });
    const sent = sendMock.mock.calls
      .map((call) => call[0] as MockCommand)
      .find((command) => command.kind === "SendEmail");
    expect(sent?.input.FromEmailAddress).toBe("VergeCare <noreply@goverge.app>");
    expect(sent?.input.Destination).toEqual({
      ToAddresses: ["landlord@acme.co"],
    });
  });

  it("does not send to a disposable inbox", async () => {
    process.env.SES_FROM_EMAIL = "noreply@goverge.app";
    const { sendEmail } = await import("./ses");
    await expect(
      sendEmail({
        to: "person@yopmail.com",
        subject: "Your VergeCare link",
        html: "<p>Hi</p>",
        text: "Hi",
      }),
    ).rejects.toThrow(/not allowed/);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
