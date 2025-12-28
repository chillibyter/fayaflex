import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronLeft } from "lucide-react";
import { Link } from "wouter";

export default function Privacy() {
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

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: December 28, 2025</p>
        </div>

        <Card>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none pt-6 space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">Introduction</h2>
              <p className="text-muted-foreground">
                Ultimate Fitness Challenge ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website (collectively, the "Service").
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">Account Information</h3>
              <p className="text-muted-foreground">
                When you create an account, we collect your username, email address, and password. You may optionally provide your first and last name.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">Health and Fitness Data</h3>
              <p className="text-muted-foreground">
                We collect fitness data that you manually enter, including calories burned, steps taken, and workout information. If you choose to connect Apple Health or other health services, we access the specific data categories you authorize (steps, active calories, workouts) to display in the app and calculate your scores.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">Usage Data</h3>
              <p className="text-muted-foreground">
                We automatically collect certain information when you use the Service, including your device type, operating system, and general usage patterns.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                <li>To provide and maintain the Service</li>
                <li>To calculate and display your fitness scores and rankings</li>
                <li>To enable team features and leaderboards</li>
                <li>To send you password reset emails when requested</li>
                <li>To award badges and track achievements</li>
                <li>To improve and optimize the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Information Sharing</h2>
              <p className="text-muted-foreground">
                We share certain information with other users as part of the Service's core functionality:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                <li>Your username and profile information are visible to your teammates</li>
                <li>Your scores appear on team and global leaderboards</li>
                <li>Your badges and achievements are visible on your profile</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                We do not sell, trade, or rent your personal information to third parties. Your email address is never displayed to other users.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Apple Health Integration</h2>
              <p className="text-muted-foreground">
                If you choose to connect Apple Health, we access only the data categories you explicitly authorize. This data is used solely to calculate your fitness scores and is not shared with third parties. You can disconnect Apple Health at any time through your Profile settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational security measures to protect your personal information. Passwords are encrypted using industry-standard hashing algorithms. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your account information and activity data for as long as your account is active. If you wish to delete your account and associated data, please contact us at support@ultimatefitnesschallenge.com.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
              <p className="text-muted-foreground">
                Depending on your location, you may have certain rights regarding your personal data, including:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                <li>The right to access your personal data</li>
                <li>The right to correct inaccurate data</li>
                <li>The right to delete your data</li>
                <li>The right to data portability</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                To exercise these rights, please contact us at support@ultimatefitnesschallenge.com.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Children's Privacy</h2>
              <p className="text-muted-foreground">
                The Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Email:</strong> support@ultimatefitnesschallenge.com
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
