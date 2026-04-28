import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toSnakeCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (typeof obj !== 'object' || obj instanceof Date) return obj;

  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (val === undefined) continue;
      
      // Skip empty strings for sensitive fields to prevent Postgres type errors
      if (val === '' && (key === 'lastVisit' || key === 'date' || key === 'birthDate')) {
        continue;
      }
      
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      newObj[snakeKey] = (val !== null && typeof val === 'object' && !(val instanceof Date)) 
        ? toSnakeCase(val) 
        : val;
    }
  }
  return newObj;
};

/**
 * Gets the clean base URL (protocol + host) of the application.
 * This prevents paths like /login from being included in generated links.
 */
export function getBaseUrl() {
  const rawOrigin = import.meta.env.VITE_APP_URL || window.location.origin;
  
  try {
    // 1. Clean the string and ensure protocol
    let str = String(rawOrigin).trim();
    if (!str.startsWith('http')) {
      str = `https://${str}`;
    }
    
    // 2. Parse with URL constructor
    // The URL constructor is the most reliable way to extract the origin
    const url = new URL(str);
    
    // 3. url.origin is strictly protocol + host (e.g., https://example.com)
    // It will NOT include any path segments like /login
    return url.origin;
  } catch (e) {
    // Fallback to window.location.origin which is always strictly protocol + host
    return window.location.origin;
  }
}

export const toCamelCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object' || obj instanceof Date) return obj;

  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      
      const camelKey = key.replace(/([-_][a-z])/g, group =>
        group.toUpperCase().replace('-', '').replace('_', '')
      );
      newObj[camelKey] = (val !== null && typeof val === 'object' && !(val instanceof Date)) 
        ? toCamelCase(val) 
        : val;
    }
  }
  return newObj;
};

/**
 * Returns a relative day string for an appointment date (YYYY-MM-DD).
 * Examples: "hoje", "amanhã", "no dia 18/04".
 */
export function getRelativeDayText(dateString: string): string {
  if (!dateString) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [year, month, day] = dateString.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'amanhã';
  return `no dia ${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
}
