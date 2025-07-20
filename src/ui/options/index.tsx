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
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { snippets, loading, addSnippet, deleteSnippet, updateSnippet, exportSnippets, importSnippets } = useSnippets();
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

  const handleExportSnippets = async () => {
    try {
      setIsExporting(true);
      const jsonData = await exportSnippets();
      
      // Create a blob and download the file
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promply-snippets-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setImportStatus(`✅ Successfully exported ${snippets.length} snippets`);
      setTimeout(() => setImportStatus(null), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setImportStatus('❌ Export failed. Please try again.');
      setTimeout(() => setImportStatus(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportSnippets = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const result = await importSnippets(text, { merge: true });
      
      if (result.success) {
        setImportStatus(`✅ Successfully imported ${result.imported} snippets${result.skipped > 0 ? ` (${result.skipped} duplicates skipped)` : ''}`);
      } else {
        setImportStatus(`❌ Import failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportStatus('❌ Import failed. Please check the file format.');
    } finally {
      setIsImporting(false);
      // Reset the file input
      target.value = '';
      setTimeout(() => setImportStatus(null), 5000);
    }
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

          <div className="import-export-section">
            <h3>
              <span className="section-icon">💾</span>
              Backup & Restore
            </h3>
            <p className="section-description">
              Export your snippets to a file for backup or sharing, or import snippets from a file.
            </p>
            
            <div className="backup-actions">
              <button 
                onClick={handleExportSnippets}
                className="export-button"
                disabled={isExporting || snippets.length === 0}
              >
                <span className="button-icon">📤</span>
                {isExporting ? 'Exporting...' : `Export Snippets (${snippets.length})`}
              </button>
              
              <div className="import-section">
                <label htmlFor="import-file" className="import-button">
                  <span className="button-icon">📥</span>
                  {isImporting ? 'Importing...' : 'Import Snippets'}
                </label>
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleImportSnippets}
                  disabled={isImporting}
                />
              </div>
            </div>
            
            {importStatus && (
              <div className={`import-status ${importStatus.startsWith('✅') ? 'success' : 'error'}`}>
                {importStatus}
              </div>
            )}
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