"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { WeatherData } from "@/lib/types";

interface WeatherDisplayProps {
  weather: WeatherData;
  className?: string;
}

// Animated SVG Icons
const AnimatedSun = () => (
  <svg
    className="h-12 w-12 text-yellow-500 animate-spin-slow"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const AnimatedCloud = () => (
  <svg
    className="h-12 w-12 text-gray-400 animate-cloud-move"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.5 18H18a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2h-.5a4 4 0 0 0-4-4h-1.5a4 4 0 0 0-4 4H6a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h.5" />
  </svg>
);

const AnimatedRain = () => (
  <svg
    className="h-12 w-12 text-blue-500"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path
      d="M12 18V20"
      className="animate-rain-drop"
      style={{ animationDelay: "0s" }}
    />
    <path
      d="M16 18V20"
      className="animate-rain-drop"
      style={{ animationDelay: "0.2s" }}
    />
    <path
      d="M8 18V20"
      className="animate-rain-drop"
      style={{ animationDelay: "0.4s" }}
    />
    <path d="M17.5 18H18a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2h-.5a4 4 0 0 0-4-4h-1.5a4 4 0 0 0-4 4H6a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h.5" />
  </svg>
);

const AnimatedThunderstorm = () => (
  <svg
    className="h-12 w-12 text-gray-600"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.5 18H18a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2h-.5a4 4 0 0 0-4-4h-1.5a4 4 0 0 0-4 4H6a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h.5" />
    <path d="m14 17-6 5v-8h6l-6-5v8h6z" className="animate-lightning-flash" />
  </svg>
);

const AnimatedSnow = () => (
  <svg
    className="h-12 w-12 text-blue-200"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.5 18H18a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2h-.5a4 4 0 0 0-4-4h-1.5a4 4 0 0 0-4 4H6a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h.5" />
    <circle
      cx="12"
      cy="18"
      r="1"
      className="animate-snow-fall"
      style={{ animationDelay: "0s" }}
    />
    <circle
      cx="16"
      cy="16"
      r="1"
      className="animate-snow-fall"
      style={{ animationDelay: "0.3s" }}
    />
    <circle
      cx="8"
      cy="16"
      r="1"
      className="animate-snow-fall"
      style={{ animationDelay: "0.6s" }}
    />
  </svg>
);

const getWeatherIcon = (iconCode: string) => {
  switch (iconCode.slice(0, 2)) {
    case "01": // Clear sky
      return <AnimatedSun />;
    case "02": // Few clouds
    case "03": // Scattered clouds
    case "04": // Broken clouds
      return <AnimatedCloud />;
    case "09": // Shower rain
    case "10": // Rain
      return <AnimatedRain />;
    case "11": // Thunderstorm
      return <AnimatedThunderstorm />;
    case "13": // Snow
      return <AnimatedSnow />;
    case "50": // Mist
      return <AnimatedCloud />; // Using cloud for mist for simplicity
    default:
      return <AnimatedSun />;
  }
};

export function WeatherDisplay({ weather, className }: WeatherDisplayProps) {
  if (!weather) {
    return null;
  }

  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes cloud-move {
          0% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(10px);
          }
          100% {
            transform: translateX(0);
          }
        }
        @keyframes rain-drop {
          0% {
            transform: translateY(-5px);
            opacity: 1;
          }
          100% {
            transform: translateY(10px);
            opacity: 0;
          }
        }
        @keyframes lightning-flash {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
        @keyframes snow-fall {
          0% {
            transform: translateY(-5px);
            opacity: 1;
          }
          100% {
            transform: translateY(10px);
            opacity: 0;
          }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
        .animate-cloud-move {
          animation: cloud-move 4s ease-in-out infinite alternate;
        }
        .animate-rain-drop {
          animation: rain-drop 1s linear infinite;
        }
        .animate-lightning-flash {
          animation: lightning-flash 0.5s steps(1, end) infinite;
        }
        .animate-snow-fall {
          animation: snow-fall 2s linear infinite;
        }
      `}</style>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Météo à {weather.city}
        </CardTitle>
        {getWeatherIcon(weather.icon)}
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-2xl font-bold">
          <span className="mr-2 text-gray-600">🌡️</span>
          {weather.temperature.toFixed(1)}°C
        </div>
        <p className="capitalize text-xs text-muted-foreground">
          {weather.description}
        </p>
      </CardContent>
    </Card>
  );
}
