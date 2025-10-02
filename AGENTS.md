# Repository Guidelines

## Project Structure & Module Organization
The workspace has two main products. `battle-of-the-bots/` contains the Express AI API (routes, services, middleware, utils) plus Jest config and Postman collections. `auraflow-extension/` holds the Chrome extension assets (`manifest.json`, popup HTML/CSS/JS, background worker, icons) alongside docs such as `GOOGLE_CLOUD_SETUP.md`. High-level specs and testing guides live at the repo root (`AuraFlowSpecs.md`, `END_TO_END_TESTING_GUIDE.txt`).

## Build, Test, and Development Commands
Run backend setup from `battle-of-the-bots/`: `npm install` once, `npm start` for production-style launch, and `npm run dev` when you need hot reload via Nodemon. Execute `npm test` to run the full Jest suite. Extension tests are browser-based—open `auraflow-extension/tests/unit-tests.html` in Chrome and click **Run All Tests**. Use `chrome://extensions` → **Load unpacked** to sideload the extension during development.

## Coding Style & Naming Conventions
Follow prevailing styles: backend JavaScript uses two-space indentation, camelCase functions, and PascalCase classes. Extension scripts use four-space indentation to match existing UI code. Keep functions small and add focused JSDoc when behavior is non-obvious. Environment-sensitive values belong in `.env` using the keys defined in `.env.example`; never commit secrets.

## Testing Guidelines
Backend logic is covered by Jest (`*.test.js` co-located under `src/`). Mirror that pattern for new modules and cover both happy and failure paths. For HTTP routes, extend `src/app.integration.test.js` with Supertest helpers. Document manual scenarios in `MANUAL_TESTING_GUIDE.txt` if automation is impractical. For extension work, add cases to `tests/unit-tests.js` and verify UI flows using `UI_TESTING_GUIDE.txt` as a checklist.

## Commit & Pull Request Guidelines
Commits follow Conventional Commits (`feat:`, `fix:`, etc.) with concise, present-tense subject lines (see recent history). Scope multi-file work into logical commits and mention affected modules. Pull requests should summarize the change, outline testing evidence (command output or screenshots for UI), call out required configuration updates, and link the relevant spec section or issue. Include before/after visuals when altering the popup UI or themes.

## Security & Configuration Tips
Validate the environment before running the API—`src/app.js` exits if Google OAuth secrets are missing. Keep `ENCRYPTION_KEY` and session secrets rotation-ready, and update allowed origins when the extension ID changes. When sharing logs or screenshots, redact user calendar data.
