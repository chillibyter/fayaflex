import { useState, useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
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
import DeleteAccount from "@/pages/DeleteAccount";
import DailyChart from "@/pages/DailyChart";
import Challenges from "@/pages/Challenges";
import Messages from "@/pages/Messages";
import NotFound from "@/pages/not-found";
import OnboardingTutorial from "@/components/OnboardingTutorial";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useAutoHealthSync } from "@/hooks/use-auto-health-sync";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

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
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/support" component={Support} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/delete-account" component={DeleteAccount} />
        <Route path="/" component={AuthPage} />
        <Route component={AuthPage} />
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

  if (!teams || teams.length === 0) {
    return (
      <Switch>
        <Route path="/team-selection" component={TeamSelection} />
        <Route path="/" component={TeamSelection} />
        <Route component={TeamSelection} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
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
      <Route path="/messages/:partnerId" component={Messages} />
      <Route path="/messages" component={Messages} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/support" component={Support} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/delete-account" component={DeleteAccount} />
      <Route path="/team-selection">
        <Redirect to="/" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Auto-sync health data when app is in use (native platforms only)
  useAutoHealthSync();

  useEffect(() => {
    if (user) {
      const onboardingKey = `fayaflex_onboarding_seen_${user.id}`;
      const hasSeenOnboarding = localStorage.getItem(onboardingKey);
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
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
      <div className="min-h-screen bg-background pb-20">
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
