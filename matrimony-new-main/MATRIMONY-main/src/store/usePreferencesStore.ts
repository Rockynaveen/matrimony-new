import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface PartnerPreferencesData {
  ageRange: [number, number];
  heightRange: [string, string];
  religions: string[];
  castes: string[];
  motherTongues: string[];
  maritalStatuses: string[];
  professions: string[];
  educationLevels: string[];
  countries: string[];
  states: string[];
  diet: string;
}

interface PreferencesState {
  preferences: PartnerPreferencesData;
  setPreferences: (newPrefs: Partial<PartnerPreferencesData>) => void;
  resetPreferences: () => void;
}

const defaultPreferences: PartnerPreferencesData = {
  ageRange: [21, 35],
  heightRange: ["5'0\"", "6'2\""],
  religions: ['Hindu'],
  castes: ['All Castes'],
  motherTongues: ['Hindi', 'English'],
  maritalStatuses: ['Never Married'],
  professions: ['Software Engineer', 'Product Manager', 'Doctor', 'Consultant'],
  educationLevels: ['B.Tech / M.Tech', 'MBA', 'MS / Ph.D'],
  countries: ['India'],
  states: ['Maharashtra', 'Delhi', 'Karnataka'],
  diet: 'Vegetarian'
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      preferences: defaultPreferences,

      setPreferences: (newPrefs) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...newPrefs
          }
        })),

      resetPreferences: () => set({ preferences: defaultPreferences })
    }),
    {
      name: 'vivah_preferences_store',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
