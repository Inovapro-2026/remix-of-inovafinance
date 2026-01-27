/**
 * Unified Agenda/Routine Parser Service
 * 
 * This service provides a single parser for both chat and voice commands.
 * It extracts structured data from natural language input.
 */

export interface ParsedAgendaEvent {
  tipo: 'rotina' | 'agenda' | 'lembrete' | 'evento';
  titulo: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM (hora_inicio)
  hora_fim: string; // HH:MM
  recorrente: boolean;
  dias_semana: string[];
  origem: 'chat' | 'voz' | 'manual';
  descricao?: string;
  categoria?: string;
}

// Word to number mapping for Portuguese
const WORD_TO_NUMBER: Record<string, number> = {
  'uma': 1, 'duas': 2, 'tres': 3, 'três': 3, 'quatro': 4, 'cinco': 5,
  'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10,
  'onze': 11, 'doze': 12, 'treze': 13, 'quatorze': 14, 'catorze': 14,
  'quinze': 15, 'dezesseis': 16, 'dezessete': 17, 'dezoito': 18,
  'dezenove': 19, 'vinte': 20, 'vinte e uma': 21, 'vinte e duas': 22,
  'vinte e tres': 23, 'vinte e três': 23,
};

const DAY_PATTERNS: Record<string, string> = {
  'segunda': 'segunda',
  'terca': 'terca',
  'terça': 'terca',
  'quarta': 'quarta',
  'quinta': 'quinta',
  'sexta': 'sexta',
  'sabado': 'sabado',
  'sábado': 'sabado',
  'domingo': 'domingo',
};

function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  const newHour = (h + hours) % 24;
  return `${String(newHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Extract time from text (e.g., "às 14h", "19:30", "cinco da tarde")
 */
export function parseTimeFromText(text: string): string | null {
  const normalized = normalizeText(text);

  // "meio dia" / "meia noite"
  if (/meio[\s-]?dia/.test(normalized)) return '12:00';
  if (/meia[\s-]?noite/.test(normalized)) return '00:00';

  // "cinco e meia", "sete e meia da tarde"
  const halfMatch = normalized.match(/(\w+)\s+e\s+meia(?:\s+(?:da\s+)?(manha|tarde|noite))?/i);
  if (halfMatch) {
    const wordNum = WORD_TO_NUMBER[halfMatch[1]];
    if (wordNum) {
      let hours = wordNum;
      if (halfMatch[2] === 'tarde' || halfMatch[2] === 'noite') {
        if (hours < 12) hours += 12;
      }
      return `${String(hours).padStart(2, '0')}:30`;
    }
  }

  // "às 14 horas", "as 14h", "às 14:30"
  const timePattern1 = normalized.match(/(?:as|às|a)\s*(\d{1,2})(?::(\d{2}))?\s*(?:horas?|h)?/i);
  if (timePattern1) {
    const hours = parseInt(timePattern1[1], 10);
    const minutes = timePattern1[2] || '00';
    if (hours >= 0 && hours <= 23) {
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
  }

  // "14 horas", "14h", "14:30"
  const timePattern2 = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*(?:horas?|h)/i);
  if (timePattern2) {
    const hours = parseInt(timePattern2[1], 10);
    const minutes = timePattern2[2] || '00';
    if (hours >= 0 && hours <= 23) {
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
  }

  // "duas da tarde", "três da manhã", "oito da noite"
  const wordTimeMatch = normalized.match(/(\w+)\s+(?:da\s+)?(manha|tarde|noite)/i);
  if (wordTimeMatch && WORD_TO_NUMBER[wordTimeMatch[1]]) {
    let hours = WORD_TO_NUMBER[wordTimeMatch[1]];
    if (wordTimeMatch[2] === 'tarde' || wordTimeMatch[2] === 'noite') {
      if (hours < 12) hours += 12;
    }
    return `${String(hours).padStart(2, '0')}:00`;
  }

  // Standalone time like "19h" or "19:30" without prefix
  const standaloneTime = normalized.match(/\b(\d{1,2})(?::(\d{2}))?\s*h?\b/);
  if (standaloneTime) {
    const hours = parseInt(standaloneTime[1], 10);
    const minutes = standaloneTime[2] || '00';
    if (hours >= 0 && hours <= 23) {
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
  }

  return null;
}

/**
 * Extract end time from text (e.g., "das 19h às 22h", "até 23h")
 */
export function parseEndTimeFromText(text: string): string | null {
  const normalized = normalizeText(text);

  // "das 19h às 22h", "de 19 a 22"
  const rangeMatch = normalized.match(/(?:das?|de)\s*\d{1,2}(?::\d{2})?\s*(?:h|horas?)?\s*(?:as?|às?|ate)\s*(\d{1,2})(?::(\d{2}))?\s*(?:h|horas?)?/i);
  if (rangeMatch) {
    const hours = parseInt(rangeMatch[1], 10);
    const minutes = rangeMatch[2] || '00';
    if (hours >= 0 && hours <= 23) {
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
  }

  // "até 22h", "até às 23:00"
  const untilMatch = normalized.match(/(?:ate|até)\s*(?:as|às)?\s*(\d{1,2})(?::(\d{2}))?\s*(?:h|horas?)?/i);
  if (untilMatch) {
    const hours = parseInt(untilMatch[1], 10);
    const minutes = untilMatch[2] || '00';
    if (hours >= 0 && hours <= 23) {
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
  }

  return null;
}

/**
 * Extract date from text (e.g., "hoje", "amanhã", "dia 15")
 */
export function parseDateFromText(text: string): string | null {
  const normalized = normalizeText(text);
  const today = new Date();

  // "hoje"
  if (/\bhoje\b/.test(normalized)) {
    return getTodayDate();
  }

  // "amanha"
  if (/\bamanha\b/.test(normalized)) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  }

  // "depois de amanha"
  if (/depois\s*de\s*amanha/.test(normalized)) {
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    return formatDate(dayAfter);
  }

  // Day of month: "dia 15", "no dia 20"
  const dayMatch = normalized.match(/dia\s*(\d{1,2})/);
  if (dayMatch) {
    const day = parseInt(dayMatch[1], 10);
    if (day >= 1 && day <= 31) {
      const date = new Date(today.getFullYear(), today.getMonth(), day);
      if (date < today) {
        date.setMonth(date.getMonth() + 1);
      }
      return formatDate(date);
    }
  }

  return null;
}

/**
 * Extract days of week from text (e.g., "segunda a sexta", "terça e quinta")
 */
export function parseDaysFromText(text: string): string[] {
  const normalized = normalizeText(text);
  const days: string[] = [];

  // "segunda a sexta", "seg a sex"
  if (/segunda\s*(?:a|ate)\s*sexta/.test(normalized) || /seg\s*(?:a|ate)\s*sex/.test(normalized)) {
    return ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
  }

  // "todos os dias", "todo dia"
  if (/todos?\s*(?:os)?\s*dias?/.test(normalized)) {
    return ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
  }

  // Check individual days
  for (const [pattern, day] of Object.entries(DAY_PATTERNS)) {
    if (normalized.includes(pattern) && !days.includes(day)) {
      days.push(day);
    }
  }

  return days;
}

/**
 * Determine if text indicates a routine (recurring) vs single event
 */
function isRoutineCommand(text: string): boolean {
  const normalized = normalizeText(text);

  // Explicit routine keywords
  if (/rotina/.test(normalized)) return true;
  if (/todo dia/.test(normalized) || /todos os dias/.test(normalized)) return true;
  if (/segunda\s*(?:a|ate)\s*sexta/.test(normalized)) return true;
  if (/toda\s+(segunda|terca|quarta|quinta|sexta|sabado|domingo)/.test(normalized)) return true;

  // Multiple days specified
  const days = parseDaysFromText(text);
  if (days.length > 1) return true;

  return false;
}

/**
 * Determine event type from text
 */
function detectEventType(text: string): 'rotina' | 'agenda' | 'lembrete' | 'evento' {
  const normalized = normalizeText(text);

  if (/rotina/.test(normalized)) return 'rotina';
  if (/lembrete|lembre|lembrar/.test(normalized)) return 'lembrete';
  if (/evento|reuniao|call|meeting|compromisso/.test(normalized)) return 'evento';
  if (isRoutineCommand(text)) return 'rotina';

  return 'agenda';
}

/**
 * Detect category from text
 */
function detectCategory(text: string): string {
  const normalized = normalizeText(text);

  if (/trabalho|reuniao|call|meeting|projeto|cliente|empresa|office|escritorio/.test(normalized)) return 'trabalho';
  if (/estudo|estudar|aula|prova|curso|ler|livro|aprender/.test(normalized)) return 'estudo';
  if (/academia|exercicio|treino|correr|caminhada|yoga|saude|medico|consulta/.test(normalized)) return 'saude';

  return 'pessoal';
}

/**
 * Extract title from command (removes time/date references)
 */
export function extractTitle(text: string): string {
  let cleaned = text
    // Remove common prefixes
    .replace(/^(me\s+)?lembr[ae]\s+(de\s+)?/i, '')
    .replace(/^adiciona?\s+(na\s+)?(minha\s+)?rotina\s+/i, '')
    .replace(/^criar?\s+rotina\s+(diaria\s+)?/i, '')
    .replace(/^agendar?\s+/i, '')
    .replace(/^agenda\s+/i, '')
    .replace(/^marcar?\s+/i, '')
    .replace(/^toda\s+(segunda|terca|quarta|quinta|sexta|sabado|domingo)(\s+(?:a|e|,)\s+(?:segunda|terca|quarta|quinta|sexta|sabado|domingo))*\s*/gi, '')
    .replace(/^de\s+segunda\s+a\s+sexta\s*/i, '')
    .replace(/^todos?\s+(?:os\s+)?dias?\s*/i, '')
    .trim();

  // Remove time expressions
  cleaned = cleaned
    .replace(/(?:as|às|a)\s*\d{1,2}(?::\d{2})?\s*(?:horas?|h)?/gi, '')
    .replace(/\d{1,2}(?::\d{2})?\s*(?:horas?|h)/gi, '')
    .replace(/(?:das?|de)\s*\d{1,2}(?::\d{2})?\s*(?:h|horas?)?\s*(?:as?|às?|ate)\s*\d{1,2}(?::\d{2})?\s*(?:h|horas?)?/gi, '')
    .replace(/(\w+)\s+e\s+meia(?:\s+(?:da\s+)?(manha|tarde|noite))?/gi, '')
    .replace(/(\w+)\s+(?:da\s+)?(manha|tarde|noite)/gi, '')
    .replace(/meio[\s-]?dia/gi, '')
    .replace(/meia[\s-]?noite/gi, '')
    .trim();

  // Remove date expressions
  cleaned = cleaned
    .replace(/\bhoje\b/gi, '')
    .replace(/\bamanha\b/gi, '')
    .replace(/depois\s*de\s*amanha/gi, '')
    .replace(/dia\s*\d{1,2}/gi, '')
    .replace(/\b(segunda|terca|quarta|quinta|sexta|sabado|domingo)\b/gi, '')
    .trim();

  // Clean up extra spaces and punctuation
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/^[\s,;:\-]+|[\s,;:\-]+$/g, '')
    .trim();

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned || 'Lembrete';
}

/**
 * Main parser function - extracts all data from natural language text
 */
export function parseAgendaCommand(
  text: string,
  origem: 'chat' | 'voz' | 'manual' = 'chat'
): ParsedAgendaEvent {
  const titulo = extractTitle(text);
  const hora = parseTimeFromText(text);
  const horaFim = parseEndTimeFromText(text);
  const data = parseDateFromText(text);
  const diasSemana = parseDaysFromText(text);
  const isRecurrent = isRoutineCommand(text);
  const tipo = detectEventType(text);
  const categoria = detectCategory(text);

  // Default values
  const defaultHora = hora || '09:00';
  const defaultHoraFim = horaFim || addHours(defaultHora, 1);
  const defaultData = data || getTodayDate();
  const defaultDias = isRecurrent && diasSemana.length === 0 
    ? ['segunda', 'terca', 'quarta', 'quinta', 'sexta'] 
    : diasSemana;

  return {
    tipo,
    titulo,
    data: defaultData,
    hora: defaultHora,
    hora_fim: defaultHoraFim,
    recorrente: isRecurrent,
    dias_semana: defaultDias,
    origem,
    categoria,
  };
}

/**
 * Check if text is an agenda/routine command (vs query or other)
 */
export function isAgendaOrRoutineCommand(text: string): boolean {
  const normalized = normalizeText(text);

  // Query patterns - NOT a creation command
  const queryPatterns = [
    /o\s+que\s+(?:eu\s+)?tenho/,
    /quais\s+(?:sao\s+)?(?:meus?|minhas?)/,
    /minha\s+agenda\s+(?:de\s+)?(?:hoje|amanha)/,
    /mostr[ae]\s+(?:minha|meus?|minhas?)/,
  ];
  if (queryPatterns.some(p => p.test(normalized))) return false;

  // Creation patterns
  const creationPatterns = [
    /lembr[ae]/,
    /agendar?/,
    /marcar?/,
    /criar?\s+rotina/,
    /adicionar?\s+rotina/,
    /rotina\s+(?:de|para)/,
    /toda\s+(segunda|terca|quarta|quinta|sexta|sabado|domingo)/,
    /todos?\s+(?:os\s+)?dias?/,
    /segunda\s*(?:a|ate)\s*sexta/,
  ];
  if (creationPatterns.some(p => p.test(normalized))) return true;

  // Has time + date = likely a creation
  const hasTime = parseTimeFromText(text) !== null;
  const hasDate = parseDateFromText(text) !== null;
  if (hasTime && hasDate) return true;

  return false;
}

/**
 * Format parsed event for display/confirmation
 */
export function formatParsedEventForDisplay(event: ParsedAgendaEvent): string {
  const tipoLabel = {
    rotina: 'Rotina',
    agenda: 'Agenda',
    lembrete: 'Lembrete',
    evento: 'Evento',
  }[event.tipo];

  const dataFormatted = new Date(event.data + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (event.recorrente && event.dias_semana.length > 0) {
    const diasLabels: Record<string, string> = {
      segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta',
      quinta: 'Quinta', sexta: 'Sexta', sabado: 'Sábado', domingo: 'Domingo',
    };
    const diasStr = event.dias_semana.map(d => diasLabels[d] || d).join(', ');
    return `📌 ${tipoLabel}: ${event.titulo}\n📅 ${diasStr}\n⏰ ${event.hora} – ${event.hora_fim}`;
  }

  return `📌 ${tipoLabel}: ${event.titulo}\n📅 ${dataFormatted}\n⏰ ${event.hora} – ${event.hora_fim}`;
}
