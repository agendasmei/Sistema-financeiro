const DB = {
  get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),

  getCRs: () => DB.get('crs'),
  saveCRs: (data) => DB.set('crs', data),

  getGrupos: (crId) => DB.get(`grupos_${crId}`),
  saveGrupos: (crId, data) => DB.set(`grupos_${crId}`, data),

  getReunioes: (grupoId) => DB.get(`reunioes_${grupoId}`),
  saveReunioes: (grupoId, data) => DB.set(`reunioes_${grupoId}`, data),

  getItens: (reuniaoId) => DB.get(`itens_${reuniaoId}`),
  saveItens: (reuniaoId, data) => DB.set(`itens_${reuniaoId}`, data),
};
