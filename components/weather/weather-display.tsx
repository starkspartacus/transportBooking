import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import type { WeatherData } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WeatherDisplayProps {
  weather: WeatherData;
  className?: string;
}

const getWeatherIcon = (iconCode: string) => {
  // OpenWeatherMap icon codes mapping to Lucide icons
  // More comprehensive mapping can be done if needed
  switch (iconCode.slice(0, 2)) {
    // Use first two chars for general weather type
    case "01":
      return <Sun className="h-12 w-12 text-yellow-500" />; // Clear sky
    case "02": // Few clouds
    case "03": // Scattered clouds
    case "04":
      return <Cloud className="h-12 w-12 text-gray-400" />; // Broken clouds
    case "09":
      return <CloudRain className="h-12 w-12 text-blue-500" />; // Shower rain
    case "10":
      return <CloudDrizzle className="h-12 w-12 text-blue-400" />; // Rain
    case "11":
      return <CloudLightning className="h-12 w-12 text-gray-600" />; // Thunderstorm
    case "13":
      return <CloudSnow className="h-12 w-12 text-blue-200" />; // Snow
    case "50":
      return <Wind className="h-12 w-12 text-gray-300" />; // Mist
    default:
      return <Sun className="h-12 w-12 text-yellow-500" />; // Default to sun
  }
};

export function WeatherDisplay({ weather, className }: WeatherDisplayProps) {
  if (!weather) {
    return null;
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Météo à {weather.city}
        </CardTitle>
        {getWeatherIcon(weather.icon)}
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-2xl font-bold">
          <Thermometer className="mr-2 h-6 w-6" />
          {weather.temperature.toFixed(1)}°C
        </div>
        <p className="capitalize text-xs text-muted-foreground">
          {weather.description}
        </p>
      </CardContent>
    </Card>
  );
}
