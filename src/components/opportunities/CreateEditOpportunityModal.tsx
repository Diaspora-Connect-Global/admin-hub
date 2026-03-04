import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  X,
  CalendarIcon,
  Eye,
  Save,
  Clock,
  Send,
  MapPin,
  Plus,
  GripVertical,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Opportunity, OpportunityType, FormField } from "@/types/opportunities";
import { toast } from "@/hooks/use-toast";

interface CreateEditOpportunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: Opportunity | null;
  onSave: (opp: Partial<Opportunity>, action: "draft" | "publish" | "schedule") => void;
}

const defaultFormFields: FormField[] = [
  { id: "1", label: "Full Name", type: "text", required: true },
  { id: "2", label: "Email", type: "email", required: true },
  { id: "3", label: "Phone", type: "text", required: false },
  { id: "4", label: "Cover Letter", type: "textarea", required: false },
  { id: "5", label: "Resume / CV", type: "file_upload", required: true, accept: ["pdf", "doc", "docx"] },
];

export function CreateEditOpportunityModal({
  open,
  onOpenChange,
  opportunity,
  onSave,
}: CreateEditOpportunityModalProps) {
  const isEdit = !!opportunity;
  
  // Core Details
  const [title, setTitle] = useState("");
  const [type, setType] = useState<OpportunityType>("job");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"members" | "public">("members");
  const [location, setLocation] = useState("");

  // Application Settings
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [maxApplicants, setMaxApplicants] = useState("");
  const [formType, setFormType] = useState<"simple" | "structured">("structured");
  const [formFields, setFormFields] = useState<FormField[]>(defaultFormFields);
  const [requireCv, setRequireCv] = useState(true);
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [autoAcknowledge, setAutoAcknowledge] = useState(true);

  // Screening & Workflow
  const [reviewWorkflow, setReviewWorkflow] = useState<"manual" | "auto_sort" | "assign_reviewer">("manual");

  // Publish Settings
  const [publishNow, setPublishNow] = useState(true);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [notifyMembers, setNotifyMembers] = useState(true);
  const [searchable, setSearchable] = useState(true);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (open) {
      if (opportunity) {
        setTitle(opportunity.title);
        setType(opportunity.type);
        setShortDescription(opportunity.shortDescription);
        setDescription(opportunity.description || "");
        setTags(opportunity.tags || []);
        setVisibility(opportunity.visibility);
        setLocation(opportunity.location || "");
        setFormType(opportunity.formType);
        setRequireCv(opportunity.requireCv);
        setAllowAnonymous(opportunity.allowAnonymous);
        setAutoAcknowledge(opportunity.autoAcknowledge);
        setReviewWorkflow(opportunity.reviewWorkflow);
        setNotifyMembers(opportunity.notifyMembers);
        setSearchable(opportunity.searchable);
      } else {
        // Reset to defaults
        setTitle("");
        setType("job");
        setShortDescription("");
        setDescription("");
        setTags([]);
        setVisibility("members");
        setLocation("");
        setDeadline(undefined);
        setMaxApplicants("");
        setFormType("structured");
        setFormFields(defaultFormFields);
        setRequireCv(true);
        setAllowAnonymous(false);
        setAutoAcknowledge(true);
        setReviewWorkflow("manual");
        setPublishNow(true);
        setScheduleDate(undefined);
        setNotifyMembers(true);
        setSearchable(true);
      }
    }
  }, [open, opportunity]);

  // Autosave simulation
  useEffect(() => {
    if (open && title) {
      const interval = setInterval(() => {
        setLastSaved(new Date());
      }, 20000);
      return () => clearInterval(interval);
    }
  }, [open, title]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = (action: "draft" | "publish" | "schedule") => {
    if (action !== "draft" && !title.trim()) {
      toast({ title: "Title Required", description: "Please enter a title.", variant: "destructive" });
      return;
    }
    if (action !== "draft" && !description.trim()) {
      toast({ title: "Description Required", description: "Please add a full description.", variant: "destructive" });
      return;
    }

    const oppData: Partial<Opportunity> = {
      title,
      type,
      shortDescription,
      description,
      tags,
      visibility,
      location,
      deadline: deadline ? format(deadline, "MMM dd, yyyy") : null,
      maxApplicants: maxApplicants ? parseInt(maxApplicants) : null,
      formType,
      requireCv,
      allowAnonymous,
      autoAcknowledge,
      reviewWorkflow,
      notifyMembers,
      searchable,
      status: action === "draft" ? "draft" : action === "schedule" ? "scheduled" : "published",
      scheduledAt: action === "schedule" && scheduleDate ? scheduleDate.toISOString() : null,
    };

    onSave(oppData, action);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{isEdit ? "Edit Opportunity" : "Create Opportunity"}</DialogTitle>
          {lastSaved && (
            <p className="text-xs text-muted-foreground">
              Draft saved at {format(lastSaved, "h:mm a")}
            </p>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <Tabs defaultValue="details" className="px-6">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Core Details</TabsTrigger>
              <TabsTrigger value="application">Application Settings</TabsTrigger>
              <TabsTrigger value="screening">Screening & Workflow</TabsTrigger>
              <TabsTrigger value="publish">Publish & Scheduling</TabsTrigger>
            </TabsList>

            {/* Core Details */}
            <TabsContent value="details" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Community Outreach Coordinator"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Opportunity Type *</Label>
                <Select value={type} onValueChange={(v) => setType(v as OpportunityType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job">Job</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="funding">Funding</SelectItem>
                    <SelectItem value="scholarship">Scholarship</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDesc">Short Description *</Label>
                <Input
                  id="shortDesc"
                  placeholder="1–2 sentence summary"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value.slice(0, 300))}
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground text-right">{shortDescription.length}/300</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the opportunity..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{description.length}/5000</p>
              </div>

              <div className="space-y-2">
                <Label>Tags / Skills</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" variant="secondary" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select value={visibility} onValueChange={(v) => setVisibility(v as "members" | "public")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="members">Members Only</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="City, Country or Online"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Application Settings */}
            <TabsContent value="application" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Application Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadline ? format(deadline, "PPP") : "No deadline (open)"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={deadline}
                        onSelect={setDeadline}
                        disabled={(date) => date < new Date()}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxApplicants">Max Applicants</Label>
                  <Input
                    id="maxApplicants"
                    type="number"
                    placeholder="No limit"
                    value={maxApplicants}
                    onChange={(e) => setMaxApplicants(e.target.value)}
                    min={1}
                  />
                  <p className="text-xs text-muted-foreground">Optional cap on number of applications</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Application Form Type</Label>
                <RadioGroup value={formType} onValueChange={(v) => setFormType(v as "simple" | "structured")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="simple" id="simple" />
                    <Label htmlFor="simple" className="font-normal">Simple (email + CV)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="structured" id="structured" />
                    <Label htmlFor="structured" className="font-normal">Structured Form (custom fields)</Label>
                  </div>
                </RadioGroup>
              </div>

              {formType === "structured" && (
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <Label>Form Fields</Label>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />
                      Add Field
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formFields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-2 rounded-lg border border-border p-2"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <div className="flex-1">
                          <span className="text-sm">{field.label}</span>
                          {field.required && <span className="ml-1 text-xs text-destructive">*</span>}
                        </div>
                        <Badge variant="outline" className="text-xs">{field.type}</Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require CV/Resume</Label>
                    <p className="text-xs text-muted-foreground">Applicants must upload a resume</p>
                  </div>
                  <Switch checked={requireCv} onCheckedChange={setRequireCv} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Anonymous Applications</Label>
                    <p className="text-xs text-muted-foreground">Hide applicant identity until shortlisting</p>
                  </div>
                  <Switch checked={allowAnonymous} onCheckedChange={setAllowAnonymous} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Acknowledge Applicant</Label>
                    <p className="text-xs text-muted-foreground">Send confirmation when application submitted</p>
                  </div>
                  <Switch checked={autoAcknowledge} onCheckedChange={setAutoAcknowledge} />
                </div>
              </div>
            </TabsContent>

            {/* Screening & Workflow */}
            <TabsContent value="screening" className="space-y-4">
              <div className="space-y-2">
                <Label>Application Review Workflow</Label>
                <Select value={reviewWorkflow} onValueChange={(v) => setReviewWorkflow(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Review</SelectItem>
                    <SelectItem value="auto_sort">Auto-Sort by Screening</SelectItem>
                    <SelectItem value="assign_reviewer">Assign to Reviewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <Plus className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">Screening Questions</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Add short questions to filter applicants
                </p>
                <Button variant="outline" size="sm">
                  Add Screening Question
                </Button>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm font-medium mb-1">Auto-Reject Criteria</p>
                <p className="text-xs text-muted-foreground">
                  Optional rules to auto-reject (e.g., missing required file, failed screening).
                  Configure in advanced settings.
                </p>
              </div>
            </TabsContent>

            {/* Publish & Scheduling */}
            <TabsContent value="publish" className="space-y-4">
              <div className="space-y-2">
                <Label>Publish Immediately</Label>
                <RadioGroup value={publishNow ? "yes" : "no"} onValueChange={(v) => setPublishNow(v === "yes")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="pub-yes" />
                    <Label htmlFor="pub-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="pub-no" />
                    <Label htmlFor="pub-no" className="font-normal">No, schedule for later</Label>
                  </div>
                </RadioGroup>
              </div>

              {!publishNow && (
                <div className="space-y-2">
                  <Label>Schedule Publish At</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !scheduleDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduleDate ? format(scheduleDate, "PPP 'at' p") : "Pick date and time"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={scheduleDate}
                        onSelect={setScheduleDate}
                        disabled={(date) => date < new Date()}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notify Members on Publish</Label>
                    <p className="text-xs text-muted-foreground">Send notification to all members</p>
                  </div>
                  <Switch checked={notifyMembers} onCheckedChange={setNotifyMembers} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Searchable</Label>
                    <p className="text-xs text-muted-foreground">If off, only accessible via direct link</p>
                  </div>
                  <Switch checked={searchable} onCheckedChange={setSearchable} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <div className="flex w-full justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="ghost" className="gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="gap-2" onClick={() => handleSubmit("draft")}>
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
              {!publishNow && scheduleDate && (
                <Button variant="secondary" className="gap-2" onClick={() => handleSubmit("schedule")}>
                  <Clock className="h-4 w-4" />
                  Schedule
                </Button>
              )}
              <Button className="gap-2" onClick={() => handleSubmit("publish")}>
                <Send className="h-4 w-4" />
                Publish
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
