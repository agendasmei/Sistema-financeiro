let crAtual = null;
let grupoAtual = null;
let reuniaoAtual = null;
let telaAnteriorConfig = null;
let crConfigAtual = null;
let modalLinkCampo = null;
let modalLinkRow = null;
let rowParaRemover = null;

// Histórico de navegação para o botão Voltar
const historicoTelas = [];

function showTela(id) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const btn = document.getElementById('btn-voltar');
  btn.style.display = historicoTelas.length > 0 ? 'inline-block' : 'none';
}

function navegarPara(id) {
  const atual = document.querySelector('.tela.active');
  if (atual && atual.id !== id) historicoTelas.push(atual.id);
  showTela(id);
}

function voltarTela() {
  if (historicoTelas.length === 0) return;
  const anterior = historicoTelas.pop();
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('active'));
  document.getElementById(anterior).classList.add('active');
  const btn = document.getElementById('btn-voltar');
  btn.style.display = historicoTelas.length > 0 ? 'inline-block' : 'none';
}

// ======= CONFIGURAÇÕES =======
function abrirConfiguracoes() {
  telaAnteriorConfig = document.querySelector('.tela.active')?.id || 'tela-crs';
  renderConfiguracoes();
  navegarPara('tela-config');
}

function voltarDeConfig() {
  showTela(telaAnteriorConfig || 'tela-crs');
  historicoTelas.length = 0;
  document.getElementById('btn-voltar').style.display = 'none';
}

function renderConfiguracoes() {
  renderCategoriasPadrao();
  renderCategoriasCRs();
}

function renderCategoriasPadrao() {
  const lista = document.getElementById('lista-cat-padrao');
  lista.innerHTML = '';
  DB.getCategoriasPadrao().forEach(cat => {
    const div = document.createElement('div');
    div.className = `cat-item ${!cat.ativo ? 'cat-inativo' : ''}`;
    div.innerHTML = `
      <span class="cat-nome">${cat.nome}</span>
      <div class="cat-acoes">
        <label class="toggle">
          <input type="checkbox" ${cat.ativo ? 'checked' : ''} onchange="toggleCategoriaPadrao('${cat.id}')">
          <span class="toggle-slider"></span>
        </label>
        <button class="btn-icon-danger" onclick="deletarCategoriaPadrao('${cat.id}')">Remover</button>
      </div>`;
    lista.appendChild(div);
  });
}

function renderCategoriasCRs() {
  const container = document.getElementById('lista-cat-crs');
  container.innerHTML = '';
  const crs = DB.getCRs();
  if (!crs.length) { container.innerHTML = '<p class="empty-msg">Nenhum CR criado ainda.</p>'; return; }
  crs.forEach(cr => {
    const extras = DB.getCategoriasExtrasCR(cr.id);
    const desativadas = DB.getCategoriasDesativadasCR(cr.id);
    const padrao = DB.getCategoriasPadrao().filter(c => c.ativo);
    const section = document.createElement('div');
    section.className = 'config-grupo-bloco';
    section.innerHTML = `
      <div class="config-grupo-titulo">
        <span>${cr.nome}</span>
        <button class="btn-add-cat-small" onclick="abrirModalCatCR('${cr.id}','${cr.nome}')">+ Adicionar</button>
      </div>
      <div style="padding:12px 16px;">
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
            </div>`).join('')}` : ''}
      </div>`;
    container.appendChild(section);
  });
}

function salvarCategoriaPadrao() {
  const nome = document.getElementById('input-cat-padrao').value.trim();
  if (!nome) return alert('Digite um nome!');
  const cats = DB.getCategoriasPadrao();
  cats.push({ id: 'cat_' + Date.now(), nome, ativo: true });
  DB.saveCategoriasPadrao(cats);
  document.getElementById('input-cat-padrao').value = '';
  fecharModal('modal-categoria-padrao');
  renderCategoriasPadrao();
}

function toggleCategoriaPadrao(id) {
  const cats = DB.getCategoriasPadrao();
  const cat = cats.find(c => c.id === id);
  if (cat) cat.ativo = !cat.ativo;
  DB.saveCategoriasPadrao(cats);
  renderCategoriasPadrao();
}

function deletarCategoriaPadrao(id) {
  if (!confirm('Remover esta categoria padrao?')) return;
  DB.saveCategoriasPadrao(DB.getCategoriasPadrao().filter(c => c.id !== id));
  renderCategoriasPadrao();
}

function togglePadraoNoCR(crId, catId) {
  const d = DB.getCategoriasDesativadasCR(crId);
  const idx = d.indexOf(catId);
  if (idx >= 0) d.splice(idx, 1); else d.push(catId);
  DB.saveCategoriasDesativadasCR(crId, d);
  renderCategoriasCRs();
}

function abrirModalCatCR(crId, crNome) {
  crConfigAtual = crId;
  document.getElementById('titulo-modal-cat-cr').textContent = `Nova Categoria — ${crNome}`;
  document.getElementById('input-cat-cr').value = '';
  abrirModal('modal-categoria-cr');
}

function salvarCategoriaCR() {
  const nome = document.getElementById('input-cat-cr').value.trim();
  if (!nome) return alert('Digite um nome!');
  const cats = DB.getCategoriasExtrasCR(crConfigAtual);
  cats.push({ id: 'catcr_' + Date.now(), nome, ativo: true });
  DB.saveCategoriasExtrasCR(crConfigAtual, cats);
  document.getElementById('input-cat-cr').value = '';
  fecharModal('modal-categoria-cr');
  renderCategoriasCRs();
}

function toggleCategoriaExtraCR(crId, catId) {
  const cats = DB.getCategoriasExtrasCR(crId);
  const cat = cats.find(c => c.id === catId);
  if (cat) cat.ativo = !cat.ativo;
  DB.saveCategoriasExtrasCR(crId, cats);
  renderCategoriasCRs();
}

function deletarCategoriaExtraCR(crId, catId) {
  if (!confirm('Remover esta categoria?')) return;
  DB.saveCategoriasExtrasCR(crId, DB.getCategoriasExtrasCR(crId).filter(c => c.id !== catId));
  renderCategoriasCRs();
}

// ======= CRs =======
function irParaCRs() {
  crAtual = null; grupoAtual = null; reuniaoAtual = null;
  historicoTelas.length = 0;
  document.getElementById('btn-voltar').style.display = 'none';
  renderCRs(); showTela('tela-crs');
}

function renderCRs() {
  const lista = document.getElementById('lista-crs');
  const crs = DB.getCRs();
  lista.innerHTML = '';
  if (!crs.length) { lista.innerHTML = '<p class="empty-msg">Nenhum CR criado ainda. Clique em + Novo CR!</p>'; return; }
  crs.forEach(cr => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${cr.nome}</h3>
      <div class="card-label">Orcamento</div>
      <div class="total">${formatBRL(DB.getOrcamento(cr.id))}</div>
      <small class="card-hint">Clique para abrir</small>
      <button class="btn-delete" onclick="event.stopPropagation();deletarCR('${cr.id}')">Excluir</button>`;
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
  renderGrupos(); navegarPara('tela-grupos');
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
  DB.saveOrcamento(crAtual.id, parseFloat(document.getElementById('input-orcamento').value) || 0);
  fecharModal('modal-orcamento');
  renderGrupos();
}

// ======= GRUPOS =======
function irParaGrupos() {
  grupoAtual = null; reuniaoAtual = null;
  renderGrupos(); navegarPara('tela-grupos');
}

function renderGrupos() {
  document.getElementById('titulo-grupos').textContent = crAtual ? crAtual.nome : 'Grupos';
  const lista = document.getElementById('lista-grupos');
  lista.innerHTML = '';
  const orcamento = DB.getOrcamento(crAtual.id);
  const totalGasto = calcTotalCR(crAtual.id);
  const saldo = orcamento - totalGasto;
  const resumoEl = document.createElement('div');
  resumoEl.className = 'resumo-cr';
  resumoEl.innerHTML = `
    <div class="resumo-item"><span class="resumo-label">Orcamento</span><span class="resumo-valor">${formatBRL(orcamento)}</span></div>
    <div class="resumo-divider"></div>
    <div class="resumo-item"><span class="resumo-label">Total Lancado</span><span class="resumo-valor resumo-gasto">${formatBRL(totalGasto)}</span></div>
    <div class="resumo-divider"></div>
    <div class="resumo-item"><span class="resumo-label">Saldo Disponivel</span><span class="resumo-valor ${saldo < 0 ? 'resumo-negativo' : 'resumo-saldo'}">${formatBRL(saldo)}</span></div>
    <button class="btn-editar-orc" onclick="abrirEditarOrcamento()">Editar orcamento</button>`;
  lista.appendChild(resumoEl);
  const grupos = DB.getGrupos(crAtual.id);
  if (!grupos.length) {
    const msg = document.createElement('p');
    msg.className = 'empty-msg';
    msg.textContent = 'Nenhum grupo ainda. Clique em + Novo Grupo!';
    lista.appendChild(msg);
    return;
  }
  grupos.forEach(g => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${g.nome}</h3>
      <div class="card-label">Total lancado</div>
      <div class="total">${formatBRL(calcTotalGrupo(g.id))}</div>
      <small class="card-hint">Clique para abrir</small>
      <button class="btn-delete" onclick="event.stopPropagation();deletarGrupo('${g.id}')">Excluir</button>`;
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
  renderReunioes(); navegarPara('tela-reunioes');
}

function deletarGrupo(id) {
  if (!confirm('Excluir este grupo?')) return;
  DB.saveGrupos(crAtual.id, DB.getGrupos(crAtual.id).filter(g => g.id !== id));
  renderGrupos();
}

function calcTotalCR(crId) {
  let t = 0;
  DB.getGrupos(crId).forEach(g => DB.getReunioes(g.id).forEach(r => DB.getItens(r.id).forEach(i => { t += parseFloat(i.vlrTotal) || 0; })));
  return t;
}

function calcTotalGrupo(grupoId) {
  let t = 0;
  DB.getReunioes(grupoId).forEach(r => DB.getItens(r.id).forEach(i => { t += parseFloat(i.vlrTotal) || 0; }));
  return t;
}

// ======= REUNIÕES =======
function irParaReunioes() {
  reuniaoAtual = null;
  renderReunioes(); navegarPara('tela-reunioes');
}

function renderReunioes() {
  document.getElementById('titulo-reunioes').textContent = grupoAtual ? grupoAtual.nome : 'Reunioes';
  const lista = document.getElementById('lista-reunioes');
  lista.innerHTML = '';
  const reunioes = DB.getReunioes(grupoAtual.id);
  if (!reunioes.length) { lista.innerHTML = '<p class="empty-msg">Nenhuma reuniao ainda. Clique em + Nova Reuniao!</p>'; return; }
  reunioes.forEach(r => {
    const itens = DB.getItens(r.id);
    const total = itens.reduce((s, i) => s + (parseFloat(i.vlrTotal) || 0), 0);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${r.nome}</h3>
      <div class="card-label">Total</div>
      <div class="total">${formatBRL(total)}</div>
      <small class="card-hint">${itens.length} item(s)</small>
      <button class="btn-delete" onclick="event.stopPropagation();deletarReuniao('${r.id}')">Excluir</button>`;
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
  renderItens(); navegarPara('tela-itens');
}

function deletarReuniao(id) {
  if (!confirm('Excluir esta reuniao?')) return;
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

function buildCategoriasOptions(sel) {
  const cats = DB.getCategoriasDisponiveis(crAtual.id);
  return `<option value="">Selecione...</option>` +
    cats.map(c => `<option value="${c.nome}" ${c.nome === sel ? 'selected' : ''}>${c.nome}</option>`).join('');
}

function addItemRow(item = {}) {
  const tbody = document.getElementById('tbody-itens');
  const tr = document.createElement('tr');
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

function renderLinkCell(tr, campo) {
  const num  = campo === 'pedido' ? tr.dataset.pedidoNum  : tr.dataset.nfNum;
  const link = campo === 'pedido' ? tr.dataset.pedidoLink : tr.dataset.nfLink;
  const tdClass = campo === 'pedido' ? 'td-link' : 'td-link-nf';
  const td = tr.querySelector(`.${tdClass}`);

  if (num) {
    td.innerHTML = link
      ? `<a class="link-externo" href="${esc(link)}" target="_blank">${esc(num)} ↗</a>`
      : `<span style="font-size:12px;font-weight:600;color:#2d3748;">${esc(num)}</span>`;
    const span = td.querySelector('a, span');
    span.style.cursor = 'pointer';
    span.addEventListener('click', (e) => { if (!link) { e.preventDefault(); } abrirModalLink(tr, campo); });
  } else {
    const btn = document.createElement('button');
    btn.className = 'btn-link-cell';
    btn.textContent = '+ Adicionar';
    btn.addEventListener('click', () => abrirModalLink(tr, campo));
    td.innerHTML = '';
    td.appendChild(btn);
  }
}

function abrirModalLink(tr, campo) {
  modalLinkRow   = tr;
  modalLinkCampo = campo;
  document.getElementById('titulo-modal-link').textContent = campo === 'pedido' ? 'Nr do Pedido' : 'Nr da Nota Fiscal';
  document.getElementById('input-link-numero').value = campo === 'pedido' ? tr.dataset.pedidoNum : tr.dataset.nfNum;
  document.getElementById('input-link-url').value    = campo === 'pedido' ? tr.dataset.pedidoLink : tr.dataset.nfLink;
  abrirModal('modal-link');
}

function salvarLink() {
  const num  = document.getElementById('input-link-numero').value.trim();
  const link = document.getElementById('input-link-url').value.trim();
  if (modalLinkCampo === 'pedido') { modalLinkRow.dataset.pedidoNum = num; modalLinkRow.dataset.pedidoLink = link; }
  else { modalLinkRow.dataset.nfNum = num; modalLinkRow.dataset.nfLink = link; }
  renderLinkCell(modalLinkRow, modalLinkCampo);
  fecharModal('modal-link');
}

function calcLinha(input) {
  const row = input.closest('tr');
  const u = parseFloat(row.cells[3].querySelector('input').value) || 0;
  const q = parseFloat(row.cells[4].querySelector('input').value) || 0;
  if (u > 0 || q > 0) row.cells[5].querySelector('input').value = (u * q).toFixed(2);
  updateTotalItens();
}

function pedirConfirmacaoRemover(btn) {
  rowParaRemover = btn.closest('tr');
  abrirModal('modal-confirmar-delete');
}

function confirmarRemoveRow() {
  if (rowParaRemover) rowParaRemover.remove();
  rowParaRemover = null;
  fecharModal('modal-confirmar-delete');
  updateTotalItens();
}

function updateTotalItens() {
  let total = 0, pago = 0, pendente = 0, aPagar = 0;
  document.querySelectorAll('#tbody-itens tr').forEach(row => {
    const vlr = parseFloat(row.cells[5].querySelector('input').value) || 0;
    const isPago = row.cells[9].querySelector('input').checked;
    total += vlr;
    if (isPago) pago += vlr; else pendente += vlr;
  });
  document.getElementById('total-itens').textContent           = formatBRL(total);
  document.getElementById('total-reuniao-topo').textContent    = formatBRL(total);
  document.getElementById('total-apagar-topo').textContent     = formatBRL(aPagar);
  document.getElementById('total-pago-topo').textContent       = formatBRL(pago);
  document.getElementById('total-pendente-topo').textContent   = formatBRL(pendente);
}

function salvarItens() {
  const itens = [];
  document.querySelectorAll('#tbody-itens tr').forEach(row => {
    itens.push({
      categoria:   row.cells[0].querySelector('select').value,
      descricao:   row.cells[1].querySelector('input').value,
      fornecedor:  row.cells[2].querySelector('input').value,
      vlrUnitario: row.cells[3].querySelector('input').value,
      qtd:         row.cells[4].querySelector('input').value,
      vlrTotal:    row.cells[5].querySelector('input').value,
      pedidoNum:   row.dataset.pedidoNum  || '',
      pedidoLink:  row.dataset.pedidoLink || '',
      nfNum:       row.dataset.nfNum      || '',
      nfLink:      row.dataset.nfLink     || '',
      as:          row.cells[8].querySelector('input').checked,
      pago:        row.cells[9].querySelector('input').checked,
    });
  });
  DB.saveItens(reuniaoAtual.id, itens);
  alert('Salvo com sucesso!');
  voltarTela();
}

// ======= BALANCETE =======
function verBalancete() {
  renderBalancete();
  navegarPara('tela-balancete');
}

function renderBalancete() {
  document.getElementById('titulo-balancete').textContent = `Balancete — ${crAtual.nome}`;
  const container = document.getElementById('conteudo-balancete');
  const orcamento = DB.getOrcamento(crAtual.id);
  const grupos = DB.getGrupos(crAtual.id);
  let totalPassivos = 0, totalCirculantes = 0;

  const dadosGrupos = grupos.map(g => {
    const categorias = {};
    DB.getReunioes(g.id).forEach(r => {
      DB.getItens(r.id).forEach(i => {
        const val = parseFloat(i.vlrTotal) || 0;
        const pago = i.pago === true || i.pago === 'true';
        const cat = (i.categoria || 'Sem Categoria').trim();
        if (!categorias[cat]) categorias[cat] = { pagos: 0, pendentes: 0 };
        if (pago) categorias[cat].pagos += val; else categorias[cat].pendentes += val;
      });
    });
    const totalPagos = Object.values(categorias).reduce((s, c) => s + c.pagos, 0);
    const totalPendentes = Object.values(categorias).reduce((s, c) => s + c.pendentes, 0);
    totalPassivos += totalPagos;
    totalCirculantes += totalPendentes;
    return { nome: g.nome, categorias, totalPagos, totalPendentes };
  });

  const saldo = orcamento - totalPassivos - totalCirculantes;

  const grupoRows = (prefixo, campo) => dadosGrupos.map((g, i) => {
    const cod = `${prefixo}.${i+1}`;
    const total = g[campo];
    let rows = `<tr class="bal-grupo-sub-header"><td>${cod}</td><td>${g.nome}</td><td class="bal-valor-label">R$</td><td class="bal-valor">${total > 0 ? formatBRL(total) : '<span class="bal-zero">—</span>'}</td></tr>`;
    let ci = 1;
    Object.entries(g.categorias).forEach(([nome, vals]) => {
      const v = campo === 'totalPagos' ? vals.pagos : vals.pendentes;
      if (v > 0) { rows += `<tr class="bal-sub-item"><td>${cod}.${ci++}</td><td>${nome}</td><td class="bal-valor-label">R$</td><td class="bal-valor">${formatBRL(v)}</td></tr>`; }
    });
    return rows;
  }).join('');

  container.innerHTML = `
    <div class="balancete-wrapper">
      <table class="balancete-table">
        <thead><tr><th>Codigo</th><th>Plano de Contas</th><th colspan="2">Valor</th></tr></thead>
        <tbody>
          <tr class="bal-grupo-header"><td><strong>1.</strong></td><td><strong>Entradas</strong></td><td class="bal-valor-label">R$</td><td class="bal-valor"><strong>${formatBRL(orcamento)}</strong></td></tr>
          <tr class="bal-sub"><td>1.1</td><td>Orcamento Disponivel</td><td class="bal-valor-label">R$</td><td class="bal-valor">${formatBRL(orcamento)}</td></tr>
          <tr class="bal-grupo-header"><td><strong>2.</strong></td><td><strong>Passivos</strong></td><td class="bal-valor-label">R$</td><td class="bal-valor"><strong>${formatBRL(totalPassivos)}</strong></td></tr>
          ${grupoRows('2','totalPagos')}
          <tr class="bal-grupo-header"><td><strong>3.</strong></td><td><strong>Passivos Circulantes</strong></td><td class="bal-valor-label">R$</td><td class="bal-valor"><strong>${formatBRL(totalCirculantes)}</strong></td></tr>
          ${grupoRows('3','totalPendentes')}
          <tr class="bal-saldo-row"><td><strong>4.</strong></td><td><strong>Saldo Disponivel</strong></td><td class="bal-valor-label">R$</td><td class="bal-valor bal-saldo-valor ${saldo<0?'bal-negativo':''}"><strong>${formatBRL(saldo)}</strong></td></tr>
        </tbody>
      </table>
    </div>`;
}

// ======= MODAIS =======
function abrirModal(id) { document.getElementById(id).classList.add('open'); }
function fecharModal(id) { document.getElementById(id).classList.remove('open'); }

// ======= UTILS =======
function formatBRL(v) { return (parseFloat(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

irParaCRs();
