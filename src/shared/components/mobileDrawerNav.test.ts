import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const srcRoot = join(import.meta.dirname!, "..", "..");

function read(rel: string) {
  return readFileSync(join(srcRoot, rel), "utf-8");
}

describe("mobile drawer labeled navigation", () => {
  const drawer = read("shared/components/MobileDrawer.tsx");
  const nav = read("shared/components/PrimaryNavContent.tsx");
  const primaryNav = read("shared/components/PrimaryNav.tsx");

  it("mobile drawer uses labeled drawer variant, not icon-only rail width", () => {
    assert.ok(drawer.includes('variant="drawer"'));
    assert.ok(drawer.includes("onNavigate={onClose}"));
    assert.ok(drawer.includes("w-64"));
    assert.ok(!drawer.includes("w-14"));
    assert.ok(drawer.includes("primary-nav-drawer") || nav.includes("primary-nav-drawer"));
  });

  it("drawer variant renders Persian labels for main and utility actions", () => {
    assert.ok(nav.includes('variant === "drawer"'));
    assert.ok(nav.includes("لیست شرکت‌ها"));
    assert.ok(nav.includes("افزودن شرکت"));
    assert.ok(nav.includes("راهنما"));
    assert.ok(nav.includes("کیف توکن"));
    assert.ok(nav.includes("تنظیمات حساب"));
    assert.ok(nav.includes("خروج از حساب"));
    assert.ok(nav.includes("text-right"));
  });

  it("desktop PrimaryNav keeps the compact icon rail", () => {
    assert.ok(primaryNav.includes("<PrimaryNavContent />"));
    assert.ok(!primaryNav.includes('variant="drawer"'));
    assert.ok(primaryNav.includes("hidden"));
    assert.ok(primaryNav.includes("lg:flex"));
    assert.ok(primaryNav.includes("w-16"));
  });
});
