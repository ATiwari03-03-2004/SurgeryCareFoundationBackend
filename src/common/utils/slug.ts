import { v4 as uuidv4 } from 'uuid';

export function generateSlug(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
  const suffix = uuidv4().substring(0, 8);
  return `${base}-${suffix}`;
}
