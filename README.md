# it-runbook

Shared IT process documentation for the team — a small "docs as code" site. Content lives as plain Markdown files in this repo; GitHub Pages publishes it automatically as a public, read-only website every time someone commits a change.

**Live site:** enable it once (see setup below), then it's `https://<your-username>.github.io/it-runbook/`.

## How to add or edit a page

No local setup needed — everything below can be done from github.com in a browser.

1. Go to `content/pages/<category>/` (e.g. `content/pages/it-ops/`).
2. To add a page: **Add file → Create new file**, name it `something.md`.
   To edit one: open the file → pencil icon (**Edit this file**).
3. Each page starts with a front-matter block, then Markdown:

   ```
   ---
   title: Resetting a Stuck Printer Queue
   category: it-ops
   summary: Clear a jammed print spooler without restarting the server.
   tags: [printers, helpdesk]
   ---
   Your content starts here, in normal Markdown.
   ```

4. Scroll down, click **Commit changes**. Within a minute or two the public site rebuilds and republishes automatically (check the **Actions** tab if you want to watch it happen).

To add a whole new category, edit `content/categories.yml` and create a matching folder under `content/pages/`.

## Giving colleagues edit access

Anyone who should be able to add or edit pages needs to be a **collaborator** on this repo: **Settings → Collaborators → Add people**. Anyone without collaborator access can still read the published site — they just can't edit source files here.

## One-time setup: turning on GitHub Pages

This only needs to be done once, right after the first push:

1. Go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push (or re-run) the workflow once — see the **Actions** tab. The first successful run prints the live URL.

## Local preview (optional)

If you have Python installed, you can preview the site locally before pushing:

```
pip install -r scripts/requirements.txt
python scripts/build.py
python -m http.server -d dist 8000
```

Then open `http://localhost:8000`.

## How it works

- `content/categories.yml` — the list of categories.
- `content/pages/<category>/*.md` — one file per page.
- `scripts/build.py` — reads the content above and generates `dist/index.html`, a single self-contained static page (search, categories, and page views all run client-side in the browser).
- `.github/workflows/pages.yml` — runs the build and publishes `dist/` to GitHub Pages on every push to `main`.
- Each page's "Created" and "Updated" dates come straight from this repo's own git history — no need to maintain them by hand.
