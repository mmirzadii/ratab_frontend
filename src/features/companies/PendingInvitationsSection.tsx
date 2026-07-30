import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Mail, X, XCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch } from "../../app/hooks";
import { addToast } from "../ui/uiSlice";
import { Button } from "../../shared/components/Button";
import { EmptyState } from "../../shared/components/EmptyState";
import { GlassCard } from "../../shared/components/GlassCard";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { getApiErrorMessage } from "../../shared/utils/apiError";
import { getListResults } from "../../shared/utils/listResults";
import {
  type CompanyMembershipInvitation,
  useAcceptCompanyInvitationMutation,
  useListMyCompanyInvitationsQuery,
  useRejectCompanyInvitationMutation
} from "./companyInvitationsApi";
import { getRoleLabel } from "./companyPermissions";
import {
  INVITATION_ACCEPTED_MESSAGE,
  INVITATION_REJECTED_MESSAGE,
  formatMembershipAccessMessage,
  formatMembershipActionSuccess,
  invitationStatusLabel
} from "./membershipAccess";

function formatInvitationDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function PendingInvitationsSection({
  skip,
  companyId,
  onAcceptedCompany
}: {
  skip?: boolean;
  /** When set, only invitations for this company are shown. */
  companyId?: number;
  onAcceptedCompany?: (companyId: number, groupId?: number | null) => void;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [rejectTarget, setRejectTarget] = useState<CompanyMembershipInvitation | null>(null);
  const [busyInvitationId, setBusyInvitationId] = useState<number | null>(null);

  const { data, error, isLoading, isFetching, refetch } = useListMyCompanyInvitationsQuery(undefined, {
    skip: Boolean(skip)
  });
  const [acceptInvitation] = useAcceptCompanyInvitationMutation();
  const [rejectInvitation] = useRejectCompanyInvitationMutation();

  const invitations = getListResults(data).filter(
    (item) =>
      item.status === "pending" && (companyId == null || item.company_id === companyId)
  );

  useEffect(() => {
    const state = location.state as { focusInvitations?: boolean } | null;
    if (!state?.focusInvitations || !sectionRef.current) {
      return;
    }
    sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.state, invitations.length]);

  async function handleAccept(invitation: CompanyMembershipInvitation) {
    if (busyInvitationId != null) return;
    setBusyInvitationId(invitation.id);
    try {
      const result = await acceptInvitation(invitation.id).unwrap();
      const feedback = formatMembershipActionSuccess(result, INVITATION_ACCEPTED_MESSAGE);
      dispatch(addToast({ message: feedback.message, type: feedback.type }));
      const companyId = result.company?.id ?? invitation.company_id;
      const groupId = result.group?.id ?? invitation.target_group_id;
      onAcceptedCompany?.(companyId, groupId);
      navigate(`/companies/${companyId}`, {
        replace: false,
        state: groupId != null ? { focusSection: "messages", focusGroupId: groupId } : { focusSection: "messages" }
      });
    } catch (err) {
      dispatch(
        addToast({
          message: formatMembershipAccessMessage(err, getApiErrorMessage(err)),
          type: "error"
        })
      );
    } finally {
      setBusyInvitationId(null);
    }
  }

  async function handleRejectConfirmed() {
    if (!rejectTarget || busyInvitationId != null) return;
    const invitation = rejectTarget;
    setBusyInvitationId(invitation.id);
    try {
      const result = await rejectInvitation(invitation.id).unwrap();
      const feedback = formatMembershipActionSuccess(result, INVITATION_REJECTED_MESSAGE);
      dispatch(addToast({ message: feedback.message, type: feedback.type }));
      setRejectTarget(null);
    } catch (err) {
      dispatch(
        addToast({
          message: formatMembershipAccessMessage(err, getApiErrorMessage(err)),
          type: "error"
        })
      );
    } finally {
      setBusyInvitationId(null);
    }
  }

  if (skip) {
    return null;
  }

  if (isLoading) {
    return (
      <GlassCard className="flex min-h-24 items-center justify-center p-5">
        <div className="flex items-center gap-3 text-sm font-bold text-ui-text-secondary">
          <Loader2 className="h-5 w-5 animate-spin text-ui-primary" />
          در حال دریافت دعوت‌های عضویت
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <EmptyState
        action={
          <Button onClick={() => refetch()} variant="secondary">
            تلاش دوباره
          </Button>
        }
        description={getApiErrorMessage(error)}
        icon={<XCircle className="h-7 w-7" />}
        title="دریافت دعوت‌ها ناموفق بود"
      />
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2.5 sm:space-y-4" data-tour="pending-invitations" ref={sectionRef}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-black text-ui-text-primary sm:text-lg">
            دعوت‌های در انتظار تأیید
          </h2>
          <p className="text-xs text-ui-text-muted sm:text-sm">
            این شرکت‌ها هنوز فعال نیستند و تا تأیید دعوت قابل ورود نیستند.
          </p>
        </div>
        <Button disabled={isFetching} onClick={() => refetch()} variant="secondary">
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          به‌روزرسانی دعوت‌ها
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {invitations.map((invitation) => {
          const busy = busyInvitationId === invitation.id;
          return (
            <GlassCard className="p-3 sm:p-4" key={invitation.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <StatusBadge tone="amber">
                    <Mail className="h-3.5 w-3.5" />
                    {invitationStatusLabel(invitation.status)}
                  </StatusBadge>
                  <div>
                    <h3 className="truncate text-base font-black text-ui-text-primary sm:text-lg">
                      {invitation.company_name}
                    </h3>
                    <p className="mt-1 text-xs text-ui-text-muted">
                      شرکت در انتظار تأیید — ورود ممکن نیست
                    </p>
                  </div>
                </div>
              </div>

              <dl className="mt-3 space-y-1.5 text-xs text-ui-text-secondary sm:text-sm">
                <div className="flex justify-between gap-3">
                  <dt>نقش پیشنهادی</dt>
                  <dd className="font-bold text-ui-text-primary">
                    {getRoleLabel(invitation.proposed_role)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>گروه هدف</dt>
                  <dd className="truncate font-bold text-ui-text-primary">
                    {invitation.target_group_name || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>تاریخ دعوت</dt>
                  <dd className="font-bold text-ui-text-primary">
                    {formatInvitationDate(invitation.created_at)}
                  </dd>
                </div>
                {invitation.invited_by_member_id ? (
                  <div className="flex justify-between gap-3">
                    <dt>شناسه دعوت‌کننده</dt>
                    <dd className="font-bold text-ui-text-primary">
                      {invitation.invited_by_member_id}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  disabled={busyInvitationId != null}
                  onClick={() => void handleAccept(invitation)}
                  variant="primary"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  تأیید عضویت
                </Button>
                <Button
                  disabled={busyInvitationId != null}
                  onClick={() => setRejectTarget(invitation)}
                  variant="secondary"
                >
                  <X className="h-4 w-4" />
                  رد دعوت
                </Button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {rejectTarget ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ui-overlay p-3 backdrop-blur-sm sm:p-4">
          <GlassCard className="w-full max-w-md p-4 sm:p-5">
            <h3 className="text-base font-black text-ui-text-primary">رد دعوت عضویت</h3>
            <p className="mt-2 text-sm leading-7 text-ui-text-secondary">
              دعوت شرکت «{rejectTarget.company_name}» رد شود؟ این شرکت به فهرست فعال‌ها اضافه نخواهد شد.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                disabled={busyInvitationId != null}
                onClick={() => setRejectTarget(null)}
                variant="ghost"
              >
                انصراف
              </Button>
              <Button
                disabled={busyInvitationId != null}
                onClick={() => void handleRejectConfirmed()}
                variant="secondary"
              >
                {busyInvitationId === rejectTarget.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                رد دعوت
              </Button>
            </div>
          </GlassCard>
        </div>
      ) : null}
    </section>
  );
}
