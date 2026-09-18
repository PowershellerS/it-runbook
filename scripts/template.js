(function(){
  "use strict";
  var DATA = __DATA_JSON__;

  var ICONS = {
    book: '<path d="M5 4h11a2 2 0 0 1 2 2v13a1 1 0 0 1-1.5.87L12 17l-4.5 2.87A1 1 0 0 1 6 19V6a2 2 0 0 1 2-2Z"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.6 5.1L4 16.5V20h3.5l5.1-5.1a4 4 0 0 0 5.1-5.6l-2.6 2.6-2-2Z"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M22 20c0-2.6-1.9-4.8-4.5-5.6"/>',
    server: '<rect x="4" y="4" width="16" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="16" height="6.5" rx="1.5"/><circle cx="8" cy="7.2" r="0.9" fill="currentColor" stroke="none"/><circle cx="8" cy="16.7" r="0.9" fill="currentColor" stroke="none"/>',
    shield: '<path d="M12 3.5 5 6v6c0 4.5 3 7.4 7 8.5 4-1.1 7-4 7-8.5V6l-7-2.5Z"/>',
    cloud: '<path d="M7 18a4.5 4.5 0 0 1-.5-8.97A5.5 5.5 0 0 1 17.3 8 4 4 0 0 1 17 16H7Z"/>',
    database: '<ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6"/><path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/>',
    lock: '<rect x="5" y="10.5" width="14" height="9" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    alert: '<path d="M12 4 3 20h18L12 4Z"/><path d="M12 10.5v3.2" stroke-linecap="round"/><circle cx="12" cy="16.7" r="0.9" fill="currentColor" stroke="none"/>',
    network: '<circle cx="12" cy="4.5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M12 6.5v4M12 10.5 5 16M12 10.5l7 5.5"/>'
  };
  var ICON_KEYS = ['book','wrench','users','server','shield','cloud','database','lock','alert','network'];
  function svgIcon(key){ var d = ICONS[key] || ICONS.book; return '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>'; }
  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function el(tag, attrs, html){ var e=document.createElement(tag); if(attrs) for(var k in attrs) e.setAttribute(k, attrs[k]); if(html!==undefined) e.innerHTML=html; return e; }
  function timeAgo(iso){
    if(!iso) return '';
    var d = new Date(iso), s = Math.floor((Date.now()-d.getTime())/1000);
    if(s<60) return 'just now'; if(s<3600) return Math.floor(s/60)+'m ago'; if(s<86400) return Math.floor(s/3600)+'h ago';
    if(s<86400*30) return Math.floor(s/86400)+'d ago';
    return d.toLocaleDateString(undefined,{month:'short', day:'numeric', year:'numeric'});
  }
  function excerpt(s,n){ s=(s||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim(); return s.length>n? s.slice(0,n).trim()+'…' : s; }
  function uniq(arr){ return arr.filter(function(v,i){ return arr.indexOf(v)===i; }); }
  function showToast(msg, ms){
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(function(){ t.classList.remove('show'); }, ms||3200);
  }

  var state = { view:{type:'home'}, search:'' };
  function catById(id){ return DATA.categories.find(function(c){return c.id===id;}); }

  // ---------------- GitHub API (client-side, uses the viewer's own token) ----------------
  var GH_TOKEN_KEY = 'runbook_gh_token';
  function getToken(){ try{ return localStorage.getItem(GH_TOKEN_KEY) || ''; }catch(e){ return ''; } }
  function setToken(t){ try{ localStorage.setItem(GH_TOKEN_KEY, t); }catch(e){} }
  function clearToken(){ try{ localStorage.removeItem(GH_TOKEN_KEY); }catch(e){} }
  function repoConfigured(){ return !!(DATA.repo && DATA.repo.owner && DATA.repo.name); }
  function apiBase(){ return 'https://api.github.com/repos/'+DATA.repo.owner+'/'+DATA.repo.name; }
  function b64EncodeUtf8(str){ return btoa(unescape(encodeURIComponent(str))); }
  function b64DecodeUtf8(str){ return decodeURIComponent(escape(atob(str.replace(/\n/g,'')))); }
  function slugify(s){ return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60) || 'untitled'; }
  function yamlStr(s){ return '"'+String(s==null?'':s).replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"'; }

  function ghFetch(url, opts){
    opts = opts || {};
    var headers = Object.assign({'Accept':'application/vnd.github+json'}, opts.headers||{});
    var token = getToken();
    if(token) headers['Authorization'] = 'token ' + token;
    return fetch(url, Object.assign({}, opts, {headers: headers})).then(function(res){
      return res.text().then(function(text){
        var body = {}; try{ body = text ? JSON.parse(text) : {}; }catch(e){}
        return {ok: res.ok, status: res.status, body: body};
      });
    });
  }
  function verifyToken(token){
    return fetch('https://api.github.com/user', {headers:{'Authorization':'token '+token, 'Accept':'application/vnd.github+json'}})
      .then(function(res){ return res.ok ? res.json() : Promise.reject(res.status); });
  }

  // ---------------- Nav / breadcrumb / shell ----------------
  function renderNav(){
    var list = document.getElementById('categoryList');
    list.innerHTML = '';
    DATA.categories.slice().sort(function(a,b){return (a.order||0)-(b.order||0);}).forEach(function(c){
      var count = DATA.pages.filter(function(p){return p.categoryId===c.id;}).length;
      var btn = el('button', {'class':'nav-item'+(state.view.type==='category'&&state.view.id===c.id?' active':'')});
      btn.innerHTML = svgIcon(c.icon)+'<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+escapeHtml(c.name)+'</span><span class="count">'+count+'</span>';
      btn.addEventListener('click', function(){ setView({type:'category', id:c.id}); closeSidebarMobile(); });
      list.appendChild(btn);
    });
    document.querySelectorAll('.nav-item[data-view]').forEach(function(b){ b.classList.toggle('active', state.view.type===b.getAttribute('data-view')); });
  }
  function renderBreadcrumb(){
    var t = document.getElementById('breadcrumbText');
    if(state.view.type==='home') t.innerHTML = '<b>Overview</b>';
    else if(state.view.type==='category'){ var c=catById(state.view.id); t.innerHTML = '<button data-nav="home">Overview</button> <span class="muted">/</span> <b>'+escapeHtml(c?c.name:'Category')+'</b>'; }
    else if(state.view.type==='page'){ var p=DATA.pages.find(function(x){return x.id===state.view.id;}); var c2=p?catById(p.categoryId):null;
      t.innerHTML = '<button data-nav="home">Overview</button> <span class="muted">/</span> '+(c2?'<button data-nav="cat" data-id="'+c2.id+'">'+escapeHtml(c2.name)+'</button> <span class="muted">/</span> ':'')+'<b>'+escapeHtml(p?p.title:'Page')+'</b>'; }
    else if(state.view.type==='search') t.innerHTML = '<b>Search results</b>';
    t.querySelectorAll('[data-nav="home"]').forEach(function(b){ b.addEventListener('click', function(){ setView({type:'home'}); }); });
    t.querySelectorAll('[data-nav="cat"]').forEach(function(b){ b.addEventListener('click', function(){ setView({type:'category', id:b.getAttribute('data-id')}); }); });
  }
  function updateEditLink(){
    var a = document.getElementById('editLink');
    if(!DATA.editBase){ a.style.display = 'none'; return; }
    if(state.view.type==='page'){
      var p = DATA.pages.find(function(x){return x.id===state.view.id;});
      if(p){ a.href = DATA.editBase + p.path; a.style.display=''; a.lastChild.textContent = ' Edit on GitHub'; return; }
    }
    a.style.display = 'none';
  }
  function setView(v){ state.view=v; window.scrollTo(0,0); render(); }
  function closeSidebarMobile(){ document.getElementById('sidebar').classList.remove('open'); document.getElementById('scrim').classList.remove('show'); }

  function render(){
    renderNav(); renderBreadcrumb(); updateEditLink();
    var content = document.getElementById('content');
    content.innerHTML = '';
    if(state.view.type==='home') content.appendChild(renderHome());
    else if(state.view.type==='category') content.appendChild(renderCategory(state.view.id));
    else if(state.view.type==='page') content.appendChild(renderPage(state.view.id));
    else if(state.view.type==='search') content.appendChild(renderSearch(state.search));
  }

  function renderHome(){
    var wrap = document.createDocumentFragment();
    var hero = el('div', {'class':'hero'});
    hero.innerHTML = '<h2>IT process documentation, kept current by the whole team.</h2><p>Every runbook, checklist and setup guide your team relies on — searchable in one place, editable right here.</p>';
    wrap.appendChild(hero);
    var stats = [
      {n:DATA.pages.length, l:'Pages'},
      {n:DATA.categories.length, l:'Categories'},
      {n:DATA.pages.filter(function(p){var d=(Date.now()-new Date(p.updatedAt).getTime())/86400000; return d<=7;}).length, l:'Updated this week'},
      {n:new Date(DATA.generatedAt).toLocaleDateString(undefined,{month:'short',day:'numeric'}), l:'Last published'}
    ];
    var row = el('div', {'class':'stat-row'});
    stats.forEach(function(s){ var t=el('div',{'class':'stat-tile'}); t.innerHTML='<div class="num">'+s.n+'</div><div class="label">'+s.l+'</div>'; row.appendChild(t); });
    wrap.appendChild(row);
    var st = el('div', {'class':'section-title'}); st.innerHTML = '<h3>Browse by category</h3>'; wrap.appendChild(st);
    var grid = el('div', {'class':'cat-grid'});
    DATA.categories.slice().sort(function(a,b){return (a.order||0)-(b.order||0);}).forEach(function(c){
      var count = DATA.pages.filter(function(p){return p.categoryId===c.id;}).length;
      var card = el('button', {'class':'cat-card'});
      card.innerHTML = '<div class="cat-icon">'+svgIcon(c.icon)+'</div><div><div class="title">'+escapeHtml(c.name)+'</div><div class="desc">'+escapeHtml(c.description||'')+'</div><div class="meta">'+count+' page'+(count===1?'':'s')+'</div></div>';
      card.addEventListener('click', function(){ setView({type:'category', id:c.id}); });
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    var st2 = el('div', {'class':'section-title'}); st2.innerHTML = '<h3>Recently updated</h3>'; wrap.appendChild(st2);
    var recent = DATA.pages.slice().sort(function(a,b){return new Date(b.updatedAt)-new Date(a.updatedAt);}).slice(0,6);
    var list = el('div', {'class':'page-list'});
    recent.forEach(function(p){ list.appendChild(pageCard(p)); });
    wrap.appendChild(list);
    return wrap;
  }

  function pageCard(p){
    var c = catById(p.categoryId);
    var card = el('button', {'class':'page-card'});
    card.innerHTML =
      '<div class="catdot"></div>'+
      '<div class="body">'+
        '<div class="row1"><span class="title">'+escapeHtml(p.title)+'</span>'+(state.view.type!=='category'&&c?'<span class="badge">'+escapeHtml(c.name)+'</span>':'')+'</div>'+
        '<div class="summary">'+escapeHtml(excerpt(p.summary || p.contentHtml, 140))+'</div>'+
        '<div class="metarow"><span>Updated '+timeAgo(p.updatedAt)+'</span></div>'+
      '</div>';
    card.addEventListener('click', function(){ setView({type:'page', id:p.id}); });
    return card;
  }

  function renderCategory(catId){
    var wrap = document.createDocumentFragment();
    var c = catById(catId);
    if(!c){ setView({type:'home'}); return wrap; }
    var head = el('div', {'class':'cat-header'});
    head.innerHTML = '<div class="cat-icon">'+svgIcon(c.icon)+'</div><div><h2>'+escapeHtml(c.name)+'</h2><p>'+escapeHtml(c.description||'')+'</p></div>';
    wrap.appendChild(head);
    var pages = DATA.pages.filter(function(p){return p.categoryId===catId;}).sort(function(a,b){return new Date(b.updatedAt)-new Date(a.updatedAt);});
    if(!pages.length){ var e=el('div',{'class':'empty-state'}); e.innerHTML=svgIcon('book')+'<p>Nothing filed under '+escapeHtml(c.name)+' yet.</p>'; wrap.appendChild(e); }
    else{ var list=el('div',{'class':'page-list'}); pages.forEach(function(p){list.appendChild(pageCard(p));}); wrap.appendChild(list); }
    return wrap;
  }

  function renderPage(pageId){
    var wrap = document.createDocumentFragment();
    var p = DATA.pages.find(function(x){return x.id===pageId;});
    if(!p){ var e=el('div',{'class':'empty-state'}); e.innerHTML=svgIcon('alert')+'<p>This page is unavailable.</p>'; wrap.appendChild(e); return wrap; }
    var c = catById(p.categoryId);
    var doc = el('div', {'class':'doc'});
    var tagsHtml = (p.tags||[]).map(function(t){ return '<button class="tag-chip">#'+escapeHtml(t)+'</button>'; }).join('');
    var head = el('div', {'class':'doc-head'});
    head.innerHTML = (c?'<span class="badge">'+escapeHtml(c.name)+'</span>':'')+'<h2 style="margin-top:8px;">'+escapeHtml(p.title)+'</h2>'+
      (tagsHtml?'<div class="doc-tags">'+tagsHtml+'</div>':'')+
      '<div class="doc-meta"><span>Created '+timeAgo(p.createdAt)+'</span><span>Updated '+timeAgo(p.updatedAt)+'</span></div>';
    doc.appendChild(head);
    doc.appendChild(el('div', {'class':'doc-body'}, p.contentHtml));
    wrap.appendChild(doc);
    doc.querySelectorAll('.tag-chip').forEach(function(chip){
      chip.addEventListener('click', function(){ var tag=chip.textContent.replace('#',''); document.getElementById('searchInput').value=tag; state.search=tag; setView({type:'search'}); });
    });
    return wrap;
  }

  function matchPages(q){
    q=(q||'').toLowerCase().trim(); if(!q) return [];
    return DATA.pages.filter(function(p){
      return (p.title||'').toLowerCase().indexOf(q)>-1 || (p.summary||'').toLowerCase().indexOf(q)>-1 ||
        (p.contentHtml||'').toLowerCase().indexOf(q)>-1 || (p.tags||[]).some(function(t){return t.toLowerCase().indexOf(q)>-1;});
    }).sort(function(a,b){return new Date(b.updatedAt)-new Date(a.updatedAt);});
  }
  function renderSearch(q){
    var wrap = document.createDocumentFragment();
    var results = matchPages(q);
    var st = el('div', {'class':'section-title'}); st.innerHTML = '<h3>Results for “'+escapeHtml(q)+'”</h3><span>'+results.length+' found</span>'; wrap.appendChild(st);
    if(!results.length){ var e=el('div',{'class':'empty-state'}); e.innerHTML=svgIcon('book')+'<p>No pages match “'+escapeHtml(q)+'”.</p>'; wrap.appendChild(e); }
    else{ var list=el('div',{'class':'page-list'}); results.forEach(function(p){list.appendChild(pageCard(p));}); wrap.appendChild(list); }
    return wrap;
  }

  // ---------------- Modals ----------------
  function closeModal(){ document.getElementById('modalRoot').innerHTML = ''; }

  function openTokenModal(onSuccess){
    var root = document.getElementById('modalRoot');
    var backdrop = el('div', {'class':'modal-backdrop'});
    var modal = el('div', {'class':'modal'});
    var settingsUrl = repoConfigured()
      ? 'https://github.com/settings/personal-access-tokens/new?name=Runbook%20editing&contents=write&repositories='+encodeURIComponent(DATA.repo.name)
      : 'https://github.com/settings/personal-access-tokens/new';
    modal.innerHTML =
      '<div class="modal-head"><h3>Connect GitHub to edit</h3><button class="modal-close">&times;</button></div>'+
      '<div class="modal-body">'+
        '<div class="token-box">'+
          'Editing writes directly to this repo through GitHub’s API, so it needs your own GitHub access token — kept only in this browser, never sent anywhere but github.com.'+
          '<ol>'+
            '<li>Open <a href="'+settingsUrl+'" target="_blank" rel="noopener">Create a fine-grained token</a> (opens GitHub).</li>'+
            '<li>Under <b>Repository access</b>, choose <b>Only select repositories</b> and pick just this repo'+(repoConfigured()?' (<code>'+escapeHtml(DATA.repo.name)+'</code>)':'')+'.</li>'+
            '<li>Under <b>Permissions → Repository permissions</b>, set <b>Contents</b> to <b>Read and write</b>.</li>'+
            '<li>Click <b>Generate token</b>, copy it, and paste it below.</li>'+
          '</ol>'+
        '</div>'+
        '<div class="field"><label>Personal access token</label><input type="text" id="tokenInput" placeholder="github_pat_..." autocomplete="off" spellcheck="false"></div>'+
        '<div class="form-error" id="tokenErr" style="display:none;"></div>'+
      '</div>'+
      '<div class="modal-foot"><button class="btn-ghost" id="tokenCancel">Cancel</button><button class="btn-primary" id="tokenSave">Connect</button></div>';
    backdrop.appendChild(modal); root.innerHTML=''; root.appendChild(backdrop);
    backdrop.addEventListener('click', function(e){ if(e.target===backdrop) closeModal(); });
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('#tokenCancel').addEventListener('click', closeModal);
    modal.querySelector('#tokenInput').focus();
    modal.querySelector('#tokenSave').addEventListener('click', function(){
      var val = modal.querySelector('#tokenInput').value.trim();
      var errBox = modal.querySelector('#tokenErr');
      var btn = modal.querySelector('#tokenSave');
      if(!val){ errBox.textContent='Paste a token first.'; errBox.style.display='block'; return; }
      btn.innerHTML = '<span class="spinner"></span> Checking…'; btn.disabled = true;
      verifyToken(val).then(function(user){
        setToken(val);
        refreshAccountPanel();
        closeModal();
        showToast('Connected as '+(user.login||'GitHub user'));
        if(onSuccess) onSuccess();
      }).catch(function(){
        errBox.textContent = 'That token didn’t work — double check it was created with Contents: Read and write access to this repo.';
        errBox.style.display = 'block';
        btn.textContent = 'Connect'; btn.disabled = false;
      });
    });
  }

  function ensureConnected(cb){
    var token = getToken();
    if(token){ cb(); return; }
    openTokenModal(cb);
  }

  var pendingPageDraft = null;

  function openCategoryModal(fromPageModal){
    var root = document.getElementById('modalRoot');
    var selIcon = 'book';
    var backdrop = el('div', {'class':'modal-backdrop'});
    var modal = el('div', {'class':'modal'});
    modal.innerHTML =
      '<div class="modal-head"><h3>New category</h3><button class="modal-close">&times;</button></div>'+
      '<div class="modal-body">'+
        '<div class="field"><label>Name</label><input type="text" id="catName" placeholder="e.g. Security &amp; Compliance"></div>'+
        '<div class="field"><label>Description</label><textarea id="catDesc" style="min-height:70px;" placeholder="What kind of docs live here?"></textarea></div>'+
        '<div class="field"><label>Icon</label><div class="icon-picker" id="iconPicker"></div></div>'+
        '<div class="form-error" id="catErr" style="display:none;"></div>'+
      '</div>'+
      '<div class="modal-foot"><button class="btn-ghost" id="catCancel">Cancel</button><button class="btn-primary" id="catSave">Create category</button></div>';
    backdrop.appendChild(modal); root.innerHTML=''; root.appendChild(backdrop);
    var picker = modal.querySelector('#iconPicker');
    ICON_KEYS.forEach(function(k){
      var opt = el('button', {'class':'icon-opt'+(k===selIcon?' sel':''), type:'button'});
      opt.innerHTML = svgIcon(k);
      opt.addEventListener('click', function(){ picker.querySelectorAll('.icon-opt').forEach(function(o){o.classList.remove('sel');}); opt.classList.add('sel'); selIcon=k; });
      picker.appendChild(opt);
    });
    backdrop.addEventListener('click', function(e){ if(e.target===backdrop) closeModal(); });
    modal.querySelector('.modal-close').addEventListener('click', function(){ closeModal(); if(fromPageModal && pendingPageDraft){ openPageModal(null, pendingPageDraft); } });
    modal.querySelector('#catCancel').addEventListener('click', function(){ closeModal(); if(fromPageModal && pendingPageDraft){ openPageModal(null, pendingPageDraft); } });
    modal.querySelector('#catSave').addEventListener('click', function(){
      var name = modal.querySelector('#catName').value.trim();
      var desc = modal.querySelector('#catDesc').value.trim();
      var errBox = modal.querySelector('#catErr');
      if(!name){ errBox.textContent='Give the category a name.'; errBox.style.display='block'; return; }
      var id = slugify(name);
      if(catById(id)){ errBox.textContent='A category with a similar name already exists.'; errBox.style.display='block'; return; }
      var btn = modal.querySelector('#catSave');
      btn.innerHTML = '<span class="spinner"></span> Creating…'; btn.disabled = true;
      createCategory({id:id, name:name, description:desc, icon:selIcon}).then(function(){
        showToast('Category created — publishing now…');
        closeModal();
        if(fromPageModal && pendingPageDraft){
          pendingPageDraft.categoryId = id;
          openPageModal(null, pendingPageDraft);
        }
        pollForRebuild();
      }).catch(function(err){
        errBox.textContent = err && err.message ? err.message : 'Couldn’t create the category — check your token has write access.';
        errBox.style.display = 'block';
        btn.textContent = 'Create category'; btn.disabled = false;
      });
    });
  }

  function createCategory(cat){
    var path = 'content/categories.yml';
    var url = apiBase()+'/contents/'+path;
    return ghFetch(url+'?ref='+DATA.repo.branch, {method:'GET'}).then(function(res){
      if(!res.ok) return Promise.reject(new Error('Could not read categories.yml (status '+res.status+').'));
      var current = b64DecodeUtf8(res.body.content);
      var maxOrder = DATA.categories.reduce(function(m,c){ return Math.max(m, c.order||0); }, -1);
      var block = '\n- id: '+cat.id+'\n  name: '+yamlStr(cat.name)+'\n  description: '+yamlStr(cat.description)+'\n  icon: '+cat.icon+'\n  order: '+(maxOrder+1)+'\n';
      var updated = current.replace(/\s*$/, '') + '\n' + block;
      return ghFetch(url, {
        method:'PUT',
        body: JSON.stringify({
          message: 'Add category: '+cat.name,
          content: b64EncodeUtf8(updated),
          sha: res.body.sha,
          branch: DATA.repo.branch
        })
      });
    }).then(function(res){
      if(!res || !res.ok) return Promise.reject(new Error(res && res.body && res.body.message));
      DATA.categories.push({id:cat.id, name:cat.name, description:cat.description, icon:cat.icon, order: DATA.categories.length});
      renderNav();
      return res;
    });
  }

  function openPageModal(existingUnused, draft){
    if(!DATA.categories.length){ showToast('Create a category first.'); return; }
    var root = document.getElementById('modalRoot');
    draft = draft || {};
    var defaultCat = draft.categoryId || (state.view.type==='category' ? state.view.id : DATA.categories[0].id);
    var backdrop = el('div', {'class':'modal-backdrop'});
    var modal = el('div', {'class':'modal'});
    var catOptions = DATA.categories.map(function(c){
      return '<option value="'+c.id+'"'+(c.id===defaultCat?' selected':'')+'>'+escapeHtml(c.name)+'</option>';
    }).join('');
    modal.innerHTML =
      '<div class="modal-head"><h3>New page</h3><button class="modal-close">&times;</button></div>'+
      '<div class="modal-body">'+
        '<div class="field-row">'+
          '<div class="field" style="flex:2;"><label>Title</label><input type="text" id="pgTitle" value="'+(draft.title?escapeHtml(draft.title):'')+'" placeholder="e.g. Resetting a locked account"></div>'+
          '<div class="field"><label>Category</label><select id="pgCat">'+catOptions+'</select></div>'+
        '</div>'+
        '<button type="button" class="btn-ghost" id="pgNewCat" style="align-self:flex-start; padding:2px 0; font-size:12.5px;">+ New category</button>'+
        '<div class="field"><label>Summary <span class="hint" style="display:inline;">(shown in lists)</span></label><input type="text" id="pgSummary" value="'+(draft.summary?escapeHtml(draft.summary):'')+'" placeholder="One line describing this doc"></div>'+
        '<div class="field"><label>Tags</label><input type="text" id="pgTags" value="'+(draft.tags?escapeHtml(draft.tags):'')+'" placeholder="comma, separated, tags"></div>'+
        '<div class="field"><label>Content</label><textarea id="pgContent" placeholder="## Steps&#10;- First do this&#10;- Then this&#10;&#10;Standard Markdown — headings, lists, `code`, ```code blocks```, **bold**, [links](https://...).">'+(draft.content?escapeHtml(draft.content):'')+'</textarea>'+
          '<div class="hint">Standard Markdown: <code>## heading</code>, <code>- bullet</code>, <code>\`code\`</code>, fenced <code>\`\`\`</code> blocks, <code>**bold**</code>, links.</div></div>'+
        '<div class="form-error" id="pgErr" style="display:none;"></div>'+
      '</div>'+
      '<div class="modal-foot"><button class="btn-ghost" id="pgCancel">Cancel</button><button class="btn-primary" id="pgSave">Publish page</button></div>';
    backdrop.appendChild(modal); root.innerHTML=''; root.appendChild(backdrop);
    backdrop.addEventListener('click', function(e){ if(e.target===backdrop) closeModal(); });
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('#pgCancel').addEventListener('click', closeModal);
    modal.querySelector('#pgNewCat').addEventListener('click', function(){
      pendingPageDraft = readPageDraft(modal);
      openCategoryModal(true);
    });
    modal.querySelector('#pgSave').addEventListener('click', function(){
      var d = readPageDraft(modal);
      var errBox = modal.querySelector('#pgErr');
      if(!d.title){ errBox.textContent='Give the page a title.'; errBox.style.display='block'; return; }
      var btn = modal.querySelector('#pgSave');
      btn.innerHTML = '<span class="spinner"></span> Publishing…'; btn.disabled = true;
      createPage(d).then(function(){
        showToast('Page published — the site is rebuilding…');
        closeModal();
        pollForRebuild();
      }).catch(function(err){
        errBox.textContent = err && err.message ? err.message : 'Couldn’t publish — check your token has write access to this repo.';
        errBox.style.display = 'block';
        btn.textContent = 'Publish page'; btn.disabled = false;
      });
    });
  }

  function readPageDraft(modal){
    return {
      title: modal.querySelector('#pgTitle').value.trim(),
      categoryId: modal.querySelector('#pgCat').value,
      summary: modal.querySelector('#pgSummary').value.trim(),
      tags: modal.querySelector('#pgTags').value.trim(),
      content: modal.querySelector('#pgContent').value
    };
  }

  function createPage(d){
    var tags = d.tags.split(',').map(function(t){return t.trim();}).filter(Boolean).slice(0,8);
    var baseSlug = slugify(d.title);
    var existingPaths = DATA.pages.map(function(p){return p.path;});
    var slug = baseSlug, n = 2;
    while(existingPaths.indexOf('content/pages/'+d.categoryId+'/'+slug+'.md') > -1){ slug = baseSlug+'-'+n; n++; }
    var path = 'content/pages/'+d.categoryId+'/'+slug+'.md';
    var tagsYaml = '['+tags.map(yamlStr).join(', ')+']';
    var fileText = '---\ntitle: '+yamlStr(d.title)+'\ncategory: '+d.categoryId+'\nsummary: '+yamlStr(d.summary)+'\ntags: '+tagsYaml+'\n---\n'+d.content.replace(/\r\n/g,'\n')+'\n';
    return ghFetch(apiBase()+'/contents/'+path, {
      method:'PUT',
      body: JSON.stringify({
        message: 'Add page: '+d.title,
        content: b64EncodeUtf8(fileText),
        branch: DATA.repo.branch
      })
    }).then(function(res){
      if(!res.ok) return Promise.reject(new Error(res.body && res.body.message));
      return res;
    });
  }

  // ---------------- Rebuild polling ----------------
  var pollTimer = null;
  function pollForRebuild(){
    if(!repoConfigured()) return;
    clearTimeout(pollTimer);
    var startedAt = Date.now();
    var tries = 0;
    (function tick(){
      tries++;
      fetch('https://api.github.com/repos/'+DATA.repo.owner+'/'+DATA.repo.name+'/actions/runs?per_page=1', {headers:{'Accept':'application/vnd.github+json'}})
        .then(function(res){ return res.ok ? res.json() : null; })
        .then(function(json){
          var run = json && json.workflow_runs && json.workflow_runs[0];
          var runIsFresh = run && (new Date(run.created_at).getTime() > startedAt - 30000);
          if(run && runIsFresh && run.status === 'completed'){
            showToast(run.conclusion === 'success' ? 'Published! Refreshing…' : 'Build finished with issues — refreshing to check.');
            setTimeout(function(){ location.reload(); }, 1200);
            return;
          }
          if(tries < 20){ pollTimer = setTimeout(tick, 6000); }
          else { showToast('Still publishing — refresh in a minute to see it live.', 5000); }
        })
        .catch(function(){ if(tries < 20){ pollTimer = setTimeout(tick, 6000); } });
    })();
  }

  // ---------------- Account panel ----------------
  function refreshAccountPanel(){
    var box = document.getElementById('accountPanel');
    if(!box) return;
    var token = getToken();
    if(!token){
      box.innerHTML = '<button class="btn-ghost" id="connectBtn" style="padding:0; font-size:11.5px; font-weight:700; color:var(--accent);">Connect GitHub to edit →</button>';
      var b = box.querySelector('#connectBtn');
      if(b) b.addEventListener('click', function(){ openTokenModal(); });
      return;
    }
    box.innerHTML = '<span class="mono">Checking connection…</span>';
    verifyToken(token).then(function(user){
      box.innerHTML = '<div class="gh-account"><span>Connected as <b>'+escapeHtml(user.login||'')+'</b></span><button id="disconnectBtn">Disconnect</button></div>';
      box.querySelector('#disconnectBtn').addEventListener('click', function(){ clearToken(); refreshAccountPanel(); showToast('Disconnected.'); });
    }).catch(function(){
      clearToken();
      box.innerHTML = '<button class="btn-ghost" id="connectBtn" style="padding:0; font-size:11.5px; font-weight:700; color:var(--accent);">Connect GitHub to edit →</button>';
      box.querySelector('#connectBtn').addEventListener('click', function(){ openTokenModal(); });
    });
  }

  // ---------------- Wire up static UI ----------------
  document.querySelectorAll('.nav-item[data-view="home"]').forEach(function(b){ b.addEventListener('click', function(){ setView({type:'home'}); closeSidebarMobile(); }); });
  document.getElementById('menuBtn').addEventListener('click', function(){ document.getElementById('sidebar').classList.add('open'); document.getElementById('scrim').classList.add('show'); });
  document.getElementById('scrim').addEventListener('click', closeSidebarMobile);
  document.getElementById('newPageBtn').addEventListener('click', function(){
    if(!repoConfigured()){ showToast('This copy of the site isn’t linked to a repo yet.'); return; }
    ensureConnected(function(){ openPageModal(); });
  });
  document.getElementById('addCategoryBtn').addEventListener('click', function(){
    if(!repoConfigured()){ showToast('This copy of the site isn’t linked to a repo yet.'); return; }
    ensureConnected(function(){ openCategoryModal(false); });
  });
  var searchTimer=null;
  document.getElementById('searchInput').addEventListener('input', function(e){
    var v = e.target.value; clearTimeout(searchTimer);
    searchTimer = setTimeout(function(){ state.search=v.trim(); if(state.search) setView({type:'search'}); else if(state.view.type==='search') setView({type:'home'}); }, 220);
  });

  var gen = new Date(DATA.generatedAt);
  var repoLink = repoConfigured() ? 'https://github.com/'+DATA.repo.owner+'/'+DATA.repo.name : '#';
  document.getElementById('sidebarFooter').innerHTML =
    '<div id="accountPanel" style="margin-bottom:10px;"></div>'+
    'Published '+gen.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})+'<br>'+
    '<a href="'+repoLink+'" target="_blank" rel="noopener">View repo on GitHub</a>';
  refreshAccountPanel();

  render();
})();
