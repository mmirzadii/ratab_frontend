import type { components } from "../../shared/api/generated/schema";

type GroupMessage = components["schemas"]["GroupMessage"];
type MessageAttachment = components["schemas"]["MessageAttachment"];

export type PendingAttachmentPreview = {
  key: string;
  attachment_type: "file" | "financial_document";
  resource_id: number;
  label: string;
  detail?: string;
};

/** Local-only send lifecycle. Absent means the message is server-confirmed. */
export type LocalSendStatus = "pending" | "failed";

export type ChatMessage = GroupMessage & {
  localStatus?: LocalSendStatus;
  /** Shown while optimistic send has not received MessageAttachment rows yet. */
  pendingPreviewAttachments?: PendingAttachmentPreview[];
};

let tempMessageSeq = 0;

export function nextTempMessageId(): number {
  tempMessageSeq += 1;
  return -(Date.now() * 1000 + (tempMessageSeq % 1000));
}

export function createClientMessageId(prefix = "msg"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getForwardedLabel(message: Pick<GroupMessage, "forwarded_from">): string | null {
  const forwarded = message.forwarded_from;
  if (!forwarded) return null;
  const label = forwarded.label_fa;
  return typeof label === "string" && label.trim() ? label.trim() : "فوروارد شده";
}

export function sortMessagesAscending(messages: readonly ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => {
    const byTime = a.created_at.localeCompare(b.created_at);
    if (byTime !== 0) return byTime;
    return a.id - b.id;
  });
}

export function mergeUniqueMessages(
  existing: readonly ChatMessage[],
  incoming: readonly ChatMessage[]
): ChatMessage[] {
  const byId = new Map<number, ChatMessage>();
  const byClientId = new Map<string, number>();

  for (const message of existing) {
    byId.set(message.id, message);
    if (message.client_message_id) {
      byClientId.set(message.client_message_id, message.id);
    }
  }

  for (const message of incoming) {
    if (message.client_message_id) {
      const previousId = byClientId.get(message.client_message_id);
      if (previousId != null && previousId !== message.id) {
        byId.delete(previousId);
      }
      byClientId.set(message.client_message_id, message.id);
    }
    byId.set(message.id, message);
  }

  return sortMessagesAscending([...byId.values()]);
}

export function replaceMessageById(
  messages: readonly ChatMessage[],
  updated: ChatMessage
): ChatMessage[] {
  return messages.map((message) => (message.id === updated.id ? updated : message));
}

export function markMessageFailed(
  messages: readonly ChatMessage[],
  messageId: number
): ChatMessage[] {
  return messages.map((message) =>
    message.id === messageId ? { ...message, localStatus: "failed" as const } : message
  );
}

export function buildOptimisticOutgoingMessage(input: {
  tempId: number;
  groupId: number;
  senderMemberId: number;
  senderDisplayName: string;
  text: string;
  clientMessageId: string;
  pendingAttachments: readonly PendingAttachmentPreview[];
}): ChatMessage {
  return {
    id: input.tempId,
    group_id: input.groupId,
    sender_member_id: input.senderMemberId,
    sender_display_name: input.senderDisplayName,
    text: input.text,
    attachments: [] as MessageAttachment[],
    created_at: new Date().toISOString(),
    edited_at: null,
    is_edited: false,
    is_deleted: false,
    deleted_at: null,
    client_message_id: input.clientMessageId,
    forwarded_from: null,
    can_edit: false,
    can_delete: false,
    can_forward: false,
    localStatus: "pending",
    pendingPreviewAttachments: [...input.pendingAttachments]
  };
}

export function formatMessageTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatCompactMessageTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return formatMessageTime(value);
  }
}
