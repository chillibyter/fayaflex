import { useState } from 'react';
import { Search, Plus, Users, Hash } from 'lucide-react';
import { User } from '../../App';

interface TeamSelectionProps {
  user: User;
  onTeamSelected: () => void;
}

type Tab = 'join' | 'create';

interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  inviteCode: string;
}

const mockTeams: Team[] = [
  {
    id: '1',
    name: 'Morning Warriors',
    description: 'Early risers crushing fitness goals together!',
    memberCount: 15,
    inviteCode: 'MWAR2024'
  },
  {
    id: '2',
    name: 'Fitness Legends',
    description: 'We never skip leg day!',
    memberCount: 12,
    inviteCode: 'FLEG2024'
  },
  {
    id: '3',
    name: 'Cardio Kings',
    description: 'Running, cycling, and everything cardio',
    memberCount: 8,
    inviteCode: 'CARD2024'
  }
];

export function TeamSelection({ onTeamSelected }: TeamSelectionProps) {
  const [tab, setTab] = useState<Tab>('join');
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [message, setMessage] = useState('');

  const filteredTeams = mockTeams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinTeam = (teamId: string) => {
    setMessage('Successfully joined team!');
    setTimeout(() => {
      onTeamSelected();
    }, 1000);
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const team = mockTeams.find(t => t.inviteCode === inviteCode.toUpperCase());
    if (team) {
      handleJoinTeam(team.id);
    } else {
      setMessage('Invalid invite code');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setMessage('Team name is required');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    setMessage('Team created successfully!');
    setTimeout(() => {
      onTeamSelected();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white px-4 py-6 shadow-lg">
        <div className="max-w-md mx-auto">
          <h1 className="mb-2">Join a Team</h1>
          <p className="text-green-50 text-sm">
            You must be on at least one team to continue
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('Success') || message.includes('created')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          <button
            onClick={() => setTab('join')}
            className={`pb-3 px-4 ${
              tab === 'join'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-500'
            }`}
          >
            Join Team
          </button>
          <button
            onClick={() => setTab('create')}
            className={`pb-3 px-4 ${
              tab === 'create'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-500'
            }`}
          >
            Create Team
          </button>
        </div>

        {/* Join Team Tab */}
        {tab === 'join' && (
          <div className="space-y-6">
            {/* Search Teams */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">Search Teams</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or description"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Team List */}
            <div className="space-y-3">
              {filteredTeams.map(team => (
                <div
                  key={team.id}
                  className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-gray-900 mb-1">{team.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{team.description}</p>
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Users className="w-4 h-4" />
                        <span>{team.memberCount}/20 members</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinTeam(team.id)}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors mt-3"
                  >
                    Join Team
                  </button>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="text-gray-500 text-sm">OR</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            {/* Invite Code */}
            <form onSubmit={handleJoinByCode}>
              <label className="block text-sm text-gray-700 mb-2">Enter Invite Code</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="ABCD1234"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Join with Code
              </button>
            </form>
          </div>
        )}

        {/* Create Team Tab */}
        {tab === 'create' && (
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Team Name *</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Description (Optional)</label>
              <textarea
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                placeholder="Tell others about your team..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Plus className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="mb-1">Team capacity: Up to 20 members</p>
                  <p>You'll receive a unique invite code to share with others</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Team
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
