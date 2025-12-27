import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, TrendingUp, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const bannerMessages = [
  "Track your fitness journey, compete with friends, and achieve your health goals together!",
  "Earn 1 point per calorie burned + 1 point per step taken. The more active you are, the higher you score!",
  "Compete on team leaderboards (based on average scores) or individual leaderboards to see who's the most active!",
];

export default function Landing() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerMessages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
            <Trophy className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Ultimate Fitness Challenge</h1>
        </div>
        <a href="/api/login">
          <Button data-testid="button-login">Log In</Button>
        </a>
      </header>

      <main className="flex-1">
        <section className="relative py-20 px-4 text-center">
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--chart-2) / 0.1) 100%)",
            }}
          />
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Track, Compete, Win Together
            </h2>
            
            <div className="h-20 md:h-16 flex items-center justify-center mb-8">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-xl text-muted-foreground max-w-2xl mx-auto"
                  data-testid={`banner-message-${currentIndex}`}
                >
                  {bannerMessages[currentIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="flex justify-center gap-2 mb-8">
              {bannerMessages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-primary w-6"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  data-testid={`banner-dot-${index}`}
                  aria-label={`Go to message ${index + 1}`}
                />
              ))}
            </div>

            <a href="/api/login">
              <Button size="lg" className="text-lg" data-testid="button-get-started">
                Get Started
              </Button>
            </a>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12">Why UFC?</h3>
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
            <a href="/api/login">
              <Button size="lg" className="text-lg" data-testid="button-join-now">
                Join Now - It's Free
              </Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 px-4 text-center text-sm text-muted-foreground">
        <p>&copy; 2025 Ultimate Fitness Challenge. All rights reserved.</p>
      </footer>
    </div>
  );
}
