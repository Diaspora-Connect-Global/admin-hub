/**
 * Placed at app root. Silent while the admin is active; in the last minute before an
 * inactivity sign-out it shows a short countdown with "Stay signed in".
 */

import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIdleSession } from "@/hooks/auth/useTokenExpiry";

export function TokenExpiryMonitor() {
  const { t } = useTranslation();
  const { secondsLeft, stay } = useIdleSession();

  return (
    <AlertDialog open={secondsLeft !== null}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("idleSession.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("idleSession.body", { count: secondsLeft ?? 0 })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={stay} autoFocus>
            {t("idleSession.stay")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
