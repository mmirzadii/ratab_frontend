import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function collectTsxFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === "node_modules" || entry === "dist") continue;
    if (statSync(full).isDirectory()) {
      results.push(...collectTsxFiles(full));
    } else if (full.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

const srcDir = join(import.meta.dirname!, "..", "..");
const tsxFiles = collectTsxFiles(srcDir);

function readAll(): string {
  return tsxFiles.map((f) => readFileSync(f, "utf-8")).join("\n");
}

const allSource = readAll();

const internalPhrases = [
  "در فرانت اختراع نمی",
  "تصمیم مالک محصول",
  "فرانت مبلغ",
  "در نسخه فعلی فقط ادمین",
  "RTK Query",
  "تایپ‌های OpenAPI",
  "فراخوانی سلامت بک‌اند از تنظیمات",
  "نشست فعلی از طریق کوکی امن سرور بازیابی",
  "سرور مرجع نهایی دسترسی",
  "تصمیم نهایی با سرور",
  "قرارداد فعلی پشتیبانی نمی‌شود",
  "مالک دسترسی کامل و ضمنی دارد و از طریق سوئیچ‌های مجوز",
  "تغییر مالکیت فقط از مسیر اختصاصی",
];

describe("no internal developer text in user-facing UI", () => {
  for (const phrase of internalPhrases) {
    it(`should not contain "${phrase}"`, () => {
      assert.ok(
        !allSource.includes(phrase),
        `Found internal text: "${phrase}"`
      );
    });
  }
});

describe("subscription page is compact", () => {
  const sub = readFileSync(
    join(srcDir, "features", "subscription", "SubscriptionSection.tsx"),
    "utf-8"
  );

  it("unlimited quota shows concise text", () => {
    assert.ok(sub.includes("بدون سقف روزانه"));
    assert.ok(!sub.includes("پیکربندی نشده"));
  });

  it("empty plans uses concise message", () => {
    assert.ok(sub.includes("هنوز طرح اشتراکی تعریف نشده است."));
    assert.ok(!sub.includes("مالک محصول"));
  });

  it("payment-disabled is concise", () => {
    assert.ok(sub.includes("پرداخت آنلاین در حال حاضر فعال نیست."));
    assert.ok(!sub.includes("درگاه بانکی"));
    assert.ok(!sub.includes("بررسی وضعیت پرداخت آنلاین"));
  });

  it("no admin activation explanation", () => {
    assert.ok(!sub.includes("فقط ادمین اشتراک را"));
  });
});

describe("member settings is concise", () => {
  const pane = readFileSync(
    join(srcDir, "features", "companies", "MemberSettingsPane.tsx"),
    "utf-8"
  );

  it("owner explanation is one short sentence", () => {
    assert.ok(pane.includes("مالک دسترسی کامل دارد و از این بخش قابل تغییر نیست."));
    assert.ok(!pane.includes("مالک قابل حذف"));
    assert.ok(!pane.includes("مسیر اختصاصی انتقال"));
  });

  it("peer admin message is concise", () => {
    assert.ok(pane.includes("فقط خواندنی"));
    assert.ok(!pane.includes("ویرایش نقش یا مجوزهای مدیران دیگر"));
  });

  it("no default value helper text under switches", () => {
    assert.ok(!pane.includes("پیش‌فرض: روشن"));
    assert.ok(!pane.includes("پیش‌فرض: خاموش"));
  });

  it("destructive confirmations still exist", () => {
    assert.ok(pane.includes("window.confirm"));
    assert.match(pane, /غیرفعال شود/);
    assert.match(pane, /حذف شود/);
  });
});

describe("wallet section is concise", () => {
  const wallet = readFileSync(
    join(srcDir, "features", "wallet", "WalletSection.tsx"),
    "utf-8"
  );

  it("no long explanation about token charging", () => {
    assert.ok(!wallet.includes("شارژ فعلاً توسط ادمین"));
    assert.ok(!wallet.includes("۵ توکن"));
    assert.ok(!wallet.includes("5 توکن"));
  });
});

describe("no raw English backend text in error messages", () => {
  it("health page errors are Persian", () => {
    const health = readFileSync(
      join(srcDir, "features", "health", "HealthStatusPage.tsx"),
      "utf-8"
    );
    assert.ok(!health.includes("RTK Query"));
    assert.ok(!health.includes("OpenAPI"));
  });
});

describe("authenticated marketing phrases stay out of product screens", () => {
  const productFiles = tsxFiles.filter((f) => !f.includes("LandingPage.tsx"));
  const productSource = productFiles.map((f) => readFileSync(f, "utf-8")).join("\n");
  const banned = [
    "فضای شرکت‌های متریل",
    "فضای حرفه‌ای شما",
    "تجربه‌ای متفاوت",
    "مدیریت هوشمند",
    "همه چیز در یک نگاه",
    "آماده شروع هستید",
    "optional-company-slug"
  ];

  for (const phrase of banned) {
    it(`should not contain "${phrase}" outside landing`, () => {
      assert.ok(!productSource.includes(phrase), `Found banned copy: "${phrase}"`);
    });
  }
});

describe("accessibility labels remain", () => {
  const sub = readFileSync(
    join(srcDir, "features", "subscription", "SubscriptionSection.tsx"),
    "utf-8"
  );
  const pane = readFileSync(
    join(srcDir, "features", "companies", "MemberSettingsPane.tsx"),
    "utf-8"
  );

  it("subscription refresh has aria-label", () => {
    assert.match(sub, /aria-label/);
  });

  it("member settings has data-tour attributes", () => {
    assert.match(pane, /data-tour/);
  });

  it("permission switches have aria-label", () => {
    assert.match(pane, /aria-label=\{item\.label\}/);
  });
});
