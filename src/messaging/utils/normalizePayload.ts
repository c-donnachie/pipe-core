import { validatePhone } from './validatePhone';

export interface NormalizedPayload {
  to: string;
  message?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  from?: string;
  mediaUrls?: string[];
}

/**
 * Normaliza el payload de entrada para diferentes canales
 */
export function normalizePayload(payload: any): NormalizedPayload {
  const normalized: NormalizedPayload = {
    to: payload.to,
  };

  // Normalizar el número de teléfono o email
  if (payload.to) {
    if (isEmail(payload.to)) {
      normalized.to = payload.to.toLowerCase().trim();
    } else {
      // Es un número de teléfono
      normalized.to = validatePhone(payload.to);
    }
  }

  // Normalizar mensaje/texto
  if (payload.message || payload.body) {
    normalized.message = (payload.message || payload.body).trim();
  }

  // Normalizar subject (para emails)
  if (payload.subject) {
    normalized.subject = payload.subject.trim();
  }

  // Normalizar contenido HTML
  if (payload.htmlContent || payload.html) {
    normalized.htmlContent = (payload.htmlContent || payload.html).trim();
  }

  // Normalizar contenido de texto
  if (payload.textContent || payload.text) {
    normalized.textContent = (payload.textContent || payload.text).trim();
  }

  // Normalizar remitente
  if (payload.from) {
    normalized.from = payload.from.trim();
  }

  // Normalizar URLs de medios
  if (payload.mediaUrls || payload.mediaUrl) {
    const urls = payload.mediaUrls || [payload.mediaUrl];
    normalized.mediaUrls = urls.filter((url: string) => url && url.trim());
  }

  return normalized;
}

/**
 * Verifica si un string es un email válido
 */
function isEmail(str: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}

/**
 * Normaliza un número de teléfono para WhatsApp
 */
export function normalizeWhatsappNumber(phoneNumber: string): string {
  const cleanNumber = validatePhone(phoneNumber);
  return cleanNumber.startsWith('whatsapp:') ? cleanNumber : `whatsapp:${cleanNumber}`;
}

/**
 * Normaliza un número de teléfono para SMS
 */
export function normalizeSmsNumber(phoneNumber: string): string {
  return validatePhone(phoneNumber);
}

/**
 * Extrae el número limpio de un número de WhatsApp
 */
export function extractWhatsappNumber(whatsappNumber: string): string {
  return whatsappNumber.replace('whatsapp:', '').replace(/[^\d+]/g, '');
}

/**
 * Valida y normaliza un email
 */
export function normalizeEmail(email: string): string {
  const normalized = email.toLowerCase().trim();
  
  if (!isEmail(normalized)) {
    throw new Error(`Email inválido: ${email}`);
  }
  
  return normalized;
}
