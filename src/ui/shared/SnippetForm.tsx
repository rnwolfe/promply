import { useState, useEffect } from 'preact/hooks';
import { Snippet } from '~/storage';

interface SnippetFormProps {
  onAdd?: (snippet: Omit<Snippet, 'id'>) => Promise<void>;
  onUpdate?: (snippet: Snippet) => Promise<void>;
  editingSnippet?: Snippet | null;
  compact?: boolean;
  className?: string;
}

export function SnippetForm({ onAdd, onUpdate, editingSnippet, compact = false, className = '' }: SnippetFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!editingSnippet;

  // Update form state when editingSnippet changes
  useEffect(() => {
    if (editingSnippet) {
      setTitle(editingSnippet.title);
      setBody(editingSnippet.body);
    } else {
      setTitle('');
      setBody('');
    }
  }, [editingSnippet]);

  const handleSubmit = async (e?: Event) => {
    e?.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setIsSubmitting(true);
    try {
      if (isEditing && editingSnippet && onUpdate) {
        await onUpdate({ 
          ...editingSnippet, 
          title: title.trim(), 
          body: body.trim() 
        });
      } else if (!isEditing && onAdd) {
        await onAdd({ title: title.trim(), body: body.trim() });
      }
      
      // Only clear form if we're adding (not editing)
      if (!isEditing) {
        setTitle('');
        setBody('');
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