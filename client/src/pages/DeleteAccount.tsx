import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Trash2, Database, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function DeleteAccount() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      toast({
        title: "Confirmation Required",
        description: "Please type DELETE to confirm account deletion",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await apiRequest("DELETE", "/api/auth/user");
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      setLocation("/");
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-14 items-center px-4">
          <Link href="/profile">
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
          <h1 className="text-2xl font-bold mb-2" data-testid="text-page-title">Delete Your Account</h1>
          <p className="text-muted-foreground">
            Permanently delete your FayaFlex account and all associated data
          </p>
        </div>

        {user && (
          <Card className="mb-6 border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                <Trash2 className="h-5 w-5" />
                Delete Account Now
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You are logged in as <strong>{user.username}</strong>. You can permanently delete your account by clicking the button below.
              </p>
              <Button
                variant="destructive"
                size="lg"
                className="w-full"
                onClick={() => setShowConfirmDialog(true)}
                data-testid="button-delete-account"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete My Account
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-primary" />
              Data That Will Be Deleted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              When you delete your account, the following data will be <strong>permanently removed</strong>:
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
              <li className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                <span><strong>Messages:</strong> All direct messages sent and received</span>
              </li>
              <li className="flex items-start gap-2">
                <Trash2 className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                <span><strong>Challenges:</strong> All teammate challenges you've created or participated in</span>
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

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Your Account?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This action <strong>cannot be undone</strong>. This will permanently delete your account and remove all your data from our servers.
              </p>
              <div className="space-y-2">
                <Label htmlFor="confirm-delete">
                  Type <strong>DELETE</strong> to confirm:
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="Type DELETE"
                  className="font-mono"
                  data-testid="input-confirm-delete"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={confirmText !== "DELETE" || isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
