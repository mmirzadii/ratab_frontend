import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const here = import.meta.dirname!;

describe("MathExpressionResultAction desktop vs mobile", () => {
  const action = readFileSync(join(here, "MathExpressionResultAction.tsx"), "utf8");
  const numeric = readFileSync(join(here, "MathNumericInput.tsx"), "utf8");
  const composer = readFileSync(join(here, "ComposerMathTextarea.tsx"), "utf8");
  const config = readFileSync(join(here, "mathConfig.ts"), "utf8");

  it("desktop shows Tab keycap and mobile shows محاسبه", () => {
    assert.match(action, /Tab/);
    assert.match(action, /محاسبه/);
    assert.match(action, /useCoarsePointer/);
    assert.match(action, /forceMobile/);
    assert.match(action, /onPointerDown/);
    assert.match(config, /MATH_MOBILE_APPLY_LABEL_FA/);
    assert.match(config, /MATH_TAB_HINT_TITLE_FA/);
  });

  it("mobile touch target stays large while label stays compact", () => {
    assert.match(action, /min-h-11/);
    assert.match(action, /text-\[10px\]/);
  });

  it("financial and composer use the shared result action", () => {
    assert.match(numeric, /MathExpressionResultAction/);
    assert.match(numeric, /getMathExpressionPreview/);
    assert.match(numeric, /key === "Tab"/);
    assert.match(composer, /MathExpressionResultAction/);
    assert.match(composer, /mode="composer"/);
  });

  it("mobile apply does not auto-advance financial fields", () => {
    assert.match(numeric, /applyPreview\(\{ advance: false \}\)/);
  });
});
