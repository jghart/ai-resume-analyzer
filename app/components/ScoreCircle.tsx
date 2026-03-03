import { useEffect, useState } from "react";

const ScoreCircle = ({ score = 75, label }: { score: number; label?: string }) => {
  const [displayScore, setDisplayScore] = useState(0);

  // Animate count-up from 0 to score on mount
  useEffect(() => {
    if (score === 0) return;

    const duration = 1000; // ms
    const steps = 60;
    const increment = score / steps;
    const stepDuration = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [score]);

  const radius = 40;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const progress = displayScore / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[100px] h-[100px]">
        <svg
          height="100%"
          width="100%"
          viewBox="0 0 100 100"
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={normalizedRadius}
            stroke="#e5e7eb"
            strokeWidth={stroke}
            fill="transparent"
          />
          {/* Animated progress circle */}
          <defs>
            <linearGradient id="grad" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF97AD" />
              <stop offset="100%" stopColor="#5171FF" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r={normalizedRadius}
            stroke="url(#grad)"
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 16ms linear" }}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-semibold text-sm">{`${displayScore}/100`}</span>
        </div>
      </div>

      {/* Optional label below the circle */}
      {label && (
        <span className="text-sm text-gray-500 font-medium">{label}</span>
      )}
    </div>
  );
};

export default ScoreCircle;