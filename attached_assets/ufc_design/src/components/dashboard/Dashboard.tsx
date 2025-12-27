import { Screen, User } from '../../App';
import { Sidebar } from '../navigation/Sidebar';
import { StatsCards } from './StatsCards';
import { ProgressChart } from './ProgressChart';
import { RecentActivities } from './RecentActivities';
import { GoalJourneys } from './GoalJourneys';
import { QuickStartCard } from './QuickStartCard';
import { TrendingUp } from 'lucide-react';

interface DashboardProps {
  user: User;
  onNavigate: (screen: Screen) => void;
}

// Mock data
const hasActivities = true; // Change to false to see QuickStartCard

export function Dashboard({ user, onNavigate }: DashboardProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentScreen="dashboard" onNavigate={onNavigate} />
      
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-gray-900">Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">
              Welcome back, {user.firstName || user.username}!
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Quick Start Card (shown if no activities) */}
          {!hasActivities && (
            <QuickStartCard onNavigate={onNavigate} />
          )}

          {/* Stats Cards */}
          <StatsCards />

          {/* Progress Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-gray-900">Weekly Progress</h2>
                <p className="text-gray-600 text-sm">Calories burned this week</p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <ProgressChart />
          </div>

          {/* Goal Journeys */}
          <GoalJourneys onNavigate={onNavigate} />

          {/* Recent Activities */}
          <RecentActivities onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}
