import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  INCLUDE_ALL_COMPANY_MEMBERS_IN_GROUP_FIELD,
  buildProjectCreateBody,
  classifyCompanyGroup,
  extractHttpLinksFromText,
  findLinkedProject,
  groupKindLabel,
  resolveGroupDisplayName,
  sortConversations
} from "./groupKinds.ts";

const here = dirname(fileURLToPath(import.meta.url));

describe("project create checkbox payload", () => {
  it("defaults the include-all flag to true when checked", () => {
    const body = buildProjectCreateBody({
      name: "برج آفتاب",
      includeAllCompanyMembersInGroup: true
    });
    assert.equal(body.include_all_company_members_in_group, true);
    assert.equal(INCLUDE_ALL_COMPANY_MEMBERS_IN_GROUP_FIELD in body, true);
  });

  it("sends false when the checkbox is unchecked", () => {
    const body = buildProjectCreateBody({
      name: "خصوصی",
      includeAllCompanyMembersInGroup: false
    });
    assert.equal(body.include_all_company_members_in_group, false);
  });
});

describe("group classification", () => {
  it("marks is_default groups as the company public group", () => {
    assert.equal(classifyCompanyGroup({ id: 1, is_default: true }), "public");
    assert.equal(groupKindLabel("public"), "عمومی شرکت");
  });

  it("marks groups linked by project.group_id as project groups", () => {
    const kind = classifyCompanyGroup({ id: 33, is_default: false }, [
      { group_id: 33, name: "All5263473" }
    ]);
    assert.equal(kind, "project");
    assert.equal(
      resolveGroupDisplayName({ id: 33, name: "All5263473", is_default: false }, [
        { group_id: 33, name: "All5263473" }
      ]),
      "All5263473"
    );
  });

  it("treats other groups as custom", () => {
    assert.equal(classifyCompanyGroup({ id: 9, is_default: false }, []), "custom");
  });
});

describe("conversation list ordering", () => {
  it("pins the public group first and preserves backend activity order for the rest", () => {
    const projects = [{ group_id: 20, name: "پروژه الف" }];
    // Backend returns public first, then activity order (not alphabetical).
    const ordered = sortConversations(
      [
        {
          id: 10,
          is_default: true,
          group_type: "public",
          pin_priority: 0,
          name: "عمومی",
          last_activity_at: "2026-07-01T00:00:00Z"
        },
        {
          id: 30,
          is_default: false,
          group_type: "custom",
          pin_priority: 1,
          name: "سفارشی ب",
          last_activity_at: "2026-07-29T12:00:00Z"
        },
        {
          id: 20,
          is_default: false,
          group_type: "project",
          pin_priority: 1,
          name: "گروه پروژه",
          last_activity_at: "2026-07-28T12:00:00Z"
        },
        {
          id: 31,
          is_default: false,
          group_type: "custom",
          pin_priority: 1,
          name: "آآآ اول الفبا",
          last_activity_at: "2026-07-27T12:00:00Z"
        }
      ]
    );
    assert.deepEqual(
      ordered.map((g) => g.id),
      [10, 30, 20, 31]
    );
    assert.equal(classifyCompanyGroup(ordered[0], projects), "public");
    // Must not alphabetize (آآآ would otherwise rise above سفارشی ب).
    assert.notEqual(ordered[1]?.id, 31);
  });

  it("does not alphabetize when public is already first", () => {
    const ordered = sortConversations([
      { id: 1, is_default: true, group_type: "public", pin_priority: 0, name: "عمومی" },
      { id: 3, is_default: false, group_type: "custom", pin_priority: 1, name: "ب" },
      { id: 2, is_default: false, group_type: "custom", pin_priority: 1, name: "آ" }
    ]);
    assert.deepEqual(
      ordered.map((g) => g.id),
      [1, 3, 2]
    );
  });

  it("moves a misplaced public group to the front without reordering others", () => {
    const ordered = sortConversations([
      { id: 3, is_default: false, group_type: "custom", pin_priority: 1, name: "ب" },
      { id: 1, is_default: true, group_type: "public", pin_priority: 0, name: "عمومی" },
      { id: 2, is_default: false, group_type: "custom", pin_priority: 1, name: "آ" }
    ]);
    assert.deepEqual(
      ordered.map((g) => g.id),
      [1, 3, 2]
    );
  });

  it("finds the linked project from group_id, not from the title", () => {
    const project = findLinkedProject({ id: 44 }, [
      { group_id: 99, name: "عمومی" },
      { group_id: 44, name: "نام متفاوت" }
    ]);
    assert.equal(project?.group_id, 44);
    assert.equal(project?.name, "نام متفاوت");
  });
});

describe("shared link extraction", () => {
  it("extracts http(s) links and strips trailing punctuation", () => {
    const links = extractHttpLinksFromText(
      "ببین https://example.com/path. و http://foo.ir/x؟ هم هست."
    );
    assert.ok(links.some((item) => item.startsWith("https://example.com/path")));
    assert.ok(links.some((item) => item.startsWith("http://foo.ir/")));
  });
});

describe("no project attachment create action", () => {
  it("keeps compose attachment types limited to file and financial_document", () => {
    const allowed = new Set(["file", "financial_document"]);
    assert.equal(allowed.has("project"), false);
  });
});

describe("conversation-first navigation and composer contracts", () => {
  it("omits Projects and Groups from the primary workspace rail", () => {
    const rail = readFileSync(join(here, "workspace/CompanyWorkspaceRail.tsx"), "utf8");
    assert.match(rail, /id: "messages"/);
    assert.match(rail, /id: "members"/);
    assert.match(rail, /id: "company"/);
    assert.equal(rail.includes('id: "costReports"'), false);
    assert.equal(rail.includes('id: "groups"'), false);
    assert.match(rail, /PRIMARY_WORKSPACE_SECTION_IDS/);
  });

  it("exposes a clear create menu for project and group", () => {
    const menu = readFileSync(join(here, "workspace/ConversationCreateMenu.tsx"), "utf8");
    assert.match(menu, /پروژه جدید/);
    assert.match(menu, /ساخت گروه/);
    assert.doesNotMatch(menu, /گروه جدید/);
    assert.match(menu, /data-tour="create-project-action"/);
    assert.match(menu, /data-tour="create-group-action"/);
  });

  it("keeps a single افزودن composer action with file and financial-document menu", () => {
    const messages = readFileSync(join(here, "MessagesSection.tsx"), "utf8");
    const modal = readFileSync(join(here, "AttachFinancialDocumentModal.tsx"), "utf8");
    assert.match(messages, /data-tour="composer-add-action"/);
    assert.match(messages, /data-tour="composer-add-menu"/);
    assert.match(messages, /data-tour="composer-add-file"/);
    assert.match(messages, /data-tour="composer-add-financial-document"/);
    assert.match(messages, /aria-label="افزودن"/);
    assert.match(messages, /composer-add-file[\s\S]*?فایل/);
    assert.match(messages, /composer-add-financial-document[\s\S]*?صورت‌بها/);
    assert.equal(messages.includes('data-tour="financial-document-action"'), false);
    assert.equal(messages.includes("پیوست صورت‌بها"), false);
    assert.equal(messages.includes("افزودن صورت‌بها از"), false);
    assert.equal(messages.includes("attachment_type: \"project\""), false);
    assert.equal((messages.match(/data-tour="composer-add-action"/g) ?? []).length, 1);
    assert.match(messages, /data-tour="empty-chat-add-financial-document"/);
    assert.match(messages, /افزودن صورت‌بها/);
    assert.match(messages, /openFinancialDocumentFlow/);
    assert.match(messages, /openFinancialDocumentRequestId/);
    assert.equal(modal.includes("انتخاب صورت‌بهای موجود"), false);
    assert.equal(modal.includes("ساخت صورت‌بهای جدید"), false);
    assert.equal(modal.includes("pick-existing-document"), false);
    assert.equal(modal.includes("create-new-document"), false);
    assert.match(modal, /صورت‌بهاها/);
    assert.match(modal, /data-tour="add-financial-document-action"/);
    assert.match(modal, /data-tour="financial-document-list"/);
    assert.match(modal, /overflow-y-auto/);
    assert.match(modal, /انتخاب/);
    assert.match(modal, /هنوز صورت‌بهایی برای این پروژه ساخته نشده است/);
    assert.match(modal, /empty-list-add-financial-document/);
    assert.match(modal, /lockedProject/);
    assert.match(modal, /returnToGroupId/);
    assert.match(modal, /lockProject/);
    assert.match(modal, /CreateProjectSheet/);
    assert.match(modal, /financial-document-project-select/);
    assert.match(modal, /projectLocked/);
    assert.equal(modal.includes("projects[0]"), false);
  });

  it("uses one financial-document flow for empty chat, composer, and drawer", () => {
    const messages = readFileSync(join(here, "MessagesSection.tsx"), "utf8");
    const drawer = readFileSync(join(here, "GroupInfoDrawer.tsx"), "utf8");
    const dashboard = readFileSync(join(here, "../../pages/CompanyDashboardPage.tsx"), "utf8");
    assert.match(messages, /function openFinancialDocumentFlow/);
    assert.match(messages, /empty-chat-add-financial-document[\s\S]*?openFinancialDocumentFlow/);
    assert.match(messages, /composer-add-financial-document[\s\S]*?openFinancialDocumentFlow/);
    assert.match(messages, /openFinancialDocumentRequestId/);
    assert.match(messages, /FinancialDocumentActionModal/);
    assert.equal((messages.match(/<FinancialDocumentActionModal/g) ?? []).length, 1);
    assert.match(drawer, /data-tour="drawer-add-financial-document"/);
    assert.match(drawer, /افزودن صورت‌بها/);
    assert.equal(drawer.includes("صورت‌بهاهای پروژه"), false);
    assert.equal(dashboard.includes("صورت‌بهاهای پروژه"), false);
    assert.match(dashboard, /onAddFinancialDocument/);
    assert.match(dashboard, /openFinancialDocumentRequestId/);
  });

  it("auto-selects a newly created project inside the financial-document flow", () => {
    const modal = readFileSync(join(here, "AttachFinancialDocumentModal.tsx"), "utf8");
    const sheet = readFileSync(
      join(here, "../projects/CreateProjectSheet.tsx"),
      "utf8"
    );
    assert.match(modal, /handleProjectCreated/);
    assert.match(modal, /continueWithProject\(project, docIntent\)/);
    assert.match(sheet, /همه اعضای شرکت عضو گروه این پروژه شوند/);
    assert.match(sheet, /includeAllCompanyMembersInGroup/);
    assert.match(sheet, /useState\(true\)/);
  });

  it("opens the group info drawer with four resource tabs including members", () => {
    const drawer = readFileSync(join(here, "GroupInfoDrawer.tsx"), "utf8");
    assert.match(drawer, /صورت‌بهاها/);
    assert.match(drawer, /فایل‌ها/);
    assert.match(drawer, /لینک‌ها/);
    assert.match(drawer, /اعضا/);
    assert.match(drawer, /DRAWER_TABS/);
    assert.match(drawer, /group-info-members-tab/);
    assert.match(drawer, /useListCompanyGroupMembersQuery/);
    assert.match(drawer, /noopener noreferrer/);
    assert.match(drawer, /message-attachments/);
    assert.match(drawer, /setMessages\(\[\]\)/);
    assert.match(drawer, /cancelled = true/);
    assert.match(drawer, /باز کردن/);
    assert.equal(drawer.includes("صورت‌بهاهای پروژه"), false);
    assert.equal(drawer.includes("مدیریت صورت‌بهاها"), false);
    assert.equal(drawer.includes("پیوست صورت‌بها"), false);
  });
});

describe("mobile financial-document sheet and add-document behavior", () => {
  const modal = readFileSync(join(here, "AttachFinancialDocumentModal.tsx"), "utf8");

  it("renders via portal to escape parent overflow/transform", () => {
    assert.match(modal, /createPortal/);
    assert.match(modal, /document\.body/);
  });

  it("uses full-screen sheet on mobile with fixed inset-0", () => {
    assert.match(modal, /fixed inset-0/);
    assert.match(modal, /h-dvh w-full/);
    assert.match(modal, /md:max-w-lg/);
    assert.match(modal, /md:h-auto/);
  });

  it("is not positioned at bottom-left with arbitrary offsets", () => {
    assert.equal(modal.includes("bottom-0 left-0"), false);
    assert.equal(modal.includes("items-end justify-start"), false);
  });

  it("locks background scroll while open", () => {
    assert.match(modal, /document\.body\.style\.overflow\s*=\s*"hidden"/);
  });

  it("header actions remain visible with scrollable body", () => {
    assert.match(modal, /shrink-0.*border-b/);
    assert.match(modal, /min-h-0 flex-1 overflow-y-auto/);
  });

  it("z-index is high enough to overlay everything", () => {
    assert.match(modal, /z-\[60\]/);
  });

  it("add-document shows validation when no project selected on select-project step", () => {
    assert.match(modal, /ابتدا یک پروژه انتخاب کنید\./);
    assert.match(modal, /validationHint/);
  });

  it("add-document opens create-project when no projects exist", () => {
    assert.match(modal, /projects\.length === 0/);
    assert.match(modal, /setStep\("create-project"\)/);
  });

  it("empty project state has create-project action button", () => {
    assert.match(modal, /ایجاد پروژه جدید/);
    assert.match(modal, /پروژه‌ای وجود ندارد/);
  });

  it("linked project group opens creation immediately", () => {
    assert.match(modal, /selectedProject && \(projectLocked \|\| step === "browse-documents"\)/);
    assert.match(modal, /openCreateWizard\(selectedProject\)/);
  });

  it("clears validation hint when project is selected", () => {
    assert.match(modal, /setValidationHint\(null\)/);
  });

  it("preserves message draft via onSelect callback", () => {
    assert.match(modal, /onSelect\(/);
    assert.match(modal, /resourceId/);
    assert.match(modal, /onClose\(\)/);
  });

  it("existing documents appear after selecting a project", () => {
    assert.match(modal, /continueWithProject/);
    assert.match(modal, /setStep\("browse-documents"\)/);
    assert.match(modal, /fetchDocuments/);
  });
});
