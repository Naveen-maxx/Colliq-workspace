# Contributing to Colliq Workspace

Thank you for contributing to Colliq Workspace! We aim to maintain a high-quality, professional, and scalable codebase.

## Development Workflow

1. **Branch Naming Conventions:**
   - Features: `feat/feature-name`
   - Bug Fixes: `fix/bug-name`
   - Refactoring: `refactor/component-name`

2. **Commit Practices:**
   We follow structured commit messages. Please prefix your commits with the standard types:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `chore:` for dependency updates or minor tasks
   - `docs:` for documentation updates
   - `style:` for UI/CSS changes

3. **Coding Consistency:**
   - We use TypeScript for all logical files. Please ensure you are not relying on `any` excessively.
   - Run the linter (`npm run lint`) before committing.
   - Do NOT commit sensitive information or credentials to the repository. Always use `.env`.

4. **Design Philosophy:**
   - **Do not clutter the UI.** The interface should remain calm, spacious, and modern.
   - Avoid standard default HTML styles. Ensure custom micro-interactions are maintained using `Framer Motion`.
   - Adhere strictly to the existing typography and spacing paradigms defined in `styles.css`.
