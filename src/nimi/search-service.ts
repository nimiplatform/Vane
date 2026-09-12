import { searchSearxng } from '../lib/searxng';
import { fetchForVane } from './http';

const websitesForTopic = {
  tech: {
    query: 'technology news',
    links: ['techcrunch.com', 'wired.com', 'theverge.com'],
  },
  finance: {
    query: 'finance news',
    links: ['bloomberg.com', 'cnbc.com', 'marketwatch.com'],
  },
  art: {
    query: 'art news',
    links: ['artnews.com', 'hyperallergic.com', 'theartnewspaper.com'],
  },
  sports: {
    query: 'sports news',
    links: ['espn.com', 'bbc.com/sport', 'skysports.com'],
  },
  entertainment: {
    query: 'entertainment news',
    links: ['hollywoodreporter.com', 'variety.com', 'deadline.com'],
  },
};

type Topic = keyof typeof websitesForTopic;

export async function discover(topic: Topic, preview: boolean) {
  const selectedTopic = websitesForTopic[topic];

  let data = [];

  if (!preview) {
    const seenUrls = new Set();

    data = (
      await Promise.all(
        selectedTopic.links.map(
          async (link) =>
            (
              await searchSearxng(`site:${link} ${selectedTopic.query}`, {
                categories: ['news'],
                pageno: 1,
                language: 'en',
              })
            ).results,
        ),
      )
    )
      .flat()
      .filter((item) => {
        const url = item.url?.toLowerCase().trim();
        if (seenUrls.has(url)) return false;
        seenUrls.add(url);
        return true;
      })
      .sort(() => Math.random() - 0.5);
  } else {
    data = (
      await searchSearxng(
        `site:${selectedTopic.links[Math.floor(Math.random() * selectedTopic.links.length)]} ${selectedTopic.query}`,
        {
          categories: ['news'],
          pageno: 1,
          language: 'en',
        },
      )
    ).results;
  }

  // Some configured engines ignore site: syntax; keep the intended publishers.
  return data.filter((item) => {
    const url = new URL(item.url);
    return selectedTopic.links.some((site) => {
      const publisher = new URL(`https://${site}`);
      return (
        (url.hostname === publisher.hostname ||
          url.hostname.endsWith(`.${publisher.hostname}`)) &&
        url.pathname.startsWith(publisher.pathname)
      );
    });
  });
}

export async function homeWeather(body: {
  lat: number;
  lng: number;
  measureUnit: 'Metric' | 'Imperial';
}) {
  const res = await fetchForVane(
    `https://api.open-meteo.com/v1/forecast?latitude=${body.lat}&longitude=${body.lng}&current=weather_code,temperature_2m,is_day,relative_humidity_2m,wind_speed_10m&timezone=auto${
      body.measureUnit === 'Metric' ? '' : '&temperature_unit=fahrenheit'
    }${body.measureUnit === 'Metric' ? '' : '&wind_speed_unit=mph'}`,
  );

  const data = await res.json();
  if (data.error) throw new Error(String(data.reason));
  const weather: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    icon: string;
    temperatureUnit: 'C' | 'F';
    windSpeedUnit: string;
  } = {
    temperature: data.current.temperature_2m,
    condition: '',
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    icon: '',
    temperatureUnit: body.measureUnit === 'Metric' ? 'C' : 'F',
    windSpeedUnit: data.current_units.wind_speed_10m,
  };

  const code = data.current.weather_code;
  const isDay = data.current.is_day === 1;
  const dayOrNight = isDay ? 'day' : 'night';

  switch (code) {
    case 0:
      weather.icon = `clear-${dayOrNight}`;
      weather.condition = 'Clear';
      break;

    case 1:
      weather.icon = `cloudy-1-${dayOrNight}`;
      weather.condition = 'Mainly Clear';
      break;
    case 2:
      weather.icon = `cloudy-1-${dayOrNight}`;
      weather.condition = 'Partly Cloudy';
      break;
    case 3:
      weather.icon = `cloudy-1-${dayOrNight}`;
      weather.condition = 'Cloudy';
      break;

    case 45:
      weather.icon = `fog-${dayOrNight}`;
      weather.condition = 'Fog';
      break;
    case 48:
      weather.icon = `fog-${dayOrNight}`;
      weather.condition = 'Fog';
      break;

    case 51:
      weather.icon = `rainy-1-${dayOrNight}`;
      weather.condition = 'Light Drizzle';
      break;
    case 53:
      weather.icon = `rainy-1-${dayOrNight}`;
      weather.condition = 'Moderate Drizzle';
      break;
    case 55:
      weather.icon = `rainy-1-${dayOrNight}`;
      weather.condition = 'Dense Drizzle';
      break;

    case 56:
      weather.icon = `frost-${dayOrNight}`;
      weather.condition = 'Light Freezing Drizzle';
      break;
    case 57:
      weather.icon = `frost-${dayOrNight}`;
      weather.condition = 'Dense Freezing Drizzle';
      break;

    case 61:
      weather.icon = `rainy-2-${dayOrNight}`;
      weather.condition = 'Slight Rain';
      break;
    case 63:
      weather.icon = `rainy-2-${dayOrNight}`;
      weather.condition = 'Moderate Rain';
      break;
    case 65:
      weather.condition = 'Heavy Rain';
      weather.icon = `rainy-2-${dayOrNight}`;
      break;

    case 66:
      weather.icon = 'rain-and-sleet-mix';
      weather.condition = 'Light Freezing Rain';
      break;
    case 67:
      weather.condition = 'Heavy Freezing Rain';
      weather.icon = 'rain-and-sleet-mix';
      break;

    case 71:
      weather.icon = `snowy-2-${dayOrNight}`;
      weather.condition = 'Slight Snow Fall';
      break;
    case 73:
      weather.icon = `snowy-2-${dayOrNight}`;
      weather.condition = 'Moderate Snow Fall';
      break;
    case 75:
      weather.condition = 'Heavy Snow Fall';
      weather.icon = `snowy-2-${dayOrNight}`;
      break;

    case 77:
      weather.condition = 'Snow';
      weather.icon = `snowy-1-${dayOrNight}`;
      break;

    case 80:
      weather.icon = `rainy-3-${dayOrNight}`;
      weather.condition = 'Slight Rain Showers';
      break;
    case 81:
      weather.icon = `rainy-3-${dayOrNight}`;
      weather.condition = 'Moderate Rain Showers';
      break;
    case 82:
      weather.condition = 'Heavy Rain Showers';
      weather.icon = `rainy-3-${dayOrNight}`;
      break;

    case 85:
      weather.icon = `snowy-3-${dayOrNight}`;
      weather.condition = 'Slight Snow Showers';
      break;
    case 86:
      weather.icon = `snowy-3-${dayOrNight}`;
      weather.condition = 'Moderate Snow Showers';
      break;
    case 87:
      weather.condition = 'Heavy Snow Showers';
      weather.icon = `snowy-3-${dayOrNight}`;
      break;

    case 95:
      weather.condition = 'Thunderstorm';
      weather.icon = `scattered-thunderstorms-${dayOrNight}`;
      break;

    case 96:
      weather.icon = 'severe-thunderstorm';
      weather.condition = 'Thunderstorm with Slight Hail';
      break;
    case 99:
      weather.condition = 'Thunderstorm with Heavy Hail';
      weather.icon = 'severe-thunderstorm';
      break;

    default:
      weather.icon = `clear-${dayOrNight}`;
      weather.condition = 'Clear';
      break;
  }

  return weather;
}

export async function testSearchService(value: string) {
  const base = new URL(value);
  if (
    !['http:', 'https:'].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.hash ||
    base.search
  )
    throw new Error('Enter a SearxNG HTTP or HTTPS base address.');
  const url = new URL(base.toString().replace(/\/$/, '') + '/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', 'SearxNG');
  const response = await fetchForVane(url);
  const data = await response.json();
  if (!Array.isArray(data.results))
    throw new Error('This address did not return SearxNG JSON search results.');
  return { resultCount: data.results.length };
}
