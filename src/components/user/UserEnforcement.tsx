import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import {
  useAdminBanUser,
  useAdminUnbanUser,
  useAdminSuspendUser,
  useAdminUnsuspendUser,
  useAdminSendPasswordResetEmail,
  useSetUserLegalHold,
} from "@/hooks/admin";

/**
 * Account enforcement (suspend / unsuspend / ban / unban), plus the password
 * reset mail and the GDPR legal hold, as ONE implementation shared by the users
 * table and the user-detail page.
 *
 * Both surfaces mount `useUserEnforcement()` + `<UserEnforcementDialogs />`, so
 * the dialogs, the validation rules and the toasts cannot drift apart between
 * the row menu and the detail header.
 */

/** The minimum a caller must know about the account being acted on. */
export interface EnforcementTarget {
  id: string;
  name: string;
}

/** Status echoed back by suspend / unsuspend. Everything is nullable. */
export interface AccountStatusResult {
  status?: string | null;
  statusReason?: string | null;
  suspendedUntil?: string | null;
}

export type EnforcementAction = "suspend" | "unsuspend" | "ban" | "unban";

export interface UseUserEnforcementOptions {
  /**
   * Fired after a status-changing action succeeds. `result` carries the new
   * state when the server reported one (suspend / unsuspend) and is null when
   * it did not (ban / unban only return success). Never fired for the password
   * reset mail or a legal hold — neither changes the account's status.
   */
  onStatusChanged?: (
    action: EnforcementAction,
    result: AccountStatusResult | null,
    target: EnforcementTarget,
  ) => void | Promise<void>;
}

export function useUserEnforcement(options: UseUserEnforcementOptions = {}) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { onStatusChanged } = options;

  // ─── Ban / Unban ───────────────────────────────────────────────────────────
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banTargetUser, setBanTargetUser] = useState<EnforcementTarget | null>(null);

  const [adminBanUser, { loading: banLoading }] = useAdminBanUser();
  const [adminUnbanUser, { loading: unbanLoading }] = useAdminUnbanUser();

  const openBanDialog = (user: EnforcementTarget) => {
    setBanTargetUser(user);
    setBanReason("");
    setBanDialogOpen(true);
  };

  const openUnbanDialog = (user: EnforcementTarget) => {
    setBanTargetUser(user);
    setUnbanDialogOpen(true);
  };

  const handleBanUser = async () => {
    if (!banTargetUser) return;
    try {
      await adminBanUser({ variables: { userId: banTargetUser.id, reason: banReason.trim() } });
      toast({
        title: t("users.ban.successTitle"),
        description: t("users.ban.success", { name: banTargetUser.name }),
      });
      setBanDialogOpen(false);
      await onStatusChanged?.("ban", null, banTargetUser);
    } catch (err: unknown) {
      toast({
        title: t("common.errorTitle"),
        description: friendlyErrorMessage(err, t("users.ban.failed")),
        variant: "destructive",
      });
    }
  };

  const handleUnbanUser = async () => {
    if (!banTargetUser) return;
    try {
      await adminUnbanUser({ variables: { userId: banTargetUser.id } });
      toast({
        title: t("users.unban.successTitle"),
        description: t("users.unban.success", { name: banTargetUser.name }),
      });
      setUnbanDialogOpen(false);
      await onStatusChanged?.("unban", null, banTargetUser);
    } catch (err: unknown) {
      toast({
        title: t("common.errorTitle"),
        description: friendlyErrorMessage(err, t("users.unban.failed")),
        variant: "destructive",
      });
    }
  };

  // ─── Suspend / Unsuspend ───────────────────────────────────────────────────
  // Suspension is reversible enforcement, weaker than a ban: access is blocked
  // but the account and its data survive, and an optional duration lets it
  // expire on its own.
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [unsuspendDialogOpen, setUnsuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDurationDays, setSuspendDurationDays] = useState("");
  const [unsuspendReason, setUnsuspendReason] = useState("");
  const [statusTargetUser, setStatusTargetUser] = useState<EnforcementTarget | null>(null);

  const [adminSuspendUser, { loading: suspendLoading }] = useAdminSuspendUser();
  const [adminUnsuspendUser, { loading: unsuspendLoading }] = useAdminUnsuspendUser();

  const openSuspendDialog = (user: EnforcementTarget) => {
    setStatusTargetUser(user);
    setSuspendReason("");
    setSuspendDurationDays("");
    setSuspendDialogOpen(true);
  };

  const openUnsuspendDialog = (user: EnforcementTarget) => {
    setStatusTargetUser(user);
    setUnsuspendReason("");
    setUnsuspendDialogOpen(true);
  };

  const handleSuspendUser = async () => {
    if (!statusTargetUser) return;
    const reason = suspendReason.trim();
    if (!reason) {
      toast({
        title: t("users.suspend.reasonRequiredTitle"),
        description: t("users.suspend.reasonRequired"),
        variant: "destructive",
      });
      return;
    }
    // An empty duration means "indefinite" and is sent as undefined. Anything
    // typed must be a whole positive number of days — a stray "0" or "3.5"
    // would otherwise reach the server as a suspension that never applies.
    const trimmedDuration = suspendDurationDays.trim();
    let durationDays: number | undefined;
    if (trimmedDuration) {
      const parsed = Number(trimmedDuration);
      if (!Number.isInteger(parsed) || parsed < 1) {
        toast({
          title: t("users.suspend.durationInvalidTitle"),
          description: t("users.suspend.durationInvalid"),
          variant: "destructive",
        });
        return;
      }
      durationDays = parsed;
    }
    try {
      const result = await adminSuspendUser({
        variables: { userId: statusTargetUser.id, reason, durationDays },
      });
      toast({
        title: t("users.suspend.successTitle"),
        description: t("users.suspend.success", { name: statusTargetUser.name }),
      });
      setSuspendDialogOpen(false);
      await onStatusChanged?.(
        "suspend",
        result.data?.adminSuspendUser ?? null,
        statusTargetUser,
      );
    } catch (err: unknown) {
      toast({
        title: t("common.errorTitle"),
        description: friendlyErrorMessage(err, t("users.suspend.failed")),
        variant: "destructive",
      });
    }
  };

  const handleUnsuspendUser = async () => {
    if (!statusTargetUser) return;
    try {
      const result = await adminUnsuspendUser({
        variables: {
          userId: statusTargetUser.id,
          reason: unsuspendReason.trim() || undefined,
        },
      });
      toast({
        title: t("users.unsuspend.successTitle"),
        description: t("users.unsuspend.success", { name: statusTargetUser.name }),
      });
      setUnsuspendDialogOpen(false);
      await onStatusChanged?.(
        "unsuspend",
        result.data?.adminUnsuspendUser ?? null,
        statusTargetUser,
      );
    } catch (err: unknown) {
      toast({
        title: t("common.errorTitle"),
        description: friendlyErrorMessage(err, t("users.unsuspend.failed")),
        variant: "destructive",
      });
    }
  };

  // ─── Password reset ────────────────────────────────────────────────────────
  // The admin triggers the mail but never sees or sets the password. On success
  // the dialog switches to a result view showing the MASKED address the server
  // reports, so the admin can confirm it went to the account they meant.
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<EnforcementTarget | null>(null);
  const [resetSentToMasked, setResetSentToMasked] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const [adminSendPasswordResetEmail, { loading: resetLoading }] =
    useAdminSendPasswordResetEmail();

  const openResetPasswordDialog = (user: EnforcementTarget) => {
    setResetTargetUser(user);
    setResetSentToMasked(null);
    setResetSent(false);
    setResetPasswordOpen(true);
  };

  const handleSendPasswordReset = async () => {
    if (!resetTargetUser) return;
    try {
      const result = await adminSendPasswordResetEmail({
        variables: { userId: resetTargetUser.id },
      });
      const masked = result.data?.adminSendPasswordResetEmail?.sentToEmailMasked ?? null;
      setResetSentToMasked(masked);
      setResetSent(true);
      toast({
        title: t("users.resetPassword.successTitle"),
        description: masked
          ? t("users.resetPassword.sentTo", { email: masked })
          : t("users.resetPassword.sentNoAddress"),
      });
      // Deliberately no status callback: mailing a reset link does not change
      // the account status, so there is nothing for a caller to refresh.
    } catch (err: unknown) {
      toast({
        title: t("common.errorTitle"),
        description: friendlyErrorMessage(err, t("users.resetPassword.failed")),
        variant: "destructive",
      });
    }
  };

  // ─── Legal hold ────────────────────────────────────────────────────────────
  // Legal hold (GDPR Art. 17(3)(e)) — pins an account against the nightly
  // retention purge. NOT an enforcement action: it does not restrict the user at
  // all, it only stops their data being erased while a claim is live. A hold
  // DEFERS a deletion; the purge runs on the first night after it is released.
  const [legalHoldDialogOpen, setLegalHoldDialogOpen] = useState(false);
  const [legalHoldReason, setLegalHoldReason] = useState("");
  const [legalHoldTarget, setLegalHoldTarget] = useState<EnforcementTarget | null>(null);
  const [legalHoldRelease, setLegalHoldRelease] = useState(false);
  const [setUserLegalHold, { loading: legalHoldLoading }] = useSetUserLegalHold();

  const openLegalHoldDialog = (user: EnforcementTarget, release: boolean) => {
    setLegalHoldTarget(user);
    setLegalHoldRelease(release);
    setLegalHoldReason("");
    setLegalHoldDialogOpen(true);
  };

  const handleSetLegalHold = async () => {
    if (!legalHoldTarget) return;
    const hold = !legalHoldRelease;
    // The server rejects a hold without a reason; check here too so the admin
    // gets an inline nudge instead of a round-trip error.
    if (hold && !legalHoldReason.trim()) {
      toast({
        title: t("users.legalHold.reasonRequiredTitle"),
        description: t("users.legalHold.reasonRequired"),
        variant: "destructive",
      });
      return;
    }
    try {
      await setUserLegalHold({
        variables: {
          userId: legalHoldTarget.id,
          hold,
          reason: legalHoldReason.trim() || undefined,
        },
      });
      toast({
        title: hold ? t("users.legalHold.appliedTitle") : t("users.legalHold.releasedTitle"),
        description: hold
          ? t("users.legalHold.applied", { name: legalHoldTarget.name })
          : t("users.legalHold.released", { name: legalHoldTarget.name }),
      });
      setLegalHoldDialogOpen(false);
    } catch (err: unknown) {
      toast({
        title: t("common.errorTitle"),
        description: friendlyErrorMessage(err, t("users.legalHold.failed")),
        variant: "destructive",
      });
    }
  };

  return {
    // Openers — the only part a caller normally touches.
    openBanDialog,
    openUnbanDialog,
    openSuspendDialog,
    openUnsuspendDialog,
    openResetPasswordDialog,
    openLegalHoldDialog,
    // Per-action in-flight flags, for disabling the buttons that opened them.
    banLoading,
    unbanLoading,
    suspendLoading,
    unsuspendLoading,
    resetLoading,
    legalHoldLoading,
    // Dialog wiring — consumed by <UserEnforcementDialogs />.
    banDialogOpen,
    setBanDialogOpen,
    unbanDialogOpen,
    setUnbanDialogOpen,
    banReason,
    setBanReason,
    banTargetUser,
    handleBanUser,
    handleUnbanUser,
    suspendDialogOpen,
    setSuspendDialogOpen,
    unsuspendDialogOpen,
    setUnsuspendDialogOpen,
    suspendReason,
    setSuspendReason,
    suspendDurationDays,
    setSuspendDurationDays,
    unsuspendReason,
    setUnsuspendReason,
    statusTargetUser,
    handleSuspendUser,
    handleUnsuspendUser,
    resetPasswordOpen,
    setResetPasswordOpen,
    resetTargetUser,
    resetSent,
    resetSentToMasked,
    handleSendPasswordReset,
    legalHoldDialogOpen,
    setLegalHoldDialogOpen,
    legalHoldRelease,
    legalHoldReason,
    setLegalHoldReason,
    legalHoldTarget,
    handleSetLegalHold,
  };
}

export type UserEnforcementController = ReturnType<typeof useUserEnforcement>;

/** Renders every enforcement dialog. Mount once per page. */
export function UserEnforcementDialogs({
  enforcement,
}: {
  enforcement: UserEnforcementController;
}) {
  const { t } = useTranslation();
  const e = enforcement;

  return (
    <>
      {/* Suspend User Dialog */}
      <Dialog open={e.suspendDialogOpen} onOpenChange={e.setSuspendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("users.suspend.title")}</DialogTitle>
            <DialogDescription>
              {t("users.suspend.description", { name: e.statusTargetUser?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suspend-reason">
                {t("users.suspend.reasonLabel")} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="suspend-reason"
                placeholder={t("users.suspend.reasonPlaceholder")}
                value={e.suspendReason}
                onChange={(ev) => e.setSuspendReason(ev.target.value)}
                disabled={e.suspendLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suspend-duration">{t("users.suspend.durationLabel")}</Label>
              <Input
                id="suspend-duration"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                placeholder={t("users.suspend.durationPlaceholder")}
                value={e.suspendDurationDays}
                onChange={(ev) => e.setSuspendDurationDays(ev.target.value)}
                disabled={e.suspendLoading}
              />
              <p className="text-xs text-muted-foreground">{t("users.suspend.durationHint")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => e.setSuspendDialogOpen(false)}
              disabled={e.suspendLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={e.handleSuspendUser}
              disabled={e.suspendLoading || !e.suspendReason.trim()}
            >
              {e.suspendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("users.suspend.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsuspend User Dialog */}
      <Dialog open={e.unsuspendDialogOpen} onOpenChange={e.setUnsuspendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("users.unsuspend.title")}</DialogTitle>
            <DialogDescription>
              {t("users.unsuspend.description", { name: e.statusTargetUser?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="unsuspend-reason">{t("users.unsuspend.reasonLabel")}</Label>
            <Textarea
              id="unsuspend-reason"
              placeholder={t("users.unsuspend.reasonPlaceholder")}
              value={e.unsuspendReason}
              onChange={(ev) => e.setUnsuspendReason(ev.target.value)}
              disabled={e.unsuspendLoading}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => e.setUnsuspendDialogOpen(false)}
              disabled={e.unsuspendLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={e.handleUnsuspendUser} disabled={e.unsuspendLoading}>
              {e.unsuspendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("users.unsuspend.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Password Reset Email Dialog */}
      <Dialog open={e.resetPasswordOpen} onOpenChange={e.setResetPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("users.resetPassword.title")}</DialogTitle>
            <DialogDescription>
              {t("users.resetPassword.description", { name: e.resetTargetUser?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          {e.resetSent ? (
            /* Result view: the server reports only a MASKED address, which is
               what the admin needs to confirm the destination. */
            <p className="py-4 text-sm text-muted-foreground">
              {e.resetSentToMasked
                ? t("users.resetPassword.sentTo", { email: e.resetSentToMasked })
                : t("users.resetPassword.sentNoAddress")}
            </p>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">
              {t("users.resetPassword.confirmBody")}
            </p>
          )}
          <DialogFooter>
            {e.resetSent ? (
              <Button onClick={() => e.setResetPasswordOpen(false)}>
                {t("users.resetPassword.done")}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => e.setResetPasswordOpen(false)}
                  disabled={e.resetLoading}
                >
                  {t("common.cancel")}
                </Button>
                <Button onClick={e.handleSendPasswordReset} disabled={e.resetLoading}>
                  {e.resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("users.resetPassword.confirm")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban User Dialog */}
      <Dialog open={e.banDialogOpen} onOpenChange={e.setBanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("users.ban.title")}</DialogTitle>
            <DialogDescription>
              {t("users.ban.description", { name: e.banTargetUser?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ban-reason">
                {t("users.ban.reasonLabel")} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="ban-reason"
                placeholder={t("users.ban.reasonPlaceholder")}
                value={e.banReason}
                onChange={(ev) => e.setBanReason(ev.target.value)}
                disabled={e.banLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => e.setBanDialogOpen(false)}
              disabled={e.banLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={e.handleBanUser}
              disabled={e.banLoading || !e.banReason.trim()}
            >
              {e.banLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("users.ban.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unban User Dialog */}
      <Dialog open={e.unbanDialogOpen} onOpenChange={e.setUnbanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("users.unban.title")}</DialogTitle>
            <DialogDescription>
              {t("users.unban.description", { name: e.banTargetUser?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => e.setUnbanDialogOpen(false)}
              disabled={e.unbanLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={e.handleUnbanUser} disabled={e.unbanLoading}>
              {e.unbanLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("users.unban.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legal Hold Dialog */}
      <Dialog open={e.legalHoldDialogOpen} onOpenChange={e.setLegalHoldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {e.legalHoldRelease
                ? t("users.legalHold.releaseTitle")
                : t("users.legalHold.applyTitle")}
            </DialogTitle>
            <DialogDescription>
              {e.legalHoldRelease
                ? t("users.legalHold.releaseDescription", { name: e.legalHoldTarget?.name ?? "" })
                : t("users.legalHold.applyDescription", { name: e.legalHoldTarget?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>

          {!e.legalHoldRelease && (
            <div className="space-y-2">
              <Label htmlFor="legal-hold-reason">{t("users.legalHold.reasonLabel")}</Label>
              <Textarea
                id="legal-hold-reason"
                value={e.legalHoldReason}
                onChange={(ev) => e.setLegalHoldReason(ev.target.value)}
                placeholder={t("users.legalHold.reasonPlaceholder")}
                disabled={e.legalHoldLoading}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => e.setLegalHoldDialogOpen(false)}
              disabled={e.legalHoldLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={e.handleSetLegalHold} disabled={e.legalHoldLoading}>
              {e.legalHoldLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {e.legalHoldRelease
                ? t("users.legalHold.confirmRelease")
                : t("users.legalHold.confirmApply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
