import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Snippet } from '~/storage';
import { LocalSnippetStore } from '~/storage/local';
import './style.css';

const store = new LocalSnippetStore();

function Options() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingSnippet, setIsAddingSnippet] = useState(false);

  useEffect(() => {
    store.getSnippets().then(setSnippets);
  }, []);

  const addSnippet = async () => {
    if (newTitle && newBody) {
      setIsAddingSnippet(true);
      await store.addSnippet({ title: newTitle, body: newBody });
      const updatedSnippets = await store.getSnippets();
      setSnippets(updatedSnippets);
      setNewTitle('');
      setNewBody('');
      setIsAddingSnippet(false);
    }
  };

  const deleteSnippet = async (id: string) => {
    await store.deleteSnippet(id);
    const updatedSnippets = await store.getSnippets();
    setSnippets(updatedSnippets);
  };

  const filteredSnippets = snippets.filter(snippet =>
    snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <span className="stat-number">{snippets.length}</span>
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
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                placeholder="Enter title..."
                value={newTitle}
                onInput={(e) => setNewTitle((e.target as HTMLInputElement).value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="body">Content</label>
              <textarea
                id="body"
                placeholder="Enter your prompt..."
                value={newBody}
                onInput={(e) => setNewBody((e.target as HTMLInputElement).value)}
                className="form-textarea"
                rows={4}
              />
            </div>
            <button 
              onClick={addSnippet} 
              className={`add-button ${isAddingSnippet ? 'loading' : ''}`}
              disabled={!newTitle || !newBody || isAddingSnippet}
            >
              <span className="button-icon">
                {isAddingSnippet ? '⏳' : '✅'}
              </span>
              {isAddingSnippet ? 'Adding...' : 'Add Snippet'}
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

          <div className="snippets-grid">
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
                      onClick={() => deleteSnippet(snippet.id)}
                      className="delete-button"
                      title="Delete snippet"
                    >
                      🗑️
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
      </div>
    </div>
  );
}

render(<Options />, document.getElementById('app')!); 