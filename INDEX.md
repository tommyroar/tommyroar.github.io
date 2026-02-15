# Project Indexing Guide

This document describes how to register new applications and documentation sites with the [tommyroar.github.io](https://tommyroar.github.io) central index.

## 1. Create an App Stub

To add a new project, create a JSON file in the `apps/` directory (e.g., `apps/my-new-app.json`).

### Schema
```json
{
  "name": "Display Name",
  "root_path": "/path-to-app/",
  "docs_path": "/path-to-docs/",
  "description": "Markdown formatted description. Use 
 for newlines."
}
```

## 2. Automate Updates via GitHub Actions

To trigger an automatic index rebuild from a sub-repository after deployment, add the following step to your workflow. Note: You must provide a Personal Access Token (PAT) with `repo` scope as a secret.

```yaml
- name: Notify Central Index
  run: |
    curl -X POST 
      -H "Accept: application/vnd.github.v3+json" 
      -H "Authorization: token ${{ secrets.INDEX_UPDATE_TOKEN }}" 
      https://api.github.com/repos/tommyroar/tommyroar.github.io/dispatches 
      -d '{"event_type": "update_project"}'
```

## 3. Adding to Gemini CLI Context

To ensure Gemini CLI understands this process when working within this directory:

1. **Automatic Discovery**: Gemini CLI automatically scans the current working directory (CWD) and identifies this `INDEX.md` file in the file tree.
2. **Explicit Reference**: You can ask the agent: *"Read INDEX.md to understand how to register a new app."*
3. **Persistent Guidance**: For permanent "system-level" instructions across sessions, add a reference to this file in your `GEMINI.md`.

## 4. Local Verification

To test the index generation locally:
```bash
python3 scripts/generate_index.py
```
This will update `docs/index.md` based on all stubs in `apps/`.
