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

  var state = { view:{type:'home'}, search:'' };
  function catById(id){ return DATA.categories.find(function(c){return c.id===id;}); }

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
    a.href = DATA.newPageBase ? DATA.newPageBase + 'content/pages/' : DATA.editBase;
    a.style.display = '';
    a.lastChild.textContent = ' Add a page on GitHub';
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
    hero.innerHTML = '<h2>IT process documentation, kept current by the whole team.</h2><p>Every runbook, checklist and setup guide your team relies on — searchable in one place, editable straight from GitHub.</p>';
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

  document.querySelectorAll('.nav-item[data-view="home"]').forEach(function(b){ b.addEventListener('click', function(){ setView({type:'home'}); closeSidebarMobile(); }); });
  document.getElementById('menuBtn').addEventListener('click', function(){ document.getElementById('sidebar').classList.add('open'); document.getElementById('scrim').classList.add('show'); });
  document.getElementById('scrim').addEventListener('click', closeSidebarMobile);
  var searchTimer=null;
  document.getElementById('searchInput').addEventListener('input', function(e){
    var v = e.target.value; clearTimeout(searchTimer);
    searchTimer = setTimeout(function(){ state.search=v.trim(); if(state.search) setView({type:'search'}); else if(state.view.type==='search') setView({type:'home'}); }, 220);
  });

  var gen = new Date(DATA.generatedAt);
  document.getElementById('sidebarFooter').innerHTML = 'Published '+gen.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})+'<br>Built from <a href="'+(DATA.editBase ? DATA.editBase.replace(/\/edit\/[^/]+\/$/,'') : '#')+'" target="_blank" rel="noopener">this repo</a>';

  render();
})();
