import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Check,
  X,
  Eye,
  Search,
  Filter,
  FileText,
  Camera,
  Clock,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { verificationService } from '../../services/verification.service';
import type { AdminPendingVerificationItem } from '../../types/apiTypes';

export const AdminVerificationQueue: React.FC = () => {
  const {
    adminApproveUserVerification,
    adminRejectUserVerification,
    showToast
  } = useApp();

  const [items, setItems] = useState<AdminPendingVerificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');

  // Preview Modal State
  const [selectedDocPreview, setSelectedDocPreview] = useState<{ title: string; url: string } | null>(null);

  // Reject Modal State
  const [rejectingItem, setRejectingItem] = useState<AdminPendingVerificationItem | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Document image is blurry or unreadable. Please provide a clear copy.');

  const fetchQueue = async () => {
    try {
      setIsLoading(true);
      const data = await verificationService.getPendingVerifications();
      setItems(data);
    } catch {
      showToast('Failed to fetch verification queue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (item: AdminPendingVerificationItem) => {
    await adminApproveUserVerification(item.user_email || item.user_id);
    setItems(prev => prev.map(i => i.user_id === item.user_id ? { ...i, status: 'VERIFIED' } : i));
  };

  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    await adminRejectUserVerification(rejectingItem.user_email || rejectingItem.user_id, rejectReason);
    setItems(prev => prev.map(i => i.user_id === rejectingItem.user_id ? { ...i, status: 'REJECTED', rejection_reason: rejectReason } : i));
    setRejectingItem(null);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch =
      (item.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.user_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.user_id || '').toLowerCase().includes(searchTerm.toLowerCase());

    const itemStatus = (item.status || 'PENDING').toUpperCase();
    if (activeFilter === 'ALL') return matchesSearch;
    return matchesSearch && itemStatus === activeFilter;
  });

  const pendingCount = items.filter(i => (i.status || 'PENDING').toUpperCase() === 'PENDING').length;
  const verifiedCount = items.filter(i => (i.status || '').toUpperCase() === 'VERIFIED').length;
  const rejectedCount = items.filter(i => (i.status || '').toUpperCase() === 'REJECTED').length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="mb-1">Admin Moderation</Badge>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
              {pendingCount} Pending Review
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Member Identity Verifications
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review Government ID documents and Live Selfie Photos to approve or reject verified badges.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchQueue}
          disabled={isLoading}
          className="text-xs"
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh List
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter('PENDING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeFilter === 'PENDING'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter('VERIFIED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeFilter === 'VERIFIED'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Verified ({verifiedCount})
          </button>
          <button
            onClick={() => setActiveFilter('REJECTED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeFilter === 'REJECTED'
                ? 'bg-rose-700 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeFilter === 'ALL'
                ? 'bg-stone-900 text-white shadow-md'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            All Submissions ({items.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by member name, email or ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
          />
        </div>
      </div>

      {/* Verification Queue Cards */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h4 className="font-bold text-sm text-foreground">No verification requests found</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {activeFilter === 'PENDING'
              ? 'Great work! All member identity verifications have been reviewed.'
              : 'No entries match your search criteria.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(item => {
            const status = (item.status || 'PENDING').toUpperCase();

            return (
              <Card key={item.id || item.user_id} className="p-6 transition-all hover:shadow-md">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  {/* Member Meta */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#8B1E3F] bg-[#8B1E3F]/10 px-2.5 py-0.5 rounded-full">
                        ID: {item.user_id}
                      </span>
                      {status === 'VERIFIED' && (
                        <Badge variant="verified">✓ VERIFIED</Badge>
                      )}
                      {status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                          <Clock className="h-3 w-3" /> PENDING REVIEW
                        </span>
                      )}
                      {status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-300">
                          <X className="h-3 w-3" /> REJECTED
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-lg font-bold text-foreground">
                      {item.user_name}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span>Email: <strong>{item.user_email}</strong></span>
                      {item.user_phone && <span>Phone: <strong>{item.user_phone}</strong></span>}
                      {item.gender && <span>Gender: <strong>{item.gender}</strong></span>}
                      <span className="text-[11px] text-muted-foreground/80">
                        Submitted: {item.submitted_at}
                      </span>
                    </div>

                    {status === 'REJECTED' && item.rejection_reason && (
                      <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                        <strong>Rejection Reason:</strong> {item.rejection_reason}
                      </p>
                    )}
                  </div>

                  {/* Document & Live Photo Previews */}
                  <div className="flex items-center gap-4 shrink-0">
                    {/* Govt ID Document Card */}
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] font-semibold text-muted-foreground block">
                        {item.id_document_type || 'Govt ID'}
                      </span>
                      {item.id_document_url && item.id_document_url.startsWith('data:image') ? (
                        <button
                          type="button"
                          onClick={() => setSelectedDocPreview({ title: `${item.user_name} - ${item.id_document_type || 'Government ID'}`, url: item.id_document_url })}
                          className="group relative h-16 w-20 rounded-xl overflow-hidden border border-border hover:border-[#8B1E3F] block"
                        >
                          <img src={item.id_document_url} alt="ID Document" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Eye className="h-4 w-4" />
                          </div>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedDocPreview({ title: `${item.user_name} - Govt ID Document`, url: item.id_document_url || 'Document File' })}
                          className="h-16 w-20 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center text-amber-800 hover:bg-amber-100 transition-colors"
                        >
                          <FileText className="h-6 w-6 text-[#8B1E3F]" />
                          <span className="text-[9px] font-bold mt-1">View Doc</span>
                        </button>
                      )}
                    </div>

                    {/* Live Selfie Card */}
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] font-semibold text-muted-foreground block">
                        Live Selfie
                      </span>
                      {item.live_photo_url ? (
                        <button
                          type="button"
                          onClick={() => setSelectedDocPreview({ title: `${item.user_name} - Live Selfie Photo`, url: item.live_photo_url })}
                          className="group relative h-16 w-16 rounded-xl overflow-hidden border-2 border-purple-400 hover:border-purple-600 block shadow-sm"
                        >
                          <img src={item.live_photo_url} alt="Live Selfie" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Eye className="h-4 w-4" />
                          </div>
                        </button>
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                          <Camera className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 w-full lg:w-auto justify-end border-t lg:border-t-0 border-border/60">
                    {status !== 'VERIFIED' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApprove(item)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                      >
                        <Check className="h-4 w-4 mr-1" /> Approve & Verify
                      </Button>
                    )}

                    {status !== 'REJECTED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectingItem(item)}
                        className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs"
                      >
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Document Full View Modal */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-base text-foreground">
                {selectedDocPreview.title}
              </h3>
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="p-2 text-stone-500 hover:text-stone-900 rounded-full hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-stone-950/5 rounded-2xl p-4">
              {selectedDocPreview.url.startsWith('data:image') || selectedDocPreview.url.startsWith('http') ? (
                <img
                  src={selectedDocPreview.url}
                  alt={selectedDocPreview.title}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl shadow"
                />
              ) : (
                <div className="p-8 text-center space-y-2">
                  <FileText className="h-12 w-12 text-[#8B1E3F] mx-auto" />
                  <p className="text-xs font-bold text-foreground">{selectedDocPreview.url}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDocPreview(null)}
                className="text-xs"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Dialog Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertCircle className="h-5 w-5" />
                <h3 className="font-serif font-bold text-base">Reject Verification Request</h3>
              </div>
              <button
                onClick={() => setRejectingItem(null)}
                className="p-2 text-stone-500 hover:text-stone-900 rounded-full hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Provide a clear reason for rejecting <strong>{rejectingItem.user_name}</strong>'s verification so they can re-upload proper documents.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full bg-stone-50 border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Explain why the document or photo was rejected..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectingItem(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmReject}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
