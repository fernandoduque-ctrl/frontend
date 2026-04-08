import mermaid from 'mermaid';

let mermaidConfigured = false;

function ensureMermaidInit() {
  if (mermaidConfigured) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'strict',
    er: { useMaxWidth: true },
  });
  mermaidConfigured = true;
}

/** Gera o markup SVG a partir de um texto `erDiagram` (sem inserir no DOM). */
export async function renderMermaidErSvg(definition: string): Promise<string> {
  ensureMermaidInit();
  const graphId = `er-${crypto.randomUUID().replace(/-/g, '')}`;
  const { svg } = await mermaid.render(graphId, definition.trim());
  return svg;
}
