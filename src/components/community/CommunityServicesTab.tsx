import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Save, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { friendlyErrorMessage } from "@/lib/graphqlErrors";
import { ServiceCheckboxGrid } from "@/components/services/ServiceCheckboxGrid";
import {
  ALL_SERVICE_KEYS,
  resolveEnabledServices,
  sortServiceKeys,
} from "@/constants/communityServices";
import { useUpdateCommunityServices } from "@/hooks/admin";

interface CommunityServicesTabProps {
  communityId: string;
  /** Current enabled services from the community record. Null/undefined = legacy → all. */
  enabledServices: string[] | null | undefined;
}

/**
 * Detail-page "Services" editor. Shows the full catalog with checkboxes reflecting
 * the community's enabled services. Saving simply replaces the list — no
 * confirmation/blocking (member data is preserved server-side regardless).
 */
export function CommunityServicesTab({
  communityId,
  enabledServices,
}: CommunityServicesTabProps) {
  const { t } = useTranslation();
  const [updateServices, { loading: saving }] = useUpdateCommunityServices();
  const [selected, setSelected] = useState<string[]>(() =>
    resolveEnabledServices(enabledServices),
  );

  // Re-seed local state whenever the persisted value changes (e.g. after refetch).
  useEffect(() => {
    setSelected(resolveEnabledServices(enabledServices));
  }, [enabledServices]);

  const toggle = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleSave = async () => {
    try {
      await updateServices({
        variables: {
          input: { communityId, services: sortServiceKeys(selected) },
        },
      });
      toast({ title: t("services.saved") });
    } catch (err) {
      toast({
        title: t("common.error", "Error"),
        description: friendlyErrorMessage(err, "Failed to update services"),
        variant: "destructive",
      });
    }
  };

  return (
    <TabsContent value="services" className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base">{t("services.sectionTitle")}</CardTitle>
          <CardDescription>{t("services.sectionDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ServiceCheckboxGrid
            idPrefix="community-service"
            selected={selected}
            onToggle={toggle}
            onSelectAll={() => setSelected([...ALL_SERVICE_KEYS])}
            onClearAll={() => setSelected([])}
            disabled={saving}
          />
          <div className="flex justify-end border-t border-border pt-4">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t("services.save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
