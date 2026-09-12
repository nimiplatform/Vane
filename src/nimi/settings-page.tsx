import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ModelConfigAIConfigSurface } from '@nimiplatform/kit/features/model-config';
import type { NimiAIConfigSnapshot } from '@nimiplatform/sdk/ai';
import { vane } from './client';
import { APP_ID } from './constants';
import { defaultSettings, type VaneSettings } from './contracts';
import { setClientSettings } from '../lib/config/clientRegistry';

const field =
  'w-full rounded-lg border border-light-200 dark:border-dark-200 bg-light-primary dark:bg-dark-primary px-3 py-2 text-sm';
export default function SettingsPage() {
  const [params] = useSearchParams();
  const [section, setSection] = useState(params.get('section') ?? 'search');
  const [settings, setSettings] = useState<VaneSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [ai, setAI] = useState<NimiAIConfigSnapshot>();
  const [aiError, setAIError] = useState<string | null>(null);
  const [aiLoading, setAILoading] = useState(false);
  const refreshAI = async () => {
    setAILoading(true);
    setAIError(null);
    try {
      setAI(await vane.aiConfig.get());
    } catch (error) {
      setAIError(error instanceof Error ? error.message : String(error));
    } finally {
      setAILoading(false);
    }
  };
  useEffect(() => {
    void vane.settings
      .get()
      .then((value) => {
        setSettings(value);
        setClientSettings(value);
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
    void refreshAI();
  }, []);
  const save = async () => {
    setBusy(true);
    setMessage('');
    try {
      const saved = await vane.settings.save(settings);
      setSettings(saved);
      setClientSettings(saved);
      setMessage('Settings saved for your current Nimi account.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-black/80 dark:text-white/80">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div
        className="my-5 flex gap-2"
        role="tablist"
        aria-label="Settings sections"
      >
        {[
          ['search', 'Search'],
          ['ai', 'AI models'],
          ['preferences', 'Preferences'],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={section === id}
            onClick={() => setSection(id)}
            className={`rounded-lg px-4 py-2 text-sm ${section === id ? 'bg-light-200 dark:bg-dark-200' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
      {section === 'ai' ? (
        <>
          <p className="mb-4 text-sm">
            Vane uses Nimi for text, tool calls, structured replies and document
            embeddings. Choose a text configuration with tools and structured
            output enabled in Nimi.
          </p>
          <ModelConfigAIConfigSurface
            context={{ owner: 'app-ai-config', appId: APP_ID }}
            capabilityContracts={['text.generate', 'text.embed']}
            capabilities={ai?.config?.capabilities ?? (ai ? null : undefined)}
            revision={ai?.revision}
            effectiveSelections={ai?.effectiveSelections}
            loading={aiLoading}
            loadError={aiError}
            onRetry={() => void refreshAI()}
            listOptions={(input) => vane.aiConfig.listOptions(input)}
            onOverwrite={async (input) => {
              const result = await vane.aiConfig.overwrite(input);
              await refreshAI();
              return result;
            }}
            language="en"
          />
        </>
      ) : loading ? (
        <p>Loading settings…</p>
      ) : (
        <div className="space-y-5">
          {section === 'search' ? (
            <>
              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  htmlFor="searxng-url"
                >
                  SearxNG service address
                </label>
                <input
                  id="searxng-url"
                  type="url"
                  className={field}
                  placeholder="https://search.example.com"
                  value={settings.searxngURL}
                  onChange={(event) =>
                    setSettings({ ...settings, searxngURL: event.target.value })
                  }
                />
                <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                  Use a SearxNG service that accepts JSON searches. Vane
                  remembers this address for the current Nimi account. No local
                  configuration file is needed.
                </p>
              </div>
              <button
                disabled={busy || !settings.searxngURL}
                className="rounded-lg border border-light-200 dark:border-dark-200 px-4 py-2 text-sm disabled:opacity-50"
                onClick={async () => {
                  setBusy(true);
                  setMessage('Testing the search service…');
                  try {
                    const result = await vane.settings.testSearch(
                      settings.searxngURL,
                    );
                    setMessage(
                      `Connected. The service returned ${result.resultCount} results for the test query.`,
                    );
                  } catch (error) {
                    setMessage(
                      error instanceof Error ? error.message : String(error),
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Test connection
              </button>
            </>
          ) : (
            <>
              <label className="block text-sm">
                Response instructions
                <textarea
                  rows={5}
                  className={`${field} mt-2`}
                  value={settings.systemInstructions}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      systemInstructions: event.target.value,
                    })
                  }
                />
              </label>
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.showWeatherWidget}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      showWeatherWidget: event.target.checked,
                    })
                  }
                />{' '}
                Show weather on the home page
              </label>
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.showNewsWidget}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      showNewsWidget: event.target.checked,
                    })
                  }
                />{' '}
                Show news on the home page
              </label>
              <label className="block text-sm">
                Weather units
                <select
                  className={`${field} mt-2`}
                  value={settings.measurementUnit}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      measurementUnit: event.target.value as
                        'metric' | 'imperial',
                    })
                  }
                >
                  <option value="metric">Metric</option>
                  <option value="imperial">Imperial</option>
                </select>
              </label>
            </>
          )}
          <div>
            <button
              disabled={busy}
              onClick={() => void save()}
              className="rounded-lg bg-[#24A0ED] px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {busy ? 'Working…' : 'Save settings'}
            </button>
          </div>
          {message && (
            <p role="status" className="text-sm">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
