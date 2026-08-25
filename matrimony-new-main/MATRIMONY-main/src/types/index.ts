export type UserRole = 'user' | 'bureau' | 'admin' | 'superadmin';
export type MembershipTier = 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM';
export type Gender = 'Male' | 'Female';
export type VerificationStatus = 'Pending' | 'Verified' | 'Failed';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  membershipTier: MembershipTier;
  avatar?: string;
  is2FAEnabled: boolean;
  status: 'Active' | 'Suspended' | 'Blocked' | 'Pending';
  joinedDate: string;
}

export interface LocationInfo {
  city: string;
  state: string;
  country: string;
}

export interface HoroscopeInfo {
  rashi: string;
  nakshatra: string;
  dosha: string;
  birthTime?: string;
  birthPlace?: string;
}

export interface FamilyInfo {
  type: 'Nuclear' | 'Joint';
  values: 'Traditional' | 'Moderate' | 'Liberal';
  status: 'Middle Class' | 'Upper Middle Class' | 'High Class' | 'Affluent';
  fatherOccupation: string;
  motherOccupation: string;
  siblings: string;
}

export interface LifestyleInfo {
  diet: 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian' | 'Vegan';
  smoking: 'No' | 'Occasionally' | 'Yes';
  drinking: 'No' | 'Occasionally' | 'Yes';
}

export interface PhysicalAttributes {
  height: string;
  weight: string;
  complexion: string;
  disability: string;
}

export interface PartnerPreference {
  ageMin: number;
  ageMax: number;
  heightMin: string;
  heightMax: string;
  religions: string[];
  castes: string[];
  educations: string[];
  professions: string[];
  incomeMin: string;
  incomeMax: string;
  countries: string[];
  states?: string[];
  cities?: string[];
  maritalStatuses?: string[];
  diet: string[];
  smoking?: string[];
  drinking?: string[];
  rashi?: string[];
  nakshatra?: string[];
  dosha?: string;
  manglik?: string;
}

export interface Profile {
  id: string;
  userId?: string;
  name: string;
  age: number;
  gender: Gender;
  dob: string;
  location: LocationInfo;
  profession: string;
  education: string;
  annualIncome: string;
  religion: string;
  caste: string;
  subcaste?: string;
  motherTongue: string;
  profileImage: string;
  gallery: string[];
  videoIntro?: string;
  verified: boolean;
  online: boolean;
  lastActive?: string;
  compatibilityScore: number;
  compatibilityBreakdown?: {
    education: number;
    lifestyle: number;
    location: number;
    horoscope: number;
    interests: number;
  };
  maritalStatus: string;
  about: string;
  horoscope: HoroscopeInfo;
  family: FamilyInfo;
  lifestyle: LifestyleInfo;
  physicalAttributes: PhysicalAttributes;
  languages: string[];
  hobbies: string[];
  partnerPreferences: PartnerPreference;
  profileCompletion: number;
  createdDate: string;
  shortlisted?: boolean;
  interestSent?: boolean;
  city?: string;
  state?: string;
  height?: string;
  matchPercentage?: number;
}

export interface Match extends Profile {
  matchedOn: string;
  matchType: 'Recommended' | 'Most Compatible' | 'New' | 'Nearby' | 'Horoscope';
}

export interface Interest {
  id: string;
  senderId: string;
  senderName: string;
  senderImage: string;
  senderAge: number;
  senderProfession: string;
  senderLocation: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  sentAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  voiceUrl?: string;
  imageUrl?: string;
  timestamp: string;
  read: boolean;
}

export interface NotificationItem {
  id: string;
  category: 'All' | 'Interests' | 'Matches' | 'Messages' | 'Profile' | 'Membership';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  avatar?: string;
}

export interface MembershipPlan {
  id: MembershipTier;
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  popular?: boolean;
  features: string[];
  messagingLimit: string;
  contactUnlocks: string;
  profileBoost: string;
  featuredProfile: boolean;
  validityDays: number;
}

export interface PaymentTransaction {
  id: string;
  transactionId: string;
  date: string;
  plan: string;
  amount: number;
  method: 'UPI' | 'Credit/Debit Card' | 'Net Banking' | 'Wallet';
  status: 'Success' | 'Pending' | 'Failed';
  invoiceUrl: string;
}

export interface BureauClient {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  religion: string;
  caste: string;
  budget: string;
  status: 'Active' | 'Matched' | 'Inactive';
  matchesFound: number;
  createdDate: string;
  phone: string;
  email: string;
}

export interface BureauLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: 'Website' | 'Referral' | 'Walk-in' | 'Campaign';
  status: 'New' | 'Contacted' | 'Converted' | 'Closed';
  date: string;
}

export interface BureauCommission {
  id: string;
  clientName: string;
  plan: string;
  amount: number;
  commissionRate: string;
  earnings: number;
  date: string;
  status: 'Paid' | 'Pending';
}

export interface SuccessStory {
  id: string;
  coupleName: string;
  weddingDate: string;
  location: string;
  story: string;
  image: string;
  likes: number;
}

export interface SupportTicket {
  id: string;
  ticketNo: string;
  subject: string;
  category: 'Account' | 'Billing' | 'Matches' | 'Technical' | 'Privacy';
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  lastUpdate: string;
}
