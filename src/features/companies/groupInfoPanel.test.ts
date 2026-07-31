import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  canManageGroup,
  resolveGroupInfoCapabilities
} from "./companyPermissions.ts";

const here = import.meta.dirname!;

describe("Telegram-inspired group info panel", () => {
  const drawer = readFileSync(join(here, "GroupInfoDrawer.tsx"), "utf8");
  const dashboard = readFileSync(join(here, "../../pages/CompanyDashboardPage.tsx"), "utf8");
  const permissions = readFileSync(join(here, "companyPermissions.ts"), "utf8");

  it("route-rendered component is GroupInfoDrawer from CompanyDashboardPage", () => {
    assert.match(dashboard, /import \{ GroupInfoDrawer \} from "\.\.\/features\/companies\/GroupInfoDrawer"/);
    assert.match(dashboard, /<GroupInfoDrawer/);
    assert.doesNotMatch(dashboard, /GroupsSection/);
    assert.doesNotMatch(dashboard, /managementSlot/);
  });

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
    const overviewStart = drawer.indexOf('data-tour="group-info-drawer"');
    assert.ok(overviewStart > 0);
    const overviewSlice = drawer.slice(overviewStart);
    assert.doesNotMatch(overviewSlice.slice(0, 2500), /maxLength=\{NAME_MAX_LENGTH\}/);
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

  it("edit stays in the same panel and supports project + custom via capabilities", () => {
    assert.match(drawer, /ویرایش گروه/);
    assert.match(drawer, /resolveGroupInfoCapabilities/);
    assert.match(drawer, /canEditMeta/);
    assert.match(drawer, /editViaProjectApi/);
    assert.match(drawer, /useUpdateCompanyProjectMutation/);
    assert.match(drawer, /useUpdateCompanyGroupMutation/);
    assert.match(drawer, /setView\(\{ type: "overview" \}\)/);
    assert.match(drawer, /اقدامات حساس/);
    assert.match(drawer, /غیرفعال‌سازی گروه/);
    assert.match(drawer, /canDeactivateGroup/);
    assert.match(drawer, /group-info-edit-save/);
    assert.doesNotMatch(drawer, /گروه به‌روز شد/);
    // Must not gate the pencil solely on custom kind / manage-all-custom.
    assert.doesNotMatch(drawer, /canEditMeta\s*=\s*canManage\s*&&\s*kind\s*===\s*"custom"/);
    assert.doesNotMatch(drawer, /canInviteMembers\s*=\s*canManage\s*&&\s*kind\s*===\s*"custom"/);
    assert.match(permissions, /resolveGroupInfoCapabilities/);
  });

  it("project edit does not expose type, project link, or detachment controls", () => {
    const editStart = drawer.indexOf('view.type === "edit" && canEditMeta');
    assert.ok(editStart > 0);
    const editSlice = drawer.slice(editStart, editStart + 2200);
    assert.match(editSlice, /نام گروه/);
    assert.match(editSlice, /توضیحات/);
    assert.doesNotMatch(editSlice, /نوع گروه|project_id|جدا کردن پروژه|تبدیل به عمومی|انتخاب پروژه/);
    assert.match(drawer, /پیوند پروژه تغییر نمی‌کند/);
  });

  it("add-members is an internal view with search, chips, and invitation meaning", () => {
    assert.match(drawer, /افزودن اعضا/);
    assert.match(drawer, /group-info-add-member/);
    assert.match(drawer, /canInviteMembers/);
    assert.match(drawer, /جستجوی اعضا/);
    assert.match(drawer, /برای اعضای انتخاب‌شده دعوت عضویت در گروه ارسال می‌شود\./);
    assert.match(drawer, /ارسال دعوت/);
    assert.match(drawer, /activeOnly:\s*true/);
    assert.match(drawer, /!activeMemberIds\.has/);
    assert.match(drawer, /isPendingInvite/);
    assert.match(drawer, /دعوت در انتظار/);
    assert.match(drawer, /useAddCompanyGroupMemberMutation/);
    assert.match(drawer, /disabled=\{isInviting \|\| selectedMemberIds\.length === 0\}/);
    assert.match(drawer, /SEARCH_DEBOUNCE_MS/);
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
  });

  it("member management uses overflow/details instead of permanent row buttons", () => {
    assert.match(drawer, /MoreVertical/);
    assert.match(drawer, /memberDetails/);
    assert.doesNotMatch(drawer, /onClick=\{\(\) => void handleDeactivateMembership\(membership\.id\)\}/);
  });

  it("gates edit and add-member actions with capability flags", () => {
    assert.match(drawer, /canEditMeta \? \(/);
    assert.match(drawer, /canInviteMembers \? \(/);
    assert.match(drawer, /effective_permissions/);
    assert.match(drawer, /can_update_projects/);
  });
});

describe("resolveGroupInfoCapabilities by group kind", () => {
  it("public group hides edit and invite", () => {
    const caps = resolveGroupInfoCapabilities({
      kind: "public",
      canManage: true,
      canUpdateProjects: true
    });
    assert.equal(caps.canEditGroup, false);
    assert.equal(caps.canInviteMembers, false);
    assert.equal(caps.canManageMembers, false);
    assert.equal(caps.canDeactivateGroup, false);
    assert.equal(caps.editViaProjectApi, false);
  });

  it("project group shows pencil when canUpdateProjects and invite when canManage", () => {
    const allowed = resolveGroupInfoCapabilities({
      kind: "project",
      canManage: true,
      canUpdateProjects: true
    });
    assert.equal(allowed.canEditGroup, true);
    assert.equal(allowed.canInviteMembers, true);
    assert.equal(allowed.canManageMembers, true);
    assert.equal(allowed.canDeactivateGroup, false);
    assert.equal(allowed.editViaProjectApi, true);

    const editOnly = resolveGroupInfoCapabilities({
      kind: "project",
      canManage: false,
      canUpdateProjects: true
    });
    assert.equal(editOnly.canEditGroup, true);
    assert.equal(editOnly.canInviteMembers, false);

    const inviteOnly = resolveGroupInfoCapabilities({
      kind: "project",
      canManage: true,
      canUpdateProjects: false
    });
    assert.equal(inviteOnly.canEditGroup, false);
    assert.equal(inviteOnly.canInviteMembers, true);
  });

  it("custom group shows edit and invite when canManage", () => {
    const caps = resolveGroupInfoCapabilities({
      kind: "custom",
      canManage: true,
      canUpdateProjects: false
    });
    assert.equal(caps.canEditGroup, true);
    assert.equal(caps.canInviteMembers, true);
    assert.equal(caps.canManageMembers, true);
    assert.equal(caps.canDeactivateGroup, true);
    assert.equal(caps.editViaProjectApi, false);

    const denied = resolveGroupInfoCapabilities({
      kind: "custom",
      canManage: false,
      canUpdateProjects: true
    });
    assert.equal(denied.canEditGroup, false);
    assert.equal(denied.canInviteMembers, false);
  });

  it("does not use can_manage_all_custom_groups as the sole pencil gate", () => {
    // Project owner path: manage=true via owner role, not manage-all-custom.
    const projectOwner = resolveGroupInfoCapabilities({
      kind: "project",
      canManage: true,
      canUpdateProjects: true
    });
    assert.equal(projectOwner.canEditGroup, true);
    assert.equal(projectOwner.canInviteMembers, true);
  });
});

describe("canManageGroup permission helpers", () => {
  const activeGroup = { created_by_member_id: 10, is_active: true };

  it("owner can always manage an active group", () => {
    assert.equal(canManageGroup("owner", 1, activeGroup, {}), true);
  });

  it("admin manages all custom groups only when backend flag is true", () => {
    assert.equal(
      canManageGroup("admin", 2, activeGroup, { can_manage_all_custom_groups: true }),
      true
    );
    assert.equal(
      canManageGroup("admin", 2, activeGroup, { can_manage_all_custom_groups: false }),
      false
    );
  });

  it("admin who created the group can manage without manage-all", () => {
    assert.equal(
      canManageGroup("admin", 10, activeGroup, { can_manage_all_custom_groups: false }),
      true
    );
  });

  it("employee can manage only groups they created", () => {
    assert.equal(canManageGroup("employee", 10, activeGroup, {}), true);
    assert.equal(canManageGroup("employee", 99, activeGroup, {}), false);
  });

  it("inactive groups are never manageable", () => {
    assert.equal(
      canManageGroup("owner", 1, { created_by_member_id: 10, is_active: false }, {}),
      false
    );
  });
});
