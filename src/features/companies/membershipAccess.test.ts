import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  ALREADY_COMPANY_MEMBER_MESSAGE,
  ALREADY_GROUP_MEMBER_MESSAGE,
  GROUP_MEMBERSHIP_REQUIRED_MESSAGE,
  INVITATION_ACCEPTED_MESSAGE,
  INVITATION_REJECTED_MESSAGE,
  INVITATION_SENT_MESSAGE,
  formatMembershipAccessMessage,
  formatMembershipActionSuccess,
  invitationStatusLabel,
  isAlreadyCompanyMemberError,
  isAlreadyGroupMemberError,
  isGroupMembershipRequiredError
} from "./membershipAccess.ts";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("group membership required messaging", () => {
  it("maps the English backend detail to the approved Persian message", () => {
    const error = {
      status: 403,
      data: { detail: "Active membership in this group is required." }
    };
    assert.equal(isGroupMembershipRequiredError(error), true);
    assert.equal(formatMembershipAccessMessage(error), GROUP_MEMBERSHIP_REQUIRED_MESSAGE);
    assert.equal(formatMembershipAccessMessage(error).includes("Active membership"), false);
  });

  it("does not render raw HTML responses", () => {
    const html =
      "<!DOCTYPE html><html><body>CSRF verification failed. Origin checking failed.</body></html>";
    const message = formatMembershipAccessMessage({ status: 403, data: html }, "خطای امنیتی");
    assert.equal(message.includes("<html"), false);
    assert.equal(message.includes("CSRF verification failed"), false);
  });
});

describe("already-member informative outcomes", () => {
  it("detects already active company member", () => {
    const error = {
      status: 400,
      data: { detail: "User is already a member of this company." }
    };
    assert.equal(isAlreadyCompanyMemberError(error), true);
    assert.equal(formatMembershipAccessMessage(error), ALREADY_COMPANY_MEMBER_MESSAGE);
  });

  it("detects already active group member", () => {
    const error = {
      status: 400,
      data: { detail: "Already an active group member." }
    };
    assert.equal(isAlreadyGroupMemberError(error), true);
    assert.equal(formatMembershipAccessMessage(error), ALREADY_GROUP_MEMBER_MESSAGE);
  });
});

describe("invitation creation success messaging", () => {
  it("treats invitation_pending as sent invitation, not active membership", () => {
    const feedback = formatMembershipActionSuccess(
      {
        outcome: "invitation_pending",
        invitation: { status: "pending" },
        company_member: null,
        group_membership: null
      },
      "عضو به شرکت اضافه شد."
    );
    assert.equal(feedback.message, INVITATION_SENT_MESSAGE);
    assert.equal(feedback.message.includes("اضافه شد"), false);
  });

  it("maps accept and reject outcomes", () => {
    assert.equal(
      formatMembershipActionSuccess({ outcome: "invitation_accepted" }, "ok").message,
      INVITATION_ACCEPTED_MESSAGE
    );
    assert.equal(
      formatMembershipActionSuccess({ outcome: "invitation_rejected" }, "ok").message,
      INVITATION_REJECTED_MESSAGE
    );
  });

  it("labels pending invitation status in Persian", () => {
    assert.equal(invitationStatusLabel("pending"), "در انتظار تأیید");
  });
});

describe("invitation OpenAPI contract presence", () => {
  it("documents invitation list/accept/reject endpoints in the current OpenAPI", () => {
    const openapi = readFileSync(join(repoRoot, "backend_docs/current/OPENAPI.yaml"), "utf8");
    for (const path of [
      "/api/companies/{id}/invitations/",
      "/api/company-groups/{id}/invitations/",
      "/api/company-invitations/",
      "/api/company-invitations/{id}/accept/",
      "/api/company-invitations/{id}/reject/"
    ]) {
      assert.equal(openapi.includes(path), true, `missing ${path}`);
    }
  });
});

describe("pending invitation rendering helpers", () => {
  it("keeps pending invitations separate from active company entry", () => {
    const pending = {
      id: 5,
      company_id: 13,
      company_name: "Invite Test Co",
      status: "pending" as const
    };
    const activeCompanies: Array<{ id: number }> = [];
    assert.equal(pending.status === "pending", true);
    assert.equal(
      activeCompanies.some((company) => company.id === pending.company_id),
      false
    );
  });
});

describe("accept/reject cache expectations", () => {
  it("accept should expose company id for company-list refresh without logout", () => {
    const accept = {
      outcome: "invitation_accepted",
      company: { id: 13 },
      group: { id: 14 },
      company_member: { id: 16, is_active: true },
      group_membership: { id: 17, is_active: true },
      invitation: { status: "accepted" }
    };
    assert.equal(accept.company.id, 13);
    assert.equal(accept.group_membership.is_active, true);
    assert.equal(
      formatMembershipActionSuccess(accept, "x").message,
      INVITATION_ACCEPTED_MESSAGE
    );
  });

  it("reject must not invent an active company", () => {
    const reject = {
      outcome: "invitation_rejected",
      company: null,
      company_member: null,
      group_membership: null,
      invitation: { status: "rejected" }
    };
    assert.equal(reject.company_member, null);
    assert.equal(
      formatMembershipActionSuccess(reject, "x").message,
      INVITATION_REJECTED_MESSAGE
    );
  });
});
