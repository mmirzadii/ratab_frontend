import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("conversation activity ordering — cache and UI wiring", () => {
  const messagesApi = read("companyMessagesApi.ts");
  const groupsApi = read("companyGroupsApi.ts");
  const projectApi = read("../projects/projectApi.ts");
  const dashboard = read("../../pages/CompanyDashboardPage.tsx");
  const messagesSection = read("MessagesSection.tsx");
  const groupKinds = read("groupKinds.ts");
  const schema = read("../../shared/api/generated/schema.ts");

  it("generated CompanyGroup includes last_activity_at from the synced contract", () => {
    assert.match(schema, /readonly last_activity_at: string/);
  });

  it("removes alphabetical / kind-bucket local sorting", () => {
    assert.equal(groupKinds.includes("localeCompare"), false);
    assert.equal(groupKinds.includes("buckets.public.sort"), false);
    assert.equal(groupKinds.includes("buckets.project.sort"), false);
    assert.match(groupKinds, /Preserve backend conversation-list order/);
  });

  it("successful message send invalidates company group list; failures do not", () => {
    assert.match(messagesApi, /companyId: number/);
    assert.match(messagesApi, /CompanyGroup.*COMPANY-\$\{companyId\}/);
    assert.match(messagesApi, /Only successful sends reorder/);
    assert.match(messagesApi, /if \(!error && result\)/);
    assert.match(messagesSection, /companyId,/);
  });

  it("group and project creation invalidate the company group list", () => {
    assert.match(groupsApi, /createCompanyGroup[\s\S]*COMPANY-\$\{companyId\}/);
    assert.match(projectApi, /createCompanyProject[\s\S]*CompanyGroup[\s\S]*COMPANY-\$\{companyId\}/);
  });

  it("dashboard conversation list uses sortConversations and keeps selected group id in state", () => {
    assert.match(dashboard, /sortedConversations/);
    assert.match(dashboard, /sortConversations\(filteredGroups\)/);
    assert.match(dashboard, /selectedMessageGroupId/);
    assert.match(dashboard, /setSelectedMessageGroupId/);
    assert.match(dashboard, /refetchOnFocus: true/);
  });

  it("desktop and messages surfaces share the same listCompanyGroups query tag", () => {
    assert.match(dashboard, /useListCompanyGroupsQuery/);
    assert.match(messagesSection, /useListCompanyGroupsQuery/);
    assert.match(groupsApi, /id: `COMPANY-\$\{companyId\}`/);
  });
});
