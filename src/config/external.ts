export const MANTIK_ORIGIN = 'https://mantik.netlify.app';

export function mantikLesson(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${MANTIK_ORIGIN}${normalized}`;
}
