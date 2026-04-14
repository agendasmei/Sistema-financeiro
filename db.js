const DB = {
  get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  getStr: (key) => localStorage.getItem(key) || '',
  setStr: (key, value) => localStorage.setItem(key, value),

  getCRs: () => DB.get('crs'),
  saveCRs: (data) => DB.set('crs', data),

  getOrcamento: (crId) => parseFloat(localStorage.getItem(`orcamento_${crId}`)) || 0,
  saveOrcamento: (crId, valor) => localStorage.setItem(`orcamento_${crId}`, valor),

  getGrupos: (crId) => DB.get(`grupos_${crId}`),
  saveGrupos: (crId, data) => DB.set(`grupos_${crId}`, data),

  getReunioes: (grupoId) => DB.get(`reunioes_${grupoId}`),
  saveReunioes: (grupoId, data) => DB.set(`reunioes_${grupoId}`, data),

  getItens: (reuniaoId) => DB.get(`itens_${reuniaoId}`),
  saveItens: (reuniaoId, data) => DB.set(`itens_${reuniaoId}`, data),

  // Categorias padrão (globais)
  getCategoriasPadrao: () => {
    const salvas = DB.get('categorias_padrao');
    if (salvas.length > 0) return salvas;
    const padrao = [
      { id: 'cat_1', nome: 'Buffet', ativo: true },
      { id: 'cat_2', nome: 'Ambulancia', ativo: true },
      { id: 'cat_3', nome: 'Follow Up', ativo: true },
      { id: 'cat_4', nome: 'Recepcionista', ativo: true },
      { id: 'cat_5', nome: 'Montagem', ativo: true },
      { id: 'cat_6', nome: 'Hospedagem', ativo: true },
      { id: 'cat_7', nome: 'Passagens Aereas', ativo: true },
    ];
    DB.set('categorias_padrao', padrao);
    return padrao;
  },
  saveCategoriasPadrao: (data) => DB.set('categorias_padrao', data),

  // Categorias extras por grupo
  getCategoriasGrupo: (grupoId) => DB.get(`categorias_grupo_${grupoId}`),
  saveCategoriasGrupo: (grupoId, data) => DB.set(`categorias_grupo_${grupoId}`, data),

  // Todas as categorias ativas de um grupo (padrão + grupo)
  getCategoriasDisponiveis: (grupoId) => {
    const padrao = DB.getCategoriasPadrao().filter(c => c.ativo);
    const extras = DB.getCategoriasGrupo(grupoId).filter(c => c.ativo);
    return [...padrao, ...extras];
  },
};
