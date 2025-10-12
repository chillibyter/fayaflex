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
import { CalendarIcon, Plus, Minus } from "lucide-react";
import { format } from "date-fns";

export default function DataEntryForm() {
  const [date, setDate] = useState<Date>(new Date());
  const [calories, setCalories] = useState(0);
  const [steps, setSteps] = useState(0);
  const [workoutType, setWorkoutType] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted:", { date, calories, steps, workoutType });
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

          <Button type="submit" className="w-full" data-testid="button-submit-entry">
            Submit Entry
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
