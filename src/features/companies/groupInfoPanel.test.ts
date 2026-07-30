import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const here = import.meta.dirname!;

describe("Telegram-inspired group info panel", () => {
  const drawer = readFileSync(join(here, "GroupInfoDrawer.tsx"), "utf8");
  const dashboard = readFileSync(join(here, "../../pages/CompanyDashboardPage.tsx"), "utf8");

  it("overview is profile-oriented without editable form fields or notification UI", () => {
    assert.match(drawer, /اطلاعات گروه/);
    assert.match(drawer, /AvatarCircle name=\{title\} size="lg"/);
    assert.match(drawer, /memberCountLabel/);
    assert.match(drawer, /infoKindLabel/);
    assert.match(drawer, /group-info-edit-action/);
    assert.doesNotMatch(drawer, /\bnotification\b|اعلان|\bMute\b|بی‌صدا/i);
    assert.doesNotMatch(drawer, /managementSlot/);
    assert.doesNotMatch(drawer, /انتخاب عضو شرکت/);
    assert.ok(!drawer.includes(">ذخیره گروه<"));
    assert.ok(drawer.includes('type: "edit"'));
  });

  it("uses one discriminated panel view instead of stacked modals", () => {
    assert.match(drawer, /type PanelView/);
    assert.match(drawer, /type: "overview"/);
    assert.match(drawer, /type: "edit"/);
    assert.match(drawer, /type: "addMembers"/);
    assert.match(drawer, /type: "memberDetails"/);
    assert.doesNotMatch(drawer, /isEditModalOpen/);
    assert.doesNotMatch(drawer, /isAddModalOpen/);
    assert.doesNotMatch(drawer, /bg-ui-surface\/55 backdrop-blur/);
    assert.doesNotMatch(drawer, /managementSlot/);
  });

  it("edit stays in the same panel and respects custom-group permission", () => {
    assert.match(drawer, /ویرایش گروه/);
    assert.match(drawer, /canEditMeta/);
    assert.match(drawer, /kind === "custom"/);
    assert.match(drawer, /useUpdateCompanyGroupMutation/);
    assert.match(drawer, /setView\(\{ type: "overview" \}\)/);
    assert.match(drawer, /اقدامات حساس/);
    assert.match(drawer, /غیرفعال‌سازی گروه/);
  });

  it("add-members is an internal view with search, chips, and invitation meaning", () => {
    assert.match(drawer, /افزودن اعضا/);
    assert.match(drawer, /group-info-add-member/);
    assert.match(drawer, /جستجوی اعضا/);
    assert.match(drawer, /برای اعضای انتخاب‌شده دعوت عضویت در گروه ارسال می‌شود\./);
    assert.match(drawer, /ارسال دعوت/);
    assert.match(drawer, /activeOnly:\s*true/);
    assert.match(drawer, /!activeMemberIds\.has/);
    assert.match(drawer, /pendingInviteeUserIds/);
    assert.match(drawer, /useAddCompanyGroupMemberMutation/);
  });

  it("resource tabs start with members and keep documents/files/links", () => {
    assert.match(
      drawer,
      /DRAWER_TABS[\s\S]*members[\s\S]*documents[\s\S]*files[\s\S]*links/
    );
    assert.match(drawer, /useState<ResourceTab>\("members"\)/);
    assert.match(drawer, /drawer-add-financial-document/);
    assert.match(drawer, /noopener noreferrer/);
  });

  it("desktop panel width is bounded and mobile uses full-screen shell", () => {
    assert.match(drawer, /w-\[24rem\].*max-w-\[27\.5rem\]|max-w-\[27\.5rem\].*w-\[24rem\]/);
    assert.match(drawer, /xl:w-\[26rem\]/);
    assert.match(drawer, /fixed inset-0/);
    assert.match(drawer, /h-dvh w-full/);
    assert.doesNotMatch(dashboard, /GroupsSection/);
    assert.doesNotMatch(dashboard, /managementSlot/);
  });

  it("member management uses overflow/details instead of permanent row buttons", () => {
    assert.match(drawer, /MoreVertical/);
    assert.match(drawer, /memberDetails/);
    assert.doesNotMatch(drawer, /onClick=\{\(\) => void handleDeactivateMembership\(membership\.id\)\}/);
  });
});
