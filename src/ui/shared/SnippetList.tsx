import { useState } from 'preact/hooks';
import { Snippet } from '~/storage';

interface SnippetListProps {
  snippets: Snippet[];
  onDelete: (id: string) => Promise<void>;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  compact?: boolean;
  className?: string;
}

export function SnippetList({ 
  snippets, 
  onDelete, 
  searchQuery = '', 
  onSearchChange,
  compact = false,
  className = ''
}: SnippetListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredSnippets = snippets.filter(snippet =>
    snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={`snippet-list ${compact ? 'compact' : ''} ${className}`}>
      {onSearchChange && (
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
              className="search-input"
            />
          </div>
        </div>
      )}
      
      <div className={`snippets-container ${compact ? 'compact' : ''}`}>
        {filteredSnippets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No snippets found</h3>
            <p>
              {searchQuery 
                ? 'Try different search terms'
                : 'Create your first snippet to get started'
              }
            </p>
          </div>
        ) : (
          filteredSnippets.map((snippet) => (
            <div key={snippet.id} className="snippet-card">
              <div className="snippet-header">
                <h3 className="snippet-title">{snippet.title}</h3>
                <button 
                  onClick={() => handleDelete(snippet.id)}
                  className="delete-button"
                  title="Delete snippet"
                  disabled={deletingId === snippet.id}
                >
                  {deletingId === snippet.id ? '⏳' : '🗑️'}
                </button>
              </div>
              <div className="snippet-body">
                {snippet.body}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}