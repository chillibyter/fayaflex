import { ArrowLeft, Trophy, Target, Calendar, Award, TrendingUp, Flame } from 'lucide-react';

interface ProfileProps {
  onBack: () => void;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  color: string;
}

const badges: Badge[] = [
  {
    id: '1',
    name: 'First Step',
    description: 'Complete your first challenge',
    icon: <Target className="w-6 h-6" />,
    earned: true,
    color: 'bg-blue-500'
  },
  {
    id: '2',
    name: 'Week Warrior',
    description: '7-day streak',
    icon: <Flame className="w-6 h-6" />,
    earned: true,
    color: 'bg-orange-500'
  },
  {
    id: '3',
    name: 'Challenge Master',
    description: 'Complete 5 challenges',
    icon: <Trophy className="w-6 h-6" />,
    earned: false,
    color: 'bg-yellow-500'
  },
  {
    id: '4',
    name: 'Perfect Month',
    description: '30-day streak',
    icon: <Award className="w-6 h-6" />,
    earned: false,
    color: 'bg-purple-500'
  }
];

const activityData = [
  { day: 'Mon', completed: true },
  { day: 'Tue', completed: true },
  { day: 'Wed', completed: true },
  { day: 'Thu', completed: true },
  { day: 'Fri', completed: true },
  { day: 'Sat', completed: true },
  { day: 'Sun', completed: false }
];

export function Profile({ onBack }: ProfileProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-6 shadow-lg">
        <div className="max-w-md mx-auto">
          <button onClick={onBack} className="mb-4 flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-lg">
              😊
            </div>
            <div>
              <h1 className="mb-1">Your Profile</h1>
              <p className="text-green-50 text-sm">Member since Jan 2025</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6">
        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow-lg p-5 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <StatItem 
              icon={<Trophy className="w-5 h-5 text-yellow-500" />}
              value="850"
              label="Total Points"
            />
            <StatItem 
              icon={<Target className="w-5 h-5 text-blue-500" />}
              value="4"
              label="Completed"
            />
            <StatItem 
              icon={<Flame className="w-5 h-5 text-orange-500" />}
              value="7"
              label="Day Streak"
            />
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">This Week's Activity</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex justify-between gap-2">
            {activityData.map(day => (
              <div key={day.day} className="flex-1 text-center">
                <div className={`w-full h-20 rounded-lg mb-2 ${
                  day.completed ? 'bg-green-500' : 'bg-gray-200'
                }`} />
                <span className="text-xs text-gray-500">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Badges</h3>
            <span className="text-sm text-gray-500">2 of 4 earned</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {badges.map(badge => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <ActivityItem 
              icon={<Trophy className="w-5 h-5 text-green-600" />}
              title="Completed Core Strength Builder"
              time="2 days ago"
            />
            <ActivityItem 
              icon={<Target className="w-5 h-5 text-blue-600" />}
              title="Started 30-Day Push-Up Challenge"
              time="5 days ago"
            />
            <ActivityItem 
              icon={<Award className="w-5 h-5 text-yellow-600" />}
              title="Earned Week Warrior badge"
              time="1 week ago"
            />
            <ActivityItem 
              icon={<Calendar className="w-5 h-5 text-purple-600" />}
              title="Joined Ultimate Fitness Challenge"
              time="2 weeks ago"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function StatItem({ icon, value, label }: StatItemProps) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-gray-900 mb-1">{value}</div>
      <div className="text-gray-500 text-xs">{label}</div>
    </div>
  );
}

interface BadgeCardProps {
  badge: Badge;
}

function BadgeCard({ badge }: BadgeCardProps) {
  return (
    <div className={`p-4 rounded-lg ${
      badge.earned ? 'bg-gradient-to-br from-gray-50 to-gray-100' : 'bg-gray-50 opacity-50'
    } text-center`}>
      <div className={`${badge.color} ${
        badge.earned ? 'text-white' : 'text-gray-400'
      } w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2`}>
        {badge.icon}
      </div>
      <div className={`text-sm mb-1 ${badge.earned ? 'text-gray-900' : 'text-gray-400'}`}>
        {badge.name}
      </div>
      <div className="text-xs text-gray-500">{badge.description}</div>
    </div>
  );
}

interface ActivityItemProps {
  icon: React.ReactNode;
  title: string;
  time: string;
}

function ActivityItem({ icon, title, time }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-gray-900 text-sm">{title}</div>
        <div className="text-gray-500 text-xs">{time}</div>
      </div>
    </div>
  );
}
