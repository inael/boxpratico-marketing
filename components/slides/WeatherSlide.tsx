'use client';

import { useState, useEffect } from 'react';
import { MediaItem } from '@/types';

interface WeatherData {
  city: string;
  temp: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  description: string;
  icon: string;
  wind: number;
}

interface WeatherSlideProps {
  item: MediaItem;
  city?: string;
  onTimeUpdate?: (time: number) => void;
}

// Mapear ícones de clima para emojis
const WEATHER_ICONS: Record<string, string> = {
  '01d': '☀️',
  '01n': '🌙',
  '02d': '⛅',
  '02n': '☁️',
  '03d': '☁️',
  '03n': '☁️',
  '04d': '☁️',
  '04n': '☁️',
  '09d': '🌧️',
  '09n': '🌧️',
  '10d': '🌦️',
  '10n': '🌧️',
  '11d': '⛈️',
  '11n': '⛈️',
  '13d': '❄️',
  '13n': '❄️',
  '50d': '🌫️',
  '50n': '🌫️',
};

export default function WeatherSlide({ item, city, onTimeUpdate }: WeatherSlideProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(item.durationSeconds || 15);

  // Extrair configurações
  let config = {
    title: 'Previsão do Tempo',
    city: city || 'São Paulo',
    bgGradient: 'from-blue-600 to-blue-900',
    textColor: '#ffffff',
    accentColor: '#F59E0B',
  };

  try {
    if (item.sourceUrl && item.sourceUrl.startsWith('{')) {
      const parsed = JSON.parse(item.sourceUrl);
      config = { ...config, ...parsed };
    }
  } catch (e) {
    // Usar configuração padrão
  }

  // Buscar previsão do tempo
  useEffect(() => {
    async function fetchWeather() {
      try {
        // Usar API interna ou OpenWeatherMap
        const response = await fetch(`/api/weather?city=${encodeURIComponent(config.city)}&full=true`);
        const data = await response.json();

        if (data.temperature !== undefined) {
          setWeather({
            city: config.city,
            temp: data.temperature,
            tempMin: data.tempMin || data.temperature - 3,
            tempMax: data.tempMax || data.temperature + 3,
            humidity: data.humidity || 65,
            description: data.description || 'Parcialmente nublado',
            icon: data.icon || '02d',
            wind: data.wind || 10,
          });
        }
      } catch (error) {
        console.error('Erro ao buscar clima:', error);
        // Dados mock para fallback
        setWeather({
          city: config.city,
          temp: 25,
          tempMin: 18,
          tempMax: 32,
          humidity: 65,
          description: 'Parcialmente nublado',
          icon: '02d',
          wind: 12,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
    // Atualizar a cada 30 minutos
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [config.city]);

  // Countdown
  useEffect(() => {
    const duration = item.durationSeconds || 15;
    setCountdown(duration);

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        const newValue = prev - 1;
        if (onTimeUpdate) {
          onTimeUpdate(Math.max(0, newValue));
        }
        return Math.max(0, newValue);
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [item.durationSeconds, onTimeUpdate]);

  const getWeatherEmoji = (icon: string) => {
    return WEATHER_ICONS[icon] || '🌤️';
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className={`w-full h-screen flex flex-col bg-gradient-to-br ${config.bgGradient} p-12`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt="" className="h-16 object-contain" />
          ) : (
            <h1 className="text-4xl font-bold text-white opacity-80">
              {config.title}
            </h1>
          )}
        </div>
        <div className="text-right text-white/60">
          <p className="text-2xl font-light">{getTimeOfDay()}</p>
          <p className="text-lg">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-4xl text-white animate-pulse">
            Carregando previsão...
          </div>
        </div>
      ) : weather && (
        <div className="flex-1 flex flex-col justify-center">
          {/* Cidade */}
          <div className="text-center mb-8">
            <h2 className="text-6xl font-bold text-white">
              📍 {weather.city}
            </h2>
          </div>

          {/* Temperatura principal */}
          <div className="flex items-center justify-center gap-8 mb-12">
            <div className="text-[200px] leading-none">
              {getWeatherEmoji(weather.icon)}
            </div>
            <div className="text-center">
              <p className="text-[200px] font-bold text-white leading-none">
                {Math.round(weather.temp)}°
              </p>
              <p className="text-4xl text-white/70 capitalize mt-4">
                {weather.description}
              </p>
            </div>
          </div>

          {/* Detalhes */}
          <div className="grid grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
              <p className="text-5xl mb-2">🌡️</p>
              <p className="text-2xl font-bold text-white">
                {weather.tempMin}° / {weather.tempMax}°
              </p>
              <p className="text-white/60">Mín / Máx</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
              <p className="text-5xl mb-2">💧</p>
              <p className="text-2xl font-bold text-white">
                {weather.humidity}%
              </p>
              <p className="text-white/60">Umidade</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
              <p className="text-5xl mb-2">💨</p>
              <p className="text-2xl font-bold text-white">
                {weather.wind} km/h
              </p>
              <p className="text-white/60">Vento</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
              <p className="text-5xl mb-2">⏰</p>
              <p className="text-2xl font-bold text-white">
                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-white/60">Agora</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
