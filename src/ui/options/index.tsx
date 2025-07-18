import { render } from 'preact';
import { useState } from 'preact/hooks';
import { useSnippets, useSettings, SnippetForm, SnippetList } from '../shared';
import { Snippet } from '~/storage';
import './style.css';

function Options() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const { snippets, loading, addSnippet, deleteSnippet, updateSnippet } = useSnippets();
  const { settings, updateSettings } = useSettings();

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
          <div className="settings-section">
            <h2>
              <span className="section-icon">⚙️</span>
              Settings
            </h2>
            <div className="setting-item">
              <label htmlFor="activator-key">Activator Key</label>
              <input
                id="activator-key"
                type="text"
                value={settings.activatorKey}
                onInput={(e) => {
                  const value = (e.target as HTMLInputElement).value;
                  if (value.length <= 1) { // Only allow single character
                    updateSettings({ activatorKey: value });
                  }
                }}
                placeholder="/"
                maxLength={1}
                style={{
                  marginTop: '4px',
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '4px',
                marginBottom: '0'
              }}>
                Key to activate the command palette in text fields
              </p>
            </div>
          </div>

          <div className="add-snippet-section">
            <h2>
              <span className="section-icon">{editingSnippet ? '✏️' : '➕'}</span>
              {editingSnippet ? 'Edit Snippet' : 'Add Snippet'}
            </h2>
            <SnippetForm 
              onAdd={editingSnippet ? undefined : addSnippet}
              onUpdate={editingSnippet ? handleUpdateSnippet : undefined}
              editingSnippet={editingSnippet}
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