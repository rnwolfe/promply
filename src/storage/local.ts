import { Snippet, SnippetStore, Settings, SettingsStore } from '.';

const SNIPPETS_KEY = 'snippets';
const SETTINGS_KEY = 'settings';

const DEFAULT_SETTINGS: Settings = {
  activatorKey: '/',
};

// Function to check if extension context is still valid
function isExtensionContextValid(): boolean {
  try {
    return !!chrome.runtime?.id;
  } catch (error) {
    return false;
  }
}

export class LocalSnippetStore implements SnippetStore {
  async getSnippets(): Promise<Snippet[]> {
    try {
      if (!isExtensionContextValid()) {
        console.warn('Extension context invalidated - cannot access storage');
        return [];
      }
      const result = await chrome.storage.local.get(SNIPPETS_KEY);
      return result[SNIPPETS_KEY] || [];
    } catch (error) {
      console.warn(
        'Failed to access storage (extension may have been reloaded):',
        error,
      );
      return [];
    }
  }

  async addSnippet(snippetData: Omit<Snippet, 'id'>): Promise<Snippet> {
    try {
      if (!isExtensionContextValid()) {
        throw new Error(
          'Extension context invalidated - cannot access storage',
        );
      }
      const snippets = await this.getSnippets();
      const newSnippet: Snippet = {
        ...snippetData,
        id: crypto.randomUUID(),
      };
      await chrome.storage.local.set({
        [SNIPPETS_KEY]: [...snippets, newSnippet],
      });
      return newSnippet;
    } catch (error) {
      console.error('Failed to add snippet:', error);
      throw error;
    }
  }

  async updateSnippet(snippet: Snippet): Promise<Snippet> {
    try {
      if (!isExtensionContextValid()) {
        throw new Error(
          'Extension context invalidated - cannot access storage',
        );
      }
      const snippets = await this.getSnippets();
      const index = snippets.findIndex((s) => s.id === snippet.id);
      if (index === -1) {
        throw new Error('Snippet not found');
      }
      snippets[index] = snippet;
      await chrome.storage.local.set({ [SNIPPETS_KEY]: snippets });
      return snippet;
    } catch (error) {
      console.error('Failed to update snippet:', error);
      throw error;
    }
  }

  async deleteSnippet(id: string): Promise<void> {
    try {
      if (!isExtensionContextValid()) {
        throw new Error(
          'Extension context invalidated - cannot access storage',
        );
      }
      const snippets = await this.getSnippets();
      const newSnippets = snippets.filter((s) => s.id !== id);
      await chrome.storage.local.set({ [SNIPPETS_KEY]: newSnippets });
    } catch (error) {
      console.error('Failed to delete snippet:', error);
      throw error;
    }
  }
}

export class LocalSettingsStore implements SettingsStore {
  async getSettings(): Promise<Settings> {
    try {
      if (!isExtensionContextValid()) {
        console.warn('Extension context invalidated - cannot access storage');
        return DEFAULT_SETTINGS;
      }
      const result = await chrome.storage.local.get(SETTINGS_KEY);
      return { ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] };
    } catch (error) {
      console.warn(
        'Failed to access settings storage (extension may have been reloaded):',
        error,
      );
      return DEFAULT_SETTINGS;
    }
  }

  async updateSettings(settingsUpdate: Partial<Settings>): Promise<Settings> {
    try {
      if (!isExtensionContextValid()) {
        throw new Error(
          'Extension context invalidated - cannot access storage',
        );
      }
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settingsUpdate };
      await chrome.storage.local.set({ [SETTINGS_KEY]: newSettings });
      return newSettings;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }
}
