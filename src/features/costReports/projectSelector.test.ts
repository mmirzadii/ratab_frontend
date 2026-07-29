import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

describe("wizard project selection add-project action", () => {
  it("exposes compact افزودن پروژه in ProjectSelectorSection via shared CreateProjectSheet", () => {
    const section = readFileSync(join(here, "components/ProjectSelectorSection.tsx"), "utf8");
    const wizard = readFileSync(join(here, "../../pages/CostReportWizardPage.tsx"), "utf8");
    const sheet = readFileSync(join(here, "../projects/CreateProjectSheet.tsx"), "utf8");

    assert.match(section, /انتخاب پروژه/);
    assert.match(section, /data-tour="wizard-add-project-action"/);
    assert.match(section, /افزودن پروژه/);
    assert.match(section, /data-tour="wizard-add-project-empty-action"/);
    assert.match(section, /CreateProjectSheet/);
    assert.match(section, /handleCreated/);
    assert.match(section, /onSelect\(project\)/);
    assert.match(section, /!isLocked/);
    assert.match(section, /isCreateOpen && !isLocked/);
    assert.equal(section.includes("از داشبورد شرکت یک پروژه بسازید"), false);

    assert.match(sheet, /همه اعضای شرکت عضو گروه این پروژه شوند/);
    assert.match(sheet, /useCreateCompanyProjectMutation/);

    assert.match(wizard, /ProjectSelectorSection/);
    assert.match(wizard, /lockProject/);
    assert.match(wizard, /existingProject: project/);
    assert.match(wizard, /isLocked=\{Boolean\(builderState\?\.lockProject\)\}/);
  });

  it("does not duplicate project-creation forms in the wizard page", () => {
    const wizard = readFileSync(join(here, "../../pages/CostReportWizardPage.tsx"), "utf8");
    assert.equal(wizard.includes("CreateProjectSheet"), false);
    assert.equal(wizard.includes("useCreateCompanyProjectMutation"), false);
    assert.equal(wizard.includes("include_all_company_members_in_group"), false);
  });
});
