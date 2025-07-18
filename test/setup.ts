import { beforeEach, vi } from 'vitest';

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
});
