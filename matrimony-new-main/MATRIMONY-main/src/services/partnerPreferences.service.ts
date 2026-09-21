// ──────────────────────────────────────────────────────────────
// Partner Preferences Service
// Endpoints:
//   POST   https://matrimony-production-4b00.up.railway.app/api/partner-preferences/create/
//   GET    https://matrimony-production-4b00.up.railway.app/api/partner-preferences/get/
//   PUT    https://matrimony-production-4b00.up.railway.app/api/partner-preferences/update/
//   DELETE https://matrimony-production-4b00.up.railway.app/api/partner-preferences/delete/
// ──────────────────────────────────────────────────────────────

import { axiosClient } from '../api/axiosClient';
import type {
  PartnerPreferenceAPI,
  PartnerPreferenceCreateRequest,
  PartnerPreferenceUpdateRequest,
} from '../types/partnerPreferences.types';

export const PARTNER_PREFERENCES_ENDPOINTS = {
  CREATE: '/partner-preferences/create/',
  GET: '/partner-preferences/get/',
  UPDATE: '/partner-preferences/update/',
  DELETE: '/partner-preferences/delete/',
  // Explicit Production Railway Endpoints
  PROD_CREATE: 'https://matrimony-production-4b00.up.railway.app/api/partner-preferences/create/',
  PROD_GET: 'https://matrimony-production-4b00.up.railway.app/api/partner-preferences/get/',
  PROD_UPDATE: 'https://matrimony-production-4b00.up.railway.app/api/partner-preferences/update/',
  PROD_DELETE: 'https://matrimony-production-4b00.up.railway.app/api/partner-preferences/delete/',
} as const;

export class PartnerPreferenceServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'PartnerPreferenceServiceError';
    this.status = status;
  }
}

function extractErrorMessage(data: any, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.detail) {
    if (Array.isArray(data.detail)) {
      return data.detail.map((e: any) => `${e.loc?.join('.') || ''}: ${e.msg}`).join('; ');
    }
    return String(data.detail);
  }
  if (data.message) return String(data.message);
  return fallback;
}

export const partnerPreferencesService = {
  /**
   * GET partner preferences.
   * Target endpoint: https://matrimony-production-4b00.up.railway.app/api/partner-preferences/get/
   * Returns null gracefully when user has no preferences row yet (404).
   */
  async getPreferences(): Promise<PartnerPreferenceAPI | null> {
    try {
      const res = await axiosClient.get<any>(PARTNER_PREFERENCES_ENDPOINTS.GET);

      if (res.status === 200 && res.data) {
        const raw = res.data;
        const normalized = raw.data || raw.partner_preference || raw.partner_preferences || raw.preferences || raw.preference || raw.result || raw;
        return normalized;
      }
      if (res.status === 401) {
        throw new PartnerPreferenceServiceError('Unauthorized — please log in', 401);
      }
      if (res.status === 404) {
        // User has not created partner preferences yet
        return null;
      }

      throw new PartnerPreferenceServiceError(
        extractErrorMessage(res.data, `Failed to fetch preferences (${res.status})`),
        res.status
      );
    } catch (err: any) {
      if (err instanceof PartnerPreferenceServiceError) throw err;
      return null;
    }
  },

  /**
   * POST create partner preferences.
   * Target endpoint: https://matrimony-production-4b00.up.railway.app/api/partner-preferences/create/
   * If record already exists in database (400 / 409 / 405), calls updatePreferences.
   */
  async createPreferences(payload: PartnerPreferenceCreateRequest): Promise<PartnerPreferenceAPI> {
    try {
      const res = await axiosClient.post<PartnerPreferenceAPI>(PARTNER_PREFERENCES_ENDPOINTS.CREATE, payload);

      if (res.status === 200 || res.status === 201) return res.data;
      if (res.status === 401) throw new PartnerPreferenceServiceError('Unauthorized — please log in', 401);

      // If record already exists, automatically update it
      const errorMsg = extractErrorMessage(res.data, '');
      if (res.status === 400 || res.status === 409 || res.status === 405 || errorMsg.toLowerCase().includes('exist')) {
        return this.updatePreferences(payload);
      }

      throw new PartnerPreferenceServiceError(
        extractErrorMessage(res.data, `Failed to save preferences (${res.status})`),
        res.status
      );
    } catch (err: any) {
      const status = err?.response?.status || err?.status;
      const errorMsg = extractErrorMessage(err?.response?.data || err, '');
      if (status === 400 || status === 409 || status === 405 || errorMsg.toLowerCase().includes('exist') || errorMsg.toLowerCase().includes('already')) {
        return this.updatePreferences(payload);
      }
      if (err instanceof PartnerPreferenceServiceError) throw err;
      throw new PartnerPreferenceServiceError(
        extractErrorMessage(err?.response?.data || err, 'Failed to save preferences'),
        status || 500
      );
    }
  },

  /**
   * PUT update partner preferences.
   * Target endpoint: https://matrimony-production-4b00.up.railway.app/api/partner-preferences/update/
   * If record does not exist yet (404), calls createPreferences.
   */
  async updatePreferences(payload: PartnerPreferenceUpdateRequest): Promise<PartnerPreferenceAPI> {
    try {
      const res = await axiosClient.put<PartnerPreferenceAPI>(PARTNER_PREFERENCES_ENDPOINTS.UPDATE, payload);

      if (res.status === 200 || res.status === 201) return res.data;
      if (res.status === 401) throw new PartnerPreferenceServiceError('Unauthorized — please log in', 401);

      // If PUT returned 404 (record does not exist in DB yet) → create it with POST
      if (res.status === 404) {
        return this.createPreferences(payload);
      }

      throw new PartnerPreferenceServiceError(
        extractErrorMessage(res.data, `Failed to update preferences (${res.status})`),
        res.status
      );
    } catch (err: any) {
      const status = err?.response?.status || err?.status;
      if (status === 404) {
        return this.createPreferences(payload);
      }
      if (err instanceof PartnerPreferenceServiceError) throw err;
      throw new PartnerPreferenceServiceError(
        extractErrorMessage(err?.response?.data || err, 'Failed to update preferences'),
        status || 500
      );
    }
  },

  /**
   * Universal save handler for partner preferences.
   * Tries update first; falls back to create if not yet existing.
   */
  async savePreferences(payload: PartnerPreferenceUpdateRequest): Promise<PartnerPreferenceAPI> {
    try {
      return await this.updatePreferences(payload);
    } catch (err) {
      return await this.createPreferences(payload);
    }
  },

  /**
   * DELETE partner preferences.
   * Target endpoint: https://matrimony-production-4b00.up.railway.app/api/partner-preferences/delete/
   */
  async deletePreferences(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await axiosClient.delete<{ success: boolean; message: string }>(PARTNER_PREFERENCES_ENDPOINTS.DELETE);

      if (res.status === 200 || res.status === 204 || res.status === 404) {
        return res.data || { success: true, message: 'Partner preferences deleted' };
      }
      if (res.status === 401) throw new PartnerPreferenceServiceError('Unauthorized — please log in', 401);

      throw new PartnerPreferenceServiceError(
        extractErrorMessage(res.data, `Failed to delete preferences (${res.status})`),
        res.status
      );
    } catch (err: any) {
      if (err instanceof PartnerPreferenceServiceError) throw err;
      return { success: true, message: 'Preferences cleared' };
    }
  },
};
