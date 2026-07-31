import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildForwardPreview,
  formatForwardError,
  FORWARD_ERROR_COPY
} from "./forwardMessageHelpers.ts";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

function attachment(partial: {
  id?: number;
  attachment_type: "file" | "financial_document";
  original_filename?: string | null;
  document_title?: string | null;
}) {
  return {
    id: partial.id ?? 1,
    message_id: 1,
    group_id: 1,
    attachment_type: partial.attachment_type,
    resource_id: 10,
    is_available: true,
    original_filename: partial.original_filename ?? null,
    content_type: "application/pdf",
    byte_size: 1200,
    document_title: partial.document_title ?? null,
    document_number: null,
    document_status: null,
    created_at: "2026-07-31T10:00:00Z"
  };
}

describe("forward preview", () => {
  it("shows actual message text when present", () => {
    const preview = buildForwardPreview({
      text: "سلام، فایل بررسی شد.",
      attachments: [attachment({ attachment_type: "file", original_filename: "x.pdf" })]
    });
    assert.equal(preview.primary, "سلام، فایل بررسی شد.");
    assert.equal(preview.extraAttachmentCount, undefined);
  });

  it("shows attachment filename for attachment-only messages", () => {
    const preview = buildForwardPreview({
      text: "",
      attachments: [
        attachment({
          attachment_type: "file",
          original_filename: "پاسخ تمرین دوم مهندسی نرم‌افزار.pdf"
        })
      ]
    });
    assert.equal(preview.primary, "پاسخ تمرین دوم مهندسی نرم‌افزار.pdf");
    assert.equal(preview.extraAttachmentCount, undefined);
  });

  it("shows financial-document title for document-only messages", () => {
    const preview = buildForwardPreview({
      text: "   ",
      attachments: [
        attachment({
          attachment_type: "financial_document",
          document_title: "صورت‌وضعیت پروژه ساختمان"
        })
      ]
    });
    assert.equal(preview.primary, "صورت‌وضعیت پروژه ساختمان");
  });

  it("never returns generic پیام با پیوست copy", () => {
    const preview = buildForwardPreview({ text: "", attachments: [] });
    assert.notEqual(preview.primary, "پیام با پیوست");
    assert.equal(preview.primary.includes("پیام با پیوست"), false);
  });

  it("does not invent a ۱ پیوست line for a single attachment", () => {
    const preview = buildForwardPreview({
      text: "",
      attachments: [attachment({ attachment_type: "file", original_filename: "a.pdf" })]
    });
    assert.equal(preview.extraAttachmentCount, undefined);
  });

  it("uses a compact extra count only for multi-attachment messages without text", () => {
    const preview = buildForwardPreview({
      text: "",
      attachments: [
        attachment({ id: 1, attachment_type: "file", original_filename: "a.pdf" }),
        attachment({ id: 2, attachment_type: "file", original_filename: "b.pdf" })
      ]
    });
    assert.equal(preview.primary, "a.pdf");
    assert.equal(preview.extraAttachmentCount, 1);
  });
});

describe("forward error mapping", () => {
  it("never surfaces the obsolete same-group English error", () => {
    const message = formatForwardError({
      status: 400,
      data: { detail: "A message cannot be forwarded into the same group." }
    });
    assert.equal(message, FORWARD_ERROR_COPY.failure);
    assert.equal(message.includes("same group"), false);
    assert.equal(message.includes("A message"), false);
  });

  it("maps inaccessible-group failures to Persian", () => {
    assert.equal(
      formatForwardError({ status: 403, data: { detail: "You do not have access to this group." } }),
      FORWARD_ERROR_COPY.inaccessible
    );
  });

  it("maps generic English forward failures to Persian", () => {
    assert.equal(
      formatForwardError({ status: 500, data: { detail: "Forwarding failed unexpectedly." } }),
      FORWARD_ERROR_COPY.failure
    );
  });
});

describe("forward modal wiring", () => {
  const modal = read("ForwardMessageModal.tsx");
  const section = read("MessagesSection.tsx");
  const helpers = read("forwardMessageHelpers.ts");

  it("keeps the current group visible, selectable, and labeled گفتگوی فعلی", () => {
    assert.match(modal, /گفتگوی فعلی/);
    assert.match(modal, /forward-target-current-group/);
    assert.match(modal, /Include the current\/source group/);
    assert.equal(modal.includes("disabled={isCurrent}"), false);
    assert.equal(modal.includes("filter((group) => group.id !=="), false);
    assert.equal(modal.includes("exclude"), false);
  });

  it("allows forwarding into the current group and appends the new message locally", () => {
    assert.match(section, /Same-group forward is valid/);
    assert.match(section, /targetGroupId === effectiveGroupId/);
    assert.match(section, /mergeUniqueMessages\(current, \[created\]\)/);
    assert.match(section, /setForwardTarget\(null\)/);
    assert.equal(section.includes("navigate("), false);
  });

  it("removes generic preview copy and full attachment cards from the modal", () => {
    assert.equal(modal.includes("پیام با پیوست"), false);
    assert.equal(modal.includes("پیوست"), true); // aria-label may mention پیوست for multi
    assert.equal(modal.includes("{sourceMessage.attachments.length} پیوست"), false);
    assert.equal(modal.includes("۱ پیوست"), false);
    assert.equal(modal.includes("MessageAttachmentCard"), false);
    assert.match(modal, /buildForwardPreview/);
  });

  it("uses Persian forward errors and blocks duplicate submit while pending", () => {
    assert.match(section, /formatForwardError/);
    assert.match(helpers, /a message cannot be forwarded into the same group/);
    assert.match(helpers, /بازارسال پیام انجام نشد/);
    assert.match(helpers, /به این گروه دسترسی ندارید/);
    assert.match(modal, /disabled=\{pending \|\| selectedGroupId == null\}/);
    assert.match(section, /if \(!forwardTarget \|\| isForwarding\) return/);
  });

  it("keeps the mobile/desktop modal viewport-bounded", () => {
    assert.match(modal, /max-h-dvh/);
    assert.match(modal, /max-h-\[min\(92dvh,36rem\)\]/);
    assert.match(modal, /items-end.*sm:items-center|sm:items-center/);
  });

  it("still lists other eligible active groups for selection", () => {
    assert.match(modal, /group\.is_active/);
    assert.match(modal, /forward-target-group-\$/);
    assert.match(modal, /جستجوی گروه/);
  });
});
