import { defaultSettings, type VaneSettings } from '@/nimi/contracts';
let current = { ...defaultSettings };
export const setClientSettings = (settings: VaneSettings) => { current = { ...settings }; };
export const getTheme = () => localStorage.getItem('theme') ?? 'dark';
export const getAutoMediaSearch = () => current.autoMediaSearch;
export const getSystemInstructions = () => current.systemInstructions;
export const getShowWeatherWidget = () => current.showWeatherWidget;
export const getShowNewsWidget = () => current.showNewsWidget && Boolean(current.searxngURL);
export const getMeasurementUnit = () => current.measurementUnit;
