import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RotatingBannerProps {
  messages: string[];
  interval?: number;
  className?: string;
}

export default function RotatingBanner({ 
  messages, 
  interval = 5000,
  className = "" 
}: RotatingBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, interval);
    return () => clearInterval(timer);
  }, [messages.length, interval]);

  return (
    <div className={className}>
      <div className="min-h-16 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="text-base text-muted-foreground text-center px-2"
            data-testid={`banner-message-${currentIndex}`}
          >
            {messages[currentIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-2 mt-3">
        {messages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? "bg-primary w-6"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2"
            }`}
            data-testid={`banner-dot-${index}`}
            aria-label={`Go to message ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export const defaultBannerMessages = [
  "Track your fitness journey, compete with friends, and achieve your health goals together!",
  "Earn 1 point per calorie burned + 1 point per step taken. The more active you are, the higher you score!",
  "Compete on team leaderboards (based on average scores) or individual leaderboards to see who's the most active!",
];
