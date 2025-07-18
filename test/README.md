# Test Suite Documentation

## Overview

This project includes comprehensive unit tests covering the core functionality of the Promply extension. All tests use Vitest with jsdom environment for DOM testing and mocked Chrome APIs.

## Test Coverage

### Current Coverage (37 tests)

- **Storage Layer**: 79.26% coverage - Tests all CRUD operations, error handling, and edge cases
- **Content Script**: 39.57% coverage - Tests DOM manipulation, keyboard handling, and UI components
- **Background Script**: Tests event handling and Chrome API interactions
- **Overall**: 31.75% statements, 56.25% branches, 52.38% functions

## Test Structure

### `/test/setup.ts`

Global test configuration with:

- Chrome API mocking (storage, runtime)
- Clipboard API mocking
- DOM cleanup between tests
- Mock reset utilities

### `/test/storage.test.ts` (21 tests)

Comprehensive testing of `LocalSnippetStore`:

- **CRUD Operations**: Add, update, delete, get snippets
- **Error Handling**: Storage failures, context invalidation, malformed data
- **Edge Cases**: Large content, special characters, duplicate IDs
- **Validation**: Input sanitization and data integrity

### `/test/content.test.ts` (11 tests)

Content script functionality testing:

- **DOM Manipulation**: Element creation, event handling
- **Command Palette**: UI rendering, search functionality, keyboard navigation
- **Security**: HTML escaping, XSS prevention
- **Error Handling**: Extension context invalidation, clipboard fallbacks

### `/test/background.test.ts` (5 tests)

Background script behavior testing:

- **Installation Events**: Options page opening logic
- **Chrome API**: Runtime event handling
- **Lifecycle**: Different install/update scenarios

## Key Testing Patterns

### Mock Management

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  (chrome.storage.local.get as any).mockResolvedValue({});
  (chrome.storage.local.set as any).mockResolvedValue();
});
```

### Error Testing

```typescript
it('should handle storage errors gracefully', async () => {
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  (chrome.storage.local.get as any).mockRejectedValue(new Error('Storage unavailable'));

  const result = await store.getSnippets();

  expect(result).toEqual([]);
  expect(consoleWarnSpy).toHaveBeenCalled();
});
```

### DOM Testing

```typescript
it('should create command palette elements', () => {
  const backdrop = document.createElement('div');
  backdrop.className = 'command-palette-backdrop';
  document.body.appendChild(backdrop);

  expect(document.querySelector('.command-palette-backdrop')).toBeTruthy();
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

## Coverage Thresholds

Current thresholds set at 70% for:

- Statements
- Branches
- Functions
- Lines

## Future Improvements

### Higher Coverage Targets

- **Content Script**: More integration testing of command palette workflow
- **UI Components**: Testing Preact components (options, popup)
- **Background Script**: File loading and import testing

### Additional Test Types

- **Integration Tests**: End-to-end workflows
- **Performance Tests**: Large dataset handling
- **Accessibility Tests**: Screen reader compatibility
- **Cross-browser Tests**: Firefox vs Chrome differences

### Test Automation

- Pre-commit hooks run tests
- CI/CD pipeline includes coverage reporting
- Pull request coverage requirements

## Notes

- Tests run in jsdom environment simulating browser DOM
- Chrome APIs are mocked to avoid actual extension context
- Console output is suppressed during tests to reduce noise
- All async operations are properly awaited for reliable testing
