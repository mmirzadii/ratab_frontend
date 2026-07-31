import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildOptimisticOutgoingMessage,
  createClientMessageId,
  mergeUniqueMessages,
  nextTempMessageId,
  replaceMessageById,
  getForwardedLabel
} from "./chatMessageHelpers.ts";
import { clampMenuPosition, messageHasAnyAction } from "./messageMenuPosition.ts";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("Phase 10 message lifecycle helpers", () => {
  it("creates distinct client message ids for idempotent retries", () => {
    const a = createClientMessageId("send");
    const b = createClientMessageId("send");
    assert.notEqual(a, b);
    assert.match(a, /^send-/);
  });

  it("reconciles optimistic bubbles by client_message_id without duplicates", () => {
    const optimistic = buildOptimisticOutgoingMessage({
      tempId: nextTempMessageId(),
      groupId: 7,
      senderMemberId: 3,
      senderDisplayName: "من",
      text: "سلام",
      clientMessageId: "send-abc",
      pendingAttachments: []
    });
    const server = {
      ...optimistic,
      id: 42,
      localStatus: undefined,
      pendingPreviewAttachments: undefined,
      can_edit: true,
      can_delete: true,
      can_forward: true,
      created_at: "2026-07-31T10:00:00Z"
    };
    const merged = mergeUniqueMessages([optimistic], [server]);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].id, 42);
    assert.equal(merged[0].client_message_id, "send-abc");
  });

  it("replaces a deleted message with the backend tombstone payload", () => {
    const original = buildOptimisticOutgoingMessage({
      tempId: 9,
      groupId: 1,
      senderMemberId: 2,
      senderDisplayName: "A",
      text: "حذف شو",
      clientMessageId: "x",
      pendingAttachments: [{ key: "f-1", attachment_type: "file", resource_id: 1, label: "a.pdf" }]
    });
    const tombstone = {
      ...original,
      id: 9,
      text: "پیام حذف شد",
      is_deleted: true,
      attachments: [],
      pendingPreviewAttachments: undefined,
      localStatus: undefined,
      can_edit: false,
      can_delete: false,
      can_forward: false
    };
    const next = replaceMessageById([original], tombstone);
    assert.equal(next[0].text, "پیام حذف شد");
    assert.equal(next[0].is_deleted, true);
    assert.equal(next[0].attachments.length, 0);
  });

  it("clamps context menus inside the viewport", () => {
    const clamped = clampMenuPosition(
      { x: 900, y: 700 },
      { width: 180, height: 140 },
      { width: 1000, height: 800 },
      8
    );
    assert.ok(clamped.x + 180 <= 1000 - 8);
    assert.ok(clamped.y + 140 <= 800 - 8);
    assert.ok(clamped.x >= 8);
    assert.ok(clamped.y >= 8);
  });

  it("renders actions only from backend capability fields", () => {
    assert.equal(
      messageHasAnyAction({ can_edit: false, can_delete: false, can_forward: false }),
      false
    );
    assert.equal(
      messageHasAnyAction({ can_edit: true, can_delete: false, can_forward: false }),
      true
    );
  });

  it("reads forwarded label from backend snapshot data", () => {
    const label = getForwardedLabel({
      id: 1,
      group_id: 1,
      sender_member_id: 1,
      sender_display_name: "B",
      text: "x",
      attachments: [],
      created_at: "2026-07-31T10:00:00Z",
      edited_at: null,
      is_edited: false,
      is_deleted: false,
      deleted_at: null,
      client_message_id: null,
      forwarded_from: {
        label_fa: "فوروارد شده از علی · عمومی"
      },
      can_edit: false,
      can_delete: false,
      can_forward: true
    });
    assert.equal(label, "فوروارد شده از علی · عمومی");
  });
});

describe("Phase 10 MessagesSection wiring", () => {
  const messagesSection = read("MessagesSection.tsx");
  const messagesApi = read("companyMessagesApi.ts");
  const schema = read("../../shared/api/generated/schema.ts");

  it("removes the normal send-success toast", () => {
    assert.equal(messagesSection.includes("پیام ارسال شد."), false);
  });

  it("shows pending, single sent check, and failed retry states", () => {
    assert.match(messagesSection, /message-status-pending/);
    assert.match(messagesSection, /message-status-sent/);
    assert.match(messagesSection, /message-sent-check/);
    assert.match(messagesSection, /message-status-failed/);
    assert.equal(messagesSection.includes("CheckCheck"), false);
    assert.equal(messagesSection.includes("message-status-read"), false);
  });

  it("uses client_message_id on create and forward", () => {
    assert.match(messagesSection, /client_message_id/);
    assert.match(messagesSection, /createClientMessageId/);
    assert.match(messagesApi, /GroupMessageForwardRequest/);
    assert.match(messagesApi, /target_group_id/);
  });

  it("wires edit/delete/forward endpoints from the synced contract", () => {
    assert.match(messagesApi, /\/api\/group-messages\/\$\{messageId\}\//);
    assert.match(messagesApi, /\/api\/group-messages\/\$\{messageId\}\/forward\//);
    assert.match(messagesApi, /useUpdateGroupMessageMutation/);
    assert.match(messagesApi, /useDeleteGroupMessageMutation/);
    assert.match(messagesApi, /useForwardGroupMessageMutation/);
    assert.match(schema, /can_edit/);
    assert.match(schema, /can_delete/);
    assert.match(schema, /can_forward/);
  });

  it("opens shared actions via desktop context menu and mobile long-press/overflow", () => {
    assert.match(messagesSection, /onContextMenu/);
    assert.match(messagesSection, /LONG_PRESS_MS/);
    assert.match(messagesSection, /message-overflow-/);
    assert.match(messagesSection, /MessageActionsMenu/);
    assert.equal(messagesSection.includes("window.confirm"), false);
  });

  it("edits through the composer with draft preserve/restore and no success toast", () => {
    assert.match(messagesSection, /composer-edit-banner/);
    assert.match(messagesSection, /composer-edit-cancel/);
    assert.match(messagesSection, /draftBackup/);
    assert.match(messagesSection, /ویرایش‌شده/);
    assert.equal(messagesSection.includes("ویرایش با موفقیت"), false);
  });

  it("deletes through confirmation and renders backend tombstone fields", () => {
    assert.match(messagesSection, /DeleteMessageConfirm/);
    assert.match(messagesSection, /is_deleted/);
    const deleteConfirm = read("DeleteMessageConfirm.tsx");
    assert.match(deleteConfirm, /پیام حذف شد/);
  });

  it("forwards through a searchable same-company modal without leaving the chat", () => {
    assert.match(messagesSection, /ForwardMessageModal/);
    assert.match(messagesSection, /target_group_id/);
    const forwardModal = read("ForwardMessageModal.tsx");
    assert.match(forwardModal, /جستجوی گروه/);
    assert.match(forwardModal, /groupKindLabel/);
  });

  it("does not reconstruct Owner/Manager/Employee delete rules in React", () => {
    assert.equal(messagesSection.includes('role === "owner"'), false);
    assert.equal(messagesSection.includes('role === "manager"'), false);
    assert.equal(messagesSection.includes("can_delete_employee_messages"), false);
    assert.match(messagesSection, /can_edit/);
    assert.match(messagesSection, /can_delete/);
    assert.match(messagesSection, /can_forward/);
  });
});
