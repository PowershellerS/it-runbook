(function () {
"use strict";

var DATA = __DATA_JSON__;

/* ================= Icons ================= */
var ICON_PATHS = {
  book: '<path d="M5 4h11a2 2 0 0 1 2 2v13a1 1 0 0 1-1.5.87L12 17l-4.5 2.87A1 1 0 0 1 6 19V6a2 2 0 0 1 2-2Z"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.6 5.6L3 18l3 3 6.1-6.1a4 4 0 0 0 5.6-5.6l-2.8 2.8-2-2 2.8-2.8Z"/>',
  users: '<path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1"/><circle cx="9" cy="7" r="3.2"/><path d="M22 19v-1a3.8 3.8 0 0 0-2.7-3.65"/><path d="M15.2 4.3A3.8 3.8 0 0 1 17 11"/>',
  server: '<rect x="3" y="4" width="18" height="7" rx="1.6"/><rect x="3" y="13" width="18" height="7" rx="1.6"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  shield: '<path d="M12 3 4.5 6v6c0 4.7 3.2 8.4 7.5 9 4.3-.6 7.5-4.3 7.5-9V6Z"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-8.96A5.5 5.5 0 0 1 17.3 9.2 4 4 0 0 1 17 18H7Z"/>',
  database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5V18c0 1.55 3.4 2.8 7.5 2.8s7.5-1.25 7.5-2.8V5.5"/><path d="M4.5 11.8c0 1.55 3.4 2.8 7.5 2.8s7.5-1.25 7.5-2.8"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="9.5" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
  alert: '<path d="M12 3 2 20h20Z"/><path d="M12 9.5v4.2M12 16.8h.01"/>',
  network: '<circle cx="12" cy="4.5" r="2.2"/><circle cx="5" cy="19" r="2.2"/><circle cx="19" cy="19" r="2.2"/><path d="M12 6.7v4.3M12 11l-6 5.6M12 11l6 5.6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M10 11v6M14 11v6"/>',
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'
};
var ICON_KEYS = ["book", "wrench", "users", "server", "shield", "cloud", "database", "lock", "alert", "network"];

function iconSvg(key, extraAttrs) {
  var d = ICON_PATHS[key] || ICON_PATHS.book;
  return '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' + (extraAttrs || "") + '>' + d + '</svg>';
}

/* ================= Helpers ================= */
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function fmtDate(iso) {
  if (!iso) return "";
  try {
    var d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch (e) { return iso; }
}
function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "untitled";
}
function b64EncodeUtf8(str) { return btoa(unescape(encodeURIComponent(str))); }
function b64DecodeUtf8(str) { return decodeURIComponent(escape(atob(String(str).replace(/\n/g, "")))); }
function yamlStr(s) { return '"' + String(s == null ? "" : s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"'; }
function unquote(s) {
  s = String(s == null ? "" : s).trim();
  if ((s[0] === '"' && s[s.length - 1] === '"') || (s[0] === "'" && s[s.length - 1] === "'")) {
    s = s.slice(1, -1);
  }
  return s.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}
/* Best-effort parser for the simple front matter this site writes (and tolerant of
   small hand-edits made via GitHub's own web editor): "key: value", "key: [a, b]",
   and "key:" followed by "  - item" block lists. */
function parseFrontMatter(raw) {
  raw = String(raw || "").replace(/^﻿/, "");
  if (raw.slice(0, 3) !== "---") return { fm: {}, body: raw };
  var end = raw.indexOf("\n---", 3);
  if (end === -1) return { fm: {}, body: raw };
  var fmBlock = raw.slice(3, end).replace(/^\n/, "");
  var rest = raw.slice(end + 4);
  var body = rest.replace(/^\r?\n/, "");
  var fm = {};
  var lines = fmBlock.split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    var key = m[1], val = m[2].trim();
    if (val === "") {
      var items = [];
      while (i + 1 < lines.length && /^\s*-\s*/.test(lines[i + 1])) {
        i++;
        items.push(unquote(lines[i].replace(/^\s*-\s*/, "").trim()));
      }
      fm[key] = items;
    } else if (val[0] === "[" && val[val.length - 1] === "]") {
      var inner = val.slice(1, -1).trim();
      fm[key] = inner ? inner.split(",").map(function (s) { return unquote(s.trim()); }) : [];
    } else {
      fm[key] = unquote(val);
    }
  }
  return { fm: fm, body: body };
}
function findCategory(id) { return DATA.categories.filter(function (c) { return c.id === id; })[0]; }
function findPage(id) { return DATA.pages.filter(function (p) { return p.id === id; })[0]; }
function pagesInCategory(catId) { return DATA.pages.filter(function (p) { return p.categoryId === catId; }); }
function recentPages(n) {
  return DATA.pages.slice().sort(function (a, b) { return new Date(b.updatedAt) - new Date(a.updatedAt); }).slice(0, n);
}

function toast(msg, isError) {
  var el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast show" + (isError ? " error" : "");
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { el.className = "toast"; }, 3200);
}

/* ================= GitHub API ================= */
var GH_TOKEN_KEY = "runbook_gh_token";
function getToken() { try { return localStorage.getItem(GH_TOKEN_KEY) || ""; } catch (e) { return ""; } }
function setToken(t) { try { localStorage.setItem(GH_TOKEN_KEY, t); } catch (e) {} }
function clearToken() { try { localStorage.removeItem(GH_TOKEN_KEY); } catch (e) {} }
function repoConfigured() { return !!(DATA.repo && DATA.repo.owner && DATA.repo.name); }
function apiBase() { return "https://api.github.com/repos/" + DATA.repo.owner + "/" + DATA.repo.name; }

function ghFetch(url, opts) {
  opts = opts || {};
  var headers = Object.assign({
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  }, opts.headers || {});
  var token = getToken();
  if (token) headers["Authorization"] = "token " + token;
  return fetch(url, Object.assign({}, opts, { headers: headers })).then(function (res) {
    return res.text().then(function (text) {
      var body = null;
      try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
      return { ok: res.ok, status: res.status, body: body };
    });
  });
}

function verifyToken(token) {
  var headers = { "Accept": "application/vnd.github+json", "Authorization": "token " + token };
  return fetch("https://api.github.com/user", { headers: headers }).then(function (res) {
    if (!res.ok) return { ok: false };
    return res.json().then(function (j) { return { ok: true, login: j.login }; });
  }).catch(function () { return { ok: false }; });
}

function getFile(path) {
  return ghFetch(apiBase() + "/contents/" + path + "?ref=" + encodeURIComponent(DATA.repo.branch)).then(function (r) {
    if (!r.ok) return Promise.reject(new Error("Could not read " + path + " (status " + r.status + ")"));
    return { sha: r.body.sha, content: b64DecodeUtf8(r.body.content) };
  });
}
function putFile(path, content, message, sha) {
  var payload = { message: message, content: b64EncodeUtf8(content), branch: DATA.repo.branch };
  if (sha) payload.sha = sha;
  return ghFetch(apiBase() + "/contents/" + path, { method: "PUT", body: JSON.stringify(payload) }).then(function (r) {
    if (!r.ok) return Promise.reject(new Error((r.body && r.body.message) || ("GitHub error " + r.status)));
    return r.body;
  });
}
function deleteFile(path, message, sha) {
  var payload = { message: message, sha: sha, branch: DATA.repo.branch };
  return ghFetch(apiBase() + "/contents/" + path, { method: "DELETE", body: JSON.stringify(payload) }).then(function (r) {
    if (!r.ok) return Promise.reject(new Error((r.body && r.body.message) || ("GitHub error " + r.status)));
    return r.body;
  });
}

function pollForRebuild() {
  if (!repoConfigured()) return;
  var tries = 0;
  var startedAt = Date.now();
  var timer = setInterval(function () {
    tries++;
    ghFetch(apiBase() + "/actions/runs?per_page=1").then(function (r) {
      if (r.ok && r.body && r.body.workflow_runs && r.body.workflow_runs[0]) {
        var run = r.body.workflow_runs[0];
        var runStarted = new Date(run.created_at || run.run_started_at || 0).getTime();
        if (runStarted >= startedAt - 15000 && run.status === "completed") {
          clearInterval(timer);
          toast("Published — refreshing…");
          setTimeout(function () { location.reload(); }, 1200);
        }
      }
      if (tries >= 20) clearInterval(timer);
    }).catch(function () {});
  }, 6000);
}

/* ================= Modal plumbing ================= */
function closeModal() { document.getElementById("modalRoot").innerHTML = ""; }
function openModal(html) {
  document.getElementById("modalRoot").innerHTML =
    '<div class="modal-backdrop" id="modalBackdrop">' + html + "</div>";
  document.getElementById("modalBackdrop").addEventListener("mousedown", function (e) {
    if (e.target.id === "modalBackdrop") closeModal();
  });
}

function openTokenModal(onSuccess) {
  var url = "";
  if (repoConfigured()) {
    url = "https://github.com/settings/personal-access-tokens/new?name=" +
      encodeURIComponent("Runbook editing (" + DATA.repo.name + ")") +
      "&description=" + encodeURIComponent("Lets the Runbook site create, edit, and delete docs in this repo.") +
      "&target_name=" + encodeURIComponent(DATA.repo.owner) +
      "&repositories[]=" + encodeURIComponent(DATA.repo.name) +
      "&contents=write";
  }
  openModal(
    '<div class="modal modal-sm">' +
      '<div class="modal-head"><h3>Connect GitHub to edit</h3><button type="button" id="tokenX">' + iconSvg("x") + "</button></div>" +
      '<div class="modal-body">' +
        '<div class="token-box">Editing writes directly to this repo, so you\'ll need a personal GitHub access token scoped to just this repository.' +
          "<ol>" +
            '<li>Click <a href="' + url + '" target="_blank" rel="noopener">create a token</a> (opens GitHub, pre-filled)</li>' +
            '<li>Confirm "Only select repositories" has <b>' + esc(DATA.repo.name) + "</b> selected</li>" +
            '<li>Under "Repository permissions," set <b>Contents</b> to <b>Read and write</b></li>' +
            "<li>Click Generate token, then copy it and paste it below</li>" +
          "</ol>" +
        "</div>" +
        '<div class="field"><label>Personal access token</label><input type="password" id="tokenInput" placeholder="github_pat_…" autocomplete="off"></div>' +
        '<div class="form-error" id="tokenErr"></div>' +
      "</div>" +
      '<div class="modal-foot"><button class="btn-secondary" type="button" id="tokenCancel">Cancel</button><button class="btn-primary" type="button" id="tokenSave">Connect</button></div>' +
    "</div>"
  );
  document.getElementById("tokenX").onclick = closeModal;
  document.getElementById("tokenCancel").onclick = closeModal;
  document.getElementById("tokenSave").onclick = function () {
    var val = document.getElementById("tokenInput").value.trim();
    var errEl = document.getElementById("tokenErr");
    errEl.className = "form-error";
    if (!val) { errEl.textContent = "Paste your token first."; errEl.className = "form-error show"; return; }
    var btn = document.getElementById("tokenSave");
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Verifying…';
    verifyToken(val).then(function (res) {
      if (!res.ok) {
        errEl.textContent = "That token didn't work. Double check it was scoped to this repo with Contents: Read and write.";
        errEl.className = "form-error show";
        btn.disabled = false; btn.textContent = "Connect";
        return;
      }
      setToken(val);
      closeModal();
      refreshAccountPanel();
      toast("Connected as " + res.login);
      if (onSuccess) onSuccess();
    });
  };
}

function ensureConnected(cb) {
  var token = getToken();
  if (!token) { openTokenModal(cb); return; }
  verifyToken(token).then(function (res) {
    if (!res.ok) { clearToken(); openTokenModal(cb); return; }
    cb();
  });
}

function refreshAccountPanel() {
  var el = document.getElementById("accountPanel");
  if (!el) return;
  if (!repoConfigured()) { el.innerHTML = ""; return; }
  var token = getToken();
  if (!token) {
    el.innerHTML = '<div class="gh-account"><button type="button" class="link" id="connectBtn">Connect GitHub to edit →</button></div>';
    document.getElementById("connectBtn").onclick = function () { openTokenModal(function () {}); };
    return;
  }
  el.innerHTML = '<div class="gh-account"><span class="spinner dark"></span></div>';
  verifyToken(token).then(function (res) {
    if (!res.ok) {
      clearToken();
      el.innerHTML = '<div class="gh-account"><button type="button" class="link" id="connectBtn">Connect GitHub to edit →</button></div>';
      document.getElementById("connectBtn").onclick = function () { openTokenModal(function () {}); };
      return;
    }
    el.innerHTML = '<div class="gh-account"><span class="who">Connected as ' + esc(res.login) + '</span><button type="button" class="link" id="disconnectBtn">Disconnect</button></div>';
    document.getElementById("disconnectBtn").onclick = function () { clearToken(); refreshAccountPanel(); toast("Disconnected"); };
  });
}

/* ================= Category creation ================= */
var pendingPageDraft = null;

function openCategoryModal(fromPageModal) {
  var selectedIcon = "book";
  openModal(
    '<div class="modal">' +
      '<div class="modal-head"><h3>New category</h3><button type="button" id="catX">' + iconSvg("x") + "</button></div>" +
      '<div class="modal-body">' +
        '<div class="field"><label>Name</label><input type="text" id="catName" placeholder="e.g. Security &amp; Compliance"></div>' +
        '<div class="field"><label>Description <span class="opt">(optional)</span></label><textarea id="catDesc" placeholder="What kind of docs live here?"></textarea></div>' +
        '<div class="field"><label>Icon</label><div class="icon-picker" id="iconPicker"></div></div>' +
        '<div class="form-error" id="catErr"></div>' +
      "</div>" +
      '<div class="modal-foot"><button class="btn-secondary" type="button" id="catCancel">Cancel</button><button class="btn-primary" type="button" id="catSave">Create category</button></div>' +
    "</div>"
  );
  var picker = document.getElementById("iconPicker");
  picker.innerHTML = ICON_KEYS.map(function (k) {
    return '<button type="button" class="icon-opt' + (k === selectedIcon ? " selected" : "") + '" data-icon="' + k + '">' + iconSvg(k) + "</button>";
  }).join("");
  Array.prototype.forEach.call(picker.querySelectorAll(".icon-opt"), function (btn) {
    btn.onclick = function () {
      selectedIcon = btn.getAttribute("data-icon");
      Array.prototype.forEach.call(picker.querySelectorAll(".icon-opt"), function (b) { b.classList.remove("selected"); });
      btn.classList.add("selected");
    };
  });
  document.getElementById("catX").onclick = function () { closeModal(); if (fromPageModal && pendingPageDraft) openPageModal(pendingPageDraft); };
  document.getElementById("catCancel").onclick = document.getElementById("catX").onclick;
  document.getElementById("catSave").onclick = function () {
    var name = document.getElementById("catName").value.trim();
    var desc = document.getElementById("catDesc").value.trim();
    var errEl = document.getElementById("catErr");
    errEl.className = "form-error";
    if (!name) { errEl.textContent = "Give the category a name."; errEl.className = "form-error show"; return; }
    var id = slugify(name);
    if (findCategory(id)) { errEl.textContent = "A category with that name already exists."; errEl.className = "form-error show"; return; }
    var btn = document.getElementById("catSave");
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Creating…';
    ensureConnected(function () {
      createCategory({ id: id, name: name, description: desc, icon: selectedIcon }).then(function () {
        closeModal();
        toast("Category created — rebuilding site…");
        pollForRebuild();
        if (fromPageModal && pendingPageDraft) {
          pendingPageDraft.categoryId = id;
          openPageModal(pendingPageDraft);
        } else {
          renderNav();
        }
      }).catch(function (err) {
        errEl.textContent = err.message || "Something went wrong.";
        errEl.className = "form-error show";
        btn.disabled = false; btn.textContent = "Create category";
      });
    });
  };
}

function createCategory(cat) {
  return getFile("content/categories.yml").then(function (f) {
    var maxOrder = DATA.categories.reduce(function (m, c) { return Math.max(m, c.order || 0); }, -1);
    var block = "\n- id: " + cat.id + "\n  name: " + yamlStr(cat.name) +
      (cat.description ? "\n  description: " + yamlStr(cat.description) : "") +
      "\n  icon: " + cat.icon + "\n  order: " + (maxOrder + 1) + "\n";
    var newContent = f.content.replace(/\n*$/, "\n") + block;
    return putFile("content/categories.yml", newContent, "Add category: " + cat.name, f.sha).then(function () {
      DATA.categories.push({ id: cat.id, name: cat.name, description: cat.description || "", icon: cat.icon, order: maxOrder + 1 });
    });
  });
}

/* ================= Page creation ================= */
function openPageModal(draft) {
  draft = draft || {};
  pendingPageDraft = draft;
  var editingPage = draft.__editingPage || null;
  if (!DATA.categories.length) {
    toast("Create a category first.", true);
    openCategoryModal(true);
    return;
  }
  var cats = DATA.categories;
  var selectedCat = draft.categoryId || cats[0].id;
  openModal(
    '<div class="modal">' +
      '<div class="modal-head"><h3>' + (editingPage ? "Edit page" : "New page") + '</h3><button type="button" id="pgX">' + iconSvg("x") + "</button></div>" +
      '<div class="modal-body">' +
        '<div class="field-row">' +
          '<div class="field"><label>Title</label><input type="text" id="pgTitle" placeholder="e.g. Resetting a locked account" value="' + esc(draft.title || "") + '"></div>' +
          '<div class="field"><label>Category</label><select id="pgCat"></select></div>' +
        "</div>" +
        '<button type="button" class="field-inline-link" id="pgNewCat">+ New category</button>' +
        '<div class="field"><label>Summary <span class="opt">(shown in lists)</span></label><input type="text" id="pgSummary" placeholder="One line describing this doc" value="' + esc(draft.summary || "") + '"></div>' +
        '<div class="field"><label>Tags <span class="opt">(comma separated)</span></label><input type="text" id="pgTags" placeholder="comma, separated, tags" value="' + esc(draft.tags || "") + '"></div>' +
        '<div class="field"><label>Content</label><textarea id="pgContent" placeholder="## Steps&#10;- First do this&#10;- Then this" rows="8">' + esc(draft.content || "") + "</textarea>" +
          '<span class="hint">Standard Markdown: ## heading, - bullet, `code`, fenced &#96;&#96;&#96; blocks, **bold**, links.</span>' +
        "</div>" +
        '<div class="form-error" id="pgErr"></div>' +
      "</div>" +
      '<div class="modal-foot"><button class="btn-secondary" type="button" id="pgCancel">Cancel</button><button class="btn-primary" type="button" id="pgSave">' + (editingPage ? "Save changes" : "Publish page") + "</button></div>" +
    "</div>"
  );
  var sel = document.getElementById("pgCat");
  sel.innerHTML = cats.map(function (c) { return '<option value="' + c.id + '"' + (c.id === selectedCat ? " selected" : "") + ">" + esc(c.name) + "</option>"; }).join("");
  document.getElementById("pgX").onclick = function () { pendingPageDraft = null; closeModal(); };
  document.getElementById("pgCancel").onclick = document.getElementById("pgX").onclick;
  document.getElementById("pgNewCat").onclick = function () {
    pendingPageDraft = readPageDraft();
    pendingPageDraft.__editingPage = editingPage;
    openCategoryModal(true);
  };
  document.getElementById("pgSave").onclick = function () {
    var d = readPageDraft();
    var errEl = document.getElementById("pgErr");
    errEl.className = "form-error";
    if (!d.title) { errEl.textContent = "Give the page a title."; errEl.className = "form-error show"; return; }
    var btn = document.getElementById("pgSave");
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> ' + (editingPage ? "Saving…" : "Publishing…");
    ensureConnected(function () {
      var action = editingPage ? updatePage(d, editingPage) : createPage(d);
      action.then(function (page) {
        pendingPageDraft = null;
        closeModal();
        toast(editingPage ? "Page updated — rebuilding site…" : "Page published — rebuilding site…");
        pollForRebuild();
        navigateTo(editingPage ? "#/page/" + page.id : "#/category/" + page.categoryId);
      }).catch(function (err) {
        errEl.textContent = err.message || "Something went wrong.";
        errEl.className = "form-error show";
        btn.disabled = false; btn.textContent = editingPage ? "Save changes" : "Publish page";
      });
    });
  };
}
function readPageDraft() {
  return {
    title: document.getElementById("pgTitle").value.trim(),
    categoryId: document.getElementById("pgCat").value,
    summary: document.getElementById("pgSummary").value.trim(),
    tags: document.getElementById("pgTags").value.trim(),
    content: document.getElementById("pgContent").value
  };
}
function tagsFromInput(tags) {
  return tags ? tags.split(",").map(function (t) { return t.trim(); }).filter(Boolean) : [];
}
function buildPageFileText(d, tagsArr) {
  var tagsYaml = "[" + tagsArr.map(yamlStr).join(", ") + "]";
  var front = "---\ntitle: " + yamlStr(d.title) + "\ncategory: " + d.categoryId +
    "\nsummary: " + yamlStr(d.summary) + "\ntags: " + tagsYaml + "\n---\n";
  return front + (d.content || "").replace(/\r\n/g, "\n");
}
function uniqueSlug(baseSlug, categoryId, excludePath) {
  var existingPaths = DATA.pages.map(function (p) { return p.path; }).filter(function (p) { return p !== excludePath; });
  var slug = baseSlug, n = 2;
  while (existingPaths.indexOf("content/pages/" + categoryId + "/" + slug + ".md") !== -1) {
    slug = baseSlug + "-" + n; n++;
  }
  return slug;
}
function createPage(d) {
  var slug = uniqueSlug(slugify(d.title), d.categoryId, null);
  var tagsArr = tagsFromInput(d.tags);
  var fileText = buildPageFileText(d, tagsArr);
  var path = "content/pages/" + d.categoryId + "/" + slug + ".md";
  return putFile(path, fileText, "Add page: " + d.title).then(function () {
    var now = new Date().toISOString();
    var page = {
      id: d.categoryId + "-" + slug, categoryId: d.categoryId, title: d.title, summary: d.summary,
      tags: tagsArr, contentHtml: "<p>" + esc(d.content || "").replace(/\n/g, "<br>") + "</p>",
      createdAt: now, updatedAt: now, path: path
    };
    DATA.pages.push(page);
    return page;
  });
}

/* ================= Page editing ================= */
function openEditPageModal(page) {
  ensureConnected(function () {
    openModal(
      '<div class="modal modal-sm"><div class="modal-body" style="align-items:center; text-align:center; padding:40px 22px;">' +
      '<span class="spinner dark"></span><p style="margin-top:10px; color:var(--ink-soft); font-size:13.5px;">Loading page…</p></div></div>'
    );
    getFile(page.path).then(function (f) {
      var parsed = parseFrontMatter(f.content);
      var draft = {
        title: parsed.fm.title || page.title,
        categoryId: findCategory(parsed.fm.category) ? parsed.fm.category : page.categoryId,
        summary: parsed.fm.summary != null ? parsed.fm.summary : (page.summary || ""),
        tags: (parsed.fm.tags && parsed.fm.tags.length ? parsed.fm.tags : (page.tags || [])).join(", "),
        content: parsed.body.replace(/\n+$/, ""),
        __editingPage: page
      };
      openPageModal(draft);
    }).catch(function (err) {
      closeModal();
      toast(err.message || "Could not load that page.", true);
    });
  });
}
function updatePage(d, originalPage) {
  var originalSlug = originalPage.path.split("/").pop().replace(/\.md$/, "");
  var newPath = "content/pages/" + d.categoryId + "/" + originalSlug + ".md";
  if (newPath !== originalPage.path) {
    // moving to a different category — avoid clashing with a page already there
    var slug = uniqueSlug(originalSlug, d.categoryId, originalPage.path);
    newPath = "content/pages/" + d.categoryId + "/" + slug + ".md";
  }
  var tagsArr = tagsFromInput(d.tags);
  var fileText = buildPageFileText(d, tagsArr);
  var isMove = newPath !== originalPage.path;

  var writeNew = isMove
    ? putFile(newPath, fileText, "Update page: " + d.title)
    : getFile(originalPage.path).then(function (f) { return putFile(newPath, fileText, "Update page: " + d.title, f.sha); });

  return writeNew.then(function () {
    if (!isMove) return Promise.resolve();
    return getFile(originalPage.path).then(function (f) {
      return deleteFile(originalPage.path, "Move page: " + d.title, f.sha);
    });
  }).then(function () {
    var now = new Date().toISOString();
    var newSlug = newPath.split("/").pop().replace(/\.md$/, "");
    var page = {
      id: d.categoryId + "-" + newSlug, categoryId: d.categoryId, title: d.title, summary: d.summary,
      tags: tagsArr, contentHtml: "<p>" + esc(d.content || "").replace(/\n/g, "<br>") + "</p>",
      createdAt: originalPage.createdAt, updatedAt: now, path: newPath
    };
    DATA.pages = DATA.pages.filter(function (p) { return p.id !== originalPage.id; });
    DATA.pages.push(page);
    return page;
  });
}

/* ================= Delete ================= */
function openDeleteModal(page) {
  openModal(
    '<div class="modal modal-sm">' +
      '<div class="modal-head"><h3>Delete page</h3><button type="button" id="delX">' + iconSvg("x") + "</button></div>" +
      '<div class="modal-body">' +
        '<div class="delete-warning">Delete <b>' + esc(page.title) + "</b>? This removes the page from the repo and can't be undone from here — the file stays in GitHub's commit history if it ever needs to be restored.</div>" +
        '<div class="form-error" id="delErr"></div>' +
      "</div>" +
      '<div class="modal-foot"><button class="btn-secondary" type="button" id="delCancel">Cancel</button><button class="btn-danger" type="button" id="delConfirm">Delete page</button></div>' +
    "</div>"
  );
  document.getElementById("delX").onclick = closeModal;
  document.getElementById("delCancel").onclick = closeModal;
  document.getElementById("delConfirm").onclick = function () {
    var btn = document.getElementById("delConfirm");
    var errEl = document.getElementById("delErr");
    errEl.className = "form-error";
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Deleting…';
    ensureConnected(function () {
      deletePageRemote(page).then(function () {
        closeModal();
        toast("Page deleted — rebuilding site…");
        pollForRebuild();
        navigateTo("#/category/" + page.categoryId);
      }).catch(function (err) {
        errEl.textContent = err.message || "Something went wrong.";
        errEl.className = "form-error show";
        btn.disabled = false; btn.textContent = "Delete page";
      });
    });
  };
}
function deletePageRemote(page) {
  return getFile(page.path).then(function (f) {
    return deleteFile(page.path, "Delete page: " + page.title, f.sha);
  }).then(function () {
    DATA.pages = DATA.pages.filter(function (p) { return p.id !== page.id; });
  });
}

/* ================= Rendering ================= */
function setBreadcrumb(html) { document.getElementById("breadcrumbText").innerHTML = html; }
function setEditLink(path) {
  var el = document.getElementById("editLink");
  if (path && DATA.editBase) { el.href = DATA.editBase + path; el.style.display = ""; }
  else { el.style.display = "none"; }
}

function renderNav() {
  var active = location.hash;
  var list = document.getElementById("categoryList");
  list.innerHTML = DATA.categories.map(function (c) {
    var isActive = active.indexOf("#/category/" + c.id) === 0;
    return '<button class="nav-item' + (isActive ? " active" : "") + '" data-view="category" data-id="' + c.id + '">' +
      iconSvg(c.icon) + "<span>" + esc(c.name) + '</span><span class="nav-count">' + pagesInCategory(c.id).length + "</span></button>";
  }).join("");
  Array.prototype.forEach.call(list.querySelectorAll(".nav-item"), function (btn) {
    btn.onclick = function () { location.hash = "#/category/" + btn.getAttribute("data-id"); closeSidebarMobile(); };
  });
  document.querySelector('.nav-item[data-view="home"]').classList.toggle("active", active === "" || active === "#/" || active === "#");
  var footer = document.getElementById("sidebarFooter");
  footer.innerHTML =
    '<div id="accountPanel"></div>' +
    (DATA.generatedAt ? '<div class="pub">Published ' + fmtDate(DATA.generatedAt) + "</div>" : "") +
    (repoConfigured() ? '<a class="repo-link" href="https://github.com/' + DATA.repo.owner + "/" + DATA.repo.name + '" target="_blank" rel="noopener">View repo on GitHub</a>' : "");
  refreshAccountPanel();
}

function pageCardHtml(p, cat) {
  return '<div class="page-card" data-page="' + p.id + '">' +
    '<div class="body">' +
      "<h4>" + esc(p.title) + "</h4>" +
      (p.summary ? "<p>" + esc(p.summary) + "</p>" : "") +
      '<div class="meta">' + (cat ? "<span>" + esc(cat.name) + "</span>" : "") + "<span>Updated " + fmtDate(p.updatedAt) + "</span>" +
        (p.tags && p.tags.length ? '<span class="tag-list">' + p.tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</span>" : "") +
      "</div>" +
    "</div>" +
    '<div class="card-actions">' +
      '<button type="button" class="icon-btn page-edit" data-page="' + p.id + '" title="Edit page">' + iconSvg("edit") + "</button>" +
      '<button type="button" class="icon-btn danger page-delete" data-page="' + p.id + '" title="Delete page">' + iconSvg("trash") + "</button>" +
    "</div>" +
  "</div>";
}

function wirePageCards(root) {
  Array.prototype.forEach.call(root.querySelectorAll(".page-card"), function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest(".page-delete") || e.target.closest(".page-edit")) return;
      location.hash = "#/page/" + card.getAttribute("data-page");
    });
  });
  wirePageCardActions(root);
}
function wirePageCardActions(root) {
  Array.prototype.forEach.call(root.querySelectorAll(".page-delete"), function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var page = findPage(btn.getAttribute("data-page"));
      if (page) openDeleteModal(page);
    });
  });
  Array.prototype.forEach.call(root.querySelectorAll(".page-edit"), function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var page = findPage(btn.getAttribute("data-page"));
      if (page) openEditPageModal(page);
    });
  });
}

function renderHome() {
  setBreadcrumb("<b>Overview</b>");
  setEditLink("");
  var content = document.getElementById("content");
  var recents = recentPages(6);
  content.innerHTML =
    '<div class="stat-row">' +
      '<div class="stat-card"><div class="num">' + DATA.pages.length + '</div><div class="label">Pages</div></div>' +
      '<div class="stat-card"><div class="num">' + DATA.categories.length + '</div><div class="label">Categories</div></div>' +
      '<div class="stat-card"><div class="num">' + fmtDate(DATA.generatedAt) + '</div><div class="label">Last published</div></div>' +
    "</div>" +
    '<div class="section-title">Browse by category</div>' +
    '<div class="cat-grid">' + DATA.categories.map(function (c) {
      return '<button type="button" class="cat-card" data-cat="' + c.id + '">' +
        '<div class="ic">' + iconSvg(c.icon) + "</div>" +
        '<div><h3>' + esc(c.name) + "</h3><p>" + esc(c.description || "") + '</p><div class="count">' + pagesInCategory(c.id).length + " page" + (pagesInCategory(c.id).length === 1 ? "" : "s") + "</div></div>" +
      "</button>";
    }).join("") + "</div>" +
    (recents.length ?
      '<div class="section-title">Recently updated</div><div class="recent-list">' + recents.map(function (p) {
        var cat = findCategory(p.categoryId);
        return '<div class="recent-item" data-page="' + p.id + '"><div class="dot"></div><div style="flex:1; min-width:0;">' +
          '<div class="recent-item-row"><h4>' + esc(p.title) + (cat ? '<span class="tag-chip">' + esc(cat.name) + "</span>" : "") + "</h4>" +
          '<div class="card-actions">' +
            '<button type="button" class="icon-btn page-edit" data-page="' + p.id + '" title="Edit page">' + iconSvg("edit") + "</button>" +
            '<button type="button" class="icon-btn danger page-delete" data-page="' + p.id + '" title="Delete page">' + iconSvg("trash") + "</button>" +
          "</div></div>" +
          (p.summary ? "<p>" + esc(p.summary) + "</p>" : "") +
          '<div class="meta">Updated ' + fmtDate(p.updatedAt) + "</div>" +
        "</div></div>";
      }).join("") + "</div>" : "");

  Array.prototype.forEach.call(content.querySelectorAll(".cat-card"), function (btn) {
    btn.onclick = function () { location.hash = "#/category/" + btn.getAttribute("data-cat"); };
  });
  Array.prototype.forEach.call(content.querySelectorAll(".recent-item"), function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest(".page-delete") || e.target.closest(".page-edit")) return;
      location.hash = "#/page/" + card.getAttribute("data-page");
    });
  });
  wirePageCardActions(content);
}

function renderCategoryView(catId) {
  var cat = findCategory(catId);
  var content = document.getElementById("content");
  if (!cat) { renderHome(); return; }
  setBreadcrumb('<a href="#/">Overview</a> / <b>' + esc(cat.name) + "</b>");
  setEditLink("content/categories.yml");
  var pages = pagesInCategory(catId);
  content.innerHTML =
    '<div class="cat-header"><div class="ic">' + iconSvg(cat.icon) + "</div><div><h2>" + esc(cat.name) + "</h2><p>" + esc(cat.description || "") + "</p></div></div>" +
    (pages.length
      ? '<div class="page-list">' + pages.map(function (p) { return pageCardHtml(p, null); }).join("") + "</div>"
      : '<div class="empty-state">' + iconSvg("book") + "<p>No pages in this category yet. Use “New page” to add the first one.</p></div>");
  wirePageCards(content);
}

function renderPageView(pageId) {
  var page = findPage(pageId);
  var content = document.getElementById("content");
  if (!page) { renderHome(); return; }
  var cat = findCategory(page.categoryId);
  setBreadcrumb('<a href="#/">Overview</a> / <a href="#/category/' + page.categoryId + '">' + esc(cat ? cat.name : page.categoryId) + '</a> / <b>' + esc(page.title) + "</b>");
  setEditLink(page.path);
  content.innerHTML =
    '<div class="page-head">' +
      (cat ? '<div class="cat-chip">' + iconSvg(cat.icon) + " " + esc(cat.name) + "</div>" : "") +
      "<h1>" + esc(page.title) + "</h1>" +
      '<div class="meta-row"><div class="meta"><span>Created ' + fmtDate(page.createdAt) + "</span><span>Updated " + fmtDate(page.updatedAt) + "</span></div>" +
        '<div class="actions">' +
          '<button type="button" class="btn-secondary" id="pageEditBtn">' + iconSvg("edit") + " Edit page</button>" +
          '<button type="button" class="btn-danger btn-outline" id="pageDeleteBtn">' + iconSvg("trash") + " Delete page</button>" +
        "</div>" +
      "</div>" +
      (page.tags && page.tags.length ? '<div class="tag-list" style="margin-top:10px;">' + page.tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" : "") +
    "</div>" +
    '<div class="doc-body">' + page.contentHtml + "</div>";
  document.getElementById("pageEditBtn").onclick = function () { openEditPageModal(page); };
  document.getElementById("pageDeleteBtn").onclick = function () { openDeleteModal(page); };
}

function renderSearch(q) {
  setBreadcrumb('<a href="#/">Overview</a> / <b>Search</b>');
  setEditLink("");
  var content = document.getElementById("content");
  var needle = q.trim().toLowerCase();
  var results = !needle ? [] : DATA.pages.filter(function (p) {
    return (p.title + " " + p.summary + " " + (p.tags || []).join(" ")).toLowerCase().indexOf(needle) !== -1;
  });
  content.innerHTML =
    '<div class="section-title">' + (needle ? results.length + " result" + (results.length === 1 ? "" : "s") + ' for “' + esc(q) + '”' : "Start typing to search") + "</div>" +
    (results.length ? '<div class="page-list">' + results.map(function (p) { return pageCardHtml(p, findCategory(p.categoryId)); }).join("") + "</div>" :
      (needle ? '<div class="empty-state">' + iconSvg("search") + "<p>No pages match that search.</p></div>" : ""));
  wirePageCards(content);
}

/* ================= Router ================= */
function closeSidebarMobile() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("scrim").classList.remove("open");
}
function navigateTo(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}
function route() {
  closeSidebarMobile();
  var hash = location.hash || "#/";
  var m;
  if ((m = hash.match(/^#\/category\/(.+)$/))) { renderCategoryView(decodeURIComponent(m[1])); }
  else if ((m = hash.match(/^#\/page\/(.+)$/))) { renderPageView(decodeURIComponent(m[1])); }
  else if ((m = hash.match(/^#\/search\/(.*)$/))) { renderSearch(decodeURIComponent(m[1])); document.getElementById("searchInput").value = decodeURIComponent(m[1]); }
  else { renderHome(); }
  renderNav();
  window.scrollTo(0, 0);
}

/* ================= Wiring ================= */
function init() {
  document.querySelector('.nav-item[data-view="home"]').onclick = function () { location.hash = "#/"; closeSidebarMobile(); };
  document.getElementById("newPageBtn").onclick = function () {
    if (!repoConfigured()) { toast("Editing needs this site to be served from its GitHub repo.", true); return; }
    ensureConnected(function () { openPageModal(); });
  };
  document.getElementById("addCategoryBtn").onclick = function () {
    if (!repoConfigured()) { toast("Editing needs this site to be served from its GitHub repo.", true); return; }
    ensureConnected(function () { openCategoryModal(false); });
  };
  document.getElementById("menuBtn").onclick = function () {
    document.getElementById("sidebar").classList.toggle("open");
    document.getElementById("scrim").classList.toggle("open");
  };
  document.getElementById("scrim").onclick = closeSidebarMobile;

  var searchTimer;
  document.getElementById("searchInput").addEventListener("input", function (e) {
    clearTimeout(searchTimer);
    var v = e.target.value;
    searchTimer = setTimeout(function () {
      var target = "#/search/" + encodeURIComponent(v);
      if (location.hash !== target) history.replaceState(null, "", target);
      renderSearch(v);
    }, 150);
  });

  window.addEventListener("hashchange", route);
  route();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

})();
