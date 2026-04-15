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
// VARIÁVEIS GLOBAIS
// ═══════════════════════════════════════════
let crAtual = null;
let grupoAtual = null;
let telaAnterior = null;
let rowParaRemover = null;
let crIdModalCat = null;
let ctxTarget = null;

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
// MENU 3 PONTINHOS (⋮)
// ═══════════════════════════════════════════
function abrirCtxMenu(e, tipo, id) {
  e.stopPropagation();
  e.preventDefault();
  const menu = document.getElementById('ctx-menu');
  ctxTarget = { tipo, id };

  const btnEditar = document.getElementById('ctx-editar');
  const btnDeletar = document.getElementById('ctx-deletar');

  if (tipo === 'cr') {
    btnEditar.style.display = 'block';
    btnEditar.textContent = '✏️ Editar Orçamento';
    btnEditar.onclick = () => { fecharCtxMenu(); abrirEditarOrcamento(id); };
    btnDeletar.textContent = '🗑️ Deletar CR';
    btnDeletar.onclick = () => { fecharCtxMenu(); deletarCR(id); };
  } else if (tipo === 'grupo') {
    btnEditar.style.display = 'none';
    btnDeletar.textContent = '🗑️ Deletar Grupo';
    btnDeletar.onclick = () => { fecharCtxMenu(); deletarGrupo(id); };
  } else if (tipo === 'evento') {
    btnEditar.style.display = 'none';
    btnDeletar.textContent = '🗑️ Deletar Evento';
    btnDeletar.onclick = () => { fecharCtxMenu(); deletarEvento(id); };
  }

  menu.style.display = 'block';
  // Posicionar sem sair da tela
  const x = Math.min(e.pageX, window.innerWidth - 200);
  const y = Math.min(e.pageY, window.innerHeight - 100);
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
}

function fecharCtxMenu() {
  document.getElementById('ctx-menu').style.display = 'none';
  ctxTarget = null;
}

document.addEventListener('click', fecharCtxMenu);

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
  if (!nome) { alert('Informe o nome do CR.'); return; }
  const crs = DB.getCRs();
  const novo = { id: gerarId(), nome };
  crs.push(novo);
  DB.saveCRs(crs);
  DB.saveOrcamento(novo.id, orc);
  document.getElementById('input-cr').value = '';
  document.getElementById('input-cr-orcamento').value = '';
  fecharModal('modal-cr');
  renderCRs();
}

function deletarCR(crId) {
  if (!confirm('Deletar este CR e todos os seus dados?')) return;
  DB.saveCRs(DB.getCRs().filter(c => c.id !== crId));
  renderCRs();
}

function abrirEditarOrcamento(crId) {
  crAtual = DB.getCRs().find(c => c.id === crId) || crAtual;
  document.getElementById('input-orcamento').value = DB.getOrcamento(crId);
  abrirModal('modal-orcamento');
}

function salvarOrcamento() {
  const valor = parseFloat(document.getElementById('input-orcamento').value) || 0;
  DB.saveOrcamento(crAtual.id, valor);
  fecharModal('modal-orcamento');
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
      <div class="card-info">${eventos.length} evento(s)</div>
      <div class="card-valor">${formatBRL(total)}</div>`;
    card.addEventListener('click', () => { grupoAtual = g; irParaGrupoDetalhe(); });
    lista.appendChild(card);
  });
}

function salvarGrupo() {
  const nome = document.getElementById('input-grupo').value.trim();
  if (!nome) { alert('Informe o nome do grupo.'); return; }
  const grupos = DB.getGrupos(crAtual.id);
  grupos.push({ id: gerarId(), nome });
  DB.saveGrupos(crAtual.id, grupos);
  document.getElementById('input-grupo').value = '';
  fecharModal('modal-grupo');
  renderGrupos();
}

function deletarGrupo(grupoId) {
  if (!confirm('Deletar este grupo e todos os seus dados?')) return;
  DB.saveGrupos(crAtual.id, DB.getGrupos(crAtual.id).filter(g => g.id !== grupoId));
  renderGrupos();
}

// ═══════════════════════════════════════════
// EVENTOS (antigo "Reuniões")
// ═══════════════════════════════════════════
function salvarEvento() {
  const nome = document.getElementById('input-evento').value.trim();
  if (!nome) { alert('Informe o nome do evento.'); return; }
  const eventos = DB.getEventos(grupoAtual.id);
  eventos.push({ id: gerarId(), nome });
  DB.saveEventos(grupoAtual.id, eventos);
  document.getElementById('input-evento').value = '';
  fecharModal('modal-evento');
  renderGrupoDetalhe();
}

function deletarEvento(eventoId) {
  if (!confirm('Deletar este evento e seus dados?')) return;
  DB.saveEventos(grupoAtual.id, DB.getEventos(grupoAtual.id).filter(e => e.id !== eventoId));
  // Limpar dados do evento nos itens
  const itens = DB.getItensGrupo(grupoAtual.id);
  itens.forEach(item => { if (item.eventos) delete item.eventos[eventoId]; });
  DB.saveItensGrupo(grupoAtual.id, itens);
  renderGrupoDetalhe();
}

// ═══════════════════════════════════════════
// GRUPO DETALHE — TABELA ESTILO PLANILHA
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

  const numEventos = eventos.length;
  const colspanOrc = 7; // Categoria, Descrição, Fornecedor, Vlr Unit, Qtd, Vlr Total, Nr Pedido

  // ═══ HEADER TOP ═══
  let headerTop = `<th colspan="${colspanOrc}" class="th-orc-header">Orçamento</th>`;
  eventos.forEach(ev => {
    headerTop += `<th colspan="4" class="th-evento-header">
      ${esc(ev.nome)}
      <button class="btn-ctx btn-ctx-sm" onclick="abrirCtxMenu(event,'evento','${ev.id}')">⋮</button>
    </th>`;
  });
  headerTop += '<th class="th-acao-header"></th>';

  // ═══ HEADER SUB ═══
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

  // ═══ BODY ═══
  let bodyHtml = '';
  itens.forEach((item, idx) => {
    let cells = `
      <td><select data-f="categoria" data-i="${idx}">${buildCategoriasOptions(item.categoria||'')}</select></td>
      <td><input type="text" data-f="descricao" data-i="${idx}" value="${esc(item.descricao||'')}" placeholder="Descrição"></td>
      <td><input type="text" data-f="fornecedor" data-i="${idx}" value="${esc(item.fornecedor||'')}" placeholder="Fornecedor"></td>
      <td><input type="number" data-f="vlrUnitario" data-i="${idx}" value="${item.vlrUnitario||''}" placeholder="0,00" oninput="calcLinhaGrupo(${idx})"></td>
      <td><input type="number" data-f="qtd" data-i="${idx}" value="${item.qtd||''}" placeholder="0" oninput="calcLinhaGrupo(${idx})"></td>
      <td><input type="number" data-f="vlrTotal" data-i="${idx}" value="${item.vlrTotal||''}" placeholder="0,00" oninput="updateResumo()"></td>
      <td><input type="text" data-f="nrPedido" data-i="${idx}" value="${esc(item.nrPedido||'')}" placeholder="Nr Pedido"></td>`;

    eventos.forEach(ev => {
      const d = (item.eventos && item.eventos[ev.id]) || {};
      cells += `
        <td class="td-ev"><input type="number" data-ev="${ev.id}" data-i="${idx}" data-ef="valor" value="${d.valor||''}" placeholder="0,00" oninput="updateResumo()"></td>
        <td class="td-ev"><input type="text" data-ev="${ev.id}" data-i="${idx}" data-ef="nrNF" value="${esc(d.nrNF||'')}" placeholder="NF"></td>
        <td class="td-ev check-cell"><input type="checkbox" data-ev="${ev.id}" data-i="${idx}" data-ef="as" ${d.as?'checked':''}></td>
        <td class="td-ev check-cell"><input type="checkbox" data-ev="${ev.id}" data-i="${idx}" data-ef="pago" ${d.pago?'checked':''} onchange="updateResumo()"></td>`;
    });

    cells += `<td><button class="btn-del-row" onclick="pedirConfirmacaoRemover(this)">🗑️</button></td>`;
    bodyHtml += `<tr data-row="${idx}">${cells}</tr>`;
  });

  // ═══ FOOTER ═══
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
  document.getElementById('resumo-gasto').textContent = formatBRL(totalGasto);
  document.getElementById('resumo-pago').textContent = formatBRL(totalPago);
  document.getElementById('resumo-pendente').textContent = formatBRL(totalGasto - totalPago);

  // Footer por evento
  const ftOrc = document.getElementById('ft-vlrTotal');
  if (ftOrc) ftOrc.textContent = formatBRL(totalOrc);
  eventos.forEach(ev => {
    const el = document.getElementById(`ft-ev-${ev.id}`);
    if (el) el.textContent = formatBRL(evTotais[ev.id]);
  });
}

function addItemGrupo() {
  // Salvar estado atual, adicionar item vazio, re-renderizar
  const itens = coletarItensDoDOM();
  itens.push({
    id: gerarId(), categoria: '', descricao: '', fornecedor: '',
    vlrUnitario: '', qtd: '', vlrTotal: '', nrPedido: '', eventos: {}
  });
  DB.saveItensGrupo(grupoAtual.id, itens);
  renderGrupoDetalhe();
}

function coletarItensDoDOM() {
  const eventos = DB.getEventos(grupoAtual.id);
  const rows = document.querySelectorAll('#tbody-grupo tr');
  const itens = [];

  rows.forEach(row => {
    const item = {
      id: gerarId(),
      categoria:   row.querySelector('[data-f="categoria"]')?.value || '',
      descricao:   row.querySelector('[data-f="descricao"]')?.value || '',
      fornecedor:  row.querySelector('[data-f="fornecedor"]')?.value || '',
      vlrUnitario: row.querySelector('[data-f="vlrUnitario"]')?.value || '',
      qtd:         row.querySelector('[data-f="qtd"]')?.value || '',
      vlrTotal:    row.querySelector('[data-f="vlrTotal"]')?.value || '',
      nrPedido:    row.querySelector('[data-f="nrPedido"]')?.value || '',
      eventos: {}
    };

    eventos.forEach(ev => {
      item.eventos[ev.id] = {
        valor: row.querySelector(`[data-ev="${ev.id}"][data-ef="valor"]`)?.value || '',
        nrNF:  row.querySelector(`[data-ev="${ev.id}"][data-ef="nrNF"]`)?.value || '',
        as:    row.querySelector(`[data-ev="${ev.id}"][data-ef="as"]`)?.checked || false,
        pago:  row.querySelector(`[data-ev="${ev.id}"][data-ef="pago"]`)?.checked || false,
      };
    });

    itens.push(item);
  });
  return itens;
}

function salvarGrupoItens() {
  const itens = coletarItensDoDOM();
  const eventos = DB.getEventos(grupoAtual.id);

  // Validação de campos obrigatórios
  for (let i = 0; i < itens.length; i++) {
    const it = itens[i];
    if (!it.categoria)        { alert(`Linha ${i+1}: Categoria é obrigatória.`); return; }
    if (!it.descricao.trim()) { alert(`Linha ${i+1}: Descrição é obrigatória.`); return; }
    if (!it.fornecedor.trim()){ alert(`Linha ${i+1}: Fornecedor é obrigatório.`); return; }
    if (!it.nrPedido.trim())  { alert(`Linha ${i+1}: Nr do Pedido é obrigatório.`); return; }

    // Precisa de Valor + NF em pelo menos 1 evento
    if (eventos.length > 0) {
      const temEvento = eventos.some(ev => {
        const d = it.eventos[ev.id];
        return d && (parseFloat(d.valor)||0) > 0 && (d.nrNF||'').trim();
      });
      if (!temEvento) {
        alert(`Linha ${i+1}: Preencha Valor e NF em pelo menos 1 evento.`);
        return;
      }
    }
  }

  DB.saveItensGrupo(grupoAtual.id, itens);
  alert('✅ Salvo com sucesso!');
}

// ═══════════════════════════════════════════
// REMOVER LINHA
// ═══════════════════════════════════════════
function pedirConfirmacaoRemover(btn) {
  rowParaRemover = btn.closest('tr');
  abrirModal('modal-confirmar-delete');
}

function confirmarRemoveRow() {
  if (rowParaRemover) {
    rowParaRemover.remove();
    rowParaRemover = null;
    const itens = coletarItensDoDOM();
    DB.saveItensGrupo(grupoAtual.id, itens);
    updateResumo();
  }
  fecharModal('modal-confirmar-delete');
}

// ═══════════════════════════════════════════
// BALANCETE
// ═══════════════════════════════════════════
function verBalancete() {
  telaAnterior = 'tela-grupos';
  mostrarTela('tela-balancete');
  renderBalancete();
}

function renderBalancete() {
  document.getElementById('titulo-balancete').textContent = `Balancete — ${crAtual?crAtual.nome:''}`;
  const container = document.getElementById('conteudo-balancete');
  container.innerHTML = '';
  const grupos = DB.getGrupos(crAtual.id);
  if (!grupos.length) { container.innerHTML = '<p class="empty-msg">Nenhum grupo encontrado.</p>'; return; }

  let totalCR = 0, pagoCR = 0;
  grupos.forEach(g => {
    const eventos = DB.getEventos(g.id);
    const itens = DB.getItensGrupo(g.id);
    let totalG = 0, pagoG = 0;

    itens.forEach(item => {
      eventos.forEach(ev => {
        const d = item.eventos && item.eventos[ev.id];
        if (d) {
          const v = parseFloat(d.valor)||0;
          totalG += v;
          if (d.pago) pagoG += v;
        }
      });
    });

    totalCR += totalG;
    pagoCR += pagoG;

    const bloco = document.createElement('div');
    bloco.className = 'balancete-grupo';

    let linhasEv = '';
    eventos.forEach(ev => {
      let evTotal = 0, evPago = 0;
      itens.forEach(item => {
        const d = item.eventos && item.eventos[ev.id];
        if (d) {
          const v = parseFloat(d.valor)||0;
          evTotal += v;
          if (d.pago) evPago += v;
        }
      });
      linhasEv += `
        <div class="balancete-reuniao">
          <span>${esc(ev.nome)}</span>
          <span>
            Total: <strong>${formatBRL(evTotal)}</strong> |
            Pago: <strong style="color:#0F766E">${formatBRL(evPago)}</strong> |
            Pendente: <strong style="color:#F59E0B">${formatBRL(evTotal-evPago)}</strong>
          </span>
        </div>`;
    });

    bloco.innerHTML = `
      <div class="balancete-grupo-header">${esc(g.nome)}</div>
      ${linhasEv || '<div class="balancete-reuniao"><span>Nenhum evento</span></div>'}
      <div class="balancete-total">
        <span>Total do Grupo</span><span>${formatBRL(totalG)}</span>
      </div>`;
    container.appendChild(bloco);
  });

  const orc = DB.getOrcamento(crAtual.id);
  const saldo = orc - totalCR;
  const resumo = document.createElement('div');
  resumo.className = 'balancete-resumo';
  resumo.innerHTML = `
    <div class="bal-row"><span>Orçamento Total</span><span style="color:#0F766E">${formatBRL(orc)}</span></div>
    <div class="bal-row"><span>Total Gasto</span><span style="color:#EF4444">${formatBRL(totalCR)}</span></div>
    <div class="bal-row"><span>Total Pago</span><span style="color:#0F766E">${formatBRL(pagoCR)}</span></div>
    <div class="bal-row bal-saldo"><span>Saldo</span><span style="color:${saldo>=0?'#0F766E':'#EF4444'}">${formatBRL(saldo)}</span></div>`;
  container.appendChild(resumo);
}

// ═══════════════════════════════════════════
// EXPORTAR EXCEL — GRUPO DETALHE
// ═══════════════════════════════════════════
function exportarGrupoExcel() {
  const eventos = DB.getEventos(grupoAtual.id);
  const itens = DB.getItensGrupo(grupoAtual.id);
  const cats = crAtual ? DB.getCategoriasDisponiveis(crAtual.id) : [];
  const data = [];

  // Linha 1: Header superior
  const h1 = ['','','','Orçamento','','',''];
  eventos.forEach(ev => { h1.push(ev.nome,'','',''); });
  data.push(h1);

  // Linha 2: Sub-header
  const h2 = ['Categoria','Descrição','Fornecedor','Valor Unitário','Quantidade','Vlr Total','Nr do Pedido'];
  eventos.forEach(() => { h2.push('Valor','Nr da NF','AS','Pago?'); });
  data.push(h2);

  // Dados
  itens.forEach(item => {
    const catNome = cats.find(c=>c.id===item.categoria)?.nome || item.categoria || '';
    const row = [catNome, item.descricao||'', item.fornecedor||'', item.vlrUnitario||'', item.qtd||'', item.vlrTotal||'', item.nrPedido||''];
    eventos.forEach(ev => {
      const d = (item.eventos&&item.eventos[ev.id]) || {};
      row.push(d.valor||'', d.nrNF||'', d.as?'✔':'', d.pago?'✔':'');
    });
    data.push(row);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Largura das colunas
  const totalCols = 7 + (eventos.length * 4);
  ws['!cols'] = Array.from({length:totalCols}, (_,i) => ({wch: i<3?22:14}));

  // Merges
  const merges = [{ s:{r:0,c:3}, e:{r:0,c:6} }];
  eventos.forEach((_,i) => {
    const sc = 7+(i*4);
    merges.push({ s:{r:0,c:sc}, e:{r:0,c:sc+3} });
  });
  ws['!merges'] = merges;

  const sheetName = grupoAtual.nome.substring(0,31).replace(/[\\\/\*\?\[\]]/g,'');
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${grupoAtual.nome}.xlsx`);
}

// ═══════════════════════════════════════════
// EXPORTAR EXCEL — BALANCETE
// ═══════════════════════════════════════════
function exportarBalanceteExcel() {
  const grupos = DB.getGrupos(crAtual.id);
  const data = [];

  data.push([`Balancete — ${crAtual.nome}`]);
  data.push([]);
  data.push(['Grupo','Eventos','Total','Pago','Pendente']);

  let totalCR = 0, pagoCR = 0;
  grupos.forEach(g => {
    const eventos = DB.getEventos(g.id);
    const itens = DB.getItensGrupo(g.id);
    let totalG = 0, pagoG = 0;
    itens.forEach(item => {
      eventos.forEach(ev => {
        const d = item.eventos&&item.eventos[ev.id];
        if (d) { const v=parseFloat(d.valor)||0; totalG+=v; if(d.pago) pagoG+=v; }
      });
    });
    totalCR += totalG;
    pagoCR += pagoG;
    data.push([g.nome, eventos.length, totalG, pagoG, totalG-pagoG]);
  });

  const orc = DB.getOrcamento(crAtual.id);
  data.push([]);
  data.push(['Orçamento Total','',orc,'','']);
  data.push(['Total Gasto','',totalCR,'','']);
  data.push(['Total Pago','',pagoCR,'','']);
  data.push(['Saldo','',orc-totalCR,'','']);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{wch:25},{wch:12},{wch:18},{wch:18},{wch:18}];
  ws['!merges'] = [{s:{r:0,c:0},e:{r:0,c:4}}];

  XLSX.utils.book_append_sheet(wb, ws, 'Balancete');
  XLSX.writeFile(wb, `Balancete_${crAtual.nome}.xlsx`);
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
  if (!nome) { alert('Informe o nome da categoria.'); return; }
  const cats = DB.getCategoriasPadrao();
  cats.push({ id:gerarId(), nome, ativo:true });
  DB.saveCategoriasPadrao(cats);
  document.getElementById('input-cat-padrao').value = '';
  fecharModal('modal-categoria-padrao');
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
  if (!nome) { alert('Informe o nome.'); return; }
  const extras = DB.getCategoriasExtrasCR(crIdModalCat);
  extras.push({ id:gerarId(), nome, ativo:true });
  DB.saveCategoriasExtrasCR(crIdModalCat, extras);
  document.getElementById('input-cat-cr').value = '';
  fecharModal('modal-categoria-cr');
  renderCategoriasCRs();
}

function togglePadraoNoCR(crId, catId) {
  const d = DB.getCategoriasDesativadasCR(crId);
  const i = d.indexOf(catId);
  if (i===-1) d.push(catId); else d.splice(i,1);
  DB.saveCategoriasDesativadasCR(crId, d);
}

function toggleCategoriaExtraCR(crId, catId) {
  DB.saveCategoriasExtrasCR(crId, DB.getCategoriasExtrasCR(crId).map(c => c.id===catId?{...c,ativo:!c.ativo}:c));
  renderCategoriasCRs();
}

function deletarCategoriaExtraCR(crId, catId) {
  if (!confirm('Remover esta categoria?')) return;
  DB.saveCategoriasExtrasCR(crId, DB.getCategoriasExtrasCR(crId).filter(c=>c.id!==catId));
  renderCategoriasCRs();
}

function renderCategoriasCRs() {
  const container = document.getElementById('lista-cat-crs');
  container.innerHTML = '';
  const crs = DB.getCRs();
  if (!crs.length) { container.innerHTML = '<p class="empty-msg">Nenhum CR criado ainda.</p>'; return; }
  crs.forEach(cr => {
    const bloco = document.createElement('div');
    bloco.className = 'config-cr-bloco';
    const titulo = document.createElement('div');
    titulo.className = 'config-cr-titulo';
    titulo.innerHTML = `<span>${esc(cr.nome)}</span><span class="cr-chevron">▼</span>`;
    const body = document.createElement('div');
    body.className = 'config-cr-body';
    body.innerHTML = buildBodyCategoriaCR(cr);
    titulo.addEventListener('click', () => {
      const isOpen = body.classList.contains('open');
      container.querySelectorAll('.config-cr-body').forEach(b=>b.classList.remove('open'));
      container.querySelectorAll('.config-cr-titulo').forEach(t=>t.classList.remove('open'));
      if (!isOpen) { body.classList.add('open'); titulo.classList.add('open'); }
    });
    bloco.appendChild(titulo);
    bloco.appendChild(body);
    container.appendChild(bloco);
  });
}

function buildBodyCategoriaCR(cr) {
  const extras = DB.getCategoriasExtrasCR(cr.id);
  const desativadas = DB.getCategoriasDesativadasCR(cr.id);
  const padrao = DB.getCategoriasPadrao().filter(c=>c.ativo);

  return `
    <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
      <button class="btn-add-cat-small" onclick="abrirModalCatCR('${cr.id}','${esc(cr.nome)}')">+ Adicionar</button>
    </div>
    <p style="font-size:11px;color:#a0aec0;margin-bottom:8px;font-weight:600;text-transform:uppercase;">Categorias Padrão</p>
    ${padrao.map(c=>`
      <div class="cat-item ${desativadas.includes(c.id)?'cat-inativo':''}">
        <span class="cat-nome">${esc(c.nome)}</span>
        <label class="toggle">
          <input type="checkbox" ${!desativadas.includes(c.id)?'checked':''} onchange="togglePadraoNoCR('${cr.id}','${c.id}')">
          <span class="toggle-slider"></span>
        </label>
      </div>`).join('')}
    ${extras.length?`
      <p style="font-size:11px;color:#a0aec0;margin:12px 0 8px;font-weight:600;text-transform:uppercase;">Exclusivas deste CR</p>
      ${extras.map(cat=>`
        <div class="cat-item ${!cat.ativo?'cat-inativo':''}">
          <span class="cat-nome">${esc(cat.nome)}</span>
          <div class="cat-acoes">
            <label class="toggle">
              <input type="checkbox" ${cat.ativo?'checked':''} onchange="toggleCategoriaExtraCR('${cr.id}','${cat.id}')">
              <span class="toggle-slider"></span>
            </label>
            <button class="btn-icon-danger" onclick="deletarCategoriaExtraCR('${cr.id}','${cat.id}')">Remover</button>
          </div>
        </div>`).join('')}`:''}`;
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  renderCRs();
});
