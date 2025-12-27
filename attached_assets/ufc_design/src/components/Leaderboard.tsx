import { ArrowLeft, Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  challenges: number;
  avatar: string;
  isCurrentUser?: boolean;
}

const leaderboardData: LeaderboardEntry[] = [
  { rank: 1, name: 'Sarah Johnson', points: 2450, challenges: 12, avatar: '👩', isCurrentUser: false },
  { rank: 2, name: 'Mike Chen', points: 2280, challenges: 11, avatar: '👨', isCurrentUser: false },
  { rank: 3, name: 'Emma Davis', points: 2150, challenges: 10, avatar: '👱‍♀️', isCurrentUser: false },
  { rank: 4, name: 'You', points: 850, challenges: 4, avatar: '😊', isCurrentUser: true },
  { rank: 5, name: 'Alex Martinez', points: 820, challenges: 5, avatar: '👦', isCurrentUser: false },
  { rank: 6, name: 'Jessica Lee', points: 780, challenges: 4, avatar: '👧', isCurrentUser: false },
  { rank: 7, name: 'Tom Wilson', points: 690, challenges: 3, avatar: '👨‍🦰', isCurrentUser: false },
  { rank: 8, name: 'Lisa Brown', points: 650, challenges: 3, avatar: '👩‍🦱', isCurrentUser: false },
];

interface LeaderboardProps {
  onBack: () => void;
}

export function Leaderboard({ onBack }: LeaderboardProps) {
  const topThree = leaderboardData.slice(0, 3);
  const remaining = leaderboardData.slice(3);

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-6 shadow-lg">
        <div className="max-w-md mx-auto">
          <button onClick={onBack} className="mb-4 flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="mb-2">Leaderboard</h1>
          <p className="text-yellow-50 text-sm">
            Top performers this month
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4">
        {/* Top 3 Podium */}
        <div className="flex items-end justify-center gap-2 mb-8 -mt-8">
          {/* 2nd Place */}
          <PodiumCard 
            entry={topThree[1]}
            height="h-32"
            rank={2}
            color="bg-gray-300"
          />
          {/* 1st Place */}
          <PodiumCard 
            entry={topThree[0]}
            height="h-40"
            rank={1}
            color="bg-yellow-400"
          />
          {/* 3rd Place */}
          <PodiumCard 
            entry={topThree[2]}
            height="h-24"
            rank={3}
            color="bg-orange-400"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">
            This Month
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
            All Time
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm">
            Friends
          </button>
        </div>

        {/* Remaining Rankings */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {remaining.map(entry => (
            <LeaderboardRow key={entry.rank} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface PodiumCardProps {
  entry: LeaderboardEntry;
  height: string;
  rank: number;
  color: string;
}

function PodiumCard({ entry, height, rank, color }: PodiumCardProps) {
  const icons = {
    1: <Trophy className="w-6 h-6 text-yellow-600" />,
    2: <Medal className="w-5 h-5 text-gray-600" />,
    3: <Award className="w-5 h-5 text-orange-600" />
  };

  return (
    <div className="flex flex-col items-center flex-1">
      <div className="mb-2 text-3xl bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
        {entry.avatar}
      </div>
      <div className="text-center mb-2">
        <div className="text-gray-900 text-sm truncate max-w-[80px]">{entry.name}</div>
        <div className="text-green-600 text-xs">{entry.points} pts</div>
      </div>
      <div className={`${height} ${color} w-full rounded-t-lg flex items-start justify-center pt-3 shadow-lg`}>
        {icons[rank as keyof typeof icons]}
      </div>
    </div>
  );
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
}

function LeaderboardRow({ entry }: LeaderboardRowProps) {
  return (
    <div className={`flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 ${
      entry.isCurrentUser ? 'bg-green-50' : 'hover:bg-gray-50'
    }`}>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`w-8 text-center ${
          entry.isCurrentUser ? 'text-green-600' : 'text-gray-500'
        }`}>
          #{entry.rank}
        </div>
        <div className="text-2xl bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
          {entry.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`truncate ${entry.isCurrentUser ? 'text-green-600' : 'text-gray-900'}`}>
            {entry.name}
          </div>
          <div className="text-gray-500 text-sm">
            {entry.challenges} challenges completed
          </div>
        </div>
      </div>
      <div className={`text-right ${entry.isCurrentUser ? 'text-green-600' : 'text-gray-900'}`}>
        {entry.points}
        <div className="text-gray-500 text-xs">points</div>
      </div>
    </div>
  );
}
