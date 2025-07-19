import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { useSnippets, useSettings, SnippetForm, SnippetList } from '../shared';
import { Snippet } from '~/storage';
import './style.css';

function Options() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tempSettings, setTempSettings] = useState<{ activatorKey: string }>({ activatorKey: '/' });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const { snippets, loading, addSnippet, deleteSnippet, updateSnippet } = useSnippets();
  const { settings, updateSettings } = useSettings();

  // Update temp settings when actual settings load
  useEffect(() => {
    setTempSettings({ activatorKey: settings.activatorKey });
  }, [settings.activatorKey]);

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

  const handleAddSnippet = async (snippet: Omit<Snippet, 'id'>) => {
    await addSnippet(snippet);
    setShowAddModal(false);
  };

  const handleSaveSettings = async () => {
    await updateSettings(tempSettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
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
                value={tempSettings.activatorKey}
                onInput={(e) => {
                  const value = (e.target as HTMLInputElement).value;
                  if (value.length <= 1) { // Only allow single character
                    setTempSettings({ activatorKey: value });
                  }
                }}
                placeholder="/"
                maxLength={1}
                className="settings-input"
              />
              <p className="setting-description">
                Key to activate the command palette in text fields
                <br />
                <span className="setting-note">
                  💡 Any existing tabs using Promply must be reloaded for the new activator to take effect
                </span>
              </p>
            </div>
            <button 
              onClick={handleSaveSettings}
              className={`save-settings-button ${settingsSaved ? 'saved' : ''}`}
              disabled={tempSettings.activatorKey === settings.activatorKey}
            >
              {settingsSaved ? '✓ Settings Saved' : 'Save Settings'}
            </button>
          </div>

          <div className="add-snippet-section">
            <button 
              onClick={() => setShowAddModal(true)}
              className="add-snippet-button"
            >
              <span className="button-icon">➕</span>
              Add New Snippet
            </button>
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

      {/* Add Snippet Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Snippet</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <SnippetForm onAdd={handleAddSnippet} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Snippet Modal */}
      {editingSnippet && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Snippet</h3>
              <button 
                onClick={handleCancelEdit}
                className="modal-close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <SnippetForm 
                onUpdate={handleUpdateSnippet}
                editingSnippet={editingSnippet}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

render(<Options />, document.getElementById('app')!); 