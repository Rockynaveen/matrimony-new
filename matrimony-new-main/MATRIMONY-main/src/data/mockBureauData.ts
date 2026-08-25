import type { BureauClient, BureauLead, BureauCommission } from '../types';

export const MOCK_BUREAU_CLIENTS: BureauClient[] = [
  {
    id: 'BUR-C101',
    name: 'Devika Singhania',
    age: 26,
    gender: 'Female',
    religion: 'Hindu',
    caste: 'Agarwal',
    budget: 'High VIP (Gold)',
    status: 'Active',
    matchesFound: 14,
    createdDate: '2026-01-10',
    phone: '+91 98201 12345',
    email: 'devika.s@gmail.com'
  },
  {
    id: 'BUR-C102',
    name: 'Tarun Oberoi',
    age: 30,
    gender: 'Male',
    religion: 'Hindu',
    caste: 'Khatri',
    budget: 'Royal Platinum',
    status: 'Active',
    matchesFound: 22,
    createdDate: '2026-01-15',
    phone: '+91 98110 54321',
    email: 'tarun.oberoi@yahoo.com'
  },
  {
    id: 'BUR-C103',
    name: 'Shalini Nanda',
    age: 28,
    gender: 'Female',
    religion: 'Hindu',
    caste: 'Brahmin',
    budget: 'Silver Choice',
    status: 'Matched',
    matchesFound: 8,
    createdDate: '2025-11-20',
    phone: '+91 97400 88221',
    email: 'shalini.n@gmail.com'
  }
];

export const MOCK_BUREAU_LEADS: BureauLead[] = [
  {
    id: 'LEAD-501',
    name: 'Mrs. Rekha Bansal (Mother)',
    phone: '+91 98102 99881',
    email: 'rekha.bansal@gmail.com',
    source: 'Referral',
    status: 'New',
    date: '2026-02-10'
  },
  {
    id: 'LEAD-502',
    name: 'Col. Vijay Kapoor (Father)',
    phone: '+91 99201 77665',
    email: 'vj.kapoor@gmail.com',
    source: 'Website',
    status: 'Contacted',
    date: '2026-02-09'
  }
];

export const MOCK_BUREAU_COMMISSIONS: BureauCommission[] = [
  {
    id: 'COM-901',
    clientName: 'Tarun Oberoi',
    plan: 'Royal VIP Platinum',
    amount: 9999,
    commissionRate: '20%',
    earnings: 2000,
    date: '2026-01-15',
    status: 'Paid'
  },
  {
    id: 'COM-902',
    clientName: 'Devika Singhania',
    plan: 'Gold Premier',
    amount: 4999,
    commissionRate: '20%',
    earnings: 1000,
    date: '2026-01-10',
    status: 'Paid'
  }
];
