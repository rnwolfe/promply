import { useState } from 'preact/hooks';
import { Snippet } from '~/storage';

interface SnippetListProps {
  snippets: Snippet[];
  onDelete: (id: string) => Promise<void>;
  onEdit?: (snippet: Snippet) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  compact?: boolean;
  className?: string;
  groupByFolders?: boolean;
}

export function SnippetList({ 
  snippets, 
  onDelete, 
  onEdit,
  searchQuery = '', 
  onSearchChange,
  compact = false,
  className = '',
  groupByFolders = true
}: SnippetListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredSnippets = snippets.filter(snippet =>
    snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (snippet.folder && snippet.folder.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  // Group snippets by folder if enabled
  const groupedSnippets = groupByFolders 
    ? filteredSnippets.reduce((groups, snippet) => {
        const folderName = snippet.folder || 'Ungrouped';
        if (!groups[folderName]) {
          groups[folderName] = [];
        }
        groups[folderName].push(snippet);
        return groups;
      }, {} as Record<string, Snippet[]>)
    : { 'All Snippets': filteredSnippets };

  const renderSnippetCard = (snippet: Snippet) => (
    <div key={snippet.id} className="snippet-card">
      <div className="snippet-header">
        <h3 className="snippet-title">{snippet.title}</h3>
        <div className="snippet-actions">
          {onEdit && (
            <button 
              onClick={() => onEdit(snippet)}
              className="edit-button"
              title="Edit snippet"
            >
              ✏️
            </button>
          )}
          <button 
            onClick={() => handleDelete(snippet.id)}
            className="delete-button"
            title="Delete snippet"
            disabled={deletingId === snippet.id}
          >
            {deletingId === snippet.id ? '⏳' : '🗑️'}
          </button>
        </div>
      </div>
      <div className="snippet-body">
        {snippet.body}
      </div>
      {snippet.folder && !groupByFolders && (
        <div className="snippet-folder">
          <span className="folder-tag">📁 {snippet.folder}</span>
        </div>
      )}
    </div>
  );

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
          groupByFolders ? (
            Object.entries(groupedSnippets)
              .sort(([a], [b]) => {
                // Sort folders alphabetically, with "Ungrouped" at the end
                if (a === 'Ungrouped') return 1;
                if (b === 'Ungrouped') return -1;
                return a.localeCompare(b);
              })
              .map(([folderName, folderSnippets]) => (
                <div key={folderName} className="folder-group">
                  <div className="folder-header">
                    <h3 className="folder-title">
                      <span className="folder-icon">
                        {folderName === 'Ungrouped' ? '📝' : '📁'}
                      </span>
                      {folderName}
                      <span className="folder-count">({folderSnippets.length})</span>
                    </h3>
                  </div>
                  <div className="folder-snippets">
                    {folderSnippets.map(renderSnippetCard)}
                  </div>
                </div>
              ))
          ) : (
            filteredSnippets.map(renderSnippetCard)
          )
        )}
      </div>
    </div>
  );
}