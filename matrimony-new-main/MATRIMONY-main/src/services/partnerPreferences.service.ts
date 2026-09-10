// ──────────────────────────────────────────────────────────────
// Partner Preferences Service
// Endpoints:
//   POST   /api/partner-preferences/create/
//   GET    /api/partner-preferences/get/
//   PUT    /api/partner-preferences/update/
//   DELETE /api/partner-preferences/delete/
// ──────────────────────────────────────────────────────────────

import { axiosClient } from '../api/axiosClient';
import type {
  PartnerPreferenceAPI,
  PartnerPreferenceCreateRequest,
  PartnerPreferenceUpdateRequest,
} from '../types/partnerPreferences.types';

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
      const res = await axiosClient.get<any>('/partner-preferences/get/');

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
      const res = await axiosClient.post<PartnerPreferenceAPI>('/partner-preferences/create/', payload);

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
      if (err instanceof PartnerPreferenceServiceError) throw err;
      throw new PartnerPreferenceServiceError(
        extractErrorMessage(err?.response?.data || err, 'Failed to save preferences'),
        err?.status || 500
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
      const res = await axiosClient.put<PartnerPreferenceAPI>('/partner-preferences/update/', payload);

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
      if (err instanceof PartnerPreferenceServiceError) throw err;
      throw new PartnerPreferenceServiceError(
        extractErrorMessage(err?.response?.data || err, 'Failed to update preferences'),
        err?.status || 500
      );
    }
  },

  /**
   * DELETE partner preferences.
   * Target endpoint: https://matrimony-production-4b00.up.railway.app/api/partner-preferences/delete/
   */
  async deletePreferences(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await axiosClient.delete<{ success: boolean; message: string }>('/partner-preferences/delete/');

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
