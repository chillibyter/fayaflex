import welcomeBanner from 'figma:asset/009e266042c81144a9bb829f82f1276676a3b537.png';
import { Trophy, Target, Users, TrendingUp } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="mb-8">
          <img 
            src={welcomeBanner} 
            alt="Welcome to Ultimate Fitness Challenge"
            className="w-full rounded-lg shadow-lg"
          />
        </div>

        {/* App Description */}
        <div className="mb-8 text-center">
          <h2 className="text-gray-900 mb-3">Transform Your Fitness Journey</h2>
          <p className="text-gray-600">
            Join thousands of fitness enthusiasts in our ultimate challenge. Complete daily workouts, 
            track your progress, and compete with friends!
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          <FeatureItem 
            icon={<Target className="w-6 h-6 text-green-600" />}
            title="Daily Challenges"
            description="New workouts every day to keep you motivated"
          />
          <FeatureItem 
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            title="Track Progress"
            description="Monitor your achievements and milestones"
          />
          <FeatureItem 
            icon={<Users className="w-6 h-6 text-green-600" />}
            title="Join Community"
            description="Connect with fellow fitness enthusiasts"
          />
          <FeatureItem 
            icon={<Trophy className="w-6 h-6 text-green-600" />}
            title="Earn Rewards"
            description="Unlock badges and climb the leaderboard"
          />
        </div>

        {/* CTA Button */}
        <button
          onClick={onStart}
          className="w-full bg-green-600 text-white py-4 rounded-full shadow-lg hover:bg-green-700 transition-colors"
        >
          Start Your Challenge
        </button>
      </div>
    </div>
  );
}

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-4 bg-white p-4 rounded-lg shadow-sm">
      <div className="flex-shrink-0 mt-1">
        {icon}
      </div>
      <div>
        <h3 className="text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  );
}
