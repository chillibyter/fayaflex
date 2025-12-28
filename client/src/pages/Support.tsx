import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Mail, MessageCircle, HelpCircle, ChevronLeft } from "lucide-react";
import { Link } from "wouter";

export default function Support() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">Ultimate Fitness Challenge</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Support Center</h1>
          <p className="text-muted-foreground">We're here to help you get the most out of Ultimate Fitness Challenge</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Have a question or need help? Send us an email and we'll get back to you within 24-48 hours.
              </p>
              <a href="mailto:support@ultimatefitnesschallenge.com">
                <Button className="w-full" data-testid="button-email-support">
                  support@ultimatefitnesschallenge.com
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Have suggestions for improving the app? We'd love to hear from you!
              </p>
              <a href="mailto:feedback@ultimatefitnesschallenge.com">
                <Button variant="outline" className="w-full" data-testid="button-feedback">
                  Send Feedback
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold">How do I track my activities?</h3>
              <p className="text-muted-foreground text-sm">
                You can log your calories, steps, and workouts manually through the Track Activity page. On iOS, you can also sync with Apple Health to automatically import your data.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">How is my score calculated?</h3>
              <p className="text-muted-foreground text-sm">
                Your score is simple: 1 point per calorie burned + 1 point per step taken. The more active you are, the higher your score!
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">How do team leaderboards work?</h3>
              <p className="text-muted-foreground text-sm">
                Team rankings are based on the average score of all team members. This means every member's contribution matters equally, regardless of team size.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">When do leaderboards reset?</h3>
              <p className="text-muted-foreground text-sm">
                Leaderboards reset on the 1st of each month. Monthly winners are celebrated on the Victory Wall!
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">How do I reset my password?</h3>
              <p className="text-muted-foreground text-sm">
                On the login screen, tap "Forgot password?" and enter your email address. You'll receive a link to reset your password.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">How do I connect Apple Health?</h3>
              <p className="text-muted-foreground text-sm">
                Go to your Profile, then tap on "Fitness Devices" to connect Apple Health. You'll need to grant permission for the app to read your health data.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Can I be on multiple teams?</h3>
              <p className="text-muted-foreground text-sm">
                Yes! You can join multiple teams and compete on different leaderboards simultaneously.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Ultimate Fitness Challenge</p>
          <p>Version 1.0</p>
        </div>
      </main>
    </div>
  );
}
