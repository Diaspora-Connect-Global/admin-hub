import { useState, useEffect, useId, useCallback, useRef } from "react";
import { format } from "date-fns";
import { Event, EventFormData, EventType } from "@/types/events";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight, Upload, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EVENT_BANNER_MAX_BYTES } from "@/lib/eventBannerUpload";
import { useT } from "@/hooks/useT";
import { toast } from "@/hooks/use-toast";

const EMPTY_EVENT_FORM: EventFormData = {
  title: "",
  description: "",
  bannerImage: null,
  date: undefined,
  startTime: "",
  endTime: "",
  eventType: "in-person",
  venue: "",
  address: "",
  city: "",
  country: "",
  virtualLink: "",
  isPaid: false,
  ticketPrice: 0,
  currency: "USD",
  hasParticipantLimit: false,
  maxParticipants: 100,
  publishNow: false,
  notifyMembers: true,
  allowComments: true,
};

interface CreateEditEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** True when creating a new event (not editing). Used to reset form each time the create dialog opens. */
  isCreatingNew: boolean;
  event?: Event | null;
  onSubmit: (data: EventFormData) => void | Promise<void>;
}

export function CreateEditEventModal({
  open,
  onOpenChange,
  isCreatingNew,
  event,
  onSubmit,
}: CreateEditEventModalProps) {
  const t = useT("events");
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EventFormData>(EMPTY_EVENT_FORM);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      prevOpenRef.current = false;
      return;
    }

    const justOpened = !prevOpenRef.current;
    prevOpenRef.current = true;

    if (isCreatingNew && justOpened) {
      setFormData(EMPTY_EVENT_FORM);
      setCurrentStep(1);
      return;
    }

    if (isCreatingNew) {
      return;
    }

    if (!event) {
      return;
    }

    const eventType: EventType =
      event.locationType === "PHYSICAL" ? "in-person" : event.locationType === "VIRTUAL" ? "virtual" : "hybrid";
    setFormData({
      ...EMPTY_EVENT_FORM,
      title: event.title,
      description: event.description,
      date: event.startAt ? new Date(event.startAt) : undefined,
      startTime: event.startAt ? format(new Date(event.startAt), "HH:mm") : "",
      endTime: event.endAt ? format(new Date(event.endAt), "HH:mm") : "",
      eventType,
      venue: event.locationDetails?.venueName ?? "",
      address: event.locationDetails?.address ?? "",
      city: event.locationDetails?.city ?? "",
      country: event.locationDetails?.country ?? "",
      virtualLink: event.locationDetails?.virtualLink || "",
      isPaid: event.isPaid,
      ticketPrice: event.tickets?.[0] ? event.tickets[0].priceInCents / 100 : 0,
      hasParticipantLimit: event.availableSpots != null && event.availableSpots > 0,
      maxParticipants: event.availableSpots ?? 100,
    });
  }, [open, isCreatingNew, event?.id]);

  const steps = [
    { id: 1, title: t.basicInformation },
    { id: 2, title: t.scheduleLocation },
    { id: 3, title: t.ticketingCapacity },
    { id: 4, title: t.visibilitySettings },
  ];

  const updateField = <K extends keyof EventFormData>(field: K, value: EventFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const bannerInputId = useId();
  const [bannerDragActive, setBannerDragActive] = useState(false);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (formData.bannerImage) {
      const url = URL.createObjectURL(formData.bannerImage);
      setBannerPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setBannerPreviewUrl(event?.coverImageUrl ?? null);
  }, [formData.bannerImage, event?.coverImageUrl]);

  useEffect(() => {
    if (!open) setBannerDragActive(false);
  }, [open]);

  const applyBannerFile = useCallback((file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > EVENT_BANNER_MAX_BYTES) {
      toast({
        title: "File too large",
        description: "Banner image must be 2MB or smaller.",
        variant: "destructive",
      });
      return;
    }
    setFormData((prev) => ({ ...prev, bannerImage: file }));
  }, []);

  const handleBannerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyBannerFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleBannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBannerDragActive(false);
    applyBannerFile(e.dataTransfer.files?.[0]);
  };

  const handleBannerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBannerDragActive(true);
  };

  const handleBannerDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setBannerDragActive(false);
    }
  };

  const clearBanner = () => {
    updateField("bannerImage", null);
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await onSubmit(formData);
      onOpenChange(false);
      setCurrentStep(1);
    } catch {
      /* Parent shows toast; keep modal open */
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep(1);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setCurrentStep(1);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? t.editEventLabel : t.createEvent}
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    currentStep > step.id
                      ? "bg-primary text-primary-foreground"
                      : currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className="text-xs mt-1 text-muted-foreground hidden sm:block">
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-12 sm:w-20 h-0.5 mx-2",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-4 min-h-[300px]">
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">{t.eventTitle} *</Label>
                <Input
                  id="title"
                  placeholder={t.enterEventTitle}
                  value={formData.title}
                  onChange={(e) => updateField("title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t.eventDescription} *</Label>
                <Textarea
                  id="description"
                  placeholder={t.enterEventDescription}
                  rows={5}
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={bannerInputId}>{t.bannerImageLabel}</Label>
                <div
                  role="group"
                  aria-label={t.bannerImageLabel}
                  onDragEnter={handleBannerDragOver}
                  onDragOver={handleBannerDragOver}
                  onDragLeave={handleBannerDragLeave}
                  onDrop={handleBannerDrop}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    bannerDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                    formData.bannerImage && "border-primary/40"
                  )}
                >
                  <input
                    id={bannerInputId}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handleBannerInputChange}
                  />
                  <label
                    htmlFor={bannerInputId}
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground">{t.clickToUpload}</p>
                    <p className="text-xs text-muted-foreground">{t.imageFormat}</p>
                  </label>
                  {formData.bannerImage && (
                    <div className="mt-4 flex flex-col items-center gap-3">
                      {bannerPreviewUrl && (
                        <img
                          src={bannerPreviewUrl}
                          alt=""
                          className="max-h-32 w-full max-w-md rounded-md object-cover border border-border"
                        />
                      )}
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <Badge variant="secondary">{formData.bannerImage.name}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.preventDefault();
                            clearBanner();
                          }}
                          aria-label="Remove banner image"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="space-y-2">
                <Label>{t.eventDate} *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP") : t.pickDate}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => updateField("date", date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">{t.startTime} *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => updateField("startTime", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">{t.endTime} *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => updateField("endTime", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.eventTypeLabel} *</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value: EventType) => updateField("eventType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-person">{t.inPerson}</SelectItem>
                    <SelectItem value="virtual">{t.virtual}</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(formData.eventType === "in-person" || formData.eventType === "hybrid") && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="venue">{t.venueName} *</Label>
                    <Input
                      id="venue"
                      placeholder={t.venuePlaceholder}
                      value={formData.venue}
                      onChange={(e) => updateField("venue", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">{t.streetAddress} *</Label>
                    <Input
                      id="address"
                      placeholder={t.addressPlaceholder}
                      value={formData.address}
                      onChange={(e) => updateField("address", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">{t.city} *</Label>
                      <Input
                        id="city"
                        placeholder={t.cityPlaceholder}
                        value={formData.city}
                        onChange={(e) => updateField("city", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">{t.country} *</Label>
                      <Input
                        id="country"
                        placeholder={t.countryPlaceholder}
                        value={formData.country}
                        onChange={(e) => updateField("country", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
              {(formData.eventType === "virtual" || formData.eventType === "hybrid") && (
                <div className="space-y-2">
                  <Label htmlFor="virtualLink">{t.virtualLinkLabel}</Label>
                  <Input
                    id="virtualLink"
                    type="url"
                    placeholder={t.addVirtualLink}
                    value={formData.virtualLink}
                    onChange={(e) => updateField("virtualLink", e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <Label>{t.isPaidEvent}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t.enableTicketPrice}
                  </p>
                </div>
                <Switch
                  checked={formData.isPaid}
                  onCheckedChange={(checked) => updateField("isPaid", checked)}
                />
              </div>
              {formData.isPaid && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.currency}</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => updateField("currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GHS">GHS (₵)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticketPrice">{t.ticketPrice}</Label>
                    <Input
                      id="ticketPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.ticketPrice || ""}
                      onChange={(e) => updateField("ticketPrice", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <Label>{t.limitParticipants}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t.setMaxAttendees}
                  </p>
                  {!formData.isPaid && (
                    <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                      {t.limitRequiresPaid}
                    </p>
                  )}
                </div>
                <Switch
                  checked={formData.hasParticipantLimit}
                  onCheckedChange={(checked) => updateField("hasParticipantLimit", checked)}
                />
              </div>
              {formData.hasParticipantLimit && (
                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">{t.maxParticipants}</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    min="1"
                    placeholder="E.g., 200"
                    value={formData.maxParticipants || ""}
                    onChange={(e) => updateField("maxParticipants", parseInt(e.target.value) || 0)}
                  />
                </div>
              )}
            </>
          )}

          {currentStep === 4 && (
            <>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <Label>{t.publishEventNow}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t.makeEventVisible}
                  </p>
                </div>
                <Switch
                  checked={formData.publishNow}
                  onCheckedChange={(checked) => updateField("publishNow", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <Label>{t.sendNotification}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t.notifyAllMembers}
                  </p>
                </div>
                <Switch
                  checked={formData.notifyMembers}
                  onCheckedChange={(checked) => updateField("notifyMembers", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <Label>{t.allowCommentsLabel}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t.letMembersComment}
                  </p>
                </div>
                <Switch
                  checked={formData.allowComments}
                  onCheckedChange={(checked) => updateField("allowComments", checked)}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t.back}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              {t.cancel}
            </Button>
            {currentStep < steps.length ? (
              <Button onClick={handleNext}>
                {t.next}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                {event ? t.saveChanges : t.createEvent}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
