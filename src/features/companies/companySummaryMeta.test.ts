import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Company } from "./companyApi.ts";
import {
  buildCompanySummaryMeta,
  companyProfileIsSparse,
  formatCompanyListDate,
  resolveViewerRoleLabel
} from "./companySummaryMeta.ts";
import type { CompanyMember } from "./companyMembersApi.ts";

function company(partial: Partial<Company> & Pick<Company, "id" | "name">): Company {
  return {
    owner_member_id: 1,
    public_group_id: null,
    is_active: true,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-16T10:00:00Z",
    ...partial
  };
}

describe("company summary metadata", () => {
  it("includes only available real fields and hides empties", () => {
    const rows = buildCompanySummaryMeta(
      company({
        id: 1,
        name: "متریل",
        legal_name: "شرکت متریل",
        registration_number: "123",
        national_id: "",
        active_slug: "metril"
      }),
      { roleLabel: "مالک", memberCount: 4 }
    );
    const keys = rows.map((row) => row.key);
    assert.deepEqual(keys, [
      "legal_name",
      "registration_number",
      "active_slug",
      "role",
      "members",
      "created_at"
    ]);
    assert.ok(!keys.includes("national_id"));
    assert.ok(!rows.some((row) => row.value === "-"));
  });

  it("never surfaces internal ids", () => {
    const rows = buildCompanySummaryMeta(
      company({
        id: 99,
        name: "A",
        owner_member_id: 55,
        public_group_id: 77
      })
    );
    const blob = JSON.stringify(rows);
    assert.ok(!blob.includes("owner_member"));
    assert.ok(!blob.includes("public_group"));
    assert.ok(!blob.includes('"99"'));
    assert.ok(!rows.some((row) => row.label.includes("شناسه داخلی")));
  });

  it("resolves viewer role labels from memberships", () => {
    const members = [
      {
        id: 1,
        user_id: 10,
        role: "owner",
        is_active: true
      }
    ] as CompanyMember[];
    assert.equal(resolveViewerRoleLabel(members, 10), "مالک");
    assert.equal(resolveViewerRoleLabel(members, 99), null);
  });

  it("formats creation dates in fa-IR when valid", () => {
    const formatted = formatCompanyListDate("2024-01-15T10:00:00Z");
    assert.ok(formatted);
    assert.notEqual(formatted, "2024-01-15T10:00:00Z");
  });

  it("detects sparse profiles for completion CTA eligibility", () => {
    assert.equal(companyProfileIsSparse(company({ id: 1, name: "Only name" })), true);
    assert.equal(
      companyProfileIsSparse(company({ id: 1, name: "A", legal_name: "Legal" })),
      false
    );
  });
});
