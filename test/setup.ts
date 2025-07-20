import { beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock chrome APIs
const chromeMock = {
  storage: {
    local: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
    },
  },
  runtime: {
    id: 'test-extension-id',
    openOptionsPage: vi.fn(),
    onInstalled: {
      addListener: vi.fn(),
    },
  },
};

vi.stubGlobal('chrome', chromeMock);

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

// Setup DOM utilities
beforeEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();

  // Reset chrome storage mocks to default success behavior
  (chrome.storage.local.get as any).mockResolvedValue({});
  (chrome.storage.local.set as any).mockResolvedValue();
  
  // Ensure runtime.id is always mocked for isExtensionContextValid()
  vi.spyOn(chrome.runtime, 'id', 'get').mockReturnValue('test-extension-id');
});
