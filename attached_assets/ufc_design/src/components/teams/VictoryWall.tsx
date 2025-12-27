import { ArrowLeft, Trophy, Calendar, Award } from 'lucide-react';

interface VictoryWallProps {
  teamId: string;
  onBack: () => void;
}

interface Champion {
  month: string;
  year: number;
  winnerId: string;
  winnerName: string;
  totalPoints: number;
  calories: number;
  steps: number;
  avatarId: string;
}

const champions: Champion[] = [
  {
    month: 'December',
    year: 2024,
    winnerId: '1',
    winnerName: 'Sarah Johnson',
    totalPoints: 185300,
    calories: 82150,
    steps: 103150,
    avatarId: '1'
  },
  {
    month: 'November',
    year: 2024,
    winnerId: '2',
    winnerName: 'Mike Chen',
    totalPoints: 178900,
    calories: 78450,
    steps: 100450,
    avatarId: '2'
  },
  {
    month: 'October',
    year: 2024,
    winnerId: '3',
    winnerName: 'Emma Davis',
    totalPoints: 172500,
    calories: 75800,
    steps: 96700,
    avatarId: '3'
  }
];

export function VictoryWall({ onBack }: VictoryWallProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 mb-4 hover:text-yellow-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8" />
            <h1 className="text-white">Victory Wall</h1>
          </div>
          <p className="text-yellow-50 text-sm">Monthly champions hall of fame</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <Award className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-blue-900 mb-1">About Victory Wall</h3>
              <p className="text-blue-700 text-sm">
                The Victory Wall celebrates our monthly champions. Each month, the team member with the 
                highest total points earns a permanent spot in our hall of fame!
              </p>
            </div>
          </div>
        </div>

        {/* Champions List */}
        <div className="space-y-4">
          {champions.map((champion, index) => (
            <ChampionCard key={`${champion.month}-${champion.year}`} champion={champion} index={index} />
          ))}
        </div>

        {/* Calculate Winner Button (Owner Only) */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-gray-900 mb-3">Team Owner Actions</h3>
          <p className="text-gray-600 text-sm mb-4">
            At the end of each month, calculate and announce the winner to update the Victory Wall.
          </p>
          <button className="w-full md:w-auto bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5" />
            Calculate This Month's Winner
          </button>
        </div>
      </div>
    </div>
  );
}

interface ChampionCardProps {
  champion: Champion;
  index: number;
}

function ChampionCard({ champion, index }: ChampionCardProps) {
  const isRecent = index === 0;

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${
      isRecent ? 'ring-2 ring-yellow-400' : ''
    }`}>
      <div className={`p-5 ${isRecent ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''}`}>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl flex-shrink-0 ${
            isRecent
              ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
              : 'bg-gradient-to-br from-green-400 to-blue-500'
          }`}>
            {champion.winnerName[0]}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{champion.month} {champion.year}</span>
              </div>
              {isRecent && (
                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                  Latest
                </span>
              )}
            </div>

            <h3 className="text-gray-900 mb-3">{champion.winnerName}</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-gray-500 text-xs mb-1">Total Points</div>
                <div className="text-yellow-600">
                  {champion.totalPoints.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Calories</div>
                <div className="text-orange-600">
                  {champion.calories.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Steps</div>
                <div className="text-blue-600">
                  {champion.steps.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Trophy */}
          {isRecent && (
            <Trophy className="w-10 h-10 text-yellow-500 flex-shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}
