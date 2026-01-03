import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dumbbell, 
  Apple, 
  RefreshCw,
  Clock,
  Flame,
  Zap,
  Droplets,
  Target
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import fayaIcon from "@assets/generated_images/faya_ai_coach_flame_face.png";

type AICoachSuggestions = {
  greeting: string;
  workoutSuggestion: {
    title: string;
    description: string;
    duration: string;
    intensity: "low" | "medium" | "high";
    calorieEstimate: number;
  };
  nutritionTip: {
    title: string;
    description: string;
    focus: "hydration" | "protein" | "carbs" | "recovery" | "energy";
  };
  motivation: string;
  stats: {
    weeklyCalories: number;
    weeklySteps: number;
    workoutDays: number;
    todayCalories: number;
    todaySteps: number;
  };
};

const intensityColors = {
  low: "bg-green-500/10 text-green-600 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  high: "bg-red-500/10 text-red-600 border-red-500/20",
};

const focusIcons = {
  hydration: Droplets,
  protein: Target,
  carbs: Zap,
  recovery: RefreshCw,
  energy: Flame,
};

export default function AICoach() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { 
    data, 
    isLoading, 
    isError,
    refetch 
  } = useQuery<AICoachSuggestions>({
    queryKey: ['/api/ai-coach/suggestions'],
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    refetchOnWindowFocus: false,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['/api/ai-coach/suggestions'] });
    await refetch();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-2">
            <img src={fayaIcon} alt="Faya" className="h-6 w-6 rounded-full" />
            <CardTitle className="text-lg">Faya</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-2">
            <img src={fayaIcon} alt="Faya" className="h-6 w-6 rounded-full" />
            <CardTitle className="text-lg">Faya</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">Unable to load suggestions</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} data-testid="button-retry-ai">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const FocusIcon = focusIcons[data.nutritionTip.focus] || Apple;

  return (
    <Card className="overflow-hidden" data-testid="card-ai-coach">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src={fayaIcon} alt="Faya" className="h-6 w-6 rounded-full" />
            <CardTitle className="text-lg">Faya</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8"
            data-testid="button-refresh-ai"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1" data-testid="text-ai-greeting">
          {data.greeting}
        </p>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Today's Workout</span>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 space-y-2" data-testid="card-workout-suggestion">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="font-semibold">{data.workoutSuggestion.title}</h4>
              <Badge 
                variant="outline" 
                className={intensityColors[data.workoutSuggestion.intensity]}
              >
                {data.workoutSuggestion.intensity}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.workoutSuggestion.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {data.workoutSuggestion.duration}
              </span>
              <span className="flex items-center gap-1">
                <Flame className="h-3 w-3 text-orange-500" />
                ~{data.workoutSuggestion.calorieEstimate} kcal
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Apple className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Nutrition Tip</span>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 space-y-2" data-testid="card-nutrition-tip">
            <div className="flex items-center gap-2">
              <FocusIcon className="h-4 w-4 text-primary" />
              <h4 className="font-semibold">{data.nutritionTip.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {data.nutritionTip.description}
            </p>
          </div>
        </div>

        <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
          <p className="text-sm text-center italic" data-testid="text-motivation">
            "{data.motivation}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
