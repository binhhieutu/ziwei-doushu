import { expect, test, type Locator } from "@playwright/test";

async function fillBirth(
  form: Locator,
  year = "2007",
  day = "17",
  month = "2",
) {
  for (const [label, value] of [
    ["Ngày", day],
    ["Tháng", month],
    ["Năm", year],
    ["Giờ", "10"],
    ["Phút", "30"],
  ]) {
    await form.getByLabel(label, { exact: true }).fill(value);
  }
}

const reading =
  'data: {"delta":{"text":"Tử Vi Việt: đây là dữ liệu luận giải giả lập để kiểm thử giao diện."}}\n\ndata: [DONE]\n\n';

test("API thật chấp nhận nguồn trang và chặn nguồn ngoài", async ({ page }) => {
  await page.goto("/chart");
  const origin = new URL(page.url()).origin;
  const accepted = await page.request.post("/api/interpret", {
    headers: { Origin: origin },
    data: {},
  });
  expect(accepted.status()).toBe(400);
  expect(await accepted.json()).toMatchObject({ code: "INVALID_INPUT" });
  const rejected = await page.request.post("/api/interpret", {
    headers: { Origin: "https://foreign.example" },
    data: {},
  });
  expect(rejected.status()).toBe(403);
});

test("lịch Việt, bàn số và AI chủ động hoạt động trong một luồng", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let aiCalls = 0;
  await page.route("**/api/interpret", async (route) => {
    aiCalls++;
    const input = route.request().postDataJSON();
    expect(input.birth.year).toBe(2007);
    expect(input.birth.timeMode).toBe("clock");
    expect(input.view).toEqual({ mode: "year", year: 2027 });
    expect(input.model).toBeUndefined();
    await route.fulfill({ contentType: "text/event-stream", body: reading });
  });
  await page.goto("/chart");
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await fillBirth(page.getByRole("group", { name: "Thông tin sinh" }));
  await page.getByRole("button", { name: "Lập lá số", exact: true }).click();
  const chart = page.getByRole("region", { name: "Lá số tử vi", exact: true });
  await expect(chart).toContainText("Âm lịch: 1/1/2007");
  await expect(chart.getByRole("button", { name: /^Cung / })).toHaveCount(12);
  await chart.getByRole("button", { name: /^Cung Mệnh ·/ }).click();
  await expect(chart).toContainText("Chi tiết cung Mệnh");
  await chart.getByRole("button", { name: "Lưu niên", exact: true }).click();
  await chart.getByLabel("Năm lưu niên").fill("2027");
  await expect(chart).toContainText("Lưu niên 2027");
  expect(aiCalls).toBe(0);
  await page.getByRole("button", { name: "Yêu cầu luận giải" }).click();
  await expect(
    page.getByText("Tử Vi Việt: đây là dữ liệu luận giải giả lập", {
      exact: false,
    }),
  ).toBeVisible();
  expect(aiCalls).toBe(1);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("hai giao diện giữ chữ và thông báo dễ đọc", async ({ page }) => {
  async function contrast(locator: Locator) {
    return locator.evaluate((element) => {
      const rgb = (value: string) => (value.match(/[\d.]+/g) || []).map(Number);
      const luminance = (channels: number[]) =>
        channels
          .slice(0, 3)
          .map((v) => {
            const s = v / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          })
          .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
      let parent: Element | null = element;
      let background = [255, 255, 255];
      while (parent) {
        const color = rgb(getComputedStyle(parent).backgroundColor);
        if (color.length === 3 || color[3] > 0.99) {
          background = color;
          break;
        }
        parent = parent.parentElement;
      }
      const foreground = luminance(rgb(getComputedStyle(element).color));
      const back = luminance(background);
      return (
        (Math.max(foreground, back) + 0.05) /
        (Math.min(foreground, back) + 0.05)
      );
    });
  }
  for (const path of ["/chart", "/heming"]) {
    await page.goto(path);
    await page
      .getByRole("button", {
        name: path === "/chart" ? "Lập lá số" : "Lập hai lá số",
        exact: true,
      })
      .click();
    for (const theme of ["light", "dark"]) {
      if ((await page.locator("html").getAttribute("data-theme")) !== theme)
        await page
          .getByRole("button", { name: /Chuyển sang giao diện/ })
          .click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect(
        await contrast(page.getByRole("heading", { level: 1 })),
      ).toBeGreaterThanOrEqual(3);
      expect(
        await contrast(page.locator(".viet-intro > p").last()),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        await contrast(page.locator(".viet-form label").first()),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        await contrast(page.locator(".viet-form .viet-hint").first()),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        await contrast(page.locator('.viet-page [role="alert"]').first()),
      ).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test("hai lá số được xem trước khi gửi phân tích, lỗi có thể thử lại", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/heming", async (route) => {
    calls++;
    const data = route.request().postDataJSON();
    expect(data.birthA.year).toBe(2007);
    expect(data.birthB.year).toBe(2000);
    if (calls === 1)
      await route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Dịch vụ AI tạm thời không phản hồi.",
          code: "UPSTREAM_ERROR",
        }),
      });
    else
      await route.fulfill({ contentType: "text/event-stream", body: reading });
  });
  await page.goto("/heming");
  await fillBirth(
    page.getByRole("group", { name: "Người thứ nhất", exact: true }),
  );
  await fillBirth(
    page.getByRole("group", { name: "Người thứ hai", exact: true }),
    "2000",
    "1",
    "1",
  );
  await page.getByRole("button", { name: "Lập hai lá số" }).click();
  await expect(page.getByRole("region", { name: "Lá số tử vi" })).toContainText(
    "17/2/2007",
  );
  await page
    .getByRole("button", { name: "Người thứ hai", exact: true })
    .click();
  await expect(page.getByRole("region", { name: "Lá số tử vi" })).toContainText(
    "1/1/2000",
  );
  expect(calls).toBe(0);
  await page.getByRole("button", { name: "Yêu cầu luận giải" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "tạm thời không phản hồi" }),
  ).toContainText("tạm thời không phản hồi");
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(
    page.getByText("Tử Vi Việt: đây là dữ liệu luận giải giả lập", {
      exact: false,
    }),
  ).toBeVisible();
  expect(calls).toBe(2);
});

test("giờ chưa rõ cần giả định rõ ràng và có thể hủy AI", async ({ page }) => {
  await page.route("**/api/interpret", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route
      .fulfill({ contentType: "text/event-stream", body: reading })
      .catch(() => {});
  });
  await page.goto("/chart");
  await fillBirth(page.getByRole("group", { name: "Thông tin sinh" }));
  await page.getByLabel("Không biết giờ sinh").check();
  await page.getByRole("button", { name: "Lập lá số", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "chọn giờ giả định" }),
  ).toContainText("chọn giờ giả định");
  await page
    .getByRole("combobox", { name: "Giờ giả định", exact: true })
    .selectOption("10");
  await page.getByRole("button", { name: "Lập lá số", exact: true }).click();
  await expect(page.getByRole("region", { name: "Lá số tử vi" })).toContainText(
    "Tạm tính",
  );
  await page.getByRole("button", { name: "Yêu cầu luận giải" }).click();
  await page.getByRole("button", { name: "Hủy luận giải" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Đã hủy luận giải" }),
  ).toContainText("Đã hủy luận giải");
});

test("các trang công khai giữ tiếng Việt và không lộ cấu hình AI", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("navigation", { name: "Điều hướng chính" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /Tử Vi|lá số/i,
  );
  await page.goto("/knowledge");
  await expect(
    page.getByText("Thiên Cơ", { exact: true }).first(),
  ).toBeVisible();
  await page.goto("/library");
  await expect(page.getByText(/nguyên văn chữ Hán/i).first()).toBeVisible();
  const marker = "<img src=x onerror=window.__xss=true>";
  await page.goto("/library/search?q=" + encodeURIComponent(marker));
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as unknown as { __xss?: boolean }).__xss),
  ).toBeUndefined();
  await page.goto("/library/search?q=a&q=b");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /riêng tư/i,
  );
  await expect(page.locator("body")).not.toContainText("AI_API_KEY");
});
