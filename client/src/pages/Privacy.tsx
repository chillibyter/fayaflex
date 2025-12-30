import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronLeft, Shield, Lock, Eye, Trash2, Download, Mail } from "lucide-react";
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
            <img 
              src="/fayaflex-logo.png" 
              alt="FayaFlex" 
              className="h-8 w-8 rounded-md"
            />
            <span className="font-semibold">FayaFlex</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: December 28, 2025</p>
          <p className="text-muted-foreground text-sm">Effective Date: December 28, 2025</p>
        </div>

        <Card>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none pt-6 space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Introduction
              </h2>
              <p className="text-muted-foreground">
                FayaFlex ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application for iOS and Android, and our website (collectively, the "Service").
              </p>
              <p className="text-muted-foreground mt-2">
                By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with this policy, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Information We Collect
              </h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">1. Account Information</h3>
              <p className="text-muted-foreground">
                When you create an account, we collect:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                <li><strong>Required:</strong> Username, email address, and password</li>
                <li><strong>Optional:</strong> First name and last name</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                <strong>Data linked to identity:</strong> Yes. This information is linked to your user account.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">2. Health and Fitness Data</h3>
              <p className="text-muted-foreground">
                We collect fitness data to provide our core service:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                <li><strong>Manually entered data:</strong> Calories burned, steps taken, workout duration and type</li>
                <li><strong>Apple Health data (iOS):</strong> If you grant permission, we read daily steps, active energy burned, and workout sessions</li>
                <li><strong>Health Connect data (Android):</strong> If you grant permission, we read daily steps, active calories, and exercise sessions</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                <strong>Data linked to identity:</strong> Yes. Fitness data is linked to your account to calculate scores and display on leaderboards.
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Data used for tracking:</strong> No. We do not use your health data for advertising or tracking purposes.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">3. Usage Data</h3>
              <p className="text-muted-foreground">
                We automatically collect certain information when you use the Service:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                <li>Device type and operating system</li>
                <li>App version</li>
                <li>General usage patterns (pages visited, features used)</li>
                <li>Crash logs and error reports</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                <strong>Data linked to identity:</strong> No. Usage data is collected anonymously for app improvement purposes.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">4. User-Generated Content</h3>
              <p className="text-muted-foreground">
                When using social features, we collect:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                <li>Activity evidence photos you upload</li>
                <li>Comments on activities</li>
                <li>Reactions to other users' activities</li>
                <li>Team memberships and affiliations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
              <p className="text-muted-foreground">We use the collected information for:</p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                <li><strong>Core Service:</strong> Calculate and display your fitness scores, rankings, and progress</li>
                <li><strong>Team Features:</strong> Enable team creation, membership, and team leaderboards</li>
                <li><strong>Achievements:</strong> Award badges and track personal bests</li>
                <li><strong>Communication:</strong> Send password reset emails and important service notifications</li>
                <li><strong>Improvement:</strong> Analyze usage patterns to improve the Service</li>
                <li><strong>Support:</strong> Respond to your inquiries and provide customer support</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Information Sharing and Disclosure</h2>
              
              <h3 className="text-lg font-medium mt-4 mb-2">Information Visible to Other Users</h3>
              <p className="text-muted-foreground">
                As part of the Service's social and competitive features, certain information is visible to other users:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                <li>Your username and display name</li>
                <li>Your fitness scores on team and global leaderboards</li>
                <li>Your badges and achievements</li>
                <li>Your team memberships</li>
                <li>Activity submissions you share with your team</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                <strong>Note:</strong> Your email address is never displayed to other users.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">Third-Party Sharing</h3>
              <p className="text-muted-foreground">
                We do <strong>not</strong> sell, trade, rent, or share your personal information with third parties for their marketing purposes. We may share information only in the following circumstances:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                <li><strong>Service Providers:</strong> With trusted service providers who assist in operating our Service (e.g., hosting, email delivery), under strict confidentiality agreements</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Apple HealthKit and Health Connect Integration</h2>
              <p className="text-muted-foreground">
                Our app integrates with Apple HealthKit (iOS) and Health Connect (Android) to read your fitness data. We are committed to handling this data responsibly:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                <li>We only access the specific data categories you explicitly authorize</li>
                <li>Health data is used solely to calculate your fitness scores within the app</li>
                <li>We do <strong>not</strong> use health data for advertising or marketing</li>
                <li>We do <strong>not</strong> sell or share health data with third parties</li>
                <li>We do <strong>not</strong> use health data for purposes unrelated to fitness tracking</li>
                <li>You can disconnect health integrations at any time in your Profile settings</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                <strong>HealthKit Disclosure:</strong> This app's use of HealthKit data is limited to reading steps, active energy, and workout data for the purpose of calculating fitness scores. This data is written to iCloud or shared with third parties only as described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Data Security
              </h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational security measures to protect your personal information:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                <li>Passwords are encrypted using scrypt, an industry-standard key derivation function</li>
                <li>All data transmission uses HTTPS encryption</li>
                <li>Authentication tokens are cryptographically signed</li>
                <li>Database access is restricted and monitored</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                While we strive to protect your information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your information as follows:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                <li><strong>Account information:</strong> Retained while your account is active</li>
                <li><strong>Activity data:</strong> Retained while your account is active</li>
                <li><strong>Usage data:</strong> Retained for up to 12 months for analytics purposes</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                Upon account deletion, we will delete your personal information within 30 days, except where retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Your Rights and Choices
              </h2>
              <p className="text-muted-foreground">
                Depending on your location, you may have certain rights regarding your personal data:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                <li><strong>Deletion:</strong> Request deletion of your data</li>
                <li><strong>Portability:</strong> Request a portable copy of your data</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for optional data processing</li>
                <li><strong>Opt-Out:</strong> Opt out of non-essential communications</li>
              </ul>
              
              <h3 className="text-lg font-medium mt-4 mb-2">For California Residents (CCPA)</h3>
              <p className="text-muted-foreground">
                California residents have additional rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                <li>Right to know what personal information is collected</li>
                <li>Right to know if personal information is sold or disclosed</li>
                <li>Right to opt-out of the sale of personal information (we do not sell your data)</li>
                <li>Right to non-discrimination for exercising privacy rights</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">For European Users (GDPR)</h3>
              <p className="text-muted-foreground">
                If you are in the European Economic Area, you have rights under the General Data Protection Regulation (GDPR), including the rights listed above. Our legal basis for processing your data includes:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                <li><strong>Contract:</strong> Processing necessary to provide the Service</li>
                <li><strong>Consent:</strong> Processing of health data with your explicit consent</li>
                <li><strong>Legitimate Interest:</strong> Processing for app improvement and security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-primary" />
                Account Deletion
              </h2>
              <p className="text-muted-foreground">
                You may request deletion of your account and all associated data at any time. To delete your account:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                <li>Email us at support@fayaflex.com with subject "Account Deletion Request"</li>
                <li>Include your username or email address associated with the account</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                We will process your request within 30 days. Upon deletion, all your personal data, activity history, and team memberships will be permanently removed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Children's Privacy</h2>
              <p className="text-muted-foreground">
                The Service is not intended for children under 13 years of age (or 16 in certain jurisdictions). We do not knowingly collect personal information from children. If we discover that a child has provided us with personal information, we will delete it promptly. If you believe a child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your own. These countries may have different data protection laws. By using the Service, you consent to such transfers. We take appropriate measures to ensure your data is protected in accordance with this policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by:
              </p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1 mt-2">
                <li>Posting the new Privacy Policy on this page</li>
                <li>Updating the "Last updated" date at the top</li>
                <li>Sending you an email notification for significant changes (if you have provided your email)</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                We encourage you to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Contact Us
              </h2>
              <p className="text-muted-foreground">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="font-medium">FayaFlex</p>
                <p className="text-muted-foreground mt-2">
                  <strong>Email:</strong> support@fayaflex.com
                </p>
                <p className="text-muted-foreground mt-1">
                  <strong>Subject Line:</strong> Privacy Inquiry
                </p>
              </div>
              <p className="text-muted-foreground mt-4">
                We will respond to your inquiry within 30 days.
              </p>
            </section>

            <section className="border-t pt-6">
              <p className="text-sm text-muted-foreground text-center">
                By using FayaFlex, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
