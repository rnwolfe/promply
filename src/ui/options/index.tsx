import { render } from 'preact';
import { useState } from 'preact/hooks';
import { useSnippets, SnippetForm, SnippetList } from '../shared';
import { Snippet } from '~/storage';
import './style.css';

function Options() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const { snippets, loading, addSnippet, deleteSnippet, updateSnippet } = useSnippets();

  // Extract available folders from existing snippets
  const availableFolders = Array.from(
    new Set(snippets.filter(s => s.folder).map(s => s.folder!))
  ).sort();

  const handleUpdateSnippet = async (snippet: Snippet) => {
    await updateSnippet(snippet);
    setEditingSnippet(null);
  };

  const handleEditSnippet = (snippet: Snippet) => {
    setEditingSnippet(snippet);
  };

  const handleCancelEdit = () => {
    setEditingSnippet(null);
  };

  return (
    <div className="options-container">
      <div className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">✨</div>
            <div>
              <h1>Promply</h1>
              <p className="subtitle">Manage your AI prompts and snippets</p>
            </div>
          </div>
          <div className="stats">
            <div className="stat-item">
              <span className="stat-number">{loading ? '...' : snippets.length}</span>
              <span className="stat-label">Snippets</span>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="sidebar">
          <div className="add-snippet-section">
            <h2>
              <span className="section-icon">{editingSnippet ? '✏️' : '➕'}</span>
              {editingSnippet ? 'Edit Snippet' : 'Add Snippet'}
            </h2>
            <SnippetForm 
              onAdd={editingSnippet ? undefined : addSnippet}
              onUpdate={editingSnippet ? handleUpdateSnippet : undefined}
              editingSnippet={editingSnippet}
              availableFolders={availableFolders}
            />
            {editingSnippet && (
              <button 
                onClick={handleCancelEdit}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        <div className="content-area">
          <div className="snippets-header">
            <h2>
              <span className="section-icon">📚</span>
              Your Snippets
            </h2>
            <div className="search-container">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>

          <SnippetList
            snippets={snippets}
            onDelete={deleteSnippet}
            onEdit={handleEditSnippet}
            searchQuery={searchQuery}
            className="options-snippets"
          />
        </div>
      </div>
    </div>
  );
}

render(<Options />, document.getElementById('app')!); 