import { createContext, useContext, useState } from 'react';

const EvaluationContext = createContext(null);

export function EvaluationProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [country, setCountry] = useState('');

  const openEvaluation = (selectedCountry = '') => {
    setCountry(selectedCountry);
    setIsOpen(true);
  };

  const closeEvaluation = () => {
    setIsOpen(false);
    setCountry('');
  };

  return (
    <EvaluationContext.Provider value={{ isOpen, country, openEvaluation, closeEvaluation }}>
      {children}
    </EvaluationContext.Provider>
  );
}

export function useEvaluation() {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within EvaluationProvider');
  }
  return context;
}
