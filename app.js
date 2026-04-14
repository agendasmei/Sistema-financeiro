let crAtual = null;
let grupoAtual = null;
let reuniaoAtual = null;
let telaAnteriorConfig = null;
let grupoConfigAtual = null;

// ======= NAVEGAÇÃO =======
function showTela(id) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function updateBreadcrumb() {
  const bc = document.getElementById('breadcrumb');
  let html = `<span onclick="irParaCRs()">Inicio</span>`;
  if (crAtual) html += ` / <span onclick="irParaGrupos()">${crAtual.nome}</span>`;
  if (grupoAtual) html += ` / <span onclick="irParaReunioes()">${grupoAtual.nome}</span>`;
  if (reuniaoAtual) html += ` / ${reuniaoAtual.nome}`;
  bc.innerHTML = html;
}

// ======= CONFIGURAÇÕES =======
function abrirConfiguracoes() {
  telaAnteriorConfig = document.querySelector('.tela.active')?.id || 'tela-crs';
  renderConfiguracoes();
  showTela('tela-config');
}

function voltarDeConfig() {
  showTela(telaAnteriorConfig || 'tela-crs');
}

function renderConfiguracoes() {
  renderCategoriasPadrao();
  renderCategoriasGrupos();
}

function renderCategoriasPadrao() {
  const lista = document.getElementById('lista-cat-padrao');
  const cats = DB.getCategoriasPadrao();
  lista.innerHTML = '';
  cats.forEach((cat, idx) => {
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
      </div>
    `;
    lista.appendChild(div);
  });
}

function renderCategoriasGrupos() {
  const container = document.getElementById('lista-cat-grupos');
  container.innerHTML = '';

  if (!crAtual) {
    container.innerHTML = '<p class="empty-msg">Abra um CR para ver as categorias por grupo.</p>';
    return;
  }

  const grupos = DB.getGrupos(crAtual.id);
  if (grupos.length === 0) {
    container.innerHTML = '<p class="empty-msg">Nenhum grupo criado ainda.</p>';
    return;
  }

  grupos.forEach(g => {
    const extras = DB.getCategoriasGrupo(g.id);
    const section = document.createElement('div');
    section.className = 'config-grupo-bloco';
    section.innerHTML = `
      <div class="config-grupo-titulo">
        <span>${g.nome}</span>
        <button class="btn-add-cat-small" onclick="abrirModalCatGrupo('${g.id}', '${g.nome}')">+ Adicionar</button>
      </div>
      <div id="cats-grupo-${g.id}" class="lista-categorias"></div>
    `;
    container.appendChild(section);

    const lista = document.getElementById(`cats-grupo-${g.id}`);
    if (extras.length === 0) {
      lista.innerHTML = '<p class="empty-msg-small">Nenhuma categoria exclusiva. Usa as categorias padrao.</p>';
    } else {
      extras.forEach(cat => {
        const div = document.createElement('div');
        div.className = `cat-item ${!cat.ativo ? 'cat-inativo' : ''}`;
        div.innerHTML = `
          <span class="cat-nome">${cat.nome}</span>
          <div class="cat-acoes">
            <label class="toggle">
              <input type="checkbox" ${cat.ativo ? 'checked' : ''} onchange="toggleCategoriaGrupo('${g.id}', '${cat.id}')">
              <span class="toggle-slider"></span>
            </label>
            <button class="btn-icon-danger" onclick="deletarCategoriaGrupo('${g.id}', '${cat.id}')">Remover</button>
          </div>
        `;
        lista.appendChild(div);
      });
    }
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

function abrirModalCatGrupo(grupoId, grupoNome) {
  grupoConfigAtual = grupoId;
  document.getElementById('titulo-modal-cat-grupo').textContent = `Nova Categoria — ${grupoNome}`;
  document.getElementById('input-cat-grupo').value = '';
  abrirModal('modal-categoria-grupo');
}

function salvarCategoriaGrupo() {
  const nome = document.getElementById('input-cat-grupo').value.trim();
  if (!nome) return alert('Digite um nome!');
  const cats = DB.getCategoriasGrupo(grupoConfigAtual);
  cats.push({ id: 'catg_' + Date.now(), nome, ativo: true });
  DB.saveCategoriasGrupo(grupoConfigAtual, cats);
  document.getElementById('input-cat-grupo').value = '';
  fecharModal('modal-categoria-grupo');
  renderCategoriasGrupos();
}

function toggleCategoriaGrupo(grupoId, catId) {
  const cats = DB.getCategoriasGrupo(grupoId);
  const cat = cats.find(c => c.id === catId);
  if (cat) cat.ativo = !cat.ativo;
  DB.saveCategoriasGrupo(grupoId, cats);
  renderCategoriasGrupos();
}

function deletarCategoriaGrupo(grupoId, catId) {
  if (!confirm('Remover esta categoria?')) return;
  DB.saveCategoriasGrupo(grupoId, DB.getCategoriasGrupo(grupoId).filter(c => c.id !== catId));
  renderCategoriasGrupos();
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
      <h3>${cr.nome}</h3>
      <div class="card-label">Orcamento</div>
      <div class="total">${formatBRL(orcamento)}</div>
      <small class="card-hint">Clique para abrir</small>
      <button class="btn-delete" onclick="event.stopPropagation(); deletarCR('${cr.id}')">Excluir</button>
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
  document.getElementById('titulo-grupos').textContent = crAtual ? crAtual.nome : 'Grupos';
  const lista = document.getElementById('lista-grupos');
  const grupos = DB.getGrupos(crAtual.id);
  lista.innerHTML = '';

  const orcamento = DB.getOrcamento(crAtual.id);
  const totalGasto = calcTotalCR(crAtual.id);
  const saldo = orcamento - totalGasto;

  const resumoEl = document.createElement('div');
  resumoEl.className = 'resumo-cr';
  resumoEl.innerHTML = `
    <div class="resumo-item">
      <span class="resumo-label">Orcamento</span>
      <span class="resumo-valor">${formatBRL(orcamento)}</span>
    </div>
    <div class="resumo-divider"></div>
    <div class="resumo-item">
      <span class="resumo-label">Total Lancado</span>
      <span class="resumo-valor resumo-gasto">${formatBRL(totalGasto)}</span>
    </div>
    <div class="resumo-divider"></div>
    <div class="resumo-item">
      <span class="resumo-label">Saldo Disponivel</span>
      <span class="resumo-valor ${saldo < 0 ? 'resumo-negativo' : 'resumo-saldo'}">${formatBRL(saldo)}</span>
    </div>
    <button class="btn-editar-orc" onclick="abrirEditarOrcamento()">Editar orcamento</button>
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
      <h3>${g.nome}</h3>
      <div class="card-label">Total lancado</div>
      <div class="total">${formatBRL(total)}</div>
      <small class="card-hint">Clique para abrir</small>
      <button class="btn-delete" onclick="event.stopPropagation(); deletarGrupo('${g.id}')">Excluir</button>
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
  document.getElementById('titulo-reunioes').textContent = grupoAtual ? grupoAtual.nome : 'Reunioes';
  const lista = document.getElementById('lista-reunioes');
  const reunioes = DB.getReunioes(grupoAtual.id);
  lista.innerHTML = '';
  if (reunioes.length === 0) {
    lista.innerHTML = '<p class="empty-msg">Nenhuma reuniao ainda. Clique em + Nova Reuniao!</p>';
    return;
  }
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
      <button class="btn-delete" onclick="event.stopPropagation(); deletarReuniao('${r.id}')">Excluir</button>
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

function buildCategoriasOptions(selectedNome) {
  const cats = DB.getCategoriasDisponiveis(grupoAtual.id);
  let opts = `<option value="">Selecione...</option>`;
  cats.forEach(c => {
    opts += `<option value="${c.nome}" ${c.nome === selectedNome ? 'selected' : ''}>${c.nome}</option>`;
  });
  return opts;
}

function addItemRow(item = {}) {
  const tbody = document.getElementById('tbody-itens');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>
      <select class="select-categoria">
        ${buildCategoriasOptions(item.categoria || '')}
      </select>
    </td>
    <td><input type="text" value="${item.descricao || ''}" placeholder="Descricao"></td>
    <td><input type="text" value="${item.fornecedorCotado || ''}" placeholder="Fornecedor cotado"></td>
    <td><input type="number" value="${item.vlrUnitario || ''}" placeholder="0,00" oninput="calcLinha(this)"></td>
    <td><input type="number" value="${item.qtd || ''}" placeholder="1" oninput="calcLinha(this)"></td>
    <td><input type="number" value="${item.vlrTotal || ''}" placeholder="0,00" readonly></td>
    <td>
      <select>
        <option value="Sim" ${item.aprovado === 'Sim' ? 'selected' : ''}>Sim</option>
        <option value="Nao" ${item.aprovado === 'Nao' ? 'selected' : ''}>Nao</option>
      </select>
    </td>
    <td><input type="text" value="${item.numPedido || ''}" placeholder="Nr Pedido"></td>
    <td><input type="text" value="${item.fornecedorContratado || ''}" placeholder="Fornecedor contratado"></td>
    <td><input type="text" value="${item.numNF || ''}" placeholder="Nr NF"></td>
    <td style="text-align:center"><input type="checkbox" ${item.as ? 'checked' : ''}></td>
    <td>
      <select>
        <option value="Pago" ${item.pago === 'Pago' ? 'selected' : ''}>Pago</option>
        <option value="Pendente" ${item.pago === 'Pendente' ? 'selected' : ''}>Pendente</option>
        <option value="A Realizar" ${item.pago === 'A Realizar' ? 'selected' : ''}>A Realizar</option>
      </select>
    </td>
    <td><button class="btn-remove" onclick="removeRow(this)">Remover</button></td>
  `;
  tbody.appendChild(tr);
  updateTotalItens();
}

function calcLinha(input) {
  const row = input.closest('tr');
  const vlrUnit = parseFloat(row.cells[3].querySelector('input').value) || 0;
  const qtd = parseFloat(row.cells[4].querySelector('input').value) || 0;
  row.cells[5].querySelector('input').value = (vlrUnit * qtd).toFixed(2);
  updateTotalItens();
}

function removeRow(btn) {
  btn.closest('tr').remove();
  updateTotalItens();
}

function updateTotalItens() {
  let total = 0;
  document.querySelectorAll('#tbody-itens tr').forEach(row => {
    total += parseFloat(row.cells[5].querySelector('input').value) || 0;
  });
  document.getElementById('total-itens').textContent = formatBRL(total);
}

function salvarItens() {
  const rows = document.querySelectorAll('#tbody-itens tr');
  const itens = [];
  rows.forEach(row => {
    itens.push({
      categoria: row.cells[0].querySelector('select').value,
      descricao: row.cells[1].querySelector('input').value,
      fornecedorCotado: row.cells[2].querySelector('input').value,
      vlrUnitario: row.cells[3].querySelector('input').value,
      qtd: row.cells[4].querySelector('input').value,
      vlrTotal: row.cells[5].querySelector('input').value,
      aprovado: row.cells[6].querySelector('select').value,
      numPedido: row.cells[7].querySelector('input').value,
      fornecedorContratado: row.cells[8].querySelector('input').value,
      numNF: row.cells[9].querySelector('input').value,
      as: row.cells[10].querySelector('input').checked,
      pago: row.cells[11].querySelector('select').value,
    });
  });
  DB.saveItens(reuniaoAtual.id, itens);
  alert('Salvo com sucesso!');
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

  let totalPassivos = 0;
  let totalCirculantes = 0;

  // Coleta dados por grupo e por categoria
  const dadosGrupos = grupos.map(g => {
    const categorias = {};

    DB.getReunioes(g.id).forEach(r => {
      DB.getItens(r.id).forEach(i => {
        const val = parseFloat(i.vlrTotal) || 0;
        const pago = (i.pago || '').trim();
        const cat = (i.categoria || 'Sem Categoria').trim();

        if (!categorias[cat]) categorias[cat] = { pagos: 0, pendentes: 0 };

        if (pago === 'Pago') categorias[cat].pagos += val;
        else if (pago === 'Pendente') categorias[cat].pendentes += val;
      });
    });

    const totalPagos = Object.values(categorias).reduce((s, c) => s + c.pagos, 0);
    const totalPendentes = Object.values(categorias).reduce((s, c) => s + c.pendentes, 0);

    totalPassivos += totalPagos;
    totalCirculantes += totalPendentes;

    return { nome: g.nome, categorias, totalPagos, totalPendentes };
  });

  const saldo = orcamento - totalPassivos - totalCirculantes;

  let html = `
    <div class="balancete-wrapper">
      <table class="balancete-table">
        <thead>
          <tr>
            <th>Codigo</th>
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
            <td>Orcamento Disponivel</td>
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

  dadosGrupos.forEach((g, gIdx) => {
    const codigoGrupo = `2.${gIdx + 1}`;
    html += `
      <tr class="bal-grupo-sub-header">
        <td>${codigoGrupo}</td>
        <td>${g.nome}</td>
        <td class="bal-valor-label">R$</td>
        <td class="bal-valor">${g.totalPagos > 0 ? formatBRL(g.totalPagos) : '<span class="bal-zero">—</span>'}</td>
      </tr>
    `;
    let catIdx = 1;
    Object.entries(g.categorias).forEach(([catNome, vals]) => {
      if (vals.pagos > 0) {
        html += `
          <tr class="bal-sub-item">
            <td>${codigoGrupo}.${catIdx}</td>
            <td>${catNome}</td>
            <td class="bal-valor-label">R$</td>
            <td class="bal-valor">${formatBRL(vals.pagos)}</td>
          </tr>
        `;
        catIdx++;
      }
    });
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

  dadosGrupos.forEach((g, gIdx) => {
    const codigoGrupo = `3.${gIdx + 1}`;
    html += `
      <tr class="bal-grupo-sub-header">
        <td>${codigoGrupo}</td>
        <td>${g.nome}</td>
        <td class="bal-valor-label">R$</td>
        <td class="bal-valor">${g.totalPendentes > 0 ? formatBRL(g.totalPendentes) : '<span class="bal-zero">—</span>'}</td>
      </tr>
    `;
    let catIdx = 1;
    Object.entries(g.categorias).forEach(([catNome, vals]) => {
      if (vals.pendentes > 0) {
        html += `
          <tr class="bal-sub-item">
            <td>${codigoGrupo}.${catIdx}</td>
            <td>${catNome}</td>
            <td class="bal-valor-label">R$</td>
            <td class="bal-valor">${formatBRL(vals.pendentes)}</td>
          </tr>
        `;
        catIdx++;
      }
    });
  });

  html += `
          <!-- 4. SALDO -->
          <tr class="bal-saldo-row">
            <td><strong>4.</strong></td>
            <td><strong>Saldo Disponivel</strong></td>
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
