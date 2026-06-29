/**
 * IOL Live Blog Web Component
 * Deploy this file to your GitHub Pages repo as liveblog-widget.js
 *
 * Usage in any CMS HTML widget:
 *   <script src="https://fhmkhota-lang.github.io/IOL-Liveblog/liveblog-widget.js" defer></script>
 *   <iol-liveblog blog-id="blog_123" db-url="https://iol-liveblog-default-rtdb.firebaseio.com"></iol-liveblog>
 *
 * - Shadow DOM isolated — zero conflict with CMS styles or scripts
 * - Fetches data via Firebase REST then keeps live via SDK
 * - Self-sizing, no iframes, no postMessage needed
 */
(function () {
  'use strict';

  // ── All styles scoped inside Shadow DOM ─────────────────────────────────────
  var STYLES = [
    ':host { display:block; font-family:Poppins,Arial,sans-serif; width:100%; }',
    '* { box-sizing:border-box; margin:0; padding:0; }',
    'a { color:inherit; }',

    // Widget wrapper
    '.w { border:1px solid #ddd; border-radius:4px; overflow:hidden; background:#fff; width:100%; }',
    '.w.sport { border-color:rgba(26,122,60,0.3); }',

    // Header
    '.hdr { background:#D0021B; padding:10px 16px; display:flex; align-items:center; gap:8px; justify-content:flex-start; }',
    '.w.sport .hdr { background:#1a7a3c; }',
    '.live { background:#fff; font-size:10px; font-weight:800; letter-spacing:1.5px; padding:3px 8px; border-radius:2px; display:inline-flex; align-items:center; gap:5px; flex-shrink:0; color:#D0021B; }',
    '.w.sport .live { color:#1a7a3c; }',
    '.pulse { display:inline-block; width:7px; height:7px; background:#D0021B; border-radius:50%; animation:pulse 1.4s infinite; flex-shrink:0; }',
    '.w.sport .pulse { background:#1a7a3c; }',
    '@keyframes pulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(.75);} }',
    '.hdr-info { flex:1; min-width:0; }',
    '.hdr-title { color:#fff; font-weight:700; font-size:14px; line-height:1.3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }',
    '.hdr-meta { color:rgba(255,255,255,0.75); font-size:11px; margin-top:2px; }',

    // Scoreboard
    '.board { background:#111; padding:14px 16px 10px; }',
    '.board-banner { width:100%; height:120px; object-fit:cover; object-position:center; border-radius:4px; margin-bottom:10px; display:block; }',
    '.score-row { display:flex; align-items:center; justify-content:center; }',
    '.team { flex:1; text-align:center; }',
    '.team-name { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:rgba(255,255,255,0.55); margin-bottom:4px; }',
    '.team-score { font-size:46px; font-weight:900; color:#fff; line-height:1; }',
    '.divider { text-align:center; padding:0 10px; }',
    '.dash { font-size:20px; color:rgba(255,255,255,0.3); }',
    '.period { display:inline-block; font-size:10px; font-weight:700; text-transform:uppercase; background:#D0021B; color:#fff; padding:2px 8px; border-radius:3px; margin-top:2px; }',
    '.w.sport .period { background:#1a7a3c; }',
    '.gametime { font-size:10px; color:rgba(255,255,255,0.45); margin-top:3px; }',
    '.venue { text-align:center; font-size:10px; color:rgba(255,255,255,0.3); margin-top:8px; text-transform:uppercase; letter-spacing:1px; }',
    '.solo-banner { width:100%; height:140px; object-fit:cover; object-position:center; display:block; }',

    // Posts
    '.post { padding:14px 16px; border-bottom:1px solid #eee; background:#fff; }',
    '.post:last-of-type { border-bottom:none; }',
    '.post.key { border-left:3px solid #D0021B; }',
    '.w.sport .post.key { border-left-color:#1a7a3c; }',
    '.post.breaking { border-left:3px solid #e07b00; }',
    '.post.score-up { background:#e8f5ee; border-left:3px solid #1a7a3c; }',
    '.meta { display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap; }',
    '.time { font-size:11px; font-weight:700; color:#D0021B; font-family:monospace; }',
    '.w.sport .time { color:#1a7a3c; }',
    '.author { font-size:11px; color:#888; }',
    '.tag { font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#fff; padding:2px 6px; border-radius:2px; }',
    '.tag-b { background:#e07b00; }',
    '.tag-k { background:#D0021B; }',
    '.w.sport .tag-k { background:#1a7a3c; }',
    '.headline { font-size:15px; font-weight:700; color:#111; margin-bottom:6px; line-height:1.3; }',
    '.headline.green { color:#1a7a3c; }',
    '.body { font-size:13px; color:#444; line-height:1.65; }',
    '.body img { max-width:100%; border-radius:3px; margin:6px 0; display:block; }',
    '.body a { color:#D0021B; }',
    '.w.sport .body a { color:#1a7a3c; }',
    '.fig { margin:8px 0; }',
    '.fig img { max-width:100%; border-radius:3px; display:block; }',
    '.cap { font-size:10px; color:#888; margin-top:3px; font-style:italic; }',

    // Footer
    '.ftr { background:#f9f9f9; border-top:1px solid #eee; padding:8px 16px; display:flex; align-items:center; justify-content:space-between; font-size:11px; color:#888; }',
    '.ftr-brand { display:flex; align-items:center; gap:6px; }',
    '.ftr-logo { height:16px; width:auto; display:block; }',

    // Empty / loading states
    '.empty { padding:24px; text-align:center; color:#999; font-size:13px; }',
    '.skeleton { border:1px solid #eee; border-radius:4px; overflow:hidden; background:#fff; }',
    '.sk-hdr { background:#D0021B; padding:12px 16px; }',
    '.sk-bar { background:rgba(255,255,255,0.25); border-radius:3px; }',
    '.sk-body { padding:14px 16px; border-bottom:1px solid #eee; }',
    '.sk-line { background:#f0f0f0; border-radius:3px; margin-bottom:8px; animation:shimmer 1.2s infinite linear; background-size:400px 100%; }',
    '@keyframes shimmer { 0%{opacity:1;}50%{opacity:.5;}100%{opacity:1;} }',
  ].join('\n');

  // ── Inline SVG logo (black, no external request) ───────────────────────────
  var LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 30" class="ftr-logo">'
    + '<rect width="80" height="30" fill="#111"/>'
    + '<text x="4" y="23" font-family="Arial Black,Arial" font-weight="900" font-size="22" fill="#fff">IOL</text>'
    + '<polygon points="0,0 14,0 0,16" fill="#D0021B"/>'
    + '</svg>';

  // ── Helper: escape HTML ────────────────────────────────────────────────────
  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Helper: allow safe HTML tags in post body ──────────────────────────────
  function safeBody(s) {
    if (!s) return '';
    return s.replace(/<(?!\/?(?:b|i|em|strong|a|br|p|ul|ol|li|blockquote|figure|figcaption|img)\b)[^>]*>/gi, '');
  }

  // ── Helper: format time ────────────────────────────────────────────────────
  function fmtTime(iso) {
    try { return new Date(iso).toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' }); }
    catch(e) { return ''; }
  }

  // ── Build skeleton HTML ────────────────────────────────────────────────────
  function buildSkeleton() {
    return '<div class="skeleton">'
      + '<div class="sk-hdr"><div class="sk-bar" style="width:80px;height:14px;margin-bottom:6px;"></div>'
      + '<div class="sk-bar" style="width:180px;height:14px;"></div></div>'
      + '<div class="sk-body"><div class="sk-line" style="width:60px;height:10px;"></div>'
      + '<div class="sk-line" style="width:90%;height:14px;"></div>'
      + '<div class="sk-line" style="width:75%;height:12px;margin-bottom:0;"></div></div>'
      + '<div class="sk-body" style="border-bottom:none;">'
      + '<div class="sk-line" style="width:60px;height:10px;"></div>'
      + '<div class="sk-line" style="width:85%;height:14px;"></div>'
      + '<div class="sk-line" style="width:70%;height:12px;margin-bottom:0;"></div></div>'
      + '</div>';
  }

  // ── Build full widget HTML ─────────────────────────────────────────────────
  function buildWidget(blog, postsObj) {
    var isSport  = !!blog.sport;
    var hasScore = isSport && !!blog.hasScore;
    var isLive   = blog.status === 'live';
    var sportCls = isSport ? ' sport' : '';

    var lastUpdate = blog.updatedAt
      ? fmtTime(blog.updatedAt) : '';

    var allPosts = Object.values(postsObj || {}).sort(function(a,b) {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return  1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    // ── Scoreboard ───────────────────────────────────────────────────────────
    var scoreHtml = '';
    if (hasScore) {
      scoreHtml = '<div class="board">';
      if (blog.bannerUrl) {
        scoreHtml += '<img class="board-banner" src="' + esc(blog.bannerUrl) + '" alt="banner">';
      }
      scoreHtml += '<div class="score-row">'
        + '<div class="team"><div class="team-name">' + esc(blog.homeTeam || 'Home') + '</div>'
        + '<div class="team-score">' + (blog.homeScore || 0) + '</div></div>'
        + '<div class="divider"><div class="dash">-</div>'
        + (blog.period   ? '<div class="period">' + esc(blog.period) + '</div>' : '')
        + (blog.gameTime ? '<div class="gametime">' + esc(blog.gameTime) + '</div>' : '')
        + '</div>'
        + '<div class="team"><div class="team-name">' + esc(blog.awayTeam || 'Away') + '</div>'
        + '<div class="team-score">' + (blog.awayScore || 0) + '</div></div>'
        + '</div>';
      if (blog.venue) scoreHtml += '<div class="venue">' + esc(blog.venue) + '</div>';
      scoreHtml += '</div>';
    } else if (isSport && blog.bannerUrl) {
      scoreHtml = '<img class="solo-banner" src="' + esc(blog.bannerUrl) + '" alt="banner">';
    }

    // ── Posts ────────────────────────────────────────────────────────────────
    var postsHtml = allPosts.length
      ? allPosts.map(function(post) {
          var t = fmtTime(post.timestamp);
          var isScoreUp = post.isScoreUpdate && hasScore;
          var cls = 'post'
            + (post.type === 'key'      ? ' key'      : '')
            + (post.type === 'breaking' ? ' breaking' : '')
            + (isScoreUp               ? ' score-up' : '');
          var tag = post.type === 'breaking'
            ? '<span class="tag tag-b">Breaking</span>'
            : post.type === 'key'
              ? '<span class="tag tag-k">Key</span>'
              : '';
          var authorHtml = post.author
            ? '<span class="author">' + esc(post.author) + '</span>' : '';
          var imgHtml = post.imageUrl
            ? '<figure class="fig"><img src="' + esc(post.imageUrl) + '" alt="' + esc(post.imageCaption||'') + '">'
              + (post.imageCaption ? '<figcaption class="cap">' + esc(post.imageCaption) + '</figcaption>' : '')
              + '</figure>' : '';
          var hlCls = isScoreUp ? ' green' : '';
          return '<div class="' + cls + '">'
            + '<div class="meta"><span class="time">' + t + '</span>' + authorHtml + tag + '</div>'
            + (post.headline ? '<div class="headline' + hlCls + '">' + esc(post.headline) + '</div>' : '')
            + imgHtml
            + (post.body ? '<div class="body">' + safeBody(post.body) + '</div>' : '')
            + '</div>';
        }).join('')
      : '<div class="empty">No updates yet - check back soon.</div>';

    // ── Assemble ─────────────────────────────────────────────────────────────
    return '<div class="w' + sportCls + '">'
      + '<div class="hdr">'
      + (isLive ? '<span class="live"><span class="pulse"></span>LIVE</span>' : '')
      + '<div class="hdr-info">'
      + '<div class="hdr-title">' + esc(blog.title) + '</div>'
      + '<div class="hdr-meta">' + esc(blog.category || '')
      + (lastUpdate ? ' - Updated ' + lastUpdate : '') + '</div>'
      + '</div></div>'
      + scoreHtml
      + postsHtml
      + '<div class="ftr"><div class="ftr-brand">' + LOGO_SVG + '<span>Live Blog</span></div>'
      + '<span>' + (isLive ? 'Live updates' : 'Blog ended') + '</span></div>'
      + '</div>';
  }

  // ── Web Component class ────────────────────────────────────────────────────
  var IolLiveblog = (function() {
    function IolLiveblog() {
      var instance = Reflect.construct(HTMLElement, [], IolLiveblog);
      return instance;
    }
    IolLiveblog.prototype = Object.create(HTMLElement.prototype);
    IolLiveblog.prototype.constructor = IolLiveblog;

    IolLiveblog.prototype.connectedCallback = function() {
      this._blogId = this.getAttribute('blog-id');
      this._dbUrl  = (this.getAttribute('db-url') || '').replace(/\/$/, '');
      this._liveReady = false;

      // Attach Shadow DOM
      this._root = this.attachShadow({ mode: 'open' });

      // Font
      var fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&display=swap';
      this._root.appendChild(fontLink);

      // Styles
      var styleEl = document.createElement('style');
      styleEl.textContent = STYLES;
      this._root.appendChild(styleEl);

      // Container
      this._el = document.createElement('div');
      this._root.appendChild(this._el);

      if (!this._blogId || !this._dbUrl) {
        this._el.innerHTML = '<div class="empty">Live blog not configured.</div>';
        return;
      }

      // Show skeleton immediately
      this._el.innerHTML = buildSkeleton();

      // Fetch live data
      this._loadData();
    };

    IolLiveblog.prototype._loadData = function() {
      var self = this;

      // Step 1: Try REST cache for fast first paint (no SDK needed)
      fetch(self._dbUrl + '/cache/' + self._blogId + '.json')
        .then(function(r) { return r.json(); })
        .then(function(cached) {
          if (cached && typeof cached === 'object' && cached.blog && !self._liveReady) {
            // Cache stores {blog, posts} objects — render properly
            self._el.innerHTML = buildWidget(cached.blog, cached.posts || {});
          }
          // Fall through to Firebase regardless
        })
        .catch(function() {})
        .finally(function() {
          // Step 2: Always load Firebase SDK for live updates
          self._loadFirebase();
        });
    };

    IolLiveblog.prototype._loadFirebase = function() {
      var self = this;
      function loadScript(src, cb) {
        // Reuse already-loaded scripts
        if (document.querySelector('script[src="' + src + '"]')) { cb(); return; }
        var s = document.createElement('script');
        s.src = src; s.async = true; s.onload = cb;
        document.head.appendChild(s);
      }
      loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js', function() {
        loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js', function() {
          try {
            var app;
            try { app = firebase.app(); } catch(e) {
              app = firebase.initializeApp({ databaseURL: self._dbUrl });
            }
            var db = firebase.database(app);
            self._listen(db);
          } catch(e) {
            console.warn('[iol-liveblog]', e.message);
          }
        });
      });
    };

    IolLiveblog.prototype._listen = function(db) {
      var self = this;
      var blog = null, posts = {};

      function render() {
        if (!blog) return;
        self._liveReady = true;
        self._el.innerHTML = buildWidget(blog, posts);
        self._loadTwitter();
      }

      db.ref('blogs/' + this._blogId).on('value', function(s) {
        blog = s.val(); render();
      });
      db.ref('posts/' + this._blogId).on('value', function(s) {
        posts = s.val() || {}; render();
      });
    };

    IolLiveblog.prototype._loadTwitter = function() {
      var root = this._root;
      if (!root.querySelector('blockquote.twitter-tweet')) return;
      if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load(root); return;
      }
      var s = document.createElement('script');
      s.src = 'https://platform.twitter.com/widgets.js';
      s.async = true;
      s.onload = function() {
        if (window.twttr && window.twttr.widgets) window.twttr.widgets.load(root);
      };
      document.head.appendChild(s);
    };

    return IolLiveblog;
  }());

  // Extend HTMLElement properly for all browsers
  Object.setPrototypeOf(IolLiveblog.prototype, HTMLElement.prototype);
  Object.setPrototypeOf(IolLiveblog, HTMLElement);

  if (!customElements.get('iol-liveblog')) {
    customElements.define('iol-liveblog', IolLiveblog);
  }

}());
