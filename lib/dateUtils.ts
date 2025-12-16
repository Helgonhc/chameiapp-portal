/**
 * Utilitários para manipulação de datas no portal
 * Converte timestamps UTC para horário de Brasília (UTC-3)
 */

/**
 * Converte uma data UTC para horário de Brasília
 * @param utcDate - Data em UTC (string ou Date)
 * @returns Date ajustada para horário de Brasília
 */
export function toBrasiliaTime(utcDate: string | Date): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  // Brasília é UTC-3 (3 horas ATRÁS do UTC)
  // Exemplo: Se UTC é 00:08, Brasília é 21:08 do dia anterior
  const brasiliaTime = new Date(date.getTime() - (3 * 60 * 60 * 1000));
  
  return brasiliaTime;
}

/**
 * Formata data para horário de Brasília no formato brasileiro
 * @param utcDate - Data em UTC
 * @param options - Opções de formatação Intl.DateTimeFormat
 * @returns String formatada
 */
export function formatBrasiliaDate(
  utcDate: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = toBrasiliaTime(utcDate);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  
  return date.toLocaleString('pt-BR', defaultOptions);
}

/**
 * Formata data para formato curto (DD/MM HH:mm)
 * @param utcDate - Data em UTC
 * @returns String formatada
 */
export function formatBrasiliaShort(utcDate: string | Date): string {
  const date = toBrasiliaTime(utcDate);
  
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata data para formato completo (DD/MM/YYYY HH:mm:ss)
 * @param utcDate - Data em UTC
 * @returns String formatada
 */
export function formatBrasiliaFull(utcDate: string | Date): string {
  const date = toBrasiliaTime(utcDate);
  
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Formata apenas a data (DD/MM/YYYY)
 * @param utcDate - Data em UTC
 * @returns String formatada
 */
export function formatBrasiliaDateOnly(utcDate: string | Date): string {
  const date = toBrasiliaTime(utcDate);
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formata data com mês abreviado (DD MMM YYYY)
 * @param utcDate - Data em UTC
 * @returns String formatada
 */
export function formatBrasiliaDateShort(utcDate: string | Date): string {
  const date = toBrasiliaTime(utcDate);
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
