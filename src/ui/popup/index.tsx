import { render } from 'preact';
import './style.css';

function Popup() {
  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };

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
        <div className="quick-stats">
          <div className="stat">
            <div className="stat-icon">📝</div>
            <div className="stat-text">Ready to boost your productivity</div>
          </div>
        </div>
        
        <button className="primary-button" onClick={openOptionsPage}>
          <span className="button-icon">⚙️</span>
          Manage Snippets
          <span className="button-arrow">→</span>
        </button>
        
        <div className="footer">
          <div className="tip">
            <span className="tip-icon">💡</span>
            Press the activation key to insert snippets
          </div>
        </div>
      </div>
    </div>
  );
}

render(<Popup />, document.getElementById('app')!); 