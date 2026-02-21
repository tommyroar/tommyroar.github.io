# Gemini CLI Guidance: tommyroar.github.io

This repository serves as the central index for all projects. It uses a manual update and bundling process.

## Preferred Workflow: Manual Index Updates

When updating the project index or adding a new app stub:

1.  **Manage Projects**: Use the Python TUI to add or update projects.
    *   `uv run add`: Add a new project.
    *   `uv run edit`: List and edit existing projects.
    *   *These scripts automatically run the bundle process.*
2.  **Local Test**: Run `npm test` to ensure the bundling didn't break existing tests.
3.  **Deploy via PR**: Follow the deployment policy below: create a branch, push, and raise a PR against `main`.

## Deployment & Verification Policy

**Always Raise a Pull Request**: When making changes to the project index or codebase:
1. Create a new branch for your changes.
2. Commit and push the changes.
3. Raise a Pull Request (PR) against the `main` branch.
4. **The user must merge the PR.**

Once merged, the site will automatically redeploy via the GitHub Actions "Build Index" workflow.

**Avoid the "Verification Loop"**: Once changes are pushed to GitHub...

*   **Do not** use `gh run watch` or `gh run list` repeatedly to track the "Build Index" workflow.
*   **Do not** use `curl` or `web_fetch` to check if the site has updated.
*   **Trust the local bundle**: If `bundle_apps.js` and local tests pass, the deployment is assumed to be successful following the push.
