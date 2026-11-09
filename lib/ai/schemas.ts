import { z } from "zod";
import { AIError, withAbort } from "./errors";
const birth = z
  .object({
    year: z.number().int().min(1900).max(2050),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    clockHour: z.number().int().min(0).max(23),
    clockMinute: z.number().int().min(0).max(59),
    gender: z.enum(["male", "female"]),
    name: z.string().max(100).optional(),
    birthplace: z.string().max(200).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    timeMode: z.enum(["clock", "mean-solar", "apparent-solar"]),
    lateTyRule: z.enum(["next-day", "current-day"]),
    unknownTime: z.boolean(),
  })
  .strict()
  .refine((value) => {
    const date = new Date(Date.UTC(value.year, value.month - 1, value.day));
    return (
      date.getUTCMonth() === value.month - 1 && date.getUTCDate() === value.day
    );
  }, "Ngày không tồn tại")
  .refine(
    (value) => value.timeMode === "clock" || value.longitude !== undefined,
    "Cần kinh độ khi hiệu chỉnh giờ",
  );
const messages = z
  .array(
    z
      .object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      })
      .strict(),
  )
  .max(12)
  .default([])
  .refine(
    (value) =>
      value.reduce((sum, message) => sum + message.content.length, 0) <= 16000,
    "Hội thoại quá dài",
  );
const interpretSchema = z
  .object({
    birth,
    messages,
    topic: z
      .enum([
        "overview",
        "career",
        "relationships",
        "wealth",
        "health",
        "palace",
      ])
      .default("overview"),
    palaceBranch: z.number().int().min(0).max(11).optional(),
    view: z
      .discriminatedUnion("mode", [
        z.object({ mode: z.literal("natal") }).strict(),
        z
          .object({
            mode: z.literal("year"),
            year: z.number().int().min(1900).max(2200),
          })
          .strict(),
        z
          .object({
            mode: z.literal("decade"),
            decadeIndex: z.number().int().min(0).max(11),
          })
          .strict(),
      ])
      .default({ mode: "natal" }),
  })
  .strict()
  .refine(
    (value) => value.topic !== "palace" || value.palaceBranch !== undefined,
    "Cần chọn cung",
  );
const hemingSchema = z
  .object({
    birthA: birth,
    birthB: birth,
    messages,
    question: z.string().trim().max(2000).optional(),
  })
  .strict();
export type InterpretInput = z.infer<typeof interpretSchema>;
export type HemingInput = z.infer<typeof hemingSchema>;
export type AIInput = InterpretInput | HemingInput;
export type AIMode = "interpret" | "heming";
export async function readInput(
  request: Request,
  mode: AIMode,
  signal: AbortSignal,
): Promise<AIInput> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    throw new AIError("UNSUPPORTED_MEDIA_TYPE", 415, "Yêu cầu phải dùng JSON.");
  if (Number(request.headers.get("content-length")) > 32768)
    throw new AIError("BODY_TOO_LARGE", 413, "Dữ liệu gửi lên quá lớn.");
  const reader = request.body?.getReader();
  if (!reader) throw new AIError("INVALID_INPUT", 400, "Thiếu dữ liệu sinh.");
  let bytes = 0;
  let body = "";
  const decoder = new TextDecoder("utf-8", { fatal: true });
  try {
    while (true) {
      const { value, done } = await withAbort(reader.read(), signal);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 32768)
        throw new AIError("BODY_TOO_LARGE", 413, "Dữ liệu gửi lên quá lớn.");
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    const result = (
      mode === "interpret" ? interpretSchema : hemingSchema
    ).safeParse(JSON.parse(body));
    if (!result.success) throw new Error();
    return result.data;
  } catch (error) {
    if (error instanceof AIError) throw error;
    throw new AIError(
      "INVALID_INPUT",
      400,
      "Dữ liệu sinh hoặc hội thoại không hợp lệ.",
    );
  } finally {
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
