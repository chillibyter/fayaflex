import { useState } from 'react';
import { User, Screen } from '../../App';
import { Sidebar } from '../navigation/Sidebar';
import { Edit2, Award, TrendingUp, Flame, Footprints, Dumbbell, Trophy, Fingerprint, Smartphone, LogOut } from 'lucide-react';

interface ProfileProps {
  user: User;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

const badges = [
  { id: '1', name: 'First Activity', description: 'Logged your first activity', earned: true, icon: '🎯' },
  { id: '2', name: '3-Day Streak', description: '3 consecutive days', earned: true, icon: '🔥' },
  { id: '3', name: '7-Day Streak', description: '7 consecutive days', earned: true, icon: '⚡' },
  { id: '4', name: '30-Day Streak', description: '30 consecutive days', earned: false, icon: '💪' },
  { id: '5', name: '10K Steps', description: '10,000 steps in one day', earned: true, icon: '👟' },
  { id: '6', name: '1K Calories', description: '1,000 calories in one day', earned: true, icon: '🔥' },
  { id: '7', name: '10 Workouts', description: 'Completed 10 workout days', earned: true, icon: '💪' },
  { id: '8', name: 'Top 10', description: 'Reached top 10 on leaderboard', earned: false, icon: '🏆' },
  { id: '9', name: 'Champion', description: 'Won a monthly challenge', earned: false, icon: '👑' }
];

const personalBests = [
  { label: 'Calories (Single Day)', value: '1,850', icon: <Flame className="w-5 h-5 text-orange-500" /> },
  { label: 'Steps (Single Day)', value: '15,200', icon: <Footprints className="w-5 h-5 text-blue-500" /> },
  { label: 'Total Score (Single Day)', value: '17,050', icon: <Trophy className="w-5 h-5 text-yellow-500" /> }
];

const stats = {
  totalWorkouts: 45,
  currentStreak: 7,
  longestStreak: 12,
  memberSince: 'January 2025'
};

const avatars = ['1', '2', '3', '4', '5', '6'];

export function Profile({ user, onNavigate, onLogout }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarId || '1');

  const handleSave = () => {
    // Mock save
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentScreen="profile" onNavigate={onNavigate} />
      
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-8 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl shadow-lg flex-shrink-0">
                {user.firstName?.[0] || user.username[0]}
              </div>
              
              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-white mb-2">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.username}
                </h1>
                <p className="text-green-50 text-sm mb-3">@{user.username}</p>
                <div className="text-green-50 text-sm">Member since {stats.memberSince}</div>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Edit Profile Form */}
          {isEditing && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-gray-900 mb-4">Edit Profile</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Choose Avatar</label>
                  <div className="flex gap-3">
                    {avatars.map(avatar => (
                      <button
                        key={avatar}
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                          selectedAvatar === avatar
                            ? 'ring-4 ring-green-500 bg-gradient-to-br from-green-400 to-blue-500'
                            : 'bg-gray-200'
                        } text-white`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon={<Dumbbell className="w-5 h-5 text-purple-500" />} label="Total Workouts" value={stats.totalWorkouts.toString()} />
            <StatCard icon={<Flame className="w-5 h-5 text-orange-500" />} label="Current Streak" value={`${stats.currentStreak} days`} />
            <StatCard icon={<TrendingUp className="w-5 h-5 text-green-500" />} label="Longest Streak" value={`${stats.longestStreak} days`} />
            <StatCard icon={<Award className="w-5 h-5 text-yellow-500" />} label="Badges Earned" value={`${badges.filter(b => b.earned).length}/${badges.length}`} />
          </div>

          {/* Personal Bests */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-gray-900 mb-4">Personal Bests</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {personalBests.map(best => (
                <div key={best.label} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {best.icon}
                    <span className="text-gray-700 text-sm">{best.label}</span>
                  </div>
                  <div className="text-gray-900">{best.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-gray-900">Badges</h2>
              <span className="text-sm text-gray-500">
                {badges.filter(b => b.earned).length} of {badges.length} earned
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {badges.map(badge => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-lg text-center ${
                    badge.earned
                      ? 'bg-gradient-to-br from-green-50 to-blue-50 border border-green-200'
                      : 'bg-gray-50 opacity-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <div className={`text-sm mb-1 ${badge.earned ? 'text-gray-900' : 'text-gray-500'}`}>
                    {badge.name}
                  </div>
                  <div className="text-xs text-gray-600">{badge.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Passkey Management */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-gray-900 mb-4">Security</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Fingerprint className="w-5 h-5 text-gray-700" />
                  <div className="text-left">
                    <div className="text-gray-900 text-sm">Passkey / Biometric Login</div>
                    <div className="text-gray-600 text-xs">Enable fingerprint or face recognition</div>
                  </div>
                </div>
                <span className="text-green-600 text-sm">Enabled</span>
              </button>
            </div>
          </div>

          {/* Health Devices (Mobile Only) */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-gray-900 mb-4">Connected Devices</h2>
            <div className="space-y-3">
              <DeviceItem name="Apple Health" connected={false} />
              <DeviceItem name="Android Health Connect" connected={false} />
              <DeviceItem name="Huawei Health" connected={false} />
            </div>
          </div>

          {/* Logout */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 p-3 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
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

interface DeviceItemProps {
  name: string;
  connected: boolean;
}

function DeviceItem({ name, connected }: DeviceItemProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <Smartphone className="w-5 h-5 text-gray-700" />
        <span className="text-gray-900 text-sm">{name}</span>
      </div>
      <button
        className={`px-4 py-1 rounded text-sm ${
          connected
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {connected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
}
