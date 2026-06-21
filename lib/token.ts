const KEY = 'sojo_write_token';

export const getWriteToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem(KEY) : null;

export const setWriteToken = (token: string) => localStorage.setItem(KEY, token);

export const clearWriteToken = () => localStorage.removeItem(KEY);
