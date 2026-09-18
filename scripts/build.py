#!/usr/bin/env python3
"""
Builds the Runbook static site from the content/ folder into dist/.
Run via: python scripts/build.py
(The GitHub Actions workflow runs this automatically on every push.)
"""
import glob
import json
import os
import subprocess
import sys
import datetime

import yaml
import markdown as md

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content")
DIST = os.path.join(ROOT, "dist")


def git_dates(path):
    """Return (createdAt, updatedAt) ISO timestamps from git history for a file.
    Falls back to now() for both if the file has no git history yet (e.g. a
    local test build before the first commit)."""
    rel = os.path.relpath(path, ROOT)
    try:
        updated = subprocess.run(
            ["git", "log", "-1", "--format=%aI", "--", rel],
            cwd=ROOT, capture_output=True, text=True, check=True
        ).stdout.strip()
        created_out = subprocess.run(
            ["git", "log", "--diff-filter=A", "--follow", "--format=%aI", "--", rel],
            cwd=ROOT, capture_output=True, text=True, check=True
        ).stdout.strip().splitlines()
        created = created_out[-1] if created_out else updated
        if updated:
            return created or updated, updated
    except Exception:
        pass
    now = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    return now, now


def detect_repo_edit_base():
    """Best-effort https://github.com/<owner>/<repo>/edit/<branch>/ base URL,
    derived from the git remote and current branch. Falls back to '' (the
    Edit-on-GitHub link is simply hidden) if this isn't a git checkout yet."""
    try:
        remote = subprocess.run(
            ["git", "config", "--get", "remote.origin.url"],
            cwd=ROOT, capture_output=True, text=True, check=True
        ).stdout.strip()
        branch = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=ROOT, capture_output=True, text=True, check=True
        ).stdout.strip() or "main"
        # normalize git@github.com:owner/repo.git and https://github.com/owner/repo.git
        remote = remote.removesuffix(".git")
        if remote.startswith("git@github.com:"):
            owner_repo = remote.split(":", 1)[1]
        elif "github.com/" in remote:
            owner_repo = remote.split("github.com/", 1)[1]
        else:
            return ""
        return f"https://github.com/{owner_repo}/edit/{branch}/"
    except Exception:
        return ""


def parse_front_matter(text):
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    fm = yaml.safe_load(parts[1]) or {}
    body = parts[2].lstrip("\n")
    return fm, body


def load_categories():
    with open(os.path.join(CONTENT, "categories.yml"), encoding="utf-8") as f:
        cats = yaml.safe_load(f) or []
    for c in cats:
        c.setdefault("order", 0)
        c.setdefault("icon", "book")
        c.setdefault("description", "")
    return sorted(cats, key=lambda c: c["order"])


def load_pages():
    pages = []
    for path in sorted(glob.glob(os.path.join(CONTENT, "pages", "**", "*.md"), recursive=True)):
        with open(path, encoding="utf-8") as f:
            raw = f.read()
        fm, body = parse_front_matter(raw)
        rel = os.path.relpath(path, os.path.join(CONTENT, "pages"))
        slug = rel[:-3].replace(os.sep, "-")
        created, updated = git_dates(path)
        html_body = md.markdown(
            body,
            extensions=["fenced_code", "tables", "sane_lists", "toc"],
            output_format="html5",
        )
        title = fm.get("title") or slug
        if not fm.get("category"):
            print(f"WARNING: {rel} has no 'category' in its front matter — skipping.", file=sys.stderr)
            continue
        pages.append({
            "id": slug,
            "categoryId": fm["category"],
            "title": title,
            "summary": fm.get("summary", ""),
            "tags": fm.get("tags") or [],
            "contentHtml": html_body,
            "createdAt": created,
            "updatedAt": updated,
            "path": os.path.relpath(path, ROOT).replace(os.sep, "/"),
        })
    return pages


CSS = open(os.path.join(os.path.dirname(__file__), "template.css"), encoding="utf-8").read()
BODY_HTML = open(os.path.join(os.path.dirname(__file__), "template_body.html"), encoding="utf-8").read()
JS_TEMPLATE = open(os.path.join(os.path.dirname(__file__), "template.js"), encoding="utf-8").read()

PAGE_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Runbook</title>
<meta name="description" content="Shared IT process documentation.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>{css}</style>
</head>
<body>
{body}
<script>{js}</script>
</body>
</html>
"""


def main():
    categories = load_categories()
    pages = load_pages()
    data = {
        "generatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "categories": categories,
        "pages": pages,
        "editBase": detect_repo_edit_base(),
        "newPageBase": detect_repo_edit_base().replace("/edit/", "/new/"),
    }
    data_json = json.dumps(data).replace("</", "<\\/")
    js = JS_TEMPLATE.replace("__DATA_JSON__", data_json)
    html = PAGE_TEMPLATE.format(css=CSS, body=BODY_HTML, js=js)

    os.makedirs(DIST, exist_ok=True)
    with open(os.path.join(DIST, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    # GitHub Pages: don't run Jekyll processing on the output.
    open(os.path.join(DIST, ".nojekyll"), "w").close()

    print(f"Built {len(pages)} page(s) across {len(categories)} categor(y/ies) -> dist/index.html")


if __name__ == "__main__":
    main()
