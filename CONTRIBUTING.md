# Contributing

Thank you for taking interest in Ding. The project aims to stay simple, useful, and pleasant to maintain.

## Local Setup

```bash
cp .env.example .env
npm install
npm run dev
```

The server runs on `http://localhost:3000`. The dashboard dev server runs on `http://localhost:5173`. The widget demo is available at `http://localhost:3000/demo/` after the widget has been built.

## Useful Commands

```bash
npm run build
npm test
npm run check:size
```

## Pull Request Standard

- Keep each pull request focused.
- Include tests for server or widget behaviour when the behaviour changes.
- Keep the widget dependency budget tight.
- Update documentation when a public command, API, option, or deployment step changes.
- Run the build, tests, and bundle-size check before requesting review.

## Design Principles

- The dashboard should feel calm, direct, and operational.
- The widget should stay polite, fast, and small.
- Security defaults should favour self-hosters who may be deploying Ding for the first time.
- Documentation should be clear enough for a careful developer to follow without guesswork.

## Code Style

- Use TypeScript for all packages.
- Prefer small modules with plain data flow.
- Keep comments useful and rare.
- Avoid adding abstractions before there is a real pattern to name.
