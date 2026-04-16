// ═══════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════
function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function formatBRL(v) {
  return (v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}
function gerarId() {
  return '_'+Math.random().toString(36).substr(2,9);
}

// ═══════════════════════════════════════════
// TOAST SYSTEM
// ═══════════════════════════════════════════
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const icons = { success: '✓', error: '✕', warning: '!', info: 'i' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.success}</span>
    <span class="toast-msg">${msg}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentElement) toast.remove(); }, 3600);
}

// ═══════════════════════════════════════════
// MODAL DE CONFIRMAÇÃO
// ═══════════════════════════════════════════
let confirmCallback = null;

function mostrarConfirmacao(titulo, msg, btnTexto, callback, icon = '') {
  document.getElementById('modal-confirmar-icon').textContent = icon;
  document.getElementById('modal-confirmar-titulo').textContent = titulo;
  document.getElementById('modal-confirmar-msg').textContent = msg;
  document.getElementById('modal-confirmar-btn').textContent = btnTexto;
  confirmCallback = callback;
  abrirModal('modal-confirmar');
}

function executarConfirmacao() {
  fecharModal('modal-confirmar');
  if (confirmCallback) { confirmCallback(); confirmCallback = null; }
}

// ═══════════════════════════════════════════
// VARIÁVEIS GLOBAIS
// ═══════════════════════════════════════════
let crAtual = null;
let grupoAtual = null;
let telaAnterior = null;
let rowParaRemover = null;
let crIdModalCat = null;
let ctxTarget = null;
let editarNomeCallback = null;
let pedidoIdxAtual = null;

// ═══════════════════════════════════════════
// NAVEGAÇÃO
// ═══════════════════════════════════════════
function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('btn-voltar').style.display = id === 'tela-crs' ? 'none' : 'inline-block';
}

function irParaCRs() {
  crAtual = null;
  grupoAtual = null;
  telaAnterior = null;
  mostrarTela('tela-crs');
  renderCRs();
}

function irParaGrupos() {
  telaAnterior = 'tela-grupos';
  mostrarTela('tela-grupos');
  renderGrupos();
}

function irParaGrupoDetalhe() {
  telaAnterior = 'tela-grupo-detalhe';
  mostrarTela('tela-grupo-detalhe');
  renderGrupoDetalhe();
}

function voltarTela() {
  if (telaAnterior === 'tela-grupo-detalhe') {
    irParaGrupos();
  } else if (telaAnterior === 'tela-grupos') {
    irParaCRs();
  } else if (telaAnterior === 'tela-balancete') {
    irParaGrupos();
  } else {
    irParaCRs();
  }
}

function voltarDeConfig() {
  mostrarTela('tela-crs');
  renderCRs();
}

// ═══════════════════════════════════════════
// MODAIS
// ═══════════════════════════════════════════
function abrirModal(id) { document.getElementById(id).classList.add('open'); }
function fecharModal(id) { document.getElementById(id).classList.remove('open'); }

// ═══════════════════════════════════════════
// EDITAR NOME GENÉRICO
// ═══════════════════════════════════════════
function abrirEditarNome(titulo, valorAtual, callback) {
  document.getElementById('modal-editar-nome-titulo').textContent = titulo;
  document.getElementById('input-editar-nome').value = valorAtual;
  editarNomeCallback = callback;
  abrirModal('modal-editar-nome');
  setTimeout(() => document.getElementById('input-editar-nome').focus(), 100);
}

function salvarEdicaoNome() {
  const novoNome = document.getElementById('input-editar-nome').value.trim();
  if (!novoNome) { showToast('Informe um nome.', 'warning'); return; }
  fecharModal('modal-editar-nome');
  if (editarNomeCallback) { editarNomeCallback(novoNome); editarNomeCallback = null; }
}

// ═══════════════════════════════════════════
// MENU 3 PONTINHOS (⋮)
// ═══════════════════════════════════════════
function abrirCtxMenu(e, tipo, id) {
  e.stopPropagation();
  e.preventDefault();
  const menu = document.getElementById('ctx-menu');
  ctxTarget = { tipo, id };

  let menuHtml = '';

  if (tipo === 'cr') {
    const cr = DB.getCRs().find(c => c.id === id);
    menuHtml = `
      <div class="ctx-menu-item" onclick="event.stopPropagation(); fecharCtxMenu(); abrirEditarNome('Editar Nome do CR', '${esc(cr?.nome||'')}', function(n){ editarNomeCR('${id}',n); })">
        ✏️ Editar Nome
      </div>
      <div class="ctx-menu-item" onclick="event.stopPropagation(); fecharCtxMenu(); abrirEditarOrcamento('${id}')">
        💲 Editar Orçamento
      </div>
      <div class="ctx-menu-item ctx-danger" onclick="event.stopPropagation(); fecharCtxMenu(); deletarCR('${id}')">
        🗑️ Excluir CR
      </div>`;
  } else if (tipo === 'grupo') {
    const g = DB.getGrupos(crAtual.id).find(g => g.id === id);
    menuHtml = `
      <div class="ctx-menu-item" onclick="event.stopPropagation(); fecharCtxMenu(); abrirEditarNome('Editar Nome do Grupo', '${esc(g?.nome||'')}', function(n){ editarNomeGrupo('${id}',n); })">
        ✏️ Editar Nome
      </div>
      <div class="ctx-menu-item ctx-danger" onclick="event.stopPropagation(); fecharCtxMenu(); deletarGrupo('${id}')">
        🗑️ Excluir Grupo
      </div>`;
  } else if (tipo === 'evento') {
    const ev = DB.getEventos(grupoAtual.id).find(e => e.id === id);
    menuHtml = `
      <div class="ctx-menu-item" onclick="event.stopPropagation(); fecharCtxMenu(); abrirEditarNome('Editar Nome do Evento', '${esc(ev?.nome||'')}', function(n){ editarNomeEvento('${id}',n); })">
        ✏️ Editar Nome
      </div>
      <div class="ctx-menu-item ctx-danger" onclick="event.stopPropagation(); fecharCtxMenu(); deletarEvento('${id}')">
        🗑️ Excluir Evento
      </div>`;
  }

  menu.innerHTML = menuHtml;
  menu.style.display = 'block';
  const x = Math.min(e.pageX, window.innerWidth - 200);
  const y = Math.min(e.pageY, window.innerHeight - 120);
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
}

function fecharCtxMenu() {
  document.getElementById('ctx-menu').style.display = 'none';
  ctxTarget = null;
}

document.addEventListener('click', fecharCtxMenu);

// Editar nomes
function editarNomeCR(crId, novoNome) {
  const crs = DB.getCRs();
  const cr = crs.find(c => c.id === crId);
  if (cr) { cr.nome = novoNome; DB.saveCRs(crs); if (crAtual && crAtual.id === crId) crAtual.nome = novoNome; }
  showToast('Nome do CR atualizado!');
  renderCRs();
}

function editarNomeGrupo(grupoId, novoNome) {
  const grupos = DB.getGrupos(crAtual.id);
  const g = grupos.find(g => g.id === grupoId);
  if (g) { g.nome = novoNome; DB.saveGrupos(crAtual.id, grupos); if (grupoAtual && grupoAtual.id === grupoId) grupoAtual.nome = novoNome; }
  showToast('Nome do grupo atualizado!');
  renderGrupos();
}

function editarNomeEvento(eventoId, novoNome) {
  const eventos = DB.getEventos(grupoAtual.id);
  const ev = eventos.find(e => e.id === eventoId);
  if (ev) { ev.nome = novoNome; DB.saveEventos(grupoAtual.id, eventos); }
  showToast('Nome do evento atualizado!');
  renderGrupoDetalhe();
}

// ═══════════════════════════════════════════
// CONFIGURAÇÕES
// ═══════════════════════════════════════════
function abrirConfiguracoes() {
  mostrarTela('tela-config');
  renderCategoriasPadrao();
  renderCategoriasCRs();
}

// ═══════════════════════════════════════════
// CRs
// ═══════════════════════════════════════════
function calcTotalGastoCR(crId) {
  let total = 0;
  DB.getGrupos(crId).forEach(g => {
    const eventos = DB.getEventos(g.id);
    DB.getItensGrupo(g.id).forEach(item => {
      eventos.forEach(ev => {
        const d = item.eventos && item.eventos[ev.id];
        if (d) total += parseFloat(d.valor) || 0;
      });
    });
  });
  return total;
}

function renderCRs() {
  const lista = document.getElementById('lista-crs');
  lista.innerHTML = '';
  const crs = DB.getCRs();
  if (!crs.length) {
    lista.innerHTML = '<p class="empty-msg">Nenhum CR criado ainda.</p>';
    return;
  }
  crs.forEach(cr => {
    const orc = DB.getOrcamento(cr.id);
    const grupos = DB.getGrupos(cr.id);
    const totalGasto = calcTotalGastoCR(cr.id);
    const saldo = orc - totalGasto;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-top-row">
        <div class="card-nome">${esc(cr.nome)}</div>
        <button class="btn-ctx" onclick="abrirCtxMenu(event,'cr','${cr.id}')">⋮</button>
      </div>
      <div class="card-info">${grupos.length} grupo(s)</div>
      <div class="card-valor">${formatBRL(orc)}</div>
      <div class="card-info" style="margin-top:4px;">
        Gasto: <strong style="color:#EF4444">${formatBRL(totalGasto)}</strong> |
        Saldo: <strong style="color:${saldo>=0?'#0F766E':'#EF4444'}">${formatBRL(saldo)}</strong>
      </div>`;
    card.addEventListener('click', () => { crAtual = cr; irParaGrupos(); });
    lista.appendChild(card);
  });
}

function salvarCR() {
  const nome = document.getElementById('input-cr').value.trim();
  const orc = parseFloat(document.getElementById('input-cr-orcamento').value) || 0;
  if (!nome) { showToast('Informe o nome do CR.', 'warning'); return; }
  const crs = DB.getCRs();
  const novo = { id: gerarId(), nome };
  crs.push(novo);
  DB.saveCRs(crs);
  DB.saveOrcamento(novo.id, orc);
  document.getElementById('input-cr').value = '';
  document.getElementById('input-cr-orcamento').value = '';
  fecharModal('modal-cr');
  showToast('CR criado com sucesso!');
  renderCRs();
}

function deletarCR(crId) {
  mostrarConfirmacao('Excluir CR', 'Deseja realmente excluir este CR e todos os seus dados? Esta ação não pode ser desfeita.', 'Excluir', () => {
    DB.saveCRs(DB.getCRs().filter(c => c.id !== crId));
    showToast('CR excluído.', 'info');
    renderCRs();
  }, '🗑️');
}

function abrirEditarOrcamento(crId) {
  crAtual = DB.getCRs().find(c => c.id === crId) || crAtual;
  document.getElementById('input-orcamento').value = DB.getOrcamento(crId);
  abrirModal('modal-orcamento');
  setTimeout(() => document.getElementById('input-orcamento').focus(), 100);
}

function salvarOrcamento() {
  const valor = parseFloat(document.getElementById('input-orcamento').value) || 0;
  DB.saveOrcamento(crAtual.id, valor);
  fecharModal('modal-orcamento');
  showToast('Orçamento atualizado!');
  renderCRs();
}

// ═══════════════════════════════════════════
// GRUPOS
// ═══════════════════════════════════════════
function renderGrupos() {
  document.getElementById('titulo-grupos').textContent = crAtual ? crAtual.nome : 'Grupos';
  const lista = document.getElementById('lista-grupos');
  lista.innerHTML = '';
  const grupos = DB.getGrupos(crAtual.id);
  if (!grupos.length) {
    lista.innerHTML = '<p class="empty-msg">Nenhum grupo criado ainda.</p>';
    return;
  }
  grupos.forEach(g => {
    const eventos = DB.getEventos(g.id);
    const itens = DB.getItensGrupo(g.id);
    let total = 0;
    itens.forEach(item => {
      eventos.forEach(ev => {
        const d = item.eventos && item.eventos[ev.id];
        if (d) total += parseFloat(d.valor) || 0;
      });
    });

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-top-row">
        <div class="card-nome">${esc(g.nome)}</div>
        <button class="btn-ctx" onclick="abrirCtxMenu(event,'grupo','${g.id}')">⋮</button>
      </div>
      <div class="card-info">${eventos.length} evento(s) · ${itens.length} item(ns)</div>
      <div class="card-valor">${formatBRL(total)}</div>`;
    card.addEventListener('click', () => { grupoAtual = g; irParaGrupoDetalhe(); });
    lista.appendChild(card);
  });
}

function salvarGrupo() {
  const nome = document.getElementById('input-grupo').value.trim();
  if (!nome) { showToast('Informe o nome do grupo.', 'warning'); return; }
  const grupos = DB.getGrupos(crAtual.id);
  grupos.push({ id: gerarId(), nome });
  DB.saveGrupos(crAtual.id, grupos);
  document.getElementById('input-grupo').value = '';
  fecharModal('modal-grupo');
  showToast('Grupo criado com sucesso!');
  renderGrupos();
}

function deletarGrupo(grupoId) {
  mostrarConfirmacao('Excluir Grupo', 'Deseja realmente excluir este grupo e todos os seus dados?', 'Excluir', () => {
    DB.saveGrupos(crAtual.id, DB.getGrupos(crAtual.id).filter(g => g.id !== grupoId));
    showToast('Grupo excluído.', 'info');
    renderGrupos();
  }, '🗑️');
}

// ═══════════════════════════════════════════
// EVENTOS
// ═══════════════════════════════════════════
function salvarEvento() {
  const nome = document.getElementById('input-evento').value.trim();
  if (!nome) { showToast('Informe o nome do evento.', 'warning'); return; }
  const eventos = DB.getEventos(grupoAtual.id);
  eventos.push({ id: gerarId(), nome });
  DB.saveEventos(grupoAtual.id, eventos);
  document.getElementById('input-evento').value = '';
  fecharModal('modal-evento');
  showToast('Evento criado com sucesso!');
  renderGrupoDetalhe();
}

function deletarEvento(eventoId) {
  mostrarConfirmacao('Excluir Evento', 'Deseja realmente excluir este evento e seus dados?', 'Excluir', () => {
    DB.saveEventos(grupoAtual.id, DB.getEventos(grupoAtual.id).filter(e => e.id !== eventoId));
    const itens = DB.getItensGrupo(grupoAtual.id);
    itens.forEach(item => { if (item.eventos) delete item.eventos[eventoId]; });
    DB.saveItensGrupo(grupoAtual.id, itens);
    showToast('Evento excluído.', 'info');
    renderGrupoDetalhe();
  }, '🗑️');
}

// ═══════════════════════════════════════════
// MODAL NR PEDIDO
// ═══════════════════════════════════════════
function abrirModalPedido(idx) {
  pedidoIdxAtual = idx;
  const row = document.querySelector(`tr[data-row="${idx}"]`);
  const num  = row?.querySelector('[data-f="nrPedido"]')?.value || '';
  const link = row?.querySelector('[data-f="nrPedidoLink"]')?.value || '';

  document.getElementById('modal-pedido-num').value  = num;
  document.getElementById('modal-pedido-link').value = link;
  abrirModal('modal-pedido');
  setTimeout(() => document.getElementById('modal-pedido-num').focus(), 100);
}

function salvarModalPedido() {
  const num  = document.getElementById('modal-pedido-num').value.trim();
  const link = document.getElementById('modal-pedido-link').value.trim();

  const row = document.querySelector(`tr[data-row="${pedidoIdxAtual}"]`);
  if (row) {
    row.querySelector('[data-f="nrPedido"]').value     = num;
    row.querySelector('[data-f="nrPedidoLink"]').value = link;
  }

  const itens = coletarItensDoDOM();
  DB.saveItensGrupo(grupoAtual.id, itens);
  fecharModal('modal-pedido');
  renderGrupoDetalhe();
  showToast('Nº do Pedido salvo!');
}

// ═══════════════════════════════════════════
// GRUPO DETALHE — TABELA
// ═══════════════════════════════════════════
function buildCategoriasOptions(selected) {
  const cats = crAtual ? DB.getCategoriasDisponiveis(crAtual.id) : DB.getCategoriasPadrao().filter(c=>c.ativo);
  return '<option value="">-- Categoria --</option>' +
    cats.map(c => `<option value="${c.id}" ${c.id===selected?'selected':''}>${esc(c.nome)}</option>`).join('');
}

function renderGrupoDetalhe() {
  document.getElementById('titulo-grupo-detalhe').textContent = grupoAtual ? grupoAtual.nome : 'Grupo';
  const eventos = DB.getEventos(grupoAtual.id);
  const itens = DB.getItensGrupo(grupoAtual.id);
  const wrapper = document.getElementById('tabela-grupo-wrapper');

  const colspanOrc = 7;

  let headerTop = `<th colspan="${colspanOrc}" class="th-orc-header">Orçamento</th>`;
  eventos.forEach(ev => {
    headerTop += `<th colspan="4" class="th-evento-header">
      ${esc(ev.nome)}
      <button class="btn-ctx btn-ctx-sm" onclick="abrirCtxMenu(event,'evento','${ev.id}')">⋮</button>
    </th>`;
  });
  headerTop += '<th class="th-acao-header"></th>';

  let headerSub = `
    <th>Categoria</th>
    <th>Descrição</th>
    <th>Fornecedor</th>
    <th>Vlr Unitário</th>
    <th>Quantidade</th>
    <th>Vlr Total</th>
    <th>Nr do Pedido</th>`;
  eventos.forEach(() => {
    headerSub += '<th class="th-sub">Valor</th><th class="th-sub">Nr da NF</th><th class="th-sub">AS</th><th class="th-sub">Pago?</th>';
  });
  headerSub += '<th></th>';

  let bodyHtml = '';
  itens.forEach((item, idx) => {
    const pedNum  = esc(item.nrPedido||'');
    const pedLink = esc(item.nrPedidoLink||'');

    // Célula Nr Pedido — só mostra número (clicável se tiver link), + botão ✏️
    const pedidoDisplay = pedNum
      ? (pedLink
          ? `<a href="${pedLink}" target="_blank" class="nr-pedido-link" title="Abrir link do pedido">${pedNum} 🔗</a>`
          : `<span class="nr-pedido-texto">${pedNum}</span>`)
      : `<span class="nr-pedido-vazio">—</span>`;

    let cells = `
      <td><select data-f="categoria" data-i="${idx}">${buildCategoriasOptions(item.categoria||'')}</select></td>
      <td><input type="text" data-f="descricao" data-i="${idx}" value="${esc(item.descricao||'')}" placeholder="Descrição"></td>
      <td><input type="text" data-f="fornecedor" data-i="${idx}" value="${esc(item.fornecedor||'')}" placeholder="Fornecedor"></td>
      <td><input type="number" data-f="vlrUnitario" data-i="${idx}" value="${item.vlrUnitario||''}" placeholder="0,00" oninput="calcLinhaGrupo(${idx})"></td>
      <td><input type="number" data-f="qtd" data-i="${idx}" value="${item.qtd||''}" placeholder="0" oninput="calcLinhaGrupo(${idx})"></td>
      <td><input type="number" data-f="vlrTotal" data-i="${idx}" value="${item.vlrTotal||''}" placeholder="0,00" oninput="updateResumo()"></td>
      <td>
        <div class="nr-pedido-cell">
          ${pedidoDisplay}
          <button class="btn-nr-pedido-edit" onclick="abrirModalPedido(${idx})" title="Editar Nº Pedido">✏️</button>
        </div>
        <input type="hidden" data-f="nrPedido"     data-i="${idx}" value="${pedNum}">
        <input type="hidden" data-f="nrPedidoLink" data-i="${idx}" value="${pedLink}">
      </td>`;

    eventos.forEach(ev => {
      const d = (item.eventos && item.eventos[ev.id]) || {};
      const nfNum  = esc(d.nrNF||'');
      const nfLink = esc(d.nrNFLink||'');

      cells += `
        <td class="td-ev">
          <input type="number" data-ev="${ev.id}" data-i="${idx}" data-ef="valor"
            value="${d.valor||''}" placeholder="0,00" oninput="updateResumo()">
        </td>
        <td class="td-ev">
          <div class="popover-trigger" onclick="togglePopover(event, 'pop-nf-${idx}-${ev.id}')">
            <input type="text" data-ev="${ev.id}" data-i="${idx}" data-ef="nrNF"
              value="${nfNum}" placeholder="NF" readonly style="cursor:pointer">
            <span class="popover-link-icon">${nfLink ? '🔗' : '+'}</span>
          </div>
          <div class="popover-panel" id="pop-nf-${idx}-${ev.id}">
            <label>Número da NF</label>
            <input type="text" id="pop-nf-num-${idx}-${ev.id}" value="${nfNum}" placeholder="Ex: NF-001">
            <label>Link</label>
            <input type="text" id="pop-nf-link-${idx}-${ev.id}" value="${nfLink}" placeholder="https://...">
            <div class="popover-actions">
              ${nfLink ? `<button class="btn-secondary" onclick="window.open(document.getElementById('pop-nf-link-${idx}-${ev.id}').value,'_blank')">Abrir</button>` : ''}
              <button onclick="salvarPopoverNF(${idx},'${ev.id}')">OK</button>
            </div>
          </div>
        </td>
        <td class="td-ev check-cell">
          <input type="checkbox" data-ev="${ev.id}" data-i="${idx}" data-ef="as" ${d.as?'checked':''}>
        </td>
        <td class="td-ev check-cell">
          <input type="checkbox" data-ev="${ev.id}" data-i="${idx}" data-ef="pago"
            ${d.pago?'checked':''} onchange="updateResumo()">
        </td>`;
    });

    cells += `
      <td>
        <button class="btn-del-row" onclick="pedirConfirmacaoRemover(this)" title="Remover linha">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </td>`;

    bodyHtml += `<tr data-row="${idx}">${cells}</tr>`;
  });

  let footCells = `<td colspan="5"><strong>Total</strong></td><td id="ft-vlrTotal">R$ 0,00</td><td></td>`;
  eventos.forEach(ev => {
    footCells += `<td id="ft-ev-${ev.id}" class="ft-ev-val">R$ 0,00</td><td></td><td></td><td></td>`;
  });
  footCells += '<td></td>';

  wrapper.innerHTML = `
    <table id="tbl-grupo">
      <thead>
        <tr class="tr-header-top">${headerTop}</tr>
        <tr class="tr-header-sub">${headerSub}</tr>
      </thead>
      <tbody id="tbody-grupo">${bodyHtml}</tbody>
      <tfoot><tr>${footCells}</tr></tfoot>
    </table>`;

  updateResumo();
}

// ═══════════════════════════════════════════
// POPOVER NF
// ═══════════════════════════════════════════
function togglePopover(e, popId) {
  e.stopPropagation();
  document.querySelectorAll('.popover-panel.open').forEach(p => {
    if (p.id !== popId) p.classList.remove('open');
  });
  document.getElementById(popId).classList.toggle('open');
}

document.addEventListener('click', () => {
  document.querySelectorAll('.popover-panel.open').forEach(p => p.classList.remove('open'));
});

function salvarPopoverNF(idx, evId) {
  const num  = document.getElementById(`pop-nf-num-${idx}-${evId}`).value.trim();
  const link = document.getElementById(`pop-nf-link-${idx}-${evId}`).value.trim();
  const row  = document.querySelector(`tr[data-row="${idx}"]`);
  if (row) {
    const input = row.querySelector(`[data-ev="${evId}"][data-ef="nrNF"]`);
    if (input) input.value = num;
  }
  // Atualiza ícone do link
  const itens = coletarItensDoDOM();
  DB.saveItensGrupo(grupoAtual.id, itens);
  document.getElementById(`pop-nf-${idx}-${evId}`).classList.remove('open');
  renderGrupoDetalhe();
  showToast('NF salva!');
}

// ═══════════════════════════════════════════
// CÁLCULOS DA TABELA
// ═══════════════════════════════════════════
function calcLinhaGrupo(idx) {
  const row = document.querySelector(`tr[data-row="${idx}"]`);
  if (!row) return;
  const u = parseFloat(row.querySelector('[data-f="vlrUnitario"]').value) || 0;
  const q = parseFloat(row.querySelector('[data-f="qtd"]').value) || 0;
  if (u > 0 || q > 0) row.querySelector('[data-f="vlrTotal"]').value = (u*q).toFixed(2);
  updateResumo();
}

function updateResumo() {
  const eventos = DB.getEventos(grupoAtual.id);
  let totalOrc = 0, totalGasto = 0, totalPago = 0;
  const evTotais = {};
  eventos.forEach(ev => { evTotais[ev.id] = 0; });

  document.querySelectorAll('#tbody-grupo tr').forEach(row => {
    totalOrc += parseFloat(row.querySelector('[data-f="vlrTotal"]')?.value) || 0;
    eventos.forEach(ev => {
      const v = parseFloat(row.querySelector(`[data-ev="${ev.id}"][data-ef="valor"]`)?.value) || 0;
      const p = row.querySelector(`[data-ev="${ev.id}"][data-ef="pago"]`)?.checked;
      totalGasto += v;
      evTotais[ev.id] += v;
      if (p) totalPago += v;
    });
  });

  document.getElementById('resumo-orcamento').textContent = formatBRL(totalOrc);
  document.getElementById('resumo-gasto').textContent     = formatBRL(totalGasto);
  document.getElementById('resumo-pago').textContent      = formatBRL(totalPago);
  document.getElementById('resumo-pendente').textContent  = formatBRL(totalGasto - totalPago);

  const ftOrc = document.getElementById('ft-vlrTotal');
  if (ftOrc) ftOrc.textContent = formatBRL(totalOrc);
  eventos.forEach(ev => {
    const el = document.getElementById(`ft-ev-${ev.id}`);
    if (el) el.textContent = formatBRL(evTotais[ev.id]);
  });
}

function addItemGrupo() {
  const itens = coletarItensDoDOM();
  itens.push({
    id: gerarId(), categoria: '', descricao: '', fornecedor: '',
    vlrUnitario: '', qtd: '', vlrTotal: '', nrPedido: '', nrPedidoLink: '', eventos: {}
  });
  DB.saveItensGrupo(grupoAtual.id, itens);
  renderGrupoDetalhe();
}

function coletarItensDoDOM() {
  const eventos = DB.getEventos(grupoAtual.id);
  const rows = document.querySelectorAll('#tbody-grupo tr');
  const itens = [];

  rows.forEach((row, idx) => {
    const item = {
      id:           gerarId(),
      categoria:    row.querySelector('[data-f="categoria"]')?.value    || '',
      descricao:    row.querySelector('[data-f="descricao"]')?.value    || '',
      fornecedor:   row.querySelector('[data-f="fornecedor"]')?.value   || '',
      vlrUnitario:  row.querySelector('[data-f="vlrUnitario"]')?.value  || '',
      qtd:          row.querySelector('[data-f="qtd"]')?.value          || '',
      vlrTotal:     row.querySelector('[data-f="vlrTotal"]')?.value     || '',
      nrPedido:     row.querySelector('[data-f="nrPedido"]')?.value     || '',
      nrPedidoLink: row.querySelector('[data-f="nrPedidoLink"]')?.value || '',
      eventos: {}
    };

    eventos.forEach(ev => {
      item.eventos[ev.id] = {
        valor:    row.querySelector(`[data-ev="${ev.id}"][data-ef="valor"]`)?.value || '',
        nrNF:     row.querySelector(`[data-ev="${ev.id}"][data-ef="nrNF"]`)?.value  || '',
        nrNFLink: document.getElementById(`pop-nf-link-${idx}-${ev.id}`)?.value    || '',
        as:       row.querySelector(`[data-ev="${ev.id}"][data-ef="as"]`)?.checked  || false,
        pago:     row.querySelector(`[data-ev="${ev.id}"][data-ef="pago"]`)?.checked|| false,
      };
    });

    itens.push(item);
  });
  return itens;
}

function salvarGrupoItens() {
  const itens = coletarItensDoDOM();
  const eventos = DB.getEventos(grupoAtual.id);

  for (let i = 0; i < itens.length; i++) {
    const it = itens[i];
    if (!it.categoria)         { showToast(`Linha ${i+1}: Categoria é obrigatória.`, 'error');   return; }
    if (!it.descricao.trim())  { showToast(`Linha ${i+1}: Descrição é obrigatória.`, 'error');   return; }
    if (!it.fornecedor.trim()) { showToast(`Linha ${i+1}: Fornecedor é obrigatório.`, 'error');  return; }
    if (!it.nrPedido.trim())   { showToast(`Linha ${i+1}: Nr do Pedido é obrigatório.`, 'error'); return; }

    if (eventos.length > 0) {
      const temEvento = eventos.some(ev => {
        const d = it.eventos[ev.id];
        return d && (parseFloat(d.valor)||0) > 0 && (d.nrNF||'').trim();
      });
      if (!temEvento) {
        showToast(`Linha ${i+1}: Preencha Valor e NF em pelo menos 1 evento.`, 'error');
        return;
      }
    }
  }

  DB.saveItensGrupo(grupoAtual.id, itens);
  showToast('Dados salvos com sucesso! ✓');
}

// ═══════════════════════════════════════════
// REMOVER LINHA
// ═══════════════════════════════════════════
function pedirConfirmacaoRemover(btn) {
  rowParaRemover = btn.closest('tr');
  mostrarConfirmacao('Remover Item', 'Deseja realmente remover este item da tabela?', 'Remover', () => {
    if (rowParaRemover) {
      rowParaRemover.remove();
      rowParaRemover = null;
      const itens = coletarItensDoDOM();
      DB.saveItensGrupo(grupoAtual.id, itens);
      updateResumo();
      showToast('Item removido.', 'info');
    }
  }, '🗑️');
}

// ═══════════════════════════════════════════
// BALANCETE
// ═══════════════════════════════════════════
function verBalancete() {
  telaAnterior = 'tela-grupos';
  mostrarTela('tela-balancete');
  renderBalancete();
}

function getCatNome(catId) {
  const padrao = DB.getCategoriasPadrao();
  const found = padrao.find(c => c.id === catId);
  if (found) return found.nome;
  const crs = DB.getCRs();
  for (const cr of crs) {
    const extras = DB.getCategoriasExtrasCR(cr.id);
    const f = extras.find(c => c.id === catId);
    if (f) return f.nome;
  }
  return catId || 'Sem Categoria';
}

function renderBalancete() {
  document.getElementById('titulo-balancete').textContent = `Balancete — ${crAtual?crAtual.nome:''}`;
  const container = document.getElementById('conteudo-balancete');
  container.innerHTML = '';
  const grupos = DB.getGrupos(crAtual.id);
  const orc = DB.getOrcamento(crAtual.id);

  const passivos = {};
  const circulante = {};
  let totalPassivos = 0;
  let totalCirculante = 0;

  grupos.forEach(g => { passivos[g.nome] = {}; circulante[g.nome] = {}; });

  grupos.forEach(g => {
    const eventos = DB.getEventos(g.id);
    const itens = DB.getItensGrupo(g.id);
    itens.forEach(item => {
      const catNome = getCatNome(item.categoria);
      eventos.forEach(ev => {
        const d = item.eventos && item.eventos[ev.id];
        if (d) {
          const v = parseFloat(d.valor) || 0;
          if (v === 0) return;
          const destino = d.pago ? passivos : circulante;
          if (!destino[g.nome]) destino[g.nome] = {};
          if (!destino[g.nome][catNome]) destino[g.nome][catNome] = 0;
          destino[g.nome][catNome] += v;
          if (d.pago) totalPassivos += v; else totalCirculante += v;
        }
      });
    });
  });

  const saldo = orc - totalPassivos - totalCirculante;
  let rows = '';

  rows += `<tr class="bal-row-secao">
    <td>1.</td><td><strong>Entradas</strong></td><td>R$</td>
    <td><strong style="color:#0F766E">${formatBRL(orc)}</strong></td>
  </tr>`;
  rows += `<tr>
    <td style="padding-left:24px;color:#6B7280;">1.1</td>
    <td>Orçamento Disponível</td><td>R$</td><td>${formatBRL(orc)}</td>
  </tr>`;

  rows += `<tr class="bal-row-secao">
    <td>2.</td><td><strong>Passivos</strong></td><td>R$</td>
    <td><strong style="color:#DC2626">${formatBRL(totalPassivos)}</strong></td>
  </tr>`;

  let pIdx = 1;
  for (const grupoNome in passivos) {
    const cats = passivos[grupoNome];
    const temCats = Object.keys(cats).length > 0;
    let subTotal = 0;
    for (const c in cats) subTotal += cats[c];
    rows += `<tr class="bal-row-grupo">
      <td>2.${pIdx}</td><td>${esc(grupoNome)}</td><td>R$</td>
      <td>${temCats ? formatBRL(subTotal) : '<span class="bal-val-vazio">—</span>'}</td>
    </tr>`;
    if (temCats) {
      let cIdx = 1;
      for (const catNome in cats) {
        rows += `<tr class="bal-row-cat">
          <td>2.${pIdx}.${cIdx}</td><td>${esc(catNome)}</td><td>R$</td>
          <td>${formatBRL(cats[catNome])}</td>
        </tr>`;
        cIdx++;
      }
    }
    pIdx++;
  }

  rows += `<tr class="bal-row-secao">
    <td>3.</td><td><strong>Passivos Circulantes</strong></td><td>R$</td>
    <td><strong style="color:#D97706">${formatBRL(totalCirculante)}</strong></td>
  </tr>`;

  let cIdxG = 1;
  for (const grupoNome in circulante) {
    const cats = circulante[grupoNome];
    const temCats = Object.keys(cats).length > 0;
    let subTotal = 0;
    for (const c in cats) subTotal += cats[c];
    rows += `<tr class="bal-row-grupo">
      <td>3.${cIdxG}</td><td>${esc(grupoNome)}</td><td>R$</td>
      <td>${temCats ? formatBRL(subTotal) : '<span class="bal-val-vazio">—</span>'}</td>
    </tr>`;
    if (temCats) {
      let cIdx = 1;
      for (const catNome in cats) {
        rows += `<tr class="bal-row-cat">
          <td>3.${cIdxG}.${cIdx}</td><td>${esc(catNome)}</td><td>R$</td>
          <td>${formatBRL(cats[catNome])}</td>
        </tr>`;
        cIdx++;
      }
    }
    cIdxG++;
  }

  rows += `<tr class="bal-row-saldo">
    <td>4.</td><td><strong>Saldo Disponível</strong></td><td>R$</td>
    <td><strong>${formatBRL(saldo)}</strong></td>
  </tr>`;

  container.innerHTML = `
    <table class="balancete-table">
      <thead>
        <tr>
          <th style="width:100px;">Código</th>
          <th>Plano de Contas</th>
          <th style="width:50px;"></th>
          <th style="width:140px;">Valor</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ═══════════════════════════════════════════
// EXPORTAR EXCEL — HELPERS
// ═══════════════════════════════════════════
function stl(fill, font, border, numFmt, alignment) {
  const s = {};
  if (fill)      s.fill      = { fgColor: { rgb: fill } };
  if (font)      s.font      = font;
  if (border)    s.border    = border;
  if (numFmt)    s.numFmt    = numFmt;
  if (alignment) s.alignment = alignment;
  return s;
}

const BORDER_THIN = {
  top:    { style: 'thin',   color: { rgb: 'D1D5DB' } },
  bottom: { style: 'thin',   color: { rgb: 'D1D5DB' } },
  left:   { style: 'thin',   color: { rgb: 'D1D5DB' } },
  right:  { style: 'thin',   color: { rgb: 'D1D5DB' } }
};
const BORDER_BOTTOM_THICK = {
  ...BORDER_THIN,
  bottom: { style: 'medium', color: { rgb: '111827' } }
};

const FONT_HEADER = { bold: true,  color: { rgb: 'FFFFFF' }, sz: 11 };
const FONT_SUB    = { bold: true,  color: { rgb: '374151' }, sz: 10 };
const FONT_NORMAL = {              color: { rgb: '111827' }, sz: 10 };
const FONT_BOLD   = { bold: true,  color: { rgb: '111827' }, sz: 10 };
const FONT_TOTAL  = { bold: true,  color: { rgb: '111827' }, sz: 11 };
const FONT_TITLE  = { bold: true,  color: { rgb: 'FFFFFF' }, sz: 13 };

const ALIGN_CENTER = { horizontal: 'center', vertical: 'center' };
const ALIGN_LEFT   = { vertical: 'center' };
const ALIGN_RIGHT  = { horizontal: 'right',  vertical: 'center' };
const BRL_FMT      = '#,##0.00';

function applyStylesToRange(ws, startRow, startCol, endRow, endCol, style) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { v: '', t: 's' };
      ws[addr].s = style;
    }
  }
}

// ═══════════════════════════════════════════
// EXPORTAR EXCEL — GRUPO
// ═══════════════════════════════════════════
function exportarGrupoExcel() {
  const eventos = DB.getEventos(grupoAtual.id);
  const itens   = DB.getItensGrupo(grupoAtual.id);
  const cats    = crAtual ? DB.getCategoriasDisponiveis(crAtual.id) : [];
  const data    = [];
  const totalCols = 7 + (eventos.length * 4);

  const tituloRow = [grupoAtual.nome + ' — ' + (crAtual ? crAtual.nome : '')];
  for (let i = 1; i < totalCols; i++) tituloRow.push('');
  data.push(tituloRow);

  const dataRow = ['Exportado em: ' + new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR')];
  for (let i = 1; i < totalCols; i++) dataRow.push('');
  data.push(dataRow);

  data.push(Array(totalCols).fill(''));

  const h1 = ['', '', '', 'ORÇAMENTO', '', '', ''];
  eventos.forEach(ev => { h1.push(ev.nome, '', '', ''); });
  data.push(h1);

  const h2 = ['Categoria', 'Descrição', 'Fornecedor', 'Vlr Unitário', 'Qtd', 'Vlr Total', 'Nr Pedido'];
  eventos.forEach(() => { h2.push('Valor', 'Nr da NF', 'AS', 'Pago?'); });
  data.push(h2);

  let totalOrcamento = 0;
  const evTotais = {};
  eventos.forEach(ev => { evTotais[ev.id] = 0; });

  itens.forEach(item => {
    const catNome  = cats.find(c => c.id === item.categoria)?.nome || item.categoria || '';
    const vlrTotal = parseFloat(item.vlrTotal) || 0;
    totalOrcamento += vlrTotal;

    const row = [
      catNome,
      item.descricao   || '',
      item.fornecedor  || '',
      parseFloat(item.vlrUnitario) || 0,
      parseFloat(item.qtd)         || 0,
      vlrTotal,
      item.nrPedido    || ''
    ];

    eventos.forEach(ev => {
      const d = (item.eventos && item.eventos[ev.id]) || {};
      const v = parseFloat(d.valor) || 0;
      evTotais[ev.id] += v;
      row.push(v, d.nrNF || '', d.as ? 'Sim' : '', d.pago ? 'Sim' : '');
    });
    data.push(row);
  });

  const totalRow = ['', '', '', '', 'TOTAL', totalOrcamento, ''];
  eventos.forEach(ev => { totalRow.push(evTotais[ev.id], '', '', ''); });
  data.push(totalRow);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);

  const colWidths = [{ wch:20 },{ wch:22 },{ wch:18 },{ wch:14 },{ wch:8 },{ wch:14 },{ wch:14 }];
  eventos.forEach(() => { colWidths.push({ wch:14 },{ wch:14 },{ wch:6 },{ wch:8 }); });
  ws['!cols'] = colWidths;

  const merges = [
    { s:{ r:0,c:0 }, e:{ r:0,c:totalCols-1 } },
    { s:{ r:1,c:0 }, e:{ r:1,c:totalCols-1 } },
    { s:{ r:3,c:3 }, e:{ r:3,c:6 } }
  ];
  eventos.forEach((_,i) => {
    const sc = 7 + (i*4);
    merges.push({ s:{ r:3,c:sc }, e:{ r:3,c:sc+3 } });
  });
  ws['!merges'] = merges;

  applyStylesToRange(ws,0,0,0,totalCols-1, stl('0F766E',FONT_TITLE,BORDER_THIN,null,ALIGN_CENTER));
  applyStylesToRange(ws,1,0,1,totalCols-1, stl('F0FDFA',{color:{rgb:'6B7280'},sz:9,italic:true},BORDER_THIN,null,ALIGN_CENTER));
  applyStylesToRange(ws,3,0,3,6,           stl('0F766E',FONT_HEADER,BORDER_THIN,null,ALIGN_CENTER));
  eventos.forEach((_,i) => {
    const sc = 7+(i*4);
    applyStylesToRange(ws,3,sc,3,sc+3, stl('1D4ED8',FONT_HEADER,BORDER_THIN,null,ALIGN_CENTER));
  });
  applyStylesToRange(ws,4,0,4,totalCols-1, stl('F9FAFB',FONT_SUB,BORDER_BOTTOM_THICK,null,ALIGN_CENTER));

  const dataStart = 5;
  const dataEnd   = dataStart + itens.length - 1;
  for (let r = dataStart; r <= dataEnd; r++) {
    for (let c = 0; c < 7; c++) {
      const addr  = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { v:'', t:'s' };
      const isNum = (c===3||c===4||c===5);
      ws[addr].s = stl(
        r%2===0 ? 'FFFFFF' : 'F9FAFB', FONT_NORMAL, BORDER_THIN,
        isNum ? BRL_FMT : null,
        isNum ? ALIGN_RIGHT : ALIGN_LEFT
      );
    }
    eventos.forEach((_,i) => {
      const sc = 7+(i*4);
      for (let c = sc; c < sc+4; c++) {
        const addr  = XLSX.utils.encode_cell({ r, c });
        if (!ws[addr]) ws[addr] = { v:'', t:'s' };
        const isVal = (c===sc);
        ws[addr].s = stl(
          r%2===0 ? 'F0F4FF' : 'F8FAFF', FONT_NORMAL, BORDER_THIN,
          isVal ? BRL_FMT : null,
          c>=sc+2 ? ALIGN_CENTER : (isVal ? ALIGN_RIGHT : ALIGN_LEFT)
        );
      }
    });
  }

  const totalRowIdx = dataEnd + 1;
  applyStylesToRange(ws,totalRowIdx,0,totalRowIdx,totalCols-1, stl('E5E7EB',FONT_TOTAL,BORDER_BOTTOM_THICK,null,ALIGN_CENTER));
  const ftAddr = XLSX.utils.encode_cell({ r:totalRowIdx, c:5 });
  if (ws[ftAddr]) ws[ftAddr].s = stl('E5E7EB',FONT_TOTAL,BORDER_BOTTOM_THICK,BRL_FMT,ALIGN_RIGHT);
  eventos.forEach((ev,i) => {
    const sc   = 7+(i*4);
    const addr = XLSX.utils.encode_cell({ r:totalRowIdx, c:sc });
    if (ws[addr]) ws[addr].s = stl('E5E7EB',{bold:true,color:{rgb:'1D4ED8'},sz:11},BORDER_BOTTOM_THICK,BRL_FMT,ALIGN_RIGHT);
  });

  const sheetName = grupoAtual.nome.substring(0,31).replace(/[\\\/\*\?\[\]]/g,'');
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${grupoAtual.nome}.xlsx`);
  showToast('Excel exportado com sucesso!');
}

// ═══════════════════════════════════════════
// EXPORTAR EXCEL — BALANCETE
// ═══════════════════════════════════════════
function exportarBalanceteExcel() {
  const grupos = DB.getGrupos(crAtual.id);
  const orc    = DB.getOrcamento(crAtual.id);
  const data   = [];
  let row = 0;

  data.push(['Balancete — ' + crAtual.nome, '', '', '']); row++;
  data.push(['Exportado em: ' + new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'), '', '', '']); row++;
  data.push(['', '', '', '']); row++;

  data.push(['1. ENTRADAS', '', '', '']); row++;
  data.push(['', '1.1 Orçamento', '', orc]); row++;
  data.push(['', 'Total Entradas', '', orc]); row++;
  data.push(['', '', '', '']); row++;

  const passivos = {}, circulante = {};
  let totalPassivos = 0, totalCirculante = 0;

  grupos.forEach(g => {
    const eventos = DB.getEventos(g.id);
    const itens   = DB.getItensGrupo(g.id);
    itens.forEach(item => {
      const catNome = getCatNome(item.categoria);
      eventos.forEach(ev => {
        const d = item.eventos && item.eventos[ev.id];
        if (d) {
          const v = parseFloat(d.valor) || 0;
          if (v === 0) return;
          const destino = d.pago ? passivos : circulante;
          if (!destino[g.nome]) destino[g.nome] = {};
          if (!destino[g.nome][catNome]) destino[g.nome][catNome] = 0;
          destino[g.nome][catNome] += v;
          if (d.pago) totalPassivos += v; else totalCirculante += v;
        }
      });
    });
  });

  data.push(['2. PASSIVOS (Despesas Pagas)', '', '', '']); row++;
  let pIdx = 1;
  for (const grupoNome in passivos) {
    data.push(['', `2.${pIdx} ${grupoNome}`, '', '']); row++;
    let subTotal = 0, cIdx = 1;
    for (const catNome in passivos[grupoNome]) {
      const v = passivos[grupoNome][catNome];
      subTotal += v;
      data.push(['', '', `2.${pIdx}.${cIdx} ${catNome}`, v]); row++;
      cIdx++;
    }
    data.push(['', '', 'Subtotal', subTotal]); row++;
    pIdx++;
  }
  if (!Object.keys(passivos).length) { data.push(['', 'Nenhuma despesa paga', '', 0]); row++; }
  data.push(['', 'Total Passivos', '', totalPassivos]); row++;
  data.push(['', '', '', '']); row++;

  data.push(['3. PASSIVOS CIRCULANTE (Despesas Pendentes)', '', '', '']); row++;
  let cIdxG = 1;
  for (const grupoNome in circulante) {
    data.push(['', `3.${cIdxG} ${grupoNome}`, '', '']); row++;
    let subTotal = 0, cIdx = 1;
    for (const catNome in circulante[grupoNome]) {
      const v = circulante[grupoNome][catNome];
      subTotal += v;
      data.push(['', '', `3.${cIdxG}.${cIdx} ${catNome}`, v]); row++;
      cIdx++;
    }
    data.push(['', '', 'Subtotal', subTotal]); row++;
    cIdxG++;
  }
  if (!Object.keys(circulante).length) { data.push(['', 'Nenhuma despesa pendente', '', 0]); row++; }
  data.push(['', 'Total Passivos Circulante', '', totalCirculante]); row++;
  data.push(['', '', '', '']); row++;

  data.push(['RESUMO', '', '', '']); row++;
  data.push(['', 'Entradas', '', orc]); row++;
  data.push(['', '(-) Passivos', '', totalPassivos]); row++;
  data.push(['', '(-) Passivos Circulante', '', totalCirculante]); row++;
  const saldo = orc - totalPassivos - totalCirculante;
  data.push(['', 'SALDO DISPONÍVEL', '', saldo]); row++;

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch:8 },{ wch:30 },{ wch:30 },{ wch:20 }];
  ws['!merges'] = [
    { s:{ r:0,c:0 }, e:{ r:0,c:3 } },
    { s:{ r:1,c:0 }, e:{ r:1,c:3 } }
  ];

  applyStylesToRange(ws,0,0,0,3, stl('0F766E',FONT_TITLE,BORDER_THIN,null,ALIGN_CENTER));
  applyStylesToRange(ws,1,0,1,3, stl('F0FDFA',{color:{rgb:'6B7280'},sz:9,italic:true},BORDER_THIN,null,ALIGN_CENTER));

  for (let r = 3; r < data.length; r++) {
    const rowData = data[r];
    for (let c = 0; c < 4; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) ws[addr] = { v:'', t:'s' };

      if (rowData[0] && (rowData[0].startsWith('1.')||rowData[0].startsWith('2.')||rowData[0].startsWith('3.')||rowData[0]==='RESUMO')) {
        let bg = 'F9FAFB', fc = '111827';
        if (rowData[0].startsWith('1.'))   { bg='0F766E'; fc='FFFFFF'; }
        else if (rowData[0].startsWith('2.')) { bg='DC2626'; fc='FFFFFF'; }
        else if (rowData[0].startsWith('3.')) { bg='F59E0B'; fc='111827'; }
        else if (rowData[0]==='RESUMO')        { bg='0F766E'; fc='FFFFFF'; }
        ws[addr].s = stl(bg,{bold:true,color:{rgb:fc},sz:11},BORDER_THIN,null,ALIGN_LEFT);
      } else if (c===2 && rowData[2]==='Subtotal') {
        ws[addr].s = stl('F3F4F6',FONT_BOLD,BORDER_THIN,null,ALIGN_LEFT);
        const va = XLSX.utils.encode_cell({ r, c:3 });
        if (ws[va]) ws[va].s = stl('F3F4F6',FONT_BOLD,BORDER_THIN,BRL_FMT,ALIGN_RIGHT);
      } else if (c===1 && rowData[1]?.startsWith('Total')) {
        ws[addr].s = stl('E5E7EB',FONT_TOTAL,BORDER_BOTTOM_THICK,null,ALIGN_LEFT);
        const va = XLSX.utils.encode_cell({ r, c:3 });
        if (ws[va]) ws[va].s = stl('E5E7EB',FONT_TOTAL,BORDER_BOTTOM_THICK,BRL_FMT,ALIGN_RIGHT);
      } else if (c===1 && rowData[1]==='SALDO DISPONÍVEL') {
        ws[addr].s = stl('0F766E',{bold:true,color:{rgb:'FFFFFF'},sz:12},BORDER_THIN,null,ALIGN_LEFT);
        const va = XLSX.utils.encode_cell({ r, c:3 });
        if (ws[va]) ws[va].s = stl('0F766E',{bold:true,color:{rgb:'FFFFFF'},sz:12},BORDER_THIN,BRL_FMT,ALIGN_RIGHT);
      } else if (c===3 && typeof rowData[3]==='number') {
        ws[addr].s = stl(null,FONT_NORMAL,BORDER_THIN,BRL_FMT,ALIGN_RIGHT);
      } else if (c===1 && rowData[1] && (rowData[1].match(/^\d\.\d\s/)||rowData[1]==='1.1 Orçamento')) {
        ws[addr].s = stl('F0FDFA',{bold:true,color:{rgb:'0F766E'},sz:10},BORDER_THIN,null,ALIGN_LEFT);
      } else {
        ws[addr].s = stl(null,FONT_NORMAL,BORDER_THIN,null,ALIGN_LEFT);
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Balancete');
  XLSX.writeFile(wb, `Balancete_${crAtual.nome}.xlsx`);
  showToast('Balancete exportado com sucesso!');
}

// ═══════════════════════════════════════════
// CATEGORIAS PADRÃO
// ═══════════════════════════════════════════
function renderCategoriasPadrao() {
  const lista = document.getElementById('lista-cat-padrao');
  lista.innerHTML = '';
  DB.getCategoriasPadrao().forEach(cat => {
    const div = document.createElement('div');
    div.className = `cat-item ${!cat.ativo?'cat-inativo':''}`;
    div.innerHTML = `
      <span class="cat-nome">${esc(cat.nome)}</span>
      <label class="toggle">
        <input type="checkbox" ${cat.ativo?'checked':''} onchange="toggleCategoriaPadrao('${cat.id}')">
        <span class="toggle-slider"></span>
      </label>`;
    lista.appendChild(div);
  });
}

function salvarCategoriaPadrao() {
  const nome = document.getElementById('input-cat-padrao').value.trim();
  if (!nome) { showToast('Informe o nome da categoria.', 'warning'); return; }
  const cats = DB.getCategoriasPadrao();
  cats.push({ id: gerarId(), nome, ativo: true });
  DB.saveCategoriasPadrao(cats);
  document.getElementById('input-cat-padrao').value = '';
  fecharModal('modal-categoria-padrao');
  showToast('Categoria criada!');
  renderCategoriasPadrao();
}

function toggleCategoriaPadrao(catId) {
  DB.saveCategoriasPadrao(DB.getCategoriasPadrao().map(c => c.id===catId?{...c,ativo:!c.ativo}:c));
  renderCategoriasPadrao();
}

// ═══════════════════════════════════════════
// CATEGORIAS POR CR
// ═══════════════════════════════════════════
function abrirModalCatCR(crId, crNome) {
  crIdModalCat = crId;
  document.getElementById('titulo-modal-cat-cr').textContent = `Nova Categoria — ${crNome}`;
  abrirModal('modal-categoria-cr');
}

function salvarCategoriaCR() {
  const nome = document.getElementById('input-cat-cr').value.trim();
  if (!nome) { showToast('Informe o nome.', 'warning'); return; }
  const extras = DB.getCategoriasExtrasCR(crIdModalCat);
  extras.push({ id: gerarId(), nome, ativo: true });
  DB.saveCategoriasExtrasCR(crIdModalCat, extras);
  document.getElementById('input-cat-cr').value = '';
  fecharModal('modal-categoria-cr');
  showToast('Categoria adicionada ao CR!');
  renderCategoriasCRs();
}

function togglePadraoNoCR(crId, catId) {
  const d = DB.getCategoriasDesativadasCR(crId);
  const i = d.indexOf(catId);
  if (i === -1) d.push(catId); else d.splice(i, 1);
  DB.saveCategoriasDesativadasCR(crId, d);
}

function toggleCategoriaExtraCR(crId, catId) {
  DB.saveCategoriasExtrasCR(crId, DB.getCategoriasExtrasCR(crId).map(c => c.id===catId?{...c,ativo:!c.ativo}:c));
  renderCategoriasCRs();
}

function deletarCategoriaExtraCR(crId, catId) {
  mostrarConfirmacao('Remover Categoria', 'Deseja remover esta categoria?', 'Remover', () => {
    DB.saveCategoriasExtrasCR(crId, DB.getCategoriasExtrasCR(crId).filter(c => c.id !== catId));
    showToast('Categoria removida.', 'info');
    renderCategoriasCRs();
  }, '🗑️');
}

function renderCategoriasCRs() {
  const container = document.getElementById('lista-cat-crs');
  container.innerHTML = '';
  const crs = DB.getCRs();
  if (!crs.length) { container.innerHTML = '<p class="empty-msg">Nenhum CR criado ainda.</p>'; return; }
  crs.forEach(cr => {
    const bloco  = document.createElement('div');
    bloco.className = 'config-cr-bloco';
    const titulo = document.createElement('div');
    titulo.className = 'config-cr-titulo';
    titulo.innerHTML = `<span>${esc(cr.nome)}</span><span class="cr-chevron">▼</span>`;
    const body = document.createElement('div');
    body.className = 'config-cr-body';
    body.innerHTML = buildBodyCategoriaCR(cr);
    titulo.addEventListener('click', () => {
      const isOpen = body.classList.contains('open');
      container.querySelectorAll('.config-cr-body').forEach(b => b.classList.remove('open'));
      container.querySelectorAll('.config-cr-titulo').forEach(t => t.classList.remove('open'));
      if (!isOpen) { body.classList.add('open'); titulo.classList.add('open'); }
    });
    bloco.appendChild(titulo);
    bloco.appendChild(body);
    container.appendChild(bloco);
  });
}

function buildBodyCategoriaCR(cr) {
  const extras     = DB.getCategoriasExtrasCR(cr.id);
  const desativadas = DB.getCategoriasDesativadasCR(cr.id);
  const padrao     = DB.getCategoriasPadrao().filter(c => c.ativo);

  return `
    <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
      <button class="btn-add-cat-small" onclick="abrirModalCatCR('${cr.id}','${esc(cr.nome)}')">+ Adicionar</button>
    </div>
    <p style="font-size:11px;color:#a0aec0;margin-bottom:8px;font-weight:600;text-transform:uppercase;">Categorias Padrão</p>
    ${padrao.map(c => `
      <div class="cat-item ${desativadas.includes(c.id)?'cat-inativo':''}">
        <span class="cat-nome">${esc(c.nome)}</span>
        <label class="toggle">
          <input type="checkbox" ${!desativadas.includes(c.id)?'checked':''} onchange="togglePadraoNoCR('${cr.id}','${c.id}')">
          <span class="toggle-slider"></span>
        </label>
      </div>`).join('')}
    ${extras.length ? `
      <p style="font-size:11px;color:#a0aec0;margin:12px 0 8px;font-weight:600;text-transform:uppercase;">Exclusivas deste CR</p>
      ${extras.map(cat => `
        <div class="cat-item ${!cat.ativo?'cat-inativo':''}">
          <span class="cat-nome">${esc(cat.nome)}</span>
          <div class="cat-acoes">
            <label class="toggle">
              <input type="checkbox" ${cat.ativo?'checked':''} onchange="toggleCategoriaExtraCR('${cr.id}','${cat.id}')">
              <span class="toggle-slider"></span>
            </label>
            <button class="btn-icon-danger" onclick="deletarCategoriaExtraCR('${cr.id}','${cat.id}')">Remover</button>
          </div>
        </div>`).join('')}` : ''}`;
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  renderCRs();
});
