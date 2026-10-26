import { describe, expect, it, vi } from "vitest";

import { createMailer, createSender } from "./email";

const message = {
  to: "maya@example.com",
  url: "https://ninetothree.com/api/auth/callback/email?token=abc",
  expires: new Date("2026-03-01T12:15:00Z"),
};

describe("createSender", () => {
  it("posts to Resend when there is a key", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    const send = createSender({ RESEND_API_KEY: "re_test" }, fetchImpl);

    await send(message);

    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer re_test");
    const body = JSON.parse(init.body);
    expect(body.to).toBe("maya@example.com");
    expect(body.text).toContain(message.url);
    expect(body.from).toBe("Nine to Three <hello@ninetothree.com>");
  });

  it("uses the configured from address", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    const send = createSender(
      { RESEND_API_KEY: "re_test", EMAIL_FROM: "Hi <hi@x.com>" },
      fetchImpl,
    );

    await send(message);

    expect(JSON.parse(fetchImpl.mock.calls[0]![1].body).from).toBe("Hi <hi@x.com>");
  });

  it("throws when Resend refuses, rather than pretending it sent", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("nope", { status: 422 }));
    const send = createSender({ RESEND_API_KEY: "re_test" }, fetchImpl);

    await expect(send(message)).rejects.toThrow("Resend refused the message: 422");
  });

  it("writes the link to the log when there is no key and this is not production", async () => {
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const send = createSender({ NODE_ENV: "development" });

    await send(message);

    expect(write).toHaveBeenCalledOnce();
    expect(String(write.mock.calls[0]![0])).toContain(message.url);
    write.mockRestore();
  });

  it("refuses to log a link in production", async () => {
    const send = createSender({ NODE_ENV: "production" });

    await expect(send(message)).rejects.toThrow("No email provider is configured");
  });
});

describe("createMailer", () => {
  it("sends any subject, not just a sign-in link", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    const send = createMailer({ RESEND_API_KEY: "re_test" }, fetchImpl);

    await send({
      to: "maya@example.com",
      subject: "Your account is on its way out",
      text: "Hello.",
    });

    const [, init] = fetchImpl.mock.calls[0]!;
    expect(JSON.parse(String(init.body))).toMatchObject({
      subject: "Your account is on its way out",
      text: "Hello.",
    });
  });

  it("logs any message when there is no key and this is not production", async () => {
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const send = createMailer({ NODE_ENV: "development" });

    await send({ to: "maya@example.com", subject: "A subject", text: "A body." });

    expect(String(write.mock.calls[0]![0])).toContain("A subject");
    write.mockRestore();
  });

  it("refuses to log in production", async () => {
    const send = createMailer({ NODE_ENV: "production" });

    await expect(send({ to: "maya@example.com", subject: "s", text: "t" })).rejects.toThrow(
      "No email provider is configured",
    );
  });

  it("logs in production when the test switch is on", async () => {
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const send = createMailer({ NODE_ENV: "production", AUTH_TEST_MODE: "1" });

    await send({ to: "maya@example.com", subject: "s", text: "t" });

    expect(write).toHaveBeenCalledOnce();
    write.mockRestore();
  });
});
