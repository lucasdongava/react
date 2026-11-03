/* Trilha React — navegação, progresso e realce de código */
const $ = s => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem('react:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('react:' + k, JSON.stringify(v)); } catch (e) {} }
};
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const done = new Set(store.get('done', []));
let view = 'inicio', justDone = null, swapT;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- tema ----------
(() => { const t = store.get('tema', null); if (t) document.documentElement.dataset.theme = t; })();
$('#themeBtn').onclick = () => {
  const cur = document.documentElement.dataset.theme || 'light', nx = cur === 'dark' ? 'light' : 'dark';
  const apply = () => { document.documentElement.dataset.theme = nx; }; store.set('tema', nx);
  if (document.startViewTransition && !reduced()) document.startViewTransition(apply); else apply();
};
// dentro da landing: acompanha o tema dela (sem gravar a preferência)
addEventListener('message', e => { const t = e.source === parent && e.data && e.data.estudosTema; if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; });

let toastT; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1800); }

// ---------- realce de código (JS/TS/JSX) ----------
const KW = 'import|export|default|from|const|let|var|function|return|if|else|for|while|switch|case|break|continue|new|class|extends|async|await|try|catch|finally|throw|typeof|instanceof|in|of|type|interface|enum|as|satisfies|implements|readonly|keyof|void|null|undefined|true|false|this|yield|delete';
const TOK = new RegExp('(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)|("(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|`(?:[^`\\\\]|\\\\[\\s\\S])*`)|\\b(' + KW + ')\\b|\\b(\\d+(?:\\.\\d+)?)\\b|(&lt;\\/?[A-Z][A-Za-z0-9.]*|\\buse[A-Z][A-Za-z0-9]*)', 'g');
function highlight(el) {
  const lang = el.dataset.lang;
  if (!/^(jsx?|tsx?|javascript|typescript)$/.test(lang)) return;
  const code = el.firstElementChild; if (code.dataset.hl) return; code.dataset.hl = '1';
  code.innerHTML = code.innerHTML.replace(TOK, (m, c, s, k, n, f) => c ? `<i class="c">${c}</i>` : s ? `<i class="s">${s}</i>` : k ? `<i class="k">${k}</i>` : n ? `<i class="n">${n}</i>` : `<i class="f">${f}</i>`);
}

// ---------- sidebar ----------
function renderSide() {
  let h = `<div class="side-head"><div><b>Aulas</b><small>${done.size} de ${LESSONS.length} concluídas</small></div><button class="icon-btn" data-close aria-label="Fechar menu">✕</button></div><div class="nav-home"><button data-go="inicio" class="${view === 'inicio' ? 'on' : ''}">Início</button><button data-go="resumo" class="${view === 'resumo' ? 'on' : ''}">Resumo</button></div>`;
  for (const u of [1, 2, 3, 4]) {
    h += `<div class="unit"><div class="unit-h"><b style="background:${UNITS[u].color}">${u}</b>${UNITS[u].name}</div>`;
    for (const L of LESSONS.filter(l => l.unit === u))
      h += `<button style="--i:${LESSONS.indexOf(L) + 2}" class="lesson-btn ${view === L.id ? 'on' : ''} ${done.has(L.id) ? 'done' : ''}" data-go="${L.id}"><span class="dot">${done.has(L.id) ? '✓' : ''}</span>${esc(L.title.split(':')[0])}</button>`;
    h += `</div>`;
  }
  $('#side').innerHTML = h;
  $('#progTxt').textContent = `${done.size} de ${LESSONS.length} aulas`;
  $('#progBar').style.width = (done.size / LESSONS.length * 100) + '%';
}
const closeDrawer = () => { $('#side').classList.remove('open'); $('#scrim').classList.remove('on'); $('#menuBtn').setAttribute('aria-expanded', 'false'); };
$('#side').addEventListener('click', e => { if (e.target.closest('[data-close]')) return closeDrawer(); const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
$('#logoHome').addEventListener('click', e => { e.preventDefault(); go('inicio'); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
$('#menuBtn').onclick = () => { const o = $('#side').classList.toggle('open'); $('#scrim').classList.toggle('on', o); $('#menuBtn').setAttribute('aria-expanded', String(o)); if (o) { const on = $('#side .lesson-btn.on'); if (on) on.scrollIntoView({ block: 'center' }); } };
$('#scrim').onclick = closeDrawer;
(() => {
  const btn = $('#collapseBtn');
  const apply = off => { document.body.classList.toggle('side-off', off); btn.setAttribute('aria-expanded', String(!off)); btn.setAttribute('aria-label', off ? 'Mostrar menu lateral' : 'Recolher menu lateral'); };
  apply(!!store.get('sideOff', false));
  btn.onclick = () => { const off = !document.body.classList.contains('side-off'); apply(off); store.set('sideOff', off); };
})();

// ---------- páginas ----------
function renderLesson(L) {
  const U = UNITS[L.unit], i = LESSONS.indexOf(L), prev = LESSONS[i - 1], next = LESSONS[i + 1], isDone = done.has(L.id);
  const nx = next ? { id: next.id, t: next.title } : { id: 'resumo', t: 'Resumo da trilha' };
  return `<div class="crumb" style="color:${U.color}">Módulo ${L.unit} · ${U.name} · Aula ${L.n}</div><h1>${esc(L.title)}</h1><p class="lead">${L.lead}</p>${L.body}
  <div class="lesson-foot">
    <div class="up-next"><span>A seguir</span><b>${esc(nx.t)}</b></div>
    <div class="foot-bar">
      ${prev ? `<button class="btn fb fb-prev" data-go="${prev.id}" title="${esc(prev.title)}" aria-label="Aula anterior: ${esc(prev.title)}"><span aria-hidden="true">←</span><span class="t">Anterior</span></button>` : ''}
      <button class="btn fb fb-done ${isDone ? 'is' : ''}" data-done="${L.id}" aria-pressed="${isDone}"><span class="ck" aria-hidden="true">${isDone ? '✓' : ''}</span>${isDone ? 'Concluída' : 'Concluir'}</button>
      <button class="btn pri fb fb-next" data-go="${nx.id}" aria-label="Próxima: ${esc(nx.t)}">Próxima <span aria-hidden="true">→</span></button>
    </div>
  </div>`;
}
function renderHome() {
  const last = LESSONS.find(l => l.id === store.get('last', '')) || LESSONS.find(l => !done.has(l.id)) || LESSONS[0];
  let h = `<h1>Trilha React: intermediário e avançado</h1>
  <p class="lead">${LESSONS.length} aulas atualizadas para o React 19, com analogias, exemplos progressivos, erros comuns, resumo e exercícios com gabarito.</p>
  <div class="hero"><b>Continue de onde parou</b><span style="color:var(--fg2)">${esc(last.title)}</span><button class="btn pri" data-go="${last.id}">Abrir aula</button></div>
  <button class="unit-card rs-cta" data-go="resumo" style="width:100%;margin-bottom:8px"><span class="n" style="color:var(--acc)">Revisão rápida</span><b>Resumo de todas as aulas</b><span>Os pontos principais de cada aula numa página só.</span></button>
  <h2>Módulos</h2><div class="unit-cards">`;
  for (const u of [1, 2, 3, 4]) {
    const ls = LESSONS.filter(l => l.unit === u), d = ls.filter(l => done.has(l.id)).length;
    h += `<button class="unit-card" data-go="${ls[0].id}"><span class="n" style="color:${UNITS[u].color}">MÓDULO ${u}</span><b>${UNITS[u].name}</b><span>${ls.map(l => esc(l.title.split(':')[0])).join(' · ')}</span><div class="mini"><i style="width:${d / ls.length * 100}%;background:${UNITS[u].color}"></i></div></button>`;
  }
  h += `</div><h2>Como estudar</h2><ol><li>Siga a ordem: cada aula se apoia nas anteriores.</li><li>Digite os exemplos em vez de copiar. Mude valores, quebre o código de propósito e observe.</li><li>Tente os exercícios do fim da aula antes de abrir o gabarito.</li><li>Marque a aula como concluída para acompanhar seu progresso (fica salvo só no seu navegador).</li></ol>
  <h2>Projetos para consolidar</h2>
  <div class="week"><b>Módulo 1</b><span>Quadro Kanban com colunas e cards, salvando no localStorage: estado normalizado, key e efeitos de sincronização.</span></div>
  <div class="week"><b>Módulo 2</b><span>Carrinho de compras com useReducer + Context, um hook useCarrinho e um componente &lt;Abas&gt; composto.</span></div>
  <div class="week"><b>Módulo 3</b><span>App de notas com busca usando useDeferredValue, formulários com Actions, atualizações otimistas e rotas com lazy.</span></div>
  <div class="week"><b>Módulo 4</b><span>Converta um dos projetos para TypeScript, escreva testes dos fluxos principais e meça a performance antes e depois.</span></div>
  <h2>Referências oficiais</h2><p><a href="https://react.dev" target="_blank" rel="noopener">react.dev</a> · <a href="https://react.dev/reference/react" target="_blank" rel="noopener">Referência de APIs</a> · <a href="https://testing-library.com" target="_blank" rel="noopener">Testing Library</a> · <a href="https://www.typescriptlang.org/docs" target="_blank" rel="noopener">TypeScript</a></p>`;
  return h;
}
function renderResumo() {
  let h = `<h1>Resumo da trilha</h1><p class="lead">Os pontos principais de cada aula, para revisar antes de entrevista ou prova.</p>`;
  for (const u of [1, 2, 3, 4]) {
    h += `<h2 style="color:${UNITS[u].color}">Módulo ${u} · ${UNITS[u].name}</h2>`;
    for (const L of LESSONS.filter(l => l.unit === u)) h += `<details class="rs-card ans"><summary>${L.n}. ${esc(L.title)}</summary><div class="rs-body">${L.resumo}<button class="btn" data-go="${L.id}">Abrir a aula</button></div></details>`;
  }
  return h;
}
function reveal(root) {
  if (!('IntersectionObserver' in window) || reduced()) return;
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
  root.querySelectorAll('.crumb,h1,.lead,.note,.snip,.tbl-wrap,.unit-card,.hero,.week,.lesson-foot').forEach(n => {
    n.classList.add('rv'); const sib = [...n.parentElement.children].filter(c => c.classList.contains('rv')); n.style.transitionDelay = Math.min(sib.indexOf(n), 5) * 55 + 'ms'; io.observe(n);
  });
}
function go(id, keepScroll) {
  const li = $('#lessonIn');
  if (!keepScroll && li.childElementCount && !reduced() && view !== id) { li.classList.add('leave'); clearTimeout(swapT); swapT = setTimeout(() => render(id, keepScroll), 170); view = id; renderSide(); closeDrawer(); return; }
  render(id, keepScroll);
}
function render(id, keepScroll) {
  view = id; closeDrawer();
  const L = LESSONS.find(l => l.id === id), li = $('#lessonIn');
  li.innerHTML = L ? renderLesson(L) : id === 'resumo' ? renderResumo() : renderHome();
  li.classList.remove('leave');
  if (!keepScroll) reveal(li);
  li.querySelectorAll('pre[data-lang]').forEach(highlight);
  if (L) store.set('last', id);
  try { history.replaceState(null, '', '#' + id); } catch (e) {}
  if (!keepScroll) $('#lesson').scrollTop = 0;
  renderSide();
}
$('#lessonIn').addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (a) { const id = a.getAttribute('href').slice(1); if (LESSONS.some(l => l.id === id)) { e.preventDefault(); go(id); } else { const el = document.getElementById(id); if (el) { e.preventDefault(); el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }); } } return; }
  const t = e.target.closest('button'); if (!t) return;
  if (t.dataset.go) go(t.dataset.go);
  else if (t.hasAttribute('data-copy')) { const txt = t.closest('.snip').querySelector('pre').textContent; (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { t.textContent = 'Copiado'; setTimeout(() => t.textContent = 'Copiar', 1400); }, () => toast('Não foi possível copiar')); }
  else if (t.dataset.done) { const id = t.dataset.done; done.has(id) ? done.delete(id) : (done.add(id), justDone = id); store.set('done', [...done]); go(id, true); if (done.has(id)) toast('Aula concluída ✓'); }
});

// ---------- início ----------
(() => {
  const h = (location.hash || '').slice(1);
  go(LESSONS.some(l => l.id === h) || h === 'resumo' ? h : 'inicio');
})();
