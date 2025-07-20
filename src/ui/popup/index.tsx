import { render } from 'preact';
import { useState } from 'preact/hooks';
import { useSnippets, SnippetForm, SnippetList } from '../shared';
import { Snippet } from '~/storage';
import './style.css';
import '../options/style.css';

type PopupView = 'overview' | 'add' | 'manage' | 'edit' | 'import-export';

function Popup() {
  const [currentView, setCurrentView] = useState<PopupView>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { snippets, loading, addSnippet, deleteSnippet, updateSnippet, exportSnippets, importSnippets } = useSnippets();

  // Extract available folders from existing snippets
  const availableFolders = Array.from(
    new Set(snippets.filter(s => s.folder).map(s => s.folder!))
  ).sort();

  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };

  const handleAddSnippet = async (snippet: { title: string; body: string }) => {
    await addSnippet(snippet);
    setCurrentView('manage');
  };

  const handleUpdateSnippet = async (snippet: Snippet) => {
    await updateSnippet(snippet);
    setEditingSnippet(null);
    setCurrentView('manage');
  };

  const handleEditSnippet = (snippet: Snippet) => {
    setEditingSnippet(snippet);
    setCurrentView('edit');
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
      
      setImportStatus(`✅ Exported ${snippets.length} snippets`);
      setTimeout(() => setImportStatus(null), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setImportStatus('❌ Export failed');
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
        setImportStatus(`✅ Imported ${result.imported} snippets`);
      } else {
        setImportStatus(`❌ Import failed`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportStatus('❌ Import failed');
    } finally {
      setIsImporting(false);
      target.value = '';
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  const renderOverview = () => (
    <>
      <div className="quick-stats">
        <div className="stat">
          <div className="stat-icon">📝</div>
          <div className="stat-text">
            {loading ? 'Loading...' : `${snippets.length} snippets ready`}
          </div>
        </div>
      </div>
      
      <div className="action-buttons">
        <button 
          className="action-button primary" 
          onClick={() => setCurrentView('add')}
        >
          <span className="button-icon">➕</span>
          Add Snippet
        </button>
        
        <button 
          className="action-button secondary" 
          onClick={() => setCurrentView('manage')}
          disabled={snippets.length === 0}
        >
          <span className="button-icon">📚</span>
          Manage ({snippets.length})
        </button>
        
        <button 
          className="action-button secondary" 
          onClick={() => setCurrentView('import-export')}
        >
          <span className="button-icon">💾</span>
          Import/Export
        </button>
      </div>

      <button className="link-button" onClick={openOptionsPage}>
        <span className="button-icon">🔗</span>
        Open Full Options
      </button>
    </>
  );

  const renderAddView = () => (
    <>
      <div className="view-header">
        <button 
          className="back-button" 
          onClick={() => setCurrentView('overview')}
        >
          ← Back
        </button>
        <h2>Add Snippet</h2>
      </div>
      <SnippetForm onAdd={handleAddSnippet} compact={true} availableFolders={availableFolders} />
    </>
  );

  const renderEditView = () => (
    <>
      <div className="view-header">
        <button 
          className="back-button" 
          onClick={() => {
            setEditingSnippet(null);
            setCurrentView('manage');
          }}
        >
          ← Back
        </button>
        <h2>Edit Snippet</h2>
      </div>
      <SnippetForm 
        onUpdate={handleUpdateSnippet} 
        editingSnippet={editingSnippet}
        compact={true}
        availableFolders={availableFolders}
      />
    </>
  );

  const renderManageView = () => (
    <>
      <div className="view-header">
        <button 
          className="back-button" 
          onClick={() => setCurrentView('overview')}
        >
          ← Back
        </button>
        <h2>Manage Snippets</h2>
      </div>
      <SnippetList
        snippets={snippets}
        onDelete={deleteSnippet}
        onEdit={handleEditSnippet}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        compact={true}
      />
    </>
  );

  const renderImportExportView = () => (
    <>
      <div className="view-header">
        <button 
          className="back-button" 
          onClick={() => setCurrentView('overview')}
        >
          ← Back
        </button>
        <h2>Import/Export</h2>
      </div>
      
      <div className="import-export-content">
        <div className="backup-info">
          <p>Export your snippets for backup or sharing, or import snippets from a file.</p>
        </div>
        
        <div className="backup-actions-popup">
          <button 
            onClick={handleExportSnippets}
            className="popup-export-button"
            disabled={isExporting || snippets.length === 0}
          >
            <span className="button-icon">📤</span>
            {isExporting ? 'Exporting...' : `Export (${snippets.length})`}
          </button>
          
          <div className="popup-import-section">
            <label htmlFor="popup-import-file" className="popup-import-button">
              <span className="button-icon">📥</span>
              {isImporting ? 'Importing...' : 'Import'}
            </label>
            <input
              id="popup-import-file"
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportSnippets}
              disabled={isImporting}
            />
          </div>
        </div>
        
        {importStatus && (
          <div className={`popup-import-status ${importStatus.startsWith('✅') ? 'success' : 'error'}`}>
            {importStatus}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="popup-container">
      <div className="header">
        <div className="logo">
          <div className="logo-icon">✨</div>
          <h1>Promply</h1>
        </div>
        <div className="subtitle">Your AI prompts, organized</div>
      </div>
      
      <div className="content">
        {currentView === 'overview' && renderOverview()}
        {currentView === 'add' && renderAddView()}
        {currentView === 'edit' && renderEditView()}
        {currentView === 'manage' && renderManageView()}
        {currentView === 'import-export' && renderImportExportView()}
        
        {currentView === 'overview' && (
          <div className="footer">
            <div className="tip">
              <span className="tip-icon">💡</span>
              Press the activation key to insert snippets
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

render(<Popup />, document.getElementById('app')!); 