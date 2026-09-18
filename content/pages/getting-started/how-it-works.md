---
title: How This Runbook Works
category: getting-started
summary: Read this before writing your first page — how to add pages, and the formatting conventions.
tags: [meta, formatting]
---
This site is a living, shared documentation platform for the IT team. It's built from plain text files in this GitHub repository — anyone you add as a collaborator can edit it using nothing but GitHub's own web interface, and the public site rebuilds automatically within a minute or two of every change.

## Adding a page

1. Go to `content/pages/<category>/` for the category your page belongs in (for example `content/pages/it-ops/`).
2. Click **Add file → Create new file**.
3. Name it something short and URL-friendly, ending in `.md` (e.g. `reset-printer-queue.md`).
4. Start the file with a front matter block, then write the page in Markdown below it:

```
---
title: Resetting a Stuck Printer Queue
category: it-ops
summary: Clear a jammed print spooler without restarting the server.
tags: [printers, helpdesk]
---
Your content starts here...
```

5. Scroll down and click **Commit changes**. The site republishes automatically.

## Editing a page

Open the file, click the pencil icon (**Edit this file**), make your changes, and commit. Full edit history is kept automatically by GitHub.

## Formatting

The body of each file is standard Markdown: `## headings`, `- bullet lists`, `` `inline code` ``, fenced ``` ``` ``` code blocks, **bold**, and [links](https://example.com) all work exactly as they do anywhere else on GitHub.

## Adding a category

Edit `content/categories.yml`, add a new entry with an `id`, `name`, `description`, and an `icon` (pick from the options listed in that file), then create a matching folder under `content/pages/`.

## Good runbook habits

- Write steps in the order you would actually do them.
- Name the exact tool, command, or menu item — specifics beat generalities.
- Add tags for the systems or keywords a teammate might search for.
- If a doc goes stale, edit it. A wrong doc is worse than no doc.
