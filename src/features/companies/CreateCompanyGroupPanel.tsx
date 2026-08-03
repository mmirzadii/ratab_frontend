import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState
} from "react";
import { ArrowRight, Check, Loader2, Search, Users, X, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { userInitials } from "../account/accountDisplay";
import { addToast } from "../ui/uiSlice";
import { Button } from "../../shared/components/Button";
import { classNames } from "../../shared/utils/classNames";
import { getApiErrorMessage } from "../../shared/utils/apiError";
import { getListResults } from "../../shared/utils/listResults";
import { useCreateCompanyGroupMutation } from "./companyGroupsApi";
import {
  type CompanyMember,
  useListCompanyMembersQuery
} from "./companyMembersApi";
import { findCurrentMembership, getRoleLabel } from "./companyPermissions";

const NAME_MAX_LENGTH = 240;
const SEARCH_DEBOUNCE_MS = 300;

const inputClasses =
  "h-11 w-full rounded-xl border border-ui-border-subtle bg-ui-surface/50 px-3 text-sm text-ui-text-primary outline-none transition placeholder:text-ui-text-muted focus:border-ui-primary/30";

const textareaClasses =
  "min-h-[2.75rem] max-h-36 w-full resize-none overflow-y-auto rounded-xl border border-ui-border-subtle bg-ui-surface/50 px-3 py-2.5 text-sm text-ui-text-primary outline-none transition placeholder:text-ui-text-muted focus:border-ui-primary/30";

function memberDisplayName(member: CompanyMember): string {
  return member.display_name?.trim() || member.phone_number || `عضو ${member.id}`;
}

function parseInvalidMemberIds(error: unknown): number[] {
  if (!error || typeof error !== "object" || !("data" in error)) return [];
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object") return [];
  const memberErrors = (data as { member_ids?: unknown }).member_ids;
  if (!Array.isArray(memberErrors)) return [];
  const ids: number[] = [];
  for (const entry of memberErrors) {
    if (typeof entry === "number" && Number.isInteger(entry)) {
      ids.push(entry);
      continue;
    }
    if (typeof entry === "string") {
      const match = entry.match(/\d+/);
      if (match) ids.push(Number(match[0]));
    }
  }
  return [...new Set(ids.filter((id) => id > 0))];
}

function MemberAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ui-primary-soft text-sm font-black text-ui-primary"
    >
      {userInitials(name)}
    </span>
  );
}

export function CreateCompanyGroupPanel() {
  const { companyId: companyIdParam } = useParams();
  const companyId = Number(companyIdParam);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const titleId = useId();
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [selectedMembersById, setSelectedMembersById] = useState<Record<number, CompanyMember>>({});
  const [invalidMemberIds, setInvalidMemberIds] = useState<number[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: allMembersData } = useListCompanyMembersQuery(
    { companyId, activeOnly: true },
    { skip: !Number.isInteger(companyId) || companyId <= 0 }
  );
  const allActiveMembers = getListResults(allMembersData);
  const myMembership = findCurrentMembership(allActiveMembers, authUser?.id);
  const creatorMemberId = myMembership?.is_active ? myMembership.id : null;

  const {
    data: searchedMembersData,
    error: membersError,
    isFetching: isFetchingMembers,
    isLoading: isLoadingMembers
  } = useListCompanyMembersQuery(
    {
      companyId,
      activeOnly: true,
      q: debouncedSearch || undefined
    },
    { skip: !Number.isInteger(companyId) || companyId <= 0 || step !== 2 }
  );

  const [createGroup, { isLoading: isCreating }] = useCreateCompanyGroupMutation();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(memberSearch.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [memberSearch]);

  useEffect(() => {
    if (step !== 1) return;
    window.setTimeout(() => nameInputRef.current?.focus(), 0);
  }, [step]);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [groupDescription, step]);

  const listedMembers = useMemo(() => {
    const results = getListResults(searchedMembersData);
    return results.filter((member) => member.is_active && member.id !== creatorMemberId);
  }, [creatorMemberId, searchedMembersData]);

  const selectedMembers = useMemo(
    () =>
      selectedMemberIds
        .map((id) => selectedMembersById[id])
        .filter((member): member is CompanyMember => Boolean(member)),
    [selectedMemberIds, selectedMembersById]
  );

  const selectedCountLabel = useMemo(() => {
    const count = selectedMemberIds.length;
    if (count === 0) return "هیچ عضو دیگری انتخاب نشده";
    return `${count} عضو انتخاب شده`;
  }, [selectedMemberIds.length]);

  function closePanel() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(`/companies/${companyId}`, { replace: true });
  }

  function validateName(value = groupName): string | null {
    const trimmed = value.trim();
    if (!trimmed) return "نام گروه الزامی است.";
    if (trimmed.length > NAME_MAX_LENGTH) {
      return `نام گروه حداکثر ${NAME_MAX_LENGTH} نویسه می‌تواند باشد.`;
    }
    return null;
  }

  function goToStep2() {
    const error = validateName();
    setNameError(error);
    if (error) {
      nameInputRef.current?.focus();
      return;
    }
    setCreateError(null);
    setStep(2);
  }

  function handleNameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    goToStep2();
  }

  function toggleMember(member: CompanyMember) {
    if (member.id === creatorMemberId) return;
    setCreateError(null);
    setInvalidMemberIds((current) => current.filter((id) => id !== member.id));
    setSelectedMemberIds((current) => {
      if (current.includes(member.id)) {
        return current.filter((id) => id !== member.id);
      }
      return [...current, member.id];
    });
    setSelectedMembersById((current) => ({ ...current, [member.id]: member }));
  }

  function removeSelectedMember(memberId: number) {
    setSelectedMemberIds((current) => current.filter((id) => id !== memberId));
    setInvalidMemberIds((current) => current.filter((id) => id !== memberId));
  }

  async function handleCreate(event?: FormEvent) {
    event?.preventDefault();
    if (isCreating) return;

    const nameValidation = validateName();
    if (nameValidation) {
      setNameError(nameValidation);
      setStep(1);
      return;
    }

    const uniqueMemberIds = [
      ...new Set(selectedMemberIds.filter((id) => id !== creatorMemberId && id > 0))
    ];

    setCreateError(null);
    try {
      const result = await createGroup({
        companyId,
        body: {
          name: groupName.trim(),
          description: groupDescription.trim(),
          ...(uniqueMemberIds.length > 0 ? { member_ids: uniqueMemberIds } : {})
        }
      }).unwrap();

      const pending = result.pending_invitation_count ?? result.invitations?.length ?? 0;
      dispatch(
        addToast({
          message:
            pending > 0
              ? "گروه ساخته شد و دعوت‌ها ارسال شدند."
              : "گروه ساخته شد.",
          type: "success"
        })
      );

      navigate(`/companies/${companyId}`, {
        replace: true,
        state: {
          focusSection: "messages",
          focusGroupId: result.group.id
        }
      });
    } catch (error) {
      const invalidIds = parseInvalidMemberIds(error);
      if (invalidIds.length > 0) {
        setInvalidMemberIds(invalidIds);
        setStep(2);
        setCreateError("یکی از اعضای انتخاب‌شده دیگر عضو فعال شرکت نیست.");
        return;
      }
      setCreateError(
        getApiErrorMessage(error, "ساخت گروه انجام نشد. دوباره تلاش کنید.")
      );
    }
  }

  if (!Number.isInteger(companyId) || companyId <= 0) {
    return null;
  }

  return (
    <section
      aria-labelledby={titleId}
      className="flex h-full min-h-0 w-full flex-col bg-ui-surface"
      data-testid="create-company-group-panel"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-ui-border-subtle px-3 py-2.5">
        <button
          aria-label={step === 1 ? "بستن" : "بازگشت به اطلاعات گروه"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ui-text-secondary transition hover:bg-ui-surface-subtle hover:text-ui-text-primary"
          onClick={() => {
            if (step === 2) {
              setStep(1);
              return;
            }
            closePanel();
          }}
          type="button"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-black text-ui-text-primary" id={titleId}>
            {step === 1 ? "ساخت گروه" : "افزودن اعضا"}
          </h1>
          <p className="text-[11px] font-bold text-ui-text-muted" aria-live="polite">
            {step === 1 ? "مرحله ۱ از ۲" : "مرحله ۲ از ۲"}
          </p>
        </div>
        {step === 1 ? (
          <button
            aria-label="بستن"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary"
            onClick={closePanel}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </header>

      {step === 1 ? (
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            goToStep2();
          }}
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 [scrollbar-width:thin]">
            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-ui-text-secondary">نام گروه</span>
              <input
                aria-invalid={Boolean(nameError)}
                aria-required
                autoFocus
                className={inputClasses}
                maxLength={NAME_MAX_LENGTH}
                onChange={(event) => {
                  setGroupName(event.target.value);
                  setNameError(null);
                }}
                onKeyDown={handleNameKeyDown}
                placeholder="مثلاً تیم اجرایی"
                ref={nameInputRef}
                value={groupName}
              />
              {nameError ? (
                <p className="text-xs text-ui-danger">{nameError}</p>
              ) : null}
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-ui-text-secondary">
                توضیحات (اختیاری)
              </span>
              <textarea
                aria-required={false}
                className={textareaClasses}
                onChange={(event) => setGroupDescription(event.target.value)}
                placeholder="توضیح کوتاه درباره گروه"
                ref={descriptionRef}
                rows={2}
                value={groupDescription}
              />
            </label>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-ui-border-subtle px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            <Button onClick={closePanel} type="button" variant="secondary">
              انصراف
            </Button>
            <Button type="submit">بعدی</Button>
          </div>
        </form>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {selectedMembers.length > 0 ? (
            <div className="shrink-0 border-b border-ui-border-subtle px-3 py-2">
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                {selectedMembers.map((member) => {
                  const name = memberDisplayName(member);
                  return (
                    <button
                      className="inline-flex h-9 max-w-[9.5rem] shrink-0 items-center gap-1.5 rounded-full border border-ui-primary/30 bg-ui-primary-soft px-2 text-xs font-bold text-ui-primary"
                      key={member.id}
                      onClick={() => removeSelectedMember(member.id)}
                      type="button"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ui-primary-soft text-[10px]">
                        {userInitials(name)}
                      </span>
                      <span className="truncate">{name}</span>
                      <X className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="shrink-0 border-b border-ui-border-subtle px-3 py-2">
            <label className="relative block">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-text-muted" />
              <input
                aria-label="جستجوی اعضا"
                className={classNames(inputClasses, "pr-10")}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder="جستجوی اعضا…"
                value={memberSearch}
              />
            </label>
            <p className="mt-2 text-[11px] font-bold text-ui-text-muted" aria-live="polite">
              {selectedCountLabel}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-ui-text-muted">
              سازنده به‌صورت خودکار عضو فعال گروه می‌شود و در فهرست دعوت نیست.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]" role="listbox" aria-multiselectable>
            {isLoadingMembers || (isFetchingMembers && listedMembers.length === 0) ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm font-bold text-ui-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال دریافت اعضا
              </div>
            ) : membersError ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <XCircle className="h-6 w-6 text-ui-danger" />
                <p className="text-sm font-bold text-ui-danger">
                  اعضای شرکت دریافت نشدند.
                </p>
              </div>
            ) : listedMembers.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Users className="h-6 w-6 text-ui-text-muted" />
                <p className="text-sm font-bold text-ui-text-muted">
                  {debouncedSearch ? "عضوی با این عبارت پیدا نشد." : "عضو فعالی برای دعوت نیست."}
                </p>
              </div>
            ) : (
              listedMembers.map((member) => {
                const name = memberDisplayName(member);
                const selected = selectedMemberIds.includes(member.id);
                const invalid = invalidMemberIds.includes(member.id);
                const secondary = [member.phone_number, getRoleLabel(member.role)]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <button
                    aria-checked={selected}
                    aria-invalid={invalid || undefined}
                    className={classNames(
                      "flex min-h-11 w-full items-center gap-3 border-b border-ui-border-subtle px-3 py-2.5 text-right transition",
                      selected
                        ? "bg-ui-primary-soft"
                        : "hover:bg-ui-surface-subtle ",
                      invalid && "ring-1 ring-inset ring-ui-danger/50"
                    )}
                    key={member.id}
                    onClick={() => toggleMember(member)}
                    role="option"
                    type="button"
                  >
                    <MemberAvatar name={name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ui-text-primary">
                        {name}
                      </span>
                      {secondary ? (
                        <span className="mt-0.5 block truncate text-[11px] text-ui-text-muted">
                          {secondary}
                        </span>
                      ) : null}
                    </span>
                    <span
                      aria-hidden
                      className={classNames(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                        selected
                          ? "border-ui-primary bg-ui-primary text-ui-primary-foreground"
                          : "border-ui-border-default text-transparent "
                      )}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="shrink-0 space-y-2 border-t border-ui-border-subtle px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            <p className="text-[11px] leading-5 text-ui-text-muted">
              برای اعضای انتخاب‌شده دعوت عضویت در گروه ارسال می‌شود.
            </p>
            {createError ? (
              <p className="text-xs font-bold text-ui-danger">{createError}</p>
            ) : null}
            <Button className="w-full" disabled={isCreating} onClick={() => void handleCreate()} type="button">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {selectedMemberIds.length > 0
                ? `ساخت گروه (${selectedMemberIds.length})`
                : "ساخت گروه"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
