import { vane } from '@/nimi/client';
export const getSuggestions = (chatHistory: [string, string][]) =>
  vane.suggestions(chatHistory);

export const getApproxLocation = async () => {
  const res = await fetch('https://free.freeipapi.com/api/json', {
    method: 'GET',
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok)
    throw new Error('The approximate location service is unavailable.');
  const data = await res.json();

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    city: data.cityName,
  };
};
