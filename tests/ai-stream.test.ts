import { describe, expect, it, vi } from "vitest";
import { normalizeStream } from "@/lib/ai/stream";
import { AIError } from "@/lib/ai/errors";
const encoder = new TextEncoder();
function chunks(parts: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const part of parts) controller.enqueue(part);
      controller.close();
    },
  });
}
function run(
  parts: Uint8Array[],
  options: { maxBytes?: number; maxTextBytes?: number } = {},
) {
  const controller = new AbortController();
  const cleanup = vi.fn();
  const body = normalizeStream(chunks(parts), {
    signal: controller.signal,
    abort: () => controller.abort(),
    cleanup,
    ...options,
  });
  return { result: new Response(body).text(), cleanup };
}
describe("provider SSE normalization", () => {
  it("accepts confirmed stop at EOF without DONE with every UTF8/finish fragment boundary", async () => {
    const payload =
      'data: {"choices":[{"index":0,"delta":{"content":"Tử Vi 🌟"},"finish_reason":null}]}\n\ndata: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\ndata: {"choices":[],"usage":{"completion_tokens":5}}\n\n';
    const bytes = encoder.encode(payload);
    for (let split = 1; split < bytes.length; split++) {
      const { result, cleanup } = run([
        bytes.slice(0, split),
        bytes.slice(split),
      ]);
      expect(await result).toBe(
        'data: {"delta":{"text":"Tử Vi 🌟"}}\n\ndata: [DONE]\n\n',
      );
      expect(cleanup).toHaveBeenCalledOnce();
    }
    expect(
      await run(Array.from(bytes, (byte) => new Uint8Array([byte]))).result,
    ).toContain("[DONE]");
  });
  it("supports stop on the final content event without a trailing newline", async () => {
    expect(
      await run([
        encoder.encode(
          'data: {"choices":[{"delta":{"content":"OK"},"finish_reason":"stop"}]}',
        ),
      ]).result,
    ).toBe('data: {"delta":{"text":"OK"}}\n\ndata: [DONE]\n\n');
  });
  it.each([
    ["length", "OUTPUT_TRUNCATED"],
    ["content_filter", "OUTPUT_FILTERED"],
    ["tool_calls", "INVALID_STREAM"],
  ])(
    "makes incomplete or unsupported termination %s visible even with DONE",
    async (reason, code) => {
      for (const terminator of ["", "data: [DONE]\n\n"]) {
        const payload = `data: {"choices":[{"delta":{"content":"partial"},"finish_reason":"${reason}"}]}\n\n${terminator}`;
        const result = await run([encoder.encode(payload)]).result;
        expect(result).toContain(`"code":"${code}"`);
        expect(result).not.toContain("[DONE]");
      }
    },
  );
  it.each([
    ['data: {"error":{"message":"PRIVATE"}}\n\n', "UPSTREAM_ERROR"],
    ['event: error\ndata: {"message":"PRIVATE"}\n\n', "UPSTREAM_ERROR"],
    ["data: malformed\n\n", "INVALID_STREAM"],
  ])(
    "keeps reading after finish and rejects a final provider fault: %s",
    async (errorEvent, code) => {
      const payload = `data: {"choices":[{"delta":{"content":"OK"},"finish_reason":"stop"}]}\n\n${errorEvent}`;
      const result = await run([encoder.encode(payload)]).result;
      expect(result).toContain("event: error");
      expect(result).toContain(`"code":"${code}"`);
      expect(result).not.toContain("[DONE]");
      expect(result).not.toContain("PRIVATE");
    },
  );
  it("rejects new text after a confirmed finish rather than hiding a malformed stream", async () => {
    const payload =
      'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\ndata: {"choices":[{"delta":{"content":"unexpected"}}]}\n\n';
    const result = await run([encoder.encode(payload)]).result;
    expect(result).toContain("INVALID_STREAM");
    expect(result).not.toContain("[DONE]");
  });
  it("supports UTF8 fragmented at every byte, CRLF, multi-event carry and comments", async () => {
    const payload =
      ': ping\r\nevent: message\r\ndata: {"choices":[{"delta":{"role":"assistant"}}]}\r\n\r\ndata: {"choices":[{"delta":{"content":"Tử Vi — tiếng Việt 🌟"}}]}\r\n\r\ndata: [DONE]\r\n\r\n';
    const bytes = encoder.encode(payload);
    for (let split = 1; split < bytes.length; split++) {
      const { result, cleanup } = run([
        bytes.slice(0, split),
        bytes.slice(split),
      ]);
      expect(await result).toContain("Tử Vi — tiếng Việt 🌟");
      expect(cleanup).toHaveBeenCalledOnce();
    }
    const { result } = run(Array.from(bytes, (byte) => new Uint8Array([byte])));
    expect(await result).toContain("[DONE]");
  });
  it("supports multiline JSON data and DONE at EOF without a blank line", async () => {
    const { result } = run([
      encoder.encode(
        'data: {"choices":\ndata: [{"delta":{"content":"A"}}]}\n\ndata: [DONE]',
      ),
    ]);
    expect(await result).toBe(
      'data: {"delta":{"text":"A"}}\n\ndata: [DONE]\n\n',
    );
  });
  it.each([
    ["", "INCOMPLETE_STREAM"],
    ["data: nonsense\n\n", "INVALID_STREAM"],
    ['data: {"error":{"message":"PRIVATE"}}\n\n', "UPSTREAM_ERROR"],
    ['data: {"choices":[{"delta":{"content":{}}}]}\n\n', "UPSTREAM_ERROR"],
    [
      'data: {"choices":[{"delta":{"content":"truncated"}}]}\n\n',
      "INCOMPLETE_STREAM",
    ],
  ])(
    "emits a safe error without DONE for malformed/incomplete provider: %s",
    async (payload, code) => {
      const { result, cleanup } = run([encoder.encode(payload)]);
      const text = await result;
      expect(text).toContain(`"code":"${code}"`);
      expect(text).not.toContain("PRIVATE");
      expect(text).not.toContain("[DONE]");
      expect(cleanup).toHaveBeenCalledOnce();
    },
  );
  it("rejects invalid UTF8 and enforces upstream/output/event bounds", async () => {
    expect(await run([new Uint8Array([255])]).result).toContain(
      "UPSTREAM_ERROR",
    );
    expect(
      await run([encoder.encode(": too much")], { maxBytes: 2 }).result,
    ).toContain("STREAM_LIMIT");
    expect(
      await run(
        [
          encoder.encode(
            'data: {"choices":[{"delta":{"content":"chào"}}]}\n\n',
          ),
        ],
        { maxTextBytes: 2 },
      ).result,
    ).toContain("STREAM_LIMIT");
    expect(await run([encoder.encode("x".repeat(32769))]).result).toContain(
      "STREAM_LIMIT",
    );
  });
  it("times out while reading and cancels the upstream reader exactly once", async () => {
    const abort = new AbortController();
    const cleanup = vi.fn();
    const cancel = vi.fn();
    const body = normalizeStream(new ReadableStream({ cancel }), {
      signal: abort.signal,
      abort: () => abort.abort(),
      cleanup,
    });
    const result = new Response(body).text();
    abort.abort(new AIError("AI_TIMEOUT", 504, "Hết thời gian."));
    expect(await result).toContain("AI_TIMEOUT");
    expect(cleanup).toHaveBeenCalledOnce();
    expect(cancel).toHaveBeenCalledOnce();
  });
});
