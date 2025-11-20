/**
 * Valida y normaliza un número de teléfono
 */
export function validatePhone(phoneNumber: string): string {
  if (!phoneNumber) {
    throw new Error('Número de teléfono requerido');
  }

  // Limpiar el número de teléfono
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  if (!cleaned) {
    throw new Error('Número de teléfono inválido');
  }

  // Si ya tiene el formato correcto con +, devolverlo
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Si empieza con código de país, agregar +
  if (cleaned.length > 10 && !cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }

  // Si es un número local (sin código de país), asumir Chile (+56)
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return `+56${cleaned}`;
  }

  // Si es un número local con 8 dígitos, agregar 9 y código de país
  if (cleaned.length === 8) {
    return `+569${cleaned}`;
  }

  // Para otros casos, agregar + si no lo tiene
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Valida que un número de teléfono tenga el formato correcto
 */
export function isValidPhoneFormat(phoneNumber: string): boolean {
  try {
    validatePhone(phoneNumber);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extrae el código de país de un número de teléfono
 */
export function extractCountryCode(phoneNumber: string): string {
  const normalized = validatePhone(phoneNumber);
  
  // Códigos de país comunes
  const countryCodes = [
    { code: '+1', length: 11 }, // US/Canada
    { code: '+52', length: 12 }, // Mexico
    { code: '+54', length: 12 }, // Argentina
    { code: '+55', length: 13 }, // Brazil
    { code: '+56', length: 11 }, // Chile
    { code: '+57', length: 12 }, // Colombia
    { code: '+58', length: 12 }, // Venezuela
    { code: '+34', length: 11 }, // Spain
    { code: '+44', length: 12 }, // UK
    { code: '+49', length: 12 }, // Germany
    { code: '+33', length: 11 }, // France
    { code: '+39', length: 11 }, // Italy
    { code: '+81', length: 12 }, // Japan
    { code: '+86', length: 13 }, // China
    { code: '+91', length: 12 }, // India
  ];

  for (const country of countryCodes) {
    if (normalized.startsWith(country.code) && normalized.length === country.length) {
      return country.code;
    }
  }

  // Si no coincide con ningún código conocido, extraer los primeros 1-3 dígitos después del +
  const withoutPlus = normalized.substring(1);
  if (withoutPlus.length >= 2) {
    return `+${withoutPlus.substring(0, withoutPlus.length >= 3 ? 3 : 2)}`;
  }

  return '+56'; // Por defecto Chile
}

/**
 * Formatea un número de teléfono para mostrar
 */
export function formatPhoneForDisplay(phoneNumber: string): string {
  const normalized = validatePhone(phoneNumber);
  
  // Para números chilenos
  if (normalized.startsWith('+569')) {
    const number = normalized.substring(4);
    return `+56 9 ${number.substring(0, 4)} ${number.substring(4)}`;
  }
  
  if (normalized.startsWith('+56')) {
    const number = normalized.substring(3);
    return `+56 ${number.substring(0, 1)} ${number.substring(1, 5)} ${number.substring(5)}`;
  }
  
  // Para otros países, formato básico
  if (normalized.length > 4) {
    return `${normalized.substring(0, normalized.length - 4)} ${normalized.substring(normalized.length - 4)}`;
  }
  
  return normalized;
}

/**
 * Convierte un número de teléfono a formato internacional sin +
 */
export function toInternationalFormat(phoneNumber: string): string {
  const normalized = validatePhone(phoneNumber);
  return normalized.substring(1); // Quitar el +
}

/**
 * Convierte un número de teléfono a formato nacional (sin código de país)
 */
export function toNationalFormat(phoneNumber: string): string {
  const normalized = validatePhone(phoneNumber);
  
  // Para números chilenos
  if (normalized.startsWith('+569')) {
    return normalized.substring(4);
  }
  
  if (normalized.startsWith('+56')) {
    return normalized.substring(3);
  }
  
  // Para otros países, quitar código de país
  const countryCode = extractCountryCode(phoneNumber);
  return normalized.substring(countryCode.length);
}
