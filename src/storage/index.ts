export interface SnippetVariable {
  name: string;
  description?: string;
  defaultValue?: string;
}

export interface Snippet {
  id: string;
  title: string;
  body: string;
  tags?: string[];
  shortcut?: string;
  folder?: string;
  variables?: SnippetVariable[];
}

export interface SnippetStore {
  getSnippets: () => Promise<Snippet[]>;
  addSnippet: (snippet: Omit<Snippet, 'id'>) => Promise<Snippet>;
  updateSnippet: (snippet: Snippet) => Promise<Snippet>;
  deleteSnippet: (id: string) => Promise<void>;
}

export interface Settings {
  activatorKey: string;
}

export interface SettingsStore {
  getSettings: () => Promise<Settings>;
  updateSettings: (settings: Partial<Settings>) => Promise<Settings>;
}
