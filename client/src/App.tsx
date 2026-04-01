import { useState, useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNavigation from "@/components/BottomNavigation";
import Dashboard from "@/pages/Dashboard";
import TrackActivity from "@/pages/TrackActivity";
import Leaderboard from "@/pages/Leaderboard";
import Teams from "@/pages/Teams";
import TeamLeaderboard from "@/pages/TeamLeaderboard";
import VictoryWall from "@/pages/VictoryWall";
import CreateTeam from "@/pages/CreateTeam";
import Profile from "@/pages/Profile";
import UserProfile from "@/pages/UserProfile";
import AuthPage from "@/pages/AuthPage";
import ResetPassword from "@/pages/ResetPassword";
import TeamSelection from "@/pages/TeamSelection";
import HowItWorks from "@/pages/HowItWorks";
import Support from "@/pages/Support";
import Privacy from "@/pages/Privacy";
import HealthData from "@/pages/HealthData";
import DeleteAccount from "@/pages/DeleteAccount";
import DailyChart from "@/pages/DailyChart";
import Challenges from "@/pages/Challenges";
import Messages from "@/pages/Messages";
import ChallengeArchive from "@/pages/ChallengeArchive";
import ForYou from "@/pages/ForYou";
import Landing from "@/pages/Landing";
import JoinTeam from "@/pages/JoinTeam";
import NotFound from "@/pages/not-found";
import OnboardingTutorial from "@/components/OnboardingTutorial";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useAutoHealthSync } from "@/hooks/use-auto-health-sync";
import { useSwipeBack } from "@/hooks/use-swipe-back";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { App as CapApp } from "@capacitor/app";

type Team = {
  id: number;
  name: string;
  memberCount: number;
};

function Router() {
  const { user, isLoading } = useAuth();

  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<Team[] | null>({
    queryKey: ['/api/teams'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });

  if (isLoading || !user) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/join/:code" component={JoinTeam} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/support" component={Support} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/health-data" component={HealthData} />
        <Route path="/delete-account" component={DeleteAccount} />
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  if (isLoadingTeams) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user has skipped team selection (allow solo exploration)
  const skipKey = user ? `fayaflex_skip_team_${user.id}` : '';
  const hasSkippedTeam = skipKey && localStorage.getItem(skipKey) === 'true';
  
  if (!teams || teams.length === 0) {
    // Allow users who skipped team selection to explore the app
    if (!hasSkippedTeam) {
      return (
        <Switch>
          <Route path="/auth"><Redirect to="/" /></Route>
          <Route path="/team-selection" component={TeamSelection} />
          <Route path="/" component={TeamSelection} />
          <Route component={TeamSelection} />
        </Switch>
      );
    }
  }

  return (
    <Switch>
      <Route path="/auth"><Redirect to="/" /></Route>
      <Route path="/" component={Dashboard} />
      <Route path="/feed" component={ForYou} />
      <Route path="/join/:code" component={JoinTeam} />
      <Route path="/daily-chart" component={DailyChart} />
      <Route path="/track" component={TrackActivity} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/teams" component={Teams} />
      <Route path="/teams/:teamId/victory-wall" component={VictoryWall} />
      <Route path="/teams/:teamId" component={TeamLeaderboard} />
      <Route path="/create-team" component={CreateTeam} />
      <Route path="/profile" component={Profile} />
      <Route path="/users/:userId/profile" component={UserProfile} />
      <Route path="/challenges" component={Challenges} />
      <Route path="/challenge-archive" component={ChallengeArchive} />
      <Route path="/messages/:partnerId" component={Messages} />
      <Route path="/messages" component={Messages} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/support" component={Support} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/health-data" component={HealthData} />
      <Route path="/delete-account" component={DeleteAccount} />
      <Route path="/team-selection" component={TeamSelection} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [, setLocation] = useLocation();

  // Handle deep links opened via fayaflex:// custom URL scheme (native platforms only)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let listener: any;
    CapApp.addListener("appUrlOpen", (event) => {
      try {
        // fayaflex://join/CODE  →  hostname = "join", pathname = "/CODE"
        const url = new URL(event.url);
        if (url.protocol === "fayaflex:" && url.hostname === "join") {
          const code = url.pathname.replace(/^\//, "");
          if (code) setLocation(`/join/${code}`);
        }
      } catch {
        // ignore malformed URLs
      }
    }).then((l) => { listener = l; });
    return () => { listener?.remove(); };
  }, [setLocation]);

  // Auto-sync health data when app is in use (native platforms only)
  useAutoHealthSync();
  
  // Enable swipe-right from left edge to go back
  useSwipeBack();

  useEffect(() => {
    if (user) {
      const onboardingKey = `fayaflex_onboarding_seen_${user.id}`;
      const hasSeenOnboarding = localStorage.getItem(onboardingKey);
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  // Handle pending team join after login/register (set by JoinTeam page)
  useEffect(() => {
    if (!user) return;
    const raw = sessionStorage.getItem("fayaflex_pending_join");
    if (!raw) return;
    sessionStorage.removeItem("fayaflex_pending_join");
    try {
      const { code } = JSON.parse(raw);
      if (code) {
        apiRequest("POST", "/api/teams/join", { inviteCode: code })
          .then(() => queryClient.invalidateQueries({ queryKey: ["/api/teams"] }))
          .catch(() => {});
      }
    } catch {}
  }, [user]);

  // Handle team creation draft after registration (set by zero-login wizard)
  useEffect(() => {
    if (!user) return;
    const raw = sessionStorage.getItem("fayaflex_draft_team");
    if (!raw) return;
    sessionStorage.removeItem("fayaflex_draft_team");
    try {
      const { teamName, goalType } = JSON.parse(raw);
      if (teamName) {
        apiRequest("POST", "/api/teams", {
          name: teamName,
          description: goalType ? `${goalType.charAt(0).toUpperCase() + goalType.slice(1)} challenge` : undefined,
        })
          .then(() => queryClient.invalidateQueries({ queryKey: ["/api/teams"] }))
          .catch(() => {});
      }
    } catch {}
  }, [user]);

  const handleOnboardingComplete = () => {
    if (user) {
      const onboardingKey = `fayaflex_onboarding_seen_${user.id}`;
      localStorage.setItem(onboardingKey, "true");
    }
    setShowOnboarding(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Router />
        <Toaster />
      </>
    );
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingTutorial
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )}
      <div 
        className="min-h-screen bg-background"
        style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
      >
        <main className="min-h-screen">
          <Router />
        </main>
        <BottomNavigation />
      </div>
      <Toaster />
    </>
  );
}

function App() {
  useEffect(() => {
    // Hide splash screen when app is loaded (for native mobile apps)
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
