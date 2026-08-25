export const ADMIN_KPI_STATS = {
  totalUsers: 142580,
  activeUsers: 89400,
  premiumUsers: 34120,
  newRegistrationsToday: 420,
  totalRevenue: '₹2.84 Crore',
  pendingApprovals: 38,
  reportedProfiles: 7,
  verifiedProfilesCount: 112400
};

export const REVENUE_GROWTH_DATA = [
  { month: 'Jan', revenue: 18.4, freeUsers: 12000, goldUsers: 3200 },
  { month: 'Feb', revenue: 22.1, freeUsers: 14200, goldUsers: 3800 },
  { month: 'Mar', revenue: 25.8, freeUsers: 15800, goldUsers: 4500 },
  { month: 'Apr', revenue: 24.2, freeUsers: 16100, goldUsers: 4900 },
  { month: 'May', revenue: 29.5, freeUsers: 18500, goldUsers: 5600 },
  { month: 'Jun', revenue: 34.0, freeUsers: 21000, goldUsers: 6400 },
  { month: 'Jul', revenue: 38.6, freeUsers: 24500, goldUsers: 7200 }
];

export const GENDER_RATIO_DATA = [
  { name: 'Groom (Male)', value: 54, color: '#8B1E3F' },
  { name: 'Bride (Female)', value: 46, color: '#C44569' }
];

export const RELIGION_BREAKDOWN_DATA = [
  { name: 'Hindu', percentage: 68 },
  { name: 'Muslim', percentage: 14 },
  { name: 'Sikh', percentage: 8 },
  { name: 'Christian', percentage: 5 },
  { name: 'Jain', percentage: 3 },
  { name: 'Others', percentage: 2 }
];

export const CITY_STATISTICS_DATA = [
  { city: 'Mumbai / Thane', profiles: 28400 },
  { city: 'Delhi / NCR', profiles: 24100 },
  { city: 'Bengaluru', profiles: 21500 },
  { city: 'Hyderabad', profiles: 18200 },
  { city: 'Pune', profiles: 14600 },
  { city: 'NRI (USA/UK/UAE)', profiles: 19800 }
];

export const MOCK_PROFILE_APPROVALS = [
  {
    id: 'APP-901',
    name: 'Sameer Kapoor',
    age: 28,
    profession: 'Architect',
    location: 'Delhi',
    submittedAt: '2026-02-11 09:30 AM',
    profileImage: '/images/profiles/profile_1.jpg',
    status: 'Pending'
  },
  {
    id: 'APP-902',
    name: 'Ishita Roy',
    age: 26,
    profession: 'Financial Analyst',
    location: 'Kolkata',
    submittedAt: '2026-02-11 08:15 AM',
    profileImage: '/images/profiles/profile_2.jpg',
    status: 'Pending'
  }
];

export const MOCK_PHOTO_MODERATIONS = [
  {
    id: 'PHOTO-801',
    userName: 'Karan Malhotra',
    userRole: 'Gold Member',
    photoUrl: '/images/profiles/profile_3.jpg',
    uploadedAt: '10 mins ago',
    flagReason: 'None (Routine AI Scan Passed)'
  },
  {
    id: 'PHOTO-802',
    userName: 'Riya Gupta',
    userRole: 'Silver Member',
    photoUrl: '/images/profiles/profile_4.jpg',
    uploadedAt: '25 mins ago',
    flagReason: 'None (Face clearly visible)'
  }
];

export const MOCK_AUDIT_LOGS = [
  { id: 'LOG-1', admin: 'SuperAdmin (Rahul)', action: 'Approved Profile Verification', target: 'MAT-1001 (Ananya)', timestamp: '2026-02-11 10:14 AM' },
  { id: 'LOG-2', admin: 'Moderator (Priya)', action: 'Suspended Account', target: 'User #84920 (Spam Bot)', timestamp: '2026-02-11 09:45 AM' },
  { id: 'LOG-3', admin: 'SuperAdmin (Rahul)', action: 'Updated Tax Rate to 18% GST', target: 'System Settings', timestamp: '2026-02-10 04:30 PM' }
];
