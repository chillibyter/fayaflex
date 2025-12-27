import { useState } from 'react';
import { Trophy, Calculator, Users, Calendar, Award, ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: <Trophy className="w-16 h-16 text-green-600" />,
    title: 'Welcome to Ultimate Fitness Challenge',
    description: 'Track your fitness journey, compete with friends, and achieve your health goals together!'
  },
  {
    icon: <Calculator className="w-16 h-16 text-orange-600" />,
    title: 'How Scoring Works',
    description: 'Earn 1 point per calorie burned + 1 point per step taken. The more active you are, the higher you score!'
  },
  {
    icon: <Users className="w-16 h-16 text-blue-600" />,
    title: 'Team vs Individual',
    description: 'Compete on team leaderboards (based on average scores) or individual leaderboards to see who\'s the most active!'
  },
  {
    icon: <Calendar className="w-16 h-16 text-purple-600" />,
    title: 'Monthly Challenges',
    description: 'Challenges reset on the 1st of each month. Start fresh and aim for the top every month!'
  },
  {
    icon: <Award className="w-16 h-16 text-yellow-600" />,
    title: 'Victory Wall',
    description: 'Monthly champions are celebrated on the Victory Wall. Will you be next month\'s winner?'
  }
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Icon */}
        <div className="mb-8 animate-bounce">
          {slide.icon}
        </div>

        {/* Content */}
        <div className="max-w-md text-center mb-8">
          <h1 className="text-gray-900 mb-4">{slide.title}</h1>
          <p className="text-gray-600">{slide.description}</p>
        </div>

        {/* Progress Dots */}
        <div className="flex gap-2 mb-12">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-8 bg-green-600'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8">
        <div className="max-w-md mx-auto">
          {/* Main Button */}
          <button
            onClick={handleNext}
            className="w-full bg-green-600 text-white py-4 rounded-full hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mb-4"
          >
            {currentSlide < slides.length - 1 ? (
              <>
                Next
                <ChevronRight className="w-5 h-5" />
              </>
            ) : (
              'Get Started'
            )}
          </button>

          {/* Secondary Actions */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className={`flex items-center gap-1 text-sm ${
                currentSlide === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {currentSlide < slides.length - 1 && (
              <button
                onClick={handleSkip}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
