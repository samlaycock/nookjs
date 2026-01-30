After making a change to the codebase:

- Ensure all tests pass.
- Run `bun fmt` to format the code.
- Run `bun lint` to check for linting issues.
- Run `bun typecheck` to verify type correctness.
- Update documentation as needed.
- Add a changeset using `bunx @changesets/cli add` to document the change.
- Review and commit changes with a descriptive message in conventional commit format.
