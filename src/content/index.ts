import Fuse from 'fuse.js';
import { Snippet } from '~/storage';
import { LocalSnippetStore, LocalSettingsStore } from '~/storage/local';
import { hasVariables, processTemplate, getVariablesWithMetadata } from '~/utils/template';

const store = new LocalSnippetStore();
const settingsStore = new LocalSettingsStore();
let commandPalette: HTMLDivElement | null = null;
let snippets: Snippet[] = [];
let fuse: Fuse<Snippet>;
let originalTargetElement: HTMLElement | null = null;
let extensionContextValid = true;
let selectedIndex = 0;
let filteredSnippets: Snippet[] = [];
let activatorKey = '/'; // Default value, will be loaded from settings

// Function to check if extension context is still valid
function isExtensionContextValid(): boolean {
  try {
    return !!chrome.runtime?.id;
  } catch (error) {
    return false;
  }
}

// Function to load activator key from settings
async function loadActivatorKey() {
  try {
    const settings = await settingsStore.getSettings();
    activatorKey = settings.activatorKey;
  } catch (error) {
    console.warn('Failed to load activator key, using default:', error);
    activatorKey = '/'; // fallback to default
  }
}

async function openCommandPalette() {
  if (commandPalette) {
    return;
  }

  // Check if extension context is still valid
  if (!isExtensionContextValid()) {
    console.warn('Extension context invalidated. Please reload the page.');
    extensionContextValid = false;
    showExtensionReloadMessage();
    return;
  }

  try {
    snippets = await store.getSnippets();
  } catch (error) {
    console.error('Failed to load snippets:', error);
    snippets = [];
    showErrorMessage(
      'Failed to load snippets. Extension may need to be reloaded.',
    );
    return;
  }

  fuse = new Fuse(snippets, {
    keys: ['title', 'body', 'tags', 'folder'],
    includeScore: true,
    threshold: 0.3,
  });

  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'command-palette-backdrop';

  // Create main palette container
  commandPalette = document.createElement('div');
  commandPalette.className = 'command-palette';

  // Create header with icon and title
  const header = document.createElement('div');
  header.className = 'command-palette-header';
  header.innerHTML = `
    <div class="header-content">
      <span class="palette-icon">✨</span>
      <div class="header-text">
                 <h3>Promply</h3>
         <p>Your AI prompt assistant</p>
      </div>
    </div>
    <div class="close-button" onclick="this.dispatchEvent(new CustomEvent('close-palette'))">✕</div>
  `;

  // Create search section
  const searchSection = document.createElement('div');
  searchSection.className = 'search-section';

  const searchWrapper = document.createElement('div');
  searchWrapper.className = 'search-wrapper';

  const searchIcon = document.createElement('span');
  searchIcon.className = 'search-icon';
  searchIcon.textContent = '🔍';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Search prompts and snippets...';
  input.className = 'search-input';

  searchWrapper.appendChild(searchIcon);
  searchWrapper.appendChild(input);
  searchSection.appendChild(searchWrapper);

  // Create results section
  const resultsSection = document.createElement('div');
  resultsSection.className = 'results-section';

  const resultsContainer = document.createElement('div');
  resultsContainer.className = 'results-container';

  resultsSection.appendChild(resultsContainer);

  // Create footer with instructions
  const footer = document.createElement('div');
  footer.className = 'command-palette-footer';
  footer.innerHTML = `
    <div class="footer-instructions">
      <span class="instruction"><kbd>↑↓</kbd> Navigate</span>
      <span class="instruction"><kbd>Enter</kbd> Select</span>
      <span class="instruction"><kbd>Esc</kbd> Close</span>
    </div>
  `;

  // Assemble the palette
  commandPalette.appendChild(header);
  commandPalette.appendChild(searchSection);
  commandPalette.appendChild(resultsSection);
  commandPalette.appendChild(footer);

  backdrop.appendChild(commandPalette);
  document.body.appendChild(backdrop);

  // Show all snippets initially
  filteredSnippets = snippets;
  selectedIndex = 0;
  renderSnippets(snippets);

  // Focus the input with slight delay for smooth animation
  setTimeout(() => input.focus(), 100);

  // Listen for input changes
  input.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value;
    selectedIndex = 0; // Reset selection

    if (query.trim() === '') {
      filteredSnippets = snippets;
      renderSnippets(snippets);
    } else {
      const results = fuse.search(query);
      filteredSnippets = results.map((result) => result.item);
      renderSnippets(filteredSnippets);
    }
  });

  // Enhanced keyboard navigation
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filteredSnippets.length - 1);
      updateSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      updateSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (
        filteredSnippets.length > 0 &&
        selectedIndex < filteredSnippets.length
      ) {
        const selectedSnippet = filteredSnippets[selectedIndex];
        handleSnippetSelection(selectedSnippet);
      }
    }
  });

  // Listen for close event
  header.addEventListener('close-palette', () => closeCommandPalette());

  // Listen for escape key and outside clicks
  document.addEventListener('keydown', handleKeyDown);
  backdrop.addEventListener('click', handleBackdropClick);
}

function handleBackdropClick(e: MouseEvent) {
  if (
    e.target instanceof Element &&
    e.target.classList.contains('command-palette-backdrop')
  ) {
    closeCommandPalette();
  }
}

function updateSelection() {
  const items = commandPalette?.querySelectorAll('.snippet-item');
  if (!items) return;

  items.forEach((item, index) => {
    if (index === selectedIndex) {
      item.classList.add('selected');
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      item.classList.remove('selected');
    }
  });
}

function showExtensionReloadMessage() {
  const message = document.createElement('div');
  message.className = 'extension-message reload-message';
  message.innerHTML = `
    <div class="message-content">
      <span class="message-icon">🔄</span>
      <div class="message-text">
        <strong>Extension Reloaded</strong>
                 <p>Please refresh this page to use Promply</p>
      </div>
    </div>
  `;

  document.body.appendChild(message);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (message.parentNode) {
      message.remove();
    }
  }, 5000);
}

function showErrorMessage(text: string) {
  const message = document.createElement('div');
  message.className = 'extension-message error-message';
  message.innerHTML = `
    <div class="message-content">
      <span class="message-icon">⚠️</span>
      <div class="message-text">
        <strong>Error</strong>
        <p>${text}</p>
      </div>
    </div>
  `;

  document.body.appendChild(message);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    if (message.parentNode) {
      message.remove();
    }
  }, 4000);
}

function renderSnippets(snippetsToShow: Snippet[]) {
  const resultsContainer = commandPalette?.querySelector('.results-container');
  if (!resultsContainer) return;

  resultsContainer.innerHTML = '';

  if (snippetsToShow.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <div class="empty-icon">📝</div>
      <h4>No ${snippets.length === 0 ? 'snippets' : 'matches'} found</h4>
      <p>${snippets.length === 0
        ? 'Add snippets in the extension options to get started'
        : 'Try adjusting your search terms'
      }</p>
    `;
    resultsContainer.appendChild(emptyState);
    return;
  }

  snippetsToShow.forEach((snippet, index) => {
    const item = document.createElement('div');
    item.className = `snippet-item ${index === selectedIndex ? 'selected' : ''}`;

    // Truncate long content for preview
    const previewText =
      snippet.body.length > 100
        ? snippet.body.substring(0, 100) + '...'
        : snippet.body;

    item.innerHTML = `
      <div class="snippet-header">
        <h4 class="snippet-title">${escapeHtml(snippet.title)}</h4>
        <div class="snippet-actions">
          <span class="action-hint">Click to insert</span>
        </div>
      </div>
      <div class="snippet-preview">${escapeHtml(previewText)}</div>
      ${snippet.folder
        ? `<div class="snippet-folder">
               <span class="folder-indicator">📁 ${escapeHtml(snippet.folder)}</span>
             </div>`
        : ''
      }
      ${snippet.tags && snippet.tags.length > 0
        ? `
        <div class="snippet-tags">
          ${snippet.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
      `
        : ''
      }
    `;

    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleSnippetSelection(snippet);
    });

    item.addEventListener('mouseenter', () => {
      selectedIndex = index;
      updateSelection();
    });

    resultsContainer.appendChild(item);
  });
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function closeCommandPalette(preserveTarget = false) {
  const backdrop = document.querySelector('.command-palette-backdrop');
  if (backdrop) {
    backdrop.remove();
  }

  if (commandPalette) {
    commandPalette = null;
    document.removeEventListener('keydown', handleKeyDown);
    if (!preserveTarget) {
      originalTargetElement = null;
    }
  }
}

function handleSnippetSelection(snippet: Snippet) {
  if (hasVariables(snippet.body)) {
    showVariableInputModal(snippet);
  } else {
    pasteSnippet(snippet.body);
    closeCommandPalette();
  }
}

function showVariableInputModal(snippet: Snippet) {
  const variablesWithMetadata = getVariablesWithMetadata(snippet.body, snippet.variables);
  
  if (variablesWithMetadata.length === 0) {
    pasteSnippet(snippet.body);
    closeCommandPalette();
    return;
  }

  // Close command palette but preserve originalTargetElement
  closeCommandPalette(true);

  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'variable-modal-backdrop';

  // Create modal container
  const modal = document.createElement('div');
  modal.className = 'variable-modal';

  // Create header
  const header = document.createElement('div');
  header.className = 'variable-modal-header';
  header.innerHTML = `
    <div class="modal-header-content">
      <h3>Fill in Variables</h3>
      <p>Complete the following fields to personalize your snippet</p>
    </div>
    <button class="modal-close-button">×</button>
  `;

  // Create form
  const form = document.createElement('form');
  form.className = 'variable-form';

  // Build input fields
  variablesWithMetadata.forEach((variable, index) => {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'variable-field';

    const label = document.createElement('label');
    label.textContent = variable.description || variable.name;
    label.setAttribute('for', `var-${variable.name}`);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = `var-${variable.name}`;
    input.name = `var-${variable.name}`;
    input.placeholder = variable.defaultValue || `Enter ${variable.name}...`;
    input.value = variable.defaultValue || '';
    input.className = 'variable-input-field';

    // Focus first input
    if (index === 0) {
      setTimeout(() => input.focus(), 100);
    }

    fieldContainer.appendChild(label);
    fieldContainer.appendChild(input);
    form.appendChild(fieldContainer);
  });

  // Create actions
  const actions = document.createElement('div');
  actions.className = 'variable-modal-actions';

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.textContent = 'Cancel';
  cancelButton.className = 'variable-cancel-button';

  const insertButton = document.createElement('button');
  insertButton.type = 'submit';
  insertButton.textContent = 'Insert Snippet';
  insertButton.className = 'variable-insert-button';

  actions.appendChild(cancelButton);
  actions.appendChild(insertButton);

  // Add actions to form (not modal)
  form.appendChild(actions);

  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(form);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  // Event handlers
  const closeModal = () => {
    if (backdrop.parentNode) {
      backdrop.remove();
    }
  };

  const insertSnippet = () => {
    // Build variableValues fresh from the form inputs
    const variableValues: Record<string, string> = {};
    variablesWithMetadata.forEach((variable) => {
      const inputEl = form.elements.namedItem(`var-${variable.name}`) as HTMLInputElement;
      if (inputEl) {
        variableValues[variable.name] = inputEl.value;
      }
    });
    const processedContent = processTemplate(snippet.body, variableValues);
    pasteSnippet(processedContent);
    closeModal();
  };

  // Listen for events
  cancelButton.addEventListener('click', closeModal);
  header.querySelector('.modal-close-button')?.addEventListener('click', closeModal);
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    insertSnippet();
  });

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      closeModal();
    }
  });

  // Handle escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Remove escape listener when modal is closed
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.removedNodes.forEach((node) => {
          if (node === backdrop) {
            document.removeEventListener('keydown', handleEscape);
            observer.disconnect();
          }
        });
      }
    });
  });
  observer.observe(document.body, { childList: true });
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeCommandPalette();
  }
}

function pasteSnippet(text: string) {
  const targetElement = originalTargetElement;

  if (!targetElement) {
    console.warn('No original target element found for pasting');
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showErrorMessage('Snippet copied to clipboard');
      })
      .catch(() => {
        showErrorMessage('Failed to paste snippet');
      });
    return;
  }

  if (
    targetElement instanceof HTMLInputElement ||
    targetElement instanceof HTMLTextAreaElement
  ) {
    // Handle input and textarea elements
    const elementPrototype = Object.getPrototypeOf(targetElement);
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      elementPrototype,
      'value',
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(targetElement, text);
    } else {
      targetElement.value = text;
    }

    // Focus the element and dispatch events
    targetElement.focus();
    targetElement.dispatchEvent(new Event('input', { bubbles: true }));
    targetElement.dispatchEvent(new Event('change', { bubbles: true }));
    targetElement.dispatchEvent(new Event('keyup', { bubbles: true }));
  } else if (targetElement.isContentEditable) {
    // Handle contentEditable elements
    targetElement.focus();

    // Try using execCommand first (works in most cases)
    // TODO: execCommand is deprecated, should refactor.
    if (document.execCommand) {
      try {
        document.execCommand('selectAll');
        document.execCommand('insertText', false, text);
        return;
      } catch (error) {
        console.log('execCommand failed, trying alternative method');
      }
    }

    // Fallback: set textContent
    targetElement.textContent = text;
    targetElement.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    console.warn('Element is not suitable for pasting:', targetElement);
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showErrorMessage('Snippet copied to clipboard');
      })
      .catch(() => {
        showErrorMessage('Failed to paste snippet');
      });
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === activatorKey && e.target instanceof HTMLElement) {
    const target = e.target as HTMLElement;

    // Check if we're in a suitable input context
    const isInputElement =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement;
    const isContentEditable = target.isContentEditable;
    const isInEditableContext = isInputElement || isContentEditable;

    if (isInEditableContext) {
      // Check if extension context is still valid before proceeding
      if (!extensionContextValid || !isExtensionContextValid()) {
        console.warn(
          'Extension context is not valid. Cannot open command palette.',
        );
        showExtensionReloadMessage();
        return;
      }

      e.preventDefault();
      originalTargetElement = target;
      openCommandPalette();
    }
  }
});

// Initialize activator key from settings
loadActivatorKey();
