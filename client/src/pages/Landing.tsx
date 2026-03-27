import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Trophy, Users, TrendingUp, Target, Footprints, Flame, Dumbbell, ChevronRight, ArrowLeft, CheckCircle } from "lucide-react";
import { SiApple } from "react-icons/si";
import RotatingBanner, { defaultBannerMessages } from "@/components/RotatingBanner";

const APP_STORE_URL = "https://apps.apple.com/us/app/fayaflex/id6757204288";

type GoalType = "steps" | "calories" | "workouts";

const GOAL_OPTIONS: { type: GoalType; icon: typeof Footprints; label: string; description: string }[] = [
  { type: "steps", icon: Footprints, label: "Steps", description: "Daily step count competition" },
  { type: "calories", icon: Flame, label: "Calories", description: "Active calorie burn challenge" },
  { type: "workouts", icon: Dumbbell, label: "Workouts", description: "Most workout sessions wins" },
];

export default function Landing() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [teamName, setTeamName] = useState("");
  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [, setLocation] = useLocation();

  const openWizard = () => {
    setStep(1);
    setTeamName("");
    setGoalType(null);
    setWizardOpen(true);
  };

  const handleLaunch = () => {
    if (!teamName.trim() || !goalType) return;
    sessionStorage.setItem(
      "fayaflex_draft_team",
      JSON.stringify({ teamName: teamName.trim(), goalType })
    );
    setWizardOpen(false);
    setLocation("/auth");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/fayaflex-logo.webp"
            alt="FayaFlex"
            className="h-10 w-10 rounded-md"
          />
          <h1 className="text-xl font-bold">FayaFlex</h1>
        </div>
        <a href="/auth">
          <Button data-testid="button-login">Log In</Button>
        </a>
      </header>

      <main className="flex-1">
        <section className="relative py-20 px-4 text-center">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--chart-2) / 0.1) 100%)",
            }}
          />
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Track, Compete, Win Together
            </h2>

            <RotatingBanner
              messages={defaultBannerMessages}
              className="mb-8 [&_p]:text-xl [&_p]:max-w-2xl [&_p]:mx-auto"
            />

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center flex-wrap">
              <Button
                size="lg"
                className="text-lg"
                onClick={openWizard}
                data-testid="button-start-team"
              >
                <Users className="h-5 w-5 mr-2" />
                Start a New Team
              </Button>
              <a href="/auth">
                <Button size="lg" variant="outline" className="text-lg" data-testid="button-get-started">
                  Get Started
                </Button>
              </a>
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="text-lg" data-testid="button-app-store-hero">
                  <SiApple className="h-5 w-5 mr-2" />
                  App Store
                </Button>
              </a>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12">Why FayaFlex?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Track Progress</h4>
                  <p className="text-sm text-muted-foreground">
                    Log calories, steps, and workouts with manual entry or device sync
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Team Competition</h4>
                  <p className="text-sm text-muted-foreground">
                    Create teams, invite friends, and compete together
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Leaderboards</h4>
                  <p className="text-sm text-muted-foreground">
                    See rankings and celebrate monthly winners
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Visualize Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Track your progress with beautiful charts and stats
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl font-bold mb-6">Ready to Start Your Fitness Journey?</h3>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of users competing in monthly fitness challenges.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center flex-wrap">
              <Button
                size="lg"
                className="text-lg"
                onClick={openWizard}
                data-testid="button-join-now"
              >
                Start a New Team — It's Free
              </Button>
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="text-lg" data-testid="button-app-store-cta">
                  <SiApple className="h-5 w-5 mr-2" />
                  Download on the App Store
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 px-4 text-center text-sm text-muted-foreground">
        <p>&copy; 2025 FayaFlex. All rights reserved.</p>
      </footer>

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              {step === 1 && "Name Your Team"}
              {step === 2 && "Choose Your Goal"}
              {step === 3 && "Almost There!"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {step === 1 && "Step 1 of 3 — Pick a name that motivates your crew."}
              {step === 2 && "Step 2 of 3 — What will you compete on?"}
              {step === 3 && "Step 3 of 3 — Create your free account to launch."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s <= step ? "bg-primary w-8" : "bg-muted w-4"
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="team-name-input">Team Name</Label>
                <Input
                  id="team-name-input"
                  placeholder="e.g. Office Warriors, Weekend Runners..."
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && teamName.trim() && setStep(2)}
                  autoFocus
                  data-testid="input-wizard-team-name"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => setStep(2)}
                disabled={!teamName.trim()}
                data-testid="button-wizard-next-1"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 pt-2">
              {GOAL_OPTIONS.map(({ type, icon: Icon, label, description }) => (
                <button
                  key={type}
                  onClick={() => setGoalType(type)}
                  className={`w-full flex items-center gap-3 p-3 rounded-md border text-left transition-colors ${
                    goalType === type
                      ? "border-primary bg-primary/5"
                      : "border-border hover-elevate"
                  }`}
                  data-testid={`button-wizard-goal-${type}`}
                >
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                    goalType === type ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <Icon className={`h-5 w-5 ${goalType === type ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  {goalType === type && (
                    <CheckCircle className="h-4 w-4 text-primary ml-auto shrink-0" />
                  )}
                </button>
              ))}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setStep(1)} data-testid="button-wizard-back-2">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setStep(3)}
                  disabled={!goalType}
                  data-testid="button-wizard-next-2"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 pt-2 text-center">
              <div className="bg-muted/50 rounded-md p-4 text-left space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Team: </span>
                  <span className="font-semibold">{teamName}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Goal: </span>
                  <span className="font-semibold capitalize">{goalType}</span>
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Create a free account and your team will be set up instantly. Then invite your friends with a single link.
              </p>
              <Button
                className="w-full"
                onClick={handleLaunch}
                data-testid="button-wizard-launch"
              >
                Save & Create Account
              </Button>
              <Button variant="ghost" onClick={() => setStep(2)} className="w-full" data-testid="button-wizard-back-3">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
