# SDK Development Guide

## Build/Test Commands
- Install dependencies: `pnpm install`
- Build: `pnpm run build` (runs code generation first)
- Generate contract code: `pnpm run gen`
- Test all: `pnpm test`
- Run single test: `pnpm vitest run src/path/to/file.spec.ts`
- Documentation: `pnpm run docs` or `pnpm run docs:watch`
- Lint: `pnpm run lint`

## Code Style Guidelines
- **TypeScript**: ES2023 target, strict mode
- **Formatting**: Uses Prettier with double quotes
- **Imports**: Group by external dependencies first, then internal
- **Naming**: camelCase for variables/functions, PascalCase for classes/types
- **Error Handling**: Prefer explicit error types, use `try/catch` with typed errors
- **Testing**: Use Vitest with describe/it pattern, files named `.spec.ts`
- **Documentation**: Use TypeDoc for API documentation
- **Project Structure**: Source in `src/`, built files in `lib/`, tests colocated with implementation
- **Linting**: ESLint with custom rules (ts-comment ban disabled)

## Commit Conventions
- Follow Angular commit conventions (https://www.conventionalcommits.org/)
- Format: `<type>[optional scope]: <description>`
- Types: feat, fix, docs, style, refactor, test, chore, etc.
- Breaking changes: Add `!` after type/scope (e.g., `feat!: breaking change`)

## Project References
- Branch model and workflow: See `docs/project-branch-model.md`