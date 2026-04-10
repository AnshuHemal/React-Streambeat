import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "@streambeat:create_button_enabled";

type CreateButtonContextType = {
  isEnabled: boolean;
  isLoaded: boolean;
  toggle: () => Promise<void>;
  setEnabled: (value: boolean) => Promise<void>;
};

const CreateButtonContext = createContext<CreateButtonContextType>({
  isEnabled: false,
  isLoaded: false,
  toggle: async () => {},
  setEnabled: async () => {},
});

export function CreateButtonProvider({ children }: { children: React.ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          setIsEnabled(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Error loading create button setting:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  const toggle = async () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
    } catch (error) {
      console.error("Error saving create button setting:", error);
    }
  };

  const setEnabled = async (value: boolean) => {
    setIsEnabled(value);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
      console.error("Error saving create button setting:", error);
    }
  };

  return (
    <CreateButtonContext.Provider value={{ isEnabled, isLoaded, toggle, setEnabled }}>
      {children}
    </CreateButtonContext.Provider>
  );
}

export const useCreateButton = () => useContext(CreateButtonContext);
