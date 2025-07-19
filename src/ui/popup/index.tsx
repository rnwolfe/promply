import { render } from 'preact';
import { useState } from 'preact/hooks';
import { useSnippets, SnippetForm, SnippetList } from '../shared';
import { Snippet } from '~/storage';
import './style.css';

type PopupView = 'overview' | 'add' | 'manage' | 'edit';

function Popup() {
  const [currentView, setCurrentView] = useState<PopupView>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const { snippets, loading, addSnippet, deleteSnippet, updateSnippet } = useSnippets();

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