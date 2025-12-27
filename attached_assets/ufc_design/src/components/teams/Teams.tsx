import { User, Screen } from '../../App';
import { Sidebar } from '../navigation/Sidebar';
import { Users, Share2, Plus, Trophy, ChevronRight } from 'lucide-react';

interface TeamsProps {
  user: User;
  onNavigate: (screen: Screen, teamId?: string) => void;
}

interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  inviteCode: string;
  isOwner: boolean;
  avgCalories: number;
  avgSteps: number;
  rank: number;
}

const mockTeams: Team[] = [
  {
    id: '1',
    name: 'Morning Warriors',
    description: 'Early risers crushing fitness goals together!',
    memberCount: 15,
    inviteCode: 'MWAR2024',
    isOwner: true,
    avgCalories: 9680,
    avgSteps: 65467,
    rank: 1
  },
  {
    id: '2',
    name: 'Weekend Warriors',
    description: 'Making the most of our weekends!',
    memberCount: 8,
    inviteCode: 'WWAR2024',
    isOwner: false,
    avgCalories: 8245,
    avgSteps: 58932,
    rank: 7
  }
];

export function Teams({ onNavigate }: TeamsProps) {
  const handleShare = (inviteCode: string) => {
    navigator.clipboard.writeText(inviteCode);
    alert(`Invite code ${inviteCode} copied to clipboard!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentScreen="teams" onNavigate={onNavigate} />
      
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <div className="bg-green-600 text-white px-4 py-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-white mb-2">My Teams</h1>
                <p className="text-green-50 text-sm">Manage and view your teams</p>
              </div>
              <button
                onClick={() => onNavigate('team-selection')}
                className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Join Team
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Teams List */}
          <div className="space-y-4">
            {mockTeams.map(team => (
              <div
                key={team.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-gray-900">{team.name}</h3>
                        {team.isOwner && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                            Owner
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{team.description}</p>
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Users className="w-4 h-4" />
                        <span>{team.memberCount}/20 members</span>
                      </div>
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-gray-500 text-xs mb-1">Rank</div>
                      <div className="text-gray-900">#{team.rank}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 text-xs mb-1">Avg Calories</div>
                      <div className="text-gray-900">{team.avgCalories.toLocaleString()}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500 text-xs mb-1">Avg Steps</div>
                      <div className="text-gray-900">{team.avgSteps.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => onNavigate('team-detail', team.id)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      View Leaderboard
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShare(team.inviteCode)}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    {team.isOwner && team.rank === 1 && (
                      <button
                        onClick={() => onNavigate('victory-wall', team.id)}
                        className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg hover:bg-yellow-200 transition-colors flex items-center gap-2"
                      >
                        <Trophy className="w-4 h-4" />
                        Victory Wall
                      </button>
                    )}
                  </div>

                  {/* Invite Code */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-xs text-blue-700 mb-1">Invite Code</div>
                    <div className="text-blue-900 font-mono">{team.inviteCode}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
