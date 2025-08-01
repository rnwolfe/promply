import { useEffect, useState } from 'preact/hooks';
import { Snippet, Settings } from '~/storage';
import { LocalSnippetStore, LocalSettingsStore } from '~/storage/local';

const store = new LocalSnippetStore();
const settingsStore = new LocalSettingsStore();

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSnippets = async () => {
    try {
      const loadedSnippets = await store.getSnippets();
      setSnippets(loadedSnippets);
    } catch (error) {
      console.error('Failed to load snippets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnippets();
  }, []);

  const addSnippet = async (snippet: Omit<Snippet, 'id'>) => {
    try {
      await store.addSnippet(snippet);
      await loadSnippets();
    } catch (error) {
      console.error('Failed to add snippet:', error);
    }
  };

  const deleteSnippet = async (id: string) => {
    try {
      await store.deleteSnippet(id);
      await loadSnippets();
    } catch (error) {
      console.error('Failed to delete snippet:', error);
    }
  };

  const updateSnippet = async (snippet: Snippet) => {
    try {
      await store.updateSnippet(snippet);
      await loadSnippets();
    } catch (error) {
      console.error('Failed to update snippet:', error);
    }
  };

  return {
    snippets,
    loading,
    addSnippet,
    deleteSnippet,
    updateSnippet,
    refresh: loadSnippets
  };
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({ activatorKey: '/' });
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const loadedSettings = await settingsStore.getSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSettings = async (settingsUpdate: Partial<Settings>) => {
    try {
      const newSettings = await settingsStore.updateSettings(settingsUpdate);
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  return {
    settings,
    loading,
    updateSettings,
    refresh: loadSettings
  };
}