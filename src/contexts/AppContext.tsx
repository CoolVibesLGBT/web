import React, { createContext, useContext, useState, useEffect } from "react";
import { Actions } from "../services/actions";
import { api } from "../services/api";
import i18n from "../i18n";

interface Fantasy {
  id: string;
  slug: string;
  category: Record<string, string>;
  label: Record<string, string>;
  description: Record<string, string>;
}

interface OrientationTranslation {
  id: string;
  orientation_id: string;
  language: string;
  label: string;
}

interface SexualOrientation {
  id: string;
  key?: string;
  order?: number;
  name?: Record<string, string>;
  display_order?: number;
  translations?: OrientationTranslation[];
}

interface GenderIdentity {
  id: string;
  name: Record<string, string>;
  display_order: number;
}

interface SexualRole {
  id: string;
  name: Record<string, string>;
  display_order: number;
}

interface InterestItem {
  id: string;
  interest_id: string;
  name: Record<string, string>;
  emoji?: string;
}

interface Interest {
  id: string;
  name: Record<string, string>;
  items: InterestItem[];
}

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

interface InitialData {
  fantasies: Fantasy[];
  countries: Record<string, any>;
  interests: Interest[];
  sexual_orientations: SexualOrientation[];
  gender_identities: GenderIdentity[];
  sexual_roles: SexualRole[];
  languages: Record<string, any>;
  attributes: GroupedAttribute[];
  status: string;
}

interface CursorInfo {
  [key: string]: string | number | null;
}

interface AppContextType {
  cursors: CursorInfo;
  setCursorState: (key: string, value: string | number | null) => void;
  getCursor: (key: string) => string | null;
  resetCursors: () => void;


  nearbyUsers: any[];
  setNearbyUsers: React.Dispatch<React.SetStateAction<any[]>>;

  data: InitialData | null;
  refresh: () => Promise<void>;
  loading: boolean;
  defaultLanguage: string;
  setDefaultLanguage: (lang: string) => void;
}

const AppContext = createContext<AppContextType>({
  data: null,
  refresh: async () => {},
  loading: true,
  defaultLanguage: "en",
  setDefaultLanguage: () => {},
  cursors: {},
  setCursorState: () => {},
  getCursor: () => null,
  resetCursors: () => {},

  nearbyUsers: [],
  setNearbyUsers: () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<InitialData | null>(null);
  const [loading, setLoading] = useState(true);
  const storedLang = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
  const [defaultLanguage, setDefaultLanguage] = useState<string>(storedLang || i18n.language || "en");

  // Cursor state
  const [cursors, setCursorState] = useState<CursorInfo>({});

  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);


  const setCursor = (key: string, value: string | number | null) => {
    setCursorState(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const getCursor = (key: string): string | null => {
    const val = cursors[key] ?? null;
    if (val === null) return null;
    return typeof val === 'number' ? val.toString() : val;
  };

  const resetCursors = () => setCursorState({});

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.call<InitialData>(Actions.SYSTEM_INITIAL_SYNC);
      setData(res);
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
      cursors,
      setCursorState: setCursor,
      getCursor,
      resetCursors,
      nearbyUsers,
      setNearbyUsers,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);