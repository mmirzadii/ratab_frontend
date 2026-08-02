import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { suggestCompanySlug } from "./companySlugSuggest.ts";

describe("suggestCompanySlug", () => {
  it("builds a latin hyphenated slug from latin names", () => {
    assert.equal(suggestCompanySlug("Metril Tehran Co"), "metril-tehran-co");
  });

  it("returns empty when no latin characters remain", () => {
    assert.equal(suggestCompanySlug("شرکت نمونه"), "");
  });

  it("strips unsupported characters and collapses hyphens", () => {
    assert.equal(suggestCompanySlug("  Foo___Bar!!  "), "foo-bar");
  });
});
