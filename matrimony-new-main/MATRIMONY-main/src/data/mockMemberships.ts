import type { MembershipPlan } from '../types';

export const MOCK_MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'FREE',
    name: 'Free Basic',
    price: 0,
    period: 'Forever',
    features: [
      'Create detailed matrimonial profile',
      'Upload up to 3 photos',
      'Basic search & discovery',
      'Express interest in matches (5/month)',
      'Receive interest from members',
      'View basic compatibility scores'
    ],
    messagingLimit: '0 messages (Upgrade to reply)',
    contactUnlocks: '0 Contact Unlocks',
    profileBoost: 'Standard Visibility',
    featuredProfile: false,
    validityDays: 365
  },
  {
    id: 'SILVER',
    name: 'Silver Choice',
    price: 2499,
    originalPrice: 3499,
    period: '3 Months',
    features: [
      'Everything in Free',
      'Send unlimited interests',
      'Direct messaging (30 matches)',
      '10 Verified Contact Number Unlocks',
      'View detailed Horoscope compatibility',
      'See who viewed your profile',
      'Priority email customer support'
    ],
    messagingLimit: '30 Direct Conversations',
    contactUnlocks: '10 Phone / Email Unlocks',
    profileBoost: '2x Profile Views Boost',
    featuredProfile: false,
    validityDays: 90
  },
  {
    id: 'GOLD',
    name: 'Gold Premier',
    price: 4999,
    originalPrice: 6999,
    period: '6 Months',
    popular: true,
    features: [
      'Everything in Silver',
      'Unlimited Direct Messaging & Voice Notes',
      '30 Verified Contact Number Unlocks',
      'AI Compatibility Breakdown Report',
      'Featured Profile Tag on top search results',
      'Relationship Manager Guidance',
      'Privacy controls (Hide phone/photo)',
      'Highlight profile badge'
    ],
    messagingLimit: 'Unlimited Direct Messaging',
    contactUnlocks: '30 Phone / Email Unlocks',
    profileBoost: '5x Profile Views Boost',
    featuredProfile: true,
    validityDays: 180
  },
  {
    id: 'PLATINUM',
    name: 'Royal VIP Platinum',
    price: 9999,
    originalPrice: 14999,
    period: '12 Months',
    features: [
      'Everything in Gold',
      'Dedicated Human Matchmaker & Relationship Manager',
      'Unlimited Verified Contact Unlocks',
      'Handpicked Verified Elite Matches monthly',
      'Background verification report included',
      'Top priority spotlight ranking for 12 months',
      'Exclusive VIP Customer Support Hotline 24/7'
    ],
    messagingLimit: 'Unlimited Priority Messaging & Video Calls',
    contactUnlocks: 'Unlimited Contact Unlocks',
    profileBoost: '10x Top Spotlight Ranking',
    featuredProfile: true,
    validityDays: 365
  }
];
