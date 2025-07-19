import { useState, useEffect } from 'preact/hooks';
import { Snippet, SnippetVariable } from '~/storage';
import { FolderCombobox } from './FolderCombobox';
import { VariableList } from './VariableList';

interface SnippetFormProps {
  onAdd?: (snippet: Omit<Snippet, 'id'>) => Promise<void>;
  onUpdate?: (snippet: Snippet) => Promise<void>;
  editingSnippet?: Snippet | null;
  compact?: boolean;
  className?: string;
  availableFolders?: string[];
}

export function SnippetForm({ onAdd, onUpdate, editingSnippet, compact = false, className = '', availableFolders = [] }: SnippetFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [folder, setFolder] = useState('');
  const [variables, setVariables] = useState<SnippetVariable[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!editingSnippet;

  // Update form state when editingSnippet changes
  useEffect(() => {
    if (editingSnippet) {
      setTitle(editingSnippet.title);
      setBody(editingSnippet.body);
      setFolder(editingSnippet.folder || '');
      setVariables(editingSnippet.variables || []);
    } else {
      setTitle('');
      setBody('');
      setFolder('');
      setVariables([]);
    }
  }, [editingSnippet]);

  const handleSubmit = async (e?: Event) => {
    e?.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setIsSubmitting(true);
    try {
      const snippetData = { 
        title: title.trim(), 
        body: body.trim(),
        folder: folder.trim() || undefined,
        variables: variables.length > 0 ? variables : undefined
      };

      if (isEditing && editingSnippet && onUpdate) {
        await onUpdate({ 
          ...editingSnippet, 
          ...snippetData
        });
      } else if (!isEditing && onAdd) {
        await onAdd(snippetData);
      }
      
      // Only clear form if we're adding (not editing)
      if (!isEditing) {
        setTitle('');
        setBody('');
        setFolder('');
        setVariables([]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`snippet-form ${compact ? 'compact' : ''} ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            placeholder="Enter title..."
            value={title}
            onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
            className="form-input"
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="folder">Folder (optional)</label>
          <FolderCombobox
            value={folder}
            onChange={setFolder}
            availableFolders={availableFolders}
            placeholder="Enter folder name..."
            disabled={isSubmitting}
            className=""
          />
        </div>
        <div className="form-group">
          <label htmlFor="body">Content</label>
          <textarea
            id="body"
            placeholder="Enter your prompt... Use {{variableName}} for dynamic content."
            value={body}
            onInput={(e) => setBody((e.target as HTMLTextAreaElement).value)}
            className="form-textarea"
            rows={compact ? 3 : 4}
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <VariableList
            variables={variables}
            onChange={setVariables}
            disabled={isSubmitting}
            className=""
          />
        </div>
        <button 
          type="submit"
          className={`add-button ${isSubmitting ? 'loading' : ''}`}
          disabled={!title.trim() || !body.trim() || isSubmitting}
        >
          <span className="button-icon">
            {isSubmitting ? '⏳' : isEditing ? '💾' : '✅'}
          </span>
          {isSubmitting 
            ? (isEditing ? 'Updating...' : 'Adding...') 
            : (isEditing ? 'Update Snippet' : 'Add Snippet')
          }
        </button>
      </form>
    </div>
  );
}