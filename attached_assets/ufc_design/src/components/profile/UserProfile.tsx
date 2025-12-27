import { ArrowLeft, Trophy, Flame, Footprints, Award } from 'lucide-react';

interface UserProfileProps {
  userId: string;
  onBack: () => void;
}

const mockUserData = {
  id: '1',
  name: 'Sarah Johnson',
  username: 'sarah_j',
  avatarId: '1',
  memberSince: 'November 2024',
  stats: {
    totalCalories: 18450,
    totalSteps: 125000,
    workoutCount: 25,
    currentStreak: 15,
    rank: 1
  },
  badges: [
    { id: '1', name: 'First Activity', icon: '🎯', earned: true },
    { id: '2', name: '7-Day Streak', icon: '⚡', earned: true },
    { id: '3', name: '30-Day Streak', icon: '💪', earned: true },
    { id: '4', name: '10K Steps', icon: '👟', earned: true },
    { id: '5', name: 'Champion', icon: '👑', earned: true }
  ]
};

export function UserProfile({ onBack }: UserProfileProps) {
  const user = mockUserData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-500 text-white px-4 py-8 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 mb-4 hover:text-blue-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl shadow-lg flex-shrink-0">
              {user.name[0]}
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-white mb-2">{user.name}</h1>
              <p className="text-blue-50 text-sm mb-3">@{user.username}</p>
              <div className="text-blue-50 text-sm">Member since {user.memberSince}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Flame className="w-5 h-5 text-orange-500" />} label="Calories" value={user.stats.totalCalories.toLocaleString()} />
          <StatCard icon={<Footprints className="w-5 h-5 text-blue-500" />} label="Steps" value={user.stats.totalSteps.toLocaleString()} />
          <StatCard icon={<Trophy className="w-5 h-5 text-yellow-500" />} label="Rank" value={`#${user.stats.rank}`} />
          <StatCard icon={<Award className="w-5 h-5 text-purple-500" />} label="Streak" value={`${user.stats.currentStreak} days`} />
        </div>

        {/* Badges */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-gray-900 mb-4">Badges</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {user.badges.filter(b => b.earned).map(badge => (
              <div
                key={badge.id}
                className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 p-4 rounded-lg text-center"
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <div className="text-sm text-gray-900">{badge.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-gray-600 text-sm">{label}</span>
      </div>
      <div className="text-gray-900">{value}</div>
    </div>
  );
}
