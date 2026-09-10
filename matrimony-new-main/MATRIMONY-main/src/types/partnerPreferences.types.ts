// ──────────────────────────────────────────────────────────────
// Partner Preferences API Types
// Confirmed schema from Railway Backend:
//   POST   /api/partner-preferences/create/
//   GET    /api/partner-preferences/get/
//   PUT    /api/partner-preferences/update/
//   DELETE /api/partner-preferences/delete/
// ──────────────────────────────────────────────────────────────

export interface PartnerPreferenceBackendSchema {
  id?: number;
  user?: number;
  minimum_age: number;
  maximum_age: number;
  is_age_required: boolean;
  minimum_height: number;
  maximum_height: number;
  is_height_required: boolean;
  income_range_ids: number[];
  minimum_salary: number;
  maximum_salary: number;
  is_income_required: boolean;
  education_ids: number[];
  is_education_required: boolean;
  profession_ids: number[];
  is_profession_required: boolean;
  religion_ids: number[];
  is_religion_required: boolean;
  caste_ids: number[];
  is_caste_required: boolean;
  preferred_diets: string[];
  preferred_smoking: string[];
  preferred_drinking: string[];
  language_ids: number[];
  is_diet_required: boolean;
  is_lifestyle_required: boolean;
  preferred_marital_statuses: string[];
  is_marital_status_required: boolean;
  preferred_manglik: string;
  is_horoscope_required: boolean;
  country_ids: number[];
  state_ids: number[];
  district_ids: number[];
  mandal_ids: number[];
  village_ids: number[];
  is_location_required: boolean;

  // Optional display/metadata fields from GET
  [key: string]: any;
}

export type PartnerPreferenceAPI = PartnerPreferenceBackendSchema;
export type PartnerPreferenceCreateRequest = PartnerPreferenceBackendSchema;
export type PartnerPreferenceUpdateRequest = PartnerPreferenceBackendSchema;
