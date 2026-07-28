import { type FormEvent, useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Network, Plus, Send, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { addToast } from "../ui/uiSlice";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { classNames, linkButtonClasses } from "../../shared/utils/classNames";
import { getApiErrorMessage } from "../../shared/utils/apiError";
import { getListResults } from "../../shared/utils/listResults";
import { useListCompanyGroupsQuery } from "./companyGroupsApi";
import { useListCompanyMembersQuery } from "./companyMembersApi";
import { findCurrentMembership } from "./companyPermissions";
import {
  formatQuotaResetHint,
  GROUP_MESSAGE_PAGE_SIZE,
  type GroupMessage,
  isMessageQuotaExceeded,
  useCreateGroupMessageMutation,
  useLazyListGroupMessagesQuery
} from "./companyMessagesApi";

function sortMessagesAscending(messages: readonly GroupMessage[]): GroupMessage[] {
  return [...messages].sort((a, b) => {
    const byTime = a.created_at.localeCompare(b.created_at);
    if (byTime !== 0) return byTime;
    return a.id - b.id;
  });
}

function mergeUniqueMessages(
  existing: readonly GroupMessage[],
  incoming: readonly GroupMessage[]
): GroupMessage[] {
  const byId = new Map<number, GroupMessage>();
  for (const message of existing) {
    byId.set(message.id, message);
  }
  for (const message of incoming) {
    byId.set(message.id, message);
  }
  return sortMessagesAscending([...byId.values()]);
}

function formatMessageTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function MessagesSection({
  companyId,
  highlightAddAction
}: {
  companyId: number;
  highlightAddAction?: boolean;
}) {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const listRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);

  const {
    data: groupsData,
    error: groupsError,
    isLoading: isLoadingGroups,
    refetch: refetchGroups
  } = useListCompanyGroupsQuery(companyId);
  const { data: membersData } = useListCompanyMembersQuery(companyId);
  const members = getListResults(membersData);
  const myMembership = findCurrentMembership(members, authUser?.id);
  const myMemberId = myMembership?.is_active ? myMembership.id : null;

  const groups = getListResults(groupsData).filter((group) => group.is_active);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const effectiveGroupId = selectedGroupId ?? groups[0]?.id ?? null;
  const activeGroup = groups.find((group) => group.id === effectiveGroupId) ?? null;

  const [fetchMessages] = useLazyListGroupMessagesQuery();
  const [createMessage, { isLoading: isSending }] = useCreateGroupMessageMutation();

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [oldestLoadedPage, setOldestLoadedPage] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [messageText, setMessageText] = useState("");
  const [quotaBlockedHint, setQuotaBlockedHint] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const lastPage =
    totalCount > 0 ? Math.max(1, Math.ceil(totalCount / GROUP_MESSAGE_PAGE_SIZE)) : 1;
  const canLoadEarlier = oldestLoadedPage != null && oldestLoadedPage > 1;

  useEffect(() => {
    if (effectiveGroupId == null) {
      setMessages([]);
      setOldestLoadedPage(null);
      setTotalCount(0);
      setLoadError(null);
      setIsBootstrapping(false);
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      setIsBootstrapping(true);
      setLoadError(null);
      setMessages([]);
      setOldestLoadedPage(null);
      setQuotaBlockedHint(null);
      shouldStickToBottomRef.current = true;

      try {
        const firstPage = await fetchMessages({
          groupId: effectiveGroupId!,
          page: 1
        }).unwrap();
        if (cancelled) return;

        const count = firstPage.count;
        const computedLastPage = Math.max(1, Math.ceil(count / GROUP_MESSAGE_PAGE_SIZE));
        setTotalCount(count);

        if (computedLastPage === 1) {
          setMessages(sortMessagesAscending(firstPage.results));
          setOldestLoadedPage(1);
        } else {
          const latestPage = await fetchMessages({
            groupId: effectiveGroupId!,
            page: computedLastPage
          }).unwrap();
          if (cancelled) return;
          setMessages(sortMessagesAscending(latestPage.results));
          setOldestLoadedPage(computedLastPage);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error);
          setMessages([]);
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [effectiveGroupId, fetchMessages, reloadToken]);

  useEffect(() => {
    if (!shouldStickToBottomRef.current || !listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isBootstrapping, effectiveGroupId]);

  async function handleLoadEarlier() {
    if (!effectiveGroupId || oldestLoadedPage == null || oldestLoadedPage <= 1 || isLoadingEarlier) {
      return;
    }

    const previousPage = oldestLoadedPage - 1;
    setIsLoadingEarlier(true);
    shouldStickToBottomRef.current = false;
    const listEl = listRef.current;
    const previousHeight = listEl?.scrollHeight ?? 0;

    try {
      const pageData = await fetchMessages({
        groupId: effectiveGroupId,
        page: previousPage
      }).unwrap();
      setTotalCount(pageData.count);
      setMessages((current) => mergeUniqueMessages(current, pageData.results));
      setOldestLoadedPage(previousPage);
      requestAnimationFrame(() => {
        if (listEl) {
          listEl.scrollTop = listEl.scrollHeight - previousHeight;
        }
      });
    } catch (error) {
      dispatch(addToast({ message: getApiErrorMessage(error), type: "error" }));
    } finally {
      setIsLoadingEarlier(false);
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!effectiveGroupId || quotaBlockedHint) {
      return;
    }

    const text = messageText.trim();
    if (!text) {
      return;
    }

    try {
      const created = await createMessage({
        groupId: effectiveGroupId,
        body: { text }
      }).unwrap();
      setMessageText("");
      setQuotaBlockedHint(null);
      shouldStickToBottomRef.current = true;
      setMessages((current) => mergeUniqueMessages(current, [created]));
      setTotalCount((count) => count + 1);
      if (oldestLoadedPage == null) {
        setOldestLoadedPage(lastPage);
      }
      dispatch(addToast({ message: "پیام ارسال شد.", type: "success" }));
    } catch (error) {
      if (isMessageQuotaExceeded(error)) {
        const hint = formatQuotaResetHint(error.data.resets_at);
        setQuotaBlockedHint(hint);
        dispatch(addToast({ message: hint, type: "error" }));
        return;
      }
      dispatch(addToast({ message: getApiErrorMessage(error), type: "error" }));
    }
  }

  if (isLoadingGroups) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-300 light:text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
          در حال دریافت گروه‌ها برای پیام‌رسانی
        </div>
      </div>
    );
  }

  if (groupsError) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
        <EmptyState
          action={
            <Button onClick={() => refetchGroups()} variant="secondary">
              تلاش دوباره
            </Button>
          }
          description={getApiErrorMessage(groupsError)}
          icon={<XCircle className="h-7 w-7" />}
          title="دریافت گروه‌ها ممکن نشد"
        />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
        <EmptyState
          description="برای پیام‌رسانی باید عضو حداقل یک گروه باشید. از بخش گروه‌ها یک گروه بسازید یا به گروهی اضافه شوید."
          icon={<Network className="h-7 w-7" />}
          title="گروهی برای پیام وجود ندارد"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-white/10 px-3 py-2 sm:px-5 light:border-slate-200">
        <label className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <span className="text-xs font-bold text-slate-400 light:text-slate-500">گروه فعال</span>
          <select
            className="h-10 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm font-bold text-slate-100 outline-none transition focus:border-emerald-300/45 sm:max-w-sm light:border-slate-200 light:bg-white light:text-slate-900"
            onChange={(event) => setSelectedGroupId(Number(event.target.value))}
            value={effectiveGroupId ?? ""}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
                {group.is_default ? " (پیش‌فرض)" : ""}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs text-slate-400 light:text-slate-500">
          پیام‌ها فقط برای اعضای فعال همان گروه در دسترس است. ادمین شرکت بدون عضویت گروه نمی‌تواند پیام ببیند یا بفرستد.
        </p>
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-5 sm:pb-3 [scrollbar-color:rgba(148,163,184,.4)_transparent] [scrollbar-width:thin]"
        data-tour="messages-area"
        ref={listRef}
      >
        {isBootstrapping ? (
          <div className="flex flex-1 items-center justify-center gap-3 text-sm font-bold text-slate-300 light:text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
            در حال دریافت پیام‌ها
          </div>
        ) : loadError ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              action={
                <Button onClick={() => setReloadToken((token) => token + 1)} variant="secondary">
                  تلاش دوباره
                </Button>
              }
              description={getApiErrorMessage(loadError)}
              icon={<XCircle className="h-7 w-7" />}
              title="دسترسی به پیام‌های گروه ممکن نشد"
            />
          </div>
        ) : (
          <>
            {canLoadEarlier ? (
              <div className="flex justify-center">
                <Button
                  disabled={isLoadingEarlier}
                  onClick={() => void handleLoadEarlier()}
                  type="button"
                  variant="secondary"
                >
                  {isLoadingEarlier ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  بارگذاری پیام‌های قبلی
                </Button>
              </div>
            ) : null}

            {messages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="mx-auto max-w-md text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-violet-300/20 bg-violet-400/10 text-violet-200 sm:h-16 sm:w-16">
                    <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <h3 className="mt-3 text-base font-black text-white sm:mt-5 sm:text-xl light:text-slate-950">
                    هنوز پیامی در این گروه نیست
                  </h3>
                  <p className="mt-3 hidden text-sm leading-7 text-slate-300 sm:block light:text-slate-600">
                    اولین پیام متنی را ارسال کنید. پیوست فایل و صورت‌بها در فاز بعد اضافه می‌شود.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isMine = myMemberId != null && message.sender_member_id === myMemberId;
                return (
                  <div
                    className={classNames(
                      "max-w-[min(34rem,100%)] rounded-2xl border p-3 text-sm leading-7 sm:p-4",
                      isMine
                        ? "mr-auto rounded-bl-sm border-emerald-300/20 bg-emerald-400/12 text-slate-100 light:bg-emerald-50 light:text-slate-800"
                        : "ml-auto rounded-br-sm border-white/10 bg-white/8 text-slate-100 light:border-slate-200 light:bg-white light:text-slate-800"
                    )}
                    key={message.id}
                  >
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-400 light:text-slate-500">
                      <span>{message.sender_display_name || "عضو"}</span>
                      <span>{formatMessageTime(message.created_at)}</span>
                    </div>
                    {message.text ? <p className="whitespace-pre-wrap">{message.text}</p> : null}
                    {message.attachments.length > 0 ? (
                      <div className="mt-3 rounded-lg border border-dashed border-white/15 bg-slate-950/25 px-3 py-2 text-xs text-slate-400 light:border-slate-200 light:bg-slate-50 light:text-slate-500">
                        {message.attachments.length} پیوست در این پیام ثبت شده است. باز کردن پیوست در فاز بعد
                        فعال می‌شود.
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      <div
        className="shrink-0 border-t border-white/10 bg-slate-950/80 p-3 backdrop-blur-md sm:px-5 light:border-slate-200 light:bg-white/90"
        data-tour="message-input-area"
      >
        {quotaBlockedHint ? (
          <p className="mb-2 rounded-lg border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-100 light:border-amber-200 light:bg-amber-50 light:text-amber-800">
            {quotaBlockedHint}
          </p>
        ) : null}

        <form className="flex items-end gap-2" onSubmit={(event) => void handleSend(event)}>
          <Link
            aria-label="ساخت صورت‌بها"
            className={classNames(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-400/10 text-emerald-200 transition hover:bg-emerald-400/20 light:text-emerald-700",
              highlightAddAction && "ring-4 ring-emerald-200/35"
            )}
            data-tour="add-attachment-btn"
            to={`/companies/${companyId}/cost-reports/new`}
          >
            <Plus className="h-4 w-4" />
          </Link>
          <textarea
            className="min-h-11 max-h-24 flex-1 resize-none overflow-y-auto rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2.5 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-300/45 sm:px-4 sm:py-3 light:border-slate-200 light:bg-slate-50 light:text-slate-950"
            disabled={!activeGroup || Boolean(loadError) || Boolean(quotaBlockedHint)}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder={
              activeGroup ? `پیام در گروه «${activeGroup.name}»…` : "ابتدا یک گروه انتخاب کنید"
            }
            rows={1}
            value={messageText}
          />
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-slate-100 transition hover:border-emerald-300/35 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-45 light:border-slate-200 light:bg-white light:text-slate-800"
            disabled={
              isSending ||
              !messageText.trim() ||
              !activeGroup ||
              Boolean(loadError) ||
              Boolean(quotaBlockedHint)
            }
            type="submit"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>

        {loadError ? (
          <p className="mt-2 text-xs text-slate-400 light:text-slate-500">
            ارسال تا رفع خطای بارگذاری غیرفعال است.{" "}
            <button
              className="font-bold text-emerald-200 underline light:text-emerald-700"
              onClick={() => setReloadToken((token) => token + 1)}
              type="button"
            >
              تلاش دوباره
            </button>
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-500 light:text-slate-500">
            دکمه + فعلاً فقط سازنده صورت‌بها را باز می‌کند؛ پیوست پیام در فاز بعد اضافه می‌شود.{" "}
            <Link className={classNames(linkButtonClasses, "inline-flex h-auto px-0 py-0")} to={`/companies/${companyId}/cost-reports/new`}>
              رفتن به سازنده
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
