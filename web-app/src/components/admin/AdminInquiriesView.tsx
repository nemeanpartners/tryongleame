import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  RefreshCw, 
  Image as ImageIcon, 
  ShieldCheck, 
  User, 
  ChevronRight, 
  Check, 
  X,
  ExternalLink,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { 
  SupportInquiry, 
  InquiryStatus, 
  InquiryCategory, 
  getAllInquiries, 
  addAdminReply, 
  updateInquiryStatus 
} from '../../lib/inquiryService';

interface AdminInquiriesViewProps {
  adminEmail?: string;
  adminName?: string;
}

export const AdminInquiriesView: React.FC<AdminInquiriesViewProps> = ({
  adminEmail = 'christinalucas1216@gmail.com',
  adminName = 'Christina Lucas (Admin)'
}) => {
  const [inquiries, setInquiries] = useState<SupportInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  
  // Reply composer state
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState<InquiryStatus>('in_progress');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const list = await getAllInquiries();
      setInquiries(list);
      if (list.length > 0 && !selectedInquiryId) {
        setSelectedInquiryId(list[0].id);
      }
    } catch (e) {
      console.warn('Error fetching all inquiries for admin:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const selectedInquiry = inquiries.find(i => i.id === selectedInquiryId) || inquiries[0] || null;

  // Filter inquiries
  const filteredList = inquiries.filter(inq => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'open' && inq.status !== 'open') return false;
      if (statusFilter === 'in_progress' && inq.status !== 'in_progress') return false;
      if (statusFilter === 'resolved' && inq.status !== 'resolved' && inq.status !== 'closed') return false;
    }
    if (categoryFilter !== 'all' && inq.category !== categoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchSub = inq.subject.toLowerCase().includes(q);
      const matchDesc = inq.description.toLowerCase().includes(q);
      const matchUser = inq.userName.toLowerCase().includes(q) || inq.userEmail.toLowerCase().includes(q);
      return matchSub || matchDesc || matchUser;
    }
    return true;
  });

  const handleStatusChange = async (inquiryId: string, newStatus: InquiryStatus) => {
    const updated = await updateInquiryStatus(inquiryId, newStatus);
    if (updated) {
      setInquiries(prev => prev.map(i => i.id === inquiryId ? updated : i));
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry || !replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
      const updated = await addAdminReply(
        selectedInquiry.id,
        replyMessage.trim(),
        adminEmail,
        replyStatus
      );
      if (updated) {
        setInquiries(prev => prev.map(i => i.id === selectedInquiry.id ? updated : i));
        setReplyMessage('');
      }
    } catch (e) {
      console.warn('Error sending admin reply:', e);
    } finally {
      setIsSendingReply(false);
    }
  };

  const applyTemplate = (text: string, status: InquiryStatus = 'in_progress') => {
    setReplyMessage(text);
    setReplyStatus(status);
  };

  // Metrics
  const totalCount = inquiries.length;
  const openCount = inquiries.filter(i => i.status === 'open').length;
  const inProgressCount = inquiries.filter(i => i.status === 'in_progress').length;
  const resolvedCount = inquiries.filter(i => i.status === 'resolved' || i.status === 'closed').length;

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      
      {/* METRICS HEADER CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Total Tickets</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-stone-900 font-mono">{totalCount}</span>
            <MessageSquare className="w-4 h-4 text-stone-400" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">Open & Pending</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-700 font-mono">{openCount}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">In Progress</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-blue-700 font-mono">{inProgressCount}</span>
            <RefreshCw className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">Resolved</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-700 font-mono">{resolvedCount}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative grow max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search inquiries by subject, user, email, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-stone-100 p-1 rounded-xl flex items-center">
            {(['all', 'open', 'in_progress', 'resolved'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === s
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {s === 'in_progress' ? 'In Progress' : s}
              </button>
            ))}
          </div>

          <button
            onClick={fetchInquiries}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>

      {/* TWO-COLUMN INQUIRY CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: INQUIRIES LIST (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden flex flex-col max-h-[750px]">
          <div className="p-3 border-b border-stone-100 flex items-center justify-between bg-stone-50">
            <span className="text-xs font-bold text-stone-700">
              Support Inquiries ({filteredList.length})
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              Live updates
            </span>
          </div>

          <div className="overflow-y-auto divide-y divide-stone-100 p-1">
            {loading ? (
              <div className="py-12 text-center text-xs text-stone-400 font-medium">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-stone-400" />
                Loading inquiries...
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400 font-medium">
                No matching inquiries found
              </div>
            ) : (
              filteredList.map((inq) => {
                const isSelected = selectedInquiry?.id === inq.id;
                return (
                  <button
                    key={inq.id}
                    onClick={() => setSelectedInquiryId(inq.id)}
                    className={`w-full p-3.5 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected 
                        ? 'bg-stone-900 text-white shadow-2xs' 
                        : 'hover:bg-stone-50 text-stone-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : inq.status === 'open' 
                            ? 'bg-amber-100 text-amber-800' 
                            : inq.status === 'in_progress' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {inq.status === 'in_progress' ? 'In Progress' : inq.status}
                      </span>
                      <span className={`text-[10px] font-medium ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                        {new Date(inq.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h5 className="text-xs font-bold tracking-tight line-clamp-1">
                      {inq.subject}
                    </h5>

                    <p className={`text-[11px] line-clamp-2 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                      {inq.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] pt-1 mt-1 border-t border-white/10">
                      <span className={`font-semibold truncate max-w-[180px] ${isSelected ? 'text-stone-300' : 'text-stone-600'}`}>
                        {inq.userName} ({inq.userEmail})
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {inq.images && inq.images.length > 0 && (
                          <span className={`flex items-center gap-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                            <ImageIcon className="w-2.5 h-2.5" />
                            <span>{inq.images.length}</span>
                          </span>
                        )}
                        {inq.replies && inq.replies.length > 0 && (
                          <span className={`flex items-center gap-0.5 ${isSelected ? 'text-stone-300' : 'text-emerald-600'}`}>
                            <MessageSquare className="w-2.5 h-2.5" />
                            <span>{inq.replies.length}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SELECTED INQUIRY DETAIL & REPLY DESK (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
          {selectedInquiry ? (
            <div className="p-5 sm:p-6 space-y-5">
              
              {/* Top Meta Bar */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-stone-200 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-mono font-bold">
                      {selectedInquiry.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-bold">
                      {selectedInquiry.category}
                    </span>
                    <span className="text-xs text-stone-400">
                      Submitted {new Date(selectedInquiry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                    {selectedInquiry.subject}
                  </h3>
                </div>

                {/* Status Changer */}
                <div className="flex items-center gap-1.5 shrink-0 self-start">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Status:</span>
                  <select
                    value={selectedInquiry.status}
                    onChange={(e) => handleStatusChange(selectedInquiry.id, e.target.value as InquiryStatus)}
                    className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Resident Info Card */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs">
                    {(selectedInquiry.userName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 block">{selectedInquiry.userName}</span>
                    <span className="text-stone-500 font-mono text-[11px]">{selectedInquiry.userEmail}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-stone-400 bg-white px-2 py-1 rounded border border-stone-200">
                  User ID: {selectedInquiry.userId}
                </span>
              </div>

              {/* Original User Issue Statement */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-700">Resident Description & Log:</span>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 font-medium leading-relaxed whitespace-pre-wrap">
                  {selectedInquiry.description}
                </div>
              </div>

              {/* Image Attachments */}
              {selectedInquiry.images && selectedInquiry.images.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-stone-500" />
                    <span>Uploaded Visual Evidence ({selectedInquiry.images.length})</span>
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {selectedInquiry.images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightboxImage(img)}
                        className="group relative rounded-xl overflow-hidden aspect-video border border-stone-200 shadow-2xs cursor-pointer"
                      >
                        <img src={img} alt="Evidence screenshot" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                          Click to Enlarge
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Thread */}
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <span className="text-xs font-bold text-stone-700">
                  Response History ({selectedInquiry.replies?.length || 0})
                </span>

                {selectedInquiry.replies && selectedInquiry.replies.length > 0 ? (
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {selectedInquiry.replies.map((rep) => {
                      const isAdmin = rep.senderRole === 'admin';
                      return (
                        <div
                          key={rep.id}
                          className={`p-3.5 rounded-xl border space-y-1 text-xs ${
                            isAdmin 
                              ? 'bg-[#fcf8f5] border-[#dfd6cd] shadow-2xs ml-4' 
                              : 'bg-stone-50 border-stone-200 mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5">
                              {isAdmin ? (
                                <span className="px-1.5 py-0.2 rounded bg-stone-900 text-white font-mono font-bold text-[9px]">
                                  STAFF
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 font-mono font-bold text-[9px]">
                                  RESIDENT
                                </span>
                              )}
                              <span className="font-bold text-stone-900">{rep.sender}</span>
                            </div>
                            <span className="text-stone-400">
                              {new Date(rep.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-stone-800 leading-relaxed font-medium whitespace-pre-wrap">
                            {rep.message}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 font-medium italic">
                    No replies sent yet. Use the response desk below to contact the resident.
                  </p>
                )}
              </div>

              {/* Response Composer */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-3 border-t border-stone-200">
                
                {/* Quick Templates */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#e0a96d]" />
                    <span>Quick Response Templates:</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => applyTemplate('Hello! Thanks for reaching out. We have verified this camera calibration behavior and applied a soft lighting filter in the latest build. Please refresh and check your results!', 'resolved')}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-bold text-stone-700 transition-colors"
                    >
                      Lighting & Camera Calibration Fix
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTemplate('Your custom formula export spec is ready! You can copy the PBR shader parameters directly from the Shade Edit panel with full roughness and clearcoat maps.', 'resolved')}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-bold text-stone-700 transition-colors"
                    >
                      Formula Spec Ready
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTemplate('Thank you for reporting this issue. Our engineering team is currently examining the logs and reproducing the shader glitch.', 'in_progress')}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-bold text-stone-700 transition-colors"
                    >
                      Investigating Glitch
                    </button>
                  </div>
                </div>

                {/* Textarea */}
                <div className="space-y-1">
                  <textarea
                    rows={3}
                    placeholder={`Reply to ${selectedInquiry.userName} (${selectedInquiry.userEmail})...`}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 leading-relaxed"
                  />
                </div>

                {/* Footer Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-600">Set Ticket Status on Send:</span>
                    <select
                      value={replyStatus}
                      onChange={(e) => setReplyStatus(e.target.value as InquiryStatus)}
                      className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-bold text-stone-800 focus:outline-none"
                    >
                      <option value="in_progress">Keep In Progress</option>
                      <option value="resolved">Mark as Resolved</option>
                      <option value="open">Keep Open</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingReply || !replyMessage.trim()}
                    className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 shadow-xs"
                  >
                    {isSendingReply ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Transmitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Reply to Resident</span>
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>
          ) : (
            <div className="py-24 text-center text-xs text-stone-400 font-medium">
              Select an inquiry from the left to view details and response thread
            </div>
          )}
        </div>

      </div>

      {/* Lightbox for screenshots */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="max-w-3xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImage} alt="Screenshot preview" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
