# Contributing to NookJS

Thank you for your interest in contributing to NookJS! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (latest version)
- Node.js 18+ (for compatibility testing)

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/nookjs.git
   cd nookjs
   ```
3. Install dependencies:
   ```bash
   bun install
   ```

### Development Workflow

After making a change to the codebase:

1. **Run tests**: Ensure all tests pass

   ```bash
   bun test
   ```

2. **Format code**: Format code with Bun's formatter

   ```bash
   bun fmt
   ```

3. **Lint**: Check for linting issues

   ```bash
   bun lint
   ```

4. **Typecheck**: Verify TypeScript correctness

   ```bash
   bun typecheck
   ```

5. **Update documentation**: Add or update documentation as needed

6. **Add changeset**: Document your change

   ```bash
   bunx @changesets/cli add
   ```

7. **Commit**: Review and commit with a descriptive message

## Project Structure

```
nookjs/
├── src/                  # Source code
│   ├── ast.ts           # AST parser
│   ├── interpreter.ts   # Main interpreter
│   ├── modules.ts       # ES module system
│   ├── sandbox.ts       # Simplified sandbox API
│   ├── resource-tracker.ts
│   └── index.ts         # Package entry point exports
├── test/                # Test files
├── docs/                # Documentation
├── conventions/         # Development conventions
├── package.json         # Scripts + package metadata
└── bun.lock             # Locked dependency versions
```

## Conventions

See the [conventions/](conventions/) directory for detailed guidelines on:

- [Code Style](conventions/CODE_STYLE.md)
- [TypeScript](conventions/TYPESCRIPT.md)
- [Testing](conventions/TESTING.md)
- [Bug Fixes](conventions/BUG_FIXES.md)

## Adding New Features

### Language Features

To add support for a new JavaScript feature:

1. **Parse**: Add the AST node type to `src/ast.ts` parser
2. **Evaluate**: Add evaluation logic in `src/interpreter.ts`
3. **Test**: Add comprehensive tests in `test/`
4. **Document**: Update `docs/README.md` with feature details

### Security Considerations

All new features must maintain the security guarantees:

- No access to `globalThis`, `eval`, or `Function`
- Prototype pollution prevention
- Sandbox isolation from host environment

## Reporting Issues

When reporting issues, include:

- A clear description of the problem
- Steps to reproduce
- Expected behavior vs actual behavior
- Environment details (OS, Bun version, etc.)
- Minimal reproduction code if possible

## Questions?

Feel free to open an issue for questions about contributing.
