import { render } from 'preact';
import { useState } from 'preact/hooks';
import { useSnippets, SnippetForm, SnippetList } from '../shared';
import './style.css';

function Options() {
  const [searchQuery, setSearchQuery] = useState('');
  const { snippets, loading, addSnippet, deleteSnippet } = useSnippets();

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
              <span className="section-icon">➕</span>
              Add Snippet
            </h2>
            <SnippetForm onAdd={addSnippet} />
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
            searchQuery={searchQuery}
            className="options-snippets"
          />
        </div>
      </div>
    </div>
  );
}

render(<Options />, document.getElementById('app')!); 