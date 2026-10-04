/* =========================================================================
 * storage.js — Salvamento no navegador (localStorage)
 * -------------------------------------------------------------------------
 * Sem servidor e sem banco de dados: tudo fica no navegador do aluno.
 * Se o localStorage estiver bloqueado (janela anônima, por exemplo), o app
 * continua funcionando — só não lembra do progresso.
 * ========================================================================= */
(function (root) {
  'use strict';

  const KEY = 'jornada-tartaruga:v1';
  const MAX_DRAWINGS = 30;

  function defaults() {
    return {
      version: 1,
      levels: {},        // { [id]: { stars, completed, size } }
      attempts: {},      // { [id]: nº de tentativas erradas antes de concluir }
      achievements: {},  // { [id]: data ISO }
      lessons: {},       // { [id]: true }
      codes: {},         // último código de cada lugar (nível, aula, modo livre)
      drawings: [],      // desenhos do modo livre: { id, name, code, thumb, date }
      galleryRuns: [],   // ids dos exemplos executados
      unlockAll: false,  // Modo Professor: liberar todos os níveis
      settings: {
        speed: 'normal', grid: true, ghost: true, highlight: true, arc: true,
        theme: 'auto', fontSize: 16, penColor: '', penWidth: 3, continueDrawing: false,
      },
    };
  }

  function merge(base, saved) {
    const out = Object.assign({}, base, saved);
    out.settings = Object.assign({}, base.settings, saved && saved.settings);
    return out;
  }

  const Store = {
    data: defaults(),
    available: true,

    load() {
      try {
        const raw = root.localStorage.getItem(KEY);
        this.data = raw ? merge(defaults(), JSON.parse(raw)) : defaults();
      } catch (e) {
        this.available = false;
        this.data = defaults();
      }
      return this.data;
    },

    save() {
      try {
        root.localStorage.setItem(KEY, JSON.stringify(this.data));
        return true;
      } catch (e) {
        this.available = false;
        return false;
      }
    },

    reset() {
      const keepSettings = this.data.settings;
      this.data = defaults();
      this.data.settings = keepSettings;
      this.save();
    },

    get settings() { return this.data.settings; },

    level(id) { return this.data.levels[id] || { stars: 0, completed: false }; },

    /** Guarda o resultado de um nível (mantém a melhor marca). */
    recordLevel(id, stars, size) {
      const prev = this.level(id);
      this.data.levels[id] = {
        completed: true,
        stars: Math.max(prev.stars || 0, stars),
        size: prev.size ? Math.min(prev.size, size) : size,
      };
      this.save();
    },

    isUnlocked(levels, index) {
      if (this.data.unlockAll || index === 0) return true;
      return this.level(levels[index - 1].id).completed;
    },

    code(key, fallback) {
      const c = this.data.codes[key];
      return typeof c === 'string' ? c : (fallback || '');
    },

    setCode(key, code) {
      this.data.codes[key] = code;
      this.save();
    },

    addDrawing(d) {
      this.data.drawings.unshift(d);
      this.data.drawings = this.data.drawings.slice(0, MAX_DRAWINGS);
      return this.save();
    },

    removeDrawing(id) {
      this.data.drawings = this.data.drawings.filter((d) => d.id !== id);
      this.save();
    },
  };

  root.Store = Store;
  if (typeof module === 'object' && module.exports) module.exports = Store;
})(typeof window !== 'undefined' ? window : globalThis);
