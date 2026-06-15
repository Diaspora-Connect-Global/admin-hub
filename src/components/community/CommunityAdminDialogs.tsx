import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface AssociationOption {
  id: string;
  name: string;
}

interface EligibleAdmin {
  id: string;
  email: string;
}

interface LinkAssociationDialogProps {
  linkAssociationOpen: boolean;
  setLinkAssociationOpen: (open: boolean) => void;
  setSelectedAssociationId: (id: string) => void;
  selectedAssociationId: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
  community: { name?: string };
  associationsLoading: boolean;
  associationOptions: AssociationOption[];
  linkingAssociation: boolean;
  handleLinkAssociationSubmit: () => void;
}

export function LinkAssociationDialog({
  linkAssociationOpen,
  setLinkAssociationOpen,
  setSelectedAssociationId,
  selectedAssociationId,
  t,
  community,
  associationsLoading,
  associationOptions,
  linkingAssociation,
  handleLinkAssociationSubmit,
}: LinkAssociationDialogProps) {
  return (
      <Dialog
        open={linkAssociationOpen}
        onOpenChange={(open) => {
          setLinkAssociationOpen(open);
          if (!open) setSelectedAssociationId("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("communities.linkAssociationTo")}</DialogTitle>
            <DialogDescription>{t("communities.linkAssociationDesc", { name: community.name })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>
                {t("communities.selectAssociations")} <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedAssociationId} onValueChange={setSelectedAssociationId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("communities.searchAssociations")} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-64">
                  {associationsLoading ? (
                    <SelectItem value="__loading" disabled>
                      {t("common.loading")}
                    </SelectItem>
                  ) : associationOptions.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      {t("common.noData")}
                    </SelectItem>
                  ) : (
                    associationOptions.map((assoc) => (
                      <SelectItem key={assoc.id} value={assoc.id}>
                        {assoc.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLinkAssociationOpen(false)}
              disabled={linkingAssociation}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={handleLinkAssociationSubmit} disabled={linkingAssociation || !selectedAssociationId}>
              {linkingAssociation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                t("communities.linkAssociation")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}

interface AssignAdminDialogProps {
  assignAdminOpen: boolean;
  handleAssignAdminDialogChange: (open: boolean) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
  assignAdminTab: "existing" | "create";
  setAssignAdminTab: (tab: "existing" | "create") => void;
  selectedExistingAdminId: string;
  setSelectedExistingAdminId: (id: string) => void;
  listAdminsLoading: boolean;
  assignAdminSubmitting: boolean;
  eligibleExistingAdmins: EligibleAdmin[];
  newAdminEmail: string;
  setNewAdminEmail: (v: string) => void;
  newAdminPassword: string;
  setNewAdminPassword: (v: string) => void;
  newAdminConfirmPassword: string;
  setNewAdminConfirmPassword: (v: string) => void;
  handleAssignExistingCommunityAdmin: () => void;
  handleCreateCommunityAdmin: () => void;
}

export function AssignAdminDialog({
  assignAdminOpen,
  handleAssignAdminDialogChange,
  t,
  assignAdminTab,
  setAssignAdminTab,
  selectedExistingAdminId,
  setSelectedExistingAdminId,
  listAdminsLoading,
  assignAdminSubmitting,
  eligibleExistingAdmins,
  newAdminEmail,
  setNewAdminEmail,
  newAdminPassword,
  setNewAdminPassword,
  newAdminConfirmPassword,
  setNewAdminConfirmPassword,
  handleAssignExistingCommunityAdmin,
  handleCreateCommunityAdmin,
}: AssignAdminDialogProps) {
  return (
      <Dialog open={assignAdminOpen} onOpenChange={handleAssignAdminDialogChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("communities.assignAdmin.title")}</DialogTitle>
            <DialogDescription>{t("communities.assignAdmin.description")}</DialogDescription>
          </DialogHeader>
          <Tabs value={assignAdminTab} onValueChange={(v) => setAssignAdminTab(v as "existing" | "create")} className="py-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">{t("communities.assignAdmin.tabExisting")}</TabsTrigger>
              <TabsTrigger value="create">{t("communities.assignAdmin.tabCreate")}</TabsTrigger>
            </TabsList>
            <TabsContent value="existing" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{t("communities.assignAdmin.selectAdmin")}</Label>
                <Select
                  value={selectedExistingAdminId || "__none__"}
                  onValueChange={(v) => setSelectedExistingAdminId(v === "__none__" ? "" : v)}
                  disabled={listAdminsLoading || assignAdminSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("communities.assignAdmin.selectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border max-h-64">
                    <SelectItem value="__none__">{t("communities.assignAdmin.selectPlaceholder")}</SelectItem>
                    {listAdminsLoading ? (
                      <SelectItem value="__loading" disabled>
                        {t("communities.assignAdmin.loadingAdmins")}
                      </SelectItem>
                    ) : eligibleExistingAdmins.length === 0 ? (
                      <SelectItem value="__empty" disabled>
                        {t("communities.assignAdmin.noEligibleAdmins")}
                      </SelectItem>
                    ) : (
                      eligibleExistingAdmins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.email}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="create" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="assign-admin-email">{t("common.email")}</Label>
                <Input
                  id="assign-admin-email"
                  type="email"
                  autoComplete="off"
                  placeholder={t("communities.assignAdmin.emailPlaceholder")}
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  disabled={assignAdminSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-admin-password">{t("communities.assignAdmin.initialPassword")}</Label>
                <Input
                  id="assign-admin-password"
                  type="password"
                  autoComplete="new-password"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  disabled={assignAdminSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-admin-confirm">{t("communities.assignAdmin.confirmPassword")}</Label>
                <Input
                  id="assign-admin-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={newAdminConfirmPassword}
                  onChange={(e) => setNewAdminConfirmPassword(e.target.value)}
                  disabled={assignAdminSubmitting}
                />
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAssignAdminDialogChange(false)}
              disabled={assignAdminSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              disabled={
                assignAdminSubmitting ||
                (assignAdminTab === "existing" &&
                  (!selectedExistingAdminId || listAdminsLoading || eligibleExistingAdmins.length === 0))
              }
              onClick={
                assignAdminTab === "existing"
                  ? handleAssignExistingCommunityAdmin
                  : handleCreateCommunityAdmin
              }
            >
              {assignAdminSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : assignAdminTab === "existing" ? (
                t("communities.assignAdmin.assignRole")
              ) : (
                t("communities.assignAdmin.createAdmin")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
