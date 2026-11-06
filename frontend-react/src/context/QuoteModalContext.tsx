import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { QuoteFormData } from '../types';

interface QuoteModalContextType {
  isOpen: boolean;
  preselectedServiceCode: string | null;
  preselectedCategory: string | null;
  openQuote: (serviceCode?: string, category?: string) => void;
  closeQuote: () => void;
  draftFormData: QuoteFormData;
  updateDraft: (fields: Partial<QuoteFormData>) => void;
  resetDraft: () => void;
  isDraftDirty: boolean;
}

const DEFAULT_FORM_DATA: QuoteFormData = {
  needType: 'COMPANY',
  serviceIds: [],
  state: '',
  municipality: '',
  address: '',
  requestedDate: '',
  urgency: 'Normal',
  comments: '',
  description: '',
  contactName: '',
  phone: '',
  company: '',
  email: '',
  contextAnswers: {},
};

const QuoteModalContext = createContext<QuoteModalContextType | undefined>(undefined);

export const QuoteModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [preselectedServiceCode, setPreselectedServiceCode] = useState<string | null>(null);
  const [preselectedCategory, setPreselectedCategory] = useState<string | null>(null);
  const [draftFormData, setDraftFormData] = useState<QuoteFormData>(DEFAULT_FORM_DATA);

  const openQuote = useCallback((serviceCode?: string, category?: string) => {
    if (serviceCode) {
      setPreselectedServiceCode(serviceCode);
      setDraftFormData((prev) => ({
        ...prev,
        serviceIds: prev.serviceIds.includes(serviceCode) ? prev.serviceIds : [serviceCode],
      }));
    } else {
      setPreselectedServiceCode(null);
    }

    if (category) {
      setPreselectedCategory(category);
    } else {
      setPreselectedCategory(null);
    }

    setIsOpen(true);
  }, []);

  const closeQuote = useCallback(() => {
    setIsOpen(false);
  }, []);

  const updateDraft = useCallback((fields: Partial<QuoteFormData>) => {
    setDraftFormData((prev) => ({ ...prev, ...fields }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraftFormData(DEFAULT_FORM_DATA);
    setPreselectedServiceCode(null);
    setPreselectedCategory(null);
  }, []);

  const isDraftDirty = useMemo(() => {
    return (
      draftFormData.serviceIds.length > 0 ||
      draftFormData.contactName.trim().length > 0 ||
      draftFormData.email.trim().length > 0 ||
      draftFormData.phone.trim().length > 0 ||
      draftFormData.description.trim().length > 0 ||
      draftFormData.state.trim().length > 0 ||
      draftFormData.address.trim().length > 0
    );
  }, [draftFormData]);

  return (
    <QuoteModalContext.Provider
      value={{
        isOpen,
        preselectedServiceCode,
        preselectedCategory,
        openQuote,
        closeQuote,
        draftFormData,
        updateDraft,
        resetDraft,
        isDraftDirty,
      }}
    >
      {children}
    </QuoteModalContext.Provider>
  );
};

export const useQuoteModal = (): QuoteModalContextType => {
  const context = useContext(QuoteModalContext);
  if (!context) {
    throw new Error('useQuoteModal debe ser utilizado dentro de un QuoteModalProvider');
  }
  return context;
};
