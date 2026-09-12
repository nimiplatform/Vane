import { vane } from '@/nimi/client';
import { getMeasurementUnit } from '@/lib/config/clientRegistry';
('use client');

import { Wind } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getApproxLocation } from '@/lib/actions';

const WeatherWidget = () => {
  const [data, setData] = useState({
    temperature: 0,
    condition: '',
    location: '',
    humidity: 0,
    windSpeed: 0,
    icon: '',
    temperatureUnit: 'C',
    windSpeedUnit: 'm/s',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getLocation = async () => {
    if (navigator.geolocation) {
      const permission = await navigator.permissions.query({
        name: 'geolocation',
      });
      if (permission.state === 'granted') {
        const position = await new Promise<GeolocationPosition | null>(
          (resolve) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              () => resolve(null),
              {
                timeout: 5000,
                maximumAge: 300000,
              },
            );
          },
        );
        if (position) {
          const response = await fetch(
            `https://api-bdc.io/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`,
            { signal: AbortSignal.timeout(10000) },
          );
          if (!response.ok)
            throw new Error('The location service is unavailable.');
          const place = await response.json();
          return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city: place.locality,
          };
        }
      }
    }
    return getApproxLocation();
  };

  const updateWeather = async () => {
    try {
      const location = await getLocation();
      const value = await vane.weather({
        lat: location.latitude,
        lng: location.longitude,
        measureUnit:
          getMeasurementUnit() === 'imperial' ? 'Imperial' : 'Metric',
      });
      setData({ ...value, location: location.city });
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateWeather();
    const intervalId = setInterval(updateWeather, 30 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-light-secondary dark:bg-dark-secondary rounded-2xl border border-light-200 dark:border-dark-200 shadow-sm shadow-light-200/10 dark:shadow-black/25 flex flex-row items-center w-full h-24 min-h-[96px] max-h-[96px] px-3 py-2 gap-3">
      {loading ? (
        <>
          <div className="flex flex-col items-center justify-center w-16 min-w-16 max-w-16 h-full animate-pulse">
            <div className="h-10 w-10 rounded-full bg-light-200 dark:bg-dark-200 mb-2" />
            <div className="h-4 w-10 rounded bg-light-200 dark:bg-dark-200" />
          </div>
          <div className="flex flex-col justify-between flex-1 h-full py-1 animate-pulse">
            <div className="flex flex-row items-center justify-between">
              <div className="h-3 w-20 rounded bg-light-200 dark:bg-dark-200" />
              <div className="h-3 w-12 rounded bg-light-200 dark:bg-dark-200" />
            </div>
            <div className="h-3 w-16 rounded bg-light-200 dark:bg-dark-200 mt-1" />
            <div className="flex flex-row justify-between w-full mt-auto pt-1 border-t border-light-200 dark:border-dark-200">
              <div className="h-3 w-16 rounded bg-light-200 dark:bg-dark-200" />
              <div className="h-3 w-8 rounded bg-light-200 dark:bg-dark-200" />
            </div>
          </div>
        </>
      ) : error ? (
        <div className="text-xs">
          <p className="text-red-400">Weather unavailable: {error}</p>
          <button
            type="button"
            className="mt-1 text-sky-500"
            onClick={() => {
              setLoading(true);
              void updateWeather();
            }}
          >
            Retry weather
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center justify-center w-16 min-w-16 max-w-16 h-full">
            <img
              src={`${import.meta.env.BASE_URL}weather-ico/${data.icon}.svg`}
              alt={data.condition}
              className="h-10 w-auto"
            />
            <span className="text-base font-semibold text-black dark:text-white">
              {data.temperature}°{data.temperatureUnit}
            </span>
          </div>
          <div className="flex flex-col justify-between flex-1 h-full py-2">
            <div className="flex flex-row items-center justify-between">
              <span className="text-sm font-semibold text-black dark:text-white">
                {data.location}
              </span>
              <span className="flex items-center text-xs text-black/60 dark:text-white/60 font-medium">
                <Wind className="w-3 h-3 mr-1" />
                {data.windSpeed} {data.windSpeedUnit}
              </span>
            </div>
            <span className="text-xs text-black/50 dark:text-white/50 italic">
              {data.condition}
            </span>
            <div className="flex flex-row justify-between w-full mt-auto pt-2 border-t border-light-200/50 dark:border-dark-200/50 text-xs text-black/50 dark:text-white/50 font-medium">
              <span>Humidity {data.humidity}%</span>
              <span className="font-semibold text-black/70 dark:text-white/70">
                Now
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeatherWidget;
