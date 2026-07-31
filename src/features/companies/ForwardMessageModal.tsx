import { useEffect, useMemo, useState } from "react";
import { Loader2, Paperclip, Search, X } from "lucide-react";

import { Button } from "../../shared/components/Button";
import { classNames } from "../../shared/utils/classNames";
import type { CompanyGroup } from "./companyGroupsApi";
import type { GroupMessage } from "./companyMessagesApi";
import { getForwardedLabel } from "./chatMessageHelpers";
import { buildForwardPreview } from "./forwardMessageHelpers";
import {
  classifyCompanyGroup,
  groupKindLabel,
  resolveGroupDisplayName
} from "./groupKinds";
import type { Project } from "../projects/projectApi";

export function ForwardMessageModal({
  open,
  sourceMessage,
  groups,
  projects,
  currentGroupId,
  pending,
  errorMessage,
  onClose,
  onConfirm
}: {
  open: boolean;
  sourceMessage: GroupMessage;
  groups: readonly CompanyGroup[];
  projects: readonly Project[];
  currentGroupId: number | null;
  pending: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: (targetGroupId: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  // Include the current/source group — same-group forward is valid.
  const eligibleGroups = useMemo(
    () => groups.filter((group) => group.is_active),
    [groups]
  );

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fa");
    if (!normalized) return eligibleGroups;
    return eligibleGroups.filter((group) => {
      const name = resolveGroupDisplayName(group, projects).toLocaleLowerCase("fa");
      const kind = groupKindLabel(classifyCompanyGroup(group, projects)).toLocaleLowerCase(
        "fa"
      );
      return name.includes(normalized) || kind.includes(normalized);
    });
  }, [eligibleGroups, projects, query]);

  const preview = useMemo(() => buildForwardPreview(sourceMessage), [sourceMessage]);
  const previewForward = getForwardedLabel(sourceMessage);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedGroupId(null);
  }, [open, sourceMessage.id]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex max-h-dvh items-end justify-center overflow-y-auto bg-ui-overlay backdrop-blur-sm sm:items-center sm:p-4"
      data-testid="forward-message-modal"
      onMouseDown={(event) => {
        if (!pending && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-labelledby="forward-message-title"
        aria-modal="true"
        className="flex max-h-[min(92dvh,36rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-ui-border-subtle bg-ui-surface shadow-ui sm:rounded-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-ui-border-subtle px-4 py-3">
          <div className="min-w-0">
            <h2
              className="text-base font-black text-ui-text-primary"
              id="forward-message-title"
            >
              بازارسال پیام
            </h2>
            <p className="mt-1 text-xs text-ui-text-muted">
              یک گروه فعال در همین شرکت انتخاب کنید.
            </p>
          </div>
          <button
            aria-label="انصراف"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary disabled:opacity-50"
            disabled={pending}
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 [scrollbar-width:thin]">
          <div
            className="rounded-xl border border-ui-border-subtle bg-ui-surface-subtle px-3 py-2.5"
            data-testid="forward-message-preview"
          >
            <p className="text-[11px] font-bold text-ui-text-muted">پیش‌نمایش پیام</p>
            {previewForward ? (
              <p className="mt-1 text-[11px] font-bold text-ui-primary/90">{previewForward}</p>
            ) : null}
            <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm font-bold text-ui-text-primary">
              {preview.primary}
            </p>
            {preview.extraAttachmentCount != null ? (
              <p
                aria-label={`${preview.extraAttachmentCount + 1} پیوست`}
                className="mt-1 inline-flex items-center gap-1 text-[11px] text-ui-text-muted"
                data-testid="forward-preview-extra-attachments"
              >
                <Paperclip className="h-3 w-3" />
                <span>+{preview.extraAttachmentCount}</span>
              </p>
            ) : null}
          </div>

          <label className="relative block">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-text-muted" />
            <input
              aria-label="جستجوی گروه"
              className="h-11 w-full rounded-xl border border-ui-border-subtle bg-ui-surface-subtle pr-10 pl-3 text-sm font-bold text-ui-text-primary outline-none transition placeholder:text-ui-text-muted focus:border-ui-border-default focus-visible:ring-2 focus-visible:ring-ui-focus"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جستجوی گروه…"
              value={query}
            />
          </label>

          <ul className="space-y-1.5" role="listbox" aria-label="گروه‌های مقصد">
            {filteredGroups.length === 0 ? (
              <li className="rounded-xl px-3 py-4 text-center text-sm text-ui-text-muted">
                گروهی مطابق جستجو یافت نشد.
              </li>
            ) : (
              filteredGroups.map((group) => {
                const selected = selectedGroupId === group.id;
                const isCurrent = currentGroupId === group.id;
                return (
                  <li key={group.id}>
                    <button
                      aria-selected={selected}
                      className={classNames(
                        "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-right transition",
                        selected
                          ? "border-ui-primary bg-ui-primary-soft text-ui-primary"
                          : "border-ui-border-subtle bg-ui-surface-subtle text-ui-text-primary hover:border-ui-border-default"
                      )}
                      data-testid={
                        isCurrent ? "forward-target-current-group" : `forward-target-group-${group.id}`
                      }
                      onClick={() => setSelectedGroupId(group.id)}
                      role="option"
                      type="button"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black">
                          {resolveGroupDisplayName(group, projects)}
                        </span>
                        <span className="mt-0.5 block text-[11px] font-bold opacity-80">
                          {groupKindLabel(classifyCompanyGroup(group, projects))}
                          {isCurrent ? " · گفتگوی فعلی" : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {errorMessage ? (
            <p
              className="rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100"
              data-testid="forward-error"
            >
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-ui-border-subtle px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <Button disabled={pending} onClick={onClose} type="button" variant="secondary">
            انصراف
          </Button>
          <Button
            data-testid="forward-submit"
            disabled={pending || selectedGroupId == null}
            onClick={() => {
              if (selectedGroupId != null) onConfirm(selectedGroupId);
            }}
            type="button"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال بازارسال
              </>
            ) : (
              "بازارسال"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
