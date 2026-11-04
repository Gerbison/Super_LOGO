/* =========================================================================
 * relatorio.js — "Terminar e Entregar": relatório em PDF para o professor
 * -------------------------------------------------------------------------
 * Gera, no próprio navegador (sem servidor e sem biblioteca externa), um PDF
 * com: nome do aluno, fase alcançada (desafio, reino e estágio), total de
 * estrelas, código de progresso (para o professor conferir) e um cartão
 * para cada desafio CONCLUÍDO, com o ícone e as estrelas ganhas (cartões compactos).
 *
 *   Relatorio.dadosEntrega(data)         → resumo (puro, testável no Node)
 *   Relatorio.gerarPDF(dados, imagens)   → Uint8Array com o PDF
 *   Relatorio.imagensDosDesafios(lista)  → JPEGs dos ícones dos desafios (navegador)
 *
 * O gerador de PDF (PdfDoc) é mínimo: páginas A4, fontes Helvetica padrão
 * (texto em WinAnsi, com acentos do português), retângulos, estrelas
 * vetoriais e imagens JPEG.
 * ========================================================================= */
(function (root) {
  'use strict';

  /* ----------------------------- PDF mínimo ----------------------------- */
  const A4 = { w: 595.28, h: 841.89 };

  // Caracteres fora do Latin-1 que existem na codificação WinAnsi
  const WIN_ANSI = { '€': 128, '‚': 130, '„': 132, '…': 133, '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151, '™': 153 };

  /** Texto → bytes WinAnsi, já escapado para dentro de ( ) no PDF. */
  function pdfText(str) {
    let out = '';
    for (const ch of String(str)) {
      let c = WIN_ANSI[ch] !== undefined ? WIN_ANSI[ch] : ch.codePointAt(0);
      if (c > 255) c = 63; // '?' para o que não existe na fonte (emojis etc.)
      if (c === 40 || c === 41 || c === 92) out += '\\' + String.fromCharCode(c);
      else if (c < 32 || c > 126) out += '\\' + c.toString(8).padStart(3, '0');
      else out += String.fromCharCode(c);
    }
    return out;
  }

  /** Largura aproximada do texto em Helvetica (para cortar títulos longos). */
  function textWidth(str, size, bold) {
    return String(str).length * size * (bold ? 0.56 : 0.52);
  }

  function fitText(str, size, maxW, bold) {
    str = String(str);
    if (textWidth(str, size, bold) <= maxW) return str;
    while (str.length > 1 && textWidth(str + '…', size, bold) > maxW) str = str.slice(0, -1);
    return str.trim() + '…';
  }

  const num = (v) => (Math.round(v * 100) / 100).toString();
  const rgb = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => num(v / 255)).join(' ');
  };

  class PdfDoc {
    constructor() {
      this.pages = [];
      this.images = [];
      this.page = null;
    }

    addPage() {
      this.page = { ops: [], imgs: new Set() };
      this.pages.push(this.page);
      return this.page;
    }

    /** y é medido do TOPO da página (mais natural para montar o layout). */
    text(x, y, str, { size = 11, bold = false, color = '#1e293b' } = {}) {
      this.page.ops.push(`BT /${bold ? 'F2' : 'F1'} ${num(size)} Tf ${rgb(color)} rg ${num(x)} ${num(A4.h - y)} Td (${pdfText(str)}) Tj ET`);
    }

    rect(x, y, w, h, { fill = null, stroke = null, lineWidth = 1 } = {}) {
      const ops = [];
      if (fill) ops.push(`${rgb(fill)} rg`);
      if (stroke) ops.push(`${rgb(stroke)} RG ${num(lineWidth)} w`);
      ops.push(`${num(x)} ${num(A4.h - y - h)} ${num(w)} ${num(h)} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`);
      this.page.ops.push(ops.join(' '));
    }

    /** Estrela de 5 pontas (cheia = ganha, vazada = não ganha). */
    star(cx, cy, r, filled) {
      const pts = [];
      for (let k = 0; k < 10; k++) {
        const a = (-90 + k * 36) * Math.PI / 180;
        const rr = k % 2 ? r * 0.45 : r;
        pts.push([cx + Math.cos(a) * rr, A4.h - (cy + Math.sin(a) * rr)]);
      }
      const path = pts.map((p, i) => `${num(p[0])} ${num(p[1])} ${i ? 'l' : 'm'}`).join(' ') + ' h';
      this.page.ops.push(filled ? `${rgb('#f5b301')} rg ${rgb('#b7791f')} RG 0.6 w ${path} B` : `${rgb('#94a3b8')} RG 0.8 w ${path} S`);
    }

    /** Círculo cheio (aproximado por 4 curvas de Bézier). */
    circle(cx, cy, r, fill) {
      const k = 0.5523 * r, X = cx, Y = A4.h - cy;
      this.page.ops.push(`${rgb(fill)} rg ${num(X + r)} ${num(Y)} m ${num(X + r)} ${num(Y + k)} ${num(X + k)} ${num(Y + r)} ${num(X)} ${num(Y + r)} c ${num(X - k)} ${num(Y + r)} ${num(X - r)} ${num(Y + k)} ${num(X - r)} ${num(Y)} c ${num(X - r)} ${num(Y - k)} ${num(X - k)} ${num(Y - r)} ${num(X)} ${num(Y - r)} c ${num(X + k)} ${num(Y - r)} ${num(X + r)} ${num(Y - k)} ${num(X + r)} ${num(Y)} c f`);
    }

    /** Registra um JPEG ({ bytes, w, h }) e devolve o nome para drawImage. */
    addImage(img) {
      this.images.push(img);
      return 'Im' + this.images.length;
    }

    drawImage(name, x, y, w, h) {
      this.page.imgs.add(name);
      this.page.ops.push(`q ${num(w)} 0 0 ${num(h)} ${num(x)} ${num(A4.h - y - h)} cm /${name} Do Q`);
    }

    /** Monta o arquivo PDF (bytes). */
    build() {
      const chunks = [];
      let size = 0;
      const offsets = [];
      const pushStr = (s) => {
        const b = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 255;
        chunks.push(b); size += b.length;
      };
      const pushBytes = (b) => { chunks.push(b); size += b.length; };
      const begin = (n) => { offsets[n] = size; pushStr(`${n} 0 obj\n`); };

      // números dos objetos: 1 catálogo, 2 páginas, 3-4 fontes, imagens, páginas e conteúdos
      const imgBase = 5;
      const pageBase = imgBase + this.images.length;
      const total = pageBase + this.pages.length * 2 - 1;

      pushStr('%PDF-1.4\n%âãÏÓ\n');
      begin(1); pushStr('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
      const kids = this.pages.map((_, i) => `${pageBase + i * 2} 0 R`).join(' ');
      begin(2); pushStr(`<< /Type /Pages /Kids [${kids}] /Count ${this.pages.length} >>\nendobj\n`);
      begin(3); pushStr('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n');
      begin(4); pushStr('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n');
      this.images.forEach((img, i) => {
        begin(imgBase + i);
        pushStr(`<< /Type /XObject /Subtype /Image /Width ${img.w} /Height ${img.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.bytes.length} >>\nstream\n`);
        pushBytes(img.bytes);
        pushStr('\nendstream\nendobj\n');
      });
      this.pages.forEach((pg, i) => {
        const pageObj = pageBase + i * 2;
        const xobj = [...pg.imgs].map((name) => `/${name} ${imgBase + Number(name.slice(2)) - 1} 0 R`).join(' ');
        begin(pageObj);
        pushStr(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(A4.w)} ${num(A4.h)}] ` +
          `/Resources << /Font << /F1 3 0 R /F2 4 0 R >>${xobj ? ` /XObject << ${xobj} >>` : ''} >> /Contents ${pageObj + 1} 0 R >>\nendobj\n`);
        const content = pg.ops.join('\n');
        begin(pageObj + 1);
        pushStr(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
      });

      const xref = size;
      let x = `xref\n0 ${total + 1}\n0000000000 65535 f \n`;
      for (let n = 1; n <= total; n++) x += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
      pushStr(x + `trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

      const out = new Uint8Array(size);
      let o = 0;
      for (const c of chunks) { out.set(c, o); o += c.length; }
      return out;
    }
  }

  /* ------------------------- Dados da entrega -------------------------- */
  /**
   * Resumo do progresso para o professor.
   * data = Store.data. Usa Levels, Cultivo e Progresso (globais).
   */
  function dadosEntrega(data) {
    const { Levels, Cultivo, Progresso, TUTORIAL } = root;
    const jornada = Cultivo.orderedLevels();
    const concluidos = jornada
      .filter((l) => data.levels[l.id] && data.levels[l.id].completed)
      .map((l) => {
        const w = Cultivo.onde(l.id);
        return {
          level: l, id: l.id, numero: Cultivo.numero(l.id),
          stars: data.levels[l.id].stars || 0, max: Levels.maxStarsOf(l),
          reino: w.reino, estagio: w.estagio,
        };
      });
    const ultimo = concluidos[concluidos.length - 1] || null;
    const sit = Cultivo.situacao(data);
    return {
      nome: (data.nome || '').trim() || 'Sem nome',
      geradoEm: new Date(),
      concluidos,
      totalDesafios: jornada.length,
      totalEstrelas: concluidos.reduce((s, c) => s + c.stars, 0),
      maxEstrelas: jornada.reduce((s, l) => s + Levels.maxStarsOf(l), 0),
      alcancado: ultimo, // desafio mais avançado concluído (na ordem da jornada)
      situacao: sit,
      codigo: Progresso.gerarCodigo(data, Levels.LEVELS, TUTORIAL || []),
    };
  }

  /** Nome do arquivo: Jornada-Tartaruga_Nome-do-Aluno_2026-11-04.pdf */
  function nomeArquivo(dados) {
    const slug = dados.nome.normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'Aluno';
    const d = dados.geradoEm;
    const data = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return `Jornada-Tartaruga_${slug}_${data}.pdf`;
  }

  /* ------------------------------ O relatório --------------------------- */
  const COR = { azul: '#0c2657', azul2: '#1d4ed8', texto: '#1e293b', cinza: '#64748b', borda: '#cbd5e1', fundo: '#f1f5f9', verde: '#15803d' };

  function dataHora(d) {
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} às ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  /**
   * Monta o PDF. imagens = { [id]: { bytes, w, h } } (JPEG do ícone);
   * se faltar a imagem de um desafio, o cartão sai sem ela.
   */
  function gerarPDF(dados, imagens) {
    imagens = imagens || {};
    const doc = new PdfDoc();
    const M = 40; // margem
    const W = A4.w - 2 * M;

    /* --------- página 1: cabeçalho e resumo --------- */
    doc.addPage();
    doc.rect(0, 0, A4.w, 92, { fill: COR.azul });
    doc.text(M, 42, 'Jornada da Tartaruga', { size: 22, bold: true, color: '#ffffff' });
    doc.text(M, 66, 'Relatório de progresso — O Dao dos Algoritmos', { size: 12, color: '#bfdbfe' });
    doc.text(A4.w - M - 150, 66, 'Gerado em ' + dataHora(dados.geradoEm), { size: 9, color: '#bfdbfe' });

    let y = 124;
    const linha = (rotulo, valor, opts) => {
      doc.text(M, y, rotulo, { size: 11, bold: true, color: COR.cinza });
      doc.text(M + 150, y, fitText(valor, (opts && opts.size) || 12, W - 150, opts && opts.bold), Object.assign({ size: 12, color: COR.texto }, opts));
      y += 24;
    };
    linha('Nome do aluno', dados.nome, { size: 14, bold: true });
    if (dados.alcancado) {
      const a = dados.alcancado;
      linha('Fase alcançada', `Desafio ${a.numero} de ${dados.totalDesafios} — ${a.level.title}`, { bold: true });
      linha('', `Reino ${a.reino.id}: ${a.reino.nome} — ${a.estagio.nome}`);
    } else {
      linha('Fase alcançada', 'Nenhum desafio concluído ainda');
    }
    linha('Título de cultivo', dados.situacao.titulo, { size: 11 });
    linha('Desafios concluídos', `${dados.concluidos.length} de ${dados.totalDesafios}`);

    // destaque: total de estrelas
    y += 4;
    doc.rect(M, y, W, 46, { fill: '#fef9c3', stroke: '#facc15', lineWidth: 1 });
    doc.star(M + 26, y + 23, 13, true);
    doc.text(M + 48, y + 20, 'Total de estrelas', { size: 11, bold: true, color: '#854d0e' });
    doc.text(M + 48, y + 37, `${dados.totalEstrelas} de ${dados.maxEstrelas} estrelas possíveis`, { size: 14, bold: true, color: COR.texto });
    y += 62;

    doc.text(M, y, 'Código de progresso (para conferência do professor):', { size: 9, color: COR.cinza });
    doc.text(M, y + 14, dados.codigo, { size: 10, bold: true, color: COR.texto });
    y += 40;

    /* --------- cartões dos desafios concluídos --------- */
    doc.text(M, y, 'Desafios concluídos', { size: 15, bold: true, color: COR.azul });
    y += 12;
    doc.rect(M, y, W, 1.2, { fill: COR.azul2 });
    y += 14;

    if (!dados.concluidos.length) {
      doc.text(M, y + 10, 'Nenhum desafio concluído ainda.', { size: 12, color: COR.cinza });
    }

    // Cartões compactos (como no mapa): número, ícone, título, forma e estrelas.
    // Ordem: de cima para baixo em cada coluna, 3 colunas por página.
    const COLS = 3, GAP = 10, CH = 56, VGAP = 7;
    const CW = (W - GAP * (COLS - 1)) / COLS;
    const nomes = new Map(); // mesma imagem de ícone entra uma vez só no arquivo
    const cartao = (c, x, cy) => {
      doc.rect(x, cy, CW, CH, { fill: '#ffffff', stroke: COR.borda, lineWidth: 0.8 });
      doc.rect(x, cy, 3, CH, { fill: COR.verde });
      doc.circle(x + 18, cy + CH / 2, 10, COR.verde);
      const nTxt = String(c.numero);
      doc.text(x + 18 - textWidth(nTxt, 9, true) / 2, cy + CH / 2 + 3.2, nTxt, { size: 9, bold: true, color: '#ffffff' });
      const ix = x + 34, iz = 22;
      const img = imagens[c.id];
      if (img) {
        if (!nomes.has(img)) nomes.set(img, doc.addImage(img));
        doc.drawImage(nomes.get(img), ix, cy + (CH - iz) / 2, iz, iz);
      }
      const tx = ix + iz + 7, tw = CW - (tx - x) - 6;
      // título em até 2 linhas
      const palavras = c.level.title.split(' ');
      let l1 = '';
      while (palavras.length && textWidth((l1 + ' ' + palavras[0]).trim(), 8.5, true) <= tw) l1 = (l1 + ' ' + palavras.shift()).trim();
      const l2 = palavras.length ? fitText(palavras.join(' '), 8.5, tw, true) : '';
      const ty = l2 ? cy + 12 : cy + 17;
      doc.text(tx, ty, l1 || fitText(c.level.title, 8.5, tw, true), { size: 8.5, bold: true, color: COR.texto });
      if (l2) doc.text(tx, ty + 10, l2, { size: 8.5, bold: true, color: COR.texto });
      doc.text(tx, cy + 34, fitText(c.level.shape || `Reino ${c.reino.id}`, 7.5, tw), { size: 7.5, color: COR.cinza });
      for (let k = 0; k < c.max; k++) doc.star(tx + 5 + k * 11, cy + 45, 4.6, k < c.stars);
      doc.text(tx + c.max * 11 + 3, cy + 48, `${c.stars}/${c.max}`, { size: 7.5, bold: true, color: COR.texto });
    };

    let resto = dados.concluidos.slice();
    while (resto.length) {
      const linhas = Math.max(1, Math.floor((A4.h - 50 - y + VGAP) / (CH + VGAP)));
      const lote = resto.slice(0, linhas * COLS);
      resto = resto.slice(lote.length);
      const usadas = Math.ceil(lote.length / COLS);
      lote.forEach((c, i) => {
        const col = Math.floor(i / usadas), lin = i % usadas;
        cartao(c, M + col * (CW + GAP), y + lin * (CH + VGAP));
      });
      if (resto.length) {
        doc.addPage();
        doc.rect(0, 0, A4.w, 40, { fill: COR.azul });
        doc.text(M, 26, fitText(`Jornada da Tartaruga — ${dados.nome} (continuação)`, 12, W, true), { size: 12, bold: true, color: '#ffffff' });
        y = 60;
      }
    }

    // rodapé com numeração em todas as páginas
    const totalPags = doc.pages.length;
    doc.pages.forEach((pg, i) => {
      doc.page = pg;
      doc.text(M, A4.h - 24, `Jornada da Tartaruga · ${fitText(dados.nome, 9, 250)}`, { size: 8, color: COR.cinza });
      doc.text(A4.w - M - 60, A4.h - 24, `Página ${i + 1} de ${totalPags}`, { size: 8, color: COR.cinza });
    });
    return doc.build();
  }

  /* ---------------------- Imagens (só no navegador) --------------------- */
  function base64ParaBytes(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  /** Ícone (emoji) de cada desafio concluído como JPEG pequeno; ícones iguais são reaproveitados. */
  function imagensDosDesafios(concluidos) {
    const imgs = {}, cache = {};
    concluidos.forEach((c) => {
      const icon = c.level.icon || '🐢';
      if (!cache[icon]) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 48;
        const g = canvas.getContext('2d');
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, 48, 48);
        g.font = '36px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
        g.fillStyle = '#1d4ed8'; // símbolos de texto (▭ △ ○) saem em azul
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(icon, 24, 27);
        const url = canvas.toDataURL('image/jpeg', 0.9);
        cache[icon] = { bytes: base64ParaBytes(url.split(',')[1]), w: 48, h: 48 };
      }
      imgs[c.id] = cache[icon];
    });
    return imgs;
  }

  const api = { PdfDoc, dadosEntrega, gerarPDF, imagensDosDesafios, nomeArquivo, pdfText };
  root.Relatorio = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
