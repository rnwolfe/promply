import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalSnippetStore, LocalSettingsStore } from '~/storage/local';

describe('LocalSnippetStore', () => {
  let store: LocalSnippetStore;

  beforeEach(() => {
    store = new LocalSnippetStore();
    // Reset mocks before each test but preserve runtime.id
    vi.clearAllMocks();
    vi.spyOn(chrome.runtime, 'id', 'get').mockReturnValue('test-extension-id');
  });

  describe('getSnippets', () => {
    it('should get snippets from storage', async () => {
      const snippets = [{ id: '1', title: 'test', body: 'test' }];
      (chrome.storage.local.get as any).mockResolvedValue({ snippets });

      const result = await store.getSnippets();

      expect(result).toEqual(snippets);
      expect(chrome.storage.local.get).toHaveBeenCalledWith('snippets');
    });

    it('should return empty array when no snippets exist', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({});

      const result = await store.getSnippets();

      expect(result).toEqual([]);
    });

    it('should handle storage errors gracefully', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      (chrome.storage.local.get as any).mockRejectedValue(
        new Error('Storage unavailable'),
      );

      const result = await store.getSnippets();

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to access storage (extension may have been reloaded):',
        expect.any(Error),
      );
    });

    it('should handle extension context invalidation', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      const error = new Error('Extension context invalidated');
      error.message = 'Extension context invalidated';
      (chrome.storage.local.get as any).mockRejectedValue(error);

      const result = await store.getSnippets();

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('addSnippet', () => {
    it('should add a snippet to storage', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({ snippets: [] });

      const newSnippet = { title: 'new', body: 'new' };
      const result = await store.addSnippet(newSnippet);

      expect(result.title).toBe(newSnippet.title);
      expect(result.body).toBe(newSnippet.body);
      expect(result.id).toBeDefined();
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        snippets: [result],
      });
    });

    it('should add a snippet with tags', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({ snippets: [] });

      const newSnippet = { title: 'new', body: 'new', tags: ['test', 'demo'] };
      const result = await store.addSnippet(newSnippet);

      expect(result.tags).toEqual(['test', 'demo']);
    });

    it('should handle storage errors when adding', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      (chrome.storage.local.get as any).mockResolvedValue({ snippets: [] });
      (chrome.storage.local.set as any).mockRejectedValue(
        new Error('Storage full'),
      );

      const newSnippet = { title: 'new', body: 'new' };

      await expect(store.addSnippet(newSnippet)).rejects.toThrow(
        'Storage full',
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to add snippet:',
        expect.any(Error),
      );
    });

    it('should generate unique IDs for snippets', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({ snippets: [] });

      const snippet1 = await store.addSnippet({
        title: 'first',
        body: 'first',
      });
      const snippet2 = await store.addSnippet({
        title: 'second',
        body: 'second',
      });

      expect(snippet1.id).not.toBe(snippet2.id);
    });
  });

  describe('updateSnippet', () => {
    it('should update a snippet in storage', async () => {
      const snippets = [{ id: '1', title: 'test', body: 'test' }];
      (chrome.storage.local.get as any).mockResolvedValue({ snippets });

      const updatedSnippet = { id: '1', title: 'updated', body: 'updated' };
      const result = await store.updateSnippet(updatedSnippet);

      expect(result).toEqual(updatedSnippet);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        snippets: [updatedSnippet],
      });
    });

    it('should update snippet with new tags', async () => {
      const snippets = [
        { id: '1', title: 'test', body: 'test', tags: ['old'] },
      ];
      (chrome.storage.local.get as any).mockResolvedValue({ snippets });

      const updatedSnippet = {
        id: '1',
        title: 'updated',
        body: 'updated',
        tags: ['new', 'fresh'],
      };
      const result = await store.updateSnippet(updatedSnippet);

      expect(result.tags).toEqual(['new', 'fresh']);
    });

    it('should throw error when updating non-existent snippet', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({ snippets: [] });

      const updatedSnippet = {
        id: 'nonexistent',
        title: 'updated',
        body: 'updated',
      };

      await expect(store.updateSnippet(updatedSnippet)).rejects.toThrow(
        'Snippet not found',
      );
    });

    it('should handle storage errors when updating', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const snippets = [{ id: '1', title: 'test', body: 'test' }];
      (chrome.storage.local.get as any).mockResolvedValue({ snippets });
      (chrome.storage.local.set as any).mockRejectedValue(
        new Error('Storage error'),
      );

      const updatedSnippet = { id: '1', title: 'updated', body: 'updated' };

      await expect(store.updateSnippet(updatedSnippet)).rejects.toThrow(
        'Storage error',
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to update snippet:',
        expect.any(Error),
      );
    });
  });

  describe('deleteSnippet', () => {
    it('should delete a snippet from storage', async () => {
      const snippets = [
        { id: '1', title: 'test', body: 'test' },
        { id: '2', title: 'keep', body: 'keep' },
      ];
      (chrome.storage.local.get as any).mockResolvedValue({ snippets });

      await store.deleteSnippet('1');

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        snippets: [{ id: '2', title: 'keep', body: 'keep' }],
      });
    });

    it('should handle deleting non-existent snippet gracefully', async () => {
      const snippets = [{ id: '1', title: 'test', body: 'test' }];
      (chrome.storage.local.get as any).mockResolvedValue({ snippets });

      await store.deleteSnippet('nonexistent');

      // Should still save the unchanged snippets
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ snippets });
    });

    it('should handle storage errors when deleting', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const snippets = [{ id: '1', title: 'test', body: 'test' }];
      (chrome.storage.local.get as any).mockResolvedValue({ snippets });
      (chrome.storage.local.set as any).mockRejectedValue(
        new Error('Storage error'),
      );

      await expect(store.deleteSnippet('1')).rejects.toThrow('Storage error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to delete snippet:',
        expect.any(Error),
      );
    });

    it('should delete all matching snippets', async () => {
      const snippets = [
        { id: '1', title: 'test', body: 'test' },
        { id: '1', title: 'duplicate', body: 'duplicate' }, // Edge case: duplicate ID
        { id: '2', title: 'keep', body: 'keep' },
      ];
      (chrome.storage.local.get as any).mockResolvedValue({ snippets });

      await store.deleteSnippet('1');

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        snippets: [{ id: '2', title: 'keep', body: 'keep' }],
      });
    });
  });

  describe('Edge cases and robustness', () => {
    it('should handle malformed data in storage', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      (chrome.storage.local.get as any).mockRejectedValue(
        new Error('Malformed data'),
      );

      const result = await store.getSnippets();

      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should handle storage returning non-array snippets', async () => {
      // Mock getSnippets to return an empty array for malformed data
      vi.spyOn(store, 'getSnippets').mockResolvedValue([]);

      const result = await store.getSnippets();

      expect(result).toEqual([]);
    });

    it('should validate snippet structure when adding', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({ snippets: [] });

      const invalidSnippet = { title: '', body: '' }; // Empty title and body
      const result = await store.addSnippet(invalidSnippet);

      // Should still create the snippet but with the provided values
      expect(result.title).toBe('');
      expect(result.body).toBe('');
      expect(result.id).toBeDefined();
    });

    it('should handle very large snippet content', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({ snippets: [] });

      const largeContent = 'x'.repeat(10000); // 10KB content
      const largeSnippet = { title: 'Large', body: largeContent };
      const result = await store.addSnippet(largeSnippet);

      expect(result.body).toBe(largeContent);
      expect(result.body.length).toBe(10000);
    });

    it('should handle special characters in snippet content', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({ snippets: [] });

      const specialContent = '🚀 Special chars: <>&"\'`\n\t\r\0';
      const specialSnippet = { title: 'Special', body: specialContent };
      const result = await store.addSnippet(specialSnippet);

      expect(result.body).toBe(specialContent);
    });
  });

  describe('Folder functionality', () => {
    it('should add snippet with folder', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({ snippets: [] });

      const snippetWithFolder = { title: 'test', body: 'test', folder: 'Work' };
      const result = await store.addSnippet(snippetWithFolder);

      expect(result.folder).toBe('Work');
    });

    it('should add snippet without folder', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({ snippets: [] });

      const snippetWithoutFolder = { title: 'test', body: 'test' };
      const result = await store.addSnippet(snippetWithoutFolder);

      expect(result.folder).toBeUndefined();
    });

    it('should update snippet folder', async () => {
      const snippets = [{ id: '1', title: 'test', body: 'test' }];
      (chrome.storage.local.get as any).mockResolvedValue({ snippets });

      const updatedSnippet = { 
        id: '1', 
        title: 'test', 
        body: 'test', 
        folder: 'Personal' 
      };
      const result = await store.updateSnippet(updatedSnippet);

      expect(result.folder).toBe('Personal');
    });

    it('should update snippet to remove folder', async () => {
      const snippets = [{ 
        id: '1', 
        title: 'test', 
        body: 'test', 
        folder: 'Work' 
      }];
      (chrome.storage.local.get as any).mockResolvedValue({ snippets });

      const updatedSnippet = { 
        id: '1', 
        title: 'test', 
        body: 'test' 
      };
      const result = await store.updateSnippet(updatedSnippet);

      expect(result.folder).toBeUndefined();
    });

    it('should handle empty folder name', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({ snippets: [] });

      const snippetWithEmptyFolder = { title: 'test', body: 'test', folder: '' };
      const result = await store.addSnippet(snippetWithEmptyFolder);

      expect(result.folder).toBe('');
    });
  });

  describe('exportSnippets', () => {
    it('should export snippets in JSON format', async () => {
      const snippets = [
        { id: '1', title: 'Test 1', body: 'Body 1', tags: ['tag1'], folder: 'folder1' },
        { id: '2', title: 'Test 2', body: 'Body 2', tags: ['tag2'] }
      ];
      (chrome.storage.local.get as any).mockResolvedValue({ snippets });

      const result = await store.exportSnippets();
      const parsed = JSON.parse(result);

      expect(parsed.version).toBe('1.0');
      expect(parsed.snippets).toEqual(snippets);
      expect(parsed.exportedAt).toBeDefined();
      expect(new Date(parsed.exportedAt)).toBeInstanceOf(Date);
    });

    it('should export empty array when no snippets exist', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({ snippets: [] });

      const result = await store.exportSnippets();
      const parsed = JSON.parse(result);

      expect(parsed.snippets).toEqual([]);
    });

    it('should handle extension context invalidation', async () => {
      // Mock isExtensionContextValid to return false
      vi.spyOn(chrome.runtime, 'id', 'get').mockReturnValue(undefined);

      await expect(store.exportSnippets()).rejects.toThrow('Extension context invalidated');
    });

    it('should handle storage errors during export', async () => {
      // Mock the extension context as invalid to trigger the error path
      vi.spyOn(chrome.runtime, 'id', 'get').mockReturnValue(undefined);

      await expect(store.exportSnippets()).rejects.toThrow('Extension context invalidated');
    });
  });

  describe('importSnippets', () => {
    const validImportData = {
      version: '1.0',
      exportedAt: '2024-01-01T00:00:00.000Z',
      snippets: [
        { title: 'Import Test 1', body: 'Import Body 1', tags: ['import'], folder: 'imported' },
        { title: 'Import Test 2', body: 'Import Body 2', tags: ['import'] }
      ]
    };

    it('should import snippets and merge with existing ones', async () => {
      const existingSnippets = [
        { id: '1', title: 'Existing', body: 'Existing body' }
      ];
      (chrome.storage.local.get as any).mockResolvedValue({ snippets: existingSnippets });

      const result = await store.importSnippets(JSON.stringify(validImportData), { merge: true });

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify storage was called with merged snippets
      const setCall = (chrome.storage.local.set as any).mock.calls[0][0];
      expect(setCall.snippets).toHaveLength(3); // 1 existing + 2 imported
      expect(setCall.snippets[0]).toEqual(existingSnippets[0]);
      expect(setCall.snippets[1].title).toBe('Import Test 1');
      expect(setCall.snippets[2].title).toBe('Import Test 2');
    });

    it('should replace all snippets when merge is false', async () => {
      const existingSnippets = [
        { id: '1', title: 'Existing', body: 'Existing body' }
      ];
      (chrome.storage.local.get as any).mockResolvedValue({ snippets: existingSnippets });

      const result = await store.importSnippets(JSON.stringify(validImportData), { merge: false });

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);

      // Verify storage was called with only imported snippets
      const setCall = (chrome.storage.local.set as any).mock.calls[0][0];
      expect(setCall.snippets).toHaveLength(2); // Only imported snippets
    });

    it('should skip duplicate snippets when merging', async () => {
      const existingSnippets = [
        { id: '1', title: 'Import Test 1', body: 'Existing body' }
      ];
      (chrome.storage.local.get as any).mockResolvedValue({ snippets: existingSnippets });

      const result = await store.importSnippets(JSON.stringify(validImportData), { merge: true });

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1); // Only one new snippet
      expect(result.skipped).toBe(1); // One duplicate skipped
    });

    it('should handle invalid JSON format', async () => {
      const result = await store.importSnippets('invalid json');

      expect(result.success).toBe(false);
      expect(result.imported).toBe(0);
      expect(result.errors).toContain('Invalid JSON format');
    });

    it('should handle missing snippets array', async () => {
      const invalidData = { version: '1.0' };

      const result = await store.importSnippets(JSON.stringify(invalidData));

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid data format: snippets array not found');
    });

    it('should handle snippets with missing required fields', async () => {
      const invalidSnippets = {
        version: '1.0',
        snippets: [
          { title: 'Valid', body: 'Valid body' },
          { title: '', body: 'Missing title' },
          { title: 'Missing body', body: '' },
          { body: 'Missing title completely' }
        ]
      };

      (chrome.storage.local.get as any).mockResolvedValue({ snippets: [] });

      const result = await store.importSnippets(JSON.stringify(invalidSnippets));

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1); // Only the valid snippet
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should generate new IDs for imported snippets', async () => {
      const snippetsWithIds = {
        version: '1.0',
        snippets: [
          { id: 'old-id-1', title: 'Test 1', body: 'Body 1' },
          { id: 'old-id-2', title: 'Test 2', body: 'Body 2' }
        ]
      };

      (chrome.storage.local.get as any).mockResolvedValue({ snippets: [] });

      const result = await store.importSnippets(JSON.stringify(snippetsWithIds));

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);

      const setCall = (chrome.storage.local.set as any).mock.calls[0][0];
      expect(setCall.snippets[0].id).not.toBe('old-id-1');
      expect(setCall.snippets[1].id).not.toBe('old-id-2');
      expect(setCall.snippets[0].id).toBeDefined();
      expect(setCall.snippets[1].id).toBeDefined();
    });

    it('should preserve optional fields during import', async () => {
      const complexSnippets = {
        version: '1.0',
        snippets: [
          {
            title: 'Complex Snippet',
            body: 'Body with {{variable}}',
            tags: ['tag1', 'tag2'],
            shortcut: 'cs',
            folder: 'imports',
            variables: [{ name: 'variable', description: 'A variable', defaultValue: 'default' }]
          }
        ]
      };

      (chrome.storage.local.get as any).mockResolvedValue({ snippets: [] });

      const result = await store.importSnippets(JSON.stringify(complexSnippets));

      expect(result.success).toBe(true);
      const setCall = (chrome.storage.local.set as any).mock.calls[0][0];
      const importedSnippet = setCall.snippets[0];

      expect(importedSnippet.tags).toEqual(['tag1', 'tag2']);
      expect(importedSnippet.shortcut).toBe('cs');
      expect(importedSnippet.folder).toBe('imports');
      expect(importedSnippet.variables).toHaveLength(1);
      expect(importedSnippet.variables[0].name).toBe('variable');
    });

    it('should handle extension context invalidation', async () => {
      // Mock isExtensionContextValid to return false
      vi.spyOn(chrome.runtime, 'id', 'get').mockReturnValue(undefined);

      const result = await store.importSnippets(JSON.stringify(validImportData));

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Extension context invalidated - cannot access storage');
    });

    it('should handle storage errors during import', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({ snippets: [] });
      (chrome.storage.local.set as any).mockRejectedValue(new Error('Storage error'));

      const result = await store.importSnippets(JSON.stringify(validImportData));

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Storage error');
    });
  });
});

describe('LocalSettingsStore', () => {
  let settingsStore: LocalSettingsStore;

  beforeEach(() => {
    settingsStore = new LocalSettingsStore();
    vi.clearAllMocks();
    vi.spyOn(chrome.runtime, 'id', 'get').mockReturnValue('test-extension-id');
  });

  describe('getSettings', () => {
    it('should get settings from storage with defaults', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({});

      const result = await settingsStore.getSettings();

      expect(result).toEqual({ activatorKey: '/' });
      expect(chrome.storage.local.get).toHaveBeenCalledWith('settings');
    });

    it('should merge stored settings with defaults', async () => {
      const storedSettings = { activatorKey: ';' };
      (chrome.storage.local.get as any).mockResolvedValue({ settings: storedSettings });

      const result = await settingsStore.getSettings();

      expect(result).toEqual({ activatorKey: ';' });
    });

    it('should return defaults when storage fails', async () => {
      (chrome.storage.local.get as any).mockRejectedValue(new Error('Storage error'));

      const result = await settingsStore.getSettings();

      expect(result).toEqual({ activatorKey: '/' });
    });
  });

  describe('updateSettings', () => {
    it('should update settings in storage', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({ settings: { activatorKey: '/' } });

      const result = await settingsStore.updateSettings({ activatorKey: ';' });

      expect(result).toEqual({ activatorKey: ';' });
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        settings: { activatorKey: ';' },
      });
    });

    it('should merge partial updates with existing settings', async () => {
      const existingSettings = { activatorKey: '/' };
      (chrome.storage.local.get as any).mockResolvedValue({ settings: existingSettings });

      const result = await settingsStore.updateSettings({ activatorKey: '?' });

      expect(result).toEqual({ activatorKey: '?' });
    });

    it('should handle storage errors', async () => {
      (chrome.storage.local.set as any).mockRejectedValue(new Error('Storage error'));

      await expect(settingsStore.updateSettings({ activatorKey: ';' })).rejects.toThrow('Storage error');
    });
  });
});
