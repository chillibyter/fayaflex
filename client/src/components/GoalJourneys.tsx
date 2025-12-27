import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Target, 
  Plus, 
  Flame, 
  Footprints, 
  Dumbbell,
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Goal = {
  id: string;
  userId: string;
  goalType: 'daily' | 'weekly';
  category: 'calories' | 'steps' | 'workouts';
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
  completedAt: string | null;
  progressPercentage: number;
};

const categoryConfig = {
  calories: {
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    label: 'Calories',
    unit: 'cal',
    suggestions: [500, 1000, 2000, 3000],
  },
  steps: {
    icon: Footprints,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    label: 'Steps',
    unit: 'steps',
    suggestions: [5000, 10000, 15000, 20000],
  },
  workouts: {
    icon: Dumbbell,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    label: 'Workouts',
    unit: 'days',
    suggestions: [1, 3, 5, 7],
  },
};

export default function GoalJourneys() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [goalType, setGoalType] = useState<'daily' | 'weekly'>('daily');
  const [category, setCategory] = useState<'calories' | 'steps' | 'workouts'>('calories');
  const [targetValue, setTargetValue] = useState<number>(1000);

  const { data: activeGoals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['/api/goals/active'],
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: { goalType: string; category: string; targetValue: number }) => {
      const res = await apiRequest('POST', '/api/goals', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/goals/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      setIsDialogOpen(false);
      toast({
        title: "Goal Created",
        description: `Your ${goalType} ${category} goal has been set!`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateGoal = () => {
    createGoalMutation.mutate({ goalType, category, targetValue });
  };

  const config = categoryConfig[category];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="w-5 h-5 text-primary" />
          Goal Journeys
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" data-testid="button-add-goal">
              <Plus className="w-4 h-4 mr-1" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set a New Goal</DialogTitle>
              <DialogDescription>
                Create a daily or weekly quest to challenge yourself
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Goal Type</Label>
                <Select value={goalType} onValueChange={(v) => setGoalType(v as 'daily' | 'weekly')}>
                  <SelectTrigger data-testid="select-goal-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Daily Quest
                      </div>
                    </SelectItem>
                    <SelectItem value="weekly">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Weekly Quest
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => {
                  setCategory(v as 'calories' | 'steps' | 'workouts');
                  setTargetValue(categoryConfig[v as 'calories' | 'steps' | 'workouts'].suggestions[1]);
                }}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calories">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        Calories Burned
                      </div>
                    </SelectItem>
                    <SelectItem value="steps">
                      <div className="flex items-center gap-2">
                        <Footprints className="w-4 h-4 text-blue-500" />
                        Steps Taken
                      </div>
                    </SelectItem>
                    <SelectItem value="workouts">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-purple-500" />
                        Workout Days
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target ({config.unit})</Label>
                <Input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(parseInt(e.target.value) || 0)}
                  min={1}
                  data-testid="input-target-value"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {config.suggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => setTargetValue(suggestion)}
                      className={targetValue === suggestion ? 'border-primary' : ''}
                      data-testid={`button-suggestion-${suggestion}`}
                    >
                      {suggestion.toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleCreateGoal} 
                className="w-full"
                disabled={createGoalMutation.isPending}
                data-testid="button-create-goal"
              >
                {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            <div className="h-16 bg-muted/50 rounded-lg animate-pulse" />
          </div>
        ) : activeGoals.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No active goals</p>
            <p className="text-sm">Set a daily or weekly challenge to stay motivated!</p>
          </div>
        ) : (
          activeGoals.map((goal) => {
            const goalConfig = categoryConfig[goal.category];
            const IconComponent = goalConfig.icon;
            
            return (
              <div
                key={goal.id}
                className={`p-4 rounded-lg ${goalConfig.bgColor} border border-transparent`}
                data-testid={`goal-card-${goal.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className={`w-5 h-5 ${goalConfig.color}`} />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {goal.targetValue.toLocaleString()} {goalConfig.unit}
                        {goal.isCompleted && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {goal.goalType === 'daily' ? 'Daily Quest' : 'Weekly Quest'}
                      </div>
                    </div>
                  </div>
                  <Badge variant={goal.isCompleted ? 'default' : 'secondary'} className="shrink-0">
                    {goal.isCompleted ? 'Complete' : `${goal.progressPercentage}%`}
                  </Badge>
                </div>
                <Progress 
                  value={goal.progressPercentage} 
                  className="h-2"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}</span>
                  <span>
                    {goal.goalType === 'daily' ? 'Ends today' : `Ends ${goal.endDate}`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
