import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Users, TrendingUp, Target } from "lucide-react";
import RotatingBanner, { defaultBannerMessages } from "@/components/RotatingBanner";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/fayaflex-logo.png" 
            alt="FayaFlex" 
            className="h-10 w-10 rounded-md"
          />
          <h1 className="text-xl font-bold">FayaFlex</h1>
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
            
            <RotatingBanner 
              messages={defaultBannerMessages}
              className="mb-8 [&_p]:text-xl [&_p]:max-w-2xl [&_p]:mx-auto"
            />

            <a href="/api/login">
              <Button size="lg" className="text-lg" data-testid="button-get-started">
                Get Started
              </Button>
            </a>
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
            <a href="/api/login">
              <Button size="lg" className="text-lg" data-testid="button-join-now">
                Join Now - It's Free
              </Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 px-4 text-center text-sm text-muted-foreground">
        <p>&copy; 2025 FayaFlex. All rights reserved.</p>
      </footer>
    </div>
  );
}
