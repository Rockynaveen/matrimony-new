export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'document' | 'attachment' | 'horoscope';

export interface ChatUserBasic {
  id: number;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  profile_photo?: string;
  avatar?: string;
  is_online?: boolean;
  city?: string;
  profession?: string;
  match_percentage?: number;
}

export interface ConversationOut {
  id: number | string;
  room_id?: number;
  other_user?: ChatUserBasic;
  user1_id?: number;
  user2_id?: number;
  last_message?: string;
  last_message_time?: string;
  created_at?: string;
  unread_count?: number;
  is_online?: boolean;
}

export interface ChatMessageOut {
  id: number | string;
  room_id: number;
  sender_id?: number;
  sender_name?: string;
  is_me?: boolean;
  message?: string;
  text?: string;
  message_type?: MessageType;
  attachment_url?: string;
  file_name?: string;
  file_size?: string;
  duration?: string;
  status?: 'sent' | 'delivered' | 'read';
  is_deleted?: boolean;
  is_deleted_for_everyone?: boolean;
  created_at?: string;
  time?: string;
  extraData?: any;
}

export interface SendTextMessagePayload {
  room_id: number;
  message: string;
}

export interface CallInitiatePayload {
  room_id?: number;
  receiver_id?: number;
  call_type?: 'audio' | 'video';
}

export interface CallOut {
  call_id?: number;
  id?: number;
  room_id?: number;
  caller_id?: number;
  receiver_id?: number;
  status?: 'initiating' | 'ringing' | 'accepted' | 'rejected' | 'ended';
  call_type?: 'audio' | 'video';
  caller_name?: string;
  caller_avatar?: string;
  created_at?: string;
}

export interface CallRespondPayload {
  action: 'accept' | 'reject' | 'decline' | 'busy' | 'end';
}

export interface CallSignalPayload {
  sdp_offer?: string;
  sdp_answer?: string;
  caller_candidates?: string;
  receiver_candidates?: string;
}
