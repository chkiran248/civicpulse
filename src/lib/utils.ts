import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateTicketId(): string {
  return `CP-${Math.floor(Math.random() * 90000) + 10000}`;
}

export function sanitizeUserText(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // remove script blocks with content
    .replace(/<[^>]*>/g, '')    // strip remaining HTML tags
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, 2000);
}
