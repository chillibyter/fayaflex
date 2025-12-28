import { useState, useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
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
import NotFound from "@/pages/not-found";
import OnboardingTutorial from "@/components/OnboardingTutorial";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

type Team = {
  id: number;
  name: string;
  memberCount: number;
};

function Router() {
  const { user, isLoading } = useAuth();

  // Check if user has any teams (getUserTeams only returns teams where user is a member)
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
        <Route path="/" component={AuthPage} />
        <Route component={AuthPage} />
      </Switch>
    );
  }

  // Show loading state while checking team membership
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

  // If user has no teams, force them to team selection
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
      <Route path="/track" component={TrackActivity} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/teams" component={Teams} />
      <Route path="/teams/:teamId/victory-wall" component={VictoryWall} />
      <Route path="/teams/:teamId" component={TeamLeaderboard} />
      <Route path="/create-team" component={CreateTeam} />
      <Route path="/profile" component={Profile} />
      <Route path="/users/:userId/profile" component={UserProfile} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/support" component={Support} />
      <Route path="/privacy" component={Privacy} />
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
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  // Check if user should see onboarding
  useEffect(() => {
    if (user) {
      const onboardingKey = `ufc_onboarding_seen_${user.id}`;
      const hasSeenOnboarding = localStorage.getItem(onboardingKey);
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    if (user) {
      const onboardingKey = `ufc_onboarding_seen_${user.id}`;
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
      <SidebarProvider style={sidebarStyle}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <AppHeader />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <Router />
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </>
  );
}

function App() {
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
