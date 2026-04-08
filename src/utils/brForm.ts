/** Apenas dígitos */
export function onlyDigits(s: string): string {
  return s.replace(/\D/g, '');
}

export function maskCpf(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function maskCnpj(v: string): string {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function maskPhoneBr(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** CPF com dígitos verificadores (mesma regra do backend). */
export function isValidCpf(raw: string): boolean {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i], 10) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(cpf[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i], 10) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(cpf[10], 10);
}

/** Razão social: letras, números, espaço e pontuação básica (espelha backend). */
export function isValidLegalName(name: string): boolean {
  if (!name || name.trim().length < 2) return false;
  return /^[\p{L}\p{N}\s.,\-&/()]+$/u.test(name.trim());
}

/** Sugestão de domínio comum (o servidor também valida ao salvar). */
export function suggestEmailFix(email: string): string | null {
  const fixes: Record<string, string> = {
    gmial: 'gmail',
    gmai: 'gmail',
    hotmial: 'hotmail',
    yaho: 'yahoo',
    outlok: 'outlook',
  };
  const at = email.indexOf('@');
  if (at < 0) return null;
  const domain = email.slice(at + 1).split('.')[0]?.toLowerCase();
  if (domain && fixes[domain]) {
    const rest = email.slice(at + 1).split('.').slice(1).join('.');
    return `${email.slice(0, at + 1)}${fixes[domain]}.${rest || 'com'}`;
  }
  return null;
}

/** Telefone BR com DDD: 10 (fixo) ou 11 (celular) dígitos. */
export function isValidBrPhone(raw: string): boolean {
  const d = onlyDigits(raw);
  return d.length === 10 || d.length === 11;
}

/** Agência (campo numérico, sem DV): 1 a 5 dígitos é o intervalo usual. */
export function isReasonableBankAgency(agencyRaw: string): boolean {
  const d = onlyDigits(agencyRaw);
  return d.length >= 1 && d.length <= 5;
}

/** CNPJ com dígitos verificadores (mesma regra do backend). */
export function isValidCnpj(raw: string): boolean {
  const cnpj = onlyDigits(raw);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(cnpj[i], 10) * w1[i];
  let d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (d1 !== parseInt(cnpj[12], 10)) return false;
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(cnpj[i], 10) * w2[i];
  const d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return d2 === parseInt(cnpj[13], 10);
}

/** @deprecated use isValidCpf */
export function cpfLooksValid(digits: string): boolean {
  return digits.length === 11;
}
