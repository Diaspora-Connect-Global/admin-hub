import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Link2, Globe, Calendar, Building2, Loader2, Unlink, Shield, UserPlus,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  countriesServedIsoCodesToDisplayList,
  iso2OrLabelToDisplayName,
} from "@/lib/countriesServedIso";
import type { CommunityAdminListItem } from "@/hooks/admin/useAssociation";

interface LinkedAssociation {
  id: string;
  name: string;
  description?: string | null;
}

interface CommunityOverviewTabProps {
  community: NonNullable<unknown> & {
    name?: string;
    visibility?: string;
    joinPolicy?: string;
    communityType?: { name?: string } | null;
    communityTypeId?: string | null;
    countriesServed?: string[] | null;
    embassyCountry?: string | null;
    locationCountry?: string | null;
    description?: string | null;
    memberCount?: number | null;
    createdAt?: string;
    updatedAt?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    website?: string | null;
  };
  linkedAssociations: LinkedAssociation[];
  linkedAssociationsTotal: number;
  linkedAssociationsLoading: boolean;
  linkedAssociationsOffset: number;
  setLinkedAssociationsOffset: (updater: (o: number) => number) => void;
  linkedAssociationsPageSize: number;
  setLinkAssociationOpen: (open: boolean) => void;
  setUnlinkTarget: (target: { id: string; name: string } | null) => void;
  navigate: (path: string) => void;
  t: (key: string) => string;
  communityAdmins: CommunityAdminListItem[];
  communityAdminsLoading: boolean;
  communityAdminsError?: { message: string };
  usingAssignedAdminFallback: boolean;
  setAssignAdminOpen: (open: boolean) => void;
}

export function CommunityOverviewTab({
  community,
  linkedAssociations,
  linkedAssociationsTotal,
  linkedAssociationsLoading,
  linkedAssociationsOffset,
  setLinkedAssociationsOffset,
  linkedAssociationsPageSize,
  setLinkAssociationOpen,
  setUnlinkTarget,
  navigate,
  t,
  communityAdmins,
  communityAdminsLoading,
  communityAdminsError,
  usingAssignedAdminFallback,
  setAssignAdminOpen,
}: CommunityOverviewTabProps) {
  const LINKED_ASSOCIATIONS_PAGE_SIZE = linkedAssociationsPageSize;
  return (
    <TabsContent value="overview" className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass">
          <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Name</p>
                <p className="font-medium">{community.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Visibility</p>
                <p>{community.visibility}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Join policy</p>
                <p>{community.joinPolicy}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Type</p>
                <p>{community.communityType?.name ?? community.communityTypeId ?? "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs">Countries served</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                  <p>
                    {community.countriesServed?.length
                      ? countriesServedIsoCodesToDisplayList(community.countriesServed)
                      : "—"}
                  </p>
                </div>
              </div>
              {community.embassyCountry && community.locationCountry && (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Embassy</p>
                  <p>
                    {iso2OrLabelToDisplayName(community.embassyCountry)} →{" "}
                    {iso2OrLabelToDisplayName(community.locationCountry)}
                  </p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs">Description</p>
                <p>{community.description ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Members</p>
                <p>{community.memberCount ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Created</p>
                <div className="flex items-center gap-2"><Calendar className="h-3 w-3 text-muted-foreground" /><p>{community.createdAt}</p></div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Updated</p>
                <p>{community.updatedAt ?? "—"}</p>
              </div>
              {(community.contactEmail || community.contactPhone || community.website) && (
                <div className="col-span-2 space-y-1">
                  <p className="text-muted-foreground text-xs">Contact</p>
                  <p className="text-sm">
                    {community.contactEmail && <span>{community.contactEmail}</span>}
                    {community.contactPhone && <span className="ml-2">{community.contactPhone}</span>}
                    {community.website && <span className="ml-2">{community.website}</span>}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glass">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">
                    Linked Associations
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      ({linkedAssociationsTotal})
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Associations linked to this community.
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => setLinkAssociationOpen(true)}><Link2 className="mr-2 h-4 w-4" /> Link</Button>
              </div>
            </CardHeader>
            <CardContent>
              {linkedAssociationsLoading && linkedAssociations.length === 0 ? (
                <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading associations…
                </div>
              ) : linkedAssociations.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No linked associations yet.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {linkedAssociations.map((assoc) => (
                      <div key={assoc.id} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-muted/50">
                        <div className="flex items-start gap-2 min-w-0">
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{assoc.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {assoc.description?.trim() || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/associations/${assoc.id}`)}>View</Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setUnlinkTarget({ id: assoc.id, name: assoc.name })}
                            aria-label={t("communities.unlinkAssociation")}
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {linkedAssociationsTotal > 0 ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-3 mt-2 border-t border-border/50 text-xs text-muted-foreground">
                      <span>
                        {linkedAssociationsOffset + 1}–
                        {linkedAssociationsOffset + linkedAssociations.length} of{" "}
                        {linkedAssociationsTotal}
                      </span>
                      {linkedAssociationsTotal > LINKED_ASSOCIATIONS_PAGE_SIZE ? (
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8"
                            disabled={linkedAssociationsOffset === 0}
                            onClick={() =>
                              setLinkedAssociationsOffset((o) =>
                                Math.max(0, o - LINKED_ASSOCIATIONS_PAGE_SIZE),
                              )
                            }
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8"
                            disabled={
                              linkedAssociationsOffset + LINKED_ASSOCIATIONS_PAGE_SIZE >=
                              linkedAssociationsTotal
                            }
                            onClick={() =>
                              setLinkedAssociationsOffset((o) => o + LINKED_ASSOCIATIONS_PAGE_SIZE)
                            }
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Community Admins</CardTitle>
                  <CardDescription className="text-xs mt-0.5 space-y-1">
                    <span className="block">People with admin access to this community.</span>
                    {communityAdminsError && usingAssignedAdminFallback ? (
                      <span className="block text-destructive">
                        Admin list request failed ({communityAdminsError.message}). Showing users from
                        assigned admin IDs on this community.
                      </span>
                    ) : null}
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => setAssignAdminOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Assign</Button>
              </div>
            </CardHeader>
            <CardContent>
              {communityAdminsLoading && communityAdmins.length === 0 ? (
                <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading admins…
                </div>
              ) : (
                <div className="space-y-2">
                  {communityAdmins.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No community admins yet.</p>
                  ) : (
                    communityAdmins.map((admin) => (
                      <div key={admin.id} className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-2 min-w-0">
                          <Shield className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="min-w-0 space-y-1">
                            <p className="text-sm font-medium truncate">{admin.email || "—"}</p>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="secondary" className="text-xs font-normal">{admin.status}</Badge>
                              <Badge variant="outline" className="text-xs font-normal">{admin.adminType}</Badge>
                            </div>
                            {admin.roles && admin.roles.length > 0 ? (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {admin.roles.map((r) => (
                                  <Badge key={r.id} variant="outline" className="text-[10px] font-normal max-w-full truncate">
                                    {r.roleType}
                                    {r.scopeType != null && r.scopeType !== "" ? ` · ${r.scopeType}` : ""}
                                    {r.scopeId != null && r.scopeId !== "" ? ` · ${r.scopeId}` : ""}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive shrink-0 self-start">Remove</Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TabsContent>
  );
}
