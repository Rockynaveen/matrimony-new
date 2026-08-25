// ──────────────────────────────────────────────────────────────
// Partner Preferences API Types
// Confirmed schema from Railway Swagger:
//   POST   /api/partner-preferences/create/
//   GET    /api/partner-preferences/get/
//   PUT    /api/partner-preferences/update/
//   DELETE /api/partner-preferences/delete/
// ──────────────────────────────────────────────────────────────

export interface PartnerPreferenceAPI {
  id?: number;
  minimum_age: number;
  maximum_age: number;
  minimum_height: number;
  maximum_height: number;
  religion: string;
  caste: string;
  education: string;
  profession: string;
  minimum_salary: number;
  maximum_salary: number;
  country: string;
  state: string;
  city: string;
  diet: string;
  smoking: string;
  drinking: string;
  marital_status: string;
  horoscope_preferences: string;
}

export type PartnerPreferenceCreateRequest = PartnerPreferenceAPI;
export type PartnerPreferenceUpdateRequest = PartnerPreferenceAPI;
