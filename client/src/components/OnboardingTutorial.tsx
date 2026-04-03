import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Flame,
  Footprints,
  Dumbbell,
  Users,
  TrendingUp,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Target,
  Award,
} from "lucide-react";

interface OnboardingTutorialProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const slides = [
  {
    id: "welcome",
    title: "Welcome to FayaFlex!",
    description: "Ready to transform your fitness journey? Let's show you how to climb the leaderboards and achieve your goals.",
    icon: Trophy,
    color: "text-primary",
    bgColor: "bg-primary/10",
    tips: [
      "Compete with teammates",
      "Track daily progress",
      "Win monthly challenges",
    ],
  },
  {
    id: "scoring",
    title: "How Scoring Works",
    description: "Your score is based on calories burned. Here's what you can track:",
    icon: Target,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    scoreBreakdown: [
      { icon: Flame, label: "Calories Burned", value: "1 point per calorie", example: "500 cal = 500 pts" },
      { icon: Dumbbell, label: "Workouts", value: "Calories burned during workout", example: "Gym, running, cycling, etc." },
      { icon: Footprints, label: "Steps Taken", value: "Track for personal goals", example: "Not counted in rankings" },
    ],
  },
  {
    id: "leaderboards",
    title: "Individual vs Team Rankings",
    description: "Two ways to compete and win recognition:",
    icon: TrendingUp,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    comparisons: [
      {
        title: "Individual Leaderboard",
        icon: Award,
        points: ["Your personal total score", "Compete against all users", "Monthly rankings reset on the 1st"],
      },
      {
        title: "Team Leaderboard",
        icon: Users,
        points: ["Combined team member scores", "Collaborate to win together", "View within your team page"],
      },
    ],
  },
  {
    id: "monthly",
    title: "Monthly Challenges",
    description: "Rankings reset on the 1st of each month, giving everyone a fresh start!",
    icon: Calendar,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    timeline: [
      { label: "1st of Month", description: "New challenge begins - fresh start for everyone!" },
      { label: "Throughout Month", description: "Log activities daily to climb ranks" },
      { label: "End of Month", description: "Top performers are crowned champions" },
      { label: "Victory Wall", description: "Monthly winners are immortalized forever" },
    ],
  },
  {
    id: "getstarted",
    title: "Ready to Start?",
    description: "Log your first activity now and watch your rank appear on the leaderboard!",
    icon: Sparkles,
    color: "text-primary",
    bgColor: "bg-primary/10",
    actions: [
      { icon: Dumbbell, label: "Track a Workout", description: "Log calories from any exercise" },
      { icon: Footprints, label: "Log Your Steps", description: "Manual entry or sync from device" },
      { icon: Flame, label: "Add Calories", description: "Record calories burned today" },
    ],
  },
];

export default function OnboardingTutorial({ onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const progress = ((currentSlide + 1) / slides.length) * 100;
  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
      style={{
        paddingTop: '16px',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      }}
    >
      <Card className="w-full max-w-2xl flex flex-col overflow-hidden" style={{ maxHeight: '100%' }}>
        <CardContent className="p-0 flex flex-col flex-1 min-h-0">
          {/* Fixed Header */}
          <div className="p-4 pb-2 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">
                Step {currentSlide + 1} of {slides.length}
              </span>
              {onSkip && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  data-testid="button-skip-onboarding"
                >
                  Skip Tutorial
                </Button>
              )}
            </div>
            <Progress value={progress} className="h-1" />
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-2 min-h-0">

            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${slide.bgColor} mb-4`}>
                    <slide.icon className={`w-8 h-8 ${slide.color}`} />
                  </div>
                  <h2 className="text-2xl font-bold mb-2" data-testid={`text-slide-title-${slide.id}`}>
                    {slide.title}
                  </h2>
                  <p className="text-muted-foreground">{slide.description}</p>
                </div>

                {slide.tips && (
                  <div className="grid gap-3 mb-6">
                    {slide.tips.map((tip, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                          {i + 1}
                        </div>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                )}

                {slide.scoreBreakdown && (
                  <div className="space-y-3 mb-6">
                    {slide.scoreBreakdown.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-sm text-muted-foreground">{item.value}</div>
                          <div className="text-xs font-medium text-primary mt-0.5">{item.example}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {slide.comparisons && (
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {slide.comparisons.map((comp, i) => (
                      <div key={i} className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-3">
                          <comp.icon className="w-5 h-5 text-blue-500" />
                          <span className="font-semibold">{comp.title}</span>
                        </div>
                        <ul className="space-y-2">
                          {comp.points.map((point, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <ChevronRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {slide.timeline && (
                  <div className="space-y-3 mb-6">
                    {slide.timeline.map((item, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-purple-500" />
                          {i < slide.timeline.length - 1 && (
                            <div className="w-0.5 h-8 bg-purple-500/30" />
                          )}
                        </div>
                        <div className="pb-4">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {slide.actions && (
                  <div className="grid gap-3 mb-6">
                    {slide.actions.map((action, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 rounded-lg bg-muted/50"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <action.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{action.label}</div>
                          <div className="text-sm text-muted-foreground">{action.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Fixed Footer - Always Visible */}
          <div className="flex-shrink-0 p-4 pt-3 border-t bg-card">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentSlide === 0}
                data-testid="button-onboarding-prev"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>

              <div className="flex gap-1">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentSlide ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                    data-testid={`button-slide-indicator-${i}`}
                  />
                ))}
              </div>

              <Button onClick={handleNext} data-testid="button-onboarding-next">
                {isLastSlide ? "Get Started" : "Next"}
                {!isLastSlide && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
