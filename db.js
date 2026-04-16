const DB = {
  get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),

  // ── CRs ──
  getCRs: () => DB.get('crs'),
  saveCRs: (data) => DB.set('crs', data),

  // ── Orçamento do CR ──
  getOrcamento: (crId) => parseFloat(localStorage.getItem(`orcamento_${crId}`)) || 0,
  saveOrcamento: (crId, valor) => localStorage.setItem(`orcamento_${crId}`, valor),

  // ── Grupos ──
  getGrupos: (crId) => DB.get(`grupos_${crId}`),
  saveGrupos: (crId, data) => DB.set(`grupos_${crId}`, data),

  // ── Eventos ──
  getEventos: (grupoId) => DB.get(`eventos_${grupoId}`),
  saveEventos: (grupoId, data) => DB.set(`eventos_${grupoId}`, data),

  // ── Itens do Grupo ──
  getItensGrupo: (grupoId) => DB.get(`itens_grupo_${grupoId}`),
  saveItensGrupo: (grupoId, data) => DB.set(`itens_grupo_${grupoId}`, data),

  // ── Categorias Padrão (globais) ──
  getCategoriasPadrao: () => {
    const salvas = DB.get('categorias_padrao');
    if (salvas.length > 0) return salvas;
    const padrao = [
      { id: 'cat_1', nome: 'Buffet',                  ativo: true },
      { id: 'cat_2', nome: 'Ambulância',               ativo: true },
      { id: 'cat_3', nome: 'Follow Up',                ativo: true },
      { id: 'cat_4', nome: 'Recepcionista',            ativo: true },
      { id: 'cat_5', nome: 'Montagem',                 ativo: true },
      { id: 'cat_6', nome: 'Hospedagem',               ativo: true },
      { id: 'cat_7', nome: 'Passagens Aéreas',         ativo: true },
      { id: 'cat_8', nome: 'Materiais de Escritório',  ativo: true },
      { id: 'cat_9', nome: 'Recepção',                 ativo: true },
    ];
    DB.set('categorias_padrao', padrao);
    return padrao;
  },
  saveCategoriasPadrao: (data) => DB.set('categorias_padrao', data),

  // ── Categorias extras por CR ──
  getCategoriasExtrasCR: (crId) => DB.get(`categorias_cr_${crId}`),
  saveCategoriasExtrasCR: (crId, data) => DB.set(`categorias_cr_${crId}`, data),

  // ── Categorias desativadas por CR ──
  getCategoriasDesativadasCR: (crId) => DB.get(`cats_desativadas_cr_${crId}`),
  saveCategoriasDesativadasCR: (crId, data) => DB.set(`cats_desativadas_cr_${crId}`, data),

  // ── Categorias disponíveis para um CR ──
  getCategoriasDisponiveis: (crId) => {
    const desativadas = DB.getCategoriasDesativadasCR(crId);
    const padrao = DB.getCategoriasPadrao()
      .filter(c => c.ativo && !desativadas.includes(c.id));
    const extras = DB.getCategoriasExtrasCR(crId).filter(c => c.ativo);
    return [...padrao, ...extras];
  },

  // ══════════════════════════════════════════
  // USUÁRIOS
  // usuario: { id, nome, tipo: 'adm'|'usuario', crId, grupoId }
  // tipo 'adm'     → acesso total ao CR
  // tipo 'usuario' → acesso apenas ao próprio grupo
  // ══════════════════════════════════════════
  getUsuarios: () => DB.get('usuarios'),
  saveUsuarios: (data) => DB.set('usuarios', data),

  getUsuarioById: (id) => DB.getUsuarios().find(u => u.id === id) || null,

  criarUsuario: (nome, tipo, crId, grupoId = null) => {
    const usuarios = DB.getUsuarios();
    const novo = {
      id:      '_u' + Math.random().toString(36).substr(2, 9),
      nome,
      tipo,        // 'adm' | 'usuario'
      crId,        // CR ao qual pertence
      grupoId,     // null se ADM, id do grupo se usuário comum
    };
    usuarios.push(novo);
    DB.saveUsuarios(usuarios);
    return novo;
  },

  editarUsuario: (id, dados) => {
    const usuarios = DB.getUsuarios().map(u => u.id === id ? { ...u, ...dados } : u);
    DB.saveUsuarios(usuarios);
  },

  deletarUsuario: (id) => {
    DB.saveUsuarios(DB.getUsuarios().filter(u => u.id !== id));
  },

  getUsuariosDoCR: (crId) => DB.getUsuarios().filter(u => u.crId === crId),

  // ══════════════════════════════════════════
  // SESSÃO
  // Guarda o id do usuário logado no sessionStorage
  // (some ao fechar o navegador)
  // ══════════════════════════════════════════
  getSessao: () => {
    const raw = sessionStorage.getItem('sessao_usuario');
    return raw ? JSON.parse(raw) : null;
  },

  salvarSessao: (usuario) => {
    sessionStorage.setItem('sessao_usuario', JSON.stringify(usuario));
  },

  limparSessao: () => {
    sessionStorage.removeItem('sessao_usuario');
  },

  usuarioLogado: () => {
    const sessao = DB.getSessao();
    if (!sessao) return null;
    return DB.getUsuarioById(sessao.id);
  },

  // ══════════════════════════════════════════
  // PERMISSÕES
  // ══════════════════════════════════════════
  isAdm: () => {
    const u = DB.usuarioLogado();
    return u?.tipo === 'adm';
  },

  podeVerGrupo: (grupoId) => {
    const u = DB.usuarioLogado();
    if (!u) return false;
    if (u.tipo === 'adm') return true;
    return u.grupoId === grupoId;
  },

  podeEditarGrupo: (grupoId) => {
    const u = DB.usuarioLogado();
    if (!u) return false;
    if (u.tipo === 'adm') return true;
    return u.grupoId === grupoId;
  },
};
