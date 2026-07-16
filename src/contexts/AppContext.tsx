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

export interface ReportKind {
  key: string;
  name?: LocalizedString;
  display_order?: number;
  [key: string]: unknown;
}

export interface LanguageInfo {
  code: string;
  name: string;
  flag: string;
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
  event_kinds: InitialItem[];
  report_kinds: ReportKind[];
  checkin_tag_types: InitialItem[];
  countries: Record<string, InitialItem>;
  languages: Record<string, LanguageInfo>;
  status: string;
  attributes?: GroupedAttribute[];
  gender_identities?: InitialItem[];
  sexual_orientations?: InitialItem[];
  sexual_roles?: InitialItem[];
  fantasies?: InitialItem[];
  interests?: InitialItem[];
}

const EMPTY_INITIAL_DATA: InitialData = {
  vapid_public_key: '',
  preferences: {},
  event_kinds: [],
  report_kinds: [],
  checkin_tag_types: [],
  countries: {},
  languages: {},
  status: 'offline',
};

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
  const [defaultLanguage, setDefaultLanguage] = useState<string>(() => i18n.language || "en");


  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.fetchInitialSync() as InitialData;
      setData(res || null);
    } catch (err) {
      console.error("Initial sync failed:", err);
      setData((prev) => prev ?? EMPTY_INITIAL_DATA);
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedLang = localStorage.getItem('lang');
    if (storedLang && storedLang !== defaultLanguage) {
      setDefaultLanguage(storedLang);
    }
  }, [defaultLanguage]);

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
