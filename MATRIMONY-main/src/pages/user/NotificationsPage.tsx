import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { notificationApi, type NotificationPreferencesSchema } from '../../api/notificationApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Bell,
  Heart,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Crown,
  CheckCheck,
  ChevronRight,
  RefreshCw,
  Trash2,
  Settings,
  Save,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification, fetchNotifications, showToast } = useApp();
  const [activeCategory, setActiveCategory] = useState<'All' | 'Interests' | 'Matches' | 'Messages' | 'Profile' | 'Membership'>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPrefsModalOpen, setIsPrefsModalOpen] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferencesSchema>({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    interest_alerts: true,
    match_alerts: true,
    message_alerts: true,
    marketing_emails: false
  });
  const navigate = useNavigate();

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
    showToast('Notifications updated');
  };

  const handleOpenPrefs = async () => {
    setIsPrefsModalOpen(true);
    try {
      const data = await notificationApi.getPreferences();
      if (data && Object.keys(data).length > 0) {
        setPrefs(prev => ({ ...prev, ...data }));
      }
    } catch {}
  };

  const handleSavePrefs = async () => {
    try {
      setIsSavingPrefs(true);
      await notificationApi.updatePreferences(prefs);
      showToast('Notification preferences updated successfully ✓');
      setIsPrefsModalOpen(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save preferences');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const categories = [
    { name: 'All', icon: Bell },
    { name: 'Interests', icon: Heart },
    { name: 'Matches', icon: Sparkles },
    { name: 'Messages', icon: MessageSquare },
    { name: 'Profile', icon: ShieldCheck },
    { name: 'Membership', icon: Crown }
  ];

  const filteredNotifs = notifications.filter(
    n => activeCategory === 'All' || n.category === activeCategory
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Interests':
        return <Heart className="h-4 w-4 text-rose-500 fill-rose-500/20" />;
      case 'Matches':
        return <Sparkles className="h-4 w-4 text-amber-500" />;
      case 'Messages':
        return <MessageSquare className="h-4 w-4 text-[#8B1E3F]" />;
      case 'Profile':
        return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
      case 'Membership':
        return <Crown className="h-4 w-4 text-amber-600" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    showToast('All notifications marked as read ✓');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="gold" className="text-[10px] uppercase font-bold">Activity Hub</Badge>
            {unreadCount > 0 && (
              <Badge variant="primary" className="text-[10px] font-bold">{unreadCount} Unread</Badge>
            )}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mt-1">Notification Center</h1>
          <p className="text-xs text-muted-foreground">Stay informed on profile views, interest updates, and match alerts.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenPrefs}
            className="text-xs font-bold border-stone-200"
          >
            <Settings className="h-3.5 w-3.5 mr-1 text-stone-600" /> Preferences
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs font-bold"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAllRead}
            className="text-xs font-bold"
          >
            <CheckCheck className="h-4 w-4 mr-1 text-[#8B1E3F]" /> Mark All Read
          </Button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => {
          const Icon = cat.icon;
          const count = cat.name === 'All'
            ? notifications.length
            : notifications.filter(n => n.category === cat.name).length;

          return (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name as any)}
              className={`px-4 py-2 text-xs font-bold rounded-2xl whitespace-nowrap transition-all flex items-center gap-2 border ${
                activeCategory === cat.name
                  ? 'bg-[#8B1E3F] text-white border-[#8B1E3F] shadow-md scale-105'
                  : 'bg-white text-muted-foreground border-border/70 hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  activeCategory === cat.name ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications Card List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredNotifs.length > 0 ? (
            filteredNotifs.map(n => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  onClick={() => {
                    markNotificationRead(n.id);
                    if (n.link) navigate(n.link);
                  }}
                  className={`p-5 flex items-start gap-4 cursor-pointer transition-all duration-200 hover:shadow-lg rounded-3xl border ${
                    !n.read
                      ? 'bg-white border-[#8B1E3F]/40 shadow-xs ring-1 ring-[#8B1E3F]/10'
                      : 'bg-stone-50/50 border-border/60 opacity-90'
                  }`}
                >
                  {/* Left Avatar / Icon */}
                  <div className="relative shrink-0 mt-0.5">
                    {n.avatar ? (
                      <img src={n.avatar} alt="" className="h-11 w-11 rounded-2xl object-cover ring-2 ring-primary/20 shadow-xs" />
                    ) : (
                      <div className="h-11 w-11 rounded-2xl bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center shadow-2xs">
                        {getCategoryIcon(n.category)}
                      </div>
                    )}
                    {!n.read && (
                      <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-[#C44569] border-2 border-white rounded-full" />
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8B1E3F] bg-[#8B1E3F]/10 px-2 py-0.5 rounded-md">
                          {n.category}
                        </span>
                        <h5 className="font-serif font-bold text-sm text-foreground truncate">{n.title}</h5>
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground shrink-0">{n.timestamp}</span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {n.message}
                    </p>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1 shrink-0 self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                        showToast('Notification deleted');
                      }}
                      title="Delete Notification"
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-border p-8 space-y-3">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Bell className="h-6 w-6" />
              </div>
              <h4 className="font-serif text-lg font-bold text-foreground">No notifications in {activeCategory}</h4>
              <p className="text-xs text-muted-foreground">Check back later for match activity or interest updates.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Notification Preferences Modal */}
      <Modal
        isOpen={isPrefsModalOpen}
        onClose={() => setIsPrefsModalOpen(false)}
        title="Notification Preferences"
      >
        <div className="space-y-5">
          <p className="text-xs text-stone-500">
            Control how and when you receive notifications from Vivah Matrimony matching service.
          </p>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {[
              { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive email summaries for important activity' },
              { key: 'push_notifications', label: 'Push Notifications', desc: 'Real-time alerts on your device' },
              { key: 'sms_notifications', label: 'SMS Alerts', desc: 'Urgent mobile notifications' },
              { key: 'interest_alerts', label: 'Interest Expressed Alerts', desc: 'Get notified when someone sends you an interest' },
              { key: 'match_alerts', label: 'New Match Alerts', desc: 'Get notified on high compatibility recommendations' },
              { key: 'message_alerts', label: 'Chat Message Notifications', desc: 'Get notified when you receive new chat messages' },
              { key: 'marketing_emails', label: 'Promotions & Tips', desc: 'Occasional promotional offers and matchmaking tips' }
            ].map(item => (
              <label key={item.key} className="flex items-start justify-between gap-4 p-3 bg-stone-50 rounded-2xl border border-stone-200/80 cursor-pointer hover:bg-stone-100/60 transition-all">
                <div>
                  <h5 className="text-xs font-bold text-stone-900">{item.label}</h5>
                  <p className="text-[11px] text-stone-500">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean((prefs as any)[item.key])}
                  onChange={e => setPrefs(prev => ({ ...prev, [item.key]: e.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-[#8B1E3F] focus:ring-[#8B1E3F]"
                />
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPrefsModalOpen(false)}
              className="rounded-xl px-4 text-xs font-bold border-stone-200"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isSavingPrefs}
              onClick={handleSavePrefs}
              className="bg-[#8B1E3F] hover:bg-[#721733] text-white rounded-xl px-5 text-xs font-bold shadow-md"
            >
              {isSavingPrefs ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1" /> Save Preferences
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
