import { Screen } from '../App';
import { Sidebar } from './navigation/Sidebar';
import { Calculator, Trophy, Users, Calendar, Target, Award, HelpCircle } from 'lucide-react';

interface HowItWorksProps {
  onNavigate: (screen: Screen) => void;
}

export function HowItWorks({ onNavigate }: HowItWorksProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentScreen="how-it-works" onNavigate={onNavigate} />
      
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-500 text-white px-4 py-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-white mb-2">How It Works</h1>
            <p className="text-blue-50 text-sm">Everything you need to know about UFC</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Scoring Formula */}
          <Section
            icon={<Calculator className="w-6 h-6 text-orange-500" />}
            title="Scoring Formula"
            color="bg-orange-50"
          >
            <p className="text-gray-700 mb-3">
              Your daily score is calculated using a simple formula:
            </p>
            <div className="bg-white border-2 border-orange-300 rounded-lg p-4 text-center mb-3">
              <div className="text-orange-600 text-sm mb-1">Daily Score</div>
              <div className="text-gray-900">1 point per calorie + 1 point per step</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-900 mb-1">Example:</div>
              <div className="text-blue-700 text-sm">
                If you burn 850 calories and take 12,000 steps:
                <br />
                <span className="text-blue-900">850 + 12,000 = 12,850 points</span>
              </div>
            </div>
          </Section>

          {/* Leaderboard Types */}
          <Section
            icon={<Trophy className="w-6 h-6 text-yellow-500" />}
            title="Leaderboard Types"
            color="bg-yellow-50"
          >
            <div className="space-y-3">
              <LeaderboardType
                title="Team Leaderboards"
                description="Based on average calories of all team members. The team with the highest average wins!"
                icon="👥"
              />
              <LeaderboardType
                title="Individual Leaderboards"
                description="Compete individually in three categories: Total Calories, Total Steps, and Workout Days"
                icon="🏃"
              />
            </div>
          </Section>

          {/* Monthly Timeline */}
          <Section
            icon={<Calendar className="w-6 h-6 text-purple-500" />}
            title="Monthly Timeline"
            color="bg-purple-50"
          >
            <p className="text-gray-700 mb-3">
              All leaderboards reset on the 1st of each month, giving everyone a fresh start to compete 
              for the top position. Monthly champions are celebrated on the Victory Wall!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <TimelineCard day="1st" label="Reset" description="Leaderboards reset" />
              <TimelineCard day="1-30" label="Compete" description="Track & compete" />
              <TimelineCard day="Last Day" label="Winners" description="Champions announced" />
            </div>
          </Section>

          {/* Tips */}
          <Section
            icon={<Target className="w-6 h-6 text-green-500" />}
            title="Tips for Success"
            color="bg-green-50"
          >
            <div className="space-y-2">
              <TipItem text="Log activities daily to maintain your streak and earn badges" />
              <TipItem text="Join an active team to benefit from group motivation" />
              <TipItem text="Set daily and weekly goals to track your progress" />
              <TipItem text="Connect fitness devices for automatic activity syncing" />
              <TipItem text="Engage with teammates by reacting and commenting on activities" />
            </div>
          </Section>

          {/* FAQ */}
          <Section
            icon={<HelpCircle className="w-6 h-6 text-blue-500" />}
            title="Frequently Asked Questions"
            color="bg-blue-50"
          >
            <div className="space-y-4">
              <FAQItem
                question="How many teams can I join?"
                answer="You must be on at least one team, but you can join multiple teams (up to 5 teams total)."
              />
              <FAQItem
                question="What's the maximum team size?"
                answer="Each team can have up to 20 members."
              />
              <FAQItem
                question="How do I earn badges?"
                answer="Badges are earned automatically by achieving milestones like maintaining streaks, reaching point thresholds, and winning monthly challenges."
              />
              <FAQItem
                question="Can I edit past activities?"
                answer="Yes, you can edit activities from the current month. Activities from previous months cannot be modified."
              />
              <FAQItem
                question="What happens if I miss a day?"
                answer="Missing a day will reset your streak counter, but your total points and stats remain intact."
              />
            </div>
          </Section>

          {/* Get Started CTA */}
          <div className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl p-6 text-center">
            <Award className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-white mb-3">Ready to Start?</h2>
            <p className="text-green-50 mb-4">
              Log your first activity and begin your fitness journey today!
            </p>
            <button
              onClick={() => onNavigate('track')}
              className="bg-white text-green-600 px-8 py-3 rounded-lg hover:bg-green-50 transition-colors"
            >
              Log Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}

function Section({ icon, title, color, children }: SectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className={`${color} inline-flex items-center gap-3 px-4 py-2 rounded-lg mb-4`}>
        {icon}
        <h2 className="text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

interface LeaderboardTypeProps {
  title: string;
  description: string;
  icon: string;
}

function LeaderboardType({ title, description, icon }: LeaderboardTypeProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <div className="text-gray-900 mb-1">{title}</div>
          <div className="text-gray-600 text-sm">{description}</div>
        </div>
      </div>
    </div>
  );
}

interface TimelineCardProps {
  day: string;
  label: string;
  description: string;
}

function TimelineCard({ day, label, description }: TimelineCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="text-purple-600 mb-1">{day}</div>
      <div className="text-gray-900 text-sm mb-1">{label}</div>
      <div className="text-gray-600 text-xs">{description}</div>
    </div>
  );
}

interface TipItemProps {
  text: string;
}

function TipItem({ text }: TipItemProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <div className="w-2 h-2 bg-white rounded-full" />
      </div>
      <p className="text-gray-700 text-sm">{text}</p>
    </div>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <div>
      <h3 className="text-gray-900 mb-2">{question}</h3>
      <p className="text-gray-600 text-sm">{answer}</p>
    </div>
  );
}
