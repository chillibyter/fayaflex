import { useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, AlertCircle, Loader2, Lock, Copy, Check, Download } from "lucide-react";
import { SiApple } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

const APP_STORE_URL = "https://apps.apple.com/us/app/fayaflex/id6757204288";

// Only show App Store prompt on iPhone web browsers, not inside the native app
const isIphone = /iPhone/i.test(navigator.userAgent) && !Capacitor.isNativePlatform();

function InviteCodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast({ title: "Invite code copied!", description: "Paste it into the FayaFlex app to join." });
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = code;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      toast({ title: "Invite code copied!", description: "Paste it into the FayaFlex app to join." });
      setTimeout(() => setCopied(false), 2500);
    });
  }, [code, toast]);

  return (
    <div className="my-5 space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Invite Code</p>
      <div className="flex items-center gap-2">
        <div
          className="flex-1 rounded-md border bg-muted/50 px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.25em] text-foreground select-all"
          data-testid="text-invite-code"
        >
          {code.toUpperCase()}
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={handleCopy}
          data-testid="button-copy-invite-code"
          className="shrink-0"
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Copy this code and enter it in the FayaFlex app under Teams → Join Team
      </p>
    </div>
  );
}

export default function JoinTeam() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: team, isLoading, isError } = useQuery<{
    id: string;
    name: string;
    description: string | null;
    memberCount: number;
    isFull: boolean;
  }>({
    queryKey: ["/api/teams/invite", code],
    queryFn: async () => {
      const res = await fetch(`/api/teams/invite/${code}`);
      if (!res.ok) throw new Error("Team not found");
      return res.json();
    },
    retry: false,
    enabled: !!code,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/teams/join", { inviteCode: code });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to join team");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({ title: "Welcome!", description: `You've joined ${team?.name}.` });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Could not join",
        description: error.message || "Failed to join team.",
        variant: "destructive",
      });
    },
  });

  const handleWebJoin = () => {
    sessionStorage.setItem(
      "fayaflex_pending_join",
      JSON.stringify({ code, teamName: team?.name || "a team" })
    );
    setLocation("/auth");
  };

  // Try to open the native app via custom URL scheme; fall back to App Store
  const handleGetApp = () => {
    const deepLink = `fayaflex://join/${code}`;
    let appOpened = false;

    const onBlur = () => { appOpened = true; };
    window.addEventListener("blur", onBlur, { once: true });

    // Attempt to open via custom URL scheme
    window.location.href = deepLink;

    setTimeout(() => {
      window.removeEventListener("blur", onBlur);
      if (!appOpened) {
        // App not installed — go to App Store
        window.location.href = APP_STORE_URL;
      }
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8 space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <div>
              <h2 className="text-xl font-bold mb-2">Invite Link Invalid</h2>
              <p className="text-muted-foreground">
                This invite link may have expired or the team no longer exists.
              </p>
            </div>
            <Button onClick={() => setLocation(user ? "/" : "/auth")}>
              {user ? "Go to Dashboard" : "Sign In"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="pt-10 pb-8 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Users className="h-8 w-8 text-primary" />
          </div>

          <p className="text-sm text-muted-foreground mb-1">You've been invited to join</p>
          <h2 className="text-2xl font-bold mb-1">{team.name}</h2>
          <p className="text-sm text-muted-foreground">
            {team.memberCount} member{team.memberCount !== 1 ? "s" : ""} · FayaFlex fitness challenge
          </p>

          {team.description && (
            <p className="text-sm text-muted-foreground mt-3 italic">"{team.description}"</p>
          )}

          {/* Always show the invite code so the user can copy it */}
          <InviteCodeBox code={code ?? ""} />

          {team.isFull ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>This team is full (20/20 members)</span>
              </div>
              <Button variant="outline" onClick={() => setLocation(user ? "/" : "/auth")}>
                {user ? "Back to Dashboard" : "Sign In"}
              </Button>
            </div>
          ) : user ? (
            // Already logged in — join directly
            <Button
              className="w-full"
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              data-testid="button-join-team-link"
            >
              {joinMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Joining...</>
              ) : (
                <><CheckCircle className="h-4 w-4 mr-2" /> Join Team</>
              )}
            </Button>
          ) : isIphone ? (
            // iPhone visitor — offer deep link or App Store, then web fallback
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={handleGetApp}
                data-testid="button-open-in-app"
              >
                <SiApple className="h-4 w-4 mr-2" />
                Open in FayaFlex App
              </Button>
              <p className="text-xs text-muted-foreground">
                Opens the app directly to the join screen. If you don't have it installed, you'll be taken to the App Store.
              </p>
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleWebJoin}
                data-testid="button-join-web-fallback"
              >
                <Lock className="h-4 w-4 mr-2" />
                Continue on Web
              </Button>
            </div>
          ) : (
            // Non-iPhone visitor — web sign-in flow
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={handleWebJoin}
                data-testid="button-join-team-link"
              >
                <Lock className="h-4 w-4 mr-2" /> Sign In to Join
              </Button>
              <p className="text-xs text-muted-foreground">
                Sign in or create a free account and you'll be added to the team automatically.
              </p>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">have the app?</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGetApp}
                data-testid="button-download-app"
              >
                <Download className="h-4 w-4 mr-2" />
                Download FayaFlex
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
