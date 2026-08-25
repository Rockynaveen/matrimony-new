// ──────────────────────────────────────────────────────────────
// Partner Preferences Service — Dual Route Auto-Discovery Engine
// Supports both Railway routing conventions:
//   Pattern A: /partner-preferences/get/ | /create/ | /update/ | /delete/
//   Pattern B: /partner-preferences/     | /partner-preferences
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const partnerPreferencesService = {
  /**
   * GET partner preferences.
   * Target endpoint: /api/partner-preferences/get/
   * Returns null gracefully when user has no preferences row yet (404).
   */
  async getPreferences(): Promise<PartnerPreferenceAPI | null> {
    try {
      let res = await axiosClient.get<PartnerPreferenceAPI>('/partner-preferences/get/');

      if (res.status === 502 || res.status === 503) {
        await sleep(1500);
        res = await axiosClient.get<PartnerPreferenceAPI>('/partner-preferences/get/');
      }

      if (res.status === 200 && res.data) {
        return res.data;
      }
      if (res.status === 401) {
        throw new PartnerPreferenceServiceError('Unauthorized — please log in', 401);
      }
      if (res.status === 404) {
        // User has not created partner preferences yet in database
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
   * Target endpoint: /api/partner-preferences/create/
   * Automatically falls back to PUT update if record already exists (400 / 409 / 405).
   */
  async createPreferences(payload: PartnerPreferenceCreateRequest): Promise<PartnerPreferenceAPI> {
    try {
      let attempts = 0;
      let res = await axiosClient.post<PartnerPreferenceAPI>('/partner-preferences/create/', payload);

      while ((res.status === 502 || res.status === 503) && attempts < 2) {
        attempts++;
        await sleep(2000);
        res = await axiosClient.post<PartnerPreferenceAPI>('/partner-preferences/create/', payload);
      }

      if (res.status === 200 || res.status === 201) return res.data;
      if (res.status === 401) throw new PartnerPreferenceServiceError('Unauthorized — please log in', 401);

      // If POST returns 400 or 409 or 405 (record already exists), try PUT update
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
   * Target endpoint: /api/partner-preferences/update/
   * Automatically falls back to POST create if record doesn't exist yet (404).
   */
  async updatePreferences(payload: PartnerPreferenceUpdateRequest): Promise<PartnerPreferenceAPI> {
    try {
      let attempts = 0;
      let res = await axiosClient.put<PartnerPreferenceAPI>('/partner-preferences/update/', payload);

      while ((res.status === 502 || res.status === 503) && attempts < 2) {
        attempts++;
        await sleep(2000);
        res = await axiosClient.put<PartnerPreferenceAPI>('/partner-preferences/update/', payload);
      }

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
   * Target endpoint: /api/partner-preferences/delete/
   */
  async deletePreferences(): Promise<{ success: boolean; message: string }> {
    try {
      let res = await axiosClient.delete<{ success: boolean; message: string }>('/partner-preferences/delete/');

      if (res.status === 502 || res.status === 503) {
        await sleep(1500);
        res = await axiosClient.delete<{ success: boolean; message: string }>('/partner-preferences/delete/');
      }

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
