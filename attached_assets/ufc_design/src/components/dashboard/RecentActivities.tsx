import { Flame, Footprints, Clock, ChevronRight, ThumbsUp, MessageCircle } from 'lucide-react';
import { Screen } from '../../App';

interface RecentActivitiesProps {
  onNavigate: (screen: Screen) => void;
}

const activities = [
  {
    id: '1',
    date: '2025-01-15',
    calories: 850,
    steps: 12000,
    workoutType: 'Running',
    reactions: 5,
    comments: 2,
    time: '2 hours ago'
  },
  {
    id: '2',
    date: '2025-01-14',
    calories: 620,
    steps: 9500,
    workoutType: 'Cycling',
    reactions: 3,
    comments: 1,
    time: '1 day ago'
  },
  {
    id: '3',
    date: '2025-01-13',
    calories: 720,
    steps: 11200,
    workoutType: 'Weights',
    reactions: 7,
    comments: 3,
    time: '2 days ago'
  }
];

export function RecentActivities({ onNavigate }: RecentActivitiesProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-gray-900">Recent Activities</h2>
          <p className="text-gray-600 text-sm">Your last 3 logged activities</p>
        </div>
        <button
          onClick={() => onNavigate('track')}
          className="text-green-600 hover:text-green-700 flex items-center gap-1 text-sm"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {activities.map(activity => (
          <div
            key={activity.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-gray-900 mb-1">{activity.workoutType}</div>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{activity.time}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-600 text-sm">
                  {(activity.calories + activity.steps).toLocaleString()} pts
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-gray-700 text-sm">{activity.calories.toLocaleString()} cal</span>
              </div>
              <div className="flex items-center gap-2">
                <Footprints className="w-4 h-4 text-blue-500" />
                <span className="text-gray-700 text-sm">{activity.steps.toLocaleString()} steps</span>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1 text-gray-600 text-sm">
                <ThumbsUp className="w-4 h-4" />
                <span>{activity.reactions}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600 text-sm">
                <MessageCircle className="w-4 h-4" />
                <span>{activity.comments}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
