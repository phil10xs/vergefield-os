import { describe, expect, it } from "vitest";
import { boardLinkEmailContent } from "./board-link";

describe("boardLinkEmailContent", () => {
  it("uses the VergeCare shell and the properties link", () => {
    const content = boardLinkEmailContent({
      propertiesUrl: "https://vergesnag.goverge.app/b/tok",
      recipientName: "Priya Nair",
    });
    expect(content.subject).toBe("Your VergeCare link");
    expect(content.text).toContain("Hello Priya Nair,");
    expect(content.text).toContain("https://vergesnag.goverge.app/b/tok");
    expect(content.text).toContain("No password needed");
    expect(content.html).toContain("Open my properties");
    expect(content.html).toContain("https://vergesnag.goverge.app/b/tok");
    expect(content.html).not.toMatch(/GoVerge/);
    expect(content.text).not.toMatch(/GoVerge/);
  });
});
