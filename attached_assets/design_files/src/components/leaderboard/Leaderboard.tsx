import { useState } from 'react';
import { Screen } from '../../App';
import { Sidebar } from '../navigation/Sidebar';
import { Trophy, Medal, Award, Flame, Footprints, Dumbbell, Users } from 'lucide-react';

interface LeaderboardProps {
  onNavigate: (screen: Screen) => void;
}

type Tab = 'teams' | 'calories' | 'steps' | 'workouts';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  calories: number;
  steps: number;
  workouts: number;
  avatarId?: string;
  isCurrentUser?: boolean;
}

const teamLeaderboard: LeaderboardEntry[] = [
  { rank: 1, id: '1', name: 'Morning Warriors', calories: 145200, steps: 982000, workouts: 156 },
  { rank: 2, id: '2', name: 'Fitness Legends', calories: 138900, steps: 945000, workouts: 142 },
  { rank: 3, id: '3', name: 'Cardio Kings', calories: 125600, steps: 876000, workouts: 128 },
  { rank: 4, id: '4', name: 'Iron Squad', calories: 118300, steps: 823000, workouts: 115 },
  { rank: 5, id: '5', name: 'Peak Performers', calories: 112700, steps: 795000, workouts: 108 }
];

const caloriesLeaderboard: LeaderboardEntry[] = [
  { rank: 1, id: '1', name: 'Sarah Johnson', calories: 18450, steps: 125000, workouts: 25, avatarId: '1' },
  { rank: 2, id: '2', name: 'Mike Chen', calories: 16280, steps: 118000, workouts: 23, avatarId: '2' },
  { rank: 3, id: '3', name: 'Emma Davis', calories: 15150, steps: 112000, workouts: 22, avatarId: '3' },
  { rank: 4, id: '4', name: 'You', calories: 12450, steps: 87300, workouts: 18, avatarId: '1', isCurrentUser: true },
  { rank: 5, id: '5', name: 'Alex Martinez', calories: 11820, steps: 85000, workouts: 17, avatarId: '4' }
];

const stepsLeaderboard: LeaderboardEntry[] = [
  { rank: 1, id: '1', name: 'Jennifer Lee', calories: 12450, steps: 145000, workouts: 20, avatarId: '1' },
  { rank: 2, id: '2', name: 'David Kim', calories: 11200, steps: 138000, workouts: 19, avatarId: '2' },
  { rank: 3, id: '3', name: 'Lisa Brown', calories: 10850, steps: 132000, workouts: 18, avatarId: '3' },
  { rank: 4, id: '4', name: 'You', calories: 12450, steps: 87300, workouts: 18, avatarId: '1', isCurrentUser: true },
  { rank: 5, id: '5', name: 'Tom Wilson', calories: 9500, steps: 85000, workouts: 16, avatarId: '4' }
];

const workoutsLeaderboard: LeaderboardEntry[] = [
  { rank: 1, id: '1', name: 'Chris Taylor', calories: 15200, steps: 98000, workouts: 28, avatarId: '1' },
  { rank: 2, id: '2', name: 'Rachel Green', calories: 14800, steps: 95000, workouts: 26, avatarId: '2' },
  { rank: 3, id: '3', name: 'Mark Davis', calories: 13500, steps: 92000, workouts: 24, avatarId: '3' },
  { rank: 4, id: '4', name: 'You', calories: 12450, steps: 87300, workouts: 18, avatarId: '1', isCurrentUser: true },
  { rank: 5, id: '5', name: 'Anna White', calories: 11900, steps: 84000, workouts: 17, avatarId: '4' }
];

export function Leaderboard({ onNavigate }: LeaderboardProps) {
  const [tab, setTab] = useState<Tab>('teams');

  const getCurrentData = () => {
    switch (tab) {
      case 'teams': return teamLeaderboard;
      case 'calories': return caloriesLeaderboard;
      case 'steps': return stepsLeaderboard;
      case 'workouts': return workoutsLeaderboard;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentScreen="leaderboard" onNavigate={onNavigate} />
      
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-white mb-2">Leaderboard</h1>
            <p className="text-yellow-50 text-sm">
              Rankings reset on the 1st of each month
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            <TabButton
              active={tab === 'teams'}
              onClick={() => setTab('teams')}
              icon={<Users className="w-4 h-4" />}
              label="Teams"
            />
            <TabButton
              active={tab === 'calories'}
              onClick={() => setTab('calories')}
              icon={<Flame className="w-4 h-4" />}
              label="Calories"
            />
            <TabButton
              active={tab === 'steps'}
              onClick={() => setTab('steps')}
              icon={<Footprints className="w-4 h-4" />}
              label="Steps"
            />
            <TabButton
              active={tab === 'workouts'}
              onClick={() => setTab('workouts')}
              icon={<Dumbbell className="w-4 h-4" />}
              label="Workouts"
            />
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {getCurrentData().map((entry, index) => (
              <LeaderboardRow
                key={entry.id}
                entry={entry}
                isTeam={tab === 'teams'}
                showTopBadge={index < 3}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
        active
          ? 'bg-green-600 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isTeam: boolean;
  showTopBadge: boolean;
}

function LeaderboardRow({ entry, isTeam, showTopBadge }: LeaderboardRowProps) {
  const getRankIcon = () => {
    if (!showTopBadge) return null;
    
    switch (entry.rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-orange-600" />;
      default: return null;
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 ${
      entry.isCurrentUser ? 'bg-green-50' : 'hover:bg-gray-50'
    }`}>
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 text-center">
          {showTopBadge ? (
            getRankIcon()
          ) : (
            <span className={`${entry.isCurrentUser ? 'text-green-600' : 'text-gray-500'}`}>
              #{entry.rank}
            </span>
          )}
        </div>
        
        {!isTeam && (
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
            {entry.name[0]}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className={`truncate ${entry.isCurrentUser ? 'text-green-600' : 'text-gray-900'}`}>
            {entry.name}
          </div>
          <div className="text-gray-500 text-sm">
            {entry.workouts} workout days
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <div className={`${entry.isCurrentUser ? 'text-green-600' : 'text-gray-900'}`}>
          {(entry.calories + entry.steps).toLocaleString()}
        </div>
        <div className="text-gray-500 text-xs">points</div>
      </div>
    </div>
  );
}
