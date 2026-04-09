import mermaid from 'mermaid';

const EXPORT_FONT_PX = 28;
const EXPORT_EDGE_FONT_PX = 28;

/**
 * Diagramas grandes com `width="100%"` encolhem no navegador/draw.io até o texto sumir.
 * Usa as dimensões do viewBox como tamanho intrínseco (rolagem + zoom legível).
 */
function fixSvgIntrinsicSize(svg: string): string {
  const open = svg.match(/^<svg\s([^>]*?)>/);
  if (!open) return svg;
  const attrStr = open[1];
  if (!attrStr.includes('width="100%"')) return svg;

  const vbMatch = attrStr.match(/viewBox="([\d.+\-\s]+)"/);
  if (!vbMatch) return svg;
  const parts = vbMatch[1]
    .trim()
    .split(/\s+/)
    .map((s) => Number.parseFloat(s))
    .filter((n) => !Number.isNaN(n));
  if (parts.length < 4) return svg;
  const vbW = parts[2];
  const vbH = parts[3];

  let next = attrStr.replace(/width="100%"/, `width="${vbW}"`);
  next = next.replace(/\s+style="[^"]*"/, '');
  if (!/\bheight="/.test(next)) {
    next = `${next} height="${vbH}"`;
  }
  return svg.replace(/^<svg\s[^>]*?>/, `<svg ${next}>`);
}

/** Ajusta tamanhos fixos no CSS embutido do SVG (tema ER). */
function bumpErSvgFontSizes(svg: string): string {
  return svg
    .replace(/font-size:\s*14px/gi, `font-size: ${EXPORT_EDGE_FONT_PX}px`)
    .replace(/font-size:\s*12px/gi, 'font-size: 22px')
    .replace(/font-size:\s*16px/gi, `font-size: ${EXPORT_FONT_PX}px`)
    .replace(/font-size:\s*18px/gi, `font-size: ${EXPORT_FONT_PX}px`)
    .replace(/font-size:\s*20px/gi, `font-size: ${EXPORT_FONT_PX}px`)
    .replace(/font-size:\s*24px/gi, `font-size: ${EXPORT_FONT_PX}px`);
}

let mermaidConfigured = false;

function ensureMermaidInit() {
  if (mermaidConfigured) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'strict',
    themeVariables: {
      fontSize: `${EXPORT_FONT_PX}px`,
    },
    themeCSS: `
      .edgeLabel .label { font-size: ${EXPORT_EDGE_FONT_PX}px !important; }
      .edgeLabel text { font-size: ${EXPORT_EDGE_FONT_PX}px !important; }
    `,
    er: {
      /** false = width/height em px alinhados ao viewBox; export abre legível (rolar/zoom). */
      useMaxWidth: false,
      nodeSpacing: 240,
      rankSpacing: 130,
    },
  });
  mermaidConfigured = true;
}

/** Gera o markup SVG a partir de um texto `erDiagram` (sem inserir no DOM). */
export async function renderMermaidErSvg(definition: string): Promise<string> {
  ensureMermaidInit();
  const graphId = `er-${crypto.randomUUID().replace(/-/g, '')}`;
  const { svg } = await mermaid.render(graphId, definition.trim());
  return fixSvgIntrinsicSize(bumpErSvgFontSizes(svg));
}
