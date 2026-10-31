import { afterEach, describe, expect, it } from "vitest";
import {
  addressFromKey,
  addressKey,
  appUrl,
  propertyBoardPath,
  safeAppPath,
  withSearchParam,
} from "./app-url";

describe("appUrl", () => {
  const previousApp = process.env.APP_URL;
  const previousPublic = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (previousApp === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previousApp;
    if (previousPublic === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previousPublic;
  });

  it("prefers APP_URL, then NEXT_PUBLIC_APP_URL, then the public host", () => {
    process.env.APP_URL = "https://demo-vergesnag.goverge.app/";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3002";
    expect(appUrl()).toBe("https://demo-vergesnag.goverge.app");

    delete process.env.APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3002/";
    expect(appUrl()).toBe("http://localhost:3002");

    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(appUrl()).toBe("https://demo-vergecare.goverge.app");
  });
});

describe("property paths", () => {
  it("round-trips an address into a property board path", () => {
    const address = "14 Rosebank Road, Manchester";
    const key = addressKey(address);
    expect(addressFromKey(key)).toBe(address);
    expect(propertyBoardPath("tok", address)).toBe(`/b/tok/p/${key}/board`);
    expect(addressFromKey(`${key}x`)).toBeNull();
  });
});

describe("safeAppPath", () => {
  it("allows magic-link and track paths only", () => {
    expect(safeAppPath("/b/tok/p/key/board?email=scheduled")).toBe(
      "/b/tok/p/key/board?email=scheduled",
    );
    expect(safeAppPath("https://evil.example/b/tok")).toBeNull();
    expect(safeAppPath("//evil.example/b/tok")).toBeNull();
  });
});

describe("withSearchParam", () => {
  it("adds the email status without dropping the path", () => {
    expect(withSearchParam("/b/tok/p/key/board", "email", "scheduled")).toBe(
      "/b/tok/p/key/board?email=scheduled",
    );
  });
});
