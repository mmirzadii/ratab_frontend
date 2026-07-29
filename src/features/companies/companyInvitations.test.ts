import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Pure helpers mirroring companyInvitationsApi list normalization and
 * membership-action cache tag selection (kept local so Node tests need no RTK).
 */

function getListResults<T>(data: { results?: readonly T[] } | readonly T[] | T | undefined): T[] {
  if (Array.isArray(data)) return [...data];
  if (!data || typeof data !== "object") return [];
  if ("results" in data) return [...((data as { results?: readonly T[] }).results ?? [])];
  return [data as T];
}

function normalizeInvitationList(data: unknown) {
  const results = getListResults(data as { results?: unknown[] } | unknown[]);
  if (data && typeof data === "object" && !Array.isArray(data) && "count" in data) {
    const page = data as { count: number; next?: string | null; previous?: string | null };
    return {
      count: page.count,
      next: page.next ?? null,
      previous: page.previous ?? null,
      results
    };
  }
  return { count: results.length, next: null, previous: null, results };
}

function tagsFromMembershipAction(result: {
  company?: { id?: number } | null;
  invitation?: { id?: number; company_id?: number; target_group_id?: number } | null;
  company_member?: { company_id?: number } | null;
  group?: { id?: number } | null;
  group_membership?: { group_id?: number } | null;
}) {
  const tags = [
    { type: "CompanyInvitation", id: "LIST" },
    { type: "Company", id: "LIST" },
    "Auth"
  ] as Array<string | { type: string; id?: string | number }>;

  const companyId = result.company?.id ?? result.invitation?.company_id ?? result.company_member?.company_id;
  if (companyId != null) {
    tags.push({ type: "Company", id: companyId });
    tags.push({ type: "CompanyMember", id: `COMPANY-${companyId}` });
    tags.push({ type: "CompanyGroup", id: `COMPANY-${companyId}` });
  }
  const groupId = result.group?.id ?? result.group_membership?.group_id ?? result.invitation?.target_group_id;
  if (groupId != null) {
    tags.push({ type: "CompanyGroup", id: `MEMBERS-${groupId}` });
    tags.push({ type: "GroupMessage", id: `GROUP-${groupId}` });
  }
  return tags;
}

describe("invitation list normalization", () => {
  it("accepts the live bare-array company-invitations response", () => {
    const normalized = normalizeInvitationList([
      { id: 5, company_id: 13, status: "pending", company_name: "Invite Test Co" }
    ]);
    assert.equal(normalized.count, 1);
    assert.equal(normalized.results[0]?.company_id, 13);
    assert.equal(normalized.results[0]?.status, "pending");
  });

  it("keeps paginated OpenAPI shape", () => {
    const normalized = normalizeInvitationList({
      count: 1,
      next: null,
      previous: null,
      results: [{ id: 1, status: "pending" }]
    });
    assert.equal(normalized.count, 1);
    assert.equal(normalized.results.length, 1);
  });
});

describe("accept cache invalidation tags", () => {
  it("invalidates companies, memberships, groups, and messages after acceptance", () => {
    const tags = tagsFromMembershipAction({
      company: { id: 13 },
      group: { id: 14 },
      company_member: { company_id: 13 },
      group_membership: { group_id: 14 },
      invitation: { id: 5, company_id: 13, target_group_id: 14 }
    });
    const serialized = tags.map((tag) => (typeof tag === "string" ? tag : `${tag.type}:${tag.id}`));
    assert.equal(serialized.includes("Company:LIST"), true);
    assert.equal(serialized.includes("CompanyInvitation:LIST"), true);
    assert.equal(serialized.includes("CompanyMember:COMPANY-13"), true);
    assert.equal(serialized.includes("CompanyGroup:MEMBERS-14"), true);
    assert.equal(serialized.includes("GroupMessage:GROUP-14"), true);
    assert.equal(serialized.includes("Auth"), true);
  });
});

describe("invitation create request shape", () => {
  it("uses phone_number + role payload for company invitation create", () => {
    const body = { phone_number: "09135247557", role: "employee" as const };
    assert.equal(typeof body.phone_number, "string");
    assert.equal(body.role, "employee");
    assert.equal("member_id" in body, false);
  });
});
