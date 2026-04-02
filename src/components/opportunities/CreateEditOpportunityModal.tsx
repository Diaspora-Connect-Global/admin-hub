import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Save,
  Send,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  GripVertical,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Opportunity,
  OpportunityType,
  OpportunityCategory,
  FormField,
  Visibility,
  ApplicationMethod,
  WorkMode,
  EngagementType,
  OwnerType,
  type CreateOpportunityInput,
  type UpdateOpportunityInput,
} from "@/types/opportunities";
import { toast } from "@/hooks/use-toast";
import { getUserId } from "@/stores/session";

const NONE_SELECTED = "__NONE__";

interface CreateEditOpportunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: Opportunity | null;
  onSave: (
    data: CreateOpportunityInput | UpdateOpportunityInput,
    action: "draft" | "publish"
  ) => void;
}

const defaultFormFields: FormField[] = [
  { key: "full_name",    label: "Full Name",    type: "text",        required: true  },
  { key: "email",        label: "Email",        type: "email",       required: true  },
  { key: "phone",        label: "Phone",        type: "text",        required: false },
  { key: "cover_letter", label: "Cover Letter", type: "textarea",    required: false },
  { key: "resume",       label: "Resume/CV",    type: "file_upload", required: true  },
];

const defaultCategoryForType: Record<OpportunityType, OpportunityCategory> = {
  [OpportunityType.EMPLOYMENT]:  OpportunityCategory.EMPLOYMENT_CAREER,
  [OpportunityType.CONTRACT]:    OpportunityCategory.EMPLOYMENT_CAREER,
  [OpportunityType.SCHOLARSHIP]: OpportunityCategory.EDUCATION_TRAINING,
  [OpportunityType.PROGRAM]:     OpportunityCategory.EDUCATION_TRAINING,
  [OpportunityType.INVESTMENT]:  OpportunityCategory.BUSINESS_INVESTMENT,
  [OpportunityType.FELLOWSHIP]:  OpportunityCategory.FELLOWSHIPS_LEADERSHIP,
  [OpportunityType.INITIATIVE]:  OpportunityCategory.GOVERNMENT_EMBASSY_INITIATIVES,
  [OpportunityType.GRANT]:       OpportunityCategory.FUNDING_GRANTS,
  [OpportunityType.VOLUNTEER]:   OpportunityCategory.VOLUNTEERING_SOCIAL_IMPACT,
};

export function CreateEditOpportunityModal({
  open,
  onOpenChange,
  opportunity,
  onSave,
}: CreateEditOpportunityModalProps) {
  const isEdit = !!opportunity;
  const tabOrder = ["details", "application", "additional"] as const;
  const [activeTab, setActiveTab] = useState<(typeof tabOrder)[number]>("details");

  // Core Details
  const [title, setTitle] = useState("");
  const [type, setType] = useState<OpportunityType>(OpportunityType.EMPLOYMENT);
  const [subCategory, setSubCategory] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [visibility, setVisibility] = useState<Visibility>(Visibility.PUBLIC);
  const [location, setLocation] = useState("");

  // Application Settings
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [applicationMethod, setApplicationMethod] = useState<ApplicationMethod>(ApplicationMethod.IN_PLATFORM_FORM);
  const [applicationEmail, setApplicationEmail] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [formFields, setFormFields] = useState<FormField[]>(defaultFormFields);

  // Additional Details
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode | "">("");
  const [engagementType, setEngagementType] = useState<EngagementType | "">("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("");

  // Add field dialog
  const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<FormField["type"]>("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Sync type (category is now derived from type)
  const handleTypeChange = (v: OpportunityType) => {
    setType(v);
  };

  useEffect(() => {
    if (!open) return;

    setActiveTab("details");

    if (opportunity) {
      setTitle(opportunity.title);
      setType(opportunity.type);
      setSubCategory(opportunity.subCategory ?? "");
      setDescription(opportunity.description ?? "");
      setTags(opportunity.tags ?? []);
      setSkills(opportunity.skills ?? []);
      setVisibility(opportunity.visibility ?? Visibility.PUBLIC);
      setLocation(opportunity.location ?? "");
      setDeadline(opportunity.deadline ? new Date(opportunity.deadline) : undefined);
      setApplicationMethod(opportunity.applicationMethod ?? ApplicationMethod.IN_PLATFORM_FORM);
      setApplicationEmail(opportunity.applicationEmail ?? "");
      setExternalLink(opportunity.externalLink ?? "");
      setFormFields(opportunity.formFields?.length ? opportunity.formFields : defaultFormFields);
      setResponsibilities(opportunity.responsibilities ?? "");
      setRequirements(opportunity.requirements ?? "");
      setWorkMode((opportunity.workMode as WorkMode) ?? "");
      setEngagementType((opportunity.engagementType as EngagementType) ?? "");
      setSalaryMin(opportunity.salaryMin != null ? String(opportunity.salaryMin) : "");
      setSalaryMax(opportunity.salaryMax != null ? String(opportunity.salaryMax) : "");
      setSalaryCurrency(opportunity.salaryCurrency ?? "");
    } else {
      setTitle("");
      setType(OpportunityType.EMPLOYMENT);
      setSubCategory("");
      setDescription("");
      setTags([]);
      setTagInput("");
      setSkills([]);
      setSkillInput("");
      setVisibility(Visibility.PUBLIC);
      setLocation("");
      setDeadline(undefined);
      setApplicationMethod(ApplicationMethod.IN_PLATFORM_FORM);
      setApplicationEmail("");
      setExternalLink("");
      setFormFields(defaultFormFields);
      setResponsibilities("");
      setRequirements("");
      setWorkMode("");
      setEngagementType("");
      setSalaryMin("");
      setSalaryMax("");
      setSalaryCurrency("");
    }
  }, [open, opportunity]);

  const activeTabIndex = tabOrder.indexOf(activeTab);
  const isFirstTab = activeTabIndex === 0;
  const isLastTab = activeTabIndex === tabOrder.length - 1;

  const goToNextTab = () => {
    if (isLastTab) return;
    setActiveTab(tabOrder[activeTabIndex + 1]);
  };

  const goToPreviousTab = () => {
    if (isFirstTab) return;
    setActiveTab(tabOrder[activeTabIndex - 1]);
  };

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput(""); }
  };

  const handleAddSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) { setSkills([...skills, s]); setSkillInput(""); }
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) {
      toast({ title: "Label Required", description: "Please enter a field label.", variant: "destructive" });
      return;
    }
    const newField: FormField = {
      key: String(Date.now()),
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
    };
    setFormFields([...formFields, newField]);
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldRequired(false);
    setAddFieldDialogOpen(false);
  };

  const handleSubmit = (action: "draft" | "publish") => {
    if (!title.trim()) {
      toast({ title: "Title Required", description: "Please enter a title.", variant: "destructive" });
      return;
    }
    if (action === "publish" && !description.trim()) {
      toast({ title: "Description Required", description: "Please add a full description.", variant: "destructive" });
      return;
    }
    if (applicationMethod === ApplicationMethod.EMAIL_REQUEST && !applicationEmail.trim()) {
      toast({ title: "Application Email Required", description: "Please enter an email to receive applications.", variant: "destructive" });
      return;
    }
    if (applicationMethod === ApplicationMethod.EXTERNAL_LINK && !externalLink.trim()) {
      toast({ title: "External Link Required", description: "Please enter an external application link.", variant: "destructive" });
      return;
    }

    const deadlineISO = deadline ? deadline.toISOString() : undefined;

    if (isEdit) {
      const input: UpdateOpportunityInput = {
        title: title.trim(),
        description: description || undefined,
        subCategory: subCategory || undefined,
        responsibilities: responsibilities || undefined,
        requirements: requirements || undefined,
        workMode: workMode || undefined,
        engagementType: engagementType || undefined,
        location: location || undefined,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        salaryCurrency: salaryCurrency || undefined,
        deadline: deadlineISO,
        skills: skills.length ? skills : undefined,
        tags: tags.length ? tags : undefined,
        applicationMethod,
        applicationEmail: applicationMethod === ApplicationMethod.EMAIL_REQUEST ? applicationEmail.trim() : undefined,
        externalLink: applicationMethod === ApplicationMethod.EXTERNAL_LINK ? externalLink.trim() : undefined,
        formFields: applicationMethod === ApplicationMethod.IN_PLATFORM_FORM ? formFields : undefined,
      };
      onSave(input, action);
    } else {
      const ownerId = getUserId()?.trim();
      if (!ownerId) {
        toast({ title: "Session Required", description: "Please log in again and retry.", variant: "destructive" });
        return;
      }
      const input: CreateOpportunityInput = {
        ownerType: OwnerType.USER,
        ownerId,
        type,
        category: defaultCategoryForType[type],
        title: title.trim(),
        description,
        visibility,
        applicationMethod,
        applicationEmail: applicationMethod === ApplicationMethod.EMAIL_REQUEST ? applicationEmail.trim() : undefined,
        externalLink: applicationMethod === ApplicationMethod.EXTERNAL_LINK ? externalLink.trim() : undefined,
        formFields: applicationMethod === ApplicationMethod.IN_PLATFORM_FORM ? formFields : undefined,
        subCategory: subCategory || undefined,
        responsibilities: responsibilities || undefined,
        requirements: requirements || undefined,
        workMode: workMode || undefined,
        engagementType: engagementType || undefined,
        location: location || undefined,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        salaryCurrency: salaryCurrency || undefined,
        deadline: deadlineISO,
        skills: skills.length ? skills : undefined,
        tags: tags.length ? tags : undefined,
      };
      onSave(input, action);
    }

    onOpenChange(false);
  };

  // ── Type-aware field visibility & labels ──────────────────────────────────
  const isEmploymentLike = type === OpportunityType.EMPLOYMENT || type === OpportunityType.CONTRACT;
  const isFellowship     = type === OpportunityType.FELLOWSHIP;
  const isVolunteer      = type === OpportunityType.VOLUNTEER;
  const isProgram        = type === OpportunityType.PROGRAM;
  const isGrant          = type === OpportunityType.GRANT;
  const isScholarship    = type === OpportunityType.SCHOLARSHIP;
  const isInvestment     = type === OpportunityType.INVESTMENT;

  // workMode only makes sense when there's a physical/remote dimension
  const showWorkMode = isEmploymentLike || isFellowship || isVolunteer || isProgram;
  // engagementType (full-time / part-time / contract) is employment/fellowship-specific
  const showEngagementType = isEmploymentLike || isFellowship;
  // responsibilities section — label varies by type
  const showResponsibilities = isEmploymentLike || isFellowship || isVolunteer || isProgram;
  const responsibilitiesLabel =
    isFellowship ? "Fellowship Duties"
    : isVolunteer ? "Volunteer Duties"
    : isProgram   ? "Program Activities"
    : "Responsibilities";
  // requirements / eligibility — applies to all, label varies
  const requirementsLabel =
    isScholarship || isFellowship || isGrant ? "Eligibility Criteria"
    : isInvestment                            ? "Investment Criteria"
    : "Requirements";
  // Compensation — shown for most types but labelled differently
  const showCompensation = isEmploymentLike || isFellowship || isGrant || isScholarship || isInvestment;
  const compensationLabel =
    isFellowship            ? "Stipend"
    : isGrant || isScholarship ? "Funding Amount"
    : isInvestment          ? "Investment Range"
    : "Salary";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{isEdit ? "Edit Opportunity" : "Create Opportunity"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update opportunity details, application settings, and additional information."
              : "Create a new opportunity with details, application settings, and additional information."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as (typeof tabOrder)[number])} className="px-6">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Core Details</TabsTrigger>
              <TabsTrigger value="application">Application Settings</TabsTrigger>
              <TabsTrigger value="additional">Additional Details</TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Core Details ─────────────────────────────── */}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type / Category *</Label>
                  <Select value={type} onValueChange={(v) => handleTypeChange(v as OpportunityType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OpportunityType.EMPLOYMENT}>Employment</SelectItem>
                      <SelectItem value={OpportunityType.CONTRACT}>Contract</SelectItem>
                      <SelectItem value={OpportunityType.VOLUNTEER}>Volunteer</SelectItem>
                      <SelectItem value={OpportunityType.SCHOLARSHIP}>Scholarship</SelectItem>
                      <SelectItem value={OpportunityType.FELLOWSHIP}>Fellowship</SelectItem>
                      <SelectItem value={OpportunityType.GRANT}>Grant</SelectItem>
                      <SelectItem value={OpportunityType.PROGRAM}>Program</SelectItem>
                      <SelectItem value={OpportunityType.INVESTMENT}>Investment</SelectItem>
                      <SelectItem value={OpportunityType.INITIATIVE}>Initiative</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Category auto-set to {defaultCategoryForType[type].split("_").join(" ")}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subCategory">Sub-category</Label>
                <Input
                  id="subCategory"
                  placeholder="Optional sub-category"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the opportunity..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select value={visibility} onValueChange={(v) => setVisibility(v as Visibility)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Visibility.PUBLIC}>Public</SelectItem>
                      <SelectItem value={Visibility.COMMUNITY_ONLY}>Community Only</SelectItem>
                      <SelectItem value={Visibility.ASSOCIATION_ONLY}>Association Only</SelectItem>
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

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" variant="secondary" onClick={handleAddTag}>Add</Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label>Skills</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                  />
                  <Button type="button" variant="secondary" onClick={handleAddSkill}>Add</Button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="gap-1">
                        {skill}
                        <button onClick={() => setSkills(skills.filter((s) => s !== skill))} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Tab 2: Application Settings ─────────────────────── */}
            <TabsContent value="application" className="space-y-4">
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
                {deadline && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setDeadline(undefined)}>
                    Clear deadline
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Application Method</Label>
                <RadioGroup
                  value={applicationMethod}
                  onValueChange={(v) => setApplicationMethod(v as ApplicationMethod)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={ApplicationMethod.IN_PLATFORM_FORM} id="method-form" />
                    <Label htmlFor="method-form" className="font-normal">In-platform form (custom fields)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={ApplicationMethod.EMAIL_REQUEST} id="method-email" />
                    <Label htmlFor="method-email" className="font-normal">Email request</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={ApplicationMethod.EXTERNAL_LINK} id="method-external" />
                    <Label htmlFor="method-external" className="font-normal">External link</Label>
                  </div>
                </RadioGroup>
              </div>

              {applicationMethod === ApplicationMethod.EMAIL_REQUEST && (
                <div className="space-y-2">
                  <Label htmlFor="applicationEmail">Application Email *</Label>
                  <Input
                    id="applicationEmail"
                    type="email"
                    placeholder="applications@example.com"
                    value={applicationEmail}
                    onChange={(e) => setApplicationEmail(e.target.value)}
                  />
                </div>
              )}

              {applicationMethod === ApplicationMethod.EXTERNAL_LINK && (
                <div className="space-y-2">
                  <Label htmlFor="externalLink">External Application Link *</Label>
                  <Input
                    id="externalLink"
                    type="url"
                    placeholder="https://example.com/apply"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                  />
                </div>
              )}

              {applicationMethod === ApplicationMethod.IN_PLATFORM_FORM && (
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <Label>Form Fields</Label>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => setAddFieldDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Add Field
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formFields.map((field) => (
                      <div
                        key={field.key}
                        className="flex items-center gap-2 rounded-lg border border-border p-2"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <div className="flex-1">
                          <span className="text-sm">{field.label}</span>
                          {field.required && <span className="ml-1 text-xs text-destructive">*</span>}
                        </div>
                        <Badge variant="outline" className="text-xs">{field.type}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={() => setFormFields(formFields.filter((f) => f.key !== field.key))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Tab 3: Additional Details ────────────────────────── */}
            <TabsContent value="additional" className="space-y-4">

              {showResponsibilities && (
                <div className="space-y-2">
                  <Label htmlFor="responsibilities">{responsibilitiesLabel}</Label>
                  <Textarea
                    id="responsibilities"
                    placeholder={`Key ${responsibilitiesLabel.toLowerCase()}...`}
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="requirements">{requirementsLabel}</Label>
                <Textarea
                  id="requirements"
                  placeholder={`${requirementsLabel} for applicants...`}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {(showWorkMode || showEngagementType) && (
                <div className="grid grid-cols-2 gap-4">
                  {showWorkMode && (
                    <div className="space-y-2">
                      <Label>Work Mode</Label>
                      <Select
                        value={workMode || NONE_SELECTED}
                        onValueChange={(v) => setWorkMode(v === NONE_SELECTED ? "" : (v as WorkMode))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Not specified" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_SELECTED}>Not specified</SelectItem>
                          <SelectItem value={WorkMode.REMOTE}>Remote</SelectItem>
                          <SelectItem value={WorkMode.HYBRID}>Hybrid</SelectItem>
                          <SelectItem value={WorkMode.ONSITE}>Onsite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {showEngagementType && (
                    <div className="space-y-2">
                      <Label>Engagement Type</Label>
                      <Select
                        value={engagementType || NONE_SELECTED}
                        onValueChange={(v) => setEngagementType(v === NONE_SELECTED ? "" : (v as EngagementType))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Not specified" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_SELECTED}>Not specified</SelectItem>
                          <SelectItem value={EngagementType.FULL_TIME}>Full Time</SelectItem>
                          <SelectItem value={EngagementType.PART_TIME}>Part Time</SelectItem>
                          <SelectItem value={EngagementType.CONTRACT}>Contract</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {showCompensation && (
                <div className="space-y-2">
                  <Label>{compensationLabel}</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Min</p>
                      <Input
                        type="number"
                        placeholder="0"
                        min={0}
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Max</p>
                      <Input
                        type="number"
                        placeholder="0"
                        min={0}
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Currency</p>
                      <Select
                        value={salaryCurrency || NONE_SELECTED}
                        onValueChange={(v) => setSalaryCurrency(v === NONE_SELECTED ? "" : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_SELECTED}>Not specified</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="GHS">GHS</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="NGN">NGN</SelectItem>
                          <SelectItem value="KES">KES</SelectItem>
                          <SelectItem value="ZAR">ZAR</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {!showResponsibilities && !showCompensation && !showWorkMode && !showEngagementType && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No additional details required for this opportunity type.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <div className="flex w-full justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={goToPreviousTab} disabled={isFirstTab}>
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button variant="outline" onClick={goToNextTab} disabled={isLastTab}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" className="gap-2" onClick={() => handleSubmit("draft")}>
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
              <Button className="gap-2" onClick={() => handleSubmit("publish")}>
                <Send className="h-4 w-4" />
                Publish
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Add Field Dialog */}
      <Dialog open={addFieldDialogOpen} onOpenChange={setAddFieldDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Form Field</DialogTitle>
            <DialogDescription>Create a new field for the application form.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="field-label">Field Label *</Label>
              <Input
                id="field-label"
                placeholder="e.g. LinkedIn Profile"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field-type">Field Type *</Label>
              <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as FormField["type"])}>
                <SelectTrigger id="field-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="textarea">Text Area</SelectItem>
                  <SelectItem value="file_upload">File Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="field-required" className="flex items-center gap-2 cursor-pointer">
                <input
                  id="field-required"
                  type="checkbox"
                  checked={newFieldRequired}
                  onChange={(e) => setNewFieldRequired(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm">Required field</span>
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFieldDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddField}>Add Field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
