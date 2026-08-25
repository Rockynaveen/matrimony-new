import type { NotificationItem } from '../types';

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-1',
    category: 'Interests',
    title: 'Interest Accepted!',
    message: 'Ananya Sharma accepted your interest expression. You can now start chatting!',
    timestamp: '10 mins ago',
    read: false,
    link: '/messages/MAT-1001',
    avatar: '/images/profiles/profile_2.jpg'
  },
  {
    id: 'NOTIF-2',
    category: 'Matches',
    title: 'New 95% AI Match Found',
    message: 'Karan Malhotra matches 95% of your partner preferences in Delhi NCR.',
    timestamp: '1 hour ago',
    read: false,
    link: '/profile/MAT-1004',
    avatar: '/images/profiles/profile_3.jpg'
  },
  {
    id: 'NOTIF-3',
    category: 'Messages',
    title: 'New Message from Rohan Verma',
    message: '"Hello! I checked your profile and would love to connect."',
    timestamp: '2 hours ago',
    read: false,
    link: '/messages/MAT-1002',
    avatar: '/images/profiles/profile_1.jpg'
  },
  {
    id: 'NOTIF-4',
    category: 'Profile',
    title: 'Profile Verified!',
    message: 'Congratulations! Your Government ID & Face Verification is now verified. Verified badge applied.',
    timestamp: '1 day ago',
    read: true,
    link: '/verification'
  },
  {
    id: 'NOTIF-5',
    category: 'Membership',
    title: 'Special 20% Gold Plan Discount',
    message: 'Upgrade to Gold Premier today and unlock 30 contact phone numbers instantly.',
    timestamp: '2 days ago',
    read: true,
    link: '/membership'
  }
];
