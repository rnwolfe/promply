import { Snippet, SnippetStore, Settings, SettingsStore, ImportOptions, ImportResult } from '.';

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

  async exportSnippets(): Promise<string> {
    try {
      if (!isExtensionContextValid()) {
        throw new Error(
          'Extension context invalidated - cannot access storage',
        );
      }
      const snippets = await this.getSnippets();
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        snippets: snippets,
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export snippets:', error);
      throw error;
    }
  }

  async importSnippets(jsonData: string, options: ImportOptions = { merge: true }): Promise<ImportResult> {
    try {
      if (!isExtensionContextValid()) {
        throw new Error(
          'Extension context invalidated - cannot access storage',
        );
      }

      const result: ImportResult = {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [],
      };

      // Parse JSON data
      let importData: any;
      try {
        importData = JSON.parse(jsonData);
      } catch (parseError) {
        result.errors.push('Invalid JSON format');
        return result;
      }

      // Validate import data structure
      if (!importData.snippets || !Array.isArray(importData.snippets)) {
        result.errors.push('Invalid data format: snippets array not found');
        return result;
      }

      const importSnippets = importData.snippets;
      const existingSnippets = options.merge ? await this.getSnippets() : [];
      const existingTitles = new Set(existingSnippets.map(s => s.title.toLowerCase()));

      // Process each snippet
      const validSnippets: Snippet[] = [];
      for (const snippet of importSnippets) {
        // Validate required fields
        if (!snippet.title || !snippet.body) {
          result.errors.push(`Snippet missing required fields: ${snippet.title || 'untitled'}`);
          continue;
        }

        // Check for duplicates when merging
        if (options.merge && existingTitles.has(snippet.title.toLowerCase())) {
          result.skipped++;
          continue;
        }

        // Create new snippet with new ID
        const newSnippet: Snippet = {
          id: crypto.randomUUID(),
          title: snippet.title,
          body: snippet.body,
          tags: snippet.tags || [],
          shortcut: snippet.shortcut,
          folder: snippet.folder,
          variables: snippet.variables || [],
        };

        validSnippets.push(newSnippet);
        result.imported++;
      }

      // Save snippets
      const finalSnippets = options.merge ? [...existingSnippets, ...validSnippets] : validSnippets;
      await chrome.storage.local.set({ [SNIPPETS_KEY]: finalSnippets });

      result.success = true;
      return result;
    } catch (error) {
      console.error('Failed to import snippets:', error);
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      };
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
