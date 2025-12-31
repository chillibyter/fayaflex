import { Link } from "wouter";
import { ArrowLeft, Trash2, Mail, Clock, Database, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DeleteAccount() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-14 items-center px-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="ml-2 text-lg font-semibold">Account Deletion</h1>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <Trash2 className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2" data-testid="text-page-title">FayaFlex Account Deletion</h1>
          <p className="text-muted-foreground">
            Request deletion of your FayaFlex account and associated data
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-primary" />
              How to Request Account Deletion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To delete your FayaFlex account and all associated data, please follow these steps:
            </p>
            
            <ol className="space-y-4" data-testid="list-deletion-steps">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">1</span>
                <div>
                  <p className="font-medium">Send an email to our support team</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Email: <a href="mailto:support@fayaflex.com" className="text-primary hover:underline" data-testid="link-support-email">support@fayaflex.com</a>
                  </p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">2</span>
                <div>
                  <p className="font-medium">Use the subject line</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Subject: <span className="font-mono bg-muted px-2 py-0.5 rounded">Account Deletion Request</span>
                  </p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">3</span>
                <div>
                  <p className="font-medium">Include your account information</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Please include your FayaFlex username or the email address associated with your account
                  </p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">4</span>
                <div>
                  <p className="font-medium">Wait for confirmation</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    We will send you a confirmation email once your account deletion request has been processed
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Processing Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Account deletion requests are processed within <strong>30 days</strong> of receiving your request. 
              You will receive an email confirmation once your account and data have been permanently deleted.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-primary" />
              Data That Will Be Deleted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              When you request account deletion, the following data will be <strong>permanently removed</strong>:
            </p>
            <ul className="space-y-2 text-muted-foreground" data-testid="list-deleted-data">
              <li className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                <span><strong>Account Information:</strong> Username, email address, name, profile picture, and location data</span>
              </li>
              <li className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                <span><strong>Activity History:</strong> All recorded calories, steps, workouts, and uploaded evidence photos</span>
              </li>
              <li className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                <span><strong>Team Memberships:</strong> Your membership in all teams (you will be removed from all teams)</span>
              </li>
              <li className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                <span><strong>Social Interactions:</strong> Comments and reactions you have made on activities</span>
              </li>
              <li className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                <span><strong>Goals:</strong> All fitness goals and progress tracking data</span>
              </li>
              <li className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                <span><strong>Device Connections:</strong> Any connected health devices or passkeys</span>
              </li>
              <li className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                <span><strong>Health Data:</strong> Any synced data from Apple Health, Android Health Connect, or Huawei Health</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Data That May Be Retained
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              Certain data may be retained for legal or operational purposes:
            </p>
            <ul className="space-y-2 text-muted-foreground" data-testid="list-retained-data">
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span><strong>Legal Compliance:</strong> Data required to comply with legal obligations, resolve disputes, or enforce our agreements (retained as required by law)</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span><strong>Anonymized Analytics:</strong> Aggregated, non-identifiable usage statistics that cannot be linked back to you</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span><strong>Backup Retention:</strong> Your data may temporarily remain in encrypted backups for up to 90 days after deletion before being permanently purged</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8 border-amber-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Important Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              <strong>Account deletion is permanent and cannot be undone.</strong> Once your account is deleted:
            </p>
            <ul className="space-y-1 text-muted-foreground list-disc pl-5">
              <li>You will not be able to recover your account or any associated data</li>
              <li>Your username will become available for new users to register</li>
              <li>If you owned any teams, ownership will be transferred to another admin or the team will be archived</li>
              <li>Your leaderboard rankings and achievements will be removed</li>
            </ul>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <Button asChild size="lg" data-testid="button-send-email">
            <a href="mailto:support@fayaflex.com?subject=Account%20Deletion%20Request">
              <Mail className="h-4 w-4 mr-2" />
              Send Deletion Request
            </a>
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Have questions? Visit our{" "}
            <Link href="/support" className="text-primary hover:underline" data-testid="link-support">
              Support page
            </Link>{" "}
            or read our{" "}
            <Link href="/privacy" className="text-primary hover:underline" data-testid="link-privacy">
              Privacy Policy
            </Link>
          </p>
        </div>

        <footer className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>FayaFlex - Fitness Competition Platform</p>
          <p className="mt-1">© 2025 FayaFlex. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
