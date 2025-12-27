import { Target, Flame, Footprints, Dumbbell, Plus } from 'lucide-react';
import { Screen } from '../../App';

interface GoalJourneysProps {
  onNavigate: (screen: Screen) => void;
}

const goals = [
  {
    id: '1',
    type: 'Daily',
    category: 'Calories',
    targetValue: 1000,
    currentValue: 850,
    icon: <Flame className="w-5 h-5 text-orange-500" />,
    color: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  {
    id: '2',
    type: 'Weekly',
    category: 'Steps',
    targetValue: 70000,
    currentValue: 52300,
    icon: <Footprints className="w-5 h-5 text-blue-500" />,
    color: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: '3',
    type: 'Weekly',
    category: 'Workouts',
    targetValue: 5,
    currentValue: 3,
    icon: <Dumbbell className="w-5 h-5 text-purple-500" />,
    color: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
];

export function GoalJourneys({ onNavigate }: GoalJourneysProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-gray-900">Active Goals</h2>
          <p className="text-gray-600 text-sm">Track your daily and weekly targets</p>
        </div>
        <button className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm">
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {goals.map(goal => {
          const progressPercentage = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
          const isCompleted = goal.currentValue >= goal.targetValue;

          return (
            <div
              key={goal.id}
              className={`border ${goal.borderColor} ${goal.color} rounded-lg p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {goal.icon}
                  <span className="text-sm text-gray-600">{goal.type}</span>
                </div>
                {isCompleted && (
                  <div className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                    Complete
                  </div>
                )}
              </div>

              <div className="text-gray-900 mb-4">{goal.category}</div>

              <div className="mb-2">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>{goal.currentValue.toLocaleString()}</span>
                  <span>{goal.targetValue.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isCompleted ? 'bg-green-600' : 'bg-green-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="text-xs text-gray-600">
                {isCompleted ? 'Goal achieved! 🎉' : `${Math.round(progressPercentage)}% complete`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
