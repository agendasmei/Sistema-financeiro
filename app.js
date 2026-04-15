// ======= CONFIGURAÇÕES — CRs COLAPSÁVEL =======
function renderCategoriasCRs() {
  const container = document.getElementById('lista-cat-crs');
  container.innerHTML = '';
  const crs = DB.getCRs();
  if (!crs.length) {
    container.innerHTML = '<p class="empty-msg">Nenhum CR criado ainda.</p>';
    return;
  }
  crs.forEach(cr => {
    const bloco = document.createElement('div');
    bloco.className = 'config-cr-bloco';

    const titulo = document.createElement('div');
    titulo.className = 'config-cr-titulo';
    titulo.innerHTML = `
      <span>${cr.nome}</span>
      <span class="cr-chevron">▼</span>`;

    const body = document.createElement('div');
    body.className = 'config-cr-body';
    body.innerHTML = buildBodyCategoriaCR(cr);

    titulo.addEventListener('click', () => {
      const isOpen = body.classList.contains('open');
      // Fecha todos
      container.querySelectorAll('.config-cr-body').forEach(b => b.classList.remove('open'));
      container.querySelectorAll('.config-cr-titulo').forEach(t => t.classList.remove('open'));
      if (!isOpen) {
        body.classList.add('open');
        titulo.classList.add('open');
      }
    });

    bloco.appendChild(titulo);
    bloco.appendChild(body);
    container.appendChild(bloco);
  });
}

function buildBodyCategoriaCR(cr) {
  const extras = DB.getCategoriasExtrasCR(cr.id);
  const desativadas = DB.getCategoriasDesativadasCR(cr.id);
  const padrao = DB.getCategoriasPadrao().filter(c => c.ativo);

  return `
    <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
      <button class="btn-add-cat-small" onclick="abrirModalCatCR('${cr.id}','${cr.nome}')">+ Adicionar</button>
    </div>
    <p style="font-size:11px;color:#a0aec0;margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Categorias Padrao</p>
    ${padrao.map(c => `
      <div class="cat-item ${desativadas.includes(c.id) ? 'cat-inativo' : ''}">
        <span class="cat-nome">${c.nome}</span>
        <label class="toggle">
          <input type="checkbox" ${!desativadas.includes(c.id) ? 'checked' : ''} onchange="togglePadraoNoCR('${cr.id}','${c.id}')">
          <span class="toggle-slider"></span>
        </label>
      </div>`).join('')}
    ${extras.length ? `
      <p style="font-size:11px;color:#a0aec0;margin:12px 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Exclusivas deste CR</p>
      ${extras.map(cat => `
        <div class="cat-item ${!cat.ativo ? 'cat-inativo' : ''}">
          <span class="cat-nome">${cat.nome}</span>
          <div class="cat-acoes">
            <label class="toggle">
              <input type="checkbox" ${cat.ativo ? 'checked' : ''} onchange="toggleCategoriaExtraCR('${cr.id}','${cat.id}')">
              <span class="toggle-slider"></span>
            </label>
            <button class="btn-icon-danger" onclick="deletarCategoriaExtraCR('${cr.id}','${cat.id}')">Remover</button>
          </div>
        </div>`).join('')}` : ''}`;
}

// ======= ITENS — com seção Orçamento + Custo Reunião =======
function renderItens() {
  const nomeReuniao = reuniaoAtual ? reuniaoAtual.nome : 'Reunião';
  document.getElementById('titulo-itens').textContent = nomeReuniao;
  document.getElementById('secao-custo-nome').textContent = `Custo — ${nomeReuniao}`;

  const tbodyOrc = document.getElementById('tbody-orcamento');
  const tbodyItens = document.getElementById('tbody-itens');
  tbodyOrc.innerHTML = '';
  tbodyItens.innerHTML = '';

  DB.getItens(reuniaoAtual.id).forEach(item => {
    if (item.secao === 'orcamento') addItemRowOrcamento(item);
    else addItemRow(item);
  });

  updateTotalItens();
}

function addItemOrcamento() { addItemRowOrcamento({}); }

function addItemRowOrcamento(item = {}) {
  const tbody = document.getElementById('tbody-orcamento');
  const tr = document.createElement('tr');
  tr.dataset.secao = 'orcamento';

  tr.innerHTML = `
    <td>
      <select class="select-categoria">${buildCategoriasOptions(item.categoria || '')}</select>
    </td>
    <td><input type="text" value="${esc(item.descricao||'')}" placeholder="Descricao"></td>
    <td><input type="text" value="${esc(item.fornecedor||'')}" placeholder="Fornecedor"></td>
    <td><input type="number" value="${item.vlrUnitario||''}" placeholder="0,00" oninput="calcLinhaOrc(this)"></td>
    <td><input type="number" value="${item.qtd||''}" placeholder="1" oninput="calcLinhaOrc(this)"></td>
    <td><input type="number" value="${item.vlrTotal||''}" placeholder="0,00" oninput="updateTotalItens()"></td>
    <td><button class="btn-del-row" onclick="pedirConfirmacaoRemover(this)" title="Remover">🗑️</button></td>
  `;
  tbody.appendChild(tr);
  updateTotalItens();
}

function calcLinhaOrc(input) {
  const row = input.closest('tr');
  const u = parseFloat(row.cells[3].querySelector('input').value) || 0;
  const q = parseFloat(row.cells[4].querySelector('input').value) || 0;
  if (u > 0 || q > 0) row.cells[5].querySelector('input').value = (u * q).toFixed(2);
  updateTotalItens();
}

function addItem() { addItemRow({}); }

function addItemRow(item = {}) {
  const tbody = document.getElementById('tbody-itens');
  const tr = document.createElement('tr');
  tr.dataset.secao     = 'custo';
  tr.dataset.pedidoNum  = item.pedidoNum  || '';
  tr.dataset.pedidoLink = item.pedidoLink || '';
  tr.dataset.nfNum      = item.nfNum      || '';
  tr.dataset.nfLink     = item.nfLink     || '';

  tr.innerHTML = `
    <td>
      <select class="select-categoria">${buildCategoriasOptions(item.categoria || '')}</select>
    </td>
    <td><input type="text" value="${esc(item.descricao||'')}" placeholder="Descricao"></td>
    <td><input type="text" value="${esc(item.fornecedor||'')}" placeholder="Fornecedor"></td>
    <td><input type="number" value="${item.vlrUnitario||''}" placeholder="0,00" oninput="calcLinha(this)"></td>
    <td><input type="number" value="${item.qtd||''}" placeholder="1" oninput="calcLinha(this)"></td>
    <td><input type="number" value="${item.vlrTotal||''}" placeholder="0,00" oninput="updateTotalItens()"></td>
    <td><input type="number" value="${item.vlrReuniao||''}" placeholder="0,00" oninput="updateTotalItens()"></td>
    <td class="td-link"></td>
    <td class="td-link-nf"></td>
    <td class="check-cell"><input type="checkbox" ${item.as?'checked':''}></td>
    <td class="check-cell"><input type="checkbox" ${item.pago?'checked':''} onchange="updateTotalItens()"></td>
    <td><button class="btn-del-row" onclick="pedirConfirmacaoRemover(this)" title="Remover item">🗑️</button></td>
  `;
  tbody.appendChild(tr);

  renderLinkCell(tr, 'pedido');
  renderLinkCell(tr, 'nf');
  updateTotalItens();
}

function calcLinha(input) {
  const row = input.closest('tr');
  const u = parseFloat(row.cells[3].querySelector('input').value) || 0;
  const q = parseFloat(row.cells[4].querySelector('input').value) || 0;
  if (u > 0 || q > 0) row.cells[5].querySelector('input').value = (u * q).toFixed(2);
  updateTotalItens();
}

function updateTotalItens() {
  let total = 0, pago = 0, pendente = 0, totalOrc = 0, totalVlrReuniao = 0;

  // Orçamento
  document.querySelectorAll('#tbody-orcamento tr').forEach(row => {
    const vlr = parseFloat(row.cells[5].querySelector('input').value) || 0;
    totalOrc += vlr;
    total += vlr;
  });

  // Custo reunião
  document.querySelectorAll('#tbody-itens tr').forEach(row => {
    const vlr = parseFloat(row.cells[5].querySelector('input').value) || 0;
    const vlrReuniao = parseFloat(row.cells[6].querySelector('input').value) || 0;
    const isPago = row.cells[10].querySelector('input').checked;
    total += vlr;
    totalVlrReuniao += vlrReuniao;
    if (isPago) pago += vlr; else pendente += vlr;
  });

  document.getElementById('total-orcamento').textContent        = formatBRL(totalOrc);
  document.getElementById('total-itens').textContent            = formatBRL(total);
  document.getElementById('total-vlr-reuniao').textContent      = formatBRL(totalVlrReuniao);
  document.getElementById('total-reuniao-topo').textContent     = formatBRL(total);
  document.getElementById('total-apagar-topo').textContent      = formatBRL(pendente);
  document.getElementById('total-pago-topo').textContent        = formatBRL(pago);
  document.getElementById('total-pendente-topo').textContent    = formatBRL(pendente);
}

function salvarItens() {
  const itens = [];

  // Orçamento
  document.querySelectorAll('#tbody-orcamento tr').forEach(row => {
    itens.push({
      secao:       'orcamento',
      categoria:   row.cells[0].querySelector('select').value,
      descricao:   row.cells[1].querySelector('input').value,
      fornecedor:  row.cells[2].querySelector('input').value,
      vlrUnitario: row.cells[3].querySelector('input').value,
      qtd:         row.cells[4].querySelector('input').value,
      vlrTotal:    row.cells[5].querySelector('input').value,
    });
  });

  // Custo reunião
  document.querySelectorAll('#tbody-itens tr').forEach(row => {
    itens.push({
      secao:       'custo',
      categoria:   row.cells[0].querySelector('select').value,
      descricao:   row.cells[1].querySelector('input').value,
      fornecedor:  row.cells[2].querySelector('input').value,
      vlrUnitario: row.cells[3].querySelector('input').value,
      qtd:         row.cells[4].querySelector('input').value,
      vlrTotal:    row.cells[5].querySelector('input').value,
      vlrReuniao:  row.cells[6].querySelector('input').value,
      pedidoNum:   row.dataset.pedidoNum  || '',
      pedidoLink:  row.dataset.pedidoLink || '',
      nfNum:       row.dataset.nfNum      || '',
      nfLink:      row.dataset.nfLink     || '',
      as:          row.cells[9].querySelector('input').checked,
      pago:        row.cells[10].querySelector('input').checked,
    });
  });

  DB.saveItens(reuniaoAtual.id, itens);
  alert('Salvo com sucesso!');
  voltarTela();
}
