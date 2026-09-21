import type { Profile } from './index';
import type { MatchResponseSchema } from './matching.types';

export interface SearchFilterOptionItem {
  id?: string | number;
  label: string;
  value: string;
}

export interface SearchFilterOptions {
  religions?: (string | SearchFilterOptionItem)[];
  castes?: Record<string, string[]> | (string | SearchFilterOptionItem)[];
  educations?: (string | SearchFilterOptionItem)[];
  professions?: (string | SearchFilterOptionItem)[];
  occupations?: (string | SearchFilterOptionItem)[];
  marital_statuses?: (string | SearchFilterOptionItem)[];
  mother_tongues?: (string | SearchFilterOptionItem)[];
  languages?: (string | SearchFilterOptionItem)[];
  cities?: (string | SearchFilterOptionItem)[];
  states?: (string | SearchFilterOptionItem)[];
  countries?: (string | SearchFilterOptionItem)[];
  heights?: (string | SearchFilterOptionItem)[];
  diets?: (string | SearchFilterOptionItem)[];
  income_ranges?: (string | SearchFilterOptionItem)[];
  genders?: (string | SearchFilterOptionItem)[];
  [key: string]: any;
}

export interface BasicSearchParams {
  gender?: string;
  age_min?: number;
  age_max?: number;
  religion?: string;
  caste?: string;
  marital_status?: string;
  city?: string;
  state?: string;
  country?: string;
  verified_only?: boolean;
  page?: number;
  page_size?: number;
  [key: string]: any;
}

export interface AdvancedSearchParams extends BasicSearchParams {
  height_min?: number;
  height_max?: number;
  education?: string;
  occupation?: string;
  profession?: string;
  annual_income_min?: number;
  annual_income_max?: number;
  mother_tongue?: string;
  diet?: string;
  smoking?: string;
  drinking?: string;
  manglik?: string;
  employed_in?: string;
}

export interface KeywordSearchParams {
  keyword: string;
  page?: number;
  page_size?: number;
}

export interface NearbySearchParams {
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  city?: string;
  state?: string;
  page?: number;
  page_size?: number;
}

export interface AiRecommendedSearchParams {
  page?: number;
  page_size?: number;
  ai_ranking?: boolean;
}

export interface SavedSearchItem {
  id: string | number;
  name: string;
  search_type?: string;
  criteria: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  results_count?: number;
}

export interface CreateSavedSearchPayload {
  name: string;
  search_type?: 'basic' | 'advanced' | 'keyword' | 'nearby' | 'custom';
  criteria: Record<string, any>;
}

export interface UpdateSavedSearchPayload {
  name?: string;
  criteria?: Record<string, any>;
}

export interface RecentlyViewedItem {
  id: string | number;
  profile?: Profile | MatchResponseSchema | any;
  viewed_user?: any;
  user_id?: number | string;
  profile_id?: number | string;
  viewed_at?: string;
  created_at?: string;
  search_query?: string;
}

export interface CompatibilityScoreResponse {
  target_user_id: number | string;
  overall_score: number;
  compatibility_percentage?: number;
  category_scores?: {
    lifestyle?: number;
    education_career?: number;
    values_culture?: number;
    horoscope_astrology?: number;
    family?: number;
    [key: string]: any;
  };
  strengths?: string[];
  growth_areas?: string[];
  summary?: string;
  [key: string]: any;
}

export interface SearchResultsResponse<T = any> {
  results: T[];
  count?: number;
  total?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
}
