import { useState } from 'react';
import { Flame, Trophy, User, Calendar, Dumbbell, Heart, Zap } from 'lucide-react';
import { Screen } from '../App';

interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  points: number;
  icon: React.ReactNode;
  color: string;
  completed: boolean;
}

const challenges: Challenge[] = [
  {
    id: '1',
    title: '30-Day Push-Up Challenge',
    description: 'Build upper body strength with progressive push-ups',
    duration: '30 days',
    difficulty: 'Intermediate',
    points: 300,
    icon: <Dumbbell className="w-6 h-6" />,
    color: 'bg-blue-500',
    completed: false
  },
  {
    id: '2',
    title: 'Cardio Blast Week',
    description: 'High-intensity cardio to boost your endurance',
    duration: '7 days',
    difficulty: 'Advanced',
    points: 150,
    icon: <Heart className="w-6 h-6" />,
    color: 'bg-red-500',
    completed: false
  },
  {
    id: '3',
    title: 'Flexibility Focus',
    description: 'Daily stretching routine for better mobility',
    duration: '14 days',
    difficulty: 'Beginner',
    points: 100,
    icon: <Zap className="w-6 h-6" />,
    color: 'bg-yellow-500',
    completed: false
  },
  {
    id: '4',
    title: 'Core Strength Builder',
    description: 'Strengthen your core with targeted exercises',
    duration: '21 days',
    difficulty: 'Intermediate',
    points: 250,
    icon: <Flame className="w-6 h-6" />,
    color: 'bg-orange-500',
    completed: true
  }
];

interface ChallengeHomeProps {
  onChallengeSelect: (challengeId: string) => void;
  onNavigate: (screen: Screen) => void;
}

export function ChallengeHome({ onChallengeSelect, onNavigate }: ChallengeHomeProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const activeChallenges = challenges.filter(c => !c.completed);
  const completedChallenges = challenges.filter(c => c.completed);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-6 shadow-lg">
        <div className="max-w-md mx-auto">
          <h1 className="mb-2">Ultimate Fitness Challenge</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-yellow-300" />
              <span>7 Day Streak</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-300" />
              <span>850 Points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Challenge Card */}
      <div className="max-w-md mx-auto px-4 -mt-4">
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-5 rounded-xl shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5" />
            <span className="text-sm">Today's Challenge</span>
          </div>
          <h3 className="mb-2">100 Squats Challenge</h3>
          <p className="text-sm text-green-50 mb-4">
            Complete 100 squats in sets of your choice. Take breaks as needed!
          </p>
          <button 
            onClick={() => onChallengeSelect('daily')}
            className="w-full bg-white text-green-600 py-2 rounded-lg hover:bg-green-50 transition-colors"
          >
            Start Now
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-md mx-auto px-4 mt-6">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 px-4 ${
              activeTab === 'active'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-500'
            }`}
          >
            Active Challenges
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-3 px-4 ${
              activeTab === 'completed'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-500'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Challenge List */}
      <div className="max-w-md mx-auto px-4 mt-4 space-y-3">
        {(activeTab === 'active' ? activeChallenges : completedChallenges).map(challenge => (
          <ChallengeCard 
            key={challenge.id}
            challenge={challenge}
            onClick={() => onChallengeSelect(challenge.id)}
          />
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-md mx-auto flex justify-around py-3">
          <NavButton 
            icon={<Flame className="w-6 h-6" />}
            label="Challenges"
            active
          />
          <NavButton 
            icon={<Trophy className="w-6 h-6" />}
            label="Leaderboard"
            onClick={() => onNavigate('leaderboard')}
          />
          <NavButton 
            icon={<User className="w-6 h-6" />}
            label="Profile"
            onClick={() => onNavigate('profile')}
          />
        </div>
      </div>
    </div>
  );
}

interface ChallengeCardProps {
  challenge: Challenge;
  onClick: () => void;
}

function ChallengeCard({ challenge, onClick }: ChallengeCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className={`${challenge.color} text-white p-3 rounded-lg flex-shrink-0`}>
          {challenge.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 mb-1">{challenge.title}</h3>
          <p className="text-gray-600 text-sm mb-2">{challenge.description}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{challenge.duration}</span>
            <span>•</span>
            <span>{challenge.difficulty}</span>
            <span>•</span>
            <span className="text-green-600">{challenge.points} pts</span>
          </div>
        </div>
      </div>
      {challenge.completed && (
        <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
          <Trophy className="w-4 h-4" />
          <span>Completed!</span>
        </div>
      )}
    </div>
  );
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavButton({ icon, label, active = false, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 ${
        active ? 'text-green-600' : 'text-gray-400'
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}
