import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CalendarIcon, Plus, Minus, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function DataEntryForm() {
  const [date, setDate] = useState<Date>(new Date());
  const [calories, setCalories] = useState(0);
  const [steps, setSteps] = useState(0);
  const [workoutType, setWorkoutType] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const createActivityMutation = useMutation({
    mutationFn: async (data: { date: string; calories: number; steps: number; workoutType?: string; attachmentUrl?: string }) => {
      console.log('[DataEntryForm] mutationFn executing with data:', data);
      const res = await apiRequest("POST", "/api/activities", {
        date: data.date,
        calories: data.calories,
        steps: data.steps,
        workoutType: data.workoutType || null,
        attachmentUrl: data.attachmentUrl || null,
        source: "manual",
      });
      const result = await res.json();
      console.log('[DataEntryForm] mutationFn completed, result:', result);
      return result;
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
      let errorMessage = "Failed to log activity";
      if (error?.message) {
        try {
          const jsonMatch = error.message.match(/\d+:\s*({.+})/);
          if (jsonMatch) {
            const errorData = JSON.parse(jsonMatch[1]);
            errorMessage = errorData.message || errorMessage;
          } else {
            errorMessage = error.message;
          }
        } catch {
          errorMessage = error.message;
        }
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 20MB",
        variant: "destructive",
      });
      return;
    }

    setAttachmentFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachmentPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DataEntryForm] handleSubmit called');
    
    // Validate that at least some activity data is provided
    if (calories <= 0 && steps <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter at least calories or steps to log an activity.",
        variant: "destructive",
      });
      return;
    }
    
    // Upload image first if present
    let attachmentUrl: string | undefined;
    if (attachmentFile) {
      try {
        const formData = new FormData();
        formData.append('image', attachmentFile);
        
        const response = await fetch('/api/upload/evidence', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to upload image');
        }
        
        const result = await response.json();
        attachmentUrl = result.path;
      } catch (error: any) {
        toast({
          title: "Upload Error",
          description: error.message || "Failed to upload evidence image",
          variant: "destructive",
        });
        return;
      }
    }

    console.log('[DataEntryForm] Calling createActivityMutation.mutate');
    createActivityMutation.mutate({
      date: format(date, "yyyy-MM-dd"),
      calories,
      steps,
      workoutType: workoutType || undefined,
      attachmentUrl,
    });
  };

  const adjustCalories = (amount: number) => {
    setCalories(Math.max(0, calories + amount));
  };

  const adjustSteps = (amount: number) => {
    setSteps(Math.max(0, steps + amount));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-select-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(day) => day && setDate(day)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calories">Calories Burned</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => adjustCalories(-100)}
                data-testid="button-decrease-calories"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                className="text-center"
                data-testid="input-calories"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => adjustCalories(100)}
                data-testid="button-increase-calories"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => adjustCalories(500)}
                data-testid="button-add-500-cal"
              >
                +500
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => adjustCalories(1000)}
                data-testid="button-add-1000-cal"
              >
                +1000
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="steps">Steps</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => adjustSteps(-1000)}
                data-testid="button-decrease-steps"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="steps"
                type="number"
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
                className="text-center"
                data-testid="input-steps"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => adjustSteps(1000)}
                data-testid="button-increase-steps"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workout">Workout Type</Label>
            <Select value={workoutType} onValueChange={setWorkoutType}>
              <SelectTrigger id="workout" data-testid="select-workout-type">
                <SelectValue placeholder="Select workout type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="cycling">Cycling</SelectItem>
                <SelectItem value="swimming">Swimming</SelectItem>
                <SelectItem value="weightlifting">Weightlifting</SelectItem>
                <SelectItem value="yoga">Yoga</SelectItem>
                <SelectItem value="crossfit">CrossFit</SelectItem>
                <SelectItem value="hiking">Hiking</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachment">Evidence (Optional)</Label>
            <div className="space-y-3">
              {!attachmentPreview ? (
                <div className="flex items-center gap-2">
                  <Input
                    id="attachment"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    data-testid="input-attachment"
                  />
                  <Label
                    htmlFor="attachment"
                    className="flex-1 flex items-center justify-center gap-2 h-9 px-4 py-2 rounded-md border border-input bg-background hover-elevate cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload Photo</span>
                  </Label>
                </div>
              ) : (
                <div className="relative rounded-md overflow-hidden border">
                  <img
                    src={attachmentPreview}
                    alt="Activity evidence"
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeAttachment}
                    data-testid="button-remove-attachment"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Upload a photo of your workout or activity (Max 20MB, auto-compressed, stored for 24 hours)
              </p>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            data-testid="button-submit-entry"
            disabled={createActivityMutation.isPending}
          >
            {createActivityMutation.isPending ? "Submitting..." : "Submit Entry"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
