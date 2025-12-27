import { Plus, Zap } from 'lucide-react';
import { Screen } from '../../App';

interface QuickStartCardProps {
  onNavigate: (screen: Screen) => void;
}

export function QuickStartCard({ onNavigate }: QuickStartCardProps) {
  return (
    <div className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl p-6 mb-6 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="bg-white bg-opacity-20 p-3 rounded-lg">
          <Zap className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h2 className="text-white mb-2">Get Started!</h2>
          <p className="text-green-50 mb-4">
            Log your first activity to start tracking your fitness journey and earning points!
          </p>
          <button
            onClick={() => onNavigate('track')}
            className="bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Log First Activity
          </button>
        </div>
      </div>
    </div>
  );
}
