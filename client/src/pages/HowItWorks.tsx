import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Trophy,
  Flame,
  Footprints,
  Dumbbell,
  Users,
  TrendingUp,
  Calendar,
  HelpCircle,
  Target,
  Award,
  Zap,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <Badge className="mb-4">Scoring Guide</Badge>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-howitworks-title">
          How Scoring Works
        </h1>
        <p className="text-muted-foreground">
          Everything you need to know about earning points and climbing the leaderboard
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Earning Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your score is the total of all your logged activities. Every calorie burned and every step taken counts!
          </p>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-semibold">Calories</span>
              </div>
              <p className="text-2xl font-bold text-orange-500">1 point</p>
              <p className="text-sm text-muted-foreground">per calorie burned</p>
              <div className="mt-3 pt-3 border-t border-orange-500/20">
                <p className="text-sm">
                  <span className="font-medium">Example:</span> 500 calories = 500 points
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Footprints className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">Steps</span>
              </div>
              <p className="text-2xl font-bold text-blue-500">1 point</p>
              <p className="text-sm text-muted-foreground">per step taken</p>
              <div className="mt-3 pt-3 border-t border-blue-500/20">
                <p className="text-sm">
                  <span className="font-medium">Example:</span> 10,000 steps = 10,000 points
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-5 h-5 text-purple-500" />
                <span className="font-semibold">Workouts</span>
              </div>
              <p className="text-2xl font-bold text-purple-500">Calories</p>
              <p className="text-sm text-muted-foreground">burned during workout</p>
              <div className="mt-3 pt-3 border-t border-purple-500/20">
                <p className="text-sm">
                  <span className="font-medium">Example:</span> 45min run = 400 points
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 mt-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold">Total Score Formula</p>
                <p className="text-sm text-muted-foreground">
                  Your total score = Total Calories + Total Steps (from all activities in the current month)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Leaderboard Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-yellow-500" />
                <h3 className="text-lg font-semibold">Individual Leaderboard</h3>
              </div>
              <p className="text-muted-foreground">
                Compete against all users in the app. Your personal score determines your rank.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <ChevronRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span>Shows your rank among all active users</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <ChevronRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span>Based on your total monthly score</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <ChevronRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span>Top 3 get special recognition</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-500" />
                <h3 className="text-lg font-semibold">Team Leaderboard</h3>
              </div>
              <p className="text-muted-foreground">
                See how you stack up within your team. Collaborate to boost team totals!
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <ChevronRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span>Rank among your team members only</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <ChevronRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span>Team total = sum of all member scores</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <ChevronRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span>Monthly winners go on the Victory Wall</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Monthly Reset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Every month brings a fresh start! Leaderboards reset on the 1st of each month.
          </p>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-purple-500 to-primary/30" />
            
            <div className="space-y-6 pl-10">
              <div className="relative">
                <div className="absolute -left-6 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                <div>
                  <p className="font-semibold">1st of Each Month</p>
                  <p className="text-sm text-muted-foreground">
                    All scores reset to zero. Everyone starts fresh!
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 w-3 h-3 rounded-full bg-purple-500 border-2 border-background" />
                <div>
                  <p className="font-semibold">Throughout the Month</p>
                  <p className="text-sm text-muted-foreground">
                    Log activities daily to accumulate points and climb the ranks.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 w-3 h-3 rounded-full bg-yellow-500 border-2 border-background" />
                <div>
                  <p className="font-semibold">End of Month</p>
                  <p className="text-sm text-muted-foreground">
                    Top performers are crowned monthly champions!
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                <div>
                  <p className="font-semibold">Victory Wall</p>
                  <p className="text-sm text-muted-foreground">
                    Monthly team winners are immortalized on the Victory Wall.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Tips for Success
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-semibold mb-2">Log Activities Daily</p>
              <p className="text-sm text-muted-foreground">
                Consistent logging helps you track progress and maintain your ranking. Don't forget to log after each workout!
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-semibold mb-2">Connect Your Devices</p>
              <p className="text-sm text-muted-foreground">
                Link Apple Health or Android Health Connect for automatic step and calorie tracking.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-semibold mb-2">Encourage Your Team</p>
              <p className="text-sm text-muted-foreground">
                Cheer on teammates with reactions and comments on their activities. Motivation goes both ways!
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <p className="font-semibold mb-2">Start Early Each Month</p>
              <p className="text-sm text-muted-foreground">
                The leaderboard resets on the 1st. Get a head start on the competition!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Link href="/track">
          <Button size="lg" data-testid="button-start-tracking">
            <Dumbbell className="w-4 h-4 mr-2" />
            Start Tracking
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        <Link href="/leaderboard">
          <Button variant="outline" size="lg" data-testid="button-view-leaderboard">
            <Trophy className="w-4 h-4 mr-2" />
            View Leaderboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
