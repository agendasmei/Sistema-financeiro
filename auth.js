// ═══════════════════════════════════════════
// AUTH.JS — Login, Sessão e Controle de Acesso
// ═══════════════════════════════════════════

// ── Inicializa tela correta ao carregar ──
document.addEventListener('DOMContentLoaded', () => {
  DB.inicializarAdmPadrao(); // 👈 linha nova
  const usuario = DB.usuarioLogado();

  if (usuario) {
    entrarNoSistema(usuario);
  } else {
    mostrarTelaLogin();
  }
});

// ═══════════════════════════════════════════
// TELA DE LOGIN
// ═══════════════════════════════════════════
function mostrarTelaLogin() {
  document.getElementById('tela-login').classList.add('active');
  document.querySelectorAll('.tela:not(#tela-login)').forEach(t => t.classList.remove('active'));
  document.getElementById('header-nav-logado').style.display = 'none';
  renderListaUsuariosLogin();
}

function renderListaUsuariosLogin() {
  const container = document.getElementById('lista-usuarios-login');
  container.innerHTML = '';
  const usuarios = DB.getUsuarios();

  if (!usuarios.length) {
    container.innerHTML = `
      <p class="empty-msg" style="text-align:center;padding:32px 0;">
        Nenhum usuário cadastrado ainda.<br>
        <span style="font-size:12px;color:#9CA3AF;">Cadastre o primeiro usuário nas configurações.</span>
      </p>`;
    return;
  }

  usuarios.forEach(u => {
    const crNome = DB.getCRs().find(c => c.id === u.crId)?.nome || '—';
    const grupoNome = u.grupoId
      ? DB.getGrupos(u.crId).find(g => g.id === u.grupoId)?.nome || '—'
      : null;

    const div = document.createElement('div');
    div.className = 'login-user-card';
    div.innerHTML = `
      <div class="login-user-avatar">${u.nome.charAt(0).toUpperCase()}</div>
      <div class="login-user-info">
        <div class="login-user-nome">${esc(u.nome)}</div>
        <div class="login-user-sub">
          ${crNome}
          ${grupoNome ? `· ${grupoNome}` : ''}
          · <span class="login-user-tipo ${u.tipo === 'adm' ? 'tipo-adm' : 'tipo-usuario'}">
              ${u.tipo === 'adm' ? 'ADM' : 'Usuário'}
            </span>
        </div>
      </div>`;
    div.addEventListener('click', () => fazerLogin(u.id));
    container.appendChild(div);
  });
}

function fazerLogin(usuarioId) {
  const usuario = DB.getUsuarioById(usuarioId);
  if (!usuario) { showToast('Usuário não encontrado.', 'error'); return; }
  DB.salvarSessao(usuario);
  entrarNoSistema(usuario);
}

function entrarNoSistema(usuario) {
  // Atualiza header
  document.getElementById('header-nav-logado').style.display = 'flex';
  document.getElementById('header-usuario-nome').textContent = usuario.nome;
  document.getElementById('header-usuario-tipo').textContent =
    usuario.tipo === 'adm' ? 'ADM' : 'Usuário';

  // Esconde botão de configurações se não for ADM
  document.getElementById('btn-config-header').style.display =
    usuario.tipo === 'adm' ? 'inline-flex' : 'none';

  // Esconde tela de login
  document.getElementById('tela-login').classList.remove('active');

  // Redireciona
  if (usuario.tipo === 'adm') {
    // ADM → vai para tela de CRs normalmente
    crAtual = DB.getCRs().find(c => c.id === usuario.crId) || null;
    irParaCRs();
  } else {
    // Usuário comum → vai direto para o grupo dele
    crAtual    = DB.getCRs().find(c => c.id === usuario.crId) || null;
    grupoAtual = crAtual
      ? DB.getGrupos(crAtual.id).find(g => g.id === usuario.grupoId) || null
      : null;

    if (grupoAtual) {
      irParaGrupoDetalhe();
    } else {
      showToast('Grupo não encontrado. Contate o ADM.', 'error');
      mostrarTelaLogin();
    }
  }
}

// ═══════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════
function fazerLogout() {
  DB.limparSessao();
  crAtual = grupoAtual = telaAnterior = null;
  mostrarTelaLogin();
  showToast('Até logo!', 'info');
}

// ═══════════════════════════════════════════
// GUARD — bloqueia ações não permitidas
// ═══════════════════════════════════════════
function guardAdm(acao) {
  if (!DB.isAdm()) {
    showToast('Apenas ADMs podem realizar esta ação.', 'error');
    return false;
  }
  return true;
}

function guardGrupo(grupoId) {
  if (!DB.podeVerGrupo(grupoId)) {
    showToast('Você não tem acesso a este grupo.', 'error');
    return false;
  }
  return true;
}

// ═══════════════════════════════════════════
// USUÁRIOS — CRUD (usado nas configurações)
// ═══════════════════════════════════════════
let editarUsuarioId = null;

function abrirModalNovoUsuario() {
  if (!guardAdm()) return;
  editarUsuarioId = null;
  document.getElementById('modal-usuario-titulo').textContent = 'Novo Usuário';
  document.getElementById('input-usuario-nome').value   = '';
  document.getElementById('input-usuario-tipo').value   = 'usuario';
  document.getElementById('input-usuario-cr').value     = '';
  document.getElementById('input-usuario-grupo').value  = '';
  document.getElementById('select-usuario-grupo-wrap').style.display = 'none';
  popularSelectCRsModal();
  abrirModal('modal-usuario');
}

function abrirModalEditarUsuario(usuarioId) {
  if (!guardAdm()) return;
  const u = DB.getUsuarioById(usuarioId);
  if (!u) return;
  editarUsuarioId = usuarioId;
  document.getElementById('modal-usuario-titulo').textContent = 'Editar Usuário';
  document.getElementById('input-usuario-nome').value  = u.nome;
  document.getElementById('input-usuario-tipo').value  = u.tipo;
  document.getElementById('input-usuario-cr').value    = u.crId;
  popularSelectCRsModal();
  onChangeCRModal();
  document.getElementById('input-usuario-grupo').value = u.grupoId || '';
  abrirModal('modal-usuario');
}

function popularSelectCRsModal() {
  const sel = document.getElementById('input-usuario-cr');
  sel.innerHTML = '<option value="">— Selecione o CR —</option>';
  DB.getCRs().forEach(cr => {
    sel.innerHTML += `<option value="${cr.id}">${esc(cr.nome)}</option>`;
  });
}

function onChangeCRModal() {
  const crId = document.getElementById('input-usuario-cr').value;
  const tipo  = document.getElementById('input-usuario-tipo').value;
  const wrap  = document.getElementById('select-usuario-grupo-wrap');
  const sel   = document.getElementById('input-usuario-grupo');

  if (crId && tipo === 'usuario') {
    wrap.style.display = 'block';
    sel.innerHTML = '<option value="">— Selecione o Grupo —</option>';
    DB.getGrupos(crId).forEach(g => {
      sel.innerHTML += `<option value="${g.id}">${esc(g.nome)}</option>`;
    });
  } else {
    wrap.style.display = 'none';
    sel.value = '';
  }
}

function salvarUsuarioModal() {
  const nome    = document.getElementById('input-usuario-nome').value.trim();
  const tipo    = document.getElementById('input-usuario-tipo').value;
  const crId    = document.getElementById('input-usuario-cr').value;
  const grupoId = document.getElementById('input-usuario-grupo').value || null;

  if (!nome)  { showToast('Informe o nome.', 'warning'); return; }
  if (!crId)  { showToast('Selecione o CR.', 'warning'); return; }
  if (tipo === 'usuario' && !grupoId) {
    showToast('Selecione o grupo do usuário.', 'warning'); return;
  }

  if (editarUsuarioId) {
    DB.editarUsuario(editarUsuarioId, {
      nome, tipo, crId,
      grupoId: tipo === 'adm' ? null : grupoId
    });
    showToast('Usuário atualizado!');
  } else {
    DB.criarUsuario(nome, tipo, crId, tipo === 'adm' ? null : grupoId);
    showToast('Usuário criado!');
  }

  fecharModal('modal-usuario');
  renderUsuariosConfig();
  renderListaUsuariosLogin();
}

function deletarUsuario(usuarioId) {
  if (!guardAdm()) return;
  mostrarConfirmacao('Excluir Usuário', 'Deseja realmente excluir este usuário?', 'Excluir', () => {
    DB.deletarUsuario(usuarioId);
    showToast('Usuário removido.', 'info');
    renderUsuariosConfig();
  });
}

function renderUsuariosConfig() {
  const container = document.getElementById('lista-usuarios-config');
  if (!container) return;
  container.innerHTML = '';
  const usuario = DB.usuarioLogado();
  const usuarios = DB.getUsuarios();

  if (!usuarios.length) {
    container.innerHTML = '<p class="empty-msg">Nenhum usuário cadastrado ainda.</p>';
    return;
  }

  usuarios.forEach(u => {
    const crNome    = DB.getCRs().find(c => c.id === u.crId)?.nome || '—';
    const grupoNome = u.grupoId
      ? DB.getGrupos(u.crId).find(g => g.id === u.grupoId)?.nome || '—'
      : '—';

    const div = document.createElement('div');
    div.className = 'cat-item';
    div.innerHTML = `
      <div>
        <div class="cat-nome">${esc(u.nome)}
          <span class="login-user-tipo ${u.tipo === 'adm' ? 'tipo-adm' : 'tipo-usuario'}" style="margin-left:6px;">
            ${u.tipo === 'adm' ? 'ADM' : 'Usuário'}
          </span>
        </div>
        <div style="font-size:11px;color:#9CA3AF;margin-top:2px;">
          ${crNome} ${u.tipo !== 'adm' ? `· ${grupoNome}` : ''}
        </div>
      </div>
      <div class="cat-acoes">
        <button class="btn-secondary" style="font-size:11px;padding:4px 10px;"
          onclick="abrirModalEditarUsuario('${u.id}')">Editar</button>
        <button class="btn-icon-danger"
          onclick="deletarUsuario('${u.id}')"
          ${u.id === usuario?.id ? 'disabled title="Não pode excluir a si mesmo"' : ''}>
          Remover
        </button>
      </div>`;
    container.appendChild(div);
  });
}
