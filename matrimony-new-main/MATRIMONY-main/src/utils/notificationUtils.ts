import type { NotificationItem } from '../types';

export interface NotificationLike {
  id?: string | number;
  category?: string | null;
  notification_type?: string | null;
  type?: string | null;
  title?: string | null;
  message?: string | null;
  text?: string | null;
  content?: string | null;
  link?: string | null;
  url?: string | null;
  redirect_url?: string | null;
  action_url?: string | null;
  target_url?: string | null;
  path?: string | null;
  user_id?: string | number | null;
  from_user?: string | number | null;
  from_user_id?: string | number | null;
  sender_id?: string | number | null;
  actor_id?: string | number | null;
  target_id?: string | number | null;
  target_user_id?: string | number | null;
  related_object_id?: string | number | null;
  related_user_id?: string | number | null;
  conversation_id?: string | number | null;
  chat_id?: string | number | null;
  [key: string]: any;
}

/**
 * Resolves the destination route for any notification.
 * Guarantees the destination is a valid frontend route and NEVER dumps the user on the landing page ('/').
 */
export function resolveNotificationLink(item?: NotificationLike | null): string {
  if (!item) return '/dashboard';

  // 1. Gather all potential raw link candidates
  let raw = String(
    item.redirect_url ||
    item.link ||
    item.url ||
    item.action_url ||
    item.target_url ||
    item.path ||
    ''
  ).trim();

  // Strip origin/domain if it's a full URL
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const parsedUrl = new URL(raw);
      raw = parsedUrl.pathname + parsedUrl.search;
    } catch {
      raw = '';
    }
  }

  // Remove trailing slashes (except single '/')
  if (raw.length > 1 && raw.endsWith('/')) {
    raw = raw.replace(/\/+$/, '');
  }

  // If raw link is an API endpoint, convert to corresponding frontend route
  if (raw.startsWith('/api/') || raw.startsWith('api/')) {
    const cleanApi = raw.replace(/^\/?api(\/v\d+)?\//, '/');
    if (cleanApi.includes('interest')) {
      return '/interests';
    }
    if (cleanApi.includes('message') || cleanApi.includes('chat') || cleanApi.includes('conversation')) {
      const matchId = cleanApi.match(/\/(?:messages|chat|conversation)s?\/([a-zA-Z0-9_-]+)/);
      return matchId ? `/messages/${matchId[1]}` : '/messages';
    }
    if (cleanApi.includes('match') || cleanApi.includes('recommendation')) {
      return '/matches';
    }
    if (cleanApi.includes('member') || cleanApi.includes('plan') || cleanApi.includes('transaction') || cleanApi.includes('checkout')) {
      return '/membership';
    }
    if (cleanApi.includes('profile') || cleanApi.includes('user')) {
      const matchId = cleanApi.match(/\/(?:profiles?|users?)\/([a-zA-Z0-9_-]+)/);
      return matchId ? `/profile/${matchId[1]}` : '/profile';
    }
    if (cleanApi.includes('verification') || cleanApi.includes('identity')) {
      return '/verification';
    }
    if (cleanApi.includes('shortlist')) {
      return '/matching/shortlist';
    }
    raw = ''; // discard unknown API endpoint so category fallback takes over
  }

  // NEVER navigate to the public landing page ('/' or '/home' or '#') from a notification!
  if (raw === '/' || raw === '/home' || raw === '#') {
    raw = '';
  }

  // Check known valid frontend routes
  if (raw) {
    if (raw.startsWith('/interests')) return '/interests';
    if (raw.startsWith('/messages')) return raw;
    if (raw.startsWith('/matches') || raw.startsWith('/matching')) {
      if (raw.includes('shortlist')) return '/matching/shortlist';
      if (raw.includes('ignored')) return '/matching/ignored';
      if (raw.includes('blocked')) return '/matching/blocked';
      return '/matches';
    }
    if (raw.startsWith('/membership') || raw.startsWith('/checkout') || raw.startsWith('/payment-history')) {
      return raw;
    }
    if (raw.startsWith('/verification')) return '/verification';
    if (raw.startsWith('/profile') || raw.startsWith('/my-profile')) {
      return raw;
    }
    if (raw.startsWith('/photos')) return '/photos';
    if (raw.startsWith('/search')) return '/search';
    if (raw.startsWith('/preferences')) return '/preferences';
    if (raw.startsWith('/dashboard')) return '/dashboard';
    if (raw.startsWith('/settings') || raw.startsWith('/privacy-settings')) return '/privacy-settings';
  }

  // 2. Infer destination from related IDs and notification context
  const targetUserId =
    item.target_user_id ||
    item.sender_id ||
    item.from_user ||
    item.from_user_id ||
    item.actor_id ||
    item.target_id ||
    item.related_user_id ||
    item.related_object_id ||
    item.user_id;

  const conversationId = item.conversation_id || item.chat_id;

  const fullText = `${item.category || ''} ${item.notification_type || ''} ${item.type || ''} ${item.title || ''} ${item.message || ''} ${item.text || ''} ${item.content || ''}`.toLowerCase();

  // Interests notifications
  if (
    item.category === 'Interests' ||
    fullText.includes('interest')
  ) {
    return '/interests';
  }

  // Messages / Chat notifications
  if (
    item.category === 'Messages' ||
    fullText.includes('message') ||
    fullText.includes('chat') ||
    fullText.includes('conversation')
  ) {
    if (conversationId) return `/messages/${conversationId}`;
    if (targetUserId) return `/messages/${targetUserId}`;
    return '/messages';
  }

  // Matches / Recommendation notifications
  if (
    item.category === 'Matches' ||
    fullText.includes('match') ||
    fullText.includes('recommendation')
  ) {
    if (targetUserId) return `/profile/${targetUserId}`;
    return '/matches';
  }

  // Membership & Billing notifications
  if (
    item.category === 'Membership' ||
    fullText.includes('member') ||
    fullText.includes('gold') ||
    fullText.includes('plan') ||
    fullText.includes('subscription') ||
    fullText.includes('credit') ||
    fullText.includes('payment') ||
    fullText.includes('discount')
  ) {
    return '/membership';
  }

  // Verification & ID notifications
  if (
    fullText.includes('verification') ||
    fullText.includes('verified') ||
    fullText.includes('kyc') ||
    fullText.includes('document') ||
    fullText.includes('id proof') ||
    fullText.includes('identity')
  ) {
    return '/verification';
  }

  // Profile View notifications
  if (
    item.category === 'Profile' ||
    fullText.includes('profile view') ||
    fullText.includes('viewed your profile')
  ) {
    if (targetUserId) return `/profile/${targetUserId}`;
    return '/profile';
  }

  // Photos notifications
  if (fullText.includes('photo') || fullText.includes('picture')) {
    return '/photos';
  }

  // Shortlist notifications
  if (fullText.includes('shortlist')) {
    return '/matching/shortlist';
  }

  // If there's a target user ID attached to an unknown notification
  if (targetUserId) {
    return `/profile/${targetUserId}`;
  }

  // Default fallback for any authenticated user activity is the Dashboard (never the public landing page)
  return '/dashboard';
}
