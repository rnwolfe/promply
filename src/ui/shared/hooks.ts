import { useEffect, useState } from 'preact/hooks';
import { Snippet } from '~/storage';
import { LocalSnippetStore } from '~/storage/local';

const store = new LocalSnippetStore();

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