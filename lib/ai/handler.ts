import { generateVietnamChart } from "@/lib/vietnam/birth";
import { buildMessages } from "./context";
import { getConfig } from "./config";
import { AIError, abortError, safeError, withAbort } from "./errors";
import { processLimiter, type Limiter } from "./limits";
import { readInput, type AIMode } from "./schemas";
import { normalizeStream } from "./stream";
import { assertRequestOrigin } from "./origin";
interface Dependencies {
  env?: Record<string, string | undefined>;
  fetch?: typeof fetch;
  limiter?: Limiter;
  generateChart?: typeof generateVietnamChart;
  timeoutMs?: number;
  maxBytes?: number;
  maxTextBytes?: number;
}
export function createAIHandler(mode: AIMode, dependencies: Dependencies = {}) {
  return async function POST(request: Request): Promise<Response> {
    const controller = new AbortController();
    let release: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cleaned = false;
    const clientAbort = () =>
      controller.abort(new AIError("CANCELED", 499, "Yêu cầu đã hủy."));
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      clearTimeout(timer);
      request.signal.removeEventListener("abort", clientAbort);
      release?.();
    };
    try {
      if (request.signal.aborted) throw abortError(request.signal);
      const serverEnv = dependencies.env ?? process.env;
      assertRequestOrigin(request, serverEnv);
      release = (dependencies.limiter ?? processLimiter).acquire();
      request.signal.addEventListener("abort", clientAbort, { once: true });
      timer = setTimeout(
        () =>
          controller.abort(
            new AIError(
              "AI_TIMEOUT",
              504,
              "AI phản hồi quá lâu. Vui lòng thử lại.",
            ),
          ),
        dependencies.timeoutMs ?? 45000,
      );
      const input = await readInput(request, mode, controller.signal);
      const config = getConfig(serverEnv);
      let messages;
      try {
        messages = buildMessages(input, dependencies.generateChart);
      } catch {
        throw new AIError(
          "INVALID_INPUT",
          400,
          "Không thể lập lá số từ dữ liệu sinh này.",
        );
      }
      const pendingProvider = (dependencies.fetch ?? fetch)(config.url, {
        method: "POST",
        redirect: "error",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          stream: true,
          max_tokens: config.maxTokens,
        }),
      }).then((response) => {
        // Defensive cleanup for transports that resolve even after AbortSignal cancellation.
        if (controller.signal.aborted)
          void response.body?.cancel().catch(() => {});
        return response;
      });
      const provider = await withAbort(pendingProvider, controller.signal);
      if (
        !provider.ok ||
        !provider.body ||
        !provider.headers
          .get("content-type")
          ?.toLowerCase()
          .includes("text/event-stream")
      ) {
        void provider.body?.cancel().catch(() => {});
        throw new AIError(
          "UPSTREAM_ERROR",
          502,
          "Dịch vụ AI tạm thời không phản hồi. Hãy thử lại sau.",
        );
      }
      const stream = normalizeStream(provider.body, {
        signal: controller.signal,
        abort: () => controller.abort(),
        cleanup,
        maxBytes: dependencies.maxBytes,
        maxTextBytes: dependencies.maxTextBytes,
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-store, no-transform",
          "X-Accel-Buffering": "no",
        },
      });
    } catch (error) {
      const safe = safeError(
        controller.signal.aborted ? abortError(controller.signal) : error,
      );
      controller.abort();
      cleanup();
      return Response.json(
        { error: safe.message, code: safe.code },
        {
          status: safe.status,
          headers: {
            "Cache-Control": "no-store",
            ...(safe.status === 429 ? { "Retry-After": "60" } : {}),
          },
        },
      );
    }
  };
}
