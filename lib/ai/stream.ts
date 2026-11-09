import { AIError, abortError, safeError, withAbort } from "./errors";
interface StreamOptions {
  signal: AbortSignal;
  abort(): void;
  cleanup(): void;
  maxBytes?: number;
  maxTextBytes?: number;
}
const encode = new TextEncoder();
export function normalizeStream(
  body: ReadableStream<Uint8Array>,
  options: StreamOptions,
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let stopped = false;
  let bytes = 0;
  let textBytes = 0;
  let carry = "";
  let data: string[] = [];
  let eventType = "";
  let finishReason: string | undefined;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    options.abort();
    void reader
      .cancel()
      .catch(() => {})
      .finally(() => reader.releaseLock());
    options.cleanup();
  };
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (text: string) => {
        if (!stopped) controller.enqueue(encode.encode(text));
      };
      const complete = () => {
        if (finishReason === "length")
          throw new AIError(
            "OUTPUT_TRUNCATED",
            502,
            "Phản hồi AI đã dừng vì giới hạn độ dài. Bạn có thể yêu cầu câu trả lời ngắn hơn.",
          );
        if (finishReason === "content_filter")
          throw new AIError(
            "OUTPUT_FILTERED",
            502,
            "Dịch vụ AI đã dừng phản hồi theo bộ lọc nội dung.",
          );
        emit("data: [DONE]\n\n");
        return true;
      };
      const event = () => {
        const isError = eventType === "error";
        eventType = "";
        if (isError) throw new Error("Provider stream error");
        if (!data.length) return false;
        const payload = data.join("\n");
        data = [];
        if (payload === "[DONE]") {
          return complete();
        }
        let parsed;
        try {
          parsed = JSON.parse(payload);
        } catch {
          throw new AIError(
            "INVALID_STREAM",
            502,
            "Dịch vụ AI trả dữ liệu không hợp lệ.",
          );
        }
        if (parsed.error) throw new Error("Provider stream error");
        const text = parsed.choices?.[0]?.delta?.content;
        if (text !== undefined && text !== null && typeof text !== "string")
          throw new Error("Invalid delta");
        if (text) {
          if (finishReason)
            throw new AIError(
              "INVALID_STREAM",
              502,
              "Dịch vụ AI trả dữ liệu không hợp lệ.",
            );
          textBytes += encode.encode(text).byteLength;
          if (textBytes > (options.maxTextBytes ?? 65536))
            throw new AIError(
              "STREAM_LIMIT",
              502,
              "Phản hồi AI vượt giới hạn.",
            );
          emit(`data: ${JSON.stringify({ delta: { text } })}\n\n`);
        }
        const reason = parsed.choices?.[0]?.finish_reason;
        if (reason !== undefined && reason !== null) {
          if (
            !["stop", "length", "content_filter"].includes(reason) ||
            (finishReason && finishReason !== reason)
          )
            throw new AIError(
              "INVALID_STREAM",
              502,
              "Dịch vụ AI trả dữ liệu không hợp lệ.",
            );
          finishReason = reason;
        }
        return false;
      };
      const line = (value: string) => {
        if (!value) return event();
        if (value.startsWith("data:"))
          data.push(value.slice(5).replace(/^ /, ""));
        if (value.startsWith("event:")) eventType = value.slice(6).trim();
        return false;
      };
      try {
        while (!stopped) {
          const { value, done } = await withAbort(
            reader.read(),
            options.signal,
          );
          if (done) {
            carry += decoder.decode();
            break;
          }
          bytes += value.byteLength;
          if (bytes > (options.maxBytes ?? 524288))
            throw new AIError(
              "STREAM_LIMIT",
              502,
              "Phản hồi AI vượt giới hạn.",
            );
          carry += decoder.decode(value, { stream: true });
          let end;
          while ((end = carry.indexOf("\n")) !== -1) {
            const current = carry.slice(0, end).replace(/\r$/, "");
            carry = carry.slice(end + 1);
            if (line(current)) {
              controller.close();
              stop();
              return;
            }
          }
          if (carry.length + data.join("").length > 32768)
            throw new AIError(
              "STREAM_LIMIT",
              502,
              "Phản hồi AI vượt giới hạn.",
            );
        }
        if (stopped) return;
        // A terminal event without a final blank line is still a valid provider terminator.
        if (carry) line(carry.replace(/\r$/, ""));
        if (event() || (finishReason && complete())) {
          controller.close();
          stop();
          return;
        }
        throw new AIError(
          "INCOMPLETE_STREAM",
          502,
          "Phản hồi AI bị gián đoạn. Bạn có thể thử lại.",
        );
      } catch (error) {
        if (!stopped) {
          const safe = safeError(
            options.signal.aborted ? abortError(options.signal) : error,
          );
          emit(
            `event: error\ndata: ${JSON.stringify({ error: safe.message, code: safe.code })}\n\n`,
          );
          controller.close();
        }
      } finally {
        stop();
      }
    },
    cancel() {
      stop();
    },
  });
}
