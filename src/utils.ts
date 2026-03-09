
export const generateId = (prefix: string = ''): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return `${prefix}${window.crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }
  return `${prefix}${Math.floor(Date.now() * Math.random()).toString(36).toUpperCase()}`;
};
