import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Paperclip } from "lucide-react";
import { Applicant } from "@/types/opportunities";

interface MessageApplicantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: Applicant | null;
  onSend: (message: string, template: string) => void;
}

const templates = {
  custom: "",
  shortlist: `Dear [Name],

Thank you for your application. We are pleased to inform you that you have been shortlisted for the next stage of our selection process.

We will be in touch shortly with further details.

Best regards`,
  interview: `Dear [Name],

Thank you for your interest in this opportunity. We would like to invite you for an interview.

Please reply to this message with your availability for the coming week.

Best regards`,
  rejection: `Dear [Name],

Thank you for your application. After careful consideration, we regret to inform you that we will not be moving forward with your application at this time.

We appreciate your interest and wish you the best in your future endeavors.

Best regards`,
};

export function MessageApplicantModal({
  open,
  onOpenChange,
  applicant,
  onSend,
}: MessageApplicantModalProps) {
  const [template, setTemplate] = useState<string>("custom");
  const [message, setMessage] = useState("");

  const handleTemplateChange = (value: string) => {
    setTemplate(value);
    if (value !== "custom" && applicant) {
      setMessage(templates[value as keyof typeof templates].replace("[Name]", applicant.name));
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      onSend(message, template);
      setMessage("");
      setTemplate("custom");
      onOpenChange(false);
    }
  };

  if (!applicant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Message Applicant</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm font-medium">{applicant.name}</p>
            <p className="text-xs text-muted-foreground">{applicant.email}</p>
          </div>

          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={template} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="shortlist">Shortlist Invite</SelectItem>
                <SelectItem value="interview">Interview Request</SelectItem>
                <SelectItem value="rejection">Rejection Template</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Be polite and specific — include next steps and contact info"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
            />
          </div>

          <Button variant="outline" className="gap-2">
            <Paperclip className="h-4 w-4" />
            Attach File
          </Button>

          <p className="text-xs text-muted-foreground">
            Message delivered via in-app and optionally email depending on applicant notification preferences
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="gap-2" onClick={handleSend} disabled={!message.trim()}>
            <Send className="h-4 w-4" />
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
