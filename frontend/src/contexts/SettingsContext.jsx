import { createContext, useContext } from 'react';

const SettingsContext = createContext(null);

const defaultValue = {
  translate: (s) => s,
  formatCurrency: (v) => {
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
  },
  getImage: (path) => path,
  settings: {},
  language: 'en',
};

export function SettingsProvider({ children, value }) {
  return (
    <SettingsContext.Provider value={value || defaultValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext) || defaultValue;
}

export default SettingsContext;
