import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Same-site path or `fallback`. Rejects `//host`, `/\host`, absolute URLs and control chars browsers strip. */
export function safeRedirect(path: string | null | undefined, fallback = '/dashboard'): string {
  return path && /^\/(?![/\\])[^\\\x00-\x20]*$/.test(path) ? path : fallback
}
