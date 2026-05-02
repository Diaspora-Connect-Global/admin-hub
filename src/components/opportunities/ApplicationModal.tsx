import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle,
  XCircle,
  CheckCircle,
  Download,
  FileText,
  Mail,
  Phone,
  MapPin,
  User,
  Clock,
} from "lucide-react";
import { Applicant, ApplicantStatus } from "@/types/opportunities";

interface ApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: Applicant | null;
  onReview: () => void;
  onMessage: () => void;
  onReject: () => void;
  onAccept: () => void;
}

const statusColors: Record<ApplicantStatus, BadgeProps["variant"]> = {
  PENDING: "secondary",
  REVIEWING: "default",
  ACCEPTED: "default",
  REJECTED: "destructive",
  WITHDRAWN: "secondary",
};

export function ApplicationModal({
  open,
  onOpenChange,
  applicant,
  onReview,
  onMessage,
  onReject,
  onAccept,
}: ApplicationModalProps) {
  if (!applicant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{applicant.name}</DialogTitle>
              <Badge variant={statusColors[applicant.status]} className="mt-2 capitalize">
                {applicant.status.toLowerCase()}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] px-6">
          {/* Candidate Info */}
          <div className="space-y-4 pb-4">
            <h4 className="font-medium">Candidate Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{applicant.email}</span>
              </div>
              {applicant.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{applicant.phone}</span>
                </div>
              )}
              {applicant.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{applicant.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Applied: {applicant.appliedAt}</span>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Submitted Responses */}
          <div className="space-y-4 pb-4">
            <h4 className="font-medium">Submitted Responses</h4>
            {applicant.coverLetter && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Cover Letter</p>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm whitespace-pre-wrap">{applicant.coverLetter}</p>
                </div>
              </div>
            )}
            {(applicant as Applicant & { responses?: Record<string, string> }).responses && Object.entries((applicant as Applicant & { responses?: Record<string, string> }).responses || {}).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{key}</p>
                <p className="text-sm">{value}</p>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Attachments */}
          <div className="space-y-4 pb-4">
            <h4 className="font-medium">Attachments</h4>
            {(applicant as Applicant & { cvUrl?: string }).cvUrl ? (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Resume / CV</p>
                    <p className="text-xs text-muted-foreground">PDF Document</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No attachments</p>
            )}
          </div>

          <Separator className="my-4" />

          {/* History & Notes */}
          <div className="space-y-4 pb-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">History & Notes</h4>
            </div>

            {/* Status Timeline */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <p className="text-sm">Application submitted</p>
                  <p className="text-xs text-muted-foreground">{applicant.appliedAt}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {(applicant as Applicant & { notes?: Array<{ id: string; authorName: string; createdAt: string; content: string; isPrivate?: boolean }> }).notes && (applicant as Applicant & { notes?: Array<{ id: string; authorName: string; createdAt: string; content: string; isPrivate?: boolean }> }).notes!.length > 0 && (
              <div className="space-y-2">
                {(applicant as Applicant & { notes?: Array<{ id: string; authorName: string; createdAt: string; content: string; isPrivate?: boolean }> }).notes!.map((note) => (
                  <div key={note.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{note.authorName}</span>
                      <span className="text-xs text-muted-foreground">{note.createdAt}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{note.content}</p>
                    {note.isPrivate && (
                      <Badge variant="outline" className="mt-1 text-xs">Private</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter className="px-6 py-4">
          <div className="flex w-full justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={onReview}>
                <CheckCircle className="h-4 w-4" />
                Mark Reviewing
              </Button>
              <Button variant="outline" className="gap-2" onClick={onMessage}>
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>
              <Button variant="outline" className="gap-2" onClick={onReject}>
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
              <Button className="gap-2" onClick={onAccept}>
                <CheckCircle className="h-4 w-4" />
                Accept
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
