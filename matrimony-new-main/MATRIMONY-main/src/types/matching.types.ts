// Matching API Request / Response Types

export interface MatchResponseSchema {
  user_id: number;
  first_name: string;
  last_name: string;
  profile_photo: string | null;
  age: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  occupation: string;
  education: string;
  religion: string;
  caste: string;
  match_percentage: number;
  matched_fields: string[];
  is_mutual: boolean;
}

export interface InterestResponseSchema {
  id: number;
  from_user: number;
  to_user: number;
  first_name: string;
  last_name: string;
  profile_photo: string | null;
  age: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  occupation: string | null;
  education: string | null;
  religion: string | null;
  caste: string | null;
  message: string | null;
  status: string; // e.g. "Pending", "Accepted", "Rejected", "Withdrawn"
  is_seen: boolean;
  created_at: string;
}

export interface InterestSendSchema {
  to_user: number;
  message?: string | null;
}

export interface InterestUpdateSchema {
  status: string; // "Accepted" | "Rejected" | "Withdrawn"
}

export interface ShortlistCreateSchema {
  user: number; // user_id of the profile to shortlist
}

export interface IgnoreCreateSchema {
  user: number; // user_id to ignore
  reason?: string | null;
}

export interface BlockCreateSchema {
  user: number; // user_id to block
  reason?: string | null;
}

export interface MessageResponseSchema {
  success: boolean;
  message: string;
}
