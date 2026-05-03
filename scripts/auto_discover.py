"""Auto-discover GitHub repos with Pages deployments and create app stubs.

Walks every public repo under a GitHub user, checks each one for an enabled
GitHub Pages site whose URL is hosted under `<user>.github.io`, and writes a
JSON stub into `apps/` for any repo that isn't already registered.

Designed to run inside a GitHub Action with `GITHUB_TOKEN` available.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

OWNER = os.environ.get("DISCOVERY_OWNER", "tommyroar")
APPS_DIR = Path("apps")
GITHUB_API = "https://api.github.com"
TOKEN = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
USER_PAGES_HOST = f"{OWNER.lower()}.github.io"


def gh_request(path: str, params: dict | None = None) -> tuple[int, object]:
    url = f"{GITHUB_API}{path}"
    if params:
        from urllib.parse import urlencode
        url = f"{url}?{urlencode(params)}"
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    req.add_header("User-Agent", f"{OWNER}-auto-discover")
    if TOKEN:
        req.add_header("Authorization", f"Bearer {TOKEN}")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else None
    except urllib.error.HTTPError as e:
        return e.code, None
    except urllib.error.URLError as e:
        print(f"  ! network error for {path}: {e}", file=sys.stderr)
        return 0, None


def list_public_repos(owner: str) -> list[dict]:
    repos: list[dict] = []
    page = 1
    while True:
        status, data = gh_request(
            f"/users/{owner}/repos",
            {"per_page": 100, "page": page, "type": "owner", "sort": "updated"},
        )
        if status != 200 or not data:
            break
        repos.extend(data)
        if len(data) < 100:
            break
        page += 1
    return repos


def get_pages_info(owner: str, repo: str) -> dict | None:
    status, data = gh_request(f"/repos/{owner}/{repo}/pages")
    if status == 200 and isinstance(data, dict):
        return data
    return None


def make_stub(repo: dict, pages: dict) -> dict:
    """Build a JSON stub for a repo with Pages enabled."""
    name = repo["name"]
    pages_url = pages.get("html_url") or f"https://{USER_PAGES_HOST}/{name}/"
    if not pages_url.endswith("/"):
        pages_url += "/"

    if USER_PAGES_HOST in pages_url:
        root_path = pages_url.split(USER_PAGES_HOST, 1)[1] or "/"
    else:
        root_path = pages_url

    description = (repo.get("description") or "").strip()
    if not description:
        description = f"Auto-discovered project from {repo['full_name']}."

    tags: list[str] = []
    topics = repo.get("topics") or []
    if topics:
        tags.extend(t.replace("-", " ").title() for t in topics[:6])
    if "GitHub Pages" not in tags:
        tags.append("GitHub Pages")
    if repo.get("language"):
        lang = repo["language"]
        if lang not in tags:
            tags.append(lang)

    archived = repo.get("archived", False)
    status_value = "Archived" if archived else "Active"

    return {
        "name": name,
        "root_path": root_path,
        "link_label": "Live Site",
        "description": description,
        "status": status_value,
        "tags": tags,
        "source_url": repo.get("html_url"),
        "auto_discovered": True,
    }


def discover() -> int:
    if not APPS_DIR.exists():
        APPS_DIR.mkdir(parents=True)

    print(f"Discovering Pages-deployed repos for @{OWNER}...")
    if not TOKEN:
        print("  (no GITHUB_TOKEN set — using unauthenticated requests; rate limit may apply)")

    repos = list_public_repos(OWNER)
    print(f"  Found {len(repos)} public repos")

    created = 0
    refreshed = 0
    skipped = 0

    for repo in repos:
        name = repo["name"]
        # The user-page repo itself hosts this index — skip it.
        if name.lower() == f"{OWNER.lower()}.github.io":
            continue
        if repo.get("fork"):
            continue
        if repo.get("private"):
            continue

        pages = get_pages_info(OWNER, name)
        if not pages:
            continue

        pages_url = pages.get("html_url", "")
        if USER_PAGES_HOST not in pages_url:
            print(f"  - {name}: pages on custom domain ({pages_url}), skipping")
            continue

        stub_path = APPS_DIR / f"{name}.json"
        new_stub = make_stub(repo, pages)

        if stub_path.exists():
            try:
                existing = json.loads(stub_path.read_text())
            except json.JSONDecodeError:
                existing = {}
            if not existing.get("auto_discovered"):
                skipped += 1
                print(f"  = {name}: existing manual stub, leaving untouched")
                continue
            preserved_keys = ("description", "tags", "status", "link_label", "qr_code", "thumbnail")
            merged = {**new_stub}
            for key in preserved_keys:
                if key in existing:
                    merged[key] = existing[key]
            if merged != existing:
                stub_path.write_text(json.dumps(merged, indent=2) + "\n")
                refreshed += 1
                print(f"  ~ {name}: refreshed auto-discovered stub")
        else:
            stub_path.write_text(json.dumps(new_stub, indent=2) + "\n")
            created += 1
            print(f"  + {name}: created stub at {stub_path}")

    print(f"\nDone. created={created} refreshed={refreshed} skipped={skipped}")
    return 0


def main() -> None:
    sys.exit(discover())


if __name__ == "__main__":
    main()
