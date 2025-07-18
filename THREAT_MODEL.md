# Threat Model

This document outlines the threat model for the Promply extension.

## 1\. Malicious Scripts in Web Pages

**Threat:** A compromised website could attempt to inject malicious scripts into the extension's content script or UI components.

**Mitigation:**

- **Content Security Policy (CSP):** The extension uses a strict CSP that only allows scripts and objects to be loaded from its own origin. This prevents the execution of any unauthorized scripts.
- **DOM Sanitization:** All data from web pages is treated as untrusted. When inserting snippets into the DOM, the extension will sanitize the content to prevent XSS attacks. (Note: currently, the extension only inserts plain text, which is safe).

## 2\. Cross-Site Request Forgery (CSRF)

**Threat:** A malicious website could attempt to make unauthorized requests to the extension's background script.

**Mitigation:**

- **No Publicly Exposed Endpoints:** The extension does not expose any public endpoints that could be targeted by a CSRF attack. All communication is handled internally through the `chrome.runtime` and `chrome.storage` APIs.

## 3\. Data Theft

**Threat:** An attacker could attempt to steal the user's snippets from `chrome.storage.local`.

**Mitigation:**

- **Limited Permissions:** The extension only requests the `storage` and `activeTab` permissions, which are necessary for its core functionality. It does not request any unnecessary permissions that could be used to access sensitive user data.
- **No Remote Code Execution:** The extension does not load any remote code, which reduces the attack surface and prevents the execution of malicious code that could be used to steal data.

## 4\. Insecure Third-Party Dependencies

**Threat:** A third-party dependency could contain a security vulnerability that could be exploited by an attacker.

**Mitigation:**

- **Dependency Auditing:** The project uses `npm audit` to regularly scan for and fix vulnerabilities in its dependencies.
- **Minimal Dependencies:** The project uses a minimal set of dependencies to reduce the attack surface.

## 5\. Quota Errors

**Threat:** The extension could encounter quota errors when writing to `chrome.storage.local`, which could lead to data loss.

**Mitigation:**

- **Error Handling:** The extension will include error handling to gracefully manage quota errors and notify the user when they occur.
- **Data Export:** The extension provides a way for users to export their snippets as a JSON file, which can be used as a backup.
