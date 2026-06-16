import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MultiSelect } from "@/components/ui/multi-select";
import { Globe, Loader2, Upload, X } from "lucide-react";
import type { CommunityType } from "@/services/networks/graphql/admin";

export interface EditForm {
  name: string;
  description: string;
  communityType: string;
  visibility: "PUBLIC" | "PRIVATE";
  joinPolicy: "FREE" | "PAID";
  paymentType: "NONE" | "ONE_TIME" | "SUBSCRIPTION";
  priceAmount: string;
  priceCurrency: string;
  countriesServed: string[];
  avatarFile: File | null;
  bannerFile: File | null;
  rules: string;
  whoCanPost: "ADMIN_ONLY" | "ALL_MEMBERS";
  groupCreationPermission: string;
  postModeration: boolean;
  address: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  embassyCountry: string;
  locationCountry: string;
}

interface EditCommunityDialogProps {
  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
  community: { name?: string; avatarUrl?: string; coverImageUrl?: string };
  editForm: EditForm;
  setEditForm: Dispatch<SetStateAction<EditForm>>;
  communityTypesLoading: boolean;
  communityTypes: CommunityType[];
  countryOptions: { label: string; value: string }[];
  allCountries: string[];
  handleEditAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveAvatar: () => void;
  handleRemoveBanner: () => void;
  removingAvatar: boolean;
  removingBanner: boolean;
  handleSaveEdit: () => void;
  savingEdit: boolean;
}

export function EditCommunityDialog({
  editOpen,
  setEditOpen,
  t,
  community,
  editForm,
  setEditForm,
  communityTypesLoading,
  communityTypes,
  countryOptions,
  allCountries,
  handleEditAvatarUpload,
  handleEditBannerUpload,
  handleRemoveAvatar,
  handleRemoveBanner,
  removingAvatar,
  removingBanner,
  handleSaveEdit,
  savingEdit,
}: EditCommunityDialogProps) {
  return (
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t("communities.editCommunity")}</DialogTitle>
            <DialogDescription>{t("communities.editCommunityFormDesc", { name: community.name })}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">{t("communities.form.basicInfo")}</h3>

                <div className="space-y-2">
                  <Label>{t("communities.communityName")} <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder={t("communities.form.namePlaceholder")}
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("common.description")}</Label>
                  <Textarea
                    placeholder={t("communities.form.descriptionPlaceholder")}
                    value={editForm.description}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("communities.communityType")} <span className="text-destructive">*</span></Label>
                  <Select value={editForm.communityType} onValueChange={(value) => setEditForm((prev) => ({ ...prev, communityType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={communityTypesLoading ? "Loading types..." : t("communities.form.selectType")} />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {communityTypesLoading ? (
                        <SelectItem value="__loading__" disabled>Loading...</SelectItem>
                      ) : communityTypes.length === 0 ? (
                        <SelectItem value="__empty__" disabled>No types available</SelectItem>
                      ) : (
                        communityTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Visibility <span className="text-destructive">*</span></Label>
                    <Select
                      value={editForm.visibility}
                      onValueChange={(v: "PUBLIC" | "PRIVATE") => setEditForm((prev) => ({ ...prev, visibility: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Join policy <span className="text-destructive">*</span></Label>
                    <Select
                      value={editForm.joinPolicy}
                      onValueChange={(v: "FREE" | "PAID") => setEditForm((prev) => ({ ...prev, joinPolicy: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="FREE">Free</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment type <span className="text-destructive">*</span></Label>
                  <Select
                    value={editForm.paymentType}
                    onValueChange={(v: "NONE" | "ONE_TIME" | "SUBSCRIPTION") =>
                      setEditForm((prev) => ({ ...prev, paymentType: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="ONE_TIME">One-time</SelectItem>
                      <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(editForm.joinPolicy === "PAID" || editForm.paymentType !== "NONE") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price amount</Label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        placeholder="0.00"
                        value={editForm.priceAmount}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, priceAmount: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={editForm.priceCurrency} onValueChange={(v) => setEditForm((prev) => ({ ...prev, priceCurrency: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{t("communities.countriesServed")}</Label>
                  <MultiSelect
                    options={countryOptions}
                    selected={editForm.countriesServed}
                    onChange={(selected) => setEditForm((prev) => ({ ...prev, countriesServed: selected }))}
                    placeholder={t("communities.form.selectCountries")}
                    searchPlaceholder={t("common.search")}
                    maxDisplay={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("communities.form.logoBanner")}</Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Avatar / logo */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("communities.form.logo")}</Label>
                      <div className="border-2 border-dashed border-border rounded-md p-4 text-center hover:border-primary/50 transition-colors">
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleEditAvatarUpload} className="hidden" id="edit-avatar-upload" />
                        <label htmlFor="edit-avatar-upload" className="cursor-pointer flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{t("communities.form.uploadImage")}</span>
                          <span className="text-xs text-muted-foreground">{t("communities.form.acceptedFormats")}</span>
                        </label>
                        {editForm.avatarFile && (
                          <div className="mt-2 flex items-center justify-center gap-2">
                            <Badge variant="secondary" className="max-w-[180px] truncate">{editForm.avatarFile.name}</Badge>
                            <X
                              className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-destructive"
                              onClick={() => setEditForm((prev) => ({ ...prev, avatarFile: null }))}
                            />
                          </div>
                        )}
                        {!editForm.avatarFile && community.avatarUrl && (
                          <div className="mt-3 flex flex-col items-center gap-2">
                            <img src={community.avatarUrl} alt="" className="h-16 w-16 rounded-md object-cover border border-border" />
                            <Button type="button" variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={handleRemoveAvatar} disabled={removingAvatar}>
                              {removingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                              <span className="ml-1">{t("common.remove")}</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Banner / cover */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t("communities.form.banner")}</Label>
                      <div className="border-2 border-dashed border-border rounded-md p-4 text-center hover:border-primary/50 transition-colors">
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleEditBannerUpload} className="hidden" id="edit-banner-upload" />
                        <label htmlFor="edit-banner-upload" className="cursor-pointer flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{t("communities.form.uploadImage")}</span>
                          <span className="text-xs text-muted-foreground">{t("communities.form.acceptedFormats")}</span>
                        </label>
                        {editForm.bannerFile && (
                          <div className="mt-2 flex items-center justify-center gap-2">
                            <Badge variant="secondary" className="max-w-[180px] truncate">{editForm.bannerFile.name}</Badge>
                            <X
                              className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-destructive"
                              onClick={() => setEditForm((prev) => ({ ...prev, bannerFile: null }))}
                            />
                          </div>
                        )}
                        {!editForm.bannerFile && community.coverImageUrl && (
                          <div className="mt-3 flex flex-col items-center gap-2">
                            <img src={community.coverImageUrl} alt="" className="h-16 w-full max-w-xs rounded-md object-cover border border-border" />
                            <Button type="button" variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={handleRemoveBanner} disabled={removingBanner}>
                              {removingBanner ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                              <span className="ml-1">{t("common.remove")}</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("communities.form.rulesGuidelines")}</Label>
                  <Textarea
                    placeholder={t("communities.form.rulesPlaceholder")}
                    value={editForm.rules}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, rules: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("communities.form.whoCanPost")}</Label>
                  <Select
                    value={editForm.whoCanPost}
                    onValueChange={(value: "ADMIN_ONLY" | "ALL_MEMBERS") =>
                      setEditForm((prev) => ({ ...prev, whoCanPost: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="ADMIN_ONLY">{t("communities.form.adminsOnly")}</SelectItem>
                      <SelectItem value="ALL_MEMBERS">All members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("communities.form.groupCreation")} <span className="text-destructive">*</span></Label>
                    <Select
                      value={editForm.groupCreationPermission}
                      onValueChange={(value) => setEditForm((prev) => ({ ...prev, groupCreationPermission: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="Admins Only">{t("communities.form.adminsOnly")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-border rounded-md">
                    <div>
                      <Label>{t("communities.form.postModeration")}</Label>
                      <p className="text-xs text-muted-foreground">{t("communities.form.postModerationDesc")}</p>
                    </div>
                    <Switch
                      checked={editForm.postModeration}
                      onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, postModeration: checked }))}
                    />
                  </div>
                </div>
              </div>

              {editForm.communityType && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">{t("communities.form.contactInfo")}</h3>

                  <div className="space-y-2">
                    <Label>{t("communities.form.address")}</Label>
                    <Input
                      placeholder={t("communities.form.addressPlaceholder")}
                      value={editForm.address}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("communities.form.contactEmail")}</Label>
                      <Input
                        type="email"
                        placeholder={t("communities.form.contactEmailPlaceholder")}
                        value={editForm.contactEmail}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("communities.form.contactPhone")}</Label>
                      <Input
                        placeholder={t("communities.form.contactPhonePlaceholder")}
                        value={editForm.contactPhone}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("communities.form.website")}</Label>
                    <Input
                      placeholder={t("communities.form.websitePlaceholder")}
                      value={editForm.website}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {communityTypes.find(t => t.id === editForm.communityType)?.isEmbassy && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-info" />
                    {t("communities.form.embassyInfo")}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("communities.form.embassyCountry")} <span className="text-destructive">*</span></Label>
                      <Select
                        value={editForm.embassyCountry}
                        onValueChange={(value) => setEditForm((prev) => ({ ...prev, embassyCountry: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("communities.form.embassyCountryPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border max-h-64">
                          {allCountries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("communities.form.locationCountry")} <span className="text-destructive">*</span></Label>
                      <Select
                        value={editForm.locationCountry}
                        onValueChange={(value) => setEditForm((prev) => ({ ...prev, locationCountry: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("communities.form.locationCountryPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border max-h-64">
                          {allCountries.map((country) => (
                            <SelectItem key={`loc-${country}`} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={savingEdit}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                t("common.save")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
