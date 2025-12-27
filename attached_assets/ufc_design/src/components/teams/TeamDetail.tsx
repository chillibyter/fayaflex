import { Screen } from '../../App';
import { ArrowLeft, Trophy, Medal, Award, Flame, Footprints } from 'lucide-react';

interface TeamDetailProps {
  teamId: string;
  onNavigate: (screen: Screen, teamId?: string) => void;
}

interface TeamMember {
  id: string;
  rank: number;
  name: string;
  calories: number;
  steps: number;
  workouts: number;
  avatarId: string;
  isCurrentUser?: boolean;
}

const mockMembers: TeamMember[] = [
  { id: '1', rank: 1, name: 'Sarah Johnson', calories: 18450, steps: 125000, workouts: 25, avatarId: '1' },
  { id: '2', rank: 2, name: 'Mike Chen', calories: 16280, steps: 118000, workouts: 23, avatarId: '2' },
  { id: '3', rank: 3, name: 'Emma Davis', calories: 15150, steps: 112000, workouts: 22, avatarId: '3' },
  { id: '4', rank: 4, name: 'You', calories: 12450, steps: 87300, workouts: 18, avatarId: '1', isCurrentUser: true },
  { id: '5', rank: 5, name: 'Alex Martinez', calories: 11820, steps: 85000, workouts: 17, avatarId: '4' },
  { id: '6', rank: 6, name: 'Jessica Lee', calories: 10950, steps: 78000, workouts: 16, avatarId: '5' },
  { id: '7', rank: 7, name: 'Tom Wilson', calories: 9800, steps: 72000, workouts: 14, avatarId: '6' },
  { id: '8', rank: 8, name: 'Lisa Brown', calories: 8650, steps: 65000, workouts: 12, avatarId: '7' }
];

export function TeamDetail({ onNavigate }: TeamDetailProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => onNavigate('teams')}
            className="flex items-center gap-2 mb-4 hover:text-green-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Teams</span>
          </button>
          <h1 className="text-white mb-2">Morning Warriors</h1>
          <p className="text-green-50 text-sm">Team Leaderboard - January 2025</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Team Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Team Rank" value="#1" color="text-yellow-600" />
          <StatCard label="Members" value="15/20" color="text-blue-600" />
          <StatCard label="Avg Calories" value="9,680" color="text-orange-600" />
          <StatCard label="Avg Steps" value="65,467" color="text-purple-600" />
        </div>

        {/* Team Members Leaderboard */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-gray-900">Team Members</h2>
          </div>
          {mockMembers.map((member, index) => (
            <MemberRow key={member.id} member={member} showTopBadge={index < 3} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 text-center">
      <div className="text-gray-500 text-sm mb-1">{label}</div>
      <div className={`${color}`}>{value}</div>
    </div>
  );
}

interface MemberRowProps {
  member: TeamMember;
  showTopBadge: boolean;
}

function MemberRow({ member, showTopBadge }: MemberRowProps) {
  const getRankIcon = () => {
    if (!showTopBadge) return null;
    
    switch (member.rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-orange-600" />;
      default: return null;
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 ${
      member.isCurrentUser ? 'bg-green-50' : 'hover:bg-gray-50'
    }`}>
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 text-center">
          {showTopBadge ? (
            getRankIcon()
          ) : (
            <span className={`${member.isCurrentUser ? 'text-green-600' : 'text-gray-500'}`}>
              #{member.rank}
            </span>
          )}
        </div>
        
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
          {member.name[0]}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={`truncate ${member.isCurrentUser ? 'text-green-600' : 'text-gray-900'}`}>
            {member.name}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-500" />
              <span>{member.calories.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Footprints className="w-3 h-3 text-blue-500" />
              <span>{member.steps.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <div className={`${member.isCurrentUser ? 'text-green-600' : 'text-gray-900'}`}>
          {(member.calories + member.steps).toLocaleString()}
        </div>
        <div className="text-gray-500 text-xs">points</div>
      </div>
    </div>
  );
}
