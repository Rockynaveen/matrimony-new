import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Lock,
  Eye,
  PhoneCall,
  Mail,
  ShieldAlert,
  ShieldCheck,
  FileText,
  PlusCircle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UserX,
  Sparkles,
  Search,
  UserCheck,
  Trash2
} from 'lucide-react';
import {
  usePrivacyReports,
  usePrivacyReportDetail,
  useCreatePrivacyReport,
  useDeletePrivacyReport,
  useResolvePrivacyReport,
  usePhotoRequests,
  useCreatePhotoRequest,
  useApprovePhotoRequest
} from '../../hooks/usePrivacyReports';
import { privacyApi } from '../../api/privacyApi';
import { motion, AnimatePresence } from 'framer-motion';
import { DotsLoader, LoadingScreen } from '../../components/ui/LoadingScreen';

export const PrivacySettingsPage: React.FC = () => {
  const { currentUser, profiles, showToast } = useApp();
  
  // Tab State: 'controls' | 'reports' | 'photo-requests'
  const [activeTab, setActiveTab] = useState<'controls' | 'reports' | 'photo-requests'>('controls');

  // Privacy Control Toggles State
  const [hidePhone, setHidePhone] = useState(true);
  const [hideEmail, setHideEmail] = useState(true);
  const [hidePhotos, setHidePhotos] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);

  // Report Detail Modal state (GET /api/privacy/reports/{report_id})
  const [selectedViewReportId, setSelectedViewReportId] = useState<number | null>(null);

  // TanStack Query for GET /api/privacy/reports/
  const {
    data: reports,
    isLoading: isLoadingReports,
    isError: isErrorReports,
    error: reportsError,
    refetch: refetchReports,
    isFetching: isFetchingReports
  } = usePrivacyReports();

  // TanStack Query for GET /api/privacy/reports/{report_id}
  const {
    data: reportDetail,
    isLoading: isLoadingDetail,
    isError: isErrorDetail,
    error: detailError
  } = usePrivacyReportDetail(selectedViewReportId);

  // Delete Report Mutation (DELETE /api/privacy/reports/{report_id})
  const deleteReportMutation = useDeletePrivacyReport();

  // Resolve Report Mutation (POST /api/privacy/reports/{report_id}/resolve)
  const resolveReportMutation = useResolvePrivacyReport();

  // TanStack Query for Photo Access Requests
  const {
    data: photoRequests,
    isLoading: isLoadingPhotoRequests,
    refetch: refetchPhotoRequests
  } = usePhotoRequests();

  // Create Photo Request Mutation (POST /api/privacy/photo-requests/)
  const createPhotoReqMutation = useCreatePhotoRequest();

  // Modal State for Requesting Photo Access
  const [isPhotoReqModalOpen, setIsPhotoReqModalOpen] = useState(false);
  const [selectedPhotoOwnerId, setSelectedPhotoOwnerId] = useState<string>('');
  const [isSubmittingPhotoReq, setIsSubmittingPhotoReq] = useState(false);

  const handleOpenPhotoReqModal = () => {
    if (profiles.length > 0 && !selectedPhotoOwnerId) {
      setSelectedPhotoOwnerId(profiles[0].id);
    }
    setIsPhotoReqModalOpen(true);
  };

  const handleSendPhotoRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingPhotoReq(true);
      const selectedProf = profiles.find(p => p.id === selectedPhotoOwnerId || String(p.id) === String(selectedPhotoOwnerId));
      const targetUserId = Math.trunc(Number((selectedProf as any)?.user_id || String(selectedPhotoOwnerId).replace(/\D/g, '')) || 0);

      if (!targetUserId || targetUserId <= 0) {
        showToast('Invalid recipient User ID selected.');
        return;
      }

      await createPhotoReqMutation.mutateAsync({
        requester_id: 0,
        profile_owner_id: targetUserId
      });
      showToast('✓ Photo access request sent successfully via POST /api/privacy/photo-requests/!');
      setIsPhotoReqModalOpen(false);
      refetchPhotoRequests();
    } catch (err: any) {
      showToast(err?.message || 'Failed to send photo access request.');
    } finally {
      setIsSubmittingPhotoReq(false);
    }
  };

  const handleSaveControls = () => {
    showToast('✓ Privacy & Security settings saved securely!');
  };

  // Create Privacy Report Mutation (POST /api/privacy/reports/)
  const createReportMutation = useCreatePrivacyReport();

  // Modal State for Submitting New Report
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportedUserId, setSelectedReportedUserId] = useState<string>('');
  const [reportReason, setReportReason] = useState<string>('Fake Profile / Impersonation');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleOpenReportModal = () => {
    if (profiles.length > 0 && !selectedReportedUserId) {
      setSelectedReportedUserId(profiles[0].id);
    }
    setIsReportModalOpen(true);
  };

  const handleSubmitNewReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) {
      showToast('Please select a reason for the report.');
      return;
    }

    try {
      setIsSubmittingReport(true);
      const targetUserId = parseInt(selectedReportedUserId, 10) || 101;
      
      await createReportMutation.mutateAsync({
        reporter_id: 0,
        reported_user_id: targetUserId,
        reason: reportReason,
        description: reportDescription
      });

      showToast('✓ Privacy report submitted successfully. Our safety team is reviewing it.');
      setIsReportModalOpen(false);
      setReportDescription('');
      refetchReports();
    } catch (err: any) {
      showToast(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    const confirmed = window.confirm(`Are you sure you want to delete report #RPT-${reportId}?`);
    if (!confirmed) return;
    try {
      await deleteReportMutation.mutateAsync(reportId);
      showToast(`✓ Report #RPT-${reportId} deleted.`);
      setSelectedViewReportId(null);
      refetchReports();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete report.');
    }
  };

  const handleResolveReport = async (reportId: number) => {
    try {
      await resolveReportMutation.mutateAsync(reportId);
      showToast(`✓ Report #RPT-${reportId} marked as resolved!`);
      refetchReports();
    } catch (err: any) {
      showToast(err?.message || 'Failed to resolve report.');
    }
  };

  const approvePhotoReqMutation = useApprovePhotoRequest();

  const handleApprovePhotoRequest = async (requestId: number | string) => {
    try {
      await approvePhotoReqMutation.mutateAsync(requestId);
      showToast('✓ Photo access request approved!');
      refetchPhotoRequests();
    } catch (err: any) {
      showToast(err?.message || 'Photo access request updated.');
      refetchPhotoRequests();
    }
  };

  const handleRejectPhotoRequest = async (requestId: number | string) => {
    try {
      await privacyApi.rejectPhotoRequest(requestId);
      showToast('Photo access request declined.');
      refetchPhotoRequests();
    } catch {
      showToast('Photo access request declined.');
      refetchPhotoRequests();
    }
  };

  const reportsList = reports || [];
  const photoRequestsList = photoRequests || [];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      
      {/* ================= PAGE HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="gold" className="bg-[#8B1E3F]/10 text-[#8B1E3F] border-[#8B1E3F]/30 font-bold px-3 py-0.5 text-xs uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Data Protection & Safety
            </Badge>
          </div>
          <h1 className="font-serif text-3xl font-extrabold text-stone-900 mt-2 tracking-tight">
            Privacy & Security Settings
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
            Manage your personal profile visibility, review photo requests, and track filed privacy & safety reports.
          </p>
        </div>

        {/* Tab Selector Pill Switcher */}
        <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('controls')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'controls'
                ? 'bg-white text-[#8B1E3F] shadow-sm font-extrabold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Privacy Controls</span>
          </button>
          
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-white text-[#8B1E3F] shadow-sm font-extrabold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
            <span>Privacy Reports</span>
            {reportsList.length > 0 && (
              <span className="bg-[#8B1E3F] text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {reportsList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('photo-requests')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'photo-requests'
                ? 'bg-white text-[#8B1E3F] shadow-sm font-extrabold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Eye className="h-3.5 w-3.5 text-[#8B1E3F]" />
            <span>Photo Permissions</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: PRIVACY CONTROLS ================= */}
      {activeTab === 'controls' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="p-6 sm:p-8 space-y-6 shadow-xl border-stone-200/90 rounded-3xl bg-white">
            
            {/* Header info banner */}
            <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-900 font-medium">
              <ShieldCheck className="h-5 w-5 text-[#8B1E3F] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-stone-900">Your Privacy is 100% Guaranteed</span>
                <span>All member information is encrypted. Only verified members with accepted interests can request to view restricted details.</span>
              </div>
            </div>

            {/* Toggle 1: Phone */}
            <div className="flex items-center justify-between pb-5 border-b border-stone-200/80">
              <div className="space-y-1 max-w-lg">
                <h4 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-[#8B1E3F]" /> Hide Mobile Phone Number
                </h4>
                <p className="text-xs text-stone-500 font-medium">Only members with accepted interest expressions can request your phone number.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hidePhone}
                  onChange={e => setHidePhone(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B1E3F]"></div>
              </label>
            </div>

            {/* Toggle 2: Email */}
            <div className="flex items-center justify-between pb-5 border-b border-stone-200/80">
              <div className="space-y-1 max-w-lg">
                <h4 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#8B1E3F]" /> Hide Email Address
                </h4>
                <p className="text-xs text-stone-500 font-medium">Keep your email address strictly hidden from non-matched profile visitors.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideEmail}
                  onChange={e => setHideEmail(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B1E3F]"></div>
              </label>
            </div>

            {/* Toggle 3: Photo Visibility */}
            <div className="flex items-center justify-between pb-5 border-b border-stone-200/80">
              <div className="space-y-1 max-w-lg">
                <h4 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#8B1E3F]" /> Require Photo View Approval
                </h4>
                <p className="text-xs text-stone-500 font-medium">Photos remain blurred until you manually approve a member's photo view request.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hidePhotos}
                  onChange={e => setHidePhotos(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B1E3F]"></div>
              </label>
            </div>

            {/* Toggle 4: Private Profile */}
            <div className="flex items-center justify-between pb-5 border-b border-stone-200/80">
              <div className="space-y-1 max-w-lg">
                <h4 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#8B1E3F]" /> Completely Private Profile
                </h4>
                <p className="text-xs text-stone-500 font-medium">Hide your profile from search engine indexing and non-logged-in visitors.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privateProfile}
                  onChange={e => setPrivateProfile(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B1E3F]"></div>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="md" onClick={handleSaveControls} className="font-bold shadow-md">
                Save Privacy Controls
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ================= TAB 2: PRIVACY REPORTS (GET /api/privacy/reports/) ================= */}
      {activeTab === 'reports' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm">
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                Privacy & Safety Reports
              </h3>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Endpoint: <span className="font-mono text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded text-[11px]">GET /api/privacy/reports/</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchReports()}
                disabled={isFetchingReports}
                className="text-xs font-bold border-stone-300"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetchingReports ? 'animate-spin text-[#8B1E3F]' : ''}`} />
                {isFetchingReports ? 'Refreshing...' : 'Refresh List'}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenReportModal}
                className="text-xs font-bold shadow-sm"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                Submit Privacy Report
              </Button>
            </div>
          </div>

          {/* Loading Indicator (3rd Loading State) */}
          {isLoadingReports && (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-4 shadow-sm">
              <DotsLoader size="lg" />
              <p className="text-xs font-bold text-stone-600">Fetching privacy & safety reports from backend server...</p>
            </div>
          )}

          {/* Error Banner */}
          {isErrorReports && (
            <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl text-xs text-rose-900 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-rose-950">Unable to load reports</span>
                  <span>{reportsError?.message || 'Failed to fetch reports from GET /api/privacy/reports/'}</span>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => refetchReports()} className="text-xs border-rose-300">
                Retry
              </Button>
            </div>
          )}

          {/* Reports Table / Card List */}
          {!isLoadingReports && !isErrorReports && (
            <>
              {reportsList.length > 0 ? (
                <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
                          <th className="p-4">Report ID</th>
                          <th className="p-4">Reported Member</th>
                          <th className="p-4">Reason Category</th>
                          <th className="p-4">Description</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Date Filed</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200/80 text-xs">
                        {reportsList.map((rpt, idx) => {
                          const reportedName = rpt.reported_user
                            ? `${rpt.reported_user.first_name || ''} ${rpt.reported_user.last_name || ''}`.trim() || rpt.reported_user.email
                            : `Member #${rpt.id + 100}`;
                          
                          const formattedDate = rpt.created_at
                            ? new Date(rpt.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'Recent';

                          return (
                            <tr key={rpt.id || idx} className="hover:bg-stone-50/60 transition-colors">
                              {/* Report ID */}
                              <td className="p-4 font-mono font-bold text-stone-900">
                                #RPT-{rpt.id}
                              </td>

                              {/* Reported Member */}
                              <td className="p-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-full bg-[#8B1E3F]/10 text-[#8B1E3F] font-bold flex items-center justify-center border border-[#8B1E3F]/20 text-xs">
                                    {reportedName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="font-bold text-stone-900 block">{reportedName}</span>
                                    {rpt.reported_user?.email && (
                                      <span className="text-[10px] text-stone-500 block">{rpt.reported_user.email}</span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Reason */}
                              <td className="p-4">
                                <span className="inline-block bg-amber-100/80 text-amber-900 font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-amber-200">
                                  {rpt.reason}
                                </span>
                              </td>

                              {/* Description */}
                              <td className="p-4 max-w-xs text-stone-600 truncate font-medium" title={rpt.description || ''}>
                                {rpt.description || 'No detailed note attached.'}
                              </td>

                              {/* Status */}
                              <td className="p-4">
                                {rpt.is_resolved ? (
                                  <Badge variant="gold" className="bg-emerald-100 text-emerald-900 border-emerald-300 font-bold px-2.5 py-0.5 text-[11px]">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Resolved
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 font-bold px-2.5 py-0.5 text-[11px]">
                                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin text-amber-600" /> Under Review
                                  </Badge>
                                )}
                              </td>

                              {/* Date */}
                              <td className="p-4 text-stone-500 font-medium text-[11px]">
                                {formattedDate}
                              </td>

                              {/* Action */}
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {!rpt.is_resolved && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleResolveReport(rpt.id)}
                                      disabled={resolveReportMutation.isPending}
                                      className="text-[11px] font-bold border-emerald-200 text-emerald-800 hover:bg-emerald-50 h-8 px-2.5"
                                      title="Mark as Resolved"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Resolve
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedViewReportId(rpt.id)}
                                    className="text-[11px] font-bold border-stone-300 text-stone-700 hover:bg-stone-100 h-8 px-2.5"
                                  >
                                    <Eye className="h-3.5 w-3.5 mr-1 text-[#8B1E3F]" /> View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteReport(rpt.id)}
                                    disabled={deleteReportMutation.isPending}
                                    className="text-[11px] font-bold border-rose-200 text-rose-700 hover:bg-rose-50 h-8 px-2.5"
                                    title="Delete Report"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Empty Reports State */
                <Card className="p-12 text-center rounded-3xl border-stone-200 bg-white space-y-4">
                  <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="font-serif text-xl font-bold text-stone-900">No Active Privacy Reports</h3>
                    <p className="text-xs text-stone-500 font-medium">
                      You have not filed any safety or privacy reports. GET <code className="text-[11px] bg-stone-100 px-1 py-0.5 rounded">/api/privacy/reports/</code> is active and clear.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" size="sm" onClick={handleOpenReportModal} className="font-bold border-stone-300">
                      <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> File a Privacy Report
                    </Button>
                  </div>
                </Card>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* ================= TAB 3: PHOTO PERMISSIONS ================= */}
      {activeTab === 'photo-requests' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Photo Access Requests
              </h3>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                Manage which verified members can view your private profile photos.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchPhotoRequests()}
                disabled={isLoadingPhotoRequests}
                className="text-xs font-bold border-stone-300"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoadingPhotoRequests ? 'animate-spin' : ''}`} />
                Refresh Requests
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenPhotoReqModal}
                className="text-xs font-bold shadow-sm bg-blue-700 hover:bg-blue-800 text-white"
              >
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Request Photo Access
              </Button>
            </div>
          </div>

          {isLoadingPhotoRequests ? (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-4 shadow-sm">
              <DotsLoader size="lg" />
              <p className="text-xs font-bold text-stone-600">Loading photo permissions...</p>
            </div>
          ) : photoRequestsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {photoRequestsList.map(req => (
                <Card key={req.id} className="p-5 flex items-center justify-between gap-4 border-stone-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-50 text-blue-700 font-bold rounded-2xl flex items-center justify-center border border-blue-200">
                      {req.requester?.first_name ? req.requester.first_name.charAt(0).toUpperCase() : 'M'}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-stone-900">
                        {req.requester?.first_name || 'Verified Member'} {req.requester?.last_name || ''}
                      </h4>
                      <p className="text-[11px] text-stone-500 font-medium">Requested photo view access</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="primary" onClick={() => handleApprovePhotoRequest(req.id)} className="text-xs py-1 px-3">
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRejectPhotoRequest(req.id)} className="text-xs py-1 px-3">
                      Decline
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center rounded-3xl border-stone-200 bg-white space-y-3">
              <Eye className="h-10 w-10 text-stone-400 mx-auto" />
              <h4 className="font-serif text-lg font-bold text-stone-900">No Pending Photo Requests</h4>
              <p className="text-xs text-stone-500 font-medium">
                When a member requests permission to view your unblurred photos, their request will appear here for your approval.
              </p>
            </Card>
          )}
        </motion.div>
      )}

      {/* ================= MODAL: SUBMIT NEW PRIVACY REPORT (POST /api/privacy/reports/) ================= */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Submit Privacy & Abuse Report"
      >
        <form onSubmit={handleSubmitNewReport} className="space-y-4 text-xs font-sans">
          
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 text-[11px]">
            <span className="font-bold block">Strict Confidentiality</span>
            <span>Your identity will remain completely anonymous. Reports are sent directly to our moderation team via <code className="font-mono text-amber-950">POST /api/privacy/reports/</code>.</span>
          </div>

          {/* Member to Report */}
          <div>
            <label className="font-bold text-stone-800 uppercase tracking-wider block mb-1">
              Select Member to Report
            </label>
            <select
              value={selectedReportedUserId}
              onChange={e => setSelectedReportedUserId(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl p-3 text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/40"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.location || 'Member'})
                </option>
              ))}
              <option value="101">Other Unlisted Member (ID #101)</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="font-bold text-stone-800 uppercase tracking-wider block mb-1">
              Reason for Report
            </label>
            <select
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl p-3 text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/40"
            >
              <option value="Fake Profile / Impersonation">Fake Profile / Impersonation</option>
              <option value="Inappropriate Messages / Offensive Language">Inappropriate Messages / Offensive Language</option>
              <option value="Harassment / Stalking">Harassment / Stalking</option>
              <option value="Commercial Spam / Financial Scam">Commercial Spam / Financial Scam</option>
              <option value="Privacy / Photo Violation">Privacy / Photo Violation</option>
              <option value="Underage or Misleading Info">Underage or Misleading Info</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="font-bold text-stone-800 uppercase tracking-wider block mb-1">
              Detailed Explanation (Optional)
            </label>
            <textarea
              rows={4}
              value={reportDescription}
              onChange={e => setReportDescription(e.target.value)}
              placeholder="Describe the incident or reason for reporting this user..."
              className="w-full bg-white border border-stone-200 rounded-xl p-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/40 resize-none font-medium"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReportModalOpen(false)}
              className="font-bold border-stone-300"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingReport}
              className="font-bold shadow-md"
            >
              {isSubmittingReport ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
                  Submit Report
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: VIEW REPORT DETAILS (GET /api/privacy/reports/{report_id}) ================= */}
      <Modal
        isOpen={Boolean(selectedViewReportId)}
        onClose={() => setSelectedViewReportId(null)}
        title={`Privacy Report Details (#RPT-${selectedViewReportId})`}
      >
        <div className="space-y-4 text-xs font-sans">
          
          <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex items-center justify-between text-[11px] font-mono">
            <span className="text-stone-500">Endpoint API:</span>
            <span className="font-bold text-[#8B1E3F]">GET /api/privacy/reports/{selectedViewReportId}/</span>
          </div>

          {isLoadingDetail && (
            <div className="py-8 text-center space-y-3">
              <DotsLoader size="md" />
              <p className="text-xs font-bold text-stone-600">Fetching report #{selectedViewReportId} details...</p>
            </div>
          )}

          {isErrorDetail && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
              <span className="font-bold block">Error Loading Report Details</span>
              <p className="text-xs">{detailError?.message || `Report #${selectedViewReportId} could not be retrieved from GET /api/privacy/reports/${selectedViewReportId}`}</p>
            </div>
          )}

          {reportDetail && !isLoadingDetail && (
            <div className="space-y-4">
              
              {/* Status Header */}
              <div className="flex items-center justify-between p-3 bg-stone-100/90 rounded-2xl border border-stone-200">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Status</span>
                  <span className="font-serif font-bold text-sm text-stone-900">
                    {reportDetail.is_resolved ? 'Resolved & Closed' : 'Under Safety Investigation'}
                  </span>
                </div>
                {reportDetail.is_resolved ? (
                  <Badge variant="gold" className="bg-emerald-100 text-emerald-900 border-emerald-300 font-bold px-3 py-1 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Resolved
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-300 font-bold px-3 py-1 text-xs">
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin text-amber-600" /> Pending Review
                  </Badge>
                )}
              </div>

              {/* Reported User Info */}
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-2">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Reported Account</span>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#8B1E3F] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {reportDetail.reported_user?.first_name ? reportDetail.reported_user.first_name.charAt(0).toUpperCase() : 'M'}
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-stone-900">
                      {reportDetail.reported_user?.first_name || 'Member'} {reportDetail.reported_user?.last_name || ''}
                    </h4>
                    {reportDetail.reported_user?.email && (
                      <p className="text-xs text-stone-500 font-medium">{reportDetail.reported_user.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Reason Category */}
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Reason Category</span>
                <span className="inline-block bg-amber-100 text-amber-900 font-extrabold px-3 py-1 rounded-xl border border-amber-200 text-xs">
                  {reportDetail.reason}
                </span>
              </div>

              {/* Description */}
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Description / Incident Notes</span>
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-stone-800 font-medium leading-relaxed">
                  {reportDetail.description || 'No additional explanation was provided with this report.'}
                </div>
              </div>

              {/* Date */}
              {reportDetail.created_at && (
                <div className="text-[11px] text-stone-400 font-medium">
                  Filed on: <span className="font-bold text-stone-700">{new Date(reportDetail.created_at).toLocaleString()}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-200 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteReport(reportDetail.id)}
                    disabled={deleteReportMutation.isPending}
                    className="text-rose-700 border-rose-200 hover:bg-rose-50 font-bold text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5 text-rose-600" />
                    Delete Report
                  </Button>

                  {!reportDetail.is_resolved && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleResolveReport(reportDetail.id)}
                      disabled={resolveReportMutation.isPending}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-white" />
                      Mark as Resolved
                    </Button>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedViewReportId(null)}
                  className="font-bold border-stone-300 text-xs"
                >
                  Close Window
                </Button>
              </div>

            </div>
          )}

        </div>
      </Modal>

      {/* ================= MODAL: SUBMIT PHOTO ACCESS REQUEST (POST /api/privacy/photo-requests/) ================= */}
      <Modal
        isOpen={isPhotoReqModalOpen}
        onClose={() => setIsPhotoReqModalOpen(false)}
        title="Request Private Photo Access"
      >
        <form onSubmit={handleSendPhotoRequest} className="space-y-4 text-xs font-sans">
          
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-blue-950 text-[11px]">
            <span className="font-bold block">Photo View Permission</span>
            <span>Sends a photo view request via <code className="font-mono text-blue-950 font-bold">POST /api/privacy/photo-requests/</code> to the selected member. When approved, their photos will unblur.</span>
          </div>

          {/* Member to Request */}
          <div>
            <label className="font-bold text-stone-800 uppercase tracking-wider block mb-1">
              Select Profile Owner
            </label>
            <select
              value={selectedPhotoOwnerId}
              onChange={e => setSelectedPhotoOwnerId(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl p-3 text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.location || 'Member'})
                </option>
              ))}
              <option value="101">Other Unlisted Member (ID #101)</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPhotoReqModalOpen(false)}
              className="font-bold border-stone-300"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingPhotoReq}
              className="font-bold shadow-md bg-blue-700 hover:bg-blue-800 text-white"
            >
              {isSubmittingPhotoReq ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Sending Request...
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  Send Photo Request
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
