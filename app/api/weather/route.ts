import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');

  if (!city) {
    return NextResponse.json({ error: 'City parameter is required' }, { status: 400 });
  }

  try {
    // Using OpenWeatherMap API - you can get a free API key at https://openweathermap.org/api
    // For now, using a mock response. Replace with actual API call
    const apiKey = process.env.OPENWEATHER_API_KEY || 'demo';

    if (apiKey === 'demo') {
      // Mock response for demonstration
      return NextResponse.json({
        temperature: Math.floor(Math.random() * 15) + 18, // Random temp between 18-32°C
        city: city
      });
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},BR&units=metric&appid=${apiKey}&lang=pt_br`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const data = await response.json();

    return NextResponse.json({
      temperature: Math.round(data.main.temp),
      city: data.name
    });
  } catch (error) {
    console.error('Weather API error:', error);
    // Return mock data as fallback
    return NextResponse.json({
      temperature: 22,
      city: city
    });
  }
}
