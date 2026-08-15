import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Mail, Phone, Calendar } from "lucide-react";
import type { AdminUserProfile } from "@/hooks/user";

interface UserOverviewTabProps {
  profile: AdminUserProfile | null;
  /** Join date — the profile query does not always carry one. */
  createdAt?: string | null;
  t: (key: string) => string;
}

function Field({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        {value ? icon : null}
        <p className="text-sm">{value?.trim() ? value : "—"}</p>
      </div>
    </div>
  );
}

/**
 * Profile facts for the selected user, read from `getProfile`.
 *
 * Two things are deliberately NOT shown:
 *  - the platform role. The users list hard-codes "Individual" for everyone
 *    (`mapApiUserToRow`), and no query returns a real role, so printing one
 *    would be fabricating an authorisation fact on an admin screen.
 *  - community/association memberships. No backend query exposes a user's
 *    memberships yet; the card says so instead of showing placeholder rows.
 */
export function UserOverviewTab({ profile, createdAt, t }: UserOverviewTabProps) {
  const fullName = [profile?.firstName, profile?.middleName, profile?.lastName]
    .filter((part) => part && part.trim())
    .join(" ");
  const joined = createdAt ? new Date(createdAt) : null;
  const joinedValid = joined && !Number.isNaN(joined.getTime());

  return (
    <TabsContent value="overview" className="space-y-4">
      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("users.detail.overview.basicInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("common.name")} value={fullName} />
          <Field
            label={t("common.email")}
            value={profile?.email}
            icon={<Mail className="h-3 w-3 text-muted-foreground" />}
          />
          <Field
            label={t("common.phone")}
            value={profile?.phone}
            icon={<Phone className="h-3 w-3 text-muted-foreground" />}
          />
          <Field
            label={t("users.detail.overview.joined")}
            value={joinedValid ? joined.toLocaleDateString() : undefined}
            icon={<Calendar className="h-3 w-3 text-muted-foreground" />}
          />
          <div>
            <p className="text-xs text-muted-foreground">{t("users.verification")}</p>
            <StatusBadge variant={profile?.isVerified ? "active" : "inactive"}>
              {profile?.isVerified ? t("users.verified") : t("users.unverified")}
            </StatusBadge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("users.role")}</p>
            <p className="text-sm text-muted-foreground">
              {t("users.detail.overview.roleUnavailable")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("users.detail.overview.profile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("users.detail.overview.headline")} value={profile?.headline} />
            <Field label={t("users.detail.overview.gender")} value={profile?.gender} />
            <Field label={t("users.detail.overview.location")} value={profile?.location} />
            <Field label={t("users.detail.overview.city")} value={profile?.city} />
            <Field
              label={t("users.detail.overview.residenceCountry")}
              value={profile?.residenceCountry}
            />
            <Field
              label={t("users.detail.overview.countryOfOrigin")}
              value={profile?.countryOfOrigin}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("users.detail.overview.bio")}</p>
            <p className="whitespace-pre-line text-sm">
              {profile?.bio?.trim() ? profile.bio : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("users.detail.overview.memberships")}</CardTitle>
          <CardDescription>{t("users.detail.overview.membershipsUnavailable")}</CardDescription>
        </CardHeader>
      </Card>
    </TabsContent>
  );
}
