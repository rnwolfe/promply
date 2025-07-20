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
  exportSnippets: () => Promise<string>;
  importSnippets: (jsonData: string, options?: ImportOptions) => Promise<ImportResult>;
}

export interface ImportOptions {
  merge?: boolean; // true = merge with existing, false = replace all
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface Settings {
  activatorKey: string;
}

export interface SettingsStore {
  getSettings: () => Promise<Settings>;
  updateSettings: (settings: Partial<Settings>) => Promise<Settings>;
}
