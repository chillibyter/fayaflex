import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Minus, Camera, X } from "lucide-react";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Quick log-activity sheet bound to the bottom-nav FAB. Same write path as
 * the full TrackActivity page (POST /api/activities → manual source) but
 * scoped to manual entry only — devices and AI sync live on the Profile.
 */
export default function LogActivityDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [calories, setCalories] = useState(0);
  const [steps, setSteps] = useState(0);
  const [workoutType, setWorkoutType] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const reset = () => {
    setDate(new Date());
    setCalories(0);
    setSteps(0);
    setWorkoutType("");
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  const createActivity = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stakes/active"] });
      toast({ title: "Activity logged!", description: "Your activity was recorded." });
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to log activity",
        variant: "destructive",
      });
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
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
      toast({ title: "Validation Error", description: "Enter at least calories or steps.", variant: "destructive" });
      return;
    }
    let attachmentUrl: string | undefined;
    if (attachmentFile) {
      try {
        const formData = new FormData();
        formData.append("image", attachmentFile);
        const response = await fetch("/api/upload/evidence", { method: "POST", credentials: "include", body: formData });
        if (!response.ok) throw new Error("Failed to upload image");
        const result = await response.json();
        attachmentUrl = result.path;
      } catch (error: any) {
        toast({ title: "Upload Error", description: error.message, variant: "destructive" });
        return;
      }
    }
    createActivity.mutate({
      date: format(date, "yyyy-MM-dd"),
      calories,
      steps,
      workoutType: workoutType || undefined,
      attachmentUrl,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log activity</DialogTitle>
          <DialogDescription>Quick manual entry. Connect a device on your profile for auto-sync.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal gap-2" data-testid="button-dialog-select-date">
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
            <Label>Calories burned</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="flex-1"
                data-testid="input-dialog-calories"
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setCalories(Math.max(0, calories - 100))} data-testid="button-dialog-decrease-calories">
                <Minus className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => setCalories(calories + 100)} data-testid="button-dialog-increase-calories">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setCalories(calories + 500)} data-testid="button-dialog-add-500">+500</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setCalories(calories + 1000)} data-testid="button-dialog-add-1000">+1000</Button>
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
                data-testid="input-dialog-steps"
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setSteps(Math.max(0, steps - 1000))} data-testid="button-dialog-decrease-steps">
                <Minus className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => setSteps(steps + 1000)} data-testid="button-dialog-increase-steps">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Workout type (optional)</Label>
            <Select value={workoutType} onValueChange={setWorkoutType}>
              <SelectTrigger data-testid="select-dialog-workout-type">
                <SelectValue placeholder="Select workout" />
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
            <Label>Evidence photo (optional)</Label>
            {!attachmentPreview ? (
              <>
                <Input id="dialog-attachment" type="file" accept="image/*" onChange={handleFile} className="hidden" data-testid="input-dialog-attachment" />
                <label htmlFor="dialog-attachment">
                  <div className="flex items-center justify-center gap-2 h-12 rounded-md border-2 border-dashed border-primary/30 text-primary cursor-pointer hover-elevate">
                    <Camera className="h-5 w-5" />
                    <span className="font-medium">Upload photo</span>
                  </div>
                </label>
              </>
            ) : (
              <div className="relative rounded-md overflow-hidden border">
                <img src={attachmentPreview} alt="Evidence" className="w-full h-32 object-cover" />
                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => { setAttachmentFile(null); setAttachmentPreview(null); }} data-testid="button-dialog-remove-attachment">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createActivity.isPending}
            data-testid="button-dialog-submit"
          >
            {createActivity.isPending ? "Submitting..." : "Log activity"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
