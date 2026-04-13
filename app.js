let crAtual = null;
let grupoAtual = null;
let reuniaoAtual = null;

// ======= NAVEGAÇÃO =======
function showTela(id) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

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
    lista.innerHTML = '<p class="empty-msg">Nenhum CR criado ainda. Clique em + Novo CR!</p>';
    return;
  }
  crs.forEach(cr => {
    const orcamento = DB.getOrcamento(cr.id);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-icon">📁</div>
      <h3>${cr.nome}</h3>
      <div class="card-label">Orçamento</div>
      <div class="total">${formatBRL(orcamento)}</div>
      <small class="card-hint">Clique para abrir</small>
      <button class="btn-delete" onclick="event.stopPropagation(); deletarCR('${cr.id}')">🗑️ Excluir</button>
    `;
    card.addEventListener('click', () => abrirCR(cr));
    lista.appendChild(card);
  });
}

function salvarCR() {
  const nome = document.getElementById('input-cr').value.trim();
  const orcamento = parseFloat(document.getElementById('input-cr-orcamento').value) || 0;
  if (!nome) return alert('Digite um nome!');
  const crs = DB.getCRs();
  const novoCR = { id: Date.now().toString(), nome };
  crs.push(novoCR);
  DB.saveCRs(crs);
  DB.saveOrcamento(novoCR.id, orcamento);
  document.getElementById('input-cr').value = '';
  document.getElementById('input-cr-orcamento').value = '';
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

// ======= ORÇAMENTO =======
function abrirEditarOrcamento() {
  document.getElementById('input-orcamento').value = DB.getOrcamento(crAtual.id) || '';
  abrirModal('modal-orcamento');
}

function salvarOrcamento() {
  const valor = parseFloat(document.getElementById('input-orcamento').value) || 0;
  DB.saveOrcamento(crAtual.id, valor);
  fecharModal('modal-orcamento');
  renderGrupos();
}

// ======= GRUPOS =======
function irParaGrupos() {
  grupoAtual = null; reuniaoAtual = null;
  renderGrupos(); showTela('tela-grupos'); updateBreadcrumb();
}

function renderGrupos() {
  const titulo = document.getElementById('titulo-grupos');
  titulo.textContent = crAtual ? crAtual.nome : 'Grupos';

  const lista = document.getElementById('lista-grupos');
  const grupos = DB.getGrupos(crAtual.id);
  lista.innerHTML = '';

  // Card de orçamento do CR
  const orcamento = DB.getOrcamento(crAtual.id);
  const totalGasto = calcTotalCR(crAtual.id);
  const saldo = orcamento - totalGasto;

  const resumoEl = document.createElement('div');
  resumoEl.className = 'resumo-cr';
  resumoEl.innerHTML = `
    <div class="resumo-item">
      <span class="resumo-label">Orçamento</span>
      <span class="resumo-valor">${formatBRL(orcamento)}</span>
    </div>
    <div class="resumo-divider"></div>
    <div class="resumo-item">
      <span class="resumo-label">Total Lançado</span>
      <span class="resumo-valor resumo-gasto">${formatBRL(totalGasto)}</span>
    </div>
    <div class="resumo-divider"></div>
    <div class="resumo-item">
      <span class="resumo-label">Saldo Disponível</span>
      <span class="resumo-valor ${saldo < 0 ? 'resumo-negativo' : 'resumo-saldo'}">${formatBRL(saldo)}</span>
    </div>
    <button class="btn-editar-orc" onclick="abrirEditarOrcamento()">✏️ Editar orçamento</button>
  `;
  lista.appendChild(resumoEl);

  if (grupos.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'empty-msg';
    msg.textContent = 'Nenhum grupo ainda. Clique em + Novo Grupo!';
    lista.appendChild(msg);
    return;
  }

  grupos.forEach(g => {
    const total = calcTotalGrupo(g.id);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-icon">👥</div>
      <h3>${g.nome}</h3>
      <div class="card-label">Total lançado</div>
      <div class="total">${formatBRL(total)}</div>
      <small class="card-hint">Clique para abrir</small>
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

function calcTotalCR(crId) {
  let total = 0;
  DB.getGrupos(crId).forEach(g => {
    DB.getReunioes(g.id).forEach(r => {
      DB.getItens(r.id).forEach(i => { total += parseFloat(i.vlrTotal) || 0; });
    });
  });
  return total;
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
  document.getElementById('titulo-reunioes').textContent = grupoAtual ? grupoAtual.nome : 'Reuniões';
  const lista = document.getElementById('lista-reunioes');
  const reunioes = DB.getReunioes(grupoAtual.id);
  lista.innerHTML = '';
  if (reunioes.length === 0) {
    lista.innerHTML = '<p class="empty-msg">Nenhuma reunião ainda. Clique em + Nova Reunião!</p>';
    return;
  }
  reunioes.forEach(r => {
    const itens = DB.getItens(r.id);
    const total = itens.reduce((s, i) => s + (parseFloat(i.vlrTotal) || 0), 0);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-icon">📅</div>
      <h3>${r.nome}</h3>
      <div class="card-label">Total</div>
      <div class="total">${formatBRL(total)}</div>
      <small class="card-hint">${itens.length} item(s)</small>
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
  document.getElementById('titulo-itens').textContent = reuniaoAtual ? reuniaoAtual.nome : 'Itens';
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
        <option value="Pago" ${item.pago === 'Pago' ? 'selected' : ''}>✅ Pago</option>
        <option value="Pendente" ${item.pago === 'Pendente' ? 'selected' : ''}>⏳ Pendente</option>
        <option value="A Realizar" ${item.pago === 'A Realizar' ? 'selected' : ''}>📋 A Realizar</option>
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
      pago: row.cells[10].querySelector('select').value,
    });
  });
  DB.saveItens(reuniaoAtual.id, itens);
  alert('✅ Salvo com sucesso!');
  irParaReunioes();
}

// ======= BALANCETE =======
function verBalancete() {
  renderBalancete();
  showTela('tela-balancete');
  updateBreadcrumb();
}

function renderBalancete() {
  document.getElementById('titulo-balancete').textContent = `Balancete — ${crAtual.nome}`;
  const container = document.getElementById('conteudo-balancete');

  const orcamento = DB.getOrcamento(crAtual.id);
  const grupos = DB.getGrupos(crAtual.id);

  // Coleta dados por grupo
  let totalPassivos = 0;
  let totalCirculantes = 0;

  const dadosGrupos = grupos.map(g => {
    let pagos = 0, pendentes = 0;
    const subItens = [];

    DB.getReunioes(g.id).forEach(r => {
      DB.getItens(r.id).forEach(i => {
        const val = parseFloat(i.vlrTotal) || 0;
        const pago = (i.pago || '').trim();
        if (pago === 'Pago') pagos += val;
        else if (pago === 'Pendente') pendentes += val;
      });
    });

    totalPassivos += pagos;
    totalCirculantes += pendentes;

    return { nome: g.nome, pagos, pendentes };
  });

  const saldo = orcamento - totalPassivos - totalCirculantes;

  // Monta o HTML do balancete
  let html = `
    <div class="balancete-wrapper">
      <table class="balancete-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Plano de Contas</th>
            <th colspan="2">Valor</th>
          </tr>
        </thead>
        <tbody>

          <!-- 1. ENTRADAS -->
          <tr class="bal-grupo-header">
            <td><strong>1.</strong></td>
            <td><strong>Entradas</strong></td>
            <td class="bal-valor-label">R$</td>
            <td class="bal-valor"><strong>${formatBRL(orcamento)}</strong></td>
          </tr>
          <tr class="bal-sub">
            <td>1.1</td>
            <td>CNI</td>
            <td class="bal-valor-label">R$</td>
            <td class="bal-valor">${formatBRL(orcamento)}</td>
          </tr>

          <!-- 2. PASSIVOS -->
          <tr class="bal-grupo-header">
            <td><strong>2.</strong></td>
            <td><strong>Passivos</strong></td>
            <td class="bal-valor-label">R$</td>
            <td class="bal-valor"><strong>${formatBRL(totalPassivos)}</strong></td>
          </tr>
  `;

  dadosGrupos.forEach((g, idx) => {
    const codigo = `2.${idx + 1}`;
    html += `
      <tr class="bal-grupo-sub-header">
        <td>${codigo}</td>
        <td>${g.nome}</td>
        <td class="bal-valor-label">R$</td>
        <td class="bal-valor">${g.pagos > 0 ? formatBRL(g.pagos) : '<span class="bal-zero">-</span>'}</td>
      </tr>
    `;
  });

  html += `
          <!-- 3. PASSIVOS CIRCULANTES -->
          <tr class="bal-grupo-header">
            <td><strong>3.</strong></td>
            <td><strong>Passivos Circulantes</strong></td>
            <td class="bal-valor-label">R$</td>
            <td class="bal-valor"><strong>${formatBRL(totalCirculantes)}</strong></td>
          </tr>
  `;

  dadosGrupos.forEach((g, idx) => {
    const codigo = `3.${idx + 1}`;
    html += `
      <tr class="bal-grupo-sub-header">
        <td>${codigo}</td>
        <td>${g.nome}</td>
        <td class="bal-valor-label">R$</td>
        <td class="bal-valor">${g.pendentes > 0 ? formatBRL(g.pendentes) : '<span class="bal-zero">-</span>'}</td>
      </tr>
    `;
  });

  html += `
          <!-- 4. SALDO -->
          <tr class="bal-saldo-row">
            <td><strong>4.</strong></td>
            <td><strong>Saldo Disponível</strong></td>
            <td class="bal-valor-label">R$</td>
            <td class="bal-valor bal-saldo-valor ${saldo < 0 ? 'bal-negativo' : ''}">
              <strong>${formatBRL(saldo)}</strong>
            </td>
          </tr>

        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
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
