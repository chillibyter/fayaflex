import { useState } from 'react';
import { User, Screen } from '../../App';
import { Sidebar } from '../navigation/Sidebar';
import { Calendar, Flame, Footprints, Dumbbell, Camera, Smartphone, Check } from 'lucide-react';

interface TrackActivityProps {
  user: User;
  onNavigate: (screen: Screen) => void;
}

type Tab = 'manual' | 'devices';

export function TrackActivity({ user, onNavigate }: TrackActivityProps) {
  const [tab, setTab] = useState<Tab>('manual');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [calories, setCalories] = useState('');
  const [steps, setSteps] = useState('');
  const [workoutType, setWorkoutType] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!calories || !steps) {
      setMessage('Calories and steps are required');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    const totalPoints = parseInt(calories) + parseInt(steps);
    setMessage(`Activity logged! +${totalPoints.toLocaleString()} points`);
    
    setTimeout(() => {
      setMessage('');
      setCalories('');
      setSteps('');
      setWorkoutType('');
      setNotes('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentScreen="track" onNavigate={onNavigate} />
      
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-gray-900">Track Activity</h1>
            <p className="text-gray-600 text-sm mt-1">Log your daily fitness activities</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6">
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('logged')
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                {message.includes('logged') && <Check className="w-5 h-5" />}
                <span>{message}</span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 mb-6">
            <button
              onClick={() => setTab('manual')}
              className={`pb-3 px-4 ${
                tab === 'manual'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-500'
              }`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setTab('devices')}
              className={`pb-3 px-4 ${
                tab === 'devices'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-500'
              }`}
            >
              Fitness Devices
            </button>
          </div>

          {/* Manual Entry Tab */}
          {tab === 'manual' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                {/* Calories and Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Calories Burned *
                    </label>
                    <div className="relative">
                      <Flame className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-500" />
                      <input
                        type="number"
                        value={calories}
                        onChange={(e) => setCalories(e.target.value)}
                        min="0"
                        placeholder="0"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Steps Taken *
                    </label>
                    <div className="relative">
                      <Footprints className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                      <input
                        type="number"
                        value={steps}
                        onChange={(e) => setSteps(e.target.value)}
                        min="0"
                        placeholder="0"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Workout Type */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Workout Type (Optional)
                  </label>
                  <div className="relative">
                    <Dumbbell className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-500" />
                    <select
                      value={workoutType}
                      onChange={(e) => setWorkoutType(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select workout type</option>
                      <option value="running">Running</option>
                      <option value="cycling">Cycling</option>
                      <option value="weights">Weights</option>
                      <option value="swimming">Swimming</option>
                      <option value="yoga">Yoga</option>
                      <option value="walking">Walking</option>
                      <option value="hiit">HIIT</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional details about your workout..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Evidence Upload */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Evidence Photo (Optional)
                  </label>
                  <button
                    type="button"
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-green-500 hover:bg-green-50 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Click to upload photo</p>
                  </button>
                </div>

                {/* Points Preview */}
                {calories && steps && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-sm text-gray-700 mb-1">Total Points</div>
                    <div className="text-green-600">
                      {(parseInt(calories) + parseInt(steps)).toLocaleString()} points
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {parseInt(calories).toLocaleString()} calories + {parseInt(steps).toLocaleString()} steps
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Log Activity
                </button>
              </form>
            </div>
          )}

          {/* Fitness Devices Tab */}
          {tab === 'devices' && (
            <div className="space-y-4">
              <DeviceCard
                name="Apple Health"
                description="Sync data from iPhone Health app"
                icon={<Smartphone className="w-6 h-6 text-gray-700" />}
                provider="apple_health"
              />
              <DeviceCard
                name="Android Health Connect"
                description="Sync data from Android devices"
                icon={<Smartphone className="w-6 h-6 text-green-600" />}
                provider="android_health"
              />
              <DeviceCard
                name="Huawei Health"
                description="Sync data from Huawei devices"
                icon={<Smartphone className="w-6 h-6 text-red-600" />}
                provider="huawei_health"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DeviceCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  provider: string;
}

function DeviceCard({ name, description, icon }: DeviceCardProps) {
  const [connected, setConnected] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="bg-gray-100 p-3 rounded-lg">
            {icon}
          </div>
          <div>
            <h3 className="text-gray-900 mb-1">{name}</h3>
            <p className="text-gray-600 text-sm">{description}</p>
          </div>
        </div>
        <button
          onClick={() => setConnected(!connected)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            connected
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {connected ? 'Disconnect' : 'Connect'}
        </button>
      </div>
    </div>
  );
}
