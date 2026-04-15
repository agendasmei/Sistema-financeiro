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

  // ── Eventos (antigo "reuniões") — vinculados ao grupo ──
  getEventos: (grupoId) => DB.get(`eventos_${grupoId}`),
  saveEventos: (grupoId, data) => DB.set(`eventos_${grupoId}`, data),

  // ── Itens do Grupo (nova estrutura planilha) ──
  // Cada item: { id, categoria, descricao, fornecedor, vlrUnitario, qtd, vlrTotal, nrPedido, eventos: { [evId]: { valor, nrNF, as, pago } } }
  getItensGrupo: (grupoId) => DB.get(`itens_grupo_${grupoId}`),
  saveItensGrupo: (grupoId, data) => DB.set(`itens_grupo_${grupoId}`, data),

  // ── Categorias Padrão (globais) ──
  getCategoriasPadrao: () => {
    const salvas = DB.get('categorias_padrao');
    if (salvas.length > 0) return salvas;
    const padrao = [
      { id: 'cat_1', nome: 'Buffet', ativo: true },
      { id: 'cat_2', nome: 'Ambulância', ativo: true },
      { id: 'cat_3', nome: 'Follow Up', ativo: true },
      { id: 'cat_4', nome: 'Recepcionista', ativo: true },
      { id: 'cat_5', nome: 'Montagem', ativo: true },
      { id: 'cat_6', nome: 'Hospedagem', ativo: true },
      { id: 'cat_7', nome: 'Passagens Aéreas', ativo: true },
      { id: 'cat_8', nome: 'Materiais de Escritório', ativo: true },
      { id: 'cat_9', nome: 'Recepção', ativo: true },
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
};
