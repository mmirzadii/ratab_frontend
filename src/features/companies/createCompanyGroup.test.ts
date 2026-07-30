import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const here = import.meta.dirname!;

describe("custom group creation route panel", () => {
  const panel = readFileSync(join(here, "CreateCompanyGroupPanel.tsx"), "utf8");
  const dashboard = readFileSync(join(here, "../../pages/CompanyDashboardPage.tsx"), "utf8");
  const router = readFileSync(join(here, "../../app/router.tsx"), "utf8");
  const menu = readFileSync(join(here, "workspace/ConversationCreateMenu.tsx"), "utf8");
  const groupsApi = readFileSync(join(here, "companyGroupsApi.ts"), "utf8");
  const membersApi = readFileSync(join(here, "companyMembersApi.ts"), "utf8");

  it("registers company-scoped groups/new route with nested panel", () => {
    assert.match(router, /path:\s*"companies\/:companyId"/);
    assert.match(router, /path:\s*"groups\/new"/);
    assert.match(router, /CreateCompanyGroupPanel/);
    assert.match(dashboard, /useMatch\("\/companies\/:companyId\/groups\/new"\)/);
    assert.match(dashboard, /create-group-route-panel/);
    assert.match(dashboard, /<Outlet\s*\/>/);
  });

  it("Add menu navigates to ساخت گروه route instead of opening a modal", () => {
    assert.match(menu, /ساخت گروه/);
    assert.match(dashboard, /navigate\(`\/companies\/\$\{companyId\}\/groups\/new`\)/);
    assert.doesNotMatch(dashboard, /isCreateGroupOpen/);
    assert.doesNotMatch(dashboard, /bg-ui-surface\/70/);
  });

  it("desktop uses bounded side panel classes and mobile uses full width", () => {
    assert.match(dashboard, /md:w-\[26rem\]/);
    assert.match(dashboard, /md:max-w-\[30rem\]/);
    assert.match(dashboard, /w-full/);
    assert.match(dashboard, /!isCreateGroupRoute/);
    assert.doesNotMatch(panel, /fixed inset-0 z-40/);
    assert.doesNotMatch(panel, /backdrop/);
  });

  it("uses a two-step local draft before one createCompanyGroup submission", () => {
    assert.match(panel, /مرحله ۱ از ۲/);
    assert.match(panel, /مرحله ۲ از ۲/);
    assert.match(panel, /نام گروه/);
    assert.match(panel, /توضیحات \(اختیاری\)/);
    assert.match(panel, /افزودن اعضا/);
    assert.match(panel, /setStep\(2\)/);
    assert.match(panel, /createGroup\(/);
    assert.match(panel, /member_ids/);
    assert.match(panel, /برای اعضای انتخاب‌شده دعوت عضویت در گروه ارسال می‌شود\./);
    assert.match(panel, /گروه ساخته شد و دعوت‌ها ارسال شدند\./);
  });

  it("loads active company members with search and excludes the creator from invites", () => {
    assert.match(panel, /activeOnly:\s*true/);
    assert.match(panel, /جستجوی اعضا/);
    assert.match(panel, /SEARCH_DEBOUNCE_MS/);
    assert.match(panel, /member\.id !== creatorMemberId/);
    assert.match(panel, /سازنده به‌صورت خودکار عضو فعال گروه می‌شود/);
    assert.match(membersApi, /active_only/);
    assert.match(membersApi, /params\.set\("q"/);
  });

  it("keeps selection across steps and allows zero additional members", () => {
    assert.match(panel, /selectedMemberIds/);
    assert.match(panel, /setStep\(1\)/);
    assert.match(panel, /uniqueMemberIds\.length > 0 \? \{ member_ids: uniqueMemberIds \}/);
    assert.match(panel, /هیچ عضو دیگری انتخاب نشده/);
  });

  it("create mutation returns CompanyGroupCreateResult and invalidates groups + invitations", () => {
    assert.match(groupsApi, /CompanyGroupCreateRequest/);
    assert.match(groupsApi, /CompanyGroupCreateResult/);
    assert.match(groupsApi, /CompanyInvitation.*LIST|type: "CompanyInvitation", id: "LIST"/);
    assert.match(panel, /focusGroupId: result\.group\.id/);
    assert.match(panel, /pending_invitation_count/);
  });

  it("preserves draft on invalid member_ids and does not clear name/description", () => {
    assert.match(panel, /parseInvalidMemberIds/);
    assert.match(panel, /یکی از اعضای انتخاب‌شده دیگر عضو فعال شرکت نیست\./);
    assert.match(panel, /setInvalidMemberIds/);
    assert.match(panel, /setStep\(2\)/);
    assert.doesNotMatch(panel, /setGroupName\(""\)/);
  });

  it("removes obsolete GroupsSection create modal", () => {
    assert.equal(existsSync(join(here, "GroupsSection.tsx")), false);
  });
});
