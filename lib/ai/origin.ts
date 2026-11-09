import { AIError } from "./errors";

/** An explicit public origin survives Next's internal URL/reverse-proxy hostname normalization. */
export function assertRequestOrigin(
  request: Request,
  env: Record<string, string | undefined>,
): void {
  let expectedOrigin: string;
  try {
    const configured = env.NEXT_PUBLIC_SITE_URL;
    const site = new URL(configured === undefined ? request.url : configured);
    if (
      !["http:", "https:"].includes(site.protocol) ||
      site.username ||
      site.password
    )
      throw new Error();
    expectedOrigin = site.origin;
  } catch {
    throw new AIError(
      "SITE_ORIGIN_NOT_CONFIGURED",
      503,
      "Địa chỉ website chưa được cấu hình hợp lệ trên máy chủ.",
    );
  }

  const origin = request.headers.get("origin");
  // Native requests may omit Origin; shared process quotas remain the independent cost boundary.
  if (origin === null) return;
  try {
    const supplied = new URL(origin);
    if (supplied.origin === origin && origin === expectedOrigin) return;
  } catch {
    /* Malformed browser origins are rejected with the same safe response. */
  }
  throw new AIError("ORIGIN_REJECTED", 403, "Nguồn yêu cầu không hợp lệ.");
}
