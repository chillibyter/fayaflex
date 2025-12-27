import { useState, useEffect } from 'react';
import { AuthScreen } from './components/auth/AuthScreen';
import { Onboarding } from './components/onboarding/Onboarding';
import { TeamSelection } from './components/team/TeamSelection';
import { Dashboard } from './components/dashboard/Dashboard';
import { TrackActivity } from './components/track/TrackActivity';
import { Leaderboard } from './components/leaderboard/Leaderboard';
import { Teams } from './components/teams/Teams';
import { TeamDetail } from './components/teams/TeamDetail';
import { VictoryWall } from './components/teams/VictoryWall';
import { Profile } from './components/profile/Profile';
import { UserProfile } from './components/profile/UserProfile';
import { HowItWorks } from './components/HowItWorks';

export type User = {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarId?: string;
};

export type Screen = 
  | 'auth' 
  | 'onboarding' 
  | 'team-selection' 
  | 'dashboard' 
  | 'track' 
  | 'leaderboard' 
  | 'teams'
  | 'team-detail'
  | 'victory-wall'
  | 'profile'
  | 'user-profile'
  | 'how-it-works';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');
  const [user, setUser] = useState<User | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Check if user has seen onboarding
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [hasTeam, setHasTeam] = useState(false);

  useEffect(() => {
    if (user) {
      const onboardingSeen = localStorage.getItem(`ufc_onboarding_seen_${user.id}`);
      setHasSeenOnboarding(onboardingSeen === 'true');
      
      // Mock: assume user has team after team selection
      const userHasTeam = localStorage.getItem(`ufc_user_team_${user.id}`);
      setHasTeam(userHasTeam === 'true');
    }
  }, [user]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    
    // Check onboarding and team status
    const onboardingSeen = localStorage.getItem(`ufc_onboarding_seen_${userData.id}`);
    const userHasTeam = localStorage.getItem(`ufc_user_team_${userData.id}`);
    
    if (onboardingSeen !== 'true') {
      setCurrentScreen('onboarding');
    } else if (userHasTeam !== 'true') {
      setCurrentScreen('team-selection');
    } else {
      setCurrentScreen('dashboard');
    }
  };

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`ufc_onboarding_seen_${user.id}`, 'true');
      setHasSeenOnboarding(true);
      
      if (!hasTeam) {
        setCurrentScreen('team-selection');
      } else {
        setCurrentScreen('dashboard');
      }
    }
  };

  const handleTeamSelected = () => {
    if (user) {
      localStorage.setItem(`ufc_user_team_${user.id}`, 'true');
      setHasTeam(true);
      setCurrentScreen('dashboard');
    }
  };

  const handleNavigate = (screen: Screen, teamId?: string, userId?: string) => {
    if (teamId) setSelectedTeamId(teamId);
    if (userId) setSelectedUserId(userId);
    setCurrentScreen(screen);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('auth');
    setHasSeenOnboarding(false);
    setHasTeam(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentScreen === 'auth' && (
        <AuthScreen onLogin={handleLogin} />
      )}
      
      {currentScreen === 'onboarding' && user && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}
      
      {currentScreen === 'team-selection' && user && (
        <TeamSelection 
          user={user}
          onTeamSelected={handleTeamSelected} 
        />
      )}
      
      {currentScreen === 'dashboard' && user && (
        <Dashboard 
          user={user}
          onNavigate={handleNavigate}
        />
      )}
      
      {currentScreen === 'track' && user && (
        <TrackActivity 
          user={user}
          onNavigate={handleNavigate}
        />
      )}
      
      {currentScreen === 'leaderboard' && (
        <Leaderboard onNavigate={handleNavigate} />
      )}
      
      {currentScreen === 'teams' && user && (
        <Teams 
          user={user}
          onNavigate={handleNavigate}
        />
      )}
      
      {currentScreen === 'team-detail' && selectedTeamId && (
        <TeamDetail 
          teamId={selectedTeamId}
          onNavigate={handleNavigate}
        />
      )}
      
      {currentScreen === 'victory-wall' && selectedTeamId && (
        <VictoryWall 
          teamId={selectedTeamId}
          onBack={() => handleNavigate('team-detail', selectedTeamId)}
        />
      )}
      
      {currentScreen === 'profile' && user && (
        <Profile 
          user={user}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}
      
      {currentScreen === 'user-profile' && selectedUserId && (
        <UserProfile 
          userId={selectedUserId}
          onBack={() => handleNavigate('dashboard')}
        />
      )}
      
      {currentScreen === 'how-it-works' && (
        <HowItWorks onNavigate={handleNavigate} />
      )}
    </div>
  );
}
