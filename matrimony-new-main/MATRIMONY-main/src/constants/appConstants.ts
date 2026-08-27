// Centralized Application Constants & Configuration

export const APP_CONFIG = {
  APP_NAME: 'Vivah',
  SUBTITLE: 'Match',
  TAGLINE: 'Find Your Soulmate With Royal Trust',
  DEFAULT_CURRENCY: '₹',
  DEFAULT_COUNTRY: 'India',
  SUPPORT_EMAIL: 'support@vivahmatch.com'
} as const;

export const DEMO_PRESETS = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_FREE_CREDITS: 3
} as const;

export const MASTER_DATA = {
  RELIGIONS: [
    'Hindu',
    'Muslim',
    'Christian',
    'Sikh',
    'Jain',
    'Buddhist',
    'Parsi',
    'Jewish',
    'Other'
  ],
  MARITAL_STATUSES: [
    'Never Married',
    'Divorced',
    'Widowed',
    'Awaiting Divorce'
  ],
  DIET_TYPES: [
    'Vegetarian',
    'Non-Vegetarian',
    'Eggetarian',
    'Vegan',
    'Jain'
  ],
  EDUCATION_LEVELS: [
    'B.Tech / B.E.',
    'M.Tech / M.E.',
    'B.Sc / M.Sc',
    'MBA / PGDM',
    'MBBS / MD / MS',
    'Ph.D / Doctorate',
    'B.Com / M.Com',
    'High School / Diploma'
  ],
  PROFESSIONS: [
    'Software Engineer',
    'Product Manager',
    'Data Scientist',
    'Doctor / Medical Professional',
    'Civil Services / Government',
    'Business / Entrepreneur',
    'Chartered Accountant',
    'Consultant',
    'Teacher / Professor'
  ]
} as const;
