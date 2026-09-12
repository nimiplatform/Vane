import { readSettings } from '../../nimi/storage';

export const getSearxngURL = async () => {
  const settings = await readSettings();
  if (!settings.searxngURL) throw new Error('Open Vane Settings and configure a SearxNG search service.');
  return settings.searxngURL;
};
