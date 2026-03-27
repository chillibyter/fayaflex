import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, AlertCircle, Loader2, Lock } from "lucide-react";
import { SiApple } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

const APP_STORE_URL = "https://apps.apple.com/us/app/fayaflex/id6757204288";

// Only show App Store prompt on iPhone web browsers, not inside the native app
const isIphone = /iPhone/i.test(navigator.userAgent) && !Capacitor.isNativePlatform();

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
          <p className="text-sm text-muted-foreground mb-6">
            {team.memberCount} member{team.memberCount !== 1 ? "s" : ""} · FayaFlex fitness challenge
          </p>

          {team.description && (
            <p className="text-sm text-muted-foreground mb-6 italic">"{team.description}"</p>
          )}

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
            // iPhone visitor — direct to App Store as primary action
            <div className="space-y-3">
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full" data-testid="button-app-store">
                  <SiApple className="h-4 w-4 mr-2" />
                  Get the App to Join
                </Button>
              </a>
              <p className="text-xs text-muted-foreground">
                Open this link in FayaFlex to join {team.name} instantly.
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
