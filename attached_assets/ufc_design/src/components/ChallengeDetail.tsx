import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Circle, Trophy, Calendar, Target } from 'lucide-react';

interface ChallengeDetailProps {
  challengeId: string;
  onBack: () => void;
}

interface DayProgress {
  day: number;
  completed: boolean;
  reps?: number;
}

export function ChallengeDetail({ challengeId, onBack }: ChallengeDetailProps) {
  const [progress, setProgress] = useState<DayProgress[]>(
    Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      completed: i < 5,
      reps: i < 5 ? 10 + i * 5 : undefined
    }))
  );

  const [showComplete, setShowComplete] = useState(false);

  const completedDays = progress.filter(p => p.completed).length;
  const totalDays = progress.length;
  const progressPercentage = (completedDays / totalDays) * 100;

  const handleCompleteDay = (day: number) => {
    setProgress(prev => 
      prev.map(p => 
        p.day === day ? { ...p, completed: true, reps: 25 } : p
      )
    );
    setShowComplete(true);
    setTimeout(() => setShowComplete(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-500 text-white px-4 py-6 shadow-lg">
        <div className="max-w-md mx-auto">
          <button onClick={onBack} className="mb-4 flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="mb-2">30-Day Push-Up Challenge</h1>
          <p className="text-blue-50 text-sm">
            Build upper body strength with progressive push-ups
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="max-w-md mx-auto px-4 -mt-6">
        <div className="bg-white rounded-xl shadow-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-gray-500 text-sm">Progress</span>
              <h2 className="text-gray-900">{completedDays}/{totalDays} Days</h2>
            </div>
            <div className="text-right">
              <span className="text-gray-500 text-sm">Total Points</span>
              <h2 className="text-green-600">{completedDays * 10}</h2>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard 
            icon={<Calendar className="w-5 h-5 text-blue-600" />}
            value="5"
            label="Streak"
          />
          <StatCard 
            icon={<Target className="w-5 h-5 text-orange-600" />}
            value="125"
            label="Total Reps"
          />
          <StatCard 
            icon={<Trophy className="w-5 h-5 text-yellow-600" />}
            value="50"
            label="Points"
          />
        </div>

        {/* Current Day Highlight */}
        {!progress[5].completed && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5" />
              <span className="text-sm">Day 6 - Today's Goal</span>
            </div>
            <h3 className="mb-1">25 Push-Ups</h3>
            <p className="text-blue-50 text-sm mb-4">
              Take your time and focus on form. Rest between sets if needed.
            </p>
            <button 
              onClick={() => handleCompleteDay(6)}
              className="w-full bg-white text-blue-600 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Complete Today's Challenge
            </button>
          </div>
        )}

        {/* Daily Progress */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-gray-900 mb-4">Daily Progress</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {progress.map(day => (
              <DayItem 
                key={day.day}
                day={day.day}
                completed={day.completed}
                reps={day.reps}
                isCurrent={day.day === 6}
                onComplete={() => handleCompleteDay(day.day)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 mx-4 text-center animate-scale-in">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-gray-900 mb-2">Great Job!</h2>
            <p className="text-gray-600">You've completed today's challenge!</p>
            <p className="text-green-600 mt-2">+10 points</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-gray-900 mb-1">{value}</div>
      <div className="text-gray-500 text-xs">{label}</div>
    </div>
  );
}

interface DayItemProps {
  day: number;
  completed: boolean;
  reps?: number;
  isCurrent: boolean;
  onComplete: () => void;
}

function DayItem({ day, completed, reps, isCurrent }: DayItemProps) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      isCurrent ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
    }`}>
      <div className="flex items-center gap-3">
        {completed ? (
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
        )}
        <div>
          <span className={`${completed ? 'text-gray-900' : 'text-gray-600'}`}>
            Day {day}
          </span>
          {isCurrent && (
            <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Today</span>
          )}
        </div>
      </div>
      {reps && (
        <span className="text-sm text-gray-500">{reps} reps</span>
      )}
    </div>
  );
}
