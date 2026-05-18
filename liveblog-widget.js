/**
 * IOL Live Blog Web Component
 * Usage: <iol-liveblog blog-id="blog_123" db-url="https://your-project-rtdb.firebaseio.com"></iol-liveblog>
 * - Fully self-contained via Shadow DOM — zero style or script conflicts with host CMS
 * - Fetches pre-rendered cache instantly via REST (no SDK needed for first paint)
 * - Firebase Realtime Database SDK loads in background for live updates
 * - No iframes, no postMessage, no resize hacks needed
 */
(function () {
  'use strict';

  // ── Styles injected into Shadow DOM ────────────────────────────────────────
  const STYLES = `
    :host {
      display: block;
      font-family: 'Poppins', Arial, sans-serif;
      width: 100%;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .widget {
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
      background: #fff;
      width: 100%;
    }
    .widget.sport { border-color: rgba(26,122,60,0.3); }

    /* Header */
    .header {
      background: #D0021B;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: space-between;
    }
    .widget.sport .header { background: #1a7a3c; }
    .live-badge {
      background: #fff;
      color: #D0021B;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1.5px;
      padding: 2px 8px;
      border-radius: 2px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      flex-shrink: 0;
    }
    .widget.sport .live-badge { color: #1a7a3c; }
    .pulse {
      display: inline-block;
      width: 7px; height: 7px;
      background: #fff;
      border-radius: 50%;
      animation: pulse 1.4s infinite;
    }
    @keyframes pulse {
      0%,100% { opacity:1; transform:scale(1); }
      50%      { opacity:.4; transform:scale(.75); }
    }
    .blog-title { color: #fff; font-weight: 700; font-size: 14px; line-height: 1.3; }
    .blog-meta  { color: rgba(255,255,255,0.75); font-size: 11px; margin-top: 2px; }
    .last-update { color: rgba(255,255,255,0.8); font-size: 11px; white-space: nowrap; }

    /* Scoreboard */
    .scoreboard {
      background: #111;
      padding: 14px 16px 10px;
    }
    .scoreboard img.banner {
      width: 100%; max-height: 120px; object-fit: cover;
      border-radius: 4px; margin-bottom: 10px; display: block;
    }
    .score-row {
      display: flex; align-items: center; justify-content: center;
    }
    .team {
      flex: 1; text-align: center;
    }
    .team-name {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 1px; color: rgba(255,255,255,0.55); margin-bottom: 4px;
    }
    .team-score {
      font-family: 'Poppins', Arial, sans-serif;
      font-size: 46px; font-weight: 900; color: #fff; line-height: 1;
    }
    .score-divider { text-align: center; padding: 0 10px; }
    .score-dash { font-size: 20px; color: rgba(255,255,255,0.3); }
    .score-period {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      background: #D0021B; color: #fff;
      padding: 2px 8px; border-radius: 3px; margin-top: 2px;
      display: inline-block;
    }
    .widget.sport .score-period { background: #1a7a3c; }
    .score-time { font-size: 10px; color: rgba(255,255,255,0.45); margin-top: 3px; }
    .venue {
      text-align: center; font-size: 10px;
      color: rgba(255,255,255,0.3); margin-top: 8px;
      text-transform: uppercase; letter-spacing: 1px;
    }

    /* Posts */
    .post {
      padding: 14px 16px;
      border-bottom: 1px solid #eee;
      background: #fff;
    }
    .post:last-of-type { border-bottom: none; }
    .post.key      { border-left: 3px solid #D0021B; }
    .post.breaking { border-left: 3px solid #e07b00; }
    .post.score-up { background: #e8f5ee; border-left: 3px solid #1a7a3c; }
    .widget.sport .post.key { border-left-color: #1a7a3c; }

    .post-meta {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 6px; flex-wrap: wrap;
    }
    .post-time {
      font-size: 11px; font-weight: 700;
      color: #D0021B; font-family: monospace;
    }
    .widget.sport .post-time { color: #1a7a3c; }
    .post-author { font-size: 11px; color: #888; }

    .tag {
      font-size: 9px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 1px; color: #fff;
      padding: 2px 6px; border-radius: 2px;
    }
    .tag-breaking { background: #e07b00; }
    .tag-key      { background: #D0021B; }
    .widget.sport .tag-key { background: #1a7a3c; }

    .post-headline {
      font-family: 'Poppins', Arial, sans-serif;
      font-size: 15px; font-weight: 700;
      color: #111; margin-bottom: 6px; line-height: 1.3;
    }
    .post-headline.score { color: #1a7a3c; }

    .post-body { font-size: 13px; color: #444; line-height: 1.65; }
    .post-body img { max-width: 100%; border-radius: 3px; margin: 6px 0; display: block; }
    .post-body a   { color: #D0021B; }
    .widget.sport .post-body a { color: #1a7a3c; }

    .post-img { margin: 8px 0; }
    .post-img img { max-width: 100%; border-radius: 3px; display: block; }
    .post-img figcaption { font-size: 10px; color: #888; margin-top: 3px; font-style: italic; }

    /* Footer */
    .footer {
      background: #f9f9f9; border-top: 1px solid #eee;
      padding: 8px 16px;
      display: flex; align-items: center; justify-content: space-between;
      font-size: 11px; color: #888;
    }
    .footer-brand { display: flex; align-items: center; gap: 6px; }
    .footer-logo  { height: 16px; width: auto; display: block; }
    .footer-status { font-size: 11px; }

    /* Empty / loading */
    .empty {
      padding: 24px; text-align: center;
      color: #999; font-size: 13px;
    }
  `;

  class IolLiveblog extends HTMLElement {

    connectedCallback() {
      this._blogId = this.getAttribute('blog-id');
      this._dbUrl  = (this.getAttribute('db-url') || '').replace(/\/$/, '');

      // Attach Shadow DOM — fully isolated from host page
      this._shadow = this.attachShadow({ mode: 'open' });

      // Inject Google Font link
      const fontLink = document.createElement('link');
      fontLink.rel  = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&display=swap';
      this._shadow.appendChild(fontLink);

      // Styles
      const styleEl = document.createElement('style');
      styleEl.textContent = STYLES;
      this._shadow.appendChild(styleEl);

      // Container
      this._container = document.createElement('div');
      this._shadow.appendChild(this._container);

      if (!this._blogId || !this._dbUrl) {
        this._container.innerHTML = '<div class="empty">Live blog not configured.</div>';
        return;
      }

      // Step 1: Fetch pre-rendered cache instantly via REST (no SDK)
      this._fetchCache();

      // Step 2: Load Firebase SDK in background for live updates
      this._loadFirebase();
    }

    disconnectedCallback() {
      // Clean up Firebase listeners on removal
      if (this._unsubBlog)  this._unsubBlog();
      if (this._unsubPosts) this._unsubPosts();
    }

    // ── REST cache fetch (instant, no SDK) ──────────────────────────────────
    _fetchCache() {
      fetch(this._dbUrl + '/cache/' + this._blogId + '.json')
        .then(function(r) { return r.json(); })
        .then(function(cached) {
          // Only use cache if Firebase hasn't already rendered live data
          if (cached && typeof cached === 'string' && !this._liveReady) {
            this._container.innerHTML = cached;
          }
        }.bind(this))
        .catch(function() {}); // Silent — live data will arrive shortly
    }

    // ── Firebase SDK load + live listener ───────────────────────────────────
    _loadFirebase() {
      var self = this;
      function loadScript(src, cb) {
        var s = document.createElement('script');
        s.src = src; s.async = true; s.onload = cb;
        document.head.appendChild(s);
      }
      loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js', function() {
        loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js', function() {
          try {
            var app = firebase.apps.length
              ? firebase.app()
              : firebase.initializeApp({ databaseURL: self._dbUrl });
            var db = firebase.database(app);
            self._attachListeners(db);
          } catch(e) {
            console.warn('[iol-liveblog] Firebase init failed:', e.message);
          }
        });
      });
    }

    _attachListeners(db) {
      var self = this;
      var blog = null, posts = {};

      function render() {
        if (!blog) return;
        self._liveReady = true;
        self._container.innerHTML = self._buildWidget(blog, posts);
        self._loadTwitter();
      }

      db.ref('blogs/' + this._blogId).on('value', function(snap) {
        blog = snap.val();
        render();
      });

      db.ref('posts/' + this._blogId).on('value', function(snap) {
        posts = snap.val() || {};
        render();
      });
    }

    // ── HTML builder ─────────────────────────────────────────────────────────
    _buildWidget(blog, postsObj) {
      var self = this;
      var isSport  = !!blog.sport;
      var hasScore = isSport && !!blog.hasScore;
      var isLive   = blog.status === 'live';
      var accent   = isSport ? '#1a7a3c' : '#D0021B';
      var accentBg = isSport ? '#e8f5ee'  : '#fff5f5';
      var sportCls = isSport ? ' sport'   : '';

      var lastUpdate = blog.updatedAt
        ? new Date(blog.updatedAt).toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' })
        : '';

      var allPosts = Object.values(postsObj || {}).sort(function(a, b) {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return  1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });

      // Scoreboard
      var scoreHtml = '';
      if (hasScore) {
        scoreHtml = '<div class="scoreboard">';
        if (blog.bannerUrl) {
          scoreHtml += '<img class="banner" src="' + self._esc(blog.bannerUrl) + '" alt="banner">';
        }
        scoreHtml += '<div class="score-row">'
          + '<div class="team"><div class="team-name">' + self._esc(blog.homeTeam || 'Home') + '</div>'
          + '<div class="team-score">' + (blog.homeScore || 0) + '</div></div>'
          + '<div class="score-divider"><div class="score-dash">-</div>'
          + (blog.period   ? '<div class="score-period">' + self._esc(blog.period) + '</div>' : '')
          + (blog.gameTime ? '<div class="score-time">' + self._esc(blog.gameTime) + '</div>' : '')
          + '</div>'
          + '<div class="team"><div class="team-name">' + self._esc(blog.awayTeam || 'Away') + '</div>'
          + '<div class="team-score">' + (blog.awayScore || 0) + '</div></div>'
          + '</div>';
        if (blog.venue) scoreHtml += '<div class="venue">' + self._esc(blog.venue) + '</div>';
        scoreHtml += '</div>';
      } else if (isSport && blog.bannerUrl) {
        scoreHtml = '<img src="' + self._esc(blog.bannerUrl) + '" style="width:100%;max-height:140px;object-fit:cover;display:block;" alt="banner">';
      }

      // Posts
      var postsHtml = allPosts.length ? allPosts.map(function(post) {
        var t       = new Date(post.timestamp).toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' });
        var isScoreUp = post.isScoreUpdate && hasScore;
        var cls = 'post'
          + (post.type === 'key'      ? ' key'      : '')
          + (post.type === 'breaking' ? ' breaking' : '')
          + (isScoreUp               ? ' score-up' : '');
        var tag = post.type === 'breaking'
          ? '<span class="tag tag-breaking">Breaking</span>'
          : post.type === 'key'
            ? '<span class="tag tag-key">Key</span>'
            : '';
        var authorHtml = post.author
          ? '<span class="post-author">' + self._esc(post.author) + '</span>'
          : '';
        var imgHtml = post.imageUrl
          ? '<figure class="post-img"><img src="' + self._esc(post.imageUrl) + '" alt="' + self._esc(post.imageCaption || '') + '">'
            + (post.imageCaption ? '<figcaption>' + self._esc(post.imageCaption) + '</figcaption>' : '')
            + '</figure>'
          : '';
        var hlCls = isScoreUp ? ' score' : '';
        return '<div class="' + cls + '">'
          + '<div class="post-meta"><span class="post-time">' + t + '</span>' + authorHtml + tag + '</div>'
          + (post.headline ? '<div class="post-headline' + hlCls + '">' + (isScoreUp ? '' : '') + self._esc(post.headline) + '</div>' : '')
          + imgHtml
          + (post.body ? '<div class="post-body">' + self._safeBody(post.body) + '</div>' : '')
          + '</div>';
      }).join('')
      : '<div class="empty">No updates yet - check back soon.</div>';

      // Footer logo (black, inline SVG so no external request)
      var logoSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 50" class="footer-logo">'
        + '<rect width="120" height="50" fill="#111"/>'
        + '<text x="6" y="38" font-family="Arial Black,Arial" font-weight="900" font-size="36" fill="#fff">IOL</text>'
        + '<polygon points="0,0 22,0 0,25" fill="#D0021B"/>'
        + '</svg>';

      return '<div class="widget' + sportCls + '">'
        + '<div class="header">'
        + (isLive ? '<span class="live-badge"><span class="pulse"></span>LIVE</span>' : '')
        + '<div><div class="blog-title">' + self._esc(blog.title) + '</div>'
        + '<div class="blog-meta">' + self._esc(blog.category || '') + (lastUpdate ? ' - Updated ' + lastUpdate : '') + '</div>'
        + '</div></div>'
        + scoreHtml
        + postsHtml
        + '<div class="footer">'
        + '<div class="footer-brand">' + logoSvg + '<span>Live Blog</span></div>'
        + '<span class="footer-status">' + (isLive ? 'Live updates' : 'Blog ended') + '</span>'
        + '</div></div>';
    }

    // ── Twitter/X embed expansion ────────────────────────────────────────────
    _loadTwitter() {
      var shadow = this._shadow;
      var tweets = shadow.querySelectorAll('blockquote.twitter-tweet');
      if (!tweets.length) return;
      if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load(shadow);
        return;
      }
      var s = document.createElement('script');
      s.src = 'https://platform.twitter.com/widgets.js';
      s.async = true;
      s.onload = function() {
        if (window.twttr && window.twttr.widgets) window.twttr.widgets.load(shadow);
      };
      document.head.appendChild(s);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    _esc(s) {
      if (!s) return '';
      return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    _safeBody(s) {
      if (!s) return '';
      // Allow safe tags including blockquote (for Twitter embeds)
      return s.replace(/<(?!\/?(?:b|i|em|strong|a|br|p|ul|ol|li|blockquote|figure|figcaption|img)\b)[^>]*>/gi, '');
    }
  }

  // Register the custom element
  if (!customElements.get('iol-liveblog')) {
    customElements.define('iol-liveblog', IolLiveblog);
  }

})();
