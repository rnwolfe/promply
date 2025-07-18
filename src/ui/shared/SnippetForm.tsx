import { useState } from 'preact/hooks';
import { Snippet } from '~/storage';

interface SnippetFormProps {
  onAdd: (snippet: Omit<Snippet, 'id'>) => Promise<void>;
  compact?: boolean;
  className?: string;
}

export function SnippetForm({ onAdd, compact = false, className = '' }: SnippetFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e?: Event) => {
    e?.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setIsAdding(true);
    try {
      await onAdd({ title: title.trim(), body: body.trim() });
      setTitle('');
      setBody('');
    } finally {
      setIsAdding(false);
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
            disabled={isAdding}
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
            disabled={isAdding}
          />
        </div>
        <button 
          type="submit"
          className={`add-button ${isAdding ? 'loading' : ''}`}
          disabled={!title.trim() || !body.trim() || isAdding}
        >
          <span className="button-icon">
            {isAdding ? '⏳' : '✅'}
          </span>
          {isAdding ? 'Adding...' : 'Add Snippet'}
        </button>
      </form>
    </div>
  );
}