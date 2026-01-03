import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Minus, Camera, X, Flame, Footprints } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Activity } from "@shared/schema";
import { HealthDevices } from "@/components/HealthDevices";
import PageHeader from "@/components/PageHeader";
import { Capacitor } from "@capacitor/core";

export default function TrackActivity() {
  // Default to Manual Entry on web, Fitness Devices on mobile apps
  const isMobile = Capacitor.isNativePlatform();
  const defaultTab = isMobile ? "devices" : "manual";
  
  const [date, setDate] = useState<Date>(new Date());
  const [calories, setCalories] = useState(0);
  const [steps, setSteps] = useState(0);
  const [workoutType, setWorkoutType] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const todayActivities = activities.filter(activity => activity.date === today);
  const todayCalories = todayActivities.reduce((sum, act) => sum + act.calories, 0);
  const todaySteps = todayActivities.reduce((sum, act) => sum + act.steps, 0);

  const createActivityMutation = useMutation({
    mutationFn: async (data: { date: string; calories: number; steps: number; workoutType?: string; attachmentUrl?: string }) => {
      const res = await apiRequest("POST", "/api/activities", {
        date: data.date,
        calories: data.calories,
        steps: data.steps,
        workoutType: data.workoutType || null,
        attachmentUrl: data.attachmentUrl || null,
        source: "manual",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/chart"] });
      setCalories(0);
      setSteps(0);
      setWorkoutType("");
      setAttachmentFile(null);
      setAttachmentPreview(null);
      toast({
        title: "Activity logged!",
        description: "Your activity has been successfully recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to log activity",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 20MB", variant: "destructive" });
      return;
    }

    setAttachmentFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAttachmentPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (calories <= 0 && steps <= 0) {
      toast({ title: "Validation Error", description: "Please enter at least calories or steps.", variant: "destructive" });
      return;
    }
    
    let attachmentUrl: string | undefined;
    if (attachmentFile) {
      try {
        const formData = new FormData();
        formData.append('image', attachmentFile);
        const response = await fetch('/api/upload/evidence', { method: 'POST', credentials: 'include', body: formData });
        if (!response.ok) throw new Error('Failed to upload image');
        const result = await response.json();
        attachmentUrl = result.path;
      } catch (error: any) {
        toast({ title: "Upload Error", description: error.message, variant: "destructive" });
        return;
      }
    }

    createActivityMutation.mutate({
      date: format(date, "yyyy-MM-dd"),
      calories,
      steps,
      workoutType: workoutType || undefined,
      attachmentUrl,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Track Activity" backPath="/" />
      <div className="px-4 pt-4 pb-4">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="manual" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-manual-entry">
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="devices" className="data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-fitness-devices">
              Fitness Devices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <div className="relative">
              <Card className="absolute right-0 top-0 z-10 w-32 shadow-lg">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Today's Summary</p>
                  <div className="flex items-center justify-center gap-1 text-primary font-bold">
                    <span>{todayCalories}</span>
                    <span className="text-xs">cal</span>
                    <Flame className="h-4 w-4" />
                  </div>
                  <div className="flex items-center justify-center gap-1 text-primary font-bold">
                    <span>{todaySteps}</span>
                    <span className="text-xs">steps</span>
                    <Footprints className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>

              <form onSubmit={handleSubmit} className="space-y-5 pr-36">
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal gap-2" data-testid="button-select-date">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        {format(date, "MMMM d, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} onSelect={(day) => day && setDate(day)} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Calories Burned</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(Number(e.target.value))}
                      className="flex-1"
                      data-testid="input-calories"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => setCalories(Math.max(0, calories - 100))} data-testid="button-decrease-calories">
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={() => setCalories(calories + 100)} data-testid="button-increase-calories">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setCalories(calories + 500)} data-testid="button-add-500-cal">
                      +500
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setCalories(calories + 1000)} data-testid="button-add-1000-cal">
                      +1000
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Steps</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      value={steps}
                      onChange={(e) => setSteps(Number(e.target.value))}
                      className="flex-1"
                      data-testid="input-steps"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => setSteps(Math.max(0, steps - 1000))} data-testid="button-decrease-steps">
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={() => setSteps(steps + 1000)} data-testid="button-increase-steps">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Workout Type</Label>
                  <Select value={workoutType} onValueChange={setWorkoutType}>
                    <SelectTrigger data-testid="select-workout-type">
                      <SelectValue placeholder="Select Workout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="cycling">Cycling</SelectItem>
                      <SelectItem value="swimming">Swimming</SelectItem>
                      <SelectItem value="weightlifting">Weightlifting</SelectItem>
                      <SelectItem value="yoga">Yoga</SelectItem>
                      <SelectItem value="crossfit">CrossFit</SelectItem>
                      <SelectItem value="hiking">Hiking</SelectItem>
                      <SelectItem value="cardio">Cardio Session</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Evidence (Optional)</Label>
                  {!attachmentPreview ? (
                    <>
                      <Input id="attachment" type="file" accept="image/*" onChange={handleFileChange} className="hidden" data-testid="input-attachment" />
                      <label htmlFor="attachment">
                        <div className="flex items-center justify-center gap-2 h-12 rounded-lg border-2 border-dashed border-primary/30 text-primary cursor-pointer hover:bg-primary/5 transition-colors">
                          <Camera className="h-5 w-5" />
                          <span className="font-medium">Upload Photo</span>
                        </div>
                      </label>
                    </>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img src={attachmentPreview} alt="Evidence" className="w-full h-32 object-cover" />
                      <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => { setAttachmentFile(null); setAttachmentPreview(null); }} data-testid="button-remove-attachment">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="mt-8 px-0">
              <Button 
                onClick={handleSubmit}
                className="w-full h-12 text-base font-semibold rounded-xl"
                disabled={createActivityMutation.isPending}
                data-testid="button-submit-entry"
              >
                {createActivityMutation.isPending ? "Submitting..." : "Submit Entry"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="devices">
            <HealthDevices />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
