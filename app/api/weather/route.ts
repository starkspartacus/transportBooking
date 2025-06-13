import { type NextRequest, NextResponse } from "next/server";

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  city: string;
  country: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const country = searchParams.get("country"); // Optional, for better accuracy

  if (!city) {
    return NextResponse.json(
      { error: "City parameter is required" },
      { status: 400 }
    );
  }

  const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
  if (!OPENWEATHER_API_KEY) {
    return NextResponse.json(
      { error: "OpenWeatherMap API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Using current weather data
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )},${encodeURIComponent(
        country || ""
      )}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=fr`
    );

    if (!weatherResponse.ok) {
      const errorData = await weatherResponse.json();
      console.error("OpenWeatherMap API error:", errorData);
      return NextResponse.json(
        {
          error: `Failed to fetch weather data: ${
            errorData.message || weatherResponse.statusText
          }`,
        },
        { status: weatherResponse.status }
      );
    }

    const data = await weatherResponse.json();

    const weather: WeatherData = {
      temperature: data.main.temp,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      city: data.name,
      country: data.sys.country,
    };

    return NextResponse.json(weather);
  } catch (error) {
    console.error("Error fetching weather:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching weather" },
      { status: 500 }
    );
  }
}
