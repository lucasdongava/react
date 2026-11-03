/* Trilha React — ilustrações interativas (uma por conceito difícil) */
const VIZ = {};
function vbox(el, tag, title, sub) {
  el.innerHTML = `<div class="viz-h"><span class="tag">${tag}</span><b>${title}</b></div>${sub ? `<p class="vsub">${sub}</p>` : ''}<div class="vbody"></div>`;
  return el.querySelector('.vbody');
}
function vbind(el, fn) { el.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && el.contains(b) && !b.disabled) fn(b.dataset.a, b.dataset.v, b); }); }
const vesc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const seg = (items, cur) => `<div class="vseg">${items.map(([v, l]) => `<button type="button" class="${v === cur ? 'on' : ''}" data-a="mode" data-v="${v}">${l}</button>`).join('')}</div>`;

/* ---------- 1. render x commit ---------- */
VIZ.render = el => {
  const body = vbox(el, 'Interativo', 'Quem renderiza quando o estado muda?', 'Cada caixa é um componente. Clique em setState e veja quais deles são chamados de novo. O DOM, no fim, só muda onde precisa.');
  const nodes = [['App', 0], ['Header', 1], ['Contador', 1], ['Titulo', 2], ['Botao', 2]];
  let n = 0, memo = false, last = [], r = { App: 1, Header: 1, Contador: 1, Titulo: 1, Botao: 1 };
  const draw = () => {
    body.innerHTML = `<div class="vrow"><button type="button" class="btn pri" data-a="set">setState → n = ${n + 1}</button><label class="vchk"><input type="checkbox" data-a="memo" ${memo ? 'checked' : ''}> Filhos com memo</label><button type="button" class="btn" data-a="reset">Zerar</button></div>
    <div class="vtree">${nodes.map(([k, d]) => `<div class="vnode d${d} ${last.includes(k) ? 'hit' : ''} ${k === 'Contador' ? 'has-state' : ''}"><span class="nm">&lt;${k} /&gt;</span>${k === 'Contador' ? `<span class="vdom ${last.length ? 'ch' : ''}">DOM: <b>${n}</b></span>` : ''}<span class="cnt">${r[k]} render${r[k] > 1 ? 's' : ''}</span></div>`).join('')}</div>
    <p class="vmsg">${last.length ? `<b>Renderizaram:</b> ${last.join(', ')} (${last.length} de 5). <b>Commit:</b> o React só trocou o número no DOM.` : 'Clique em setState. Só o componente dono do estado e seus filhos renderizam; App e Header ficam parados.'}</p>`;
  };
  vbind(el, (a) => {
    if (a === 'set') { n++; last = memo ? ['Contador'] : ['Contador', 'Titulo', 'Botao']; last.forEach(k => r[k]++); }
    else if (a === 'memo') { memo = !memo; last = []; }
    else if (a === 'reset') { n = 0; last = []; r = { App: 1, Header: 1, Contador: 1, Titulo: 1, Botao: 1 }; }
    draw();
  });
  draw();
};

/* ---------- 2. fila de atualizações (batching) ---------- */
VIZ.fila = el => {
  const body = vbox(el, 'Interativo', 'A fila de atualizações', 'Um clique chama o setter três vezes. O React junta tudo numa fila e processa uma vez. Compare as duas formas de escrever.');
  let mode = 'a', ran = false;
  const draw = () => {
    const steps = mode === 'a'
      ? [['setN(n + 1)', 'n vale 0 neste render → substitui por 1'], ['setN(n + 1)', 'n ainda vale 0 → substitui por 1'], ['setN(n + 1)', 'n ainda vale 0 → substitui por 1']]
      : [['setN(x => x + 1)', 'recebe 0 → devolve 1'], ['setN(x => x + 1)', 'recebe 1 → devolve 2'], ['setN(x => x + 1)', 'recebe 2 → devolve 3']];
    body.innerHTML = `${seg([['a', 'setN(n + 1) ×3'], ['b', 'setN(x => x + 1) ×3']], mode)}
    <div class="vrow"><button type="button" class="btn pri" data-a="run">Clicar (n = 0)</button></div>
    <ol class="vqueue">${ran ? steps.map((s, i) => `<li style="animation-delay:${i * 260}ms"><code>${vesc(s[0])}</code><span>${s[1]}</span></li>`).join('') : '<li class="ghost">A fila aparece aqui depois do clique.</li>'}</ol>
    ${ran ? `<p class="vmsg ${mode === 'a' ? 'bad' : 'good'}" style="animation-delay:900ms"><b>Resultado: n = ${mode === 'a' ? 1 : 3}.</b> ${mode === 'a' ? 'Os três setters leram o mesmo valor antigo, então o último “substitui por 1” vence.' : 'Cada função recebe o resultado da anterior: a forma atualizadora acumula.'}</p>` : ''}`;
  };
  vbind(el, (a, v) => { if (a === 'mode') { mode = v; ran = false; } else ran = true; draw(); });
  draw();
};

/* ---------- 3. key em listas ---------- */
VIZ.chave = el => {
  const body = vbox(el, 'Interativo', 'Para que serve a key', 'Marque “Ana” e depois adicione alguém no topo. Troque entre key={index} e key={id} e veja de quem é o check.');
  const base = [{ id: 1, n: 'Ana' }, { id: 2, n: 'Bia' }, { id: 3, n: 'Caio' }];
  let mode = 'index', items = base.slice(), st = { index: {}, id: {} }, extra = 0;
  const names = ['Duda', 'Edu', 'Fábio', 'Gabi'];
  const kf = (it, i) => mode === 'index' ? i : it.id;
  const draw = () => {
    body.innerHTML = `${seg([['index', 'key={index}'], ['id', 'key={item.id}']], mode)}
    <ul class="vlist">${items.map((it, i) => `<li><label><input type="checkbox" data-a="chk" data-v="${i}" ${st[mode][kf(it, i)] ? 'checked' : ''}> ${vesc(it.n)}</label><small>key = ${kf(it, i)}</small></li>`).join('')}</ul>
    <div class="vrow"><button type="button" class="btn pri" data-a="add" ${extra >= names.length ? 'disabled' : ''}>Adicionar no topo</button><button type="button" class="btn" data-a="reset">Reiniciar</button></div>
    <p class="vmsg ${mode === 'index' ? 'bad' : 'good'}">${mode === 'index' ? 'Com index, o estado fica preso à <b>posição</b>: o check continua na linha 0, que agora é outra pessoa.' : 'Com id, o estado acompanha a <b>pessoa</b>, não importa onde ela esteja na lista.'}</p>`;
  };
  vbind(el, (a, v) => {
    if (a === 'mode') mode = v;
    else if (a === 'chk') { const k = kf(items[+v], +v); st[mode][k] = !st[mode][k]; }
    else if (a === 'add') { items = [{ id: 10 + extra, n: names[extra] }].concat(items); extra++; }
    else { items = base.slice(); st = { index: {}, id: {} }; extra = 0; }
    draw();
  });
  draw();
};

/* ---------- 4. ciclo de vida do efeito ---------- */
VIZ.efeito = el => {
  const body = vbox(el, 'Interativo', 'O ciclo de um efeito', 'Monte o componente, troque o id e re-renderize. O log mostra a ordem real: render → limpeza do efeito antigo → efeito novo.');
  let deps = 'id', mounted = false, id = 1, log = [];
  const L = (k, t) => log.push([k, t]);
  const draw = () => {
    body.innerHTML = `${seg([['id', '[id]'], ['vazio', '[]'], ['none', 'sem array']], deps).replace(/data-a="mode"/g, 'data-a="deps"')}
    <pre class="vcode">useEffect(() =&gt; {\n  conecta(id);            // id = ${id}\n  return () =&gt; desconecta(id);\n}, ${deps === 'id' ? '[id]' : deps === 'vazio' ? '[]' : '/* sem array */'});</pre>
    <div class="vrow"><button type="button" class="btn pri" data-a="mount" ${mounted ? 'disabled' : ''}>Montar</button><button type="button" class="btn" data-a="id" ${mounted ? '' : 'disabled'}>Trocar id (${id} → ${id === 1 ? 2 : 1})</button><button type="button" class="btn" data-a="re" ${mounted ? '' : 'disabled'}>Re-renderizar</button><button type="button" class="btn" data-a="unmount" ${mounted ? '' : 'disabled'}>Desmontar</button></div>
    <ol class="vlog">${log.length ? log.map(([k, t], i) => `<li class="k-${k}" style="animation-delay:${Math.min(i, 3) * 40}ms"><i>${k === 'r' ? 'render' : k === 'c' ? 'limpeza' : k === 'e' ? 'efeito' : 'nota'}</i>${vesc(t)}</li>`).join('') : '<li class="ghost">O log aparece aqui.</li>'}</ol>`;
  };
  vbind(el, (a, v) => {
    if (a === 'deps') { deps = v; mounted = false; id = 1; log = []; }
    else if (a === 'mount') { mounted = true; L('r', `render com id = ${id}`); L('e', `conecta(${id})`); }
    else if (a === 'id') { const old = id; id = id === 1 ? 2 : 1; L('r', `render com id = ${id}`); if (deps === 'vazio') L('n', 'dependências [] não mudaram: o efeito não roda de novo'); else { L('c', `desconecta(${old})`); L('e', `conecta(${id})`); } }
    else if (a === 're') { L('r', `render (id continua ${id})`); if (deps === 'none') { L('c', `desconecta(${id})`); L('e', `conecta(${id})`); } else L('n', 'dependências iguais: o efeito é pulado'); }
    else if (a === 'unmount') { L('c', `desconecta(${id})`); mounted = false; L('n', 'componente saiu da tela'); }
    draw();
  });
  draw();
};

/* ---------- 5. state x ref ---------- */
VIZ.ref = el => {
  const body = vbox(el, 'Interativo', 'useState x useRef', 'Os dois guardam um valor entre renders. Só um deles faz a tela mudar. Clique nos botões e observe.');
  let state = 0, ref = 0, shown = 0, renders = 1;
  const draw = () => {
    body.innerHTML = `<div class="vrow"><button type="button" class="btn pri" data-a="s">setState (+1)</button><button type="button" class="btn" data-a="r">ref.current++ (+1)</button><button type="button" class="btn" data-a="reset">Zerar</button></div>
    <div class="vcols"><div class="vcard"><small>Na tela (último render)</small><div>estado: <b>${state}</b></div><div>ref mostrado: <b>${shown}</b></div></div>
    <div class="vcard live"><small>Na memória agora</small><div>estado: <b>${state}</b></div><div>ref.current: <b>${ref}</b></div></div>
    <div class="vcard"><small>Renders</small><div class="big">${renders}</div></div></div>
    <p class="vmsg">${shown !== ref ? '<b>A tela está desatualizada:</b> mudar a ref não pede render. Ela só aparece quando outro estado dispara um render.' : 'Tela e memória em sincronia. Clique em ref.current++ e veja que o contador de renders não anda.'}</p>`;
  };
  vbind(el, a => { if (a === 's') { state++; renders++; shown = ref; } else if (a === 'r') ref++; else { state = ref = shown = 0; renders = 1; } draw(); });
  draw();
};

/* ---------- 6. memo e identidade das props ---------- */
VIZ.memo = el => {
  const body = vbox(el, 'Interativo', 'O memo decide comparando props', 'Faça o pai renderizar e veja quando o filho consegue pular. Objetos novos a cada render quebram o memo.');
  let memo = true, nova = false, um = false, pai = 1, filho = 1, msg = '';
  const draw = () => {
    body.innerHTML = `<div class="vrow"><label class="vchk"><input type="checkbox" data-a="memo" ${memo ? 'checked' : ''}> Filho com memo</label><label class="vchk"><input type="checkbox" data-a="nova" ${nova ? 'checked' : ''}> Passar <code>{'{ a: 1 }'}</code> novo a cada render</label><label class="vchk ${nova ? '' : 'off'}"><input type="checkbox" data-a="um" ${um ? 'checked' : ''} ${nova ? '' : 'disabled'}> Envolver em useMemo</label></div>
    <div class="vrow"><button type="button" class="btn pri" data-a="go">Pai re-renderiza</button><button type="button" class="btn" data-a="reset">Zerar</button></div>
    <div class="vcols"><div class="vcard"><small>&lt;Pai /&gt;</small><div class="big">${pai}</div><small>renders</small></div><div class="vcard ${msg.startsWith('pulou') ? 'skip' : ''}"><small>&lt;Filho /&gt;</small><div class="big">${filho}</div><small>renders</small></div></div>
    <p class="vmsg">${msg ? (msg.startsWith('pulou') ? '<b>Pulou.</b> As props são idênticas (mesma referência), então o memo evita o render.' : `<b>Renderizou.</b> ${!memo ? 'Sem memo, todo render do pai arrasta o filho.' : 'O objeto novo tem outra referência, então o memo vê “props diferentes”.'}`) : 'Clique em “Pai re-renderiza”.'}</p>`;
  };
  vbind(el, (a) => {
    if (a === 'memo') { memo = !memo; msg = ''; } else if (a === 'nova') { nova = !nova; if (!nova) um = false; msg = ''; } else if (a === 'um') { um = !um; msg = ''; }
    else if (a === 'go') { pai++; const skip = memo && (!nova || um); if (!skip) filho++; msg = skip ? 'pulou' : 'rodou'; }
    else { pai = filho = 1; msg = ''; }
    draw();
  });
  draw();
};

/* ---------- 7. reducer ---------- */
VIZ.reducer = el => {
  const body = vbox(el, 'Interativo', 'O caminho de uma ação', 'O componente não altera o estado: ele descreve o que aconteceu (dispatch) e o reducer calcula o próximo estado.');
  let itens = [], next = 1, action = null, before = [], tick = 0;
  const run = act => { before = itens.slice(); action = act; tick++;
    if (act.type === 'adicionar') itens = itens.concat([{ id: next++, nome: act.nome }]);
    else if (act.type === 'remover') itens = itens.filter(i => i.id !== act.id);
    else itens = []; };
  const js = a => JSON.stringify(a), fmt = l => '[' + l.map(i => i.nome).join(', ') + ']';
  const draw = () => {
    body.innerHTML = `<div class="vrow"><button type="button" class="btn pri" data-a="add" data-v="Café">+ Café</button><button type="button" class="btn pri" data-a="add" data-v="Pão">+ Pão</button><button type="button" class="btn" data-a="rem" ${itens.length ? '' : 'disabled'}>Remover último</button><button type="button" class="btn" data-a="clear" ${itens.length ? '' : 'disabled'}>Limpar</button></div>
    <div class="vflow" key="${tick}">${['Clique', 'dispatch(action)', 'reducer(estado, action)', 'Novo estado', 'Tela'].map((t, i) => `<span class="${action ? 'step' : ''}" style="animation-delay:${i * 180}ms">${t}</span>`).join('<i>→</i>')}</div>
    <div class="vcols"><div class="vcard"><small>action</small><code>${action ? vesc(js(action)) : '—'}</code></div><div class="vcard"><small>estado antes</small><code>${vesc(fmt(before))}</code></div><div class="vcard live"><small>estado depois</small><code>${vesc(fmt(itens))}</code></div></div>
    <p class="vmsg">O reducer é uma função pura: mesmo estado + mesma action = mesmo resultado, e ele devolve um array <b>novo</b> em vez de alterar o antigo.</p>`;
  };
  vbind(el, (a, v) => { if (a === 'add') run({ type: 'adicionar', nome: v }); else if (a === 'rem') run({ type: 'remover', id: itens[itens.length - 1].id }); else run({ type: 'limpar' }); draw(); });
  draw();
};

/* ---------- 8. suspense: onde colocar a fronteira ---------- */
VIZ.suspense = el => {
  const body = vbox(el, 'Interativo', 'Onde fica a fronteira do Suspense', 'Perfil leva 1 s, posts levam 2,5 s. Veja o que o usuário enxerga com uma fronteira só e com uma por seção.');
  let mode = 'multi', p = false, q = false, running = false, timers = [];
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const sk = (t) => `<div class="vskel"><i></i><i></i><small>${t}</small></div>`;
  const draw = () => {
    const perfil = p ? '<div class="vdata"><b>Lucas Gava</b><small>perfil carregado</small></div>' : sk('carregando perfil…');
    const posts = q ? '<div class="vdata"><b>3 posts</b><small>posts carregados</small></div>' : sk('carregando posts…');
    const content = mode === 'single' ? ((p && q) ? `<div class="vcols">${perfil}${posts}</div>` : '<div class="vskel big"><i></i><i></i><i></i><small>Fallback único: nada aparece até tudo ficar pronto</small></div>') : `<div class="vcols">${perfil}${posts}</div>`;
    body.innerHTML = `${seg([['multi', 'Uma fronteira por seção'], ['single', 'Uma fronteira para tudo']], mode)}<div class="vrow"><button type="button" class="btn pri" data-a="go" ${running ? 'disabled' : ''}>${running ? 'Carregando…' : 'Carregar'}</button></div><div class="vbound ${mode}">${content}</div>
    <p class="vmsg">${mode === 'multi' ? 'Cada seção aparece assim que fica pronta, e o resto da tela continua útil.' : 'A seção rápida fica refém da lenta: a tela inteira espera 2,5 s.'}</p>`;
  };
  vbind(el, (a, v) => {
    if (a === 'mode') { clear(); mode = v; p = q = running = false; draw(); }
    else { clear(); p = q = false; running = true; draw(); timers.push(setTimeout(() => { p = true; draw(); }, 1000), setTimeout(() => { q = true; running = false; draw(); }, 2500)); }
  });
  draw();
};

/* ---------- 9. concorrência: transition ---------- */
VIZ.transicao = el => {
  const body = vbox(el, 'Interativo', 'Digitar enquanto a lista pesada renderiza', 'Três teclas digitadas rápido, cada uma dispara uma lista que leva tempo. Compare a linha do tempo sem e com useTransition.');
  let mode = 'sem', k = 0;
  const T = 13;
  const plan = {
    sem: { bars: [[0, 1, 'u'], [1, 4, 'h'], [5, 1, 'u'], [6, 4, 'h'], [10, 1, 'u'], [11, 2, 'h']], paints: [1, 6, 11], note: 'Cada lista pesada bloqueia a thread. A segunda e a terceira tecla esperam: o campo “trava” e as letras aparecem em lote.' },
    com: { bars: [[0, 1, 'u'], [1, 1, 'i'], [2, 1, 'u'], [3, 1, 'i'], [4, 1, 'u'], [5, 4, 'h']], paints: [1, 3, 5], note: 'O trabalho pesado é interrompido a cada tecla nova. O campo responde na hora e só a última lista é concluída.' }
  };
  const draw = () => {
    const P = plan[mode], pct = x => (x / T * 100).toFixed(2) + '%';
    body.innerHTML = `${seg([['sem', 'Sem useTransition'], ['com', 'Com useTransition']], mode)}<div class="vrow"><button type="button" class="btn pri" data-a="play">▶ Reproduzir</button></div>
    <div class="vtl" key="${k}"><div class="vlane">${P.bars.map(([s, l, t]) => `<span class="vbar b-${t}" style="left:${pct(s)};width:${pct(l)}"></span>`).join('')}<em class="vhead ${k ? 'go' : ''}"></em></div>
    <div class="vlegend"><span><i class="b-u"></i>atualiza o campo (urgente)</span><span><i class="b-h"></i>renderiza a lista</span><span><i class="b-i"></i>lista interrompida (descartada)</span></div></div>
    <div class="vkeys">${P.paints.map((t, i) => `<span class="${mode === 'sem' && i ? 'late' : ''}">tecla ${i + 1}: aparece no instante <b>${t}</b></span>`).join('')}</div>
    <p class="vmsg ${mode === 'sem' ? 'bad' : 'good'}">${P.note}</p>`;
  };
  vbind(el, (a, v) => { if (a === 'mode') { mode = v; k = 0; } else k++; draw(); });
  draw();
};

/* ---------- 10. UI otimista ---------- */
VIZ.otimista = el => {
  const body = vbox(el, 'Interativo', 'Interface que não espera o servidor', 'O servidor demora 1,2 s para responder. Envie mensagens com e sem useOptimistic e simule uma falha.');
  let opt = true, fail = false, msgs = [], n = 0, pending = 0, timers = [];
  const draw = () => {
    body.innerHTML = `<div class="vrow"><label class="vchk"><input type="checkbox" data-a="opt" ${opt ? 'checked' : ''}> useOptimistic</label><label class="vchk"><input type="checkbox" data-a="fail" ${fail ? 'checked' : ''}> Servidor falha</label></div>
    <div class="vrow"><button type="button" class="btn pri" data-a="send">${!opt && pending ? 'Enviando…' : 'Enviar mensagem'}</button><button type="button" class="btn" data-a="reset">Limpar</button></div>
    <ul class="vmsgs">${msgs.length ? msgs.map(m => `<li class="${m.s}"><span>${vesc(m.t)}</span><small>${m.s === 'sending' ? 'enviando…' : m.s === 'failed' ? 'falhou, desfeito' : 'enviada'}</small></li>`).join('') : '<li class="ghost">Nenhuma mensagem ainda.</li>'}</ul>
    <p class="vmsg">${opt ? 'A mensagem aparece <b>na hora</b> (apagada, “enviando”) e é confirmada ou desfeita quando o servidor responde.' : 'Sem otimismo, nada muda na tela até o servidor responder: a interface parece lenta.'}</p>`;
  };
  const send = () => {
    const id = ++n, t = 'Mensagem ' + id; pending++;
    if (opt) msgs.push({ id, t, s: 'sending' });
    timers.push(setTimeout(() => {
      pending--;
      if (opt) { const m = msgs.find(x => x.id === id); if (m) { if (fail) { m.s = 'failed'; draw(); timers.push(setTimeout(() => { msgs = msgs.filter(x => x.id !== id); draw(); }, 1200)); return; } m.s = 'ok'; } }
      else if (!fail) msgs.push({ id, t, s: 'ok' });
      draw();
    }, 1200));
  };
  vbind(el, a => {
    if (a === 'opt') opt = !opt; else if (a === 'fail') fail = !fail; else if (a === 'send') { if (opt || !pending) send(); } else { timers.forEach(clearTimeout); timers = []; msgs = []; pending = 0; }
    draw();
  });
  draw();
};

/* ---------- 11. Server x Client Components ---------- */
VIZ.rsc = el => {
  const body = vbox(el, 'Interativo', 'Onde cada componente roda', 'Clique num componente para marcá-lo com "use client". Tudo abaixo dele também vai para o navegador, e o JavaScript enviado cresce.');
  const N = [
    { k: 'Pagina', d: 0, kb: 2, p: null }, { k: 'Header', d: 1, kb: 2, p: 'Pagina' },
    { k: 'ListaProdutos', d: 1, kb: 85, p: 'Pagina', note: 'usa uma biblioteca de 85 KB e busca no banco' },
    { k: 'CardProduto', d: 2, kb: 3, p: 'ListaProdutos' },
    { k: 'BotaoCarrinho', d: 2, kb: 3, p: 'ListaProdutos', need: 'onClick e useState' },
    { k: 'Filtro', d: 1, kb: 4, p: 'Pagina', need: 'estado do input' }
  ];
  const mark = { BotaoCarrinho: true, Filtro: true };
  const isClient = k => { const n = N.find(x => x.k === k); return !!mark[k] || (n.p ? isClient(n.p) : false); };
  const draw = () => {
    const total = N.filter(n => isClient(n.k)).reduce((s, n) => s + n.kb, 0);
    const broken = N.filter(n => n.need && !isClient(n.k));
    body.innerHTML = `<div class="vtree">${N.map(n => { const c = isClient(n.k); return `<button type="button" class="vnode d${n.d} ${c ? 'client' : 'server'} ${mark[n.k] ? 'marked' : ''}" data-a="t" data-v="${n.k}"><span class="nm">&lt;${n.k} /&gt;</span><span class="vtag">${c ? (mark[n.k] ? '"use client"' : 'cliente (herdado)') : 'servidor'}</span><span class="cnt">${n.kb} KB</span></button>`; }).join('')}</div>
    <div class="vmeter"><span>JavaScript enviado ao navegador</span><div class="vbar2"><i style="width:${Math.min(100, total / 96 * 100)}%"></i></div><b>${total} KB</b></div>
    ${broken.length ? `<p class="vmsg bad"><b>Erro:</b> ${broken.map(n => `${n.k} usa ${n.need}`).join('; ')}. Isso só funciona em Client Component.</p>` : `<p class="vmsg ${total > 20 ? 'bad' : 'good'}">${total > 20 ? 'A ListaProdutos virou cliente: a biblioteca de 85 KB agora viaja para o navegador. Deixe o "use client" só nas folhas interativas.' : 'Só as folhas interativas são cliente. O resto roda no servidor e chega como HTML pronto, sem JavaScript.'}</p>`}`;
  };
  vbind(el, (a, v) => { mark[v] = !mark[v]; draw(); });
  draw();
};

/* ---------- 12. virtualização ---------- */
VIZ.virtual = el => {
  const body = vbox(el, 'Interativo', 'Quantos elementos existem no DOM?', 'Uma lista com 400 px de altura mostra ~10 linhas por vez. Veja quanto o DOM encolhe quando só o que está visível é renderizado.');
  let total = 1000;
  const draw = () => {
    const virt = 16, pct = Math.max(1.5, virt / total * 100);
    body.innerHTML = `${seg([[100, '100'], [1000, '1 mil'], [10000, '10 mil'], [100000, '100 mil']], total).replace(/data-a="mode"/g, 'data-a="n"')}
    <div class="vcompare"><div><small>Lista comum</small><div class="vbar2"><i style="width:100%"></i></div><b>${total.toLocaleString('pt-BR')} nós no DOM</b><small>≈ ${Math.round(total * 0.05)} ms só para montar</small></div>
    <div><small>Com virtualização</small><div class="vbar2 ok"><i style="width:${pct}%"></i></div><b>~${virt} nós no DOM</b><small>≈ ${Math.max(1, Math.round(virt * 0.05))} ms, sempre</small></div></div>
    <p class="vmsg">${total >= 10000 ? 'Com dezenas de milhares de itens, a lista comum trava rolagem e memória. A virtualizada custa o mesmo de sempre.' : 'Em listas pequenas a diferença é pequena: meça antes de adicionar uma biblioteca. Os tempos são uma estimativa didática.'}</p>`;
  };
  vbind(el, (a, v) => { total = +v; draw(); });
  draw();
};

/* ---------- 13. união discriminada ---------- */
VIZ.uniao = el => {
  const body = vbox(el, 'Interativo', 'Como o TypeScript estreita uma união', 'O campo status é a “etiqueta” que diz ao compilador qual formato o objeto tem. Escolha um estado e veja o que fica acessível.');
  let st = 'success', checked = true;
  const draw = () => {
    const can = { data: checked && st === 'success', error: checked && st === 'error' };
    const row = (f) => `<li class="${can[f] ? 'ok' : 'no'}"><code>state.${f}</code><span>${can[f] ? 'permitido' : `erro: “Property '${f}' does not exist”`}</span></li>`;
    body.innerHTML = `<pre class="vcode">type Estado =\n  | { status: 'loading' }\n  | { status: 'success'; data: Usuario }\n  | { status: 'error'; error: Error };</pre>
    ${seg([['loading', "status: 'loading'"], ['success', "status: 'success'"], ['error', "status: 'error'"]], st)}
    <div class="vrow"><label class="vchk"><input type="checkbox" data-a="chk" ${checked ? 'checked' : ''}> Checar antes: <code>if (state.status === '${st}')</code></label></div>
    <ul class="vprops"><li class="ok"><code>state.status</code><span>permitido (existe em todas)</span></li>${row('data')}${row('error')}</ul>
    <p class="vmsg">${checked ? `Dentro do <code>if</code>, o TypeScript sabe que o objeto é o formato <b>${st}</b> e libera só os campos dele.` : 'Sem checar a etiqueta, só os campos comuns a todas as variantes estão liberados.'}</p>`;
  };
  vbind(el, (a, v) => { if (a === 'mode') st = v; else checked = !checked; draw(); });
  draw();
};
