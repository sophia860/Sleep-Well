<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>journal-studio-elegant</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    :root,[data-theme="light"]{
      --bg:#f5f1e8;
      --surface:#fbf8f3;
      --surface-2:#f1ece4;
      --surface-3:#e7e0d5;
      --line:#d9d1c4;
      --text:#241f17;
      --muted:#6f675b;
      --faint:#a59b8d;
      --inverse:#fbf8f3;
      --accent:#315c4b;
      --accent-soft:#dde7e2;
      --wine:#7f5d68;
      --wine-soft:#ecdfe4;
      --gold:#886735;
      --gold-soft:#ece1cd;
      --shadow:0 10px 30px rgba(23,18,12,.06);
      --radius-s:14px;
      --radius-m:20px;
      --radius-l:28px;
      --space-1:.25rem;--space-2:.5rem;--space-3:.75rem;--space-4:1rem;--space-5:1.25rem;--space-6:1.5rem;--space-8:2rem;--space-10:2.5rem;
      --text-xs:clamp(.75rem,.73rem + .15vw,.85rem);
      --text-sm:clamp(.875rem,.84rem + .16vw,.98rem);
      --text-base:clamp(1rem,.97rem + .16vw,1.06rem);
      --text-lg:clamp(1.14rem,1.06rem + .34vw,1.35rem);
      --text-xl:clamp(1.45rem,1.2rem + .9vw,2rem);
      --text-2xl:clamp(2.1rem,1.75rem + 1.6vw,3.35rem);
      --font-display:'Instrument Serif', serif;
      --font-body:'Inter', sans-serif;
      --tr:180ms cubic-bezier(.16,1,.3,1);
      --sidebar:250px;
      --header:68px;
    }
    [data-theme="dark"]{
      --bg:#171513;--surface:#1e1b18;--surface-2:#26221d;--surface-3:#2d2924;--line:#3c3630;--text:#ddd5ca;--muted:#9a9185;--faint:#645c54;--inverse:#171513;--accent:#6a9c88;--accent-soft:#213128;--wine:#b08a96;--wine-soft:#32252a;--gold:#c1a266;--gold-soft:#382d1a;--shadow:0 14px 40px rgba(0,0,0,.28);
    }
    *{box-sizing:border-box;margin:0;padding:0}
    html{-webkit-font-smoothing:antialiased;scroll-behavior:smooth}
    body{font-family:var(--font-body);background:var(--bg);color:var(--text);min-height:100dvh;line-height:1.5}
    button,input,textarea,select{font:inherit;color:inherit}
    button{cursor:pointer;border:none;background:none}
    img,svg{display:block;max-width:100%}
    :focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:10px}

    .shell{display:grid;grid-template-columns:var(--sidebar) 1fr;min-height:100dvh}
    .sidebar{background:var(--surface);border-right:1px solid var(--line);padding:1.25rem;display:flex;flex-direction:column;gap:1.1rem;position:sticky;top:0;height:100dvh}
    .logo{display:flex;gap:.85rem;align-items:flex-start;padding:.4rem .25rem 1rem;border-bottom:1px solid var(--line)}
    .logo-mark{width:40px;height:40px;border-radius:13px;background:linear-gradient(145deg,var(--accent),var(--wine));display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:var(--shadow)}
    .logo-mark i{width:18px;height:18px}
    .logo h1{font-family:var(--font-display);font-size:1.35rem;font-weight:400;line-height:1}
    .logo p{font-size:var(--text-xs);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-top:.3rem}
    .nav{display:flex;flex-direction:column;gap:.25rem}
    .nav-label{font-size:var(--text-xs);letter-spacing:.1em;text-transform:uppercase;color:var(--faint);padding:.5rem .55rem .25rem}
    .nav-btn{display:flex;align-items:center;gap:.75rem;padding:.82rem .8rem;border-radius:999px;color:var(--muted);transition:all var(--tr);text-align:left}
    .nav-btn:hover{background:var(--surface-2);color:var(--text)}
    .nav-btn.active{background:var(--text);color:var(--inverse)}
    .nav-btn i{width:16px;height:16px}
    .side-note{margin-top:auto;background:var(--surface-2);border:1px solid var(--line);border-radius:18px;padding:1rem}
    .side-note strong{display:block;font-size:var(--text-sm);margin-bottom:.3rem}
    .side-note p{font-size:var(--text-xs);color:var(--muted)}

    .content{display:flex;flex-direction:column;min-width:0}
    .topbar{height:var(--header);padding:0 1.25rem;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);position:sticky;top:0;background:color-mix(in srgb,var(--bg) 92%, transparent);backdrop-filter:blur(14px);z-index:30}
    .title h2{font-family:var(--font-display);font-size:var(--text-xl);font-weight:400;line-height:1}
    .title p{font-size:var(--text-sm);color:var(--muted);margin-top:.15rem}
    .actions{display:flex;gap:.55rem;align-items:center}
    .btn,.icon-btn,.pill{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;height:40px;padding:0 .95rem;border-radius:999px;border:1px solid var(--line);background:var(--surface);transition:all var(--tr);color:var(--text)}
    .icon-btn{width:40px;padding:0}
    .btn:hover,.icon-btn:hover,.pill:hover{background:var(--surface-2)}
    .btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}

    .view{display:none;padding:1.25rem}
    .view.active{display:block}
    .page{max-width:1440px;margin:0 auto}
    .muted{color:var(--muted)}
    .eyebrow{font-size:var(--text-xs);letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}

    .card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius-l);box-shadow:var(--shadow)}
    .panel{padding:1.05rem 1.05rem 1rem}
    .panel-head{display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;margin-bottom:.9rem}
    .panel-head h3,.panel-head h4{font-size:var(--text-sm);letter-spacing:.08em;text-transform:uppercase;color:var(--faint);font-weight:600}
    .panel-head span{font-size:12px;color:var(--muted)}

    .command-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:1rem;margin-bottom:1rem}
    .hero{padding:1.4rem}
    .hero h3{font-family:var(--font-display);font-size:var(--text-2xl);font-weight:400;line-height:.96;max-width:10ch;margin:.5rem 0 .8rem}
    .hero p{max-width:60ch;color:var(--muted)}
    .hero-actions{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1rem}
    .summary{padding:1.2rem;display:grid;gap:.8rem;align-content:start}
    .summary-row{display:flex;justify-content:space-between;gap:1rem;padding:.75rem 0;border-top:1px solid var(--line)}
    .summary-row:first-of-type{border-top:none;padding-top:0}
    .summary-row strong{display:block;font-size:var(--text-lg);font-family:var(--font-display);font-weight:400}
    .summary-row span{font-size:var(--text-xs);color:var(--muted)}

    .studio-grid{display:grid;grid-template-columns:1.05fr .95fr .75fr;gap:1rem}
    .stack{display:flex;flex-direction:column;gap:1rem}
    .task{display:grid;grid-template-columns:1fr auto;gap:.8rem;align-items:center;padding:.9rem;border-radius:18px;background:var(--surface-2);border:1px solid var(--line)}
    .task strong{display:block;font-size:var(--text-sm);margin-bottom:.2rem}
    .task p{font-size:var(--text-sm);color:var(--muted)}
    .task-actions{display:flex;gap:.45rem;flex-wrap:wrap;justify-content:flex-end}
    .mini{display:inline-flex;align-items:center;gap:.35rem;padding:.5rem .75rem;border-radius:999px;border:1px solid var(--line);background:var(--surface);font-size:12px}

    .list{display:flex;flex-direction:column;gap:.7rem}
    .item{padding:.95rem;border-radius:18px;background:var(--surface-2);border:1px solid var(--line)}
    .item strong{display:block;font-size:var(--text-sm);margin-bottom:.2rem}
    .item p{font-size:var(--text-sm);color:var(--muted)}
    .item span{display:block;font-size:12px;color:var(--faint);margin-top:.3rem}

    .timeline{display:flex;flex-direction:column;gap:.85rem}
    .timeline-item{position:relative;padding-left:1rem}
    .timeline-item::before{content:'';position:absolute;left:0;top:.45rem;width:7px;height:7px;border-radius:50%;background:var(--accent)}
    .timeline-item strong{display:block;font-size:var(--text-sm);margin-bottom:.15rem}
    .timeline-item p{font-size:var(--text-sm);color:var(--muted)}

    .columns{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
    .message-card,.piece-card,.workflow-card{padding:1rem;border-radius:20px;background:var(--surface-2);border:1px solid var(--line)}
    .message-type,.status-badge,.small-tag{display:inline-flex;padding:.2rem .55rem;border-radius:999px;font-size:11px;margin-bottom:.5rem}
    .message-type{background:var(--accent-soft);color:var(--accent)}
    .status-badge{background:var(--gold-soft);color:var(--gold)}
    .small-tag{background:var(--wine-soft);color:var(--wine)}
    .message-card h5,.piece-card h5,.workflow-card h5{font-size:var(--text-sm);margin-bottom:.2rem}
    .message-card p,.piece-card p,.workflow-card p{font-size:var(--text-sm);color:var(--muted)}
    .message-meta{font-size:12px;color:var(--faint);margin:.35rem 0 .45rem}

    .simple-table{overflow:auto;max-height:72dvh}
    table{width:100%;border-collapse:collapse}
    th,td{text-align:left;padding:.95rem 1rem;border-bottom:1px solid var(--line);vertical-align:top}
    th{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);background:var(--surface);position:sticky;top:0}
    tbody tr:hover td{background:var(--surface-2)}

    .toolbar{display:flex;gap:.6rem;flex-wrap:wrap;padding:1rem;border-bottom:1px solid var(--line)}
    .input,.select,textarea{width:100%;padding:.85rem .95rem;border-radius:16px;border:1px solid var(--line);background:var(--surface);outline:none}
    .planner-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;padding:1rem}
    .section-col{background:var(--surface-2);border:1px solid var(--line);border-radius:22px}
    .section-col header{padding:1rem;border-bottom:1px solid var(--line);display:flex;justify-content:space-between}
    .dropzone{padding:1rem;display:flex;flex-direction:column;gap:.75rem;min-height:220px}

    .piece-row{display:flex;gap:.8rem;align-items:flex-start;padding:.9rem;border-radius:18px;background:var(--surface);border:1px solid var(--line)}
    .piece-no{font-family:var(--font-display);font-size:1.35rem;color:var(--faint);line-height:1}
    .piece-row h5{font-size:var(--text-sm);margin-bottom:.15rem}
    .piece-row p{font-size:12px;color:var(--muted)}

    .kanban{display:grid;grid-template-columns:repeat(5,minmax(220px,1fr));gap:1rem;overflow:auto}
    .kanban-col{background:var(--surface);border:1px solid var(--line);border-radius:22px;min-width:220px}
    .kanban-col header{padding:1rem;border-bottom:1px solid var(--line);display:flex;justify-content:space-between}
    .kanban-list{padding:1rem;display:flex;flex-direction:column;gap:.75rem}

    .modal-wrap{position:fixed;inset:0;background:rgba(18,14,10,.42);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:1rem;z-index:80}
    .modal-wrap.open{display:flex}
    .modal{width:min(920px,100%);background:var(--surface);border:1px solid var(--line);border-radius:32px;overflow:hidden;box-shadow:var(--shadow)}
    .modal-head{padding:1.1rem 1.2rem;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:1rem}
    .modal-head h3{font-family:var(--font-display);font-size:1.8rem;font-weight:400;line-height:1}
    .modal-body{display:grid;grid-template-columns:1.1fr .9fr}
    .modal-main,.modal-side{padding:1.2rem}
    .modal-side{background:var(--surface-2);border-left:1px solid var(--line)}
    .excerpt{font-family:var(--font-display);font-style:italic;font-size:1.12rem;line-height:1.8;border-left:2px solid var(--accent);padding-left:1rem;margin-bottom:1rem}
    .comment{padding:.8rem;border-radius:16px;background:var(--surface);border:1px solid var(--line);margin-bottom:.6rem}
    .comment p{font-size:var(--text-sm);color:var(--muted)}
    .meta-block{margin-bottom:1rem}
    .meta-block strong{display:block;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--faint);margin-bottom:.25rem}
    .toast{position:fixed;left:50%;bottom:1rem;transform:translateX(-50%) translateY(10px);background:var(--text);color:var(--inverse);padding:.8rem 1rem;border-radius:999px;opacity:0;pointer-events:none;transition:all .22s ease;z-index:90}
    .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

    @media (max-width:1280px){.studio-grid,.command-grid,.columns,.modal-body{grid-template-columns:1fr}.planner-grid{grid-template-columns:1fr}.kanban{grid-template-columns:1fr 1fr}.shell{grid-template-columns:220px 1fr}}
    @media (max-width:920px){.shell{grid-template-columns:1fr}.sidebar{position:relative;height:auto}.topbar{padding:0 1rem}.view{padding:1rem}.kanban{grid-template-columns:1fr}.studio-grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <div class="shell">
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-mark"><i data-lucide="book-heart"></i></div>
        <div>
          <h1>Editors’ House</h1>
          <p>Whole editorial desk</p>
        </div>
      </div>

      <div class="nav">
        <div class="nav">
        <div class="nav-label">Desk</div>
        <button class="nav-btn active" data-view="home"><i data-lucide="layout-dashboard"></i><span>Command centre</span></button>
        <button class="nav-btn" data-view="workflow"><i data-lucide="list-checks"></i><span>Workflow</span></button>
        <button class="nav-btn" data-view="pieces"><i data-lucide="files"></i><span>Pieces</span></button>
        <button class="nav-btn" data-view="garden"><i data-lucide="flower-2"></i><span>Garden viewer</span></button>
        <button class="nav-btn" data-view="production"><i data-lucide="kanban-square"></i><span>Production</span></button>
      </div>

      <div class="nav">
        <div class="nav-label">Journal</div>
        <button class="nav-btn" data-view="planner"><i data-lucide="book-open"></i><span>Issues</span></button>
        <button class="nav-btn" data-view="publishing"><i data-lucide="send"></i><span>Publishing</span></button>
        <button class="nav-btn" data-view="conversations"><i data-lucide="messages-square"></i><span>Conversations</span></button>
        <button class="nav-btn" data-view="author-comms"><i data-lucide="mail-open"></i><span>Author messages</span></button>
        <button class="nav-btn" data-view="style"><i data-lucide="library-big"></i><span>House style</span></button>
      </div>

      <div class="side-note">
        <strong>Issue XIV — Thresholds</strong>
        <p>Designed as the full editors’ app: submissions, pieces, author messages, workflow, and issues all sit in one shared place.</p>
      </div>
    </aside>

    <div class="content">
      <header class="topbar">
        <div class="title">
          <h2 id="pageTitle">Command centre</h2>
          <p id="pageSub">The whole editorial operation, without flooding the screen</p>
        </div>
        <div class="actions">
          <button class="btn" id="findBtn"><i data-lucide="search"></i>Find</button>
          <button class="btn primary" id="noteBtn"><i data-lucide="square-pen"></i>Add note</button>
          <button class="icon-btn" id="themeToggle" aria-label="Toggle theme"><i data-lucide="moon"></i></button>
        </div>
      </header>

      <main>
        <section class="view active" id="view-home">
          <div class="page">
            <div class="command-grid">
              <div class="card hero">
                <div class="eyebrow">A more functional collaborative desk</div>
                <h3>The whole issue feels shared, but never chaotic.</h3>
                <p class="muted">This version is built as a side-navigation editorial home. The point is not to show everything at once. The point is to show the things that matter together: what needs action, what is being discussed, what has been promised to writers, what is moving through the journal, and what belongs to a specific issue.</p>
                <div class="hero-actions">
                  <button class="btn primary" onclick="goView('workflow')"><i data-lucide="list-checks"></i>See what needs doing</button>
                  <button class="btn" onclick="goView('author-comms')"><i data-lucide="mail-open"></i>Open author messages</button>
                  <button class="btn" onclick="goView('planner')"><i data-lucide="book-open"></i>Adjust issue order</button>
                </div>
              </div>
              <div class="card summary">
                <div class="eyebrow">At a glance</div>
                <div class="summary-row"><div><strong>5</strong><span>things needing action</span></div><div class="muted">today</div></div>
                <div class="summary-row"><div><strong>31</strong><span>active pieces across desk</span></div><div class="muted">live</div></div>
                <div class="summary-row"><div><strong>4</strong><span>Garden pieces flagged</span></div><div class="muted">watching</div></div>
                <div class="summary-row"><div><strong>4</strong><span>author threads visible to team</span></div><div class="muted">shared</div></div>
                <div class="summary-row"><div><strong>3</strong><span>issues in motion</span></div><div class="muted">spring–autumn</div></div>
                <div class="summary-row"><div><strong>5</strong><span>publishing destinations</span></div><div class="muted">print · online · Substack</div></div>
              </div>
            </div>

            <div class="studio-grid">
              <div class="card panel">
                <div class="panel-head"><h3>What needs action now</h3><span>Direct next steps</span></div>
                <div class="list" id="actionList"></div>
              </div>

              <div class="stack">
                <div class="card panel">
                  <div class="panel-head"><h3>Live conversations</h3><span>Most active threads</span></div>
                  <div class="list" id="conversationList"></div>
                </div>
                <div class="card panel">
                  <div class="panel-head"><h3>Author messages</h3><span>Recent outward communication</span></div>
                  <div class="list" id="authorList"></div>
                </div>
              </div>

              <div class="stack">
                <div class="card panel">
                  <div class="panel-head"><h3>Journal movement</h3><span>Across issues and publishing</span></div>
                  <div class="timeline" id="issueMovement"></div>
                </div>
                <div class="card panel">
                  <div class="panel-head"><h3>Quick context</h3><span>Shared editorial principles</span></div>
                  <div class="workflow-card"><h5>Nothing private by accident</h5><p>Piece discussion, author messaging, and issue placement all remain visible to the editors who need that context.</p></div>
                  <div class="workflow-card" style="margin-top:.75rem"><h5>One clear next step</h5><p>Every item should surface what to do next: read, reply, place, proof, assign, or decide.</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="view" id="view-workflow">
          <div class="page columns">
            <div class="card panel">
              <div class="panel-head"><h3>Workflow queue</h3><span>Everything waiting for action</span></div>
              <div id="workflowFeed"></div>
            </div>
            <div class="card panel">
              <div class="panel-head"><h3>Action lanes</h3><span>Simple editorial paths</span></div>
              <div class="workflow-card"><span class="status-badge">Read</span><h5>Needs a first reader</h5><p>Assign by type, open the piece, or leave a note before handoff.</p></div>
              <div class="workflow-card" style="margin-top:.8rem"><span class="small-tag">Reply</span><h5>Needs an answer</h5><p>Accept, decline, request edits, or send a hold note without losing context.</p></div>
              <div class="workflow-card" style="margin-top:.8rem"><span class="status-badge">Place</span><h5>Needs issue placement</h5><p>Move accepted work into the issue order when the timing feels right.</p></div>
              <div class="workflow-card" style="margin-top:.8rem"><span class="small-tag">Proof</span><h5>Needs final check</h5><p>Track copy, proof, and lock status in one shared lane.</p></div>
            </div>
          </div>
        </section>

        <section class="view" id="view-conversations">
          <div class="page columns">
            <div class="card panel">
              <div class="panel-head"><h3>Editorial conversations</h3><span>Discussion attached to work</span></div>
              <div id="conversationColumns"></div>
            </div>
            <div class="card panel">
              <div class="panel-head"><h3>Conversation guidance</h3><span>Shared tone</span></div>
              <div class="workflow-card"><h5>Reader notes</h5><p>Name what the piece is doing before naming what is not working.</p></div>
              <div class="workflow-card" style="margin-top:.8rem"><h5>Internal decisions</h5><p>Keep reasoning visible so everyone understands why a piece moved or stayed put.</p></div>
              <div class="workflow-card" style="margin-top:.8rem"><h5>Volunteer readers</h5><p>Discuss fit, trust, and taste openly before giving access to the queue.</p></div>
            </div>
          </div>
        </section>

        <section class="view" id="view-author-comms">
          <div class="page columns">
            <div class="card panel">
              <div class="panel-head"><h3>Shared author messages</h3><span>Visible to the issue team</span></div>
              <div id="authorCommFeed"></div>
            </div>
            <div class="card panel">
              <div class="panel-head"><h3>Why shared messages help</h3><span>Clearer collaboration</span></div>
              <div class="workflow-card"><h5>No hidden promises</h5><p>If an editor offers a date, asks for a cut, or discusses proof, the whole issue team can see it.</p></div>
              <div class="workflow-card" style="margin-top:.8rem"><h5>Less duplicated work</h5><p>Editors do not send the same question twice or contradict one another by accident.</p></div>
              <div class="workflow-card" style="margin-top:.8rem"><h5>Better continuity</h5><p>If someone steps in mid-process, the communication history is already there.</p></div>
            </div>
          </div>
        </section>

        <section class="view" id="view-planner">
          <div class="page columns">
            <div class="card panel" style="grid-column:span 1">
              <div class="panel-head"><h3>Issue boards</h3><span>Current and upcoming issues</span></div>
              <div class="planner-grid" id="plannerGrid"></div>
            </div>
            <div class="card panel">
              <div class="panel-head"><h3>Current issue note</h3><span>Shared editorial intention</span></div>
              <div class="workflow-card"><h5>The issue should move from weather to interior speech.</h5><p>Hold the argument-driven essay slightly later. Let the opening feel spacious and atmospheric.</p></div>
              <textarea rows="7" style="margin-top:1rem">Open with salt. Let the essay answer the poem, not explain it.</textarea>
              <button class="btn primary" style="margin-top:.8rem" onclick="toast('Issue note saved')">Save note</button>
            </div>
          </div>
        </section>

        <section class="view" id="view-pieces">
          <div class="page card">
            <div class="toolbar">
              <div style="width:100%;font-size:12px;color:var(--muted)">Click a row to open the piece, see notes, and check what has already been said internally and to the author.</div>
              <input class="input" id="searchInput" placeholder="Search by title or writer" style="max-width:280px" />
              <select class="select" id="sourceFilter" style="max-width:180px"><option value="all">All places</option><option value="garden">Garden</option><option value="external">Outside the platform</option><option value="invited">Invited</option></select>
              <select class="select" id="genreFilter" style="max-width:180px"><option value="all">All types</option><option value="Poetry">Poetry</option><option value="Fiction">Fiction</option><option value="Essay">Essay</option></select>
            </div>
            <div class="simple-table">
              <table>
                <thead><tr><th>Piece</th><th>Where from</th><th>Type</th><th>Where it is</th><th>Who has it</th><th>Received</th></tr></thead>
                <tbody id="pieceTable"></tbody>
              </table>
            </div>
          </div>
        </section>

        
        <section class="view" id="view-garden">
          <div class="page">
            <div class="command-grid" style="margin-bottom:1rem">
              <div class="card panel">
                <div class="panel-head"><h3>Garden viewer</h3><span>What is growing inside The Gardens</span></div>
                <div class="workflow-card"><h5>A shared view into Garden work</h5><p>This is where editors can quietly browse writing that lives in the Garden, see what is drawing attention, and pull pieces into the editorial desk without losing context.</p></div>
                <div class="task-actions" style="margin-top:1rem">
                  <button class="mini" onclick="toast('Open Garden piece')">Open selected piece</button>
                  <button class="mini" onclick="toast('Move from Garden to desk')">Move to desk</button>
                  <button class="mini" onclick="toast('Leave internal note')">Add note</button>
                </div>
              </div>
              <div class="card panel">
                <div class="panel-head"><h3>Garden signals</h3><span>Useful context, not noisy metrics</span></div>
                <div class="list" id="gardenSignals"></div>
              </div>
            </div>
            <div class="columns">
              <div class="card panel">
                <div class="panel-head"><h3>Garden pieces</h3><span>Browse what is inside the Garden</span></div>
                <div id="gardenFeed"></div>
              </div>
              <div class="card panel">
                <div class="panel-head"><h3>Garden to desk</h3><span>How a piece moves inward</span></div>
                <div class="workflow-card"><h5>Seen in the Garden</h5><p>The piece exists inside the Garden and is visible to editors in this viewer.</p></div>
                <div class="workflow-card" style="margin-top:.75rem"><h5>Marked for review</h5><p>An editor has flagged it for closer attention, internal discussion, or possible placement.</p></div>
                <div class="workflow-card" style="margin-top:.75rem"><h5>Moved to the desk</h5><p>The piece becomes part of the main editorial workflow while still retaining its Garden origin.</p></div>
                <div class="workflow-card" style="margin-top:.75rem"><h5>Placed in issue or project</h5><p>From there, it can belong to print, online, Substack, or another project.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section class="view" id="view-production">
          <div class="page">
            <div class="kanban" id="kanban"></div>
          </div>
        </section>

        <section class="view" id="view-style">
          <div class="page columns">
            <div class="card panel">
              <div class="panel-head"><h3>House style</h3><span>What keeps the journal consistent</span></div>
              <div class="workflow-card"><h5>Spelling</h5><p>British spelling unless preserving quoted or contributor-specific usage.</p></div>
              <div class="workflow-card" style="margin-top:.8rem"><h5>Titles</h5><p>Poem and essay titles in roman; books and journals in italics.</p></div>
              <div class="workflow-card" style="margin-top:.8rem"><h5>Bios</h5><p>Two sentences, calm, factual, no hype.</p></div>
            </div>
            <div class="card panel">
              <div class="panel-head"><h3>Editorial voice</h3><span>How the journal sounds</span></div>
              <div class="workflow-card"><h5>Acceptances</h5><p>Warm and exact. Attentive, not inflated.</p></div>
              <div class="workflow-card" style="margin-top:.8rem"><h5>Declines</h5><p>Brief, respectful, and never falsely intimate.</p></div>
              <div class="workflow-card" style="margin-top:.8rem"><h5>Banned language</h5><p>No “journey”, “delve”, “powerful”, or synthetic AI-toned praise.</p></div>
            </div>
          </div>
        </section>

        <section class="view" id="view-publishing">
          <div class="page">
            <div class="command-grid" style="margin-bottom:1rem">
              <div class="card panel">
                <div class="panel-head"><h3>Publishing destinations</h3><span>Where work goes when it leaves the desk</span></div>
                <div class="list" id="destinationList"></div>
              </div>
              <div class="card panel">
                <div class="panel-head"><h3>Active projects</h3><span>Beyond the main journal</span></div>
                <div class="list" id="projectList"></div>
              </div>
            </div>
            <div class="columns">
              <div class="card panel">
                <div class="panel-head"><h3>Print issue — Issue XIV</h3><span>Physical journal, autumn 2026</span></div>
                <div class="workflow-card"><h5>Format</h5><p>A5, perfect bound, 120pp. Designed and typeset in InDesign. PDF-to-press via the printer in Leeds.</p></div>
                <div class="workflow-card" style="margin-top:.75rem"><h5>What it needs</h5><p>Final lock, print-ready PDF, InDesign package, ISBN, printer details, and confirmed production budget by end of month.</p></div>
                <div class="workflow-card" style="margin-top:.75rem"><h5>Pieces assigned</h5><p>12 confirmed. 2 still needing placement. Cover image approved.</p></div>
                <div class="task-actions" style="margin-top:1rem">
                  <button class="mini" onclick="toast('Open print spec')">Print spec</button>
                  <button class="mini" onclick="toast('Assign pieces to print issue')">Assign pieces</button>
                  <button class="mini" onclick="toast('Send to designer')">Send to designer</button>
                </div>
              </div>
              <div class="card panel">
                <div class="panel-head"><h3>Online issue — Spring web</h3><span>Site publication, late April 2026</span></div>
                <div class="workflow-card"><h5>Format</h5><p>HTML publication on thepagegalleryjournal.com. Pieces published individually with author bios and issue context.</p></div>
                <div class="workflow-card" style="margin-top:.75rem"><h5>What it needs</h5><p>Proof, meta descriptions, contributor images, and final editor's note from EiC.</p></div>
                <div class="workflow-card" style="margin-top:.75rem"><h5>Pieces assigned</h5><p>8 confirmed. Online-only version includes one additional essay not in print.</p></div>
                <div class="task-actions" style="margin-top:1rem">
                  <button class="mini" onclick="toast('Open online issue')">Online issue</button>
                  <button class="mini" onclick="toast('Draft editors note')">Editor's note</button>
                  <button class="mini" onclick="toast('Preview on site')">Preview</button>
                </div>
              </div>
              <div class="card panel">
                <div class="panel-head"><h3>Substack</h3><span>The Page Gallery Journal newsletter</span></div>
                <div class="workflow-card"><h5>What goes here</h5><p>Editor's notes, single poems or flash prose ahead of issue publication, reading lists, and reflections from the desk.</p></div>
                <div class="workflow-card" style="margin-top:.75rem"><h5>Permissions and timing</h5><p>Substack publication requires writer permission if the work also appears in print. Flag any dual-use pieces before sending.</p></div>
                <div class="workflow-card" style="margin-top:.75rem"><h5>Next dispatch</h5><p>A poem from Issue XIV — one week before spring issue publishes.</p></div>
                <div class="task-actions" style="margin-top:1rem">
                  <button class="mini" onclick="toast('Draft Substack post')">Draft post</button>
                  <button class="mini" onclick="toast('Check permissions')">Check permissions</button>
                  <button class="mini" onclick="toast('Schedule dispatch')">Schedule</button>
                </div>
              </div>
              <div class="card panel">
                <div class="panel-head"><h3>Special projects</h3><span>Commissioned, collaborative, or event work</span></div>
                <div class="workflow-card"><h5>Reading series</h5><p>Pieces chosen for live reading events need formatting notes and author confirmation of attendance.</p></div>
                <div class="workflow-card" style="margin-top:.75rem"><h5>Collaborations</h5><p>Guest-edited features, exchanges with other journals, or themed commissions tracked here with their own brief and deadline.</p></div>
                <div class="workflow-card" style="margin-top:.75rem"><h5>Archive and anthologies</h5><p>Reprints, anthology submissions, and permissions requests from other publishers sit here, separate from new work.</p></div>
                <div class="task-actions" style="margin-top:1rem">
                  <button class="mini" onclick="toast('New special project')">New project</button>
                  <button class="mini" onclick="toast('Open permissions log')">Permissions</button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  </div>

  <div class="modal-wrap" id="pieceModal">
    <div class="modal">
      <div class="modal-head">
        <div>
          <h3 id="modalTitle">The Weight of Salt</h3>
          <p id="modalAuthor" class="muted" style="margin-top:.35rem">Amara Nwosu · Poetry</p>
        </div>
        <button class="icon-btn" onclick="closeModal()"><i data-lucide="x"></i></button>
      </div>
      <div class="modal-body">
        <div class="modal-main">
          <div class="excerpt" id="modalExcerpt"></div>
          <div id="modalComments"></div>
          <textarea rows="4" placeholder="Write a note for the team"></textarea>
        </div>
        <aside class="modal-side">
          <div class="meta-block"><strong>Where it is now</strong><div id="modalStatus"></div></div>
          <div class="meta-block"><strong>Who has it</strong><div id="modalAssigned"></div></div>
          <div class="meta-block"><strong>Where it came from</strong><div id="modalSource"></div></div>
          <button class="btn primary" style="width:100%;margin-top:1rem" onclick="toast('Moved to the next step')">Move to next step</button>
        </aside>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    const pageMeta = {
      home:['Command centre','The whole editorial operation, without flooding the screen'],
      workflow:['Workflow','Everything waiting for action in one place'],
      conversations:['Conversations','Discussion attached to pieces, issue shaping, and team decisions'],
      'author-comms':['Author messages','Shared editorial-to-author communication for the issue team'],
      planner:['Issues','Shape current and future issues without losing the wider desk'],
      pieces:['Pieces','All writing across the journal in one simple list'],
      garden:['Garden viewer','Browse Garden work, notes, and movement into the editorial desk'],
      production:['Production','Track what is incoming, in edit, in proof, and ready to publish'],
      style:['House style','The rules that keep the whole journal consistent'],
      publishing:['Publishing','Where the work goes — print, online, Substack, and other projects']
    };

    const pieces = [
      {id:1,title:'The Weight of Salt',author:'Amara Nwosu',genre:'Poetry',source:'garden',status:'Reading',assigned:'Giove, Sara',received:'12 Mar 2026',section:'Poetry',excerpt:'The sea was never ours to name. My grandmother understood this in the way of people who have outlasted the words for things.',comments:['The opening image is extraordinary.','One cut requested in stanza four.']},
      {id:2,title:'Three Figures in Fog',author:'Nadia Osei',genre:'Poetry',source:'garden',status:'Incoming',assigned:'James',received:'2 Apr 2026',section:'Poetry',excerpt:'We found them at the treeline, or what we took to be them.',comments:['Needs a first close read.']},
      {id:3,title:'Before the Rain Arrived',author:'Elise Moreau',genre:'Fiction',source:'external',status:'Proof',assigned:'Giove, Sara',received:'18 Feb 2026',section:'Fiction',excerpt:'The summer she turned forty-three, my mother stopped trusting forecasts.',comments:['Proof out with writer now.']},
      {id:4,title:'A Cartography of Grief',author:'Chen Wei',genre:'Essay',source:'invited',status:'Line Edit',assigned:'Sara',received:'4 Mar 2026',section:'Essay',excerpt:'There is no map for this. I have checked.',comments:['Middle section needs tightening.']},
      {id:5,title:'Landmass',author:'Ingrid Halvorsen',genre:'Poetry',source:'garden',status:'Accepted',assigned:'Giove',received:'25 Mar 2026',section:'Poetry',excerpt:'What the fjord remembers is not what we remember of the fjord.',comments:['Accepted, not yet placed.']},
      {id:6,title:'Interior with Blue Walls',author:'Marcus Del Valle',genre:'Fiction',source:'external',status:'Copyedit',assigned:'James',received:'20 Mar 2026',section:'Fiction',excerpt:'He had painted the walls that particular blue, not sky, not sea, but something between.',comments:['Copy question on paragraph break.']},
      {id:7,title:'In Praise of Difficulty',author:'Rohan Mehta',genre:'Essay',source:'invited',status:'Reading',assigned:'Giove',received:'22 Mar 2026',section:'Essay',excerpt:'We have made everything easy and called this progress.',comments:['Strong, slightly too declarative at start.']}
    ];

    const actionItems = [
      {title:'Assign a first reader', body:'Three Figures in Fog is still waiting for a close first read.', buttons:['Assign reader','Open piece']},
      {title:'Reply to volunteer application', body:'A poetry-focused applicant wrote a thoughtful note about the journal philosophy.', buttons:['Open application','Reply']},
      {title:'Place accepted poem', body:'Landmass has been accepted but still needs a place in the issue.', buttons:['Place in issue']},
      {title:'Send line edit request', body:'A Cartography of Grief needs a shaped note to the writer before copyedit.', buttons:['Draft note','Open message']},
      {title:'Approve issue brief', body:'The open call language is drafted but not yet approved for publication.', buttons:['Review brief']}
    ];

    const conversations = [
      {title:'The Weight of Salt', body:'Reader notes, placement discussion, and acceptance language are all active here.', meta:'2 internal threads'},
      {title:'Volunteer readers', body:'Applications, taste fit, and permission decisions are being discussed together.', meta:'2 team threads'},
      {title:'Open call wording', body:'Issue brief, access note, and response timeline are under review.', meta:'1 issue thread'}
    ];

    const authorMessages = [
      {piece:'The Weight of Salt',type:'Acceptance',body:'We would be delighted to publish this poem in Issue XIV. We would love to ask for one small cut in stanza four before proof.',meta:'Sent by Sophia · visible to Issue XIV team'},
      {piece:'A Cartography of Grief',type:'Edit request',body:'Would you be open to tightening the middle section by roughly one paragraph? The opening and close are exceptionally strong.',meta:'Sent by Sara · visible to Issue XIV team'},
      {piece:'Before the Rain Arrived',type:'Proof',body:'Attaching proof for final review. Please check title, paragraph spacing, and contributor bio by Friday.',meta:'Sent by Giove · visible to Issue XIV team'}
    ];

    const movement = [
      {title:'Spring web issue nearing lock', body:'Proof and contributor bios are being finalised this week.'},
      {title:'Landmass accepted', body:'Ready for placement in the opening movement of the issue.'},
      {title:'Before the Rain Arrived in proof', body:'Writer has proof and final bio request.'},
      {title:'Essay section still balancing tone', body:'Need one quieter essay against the declarative piece.'}
    ];

    const plannerSections = ['Poetry','Fiction','Essay'];
    const productionStages = ['Incoming','Reading','Line Edit','Copyedit','Proof'];

    const gardenPieces = [
      {title:'The Weight of Salt', author:'Amara Nwosu', note:'Already pulled into Issue XIV. Still marked as Garden-origin.', signal:'Strong editor attention'},
      {title:'Three Figures in Fog', author:'Nadia Osei', note:'Still living in the Garden. Needs first close read.', signal:'Marked for review'},
      {title:'Moth Study in Winter', author:'Leila Haddad', note:'Quiet prose fragment with strong atmosphere. Not yet moved to desk.', signal:'Saved by 3 editors'},
      {title:'After the Orchard Fire', author:'Tom Armitage', note:'Essay excerpt with possible place in online issue or Substack.', signal:'Fits current themes'}
    ];
    const gardenSignalsData = [
      {name:'Marked for review', desc:'4 Garden pieces currently flagged by editors.'},
      {name:'Moved to desk this month', desc:'3 pieces have crossed from Garden into the main editorial workflow.'},
      {name:'Useful for Substack', desc:'2 short pieces feel right for newsletter publication before issue launch.'}
    ];

    const destinations = [
      {name:'Print journal', desc:'A5, perfect bound. Next issue: autumn 2026.', status:'In prep'},
      {name:'Online journal', desc:'thepagegalleryjournal.com. Pieces published individually.', status:'Proof stage'},
      {name:'Substack', desc:'Editor notes, single pieces, and dispatch ahead of issues.', status:'Active'},
      {name:'Reading series', desc:'Pieces selected for live events and audio.', status:'Ongoing'},
      {name:'Special projects', desc:'Collaborations, guest edits, anthology submissions.', status:'Rolling'}
    ];
    const projects = [
      {name:'Guest-edited folio — Landscape', desc:'Twelve pieces on landscape, edited by a guest. Brief sent.', status:'Commissioning'},
      {name:'Exchange with Sonder Magazine', desc:'Two pieces swapped and published simultaneously.', status:'Agreed'},
      {name:'Archive selection for anthology', desc:'Five pieces under consideration. Rights pending.', status:'Permissions'},
      {name:'Spring reading — London', desc:'Four writers confirmed. Venue confirmed.', status:'Scheduled'}
    ];

    function renderGarden(){
      document.getElementById('gardenFeed').innerHTML = gardenPieces.map(g=>`<div class="message-card"><div class="message-type">Garden</div><h5>${g.title}</h5><div class="message-meta">${g.author} · ${g.signal}</div><p>${g.note}</p><div class="task-actions" style="margin-top:.75rem"><button class="mini" onclick="toast('Open Garden piece')">Open</button><button class="mini" onclick="toast('Flagged for review')">Flag</button><button class="mini" onclick="toast('Moved to desk')">Move to desk</button></div></div>`).join('');
      document.getElementById('gardenSignals').innerHTML = gardenSignalsData.map(s=>`<div class="item"><strong>${s.name}</strong><p>${s.desc}</p></div>`).join('');
    }

    function renderPublishing(){
      document.getElementById('destinationList').innerHTML = destinations.map(d=>`<div class="task"><div><strong>${d.name}</strong><p>${d.desc}</p></div><div><span class="status-badge">${d.status}</span></div></div>`).join('');
      document.getElementById('projectList').innerHTML = projects.map(d=>`<div class="task"><div><strong>${d.name}</strong><p>${d.desc}</p></div><div><span class="small-tag">${d.status}</span></div></div>`).join('');
    }

    function initNav(){
      document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>goView(btn.dataset.view)));
    }

    function goView(view){
      document.querySelectorAll('.nav-btn').forEach(btn=>btn.classList.toggle('active', btn.dataset.view===view));
      document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active', v.id===`view-${view}`));
      document.getElementById('pageTitle').textContent = pageMeta[view][0];
      document.getElementById('pageSub').textContent = pageMeta[view][1];
      window.scrollTo({top:0,behavior:'smooth'});
    }

    function renderHome(){
      document.getElementById('actionList').innerHTML = actionItems.map(item=>`<div class="task"><div><strong>${item.title}</strong><p>${item.body}</p></div><div class="task-actions">${item.buttons.map(b=>`<button class="mini" onclick="toast('${b}')">${b}</button>`).join('')}</div></div>`).join('');
      document.getElementById('conversationList').innerHTML = conversations.map(c=>`<div class="item"><strong>${c.title}</strong><p>${c.body}</p><span>${c.meta}</span></div>`).join('');
      document.getElementById('authorList').innerHTML = authorMessages.map(m=>`<div class="item"><strong>${m.piece}</strong><p>${m.body}</p><span>${m.type} · ${m.meta}</span></div>`).join('');
      document.getElementById('issueMovement').innerHTML = movement.map(m=>`<div class="timeline-item"><strong>${m.title}</strong><p>${m.body}</p></div>`).join('');
    }

    function renderWorkflow(){
      document.getElementById('workflowFeed').innerHTML = actionItems.map(item=>`<div class="workflow-card" style="margin-bottom:.8rem"><h5>${item.title}</h5><p>${item.body}</p><div class="task-actions" style="margin-top:.75rem">${item.buttons.map(b=>`<button class="mini" onclick="toast('${b}')">${b}</button>`).join('')}</div></div>`).join('');
    }

    function renderConversations(){
      const left = conversations.slice(0,2), right = conversations.slice(2);
      document.getElementById('conversationColumns').innerHTML = `<div class="columns"><div>${left.map(c=>`<div class="message-card"><div class="message-type">Thread</div><h5>${c.title}</h5><div class="message-meta">${c.meta}</div><p>${c.body}</p></div>`).join('')}</div><div>${right.map(c=>`<div class="message-card"><div class="message-type">Thread</div><h5>${c.title}</h5><div class="message-meta">${c.meta}</div><p>${c.body}</p></div>`).join('')}</div></div>`;
    }

    function renderAuthorComms(){
      document.getElementById('authorCommFeed').innerHTML = authorMessages.map(m=>`<div class="message-card"><div class="message-type">${m.type}</div><h5>${m.piece}</h5><div class="message-meta">${m.meta}</div><p>${m.body}</p><div class="task-actions" style="margin-top:.75rem"><button class="mini" onclick="toast('Open thread')">Open thread</button><button class="mini" onclick="toast('Draft reply')">Draft reply</button></div></div>`).join('');
    }

    function renderPlanner(){
      document.getElementById('plannerGrid').innerHTML = plannerSections.map(section=>{
        const items = pieces.filter(p=>p.section===section);
        return `<section class="section-col"><header><strong style="font-size:14px">${section}</strong><span style="font-size:12px;color:var(--faint)">${items.length}</span></header><div class="dropzone">${items.map((p,i)=>`<div class="piece-row" onclick="openPiece(${p.id})"><div class="piece-no">${i+1}</div><div><h5>${p.title}</h5><p>${p.author}</p></div></div>`).join('')}</div></section>`;
      }).join('');
    }

    function renderPieces(){
      const q = document.getElementById('searchInput')?.value?.toLowerCase() || '';
      const sf = document.getElementById('sourceFilter')?.value || 'all';
      const gf = document.getElementById('genreFilter')?.value || 'all';
      const filtered = pieces.filter(p => (!q || p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q)) && (sf==='all' || p.source===sf) && (gf==='all' || p.genre===gf));
      document.getElementById('pieceTable').innerHTML = filtered.map(p=>`<tr onclick="openPiece(${p.id})"><td><strong>${p.title}</strong><div style="font-size:12px;color:var(--muted);margin-top:2px">${p.author}</div></td><td>${cap(p.source)}</td><td>${p.genre}</td><td>${p.status}</td><td>${p.assigned}</td><td>${p.received}</td></tr>`).join('');
    }

    function renderProduction(){
      document.getElementById('kanban').innerHTML = productionStages.map(stage=>{
        const items = pieces.filter(p=>p.status===stage);
        return `<section class="kanban-col"><header><strong style="font-size:14px">${stage}</strong><span style="font-size:12px;color:var(--faint)">${items.length}</span></header><div class="kanban-list">${items.map(p=>`<div class="piece-card" onclick="openPiece(${p.id})"><span class="status-badge">${p.genre}</span><h5>${p.title}</h5><p>${p.author}</p></div>`).join('')}</div></section>`;
      }).join('');
    }

    function openPiece(id){
      const p = pieces.find(x=>x.id===id); if(!p) return;
      document.getElementById('modalTitle').textContent = p.title;
      document.getElementById('modalAuthor').textContent = `${p.author} · ${p.genre}`;
      document.getElementById('modalExcerpt').textContent = p.excerpt;
      document.getElementById('modalStatus').textContent = p.status;
      document.getElementById('modalAssigned').textContent = p.assigned;
      document.getElementById('modalSource').textContent = cap(p.source);
      document.getElementById('modalComments').innerHTML = p.comments.map(c=>`<div class="comment"><p>${c}</p></div>`).join('');
      document.getElementById('pieceModal').classList.add('open');
      lucide.createIcons();
    }
    function closeModal(){document.getElementById('pieceModal').classList.remove('open');}
    document.getElementById('pieceModal').addEventListener('click',e=>{if(e.target.id==='pieceModal') closeModal();});

    function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
    function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}

    document.getElementById('searchInput').addEventListener('input',renderPieces);
    document.getElementById('sourceFilter').addEventListener('change',renderPieces);
    document.getElementById('genreFilter').addEventListener('change',renderPieces);
    document.getElementById('findBtn').addEventListener('click',()=>toast('Use the Pieces table to find any title or writer'));
    document.getElementById('noteBtn').addEventListener('click',()=>toast('Shared note started'));
    document.getElementById('themeToggle').addEventListener('click',()=>{
      const root=document.documentElement; const dark=root.getAttribute('data-theme')==='dark';
      root.setAttribute('data-theme',dark?'light':'dark');
      document.querySelector('#themeToggle i').setAttribute('data-lucide',dark?'moon':'sun');
      lucide.createIcons();
    });

    initNav();
    renderHome();
    renderWorkflow();
    renderConversations();
    renderAuthorComms();
    renderPlanner();
    renderPieces();
    renderGarden();
    renderProduction();
    renderPublishing();
    lucide.createIcons();
  </script>
</body>
</html>

