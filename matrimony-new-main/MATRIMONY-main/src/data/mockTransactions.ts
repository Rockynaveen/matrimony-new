import type { PaymentTransaction } from '../types';

export const MOCK_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: 'TXN-98401',
    transactionId: 'PAY-UPI-8849204192',
    date: '2026-02-01',
    plan: 'Gold Premier (6 Months)',
    amount: 4999,
    method: 'UPI',
    status: 'Success',
    invoiceUrl: '#'
  },
  {
    id: 'TXN-88210',
    transactionId: 'PAY-CC-9948210482',
    date: '2025-08-01',
    plan: 'Silver Choice (3 Months)',
    amount: 2499,
    method: 'Credit/Debit Card',
    status: 'Success',
    invoiceUrl: '#'
  },
  {
    id: 'TXN-77391',
    transactionId: 'PAY-NB-1102938475',
    date: '2025-05-15',
    plan: 'Profile Spotlight Boost',
    amount: 999,
    method: 'Net Banking',
    status: 'Success',
    invoiceUrl: '#'
  }
];
