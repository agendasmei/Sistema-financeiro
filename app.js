// ======= UTILITÁRIOS =======
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function gerarId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// ======= VARIÁVEIS GLOBAIS =======
let crAtual       = null;
let grupoAtual    = null;
let reuniaoAtual  = null;
let telaAnterior  = null;
let rowParaRemover = null;
let linkRowAtual   = null;
let linkTipoAtual  = null;
let crIdModalCat   = null;

// ======= NAVEGAÇÃO =======
function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const btnVoltar = document.getElementById('btn-voltar');
  btnVoltar.style.display = id === 'tela-crs' ? 'none' : 'inline-block';
}

function irParaCRs() {
  crAtual = null;
  grupoAtual = null;
  reuniaoAtual = null;
  telaAnterior = null;
  mostrarTela('tela-crs');
  renderCRs();
}

function irParaGrupos() {
  mostrarTela('tela-grupos');
  telaAnterior = 'tela-grupos';
  renderGrupos();
}

function irParaReunioes() {
  mostrarTela('tela-reunioes');
  telaAnterior = 'tela-reunioes';
  renderReunioes();
}

function voltarTela() {
  if (telaAnterior === 'tela-reunioes') {
    irParaReunioes();
  } else if (telaAnterior === 'tela-grupos' || !telaAnterior) {
    if (crAtual) {
      irParaGrupos();
    } else {
      irParaCRs();
    }
  } else {
    irParaCRs();
  }
}

function voltarDeConfig() {
  mostrarTela('tela-crs');
  renderCRs();
}

// ======= MODAIS =======
function abrirModal(id) {
  document.getElementById(id).classList.add('open');
}

function fecharModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ======= CONFIGURAÇÕES =======
function abrirConfiguracoes() {
  mostrarTela('tela-config');
  renderCategoriasPadrao();
  renderCategoriasCRs();
}

// ======= CRs =======
function renderCRs() {
  const lista = document.getElementById('lista-crs');
  lista.innerHTML = '';
  const crs = DB.getCRs();
  if (!crs.length) {
    lista.innerHTML = '<p class="empty-msg">Nenhum CR criado ainda.</p>';
    return;
  }
  crs.forEach(cr => {
    const orc     = DB.getOrcamento(cr.id);
    const grupos  = DB.getGrupos(cr.id);
    let totalGasto = 0;
    grupos.forEach(g => {
      DB.getReunioes(g.id).forEach(r => {
        DB.getItens(r.id).forEach(item => {
          totalGasto += parseFloat(item.vlrTotal) || 0;
        });
      });
    });
    const saldo = orc - totalGasto;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-nome">${cr.nome}</div>
      <div class="card-info">${grupos.length} grupo(s)</div>
      <div class="card-valor">${formatBRL(orc)}</div>
      <div class="card-info" style="margin-top:4px;">
        Gasto: <strong style="color:#EF4444">${formatBRL(totalGasto)}</strong> |
        Saldo: <strong style="color:${saldo >= 0 ? '#0F766E' : '#EF4444'}">${formatBRL(saldo)}</strong>
      </div>
      <div class="card-acoes">
        <button onclick="event.stopPropagation();abrirEditarOrcamento('${cr.id}')">✏️ Orçamento</button>
        <button class="btn-danger" onclick="event.stopPropagation();deletarCR('${cr.id}')">🗑️</button>
      </div>`;
    card.addEventListener('click', () => {
      crAtual = cr;
      irParaGrupos();
    });
    lista.appendChild(card);
  });
}

function salvarCR() {
  const nome = document.getElementById('input-cr').value.trim();
  const orc  = parseFloat(document.getElementById('input-cr-orcamento').value) || 0;
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
  const crs = DB.getCRs().filter(c => c.id !== crId);
  DB.saveCRs(crs);
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

// ======= GRUPOS =======
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
    const reunioes = DB.getReunioes(g.id);
    let total = 0;
    reunioes.forEach(r => {
      DB.getItens(r.id).forEach(item => {
        total += parseFloat(item.vlrTotal) || 0;
      });
    });

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-nome">${g.nome}</div>
      <div class="card-info">${reunioes.length} reunião(ões)</div>
      <div class="card-valor">${formatBRL(total)}</div>
      <div class="card-acoes">
        <button class="btn-danger" onclick="event.stopPropagation();deletarGrupo('${g.id}')">🗑️</button>
      </div>`;
    card.addEventListener('click', () => {
      grupoAtual = g;
      irParaReunioes();
    });
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
  if (!confirm('Deletar este grupo e todas as suas reuniões?')) return;
  const grupos = DB.getGrupos(crAtual.id).filter(g => g.id !== grupoId);
  DB.saveGrupos(crAtual.id, grupos);
  renderGrupos();
}

function verBalancete() {
  mostrarTela('tela-balancete');
  renderBalancete();
}

// ======= REUNIÕES =======
function renderReunioes() {
  document.getElementById('titulo-reunioes').textContent = grupoAtual ? grupoAtual.nome : 'Reuniões';
  const lista = document.getElementById('lista-reunioes');
  lista.innerHTML = '';
  const reunioes = DB.getReunioes(grupoAtual.id);
  if (!reunioes.length) {
    lista.innerHTML = '<p class="empty-msg">Nenhuma reunião criada ainda.</p>';
    return;
  }
  reunioes.forEach(r => {
    let total = 0, pago = 0;
    DB.getItens(r.id).forEach(item => {
      const v = parseFloat(item.vlrTotal) || 0;
      total += v;
      if (item.pago) pago += v;
    });

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-nome">${r.nome}</div>
      <div class="card-valor">${formatBRL(total)}</div>
      <div class="card-info" style="margin-top:4px;">
        Pago: <strong style="color:#0F766E">${formatBRL(pago)}</strong> |
        Pendente: <strong style="color:#F59E0B">${formatBRL(total - pago)}</strong>
      </div>
      <div class="card-acoes">
        <button class="btn-danger" onclick="event.stopPropagation();deletarReuniao('${r.id}')">🗑️</button>
      </div>`;
    card.addEventListener('click', () => {
      reuniaoAtual = r;
      telaAnterior = 'tela-reunioes';
      mostrarTela('tela-itens');
      renderItens();
    });
    lista.appendChild(card);
  });
}

function salvarReuniao() {
  const nome = document.getElementById('input-reuniao').value.trim();
  if (!nome) { alert('Informe o nome da reunião.'); return; }
  const reunioes = DB.getReunioes(grupoAtual.id);
  reunioes.push({ id: gerarId(), nome });
  DB.saveReunioes(grupoAtual.id, reunioes);
  document.getElementById('input-reuniao').value = '';
  fecharModal('modal-reuniao');
  renderReunioes();
}

function deletarReuniao(reuniaoId) {
  if (!confirm('Deletar esta reunião e todos os seus itens?')) return;
  const reunioes = DB.getReunioes(grupoAtual.id).filter(r => r.id !== reuniaoId);
  DB.saveReunioes(grupoAtual.id, reunioes);
  renderReunioes();
}

// ======= BALANCETE =======
function renderBalancete() {
  document.getElementById('titulo-balancete').textContent = `Balancete — ${crAtual ? crAtual.nome : ''}`;
  const container = document.getElementById('conteudo-balancete');
  container.innerHTML = '';
  const grupos = DB.getGrupos(crAtual.id);
  if (!grupos.length) {
    container.innerHTML = '<p class="empty-msg">Nenhum grupo encontrado.</p>';
    return;
  }

  let totalCR = 0;
  grupos.forEach(g => {
    const reunioes = DB.getReunioes(g.id);
    let totalGrupo = 0;

    const bloco = document.createElement('div');
    bloco.className = 'balancete-grupo';

    let linhas = '';
    reunioes.forEach(r => {
      let total = 0, pago = 0;
      DB.getItens(r.id).forEach(item => {
        const v = parseFloat(item.vlrTotal) || 0;
        total += v;
        if (item.pago) pago += v;
      });
      totalGrupo += total;
      linhas += `
        <div class="balancete-reuniao">
          <span>${r.nome}</span>
          <span>
            Total: <strong>${formatBRL(total)}</strong> |
            Pago: <strong style="color:#0F766E">${formatBRL(pago)}</strong> |
            Pendente: <strong style="color:#F59E0B">${formatBRL(total - pago)}</strong>
          </span>
        </div>`;
    });

    totalCR += totalGrupo;
    bloco.innerHTML = `
      <div class="balancete-grupo-header">${g.nome}</div>
      ${linhas || '<div class="balancete-reuniao"><span>Nenhuma reunião</span></div>'}
      <div class="balancete-total">
        <span>Total do Grupo</span>
        <span>${formatBRL(totalGrupo)}</span>
      </div>`;
    container.appendChild(bloco);
  });

  const orc   = DB.getOrcamento(crAtual.id);
  const saldo = orc - totalCR;
  const resumo = document.createElement('div');
  resumo.style.cssText = 'background:#fff;border:1px solid #E5E7EB;border-radius:12px;padding:16px;margin-top:8px;';
  resumo.innerHTML = `
    <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:600;margin-bottom:8px;">
      <span>Orçamento Total</span><span style="color:#0F766E">${formatBRL(orc)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:600;margin-bottom:8px;">
      <span>Total Gasto</span><span style="color:#EF4444">${formatBRL(totalCR)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;border-top:2px solid #E5E7EB;padding-top:8px;">
      <span>Saldo</span>
      <span style="color:${saldo >= 0 ? '#0F766E' : '#EF4444'}">${formatBRL(saldo)}</span>
    </div>`;
  container.appendChild(resumo);
}

// ======= CATEGORIAS PADRÃO =======
function renderCategoriasPadrao() {
  const lista = document.getElementById('lista-cat-padrao');
  lista.innerHTML = '';
  DB.getCategoriasPadrao().forEach(cat => {
    const div = document.createElement('div');
    div.className = `cat-item ${!cat.ativo ? 'cat-inativo' : ''}`;
    div.innerHTML = `
      <span class="cat-nome">${cat.nome}</span>
      <label class="toggle">
        <input type="checkbox" ${cat.ativo ? 'checked' : ''} onchange="toggleCategoriaPadrao('${cat.id}')">
        <span class="toggle-slider"></span>
      </label>`;
    lista.appendChild(div);
  });
}

function salvarCategoriaPadrao() {
  const nome = document.getElementById('input-cat-padrao').value.trim();
  if (!nome) { alert('Informe o nome da categoria.'); return; }
  const cats = DB.getCategoriasPadrao();
  cats.push({ id: gerarId(), nome, ativo: true });
  DB.saveCategoriasPadrao(cats);
  document.getElementById('input-cat-padrao').value = '';
  fecharModal('modal-categoria-padrao');
  renderCategoriasPadrao();
}

function toggleCategoriaPadrao(catId) {
  const cats = DB.getCategoriasPadrao().map(c =>
    c.id === catId ? { ...c, ativo: !c.ativo } : c
  );
  DB.saveCategoriasPadrao(cats);
  renderCategoriasPadrao();
}

// ======= CATEGORIAS POR CR =======
function abrirModalCatCR(crId, crNome) {
  crIdModalCat = crId;
  document.getElementById('titulo-modal-cat-cr').textContent = `Nova Categoria — ${crNome}`;
  abrirModal('modal-categoria-cr');
}

function salvarCategoriaCR() {
  const nome = document.getElementById('input-cat-cr').value.trim();
  if (!nome) { alert('Informe o nome da categoria.'); return; }
  const extras = DB.getCategoriasExtrasCR(crIdModalCat);
  extras.push({ id: gerarId(), nome, ativo: true });
  DB.saveCategoriasExtrasCR(crIdModalCat, extras);
  document.getElementById('input-cat-cr').value = '';
  fecharModal('modal-categoria-cr');
  renderCategoriasCRs();
}

function togglePadraoNoCR(crId, catId) {
  const desativadas = DB.getCategoriasDesativadasCR(crId);
  const idx = desativadas.indexOf(catId);
  if (idx === -1) desativadas.push(catId);
  else desativadas.splice(idx, 1);
  DB.saveCategoriasDesativadasCR(crId, desativadas);
}

function toggleCategoriaExtraCR(crId, catId) {
  const extras = DB.getCategoriasExtrasCR(crId).map(c =>
    c.id === catId ? { ...c, ativo: !c.ativo } : c
  );
  DB.saveCategoriasExtrasCR(crId, extras);
  renderCategoriasCRs();
}

function deletarCategoriaExtraCR(crId, catId) {
  if (!confirm('Remover esta categoria?')) return;
  const extras = DB.getCategoriasExtrasCR(crId).filter(c => c.id !== catId);
  DB.saveCategoriasExtrasCR(crId, extras);
  renderCategoriasCRs();
}

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
    titulo.innerHTML = `<span>${cr.nome}</span><span class="cr-chevron">▼</span>`;

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
      <button class="btn-add-cat-small" onclick="abrirModalCatCR('${cr.id}','${cr.nome}')">+ Adicionar</button>
    </div>
    <p style="font-size:11px;color:#a0aec0;margin-bottom:8px;font-weight:600;text-transform:uppercase;">Categorias Padrão</p>
    ${padrao.map(c => `
      <div class="cat-item ${desativadas.includes(c.id) ? 'cat-inativo' : ''}">
        <span class="cat-nome">${c.nome}</span>
        <label class="toggle">
          <input type="checkbox" ${!desativadas.includes(c.id) ? 'checked' : ''} onchange="togglePadraoNoCR('${cr.id}','${c.id}')">
          <span class="toggle-slider"></span>
        </label>
      </div>`).join('')}
    ${extras.length ? `
      <p style="font-size:11px;color:#a0aec0;margin:12px 0 8px;font-weight:600;text-transform:uppercase;">Exclusivas deste CR</p>
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

// ======= ITENS =======
function buildCategoriasOptions(selected = '') {
  const cats = crAtual ? DB.getCategoriasDisponiveis(crAtual.id) : DB.getCategoriasPadrao().filter(c => c.ativo);
  const opts = cats.map(c =>
    `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${c.nome}</option>`
  ).join('');
  return `<option value="">-- Categoria --</option>${opts}`;
}

function renderItens() {
  const nomeReuniao = reuniaoAtual ? reuniaoAtual.nome : 'Reunião';
  document.getElementById('titulo-itens').textContent = nomeReuniao;
  document.getElementById('secao-custo-nome').textContent = `Custo — ${nomeReuniao}`;

  document.getElementById('tbody-orcamento').innerHTML = '';
  document.getElementById('tbody-itens').innerHTML = '';

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
    <td><select class="select-categoria">${buildCategoriasOptions(item.categoria || '')}</select></td>
    <td><input type="text" value="${esc(item.descricao||'')}" placeholder="Descrição"></td>
    <td><input type="text" value="${esc(item.fornecedor||'')}" placeholder="Fornecedor"></td>
    <td><input type="number" value="${item.vlrUnitario||''}" placeholder="0,00" oninput="calcLinhaOrc(this)"></td>
    <td><input type="number" value="${item.qtd||''}" placeholder="1" oninput="calcLinhaOrc(this)"></td>
    <td><input type="number" value="${item.vlrTotal||''}" placeholder="0,00" oninput="updateTotalItens()"></td>
    <td><button class="btn-del-row" onclick="pedirConfirmacaoRemover(this)" title="Remover">🗑️</button></td>`;
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
  tr.dataset.secao      = 'custo';
  tr.dataset.pedidoNum  = item.pedidoNum  || '';
  tr.dataset.pedidoLink = item.pedidoLink || '';
  tr.dataset.nfNum      = item.nfNum      || '';
  tr.dataset.nfLink     = item.nfLink     || '';
  tr.innerHTML = `
    <td><select class="select-categoria">${buildCategoriasOptions(item.categoria || '')}</select></td>
    <td><input type="text" value="${esc(item.descricao||'')}" placeholder="Descrição"></td>
    <td><input type="text" value="${esc(item.fornecedor||'')}" placeholder="Fornecedor"></td>
    <td><input type="number" value="${item.vlrUnitario||''}" placeholder="0,00" oninput="calcLinha(this)"></td>
    <td><input type="number" value="${item.qtd||''}" placeholder="1" oninput="calcLinha(this)"></td>
    <td><input type="number" value="${item.vlrTotal||''}" placeholder="0,00" oninput="updateTotalItens()"></td>
    <td><input type="number" value="${item.vlrReuniao||''}" placeholder="0,00" oninput="updateTotalItens()"></td>
    <td class="td-link"></td>
    <td class="td-link-nf"></td>
    <td class="check-cell"><input type="checkbox" ${item.as ? 'checked' : ''}></td>
    <td class="check-cell"><input type="checkbox" ${item.pago ? 'checked' : ''} onchange="updateTotalItens()"></td>
    <td><button class="btn-del-row" onclick="pedirConfirmacaoRemover(this)" title="Remover">🗑️</button></td>`;
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

  document.querySelectorAll('#tbody-orcamento tr').forEach(row => {
    const vlr = parseFloat(row.cells[5].querySelector('input').value) || 0;
    totalOrc += vlr;
    total += vlr;
  });

  document.querySelectorAll('#tbody-itens tr').forEach(row => {
    const vlr        = parseFloat(row.cells[5].querySelector('input').value) || 0;
    const vlrReuniao = parseFloat(row.cells[6].querySelector('input').value) || 0;
    const isPago     = row.cells[10].querySelector('input').checked;
    total += vlr;
    totalVlrReuniao += vlrReuniao;
    if (isPago) pago += vlr; else pendente += vlr;
  });

  document.getElementById('total-orcamento').textContent     = formatBRL(totalOrc);
  document.getElementById('total-itens').textContent         = formatBRL(total);
  document.getElementById('total-vlr-reuniao').textContent   = formatBRL(totalVlrReuniao);
  document.getElementById('total-reuniao-topo').textContent  = formatBRL(total);
  document.getElementById('total-apagar-topo').textContent   = formatBRL(pendente);
  document.getElementById('total-pago-topo').textContent     = formatBRL(pago);
  document.getElementById('total-pendente-topo').textContent = formatBRL(pendente);
}

function salvarItens() {
  const itens = [];

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

// ======= LINK (Pedido / NF) =======
function renderLinkCell(tr, tipo) {
  const cell    = tipo === 'pedido' ? tr.querySelector('.td-link') : tr.querySelector('.td-link-nf');
  const numKey  = tipo === 'pedido' ? 'pedidoNum'  : 'nfNum';
  const linkKey = tipo === 'pedido' ? 'pedidoLink' : 'nfLink';
  const num     = tr.dataset[numKey];
  const link    = tr.dataset[linkKey];

  cell.innerHTML = '';
  if (num || link) {
    const a = document.createElement('a');
    a.href   = link || '#';
    a.target = '_blank';
    a.textContent = num || '🔗';
    a.style.cssText = 'font-size:11px;color:#0F766E;text-decoration:underline;margin-right:4px;';
    cell.appendChild(a);
  }
  const btn = document.createElement('button');
  btn.textContent = num ? '✏️' : '+ Link';
  btn.onclick = () => abrirModalLink(tr, tipo);
  cell.appendChild(btn);
}

function abrirModalLink(tr, tipo) {
  linkRowAtual  = tr;
  linkTipoAtual = tipo;
  const numKey  = tipo === 'pedido' ? 'pedidoNum'  : 'nfNum';
  const linkKey = tipo === 'pedido' ? 'pedidoLink' : 'nfLink';
  document.getElementById('titulo-modal-link').textContent = tipo === 'pedido' ? 'Nº Pedido' : 'Nº NF';
  document.getElementById('input-link-numero').value = tr.dataset[numKey]  || '';
  document.getElementById('input-link-url').value    = tr.dataset[linkKey] || '';
  abrirModal('modal-link');
}

function salvarLink() {
  const num  = document.getElementById('input-link-numero').value.trim();
  const link = document.getElementById('input-link-url').value.trim();
  const numKey  = linkTipoAtual === 'pedido' ? 'pedidoNum'  : 'nfNum';
  const linkKey = linkTipoAtual === 'pedido' ? 'pedidoLink' : 'nfLink';
  linkRowAtual.dataset[numKey]  = num;
  linkRowAtual.dataset[linkKey] = link;
  renderLinkCell(linkRowAtual, linkTipoAtual);
  fecharModal('modal-link');
}

// ======= REMOVER LINHA =======
function pedirConfirmacaoRemover(btn) {
  rowParaRemover = btn.closest('tr');
  abrirModal('modal-confirmar-delete');
}

function confirmarRemoveRow() {
  if (rowParaRemover) {
    rowParaRemover.remove();
    rowParaRemover = null;
    updateTotalItens();
  }
  fecharModal('modal-confirmar-delete');
}

// ======= INIT =======
document.addEventListener('DOMContentLoaded', () => {
  renderCRs();
});
