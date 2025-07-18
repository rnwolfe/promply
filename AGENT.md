# Promply AI Agent Instructions

This document provides instructions for an AI agent to work with the Promply codebase.

## About the Project

Promply is a browser extension that acts as your AI Prompt Assistant. It helps users manage and utilize AI prompts more effectively. The extension is built using web technologies, including Preact for the UI, and is intended to run in Chrome and Firefox.

## Key Commands

- `npm run dev`: Starts the development server with file watching.
- `npm run build`: Creates a production build for the extension.
- `npm run build:chrome`: Builds the extension specifically for Chrome.
- `npm run build:firefox`: Builds the extension specifically for Firefox.
- `npm run test`: Runs the test suite using Vitest.
- `npm run test:coverage`: Runs tests and generates a coverage report.
- `npm run lint`: Lints the codebase to check for errors with ESLint.
- `npm run format`: Formats the code using Prettier.

## Code Style

- **TypeScript**: Strict mode is enabled. Adhere to the configurations in `tsconfig.json`.
- **Formatting**: Use Prettier for consistent code formatting.
- **Imports**: Keep imports organized.
- **Naming**: Use descriptive variable and function names.
- **Comments**: Use JSDoc for documenting functions and modules.
- **Linting**: Follow the rules defined in `eslint.config.mjs`. `no-explicit-any` and `no-unused-vars` are currently turned off but should be used judiciously.

## Testing

- **Framework**: Vitest is used for unit and integration testing.
- **Test Files**: Test files should be located in the `test/` directory and follow the `*.test.ts` naming convention.
- **Assertions**: Use the `expect` assertion style from Vitest.
- **Coverage**: Aim to maintain or increase test coverage.

## Architecture

- **Frontend**: Preact with TypeScript for the UI components in `src/ui`.
- **Background Scripts**: Located in `src/background`, handling the extension's core logic.
- **Content Scripts**: Located in `src/content`, interacting with web page content.
- **Storage**: The `src/storage` directory contains logic for local and sync storage.
- **Build Tool**: Vite is used for building and development.
- **Package Manager**: npm is used for dependency management.

## Git Workflow

- **Committing**: Before committing, ensure that `npm run lint` and `npm run test` pass.
- **Branching**: Use feature branches for new features or bug fixes.
- **Pull Requests**: Create pull requests to merge changes into the `main` branch.
- **Force Pushing**: Avoid force pushing to the `main` branch.

## Configuration

When adding new configuration options, update all relevant places:

1. Manifest files (`manifest.chrome.json`, `manifest.firefox.json`)
2. Configuration in `vite.config.mjs`
3. Any relevant UI or background scripts.
