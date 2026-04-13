let crAtual = null;
let grupoAtual = null;
let reuniaoAtual = null;

// NAVEGAÇÃO
function showTela(id) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// BREADCRUMB
function updateBreadcrumb() {
  const bc = document.getElementById('breadcrumb');
  let html = `<span onclick="irParaCRs()">🏠 Início</span>`;
  if (crAtual) html += ` › <span onclick="irParaGrupos()">${crAtual.nome}</span>`;
  if (grupoAtual) html += ` › <span onclick="irParaReunioes()">${grupoAtual.nome}</span>`;
  if (reuniaoAtual) html += ` › ${reuniaoAtual.nome}`;
  bc.innerHTML = html;
}

// ======= CRs =======
function irParaCRs() {
  crAtual = null; grupoAtual = null; reuniaoAtual = null;
  renderCRs(); showTela('tela-crs'); updateBreadcrumb();
}

function renderCRs() {
  const lista = document.getElementById('lista-crs');
  const crs = DB.getCRs();
  lista.innerHTML = '';
  if (crs.length === 0) {
    lista.innerHTML = '<p style="color:#718096">Nenhum CR criado ainda. Clique em + Novo CR!</p>';
    return;
  }
  crs.forEach(cr => {
    const total = calcTotalCR(cr.id);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>📁 ${cr.nome}</h3>
      <div class="total">${formatBRL(total)}</div>
      <small style="color:#718096">Clique para abrir</small>
      <button class="btn-delete" onclick="event.stopPropagation(); deletarCR('${cr.id}')">🗑️ Excluir</button>
    `;
    card.addEventListener('click', () => abrirCR(cr));
    lista.appendChild(card);
  });
}

function salvarCR() {
  const nome = document.getElementById('input-cr').value.trim();
  if (!nome) return alert('Digite um nome!');
  const crs = DB.getCRs();
  crs.push({ id: Date.now().toString(), nome });
  DB.saveCRs(crs);
  document.getElementById('input-cr').value = '';
  fecharModal('modal-cr');
  renderCRs();
}

function abrirCR(cr) {
  crAtual = cr; grupoAtual = null; reuniaoAtual = null;
  renderGrupos(); showTela('tela-grupos'); updateBreadcrumb();
}

function deletarCR(id) {
  if (!confirm('Excluir este CR?')) return;
  DB.saveCRs(DB.getCRs().filter(c => c.id !== id));
  renderCRs();
}

function calcTotalCR(crId) {
  let total = 0;
  DB.getGrupos(crId).forEach(g => {
    DB.getReunioes(g.id).forEach(r => {
      DB.getItens(r.id).forEach(i => { total += parseFloat(i.vlrTotal) || 0; });
    });
  });
  return total;
}

// ======= GRUPOS =======
function irParaGrupos() {
  grupoAtual = null; reuniaoAtual = null;
  renderGrupos(); showTela('tela-grupos'); updateBreadcrumb();
}

function renderGrupos() {
  const lista = document.getElementById('lista-grupos');
  const grupos = DB.getGrupos(crAtual.id);
  lista.innerHTML = '';
  if (grupos.length === 0) {
    lista.innerHTML = '<p style="color:#718096">Nenhum grupo ainda. Clique em + Novo Grupo!</p>';
    return;
  }
  grupos.forEach(g => {
    const total = calcTotalGrupo(g.id);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>👥 ${g.nome}</h3>
      <div class="total">${formatBRL(total)}</div>
      <small style="color:#718096">Clique para abrir</small>
      <button class="btn-delete" onclick="event.stopPropagation(); deletarGrupo('${g.id}')">🗑️ Excluir</button>
    `;
    card.addEventListener('click', () => abrirGrupo(g));
    lista.appendChild(card);
  });
}

function salvarGrupo() {
  const nome = document.getElementById('input-grupo').value.trim();
  if (!nome) return alert('Digite um nome!');
  const grupos = DB.getGrupos(crAtual.id);
  grupos.push({ id: Date.now().toString(), nome });
  DB.saveGrupos(crAtual.id, grupos);
  document.getElementById('input-grupo').value = '';
  fecharModal('modal-grupo');
  renderGrupos();
}

function abrirGrupo(g) {
  grupoAtual = g; reuniaoAtual = null;
  renderReunioes(); showTela('tela-reunioes'); updateBreadcrumb();
}

function deletarGrupo(id) {
  if (!confirm('Excluir este grupo?')) return;
  DB.saveGrupos(crAtual.id, DB.getGrupos(crAtual.id).filter(g => g.id !== id));
  renderGrupos();
}

function calcTotalGrupo(grupoId) {
  let total = 0;
  DB.getReunioes(grupoId).forEach(r => {
    DB.getItens(r.id).forEach(i => { total += parseFloat(i.vlrTotal) || 0; });
  });
  return total;
}

// ======= REUNIÕES =======
function irParaReunioes() {
  reuniaoAtual = null;
  renderReunioes(); showTela('tela-reunioes'); updateBreadcrumb();
}

function renderReunioes() {
  const lista = document.getElementById('lista-reunioes');
  const reunioes = DB.getReunioes(grupoAtual.id);
  lista.innerHTML = '';
  if (reunioes.length === 0) {
    lista.innerHTML = '<p style="color:#718096">Nenhuma reunião ainda. Clique em + Nova Reunião!</p>';
    return;
  }
  reunioes.forEach(r => {
    const itens = DB.getItens(r.id);
    const total = itens.reduce((s, i) => s + (parseFloat(i.vlrTotal) || 0), 0);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>📅 ${r.nome}</h3>
      <div class="total">${formatBRL(total)}</div>
      <small style="color:#718096">${itens.length} item(s)</small>
      <button class="btn-delete" onclick="event.stopPropagation(); deletarReuniao('${r.id}')">🗑️ Excluir</button>
    `;
    card.addEventListener('click', () => abrirReuniao(r));
    lista.appendChild(card);
  });
}

function salvarReuniao() {
  const nome = document.getElementById('input-reuniao').value.trim();
  if (!nome) return alert('Digite um nome!');
  const reunioes = DB.getReunioes(grupoAtual.id);
  reunioes.push({ id: Date.now().toString(), nome });
  DB.saveReunioes(grupoAtual.id, reunioes);
  document.getElementById('input-reuniao').value = '';
  fecharModal('modal-reuniao');
  renderReunioes();
}

function abrirReuniao(r) {
  reuniaoAtual = r;
  renderItens(); showTela('tela-itens'); updateBreadcrumb();
}

function deletarReuniao(id) {
  if (!confirm('Excluir esta reunião?')) return;
  DB.saveReunioes(grupoAtual.id, DB.getReunioes(grupoAtual.id).filter(r => r.id !== id));
  renderReunioes();
}

// ======= ITENS =======
function renderItens() {
  const tbody = document.getElementById('tbody-itens');
  tbody.innerHTML = '';
  DB.getItens(reuniaoAtual.id).forEach(item => addItemRow(item));
  updateTotalItens();
}

function addItem() { addItemRow({}); }

function addItemRow(item = {}) {
  const tbody = document.getElementById('tbody-itens');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" value="${item.descricao || ''}" placeholder="Descrição"></td>
    <td><input type="text" value="${item.fornecedorCotado || ''}" placeholder="Fornecedor cotado"></td>
    <td><input type="number" value="${item.vlrUnitario || ''}" placeholder="0,00" oninput="calcLinha(this)"></td>
    <td><input type="number" value="${item.qtd || ''}" placeholder="1" oninput="calcLinha(this)"></td>
    <td><input type="number" value="${item.vlrTotal || ''}" placeholder="0,00" readonly></td>
    <td>
      <select>
        <option ${item.aprovado === 'Sim' ? 'selected' : ''}>✅ Sim</option>
        <option ${item.aprovado === 'Não' ? 'selected' : ''}>❌ Não</option>
      </select>
    </td>
    <td><input type="text" value="${item.numPedido || ''}" placeholder="Nº Pedido"></td>
    <td><input type="text" value="${item.fornecedorContratado || ''}" placeholder="Fornecedor contratado"></td>
    <td><input type="text" value="${item.numNF || ''}" placeholder="Nº NF"></td>
    <td style="text-align:center"><input type="checkbox" ${item.as ? 'checked' : ''}></td>
    <td>
      <select>
        <option ${item.pago === 'Pago' ? 'selected' : ''}>✅ Pago</option>
        <option ${item.pago === 'Pendente' ? 'selected' : ''}>⏳ Pendente</option>
        <option ${item.pago === 'A Realizar' ? 'selected' : ''}>📋 A Realizar</option>
      </select>
    </td>
    <td><button class="btn-remove" onclick="removeRow(this)">🗑️</button></td>
  `;
  tbody.appendChild(tr);
  updateTotalItens();
}

function calcLinha(input) {
  const row = input.closest('tr');
  const vlrUnit = parseFloat(row.cells[2].querySelector('input').value) || 0;
  const qtd = parseFloat(row.cells[3].querySelector('input').value) || 0;
  row.cells[4].querySelector('input').value = (vlrUnit * qtd).toFixed(2);
  updateTotalItens();
}

function removeRow(btn) {
  btn.closest('tr').remove();
  updateTotalItens();
}

function updateTotalItens() {
  let total = 0;
  document.querySelectorAll('#tbody-itens tr').forEach(row => {
    total += parseFloat(row.cells[4].querySelector('input').value) || 0;
  });
  document.getElementById('total-itens').textContent = formatBRL(total);
}

function salvarItens() {
  const rows = document.querySelectorAll('#tbody-itens tr');
  const itens = [];
  rows.forEach(row => {
    itens.push({
      descricao: row.cells[0].querySelector('input').value,
      fornecedorCotado: row.cells[1].querySelector('input').value,
      vlrUnitario: row.cells[2].querySelector('input').value,
      qtd: row.cells[3].querySelector('input').value,
      vlrTotal: row.cells[4].querySelector('input').value,
      aprovado: row.cells[5].querySelector('select').value.replace(/✅|❌/g, '').trim(),
      numPedido: row.cells[6].querySelector('input').value,
      fornecedorContratado: row.cells[7].querySelector('input').value,
      numNF: row.cells[8].querySelector('input').value,
      as: row.cells[9].querySelector('input').checked,
      pago: row.cells[10].querySelector('select').value.replace(/✅|⏳|📋/g, '').trim(),
    });
  });
  DB.saveItens(reuniaoAtual.id, itens);
  alert('✅ Salvo com sucesso!');
  irParaReunioes();
}

// ======= MODAIS =======
function abrirModal(id) { document.getElementById(id).classList.add('open'); }
function fecharModal(id) { document.getElementById(id).classList.remove('open'); }

// ======= UTILITÁRIOS =======
function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// INICIAR
irParaCRs();
