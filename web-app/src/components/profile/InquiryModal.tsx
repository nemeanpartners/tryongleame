import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  ChevronRight, 
  RefreshCw, 
  Trash2,
  Check,
  ShieldCheck,
  User,
  ExternalLink
} from 'lucide-react';
import { 
  SupportInquiry, 
  InquiryCategory, 
  createSupportInquiry, 
  getUserInquiries, 
  updateInquiryStatus, 
  addUserReply 
} from '../../lib/inquiryService';

interface SubmitInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName: string;
  userId: string;
  onInquirySubmitted: () => void;
}

export const SubmitInquiryModal: React.FC<SubmitInquiryModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  userName,
  userId,
  onInquirySubmitted
}) => {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<InquiryCategory>('formula_export');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const fileArr = Array.from(files);
    
    // Limit to 4 images max, 3MB each
    if (images.length + fileArr.length > 4) {
      setError('You can attach up to 4 images per inquiry.');
      return;
    }

    setError('');
    fileArr.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setError('Please upload valid image files (PNG, JPEG, WebP).');
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        setError('Image must be smaller than 3MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please provide an inquiry subject.');
      return;
    }
    if (!description.trim()) {
      setError('Please describe your question or issue in detail.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createSupportInquiry({
        userId,
        userName,
        userEmail,
        subject: subject.trim(),
        category,
        description: description.trim(),
        images
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onInquirySubmitted();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#f5f2ee] rounded-3xl p-5 sm:p-6 border border-white/90 shadow-[10px_10px_30px_rgba(0,0,0,0.12),-10px_-10px_30px_rgba(255,255,255,0.9)] max-h-[90vh] overflow-y-auto space-y-4 text-left animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#ede9e4] shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80 flex items-center justify-center text-stone-900">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 leading-tight">Submit Studio Inquiry</h3>
              <p className="text-[11px] text-stone-500 font-medium">Forwarded directly to creator support & admin desk</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] flex items-center justify-center text-stone-600 hover:text-black transition-all shadow-[2px_2px_4px_rgba(0,0,0,0.05),-2px_-2px_4px_rgba(255,255,255,0.9)] border border-white/80 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-stone-900">Inquiry Received!</h4>
            <p className="text-xs text-stone-500 font-medium max-w-xs mx-auto">
              Your ticket has been routed to the admin dashboard. You can track replies under your inquiries list.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Sender Identification */}
            <div className="p-3 bg-[#ede9e4]/60 rounded-2xl border border-white/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px] font-bold">
                  {(userName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-bold text-stone-800 block">{userName}</span>
                  <span className="text-[10px] text-stone-500">{userEmail}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-stone-400 bg-white/60 px-2 py-0.5 rounded-md border border-white/60">
                Verified Resident
              </span>
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Category / Issue Type</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InquiryCategory)}
                className="w-full bg-[#ede9e4] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] border border-white/80 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#ff2f68]"
              >
                <option value="formula_export">Custom Formula & Palette Export</option>
                <option value="device_calibration">Camera Device & Facial Mesh Calibration</option>
                <option value="account_support">Account & Saved Formulas Support</option>
                <option value="bug_report">Technical Bug or Shader Glitch</option>
                <option value="feature_request">New Look or Community Feature Suggestion</option>
                <option value="other">General Beauty Studio Inquiry</option>
              </select>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Subject / Topic</label>
              <input
                type="text"
                placeholder="Brief summary of your question or issue..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={120}
                className="w-full bg-[#ede9e4] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] border border-white/80 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#ff2f68]"
              />
            </div>

            {/* Detailed Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Detailed Description</label>
              <textarea
                rows={3}
                placeholder="Describe what occurred, lighting conditions, or camera settings..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                className="w-full bg-[#ede9e4] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] border border-white/80 rounded-2xl p-3 text-xs font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#ff2f68]"
              />
            </div>

            {/* Images Upload / Drag & Drop */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-700">
                  Screenshots or Look Photos <span className="text-[10px] text-stone-400 font-normal">(Optional, max 4)</span>
                </label>
                <span className="text-[10px] text-stone-400 font-semibold">{images.length}/4</span>
              </div>

              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer ${
                  isDragging 
                    ? 'border-[#ff2f68] bg-[#ff2f68]/5' 
                    : 'border-stone-300 hover:border-stone-400 bg-[#ede9e4]/40 hover:bg-[#ede9e4]/70'
                }`}
                onClick={() => document.getElementById('inquiry-image-input')?.click()}
              >
                <input 
                  id="inquiry-image-input" 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-[#ede9e4] flex items-center justify-center text-stone-500 shadow-2xs">
                    <Upload className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-stone-700">
                    Click to browse or drag & drop screenshots
                  </p>
                  <p className="text-[10px] text-stone-400">PNG, JPG, WebP up to 3MB each</p>
                </div>
              </div>

              {/* Thumbnails list */}
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-white/80 shadow-2xs bg-stone-100">
                      <img src={img} alt="Attachment" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-stone-900/80 hover:bg-rose-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-stone-200/60">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] text-stone-700 text-xs font-bold transition-all cursor-pointer shadow-[2px_2px_5px_rgba(0,0,0,0.05),-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-[2px_2px_6px_rgba(0,0,0,0.2)] hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting to Studio Desk...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Inquiry</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* =========================================================
   USER INQUIRIES LIST & DETAIL THREAD
   Shows passed & open inquiries with real-time status and replies.
   ========================================================= */
interface UserInquiriesListProps {
  userEmail: string;
  userName: string;
  userId: string;
  onOpenSubmitModal: () => void;
}

export const UserInquiriesList: React.FC<UserInquiriesListProps> = ({
  userEmail,
  userName,
  userId,
  onOpenSubmitModal
}) => {
  const [inquiries, setInquiries] = useState<SupportInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});
  const [replying, setReplying] = useState<{ [id: string]: boolean }>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const data = await getUserInquiries(userEmail, userId);
      setInquiries(data);
      if (data.length > 0 && !expandedId) {
        setExpandedId(data[0].id);
      }
    } catch (e) {
      console.warn('Error fetching user inquiries:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [userEmail, userId]);

  const handleToggleResolve = async (inquiryId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'resolved' || currentStatus === 'closed' ? 'open' : 'resolved';
    const updated = await updateInquiryStatus(inquiryId, newStatus);
    if (updated) {
      setInquiries(prev => prev.map(i => i.id === inquiryId ? updated : i));
    }
  };

  const handleSendReply = async (inquiryId: string) => {
    const text = (replyText[inquiryId] || '').trim();
    if (!text) return;

    setReplying(prev => ({ ...prev, [inquiryId]: true }));
    try {
      const updated = await addUserReply(inquiryId, text, userName, userEmail);
      if (updated) {
        setInquiries(prev => prev.map(i => i.id === inquiryId ? updated : i));
        setReplyText(prev => ({ ...prev, [inquiryId]: '' }));
      }
    } catch (e) {
      console.warn('Error sending reply:', e);
    } finally {
      setReplying(prev => ({ ...prev, [inquiryId]: false }));
    }
  };

  const filteredInquiries = inquiries.filter(inq => {
    if (filter === 'open') return inq.status === 'open' || inq.status === 'in_progress';
    if (filter === 'resolved') return inq.status === 'resolved' || inq.status === 'closed';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Open</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>Under Review</span>
          </span>
        );
      case 'resolved':
      case 'closed':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
            <span>Resolved</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'formula_export': return 'Formula Export';
      case 'device_calibration': return 'Camera Calibration';
      case 'account_support': return 'Account & Billing';
      case 'bug_report': return 'Bug Report';
      case 'feature_request': return 'Feature Suggestion';
      default: return 'General Inquiry';
    }
  };

  return (
    <div className="space-y-4 text-left">
      
      {/* Header bar with filters & New Inquiry button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/60 pb-3">
        <div>
          <h4 className="text-sm font-bold text-stone-900 leading-tight">My Inquiries & Support Tickets</h4>
          <p className="text-[11px] text-stone-500 font-medium">
            Track replies from our creator concierge and close resolved issues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center p-1 bg-[#ede9e4] rounded-full shadow-[inset_1px_1px_3px_rgba(0,0,0,0.06),inset_-1px_-1px_3px_rgba(255,255,255,0.8)]">
            {(['all', 'open', 'resolved'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold capitalize transition-all cursor-pointer ${
                  filter === f 
                    ? 'bg-white text-stone-900 shadow-2xs' 
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={fetchInquiries}
            className="w-7 h-7 rounded-full bg-[#ede9e4] hover:bg-[#e4ded9] flex items-center justify-center text-stone-600 hover:text-black transition-all shadow-[2px_2px_4px_rgba(0,0,0,0.04),-2px_-2px_4px_rgba(255,255,255,0.9)] border border-white/80 cursor-pointer"
            title="Refresh Inquiries"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Inquiry List */}
      {loading ? (
        <div className="p-6 text-center text-xs text-stone-400 font-medium flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-stone-600" />
          <span>Loading your inquiries...</span>
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="p-6 rounded-2xl bg-[#ede9e4]/40 border border-white/80 text-center space-y-2">
          <MessageSquare className="w-6 h-6 text-stone-400 mx-auto" />
          <p className="text-xs font-bold text-stone-700">No {filter !== 'all' ? filter : ''} inquiries found</p>
          <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
            Need help with custom formulas or camera settings? Submit an inquiry to connect directly with support.
          </p>
          <button
            onClick={onOpenSubmitModal}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Submit New Inquiry</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInquiries.map((inq) => {
            const isExpanded = expandedId === inq.id;
            const isResolved = inq.status === 'resolved' || inq.status === 'closed';

            return (
              <div
                key={inq.id}
                className="bg-[#ede9e4]/50 hover:bg-[#ede9e4]/70 border border-white/80 rounded-2xl overflow-hidden shadow-[2px_2px_6px_rgba(0,0,0,0.03),-2px_-2px_6px_rgba(255,255,255,0.85)] transition-all"
              >
                {/* Header row */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : inq.id)}
                  className="p-3.5 sm:p-4 flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="space-y-1 grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(inq.status)}
                      <span className="text-[10px] font-bold text-stone-500 bg-white/70 px-2 py-0.5 rounded-md border border-white/80">
                        {getCategoryLabel(inq.category)}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(inq.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h5 className="text-xs sm:text-sm font-bold text-stone-900 tracking-tight leading-snug truncate">
                      {inq.subject}
                    </h5>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    {inq.images && inq.images.length > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-stone-500 font-semibold bg-white/60 px-1.5 py-0.5 rounded">
                        <ImageIcon className="w-3 h-3 text-stone-600" />
                        <span>{inq.images.length}</span>
                      </span>
                    )}
                    {inq.replies && inq.replies.length > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        <MessageSquare className="w-3 h-3" />
                        <span>{inq.replies.length}</span>
                      </span>
                    )}
                    <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-stone-800' : ''}`} />
                  </div>
                </div>

                {/* Expanded Thread Body */}
                {isExpanded && (
                  <div className="p-3.5 sm:p-4 bg-[#f9f7f4] border-t border-stone-200/60 space-y-3.5 text-xs">
                    
                    {/* User's Original Message */}
                    <div className="p-3 rounded-xl bg-white/80 border border-stone-200/60 space-y-2">
                      <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium">
                        <span className="font-bold text-stone-700">Inquiry Description</span>
                        <span>{new Date(inq.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-wrap font-medium">
                        {inq.description}
                      </p>

                      {/* Attached Images */}
                      {inq.images && inq.images.length > 0 && (
                        <div className="pt-2 border-t border-stone-100">
                          <p className="text-[10px] font-bold text-stone-500 mb-1.5">Attached Screenshots:</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {inq.images.map((img, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setPreviewImage(img)}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-stone-200 shadow-2xs group relative cursor-pointer"
                              >
                                <img src={img} alt="Attachment" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Replies Thread */}
                    {inq.replies && inq.replies.length > 0 && (
                      <div className="space-y-2.5 pt-1">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                          Conversation ({inq.replies.length})
                        </p>

                        {inq.replies.map((rep) => {
                          const isAdmin = rep.senderRole === 'admin';
                          return (
                            <div 
                              key={rep.id} 
                              className={`p-3 rounded-xl border space-y-1.5 ${
                                isAdmin 
                                  ? 'bg-[#f3ede8] border-[#dfd6cd] shadow-2xs ml-3' 
                                  : 'bg-white border-stone-200 mr-3'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-1.5">
                                  {isAdmin ? (
                                    <div className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center">
                                      <ShieldCheck className="w-2.5 h-2.5 text-[#ff7a9e]" />
                                    </div>
                                  ) : (
                                    <div className="w-4 h-4 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center">
                                      <User className="w-2.5 h-2.5" />
                                    </div>
                                  )}
                                  <span className={`font-bold ${isAdmin ? 'text-stone-900' : 'text-stone-700'}`}>
                                    {rep.sender}
                                  </span>
                                  {isAdmin && (
                                    <span className="px-1.5 py-0.2 bg-stone-900 text-[9px] font-mono text-white rounded">
                                      Staff
                                    </span>
                                  )}
                                </div>
                                <span className="text-stone-400">
                                  {new Date(rep.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-stone-800 leading-relaxed font-medium whitespace-pre-wrap">
                                {rep.message}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Follow-up Reply Box & Status Control */}
                    <div className="pt-2 border-t border-stone-200/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-stone-500">
                          {isResolved ? 'This inquiry is marked as resolved' : 'Send follow-up message:'}
                        </span>

                        {/* Mark Resolved / Reopen Button */}
                        <button
                          onClick={() => handleToggleResolve(inq.id, inq.status)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all shadow-2xs border ${
                            isResolved
                              ? 'bg-white text-stone-700 hover:bg-stone-100 border-stone-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                          }`}
                        >
                          {isResolved ? 'Reopen Inquiry' : 'Mark as Resolved / Close'}
                        </button>
                      </div>

                      {!isResolved && (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Type a reply to creator support..."
                            value={replyText[inq.id] || ''}
                            onChange={(e) => setReplyText({ ...replyText, [inq.id]: e.target.value })}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSendReply(inq.id); }}
                            className="grow bg-[#ede9e4] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.06),inset_-1px_-1px_3px_rgba(255,255,255,0.8)] border border-white/80 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#ff2f68]"
                          />
                          <button
                            onClick={() => handleSendReply(inq.id)}
                            disabled={replying[inq.id] || !(replyText[inq.id] || '').trim()}
                            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 shadow-xs flex items-center gap-1.5 shrink-0"
                          >
                            <Send className="w-3 h-3" />
                            <span>Reply</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Lightbox Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="max-w-2xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="Enlarged screenshot" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
