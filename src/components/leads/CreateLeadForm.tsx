import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  LeadSource, 
  RoomChoice, 
  StayDuration,
  STAY_DURATION_CONFIG
} from "@/types/crm";
import { Plus, UserPlus, Loader2, Calendar, Globe } from "lucide-react";
import { useCreateLead } from "@/hooks/useLeads";
import { useSystemSettingsContext } from "@/contexts/SystemSettingsContext";
import { getSourceIcon } from "@/utils/sourceIcons";
import { useLeadSources } from "@/hooks/useLeadSources";

const leadSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  source: z.string().min(1, "Source is required"),
  room_choice: z.enum(["silver", "bronze", "platinum", "gold", "standard"]),
  stay_duration: z.enum(["45_weeks", "51_weeks", "short_stay"]),
});

type LeadFormData = z.infer<typeof leadSchema>;

export function CreateLeadForm() {
  const [open, setOpen] = useState(false);
  const [estimatedRevenue, setEstimatedRevenue] = useState(0);
  const createLead = useCreateLead();
  const { getRoomLabel, getRoomPrice, formatCurrency, roomLabels, roomPrices, academicYears, defaultAcademicYear } = useSystemSettingsContext();
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(defaultAcademicYear);
  const { data: sources = [] } = useLeadSources();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      source: sources.find(s => s.slug === "website")?.slug || sources[0]?.slug || "website",
      room_choice: "silver",
      stay_duration: "51_weeks",
    },
  });

  // Update source when sources load or change
  useEffect(() => {
    if (sources.length > 0) {
      const currentSource = watch("source");
      const validSource = sources.find(s => s.slug === currentSource);
      if (!validSource) {
        // Source doesn't exist in the list, set to default
        const defaultSource = sources.find(s => s.slug === "website")?.slug || sources[0]?.slug || "website";
        setValue("source", defaultSource, { shouldValidate: false });
      }
    }
  }, [sources, setValue, watch]);

  const roomChoice = watch("room_choice");
  const stayDuration = watch("stay_duration");

  const calculateRevenue = (room: RoomChoice, duration: StayDuration) => {
    const basePrice = getRoomPrice(room);
    const durationConfig = STAY_DURATION_CONFIG[duration];
    return basePrice * durationConfig.multiplier;
  };

  useEffect(() => {
    if (roomChoice && stayDuration) {
      setEstimatedRevenue(calculateRevenue(roomChoice, stayDuration));
    }
  }, [roomChoice, stayDuration, roomPrices]);

  const handleRoomChange = (value: RoomChoice) => {
    setValue("room_choice", value);
  };

  const handleDurationChange = (value: StayDuration) => {
    setValue("stay_duration", value);
  };

  const handleFormSubmit = async (data: LeadFormData) => {
    // Ensure source is valid - validate it exists in sources list
    const getDefaultSource = () => sources.find(s => s.slug === "website")?.slug || sources[0]?.slug || "website";
    const validSource = data.source && sources.find(s => s.slug === data.source) 
      ? data.source 
      : getDefaultSource();
    
    console.log("Submitting lead with data:", {
      ...data,
      source: validSource,
      academic_year: selectedAcademicYear || defaultAcademicYear,
      sourcesAvailable: sources.map(s => s.slug),
    });
    
    // Revenue is only calculated when lead is converted, not at creation
    createLead.mutate({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      source: validSource,
      room_choice: data.room_choice,
      stay_duration: data.stay_duration,
      potential_revenue: 0,
      lead_status: "new",
      is_hot: false,
      academic_year: selectedAcademicYear || defaultAcademicYear,
    }, {
      onSuccess: () => {
        reset();
        setSelectedAcademicYear(defaultAcademicYear);
        setOpen(false);
      },
    });
  };

  useEffect(() => {
    if (open) {
      setSelectedAcademicYear(defaultAcademicYear);
      // Ensure source is set when dialog opens
      const defaultSource = sources.find(s => s.slug === "website")?.slug || sources[0]?.slug || "website";
      if (!watch("source") || !sources.find(s => s.slug === watch("source"))) {
        setValue("source", defaultSource, { shouldValidate: false });
      }
    }
  }, [open, defaultAcademicYear, sources, setValue, watch]);

  const roomKeys: RoomChoice[] = ["platinum", "gold", "silver", "bronze", "standard"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" size="sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Lead</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            <UserPlus className="h-6 w-6 text-primary" />
            Create New Lead
          </DialogTitle>
          <DialogDescription>
            Add a new lead to your CRM system. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              placeholder="John Doe"
              {...register("full_name")}
              className={errors.full_name ? "border-destructive" : ""}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@email.com"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                placeholder="+254 700 000 000"
                {...register("phone")}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lead Source *</Label>
              <Select
                value={watch("source") || sources.find(s => s.slug === "website")?.slug || sources[0]?.slug || "website"}
                onValueChange={(value) => {
                  setValue("source", value, { shouldValidate: true });
                }}
              >
                <SelectTrigger className={errors.source ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {sources.length > 0 ? (
                    sources.map((source) => {
                      const IconComponent = getSourceIcon(source.slug);
                      return (
                        <SelectItem key={source.slug} value={source.slug}>
                          <span className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{source.name}</span>
                          </span>
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="website">
                      <span className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Website</span>
                      </span>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.source && (
                <p className="text-sm text-destructive">{errors.source.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Academic Year
              </Label>
              <Select
                value={selectedAcademicYear}
                onValueChange={setSelectedAcademicYear}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Room Choice</Label>
              <Select
                defaultValue="silver"
                onValueChange={(value) => handleRoomChange(value as RoomChoice)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roomKeys.map((key) => (
                    <SelectItem key={key} value={key}>
                      {getRoomLabel(key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stay Duration</Label>
              <Select
                defaultValue="51_weeks"
                onValueChange={(value) => handleDurationChange(value as StayDuration)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STAY_DURATION_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              Revenue will be calculated when this lead is converted
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={createLead.isPending}>
              {createLead.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}