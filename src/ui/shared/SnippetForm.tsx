import { useState, useEffect } from 'preact/hooks';
import { Snippet } from '~/storage';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!editingSnippet;

  // Update form state when editingSnippet changes
  useEffect(() => {
    if (editingSnippet) {
      setTitle(editingSnippet.title);
      setBody(editingSnippet.body);
      setFolder(editingSnippet.folder || '');
    } else {
      setTitle('');
      setBody('');
      setFolder('');
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
        folder: folder.trim() || undefined
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
          <input
            id="folder"
            type="text"
            placeholder="Enter folder name..."
            value={folder}
            onInput={(e) => setFolder((e.target as HTMLInputElement).value)}
            className="form-input"
            disabled={isSubmitting}
            list="available-folders"
          />
          {availableFolders.length > 0 && (
            <datalist id="available-folders">
              {availableFolders.map(folderName => (
                <option key={folderName} value={folderName} />
              ))}
            </datalist>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="body">Content</label>
          <textarea
            id="body"
            placeholder="Enter your prompt..."
            value={body}
            onInput={(e) => setBody((e.target as HTMLTextAreaElement).value)}
            className="form-textarea"
            rows={compact ? 3 : 4}
            disabled={isSubmitting}
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