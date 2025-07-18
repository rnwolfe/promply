import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalSnippetStore } from '~/storage/local';

describe('LocalSnippetStore', () => {
  let store: LocalSnippetStore;

  beforeEach(() => {
    store = new LocalSnippetStore();
    // Reset mocks before each test
    vi.clearAllMocks();
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
});
