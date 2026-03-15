import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";
import i18n from "../i18n";


export interface LocalizedString {
  [langCode: string]: string;
}

export interface AttributeItem {
  id: string;
  name: LocalizedString;
  display_order: number;
}

export interface GroupedAttribute {
  category: string;
  attributes: AttributeItem[];
}

export interface InitialItem {
  id: string;
  name: LocalizedString;
  display_order: number;
  [key: string]: unknown;
}

export interface InitialData {
  vapid_public_key: string;
  preferences: {
    interests?: unknown[];
    fantasies?: unknown[];
    attributes?: unknown[];
    gender_identities?: unknown[];
    sexual_orientations?: unknown[];
    sexual_roles?: unknown[];
    [key: string]: unknown;
  } | Record<string, unknown>;
  event_kinds: unknown[];
  report_kinds: unknown[];
  checkin_tag_types: unknown[]
  countries: Record<string, unknown>;
  languages: Record<string, unknown>;
  status: string;
  attributes?: GroupedAttribute[];
  gender_identities?: InitialItem[];
  sexual_orientations?: InitialItem[];
  sexual_roles?: InitialItem[];
  fantasies?: InitialItem[];
  interests?: InitialItem[];
}

interface AppContextType {
  data: InitialData | null;
  refresh: () => Promise<void>;
  loading: boolean;
  defaultLanguage: string;
  setDefaultLanguage: (lang: string) => void;
}

const AppContext = createContext<AppContextType>({
  data: null,
  refresh: async () => { },
  loading: true,
  defaultLanguage: "en",
  setDefaultLanguage: () => { }
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<InitialData | null>(null);
  const [loading, setLoading] = useState(true);
  const storedLang = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
  const [defaultLanguage, setDefaultLanguage] = useState<string>(storedLang || i18n.language || "en");


  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.fetchInitialSync() as InitialData;
      setData(res || null);
    } catch (err) {
      console.error("Initial sync failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setDefaultLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return (
    <AppContext.Provider value={{
      data,
      refresh,
      loading,
      defaultLanguage,
      setDefaultLanguage,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
