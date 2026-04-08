function parseHm(t?: string | null): number | null {
  if (!t || !/^\d{1,2}:\d{2}$/.test(t.trim())) return null;
  const [h, m] = t.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/** Retorna textos de ajuda (não substitui assessoria jurídica). */
export function workScheduleLegalHints(params: {
  startTime?: string | null;
  endTime?: string | null;
  breakMinutes?: number;
}): string[] {
  const hints: string[] = [];
  const a = parseHm(params.startTime);
  const b = parseHm(params.endTime);
  if (a == null || b == null) {
    hints.push('Preencha entrada e saída no formato HH:mm para estimar a jornada líquida.');
    return hints;
  }
  let span = b - a;
  if (span < 0) span += 24 * 60;
  const brk = Math.max(0, params.breakMinutes ?? 0);
  const net = span - brk;
  if (net <= 0) {
    hints.push('Intervalo igual ou maior que o período trabalhado — confira os horários.');
    return hints;
  }
  const h = Math.floor(net / 60);
  const m = net % 60;
  hints.push(`Carga líquida estimada: ${h}h${m ? `${m}min` : ''}/dia (aprox., sem horas extras).`);
  if (net > 10 * 60) {
    hints.push('Jornada líquida acima de 10h — verifique acordos, banco de horas e legislação aplicável.');
  }
  if (net < 6 * 60) {
    hints.push('Jornada líquida abaixo de 6h — pode ser tempo parcial; confira contrato.');
  }
  hints.push('Sugestão: registrar descanso semanal remunerado (ex.: domingo) nas políticas internas.');
  return hints;
}
