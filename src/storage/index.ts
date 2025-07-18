export interface Snippet {
  id: string;
  title: string;
  body: string;
  tags?: string[];
  shortcut?: string;
  folder?: string;
}

export interface SnippetStore {
  getSnippets: () => Promise<Snippet[]>;
  addSnippet: (snippet: Omit<Snippet, 'id'>) => Promise<Snippet>;
  updateSnippet: (snippet: Snippet) => Promise<Snippet>;
  deleteSnippet: (id: string) => Promise<void>;
}
