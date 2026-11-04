import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CodeInClient, CodeInError } from "../src/index.ts";

describe("CodeInClient", () => {
  it("builds base URL without trailing slash", () => {
    const c = new CodeInClient({ baseUrl: "http://localhost:8000/" });
    assert.equal(c.baseUrl, "http://localhost:8000");
  });

  it("preview posts JSON and returns body", async () => {
    const c = new CodeInClient({
      baseUrl: "http://example.test",
      fetch: async (_url, init) => {
        assert.equal(init?.method, "POST");
        const body = JSON.parse(String(init?.body));
        assert.equal(body.idea, "chat app");
        return new Response(
          JSON.stringify({
            idea: "chat app",
            template: "discord-like",
            name: "PulseCord",
            ticker: "$PULSE",
            description: "test",
            icon_prompt: "tech",
            mock: true,
            will_launch_coin: true,
            will_generate_code: true,
            will_deploy: true,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    });
    const preview = await c.preview("chat app", "discord-like");
    assert.equal(preview.name, "PulseCord");
    assert.equal(preview.mock, true);
  });

  it("throws CodeInError on non-2xx", async () => {
    const c = new CodeInClient({
      baseUrl: "http://example.test",
      fetch: async () =>
        new Response(JSON.stringify({ detail: "nope" }), { status: 400 }),
    });
    await assert.rejects(() => c.getApp("x"), (err: unknown) => {
      assert.ok(err instanceof CodeInError);
      assert.equal(err.status, 400);
      return true;
    });
  });
});
