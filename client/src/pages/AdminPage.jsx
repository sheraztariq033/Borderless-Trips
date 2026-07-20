import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../utils/supabase';
import {
  LayoutDashboard, Package, FileText, Users, MessageSquare, PenSquare,
  Settings, LogOut, TrendingUp, DollarSign, Search, Bell,
  Plus, Edit2, Trash2, CheckCircle2, Clock, AlertCircle, BarChart3,
  Send, X, Eye, ChevronDown, Mail, Plane, Globe, Shield,
  Calendar, Menu, Save, RefreshCw, Image, ChevronLeft, ChevronRight,
  UserPlus, Flag, Inbox, Filter, ArrowUpDown, ExternalLink,
  Check, XCircle, ClipboardList, Briefcase, MapPin, Paperclip
} from 'lucide-react';

const tabs = [
  { id:'dashboard', label:'Dashboard', icon:LayoutDashboard },
  { id:'queue', label:'Service Queue', icon:Inbox },
  { id:'leads', label:'Lead Pipeline', icon:TrendingUp },
  { id:'consultations', label:'Consultations', icon:Calendar },
  { id:'bookings', label:'Bookings', icon:Package },
  { id:'visa', label:'Visa Apps', icon:FileText },
  { id:'future-leads', label:'Future Leads', icon:Clock },
  { id:'customers', label:'Customers', icon:Users },
  { id:'doc-templates', label:'Doc Templates', icon:ClipboardList },
  { id:'inquiries', label:'Inquiries', icon:MessageSquare },
  { id:'messages', label:'Messages', icon:Send },
  { id:'packages', label:'Packages', icon:PenSquare },
  { id:'campaigns', label:'Campaigns', icon:Mail },
  { id:'blog', label:'Blog', icon:Globe },
  { id:'media', label:'Media Library', icon:Image },
  { id:'flights', label:'Flight Reqs', icon:Plane },
  { id:'countries', label:'Countries', icon:Flag },
  { id:'staff', label:'Staff', icon:UserPlus },
  { id:'newsletter', label:'Newsletter', icon:Mail },
  { id:'audit', label:'Audit Trail', icon:Shield },
  { id:'settings', label:'Settings', icon:Settings },
];

function StatusBadge({ status }) {
  const map = {
    confirmed:['Confirmed','#10b981'], pending:['Pending','#f59e0b'],
    cancelled:['Cancelled','#ef4444'], completed:['Completed','#0ea5e9'],
    paid:['Paid','#10b981'], partial:['Partial','#0ea5e9'],
    new:['New','#ef4444'], replied:['Replied','#0ea5e9'],
    closed:['Closed','#94a3b8'], approved:['Approved','#10b981'],
    in_review:['In Review','#6366f1'], submitted:['Submitted','#f59e0b'],
    rejected:['Rejected','#ef4444'], refunded:['Refunded','#6366f1'],
    accepted:['Accepted','#10b981'], in_progress:['In Progress','#6366f1'],
    quoted:['Quoted','#6366f1'], active:['Active','#10b981'],
    suspended:['Suspended','#ef4444'],
    low:['Low','#94a3b8'], normal:['Normal','#0ea5e9'], high:['High','#f59e0b'], urgent:['Urgent','#ef4444'],
    manager:['Manager','#6366f1'], agent:['Agent','#0ea5e9'], viewer:['Viewer','#94a3b8'],
    pending_upload:['Pending Upload','#f59e0b'], uploaded:['Pending Review','#6366f1'],
    document_complete:['Docs Complete','#0ea5e9'],
    fee_processing:['Fee Processing','#d946ef'], embassy_submitted:['Embassy Submitted','#4f46e5'],
    interview_scheduled:['Interview Scheduled','#8b5cf6'], visa_successful:['Visa Successful','#10b981'],
    visa_refused:['Visa Refused','#ef4444'],
  };
  const [label, color] = map[status] || [status, '#94a3b8'];
  return <span style={{ background:`${color}14`, color, padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.03em', border:`1px solid ${color}30`, whiteSpace:'nowrap', lineHeight:'18px', display:'inline-block' }}>{label}</span>;
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={onClose}>
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} style={{
        background:'var(--color-surface)', borderRadius:'var(--radius-xl)', width:'100%',
        maxWidth:wide?900:640, maxHeight:'90vh', overflow:'hidden', boxShadow:'var(--shadow-2xl)', display:'flex', flexDirection:'column'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 24px', borderBottom:'1px solid var(--color-border)', flexShrink:0 }}>
          <h3 style={{ fontSize:16, fontWeight:700, margin:0 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-muted)', padding:4 }}><X size={18}/></button>
        </div>
        <div style={{ padding:24, overflowY:'auto', flex:1 }}>{children}</div>
      </motion.div>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:20 }}>
      <button className="btn btn-ghost btn-sm" disabled={page<=1} onClick={() => onPageChange(page-1)}><ChevronLeft size={14}/></button>
      <span style={{ fontSize:13 }}>Page {page} of {totalPages}</span>
      <button className="btn btn-ghost btn-sm" disabled={page>=totalPages} onClick={() => onPageChange(page+1)}><ChevronRight size={14}/></button>
    </div>
  );
}

function FilterPills({ options, value, onChange }) {
  return (
    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)} style={{
          padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:600, border:'1px solid',
          cursor:'pointer', transition:'all 0.15s',
          background: value===opt.value ? 'var(--color-secondary)' : 'transparent',
          color: value===opt.value ? 'white' : 'var(--color-text-muted)',
          borderColor: value===opt.value ? 'var(--color-secondary)' : 'var(--color-border)',
        }}>{opt.label} {opt.count !== undefined && <span style={{ opacity:0.7 }}>({opt.count})</span>}</button>
      ))}
    </div>
  );
}

const getArrayField = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

const formatBytes = (bytes) => {
  if (bytes === 0 || !bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

function CaseExtensions({ detailModal, setDetailModal, loadAllData, user, showToast, handleFileUpload }) {
  const [loading, setLoading] = useState(false);
  const data = detailModal.data;
  const isVisa = detailModal.type === 'visa';
  const isBooking = detailModal.type === 'booking';

  const [localNotes, setLocalNotes] = useState(data.notes || '');
  const [localInvoiceUrl, setLocalInvoiceUrl] = useState(data.invoice_url || '');
  const [localSignatureLink, setLocalSignatureLink] = useState(data.signature_link || '');
  const [localSignatureDoc, setLocalSignatureDoc] = useState(data.signature_doc || '');

  // Moved states from nested IIFEs to comply with React rules of hooks
  const [internalNotesList, setInternalNotesList] = useState([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [fDest, setFDest] = useState(data.country || '');
  const [fDate, setFDate] = useState('');
  const [fNotes, setFNotes] = useState(`Converted from travel file ${data.booking_ref || data.app_ref}.`);
  const [saving, setSaving] = useState(false);

  const loadInternalNotes = async () => {
    try {
      const ref = data.booking_ref || data.app_ref;
      if (!ref) return;
      const res = await api.get(`/business-suite/internal-notes/${ref}`);
      setInternalNotesList(res || []);
    } catch (err) {
      console.error('Failed to load internal notes:', err);
    }
  };

  const handleAddInternalNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setNotesLoading(true);
    try {
      const ref = data.booking_ref || data.app_ref;
      const res = await api.post(`/business-suite/internal-notes/${ref}`, { note: newNoteText.trim() });
      setInternalNotesList(prev => [...prev, res.note]);
      setNewNoteText('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setNotesLoading(false);
    }
  };

  const handleFutureLeadSubmit = async (e) => {
    e.preventDefault();
    if (!fDate) return;
    setSaving(true);
    try {
      await api.post('/business-suite/future-leads', {
        name: data.customer_name || data.name,
        email: data.customer_email || data.email,
        phone: data.customer_phone || data.phone || '',
        destination: fDest,
        intended_travel_date: fDate,
        notes: fNotes
      });
      showToast('Registered as future travel plan successfully!');
      setOpenForm(false);
      await loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setLocalNotes(data.notes || '');
    setLocalInvoiceUrl(data.invoice_url || '');
    setLocalSignatureLink(data.signature_link || '');
    setLocalSignatureDoc(data.signature_doc || '');
    
    // Reset converted lead form state
    setFDest(data.country || '');
    setFNotes(`Converted from travel file ${data.booking_ref || data.app_ref}.`);
    setFDate('');
    setOpenForm(false);

    loadInternalNotes();
  }, [data.id, data.notes, data.invoice_url, data.signature_link, data.signature_doc, data.booking_ref, data.app_ref, data.country]);

  if (!isVisa && !isBooking) return null;

  const updateField = async (field, value) => {
    setLoading(true);
    try {
      const endpoint = isVisa ? `/visa/applications/${data.id}` : `/bookings/${data.id}`;
      await api.put(endpoint, { [field]: value });
      setDetailModal({ ...detailModal, data: { ...data, [field]: value } });
      await loadAllData();
      showToast('Updated successfully');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEditLock = async () => {
    const nextVal = data.edit_unlocked === 1 ? 0 : 1;
    await updateField('edit_unlocked', nextVal);
  };

  const travelers = getArrayField(data.travelers_json);
  const payments = getArrayField(data.payment_info_json);
  const comments = getArrayField(data.comments_json);

  const statuses = isVisa ? [
    { value: 'submitted', label: 'Submitted' },
    { value: 'in_review', label: 'In Review' },
    { value: 'document_complete', label: 'Docs Complete' },
    { value: 'fee_processing', label: 'Fee Processing' },
    { value: 'embassy_submitted', label: 'Embassy Submitted' },
    { value: 'interview_scheduled', label: 'Interview Scheduled' },
    { value: 'visa_successful', label: 'Visa Successful' },
    { value: 'visa_refused', label: 'Visa Refused' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ] : [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* File Progress Status Editor */}
      <div style={{ background:'var(--color-bg)', padding:16, borderRadius:8, border:'1px solid var(--color-border)', display:'flex', flexDirection:'column', gap:10 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
            <span>🚦 File Progress Status:</span>
            <StatusBadge status={data.status} />
          </div>
          <div className="text-muted" style={{ fontSize:11, marginTop:2 }}>
            Select the current stage of this application. This updates the client's portal timeline instantly.
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select
            className="form-input form-select"
            value={data.status || ''}
            onChange={e => updateField('status', e.target.value)}
            disabled={loading}
            style={{ flex:1, height:38, fontSize:13 }}
          >
            {statuses.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        
        {isVisa && (
          <div style={{ marginTop: 4 }}>
            <label className="form-label" style={{ fontSize:11, fontWeight:600 }}>📅 Client-facing Notes / Interview Date & Details</label>
            <input
              className="form-input"
              value={localNotes}
              onChange={e => setLocalNotes(e.target.value)}
              onBlur={() => {
                if (localNotes !== (data.notes || '')) {
                  updateField('notes', localNotes);
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') e.target.blur();
              }}
              placeholder="e.g. Interview scheduled for Oct 12, 10:00 AM at London Embassy"
              style={{ width: '100%', marginTop: 4, fontSize:13 }}
            />
          </div>
        )}
      </div>

      {/* Edit Lock status, Invoice & E-Signing Panel */}
      <div style={{ background:'var(--color-bg)', padding:16, borderRadius:8, border:'1px solid var(--color-border)', display:'grid', gap:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--color-border)', paddingBottom:12, flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
              <span>🔐 Customer Edit Permission:</span>
              <span style={{ fontSize:11, color: data.edit_unlocked === 1 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight:700 }}>
                {data.edit_unlocked === 1 ? 'UNLOCKED' : 'LOCKED'}
              </span>
            </div>
            <div className="text-muted" style={{ fontSize:11, marginTop:2 }}>
              {data.edit_unlocked === 1 ? 'Client can modify co-travelers and submit agreements.' : 'Editing blocked for client (view-only mode).'}
            </div>
          </div>
          <button
            className={`btn btn-sm ${data.edit_unlocked === 1 ? 'btn-danger' : 'btn-success'}`}
            disabled={loading}
            onClick={handleToggleEditLock}
            style={{ minWidth: 140 }}
          >
            {data.edit_unlocked === 1 ? 'Lock Edit Mode' : 'Unlock Edit Mode'}
          </button>
        </div>

        {/* Payment Request Control */}
        <div style={{ background: data.payment_requested === 1 ? 'rgba(245, 158, 11, 0.04)' : 'rgba(255,255,255,0.01)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 13, display: 'block', color: 'var(--color-text)' }}>💳 Payment Request Status</span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginTop: 2 }}>
                {data.payment_requested === 1 
                  ? 'Active: Banking details and invoice are visible in customer portal.' 
                  : 'Inactive: Banking and invoicing details are hidden from customer.'}
              </span>
            </div>
            <button 
              className={data.payment_requested === 1 ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
              onClick={() => updateField('payment_requested', data.payment_requested === 1 ? 0 : 1)}
              style={{ minWidth: 120, height: 32, margin: 0, textTransform: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              disabled={loading}
            >
              {data.payment_requested === 1 ? '🛑 Cancel Request' : '⚡ Request Payment'}
            </button>
          </div>
        </div>

        {/* Invoice URL and Upload */}
        <div>
          <label className="form-label" style={{ fontWeight:700 }}>📄 Invoice & Billing Document</label>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4 }}>
            <input
              className="form-input"
              value={localInvoiceUrl}
              onChange={e => setLocalInvoiceUrl(e.target.value)}
              onBlur={() => {
                if (localInvoiceUrl !== (data.invoice_url || '')) {
                  updateField('invoice_url', localInvoiceUrl);
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') e.target.blur();
              }}
              placeholder="Direct Invoice URL (PDF)"
              style={{ flex:1 }}
            />
            <label className="btn btn-outline btn-sm" style={{ cursor:'pointer', whiteSpace:'nowrap', height:38, display:'flex', alignItems:'center', margin:0 }}>
              Upload PDF
              <input
                type="file"
                accept="application/pdf,image/*"
                style={{ display:'none' }}
                onChange={e => handleFileUpload(e, url => updateField('invoice_url', url))}
              />
            </label>
          </div>
          {data.invoice_url && (
            <a href={data.invoice_url} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:6, fontSize:12, color:'var(--color-secondary)' }}>
              <ExternalLink size={12}/> View/Download Invoice PDF
            </a>
          )}
          {data.payment_proof && (
            <div style={{ marginTop:8, background:'rgba(16,185,129,0.05)', padding:10, borderRadius:6, border:'1px dashed var(--color-success)' }}>
              <div style={{ fontWeight:600, fontSize:12, color:'var(--color-success)' }}>💳 Client Uploaded Bank Transfer Receipt:</div>
              <a href={data.payment_proof} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:4, fontSize:12, color:'var(--color-secondary)', fontWeight:600 }}>
                <ExternalLink size={12}/> Download Payment Evidence
              </a>
            </div>
          )}
        </div>

        {/* E-Signature & Agreement Setup */}
        <div style={{ borderTop:'1px solid var(--color-border)', paddingTop:12 }}>
          <label className="form-label" style={{ fontWeight:700 }}>✍️ E-Sign Contract Setup</label>
          <div style={{ display:'grid', gap:10, marginTop:6 }}>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label" style={{ fontSize:11 }}>SignWell / DocuSign E-Signature Link</label>
              <input
                className="form-input"
                value={localSignatureLink}
                onChange={e => setLocalSignatureLink(e.target.value)}
                onBlur={() => {
                  if (localSignatureLink !== (data.signature_link || '')) {
                    updateField('signature_link', localSignatureLink);
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') e.target.blur();
                }}
                placeholder="Paste SignWell signature request link"
              />
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label className="form-label" style={{ fontSize:11 }}>Contract / Agreement PDF Template</label>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input
                  className="form-input"
                  value={localSignatureDoc}
                  onChange={e => setLocalSignatureDoc(e.target.value)}
                  onBlur={() => {
                    if (localSignatureDoc !== (data.signature_doc || '')) {
                      updateField('signature_doc', localSignatureDoc);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') e.target.blur();
                  }}
                  placeholder="PDF Contract Template path"
                  style={{ flex:1 }}
                />
                <label className="btn btn-outline btn-sm" style={{ cursor:'pointer', whiteSpace:'nowrap', height:38, display:'flex', alignItems:'center', margin:0 }}>
                  Upload PDF
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    style={{ display:'none' }}
                    onChange={e => handleFileUpload(e, url => updateField('signature_doc', url))}
                  />
                </label>
              </div>
            </div>
          </div>
          {data.signature_doc && (
            <a href={data.signature_doc} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:6, fontSize:12, color:'var(--color-secondary)' }}>
              <ExternalLink size={12}/> View Agreement Template PDF
            </a>
          )}
          {data.signed_document_url && (
            <div style={{ marginTop:8, background:'rgba(99,102,241,0.05)', padding:10, borderRadius:6, border:'1px dashed var(--color-secondary)' }}>
              <div style={{ fontWeight:600, fontSize:12, color:'var(--color-secondary)' }}>✍️ Client Signed Agreement:</div>
              <a href={data.signed_document_url} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:4, marginTop:4, fontSize:12, color:'var(--color-secondary)', fontWeight:600 }}>
                <ExternalLink size={12}/> Download Completed E-Signed Agreement
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Travelers */}
      <div>
        <h4 style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>👥 Travelers ({travelers.length})</h4>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
          {travelers.map((t, i) => (
            <div key={i} style={{ padding:10, background:'var(--color-bg)', borderRadius:6, fontSize:12, border:'1px solid var(--color-border)', display:'flex', justifyContent:'space-between' }}>
              <div>
                <strong>{t.name}</strong> • {t.passport || 'No Passport Info'}
                {t.email && ` • ${t.email}`}
                {t.user_id && <span style={{ marginLeft: 6, fontSize: 10, background: '#10b98114', color: '#10b981', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>Linked Account</span>}
              </div>
              <button className="admin-action-btn danger" onClick={() => {
                if(!window.confirm('Remove traveler?')) return;
                updateField('travelers_json', travelers.filter((_, idx) => idx !== i));
              }}><X size={12}/></button>
            </div>
          ))}
        </div>
        <button className="btn btn-outline btn-sm" disabled={loading} onClick={() => {
          const name = window.prompt('Traveler Name:');
          if (!name) return;
          const passport = window.prompt('Passport Number (optional):') || '';
          const email = window.prompt('Traveler Email (optional - to auto-create & link account):') || '';
          updateField('travelers_json', [...travelers, { name, passport, email }]);
        }}><Plus size={14}/> Add Traveler</button>
      </div>

      {/* Payment Info */}
      <div>
        <h4 style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>💳 Custom Payment Info</h4>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
          {payments.map((p, i) => (
            <div key={i} style={{ padding:10, background:'var(--color-bg)', borderRadius:6, fontSize:12, border:'1px solid var(--color-border)', display:'flex', justifyContent:'space-between' }}>
              <div><strong>{p.bank_name}</strong> • {p.account_name} • {p.account_number}</div>
              <button className="admin-action-btn danger" onClick={() => {
                if(!window.confirm('Remove payment info?')) return;
                updateField('payment_info_json', payments.filter((_, idx) => idx !== i));
              }}><X size={12}/></button>
            </div>
          ))}
        </div>
        <button className="btn btn-outline btn-sm" disabled={loading} onClick={() => {
          const bank_name = window.prompt('Bank Name:');
          if (!bank_name) return;
          const account_name = window.prompt('Account Name:');
          const account_number = window.prompt('Account Number / Sort Code:');
          updateField('payment_info_json', [...payments, { bank_name, account_name, account_number }]);
        }}><Plus size={14}/> Add Payment Option</button>
      </div>

      {/* Comments */}
      <div>
        <h4 style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>💬 Agent Comments</h4>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
          {comments.map((c, i) => (
            <div key={i} style={{ padding:10, background: c.is_public ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)', borderRadius:6, fontSize:12, border:`1px solid ${c.is_public ? 'var(--color-success)' : 'var(--color-warning)'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <strong>{c.agent_name}</strong>
                <span className="text-muted">{new Date(c.date).toLocaleString()}</span>
              </div>
              <p style={{ margin:0, marginTop:4 }}>{c.text}</p>
              <div style={{ marginTop:6, fontSize:10, fontWeight:700, color: c.is_public ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {c.is_public ? 'PUBLIC (Visible to client)' : 'PRIVATE (Internal only)'}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-outline btn-sm" disabled={loading} onClick={() => {
            const text = window.prompt('Enter Internal Private Comment:');
            if (!text) return;
            updateField('comments_json', [...comments, { text, is_public: false, agent_name: user.name, date: new Date().toISOString() }]);
          }}>Add Private Comment</button>
          <button className="btn btn-primary btn-sm" disabled={loading} onClick={() => {
            const text = window.prompt('Enter Public Comment (Client will see this):');
            if (!text) return;
            updateField('comments_json', [...comments, { text, is_public: true, agent_name: user.name, date: new Date().toISOString() }]);
          }}>Add Public Comment</button>
        </div>
      </div>

      {/* Internal Staff Chat Threads */}
      <div style={{ borderTop:'1px solid var(--color-border)', paddingTop:20, marginTop:10 }}>
        <h4 style={{ fontSize:14, fontWeight:700, marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
          💬 Internal Staff Note Thread (Private)
        </h4>
        <p className="text-muted" style={{ fontSize:11, marginBottom:12 }}>
          Discuss application nuances or coordination issues here. Clients cannot see this thread.
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:200, overflowY:'auto', background:'var(--color-bg)', padding:12, borderRadius:8, border:'1px solid var(--color-border)', marginBottom:10 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:8, overflowY:'auto', maxHeight:150 }}>
            {internalNotesList.length > 0 ? internalNotesList.map((note, idx) => (
              <div key={idx} style={{ fontSize:12, borderBottom:'1px solid var(--color-border)', paddingBottom:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', color:'var(--color-text-muted)', fontSize:10, marginBottom:2 }}>
                  <strong>👤 {note.created_by_name} ({note.created_by_role})</strong>
                  <span>{new Date(note.created_at).toLocaleString()}</span>
                </div>
                <p style={{ margin:0, color:'var(--color-text)' }}>{note.note}</p>
              </div>
            )) : (
              <div className="text-muted" style={{ fontSize:11, textAlign:'center', padding:'10px 0' }}>No staff comments posted yet.</div>
            )}
          </div>

          <form onSubmit={handleAddInternalNote} style={{ display:'flex', gap:8, borderTop:'1px solid var(--color-border)', paddingTop:10, marginTop:10 }}>
            <input className="form-input" style={{ fontSize:12, height:34 }} placeholder="Type note for staff..." value={newNoteText} onChange={e => setNewNoteText(e.target.value)} required disabled={notesLoading}/>
            <button type="submit" className="btn btn-primary btn-sm" style={{ height:34 }} disabled={notesLoading}>Send</button>
          </form>
        </div>
      </div>

      {/* Save as Future Travel Plan option */}
      <div style={{ borderTop:'1px solid var(--color-border)', paddingTop:20, marginTop:10 }}>
        <h4 style={{ fontSize:14, fontWeight:700, marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
          📅 Convert to Future Travel Lead Plan
        </h4>
        <p className="text-muted" style={{ fontSize:11, marginBottom:12 }}>
          Create a future scheduled travel lead from this customer record for pipeline tracking.
        </p>

        {!openForm ? (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpenForm(true)}>
            Save as Future Travel Plan
          </button>
        ) : (
          <form onSubmit={handleFutureLeadSubmit} style={{ display:'flex', flexDirection:'column', gap:10, background:'var(--color-bg)', padding:14, borderRadius:8, border:'1px solid var(--color-border)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize:11 }}>Destination</label>
                <input className="form-input" style={{ fontSize:12, height:34 }} value={fDest} onChange={e => setFDest(e.target.value)} required/>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize:11 }}>Intended Travel Date</label>
                <input type="date" className="form-input" style={{ fontSize:12, height:34 }} value={fDate} onChange={e => setFDate(e.target.value)} required/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize:11 }}>Timeline & Coordination Notes</label>
              <textarea className="form-input" rows="2" style={{ fontSize:12 }} value={fNotes} onChange={e => setFNotes(e.target.value)}/>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setOpenForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-xs" disabled={saving}>
                {saving ? 'Saving...' : 'Register Future Plan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const folders = [
  { id: 'visa-general', name: 'Schengen Visa (General)', service_type: 'visa', country: '', icon: '📂' },
  { id: 'visa-france', name: 'France Visa', service_type: 'visa', country: 'France', icon: '🇫🇷' },
  { id: 'visa-germany', name: 'Germany Visa', service_type: 'visa', country: 'Germany', icon: '🇩🇪' },
  { id: 'visa-italy', name: 'Italy Visa', service_type: 'visa', country: 'Italy', icon: '🇮🇹' },
  { id: 'visa-uk', name: 'United Kingdom Visa', service_type: 'visa', country: 'United Kingdom', icon: '🇬🇧' },
  { id: 'visa-other', name: 'Other Visas', service_type: 'visa', isOtherVisas: true, icon: '🌍' },
  { id: 'holiday', name: 'Holiday Packages', service_type: 'holiday_package', icon: '🌴' },
  { id: 'flight', name: 'Flights', service_type: 'flight', icon: '✈️' },
  { id: 'other', name: 'Other Templates', isOther: true, icon: '📋' }
];

export default function AdminPage() {
  const { user, logout } = useAuth();
  const { refreshSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedFolder, setSelectedFolder] = useState(null);

  const visibleTabs = tabs.filter(tab => {
    if (user?.sub_role === 'agent') {
      const hiddenTabs = ['customers', 'doc-templates', 'packages', 'blog', 'countries', 'staff', 'newsletter', 'settings', 'audit'];
      return !hiddenTabs.includes(tab.id);
    }
    return true;
  });

  useEffect(() => {
    if (user?.sub_role === 'agent') {
      const hiddenTabs = ['customers', 'doc-templates', 'packages', 'blog', 'countries', 'staff', 'newsletter', 'settings'];
      if (hiddenTabs.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [activeTab, user]);

  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [visaApps, setVisaApps] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [packages, setPackages] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [creatingFutureLead, setCreatingFutureLead] = useState(false);
  const [fForm, setFForm] = useState({ name: '', email: '', phone: '', destination: '', intended_travel_date: '', notes: '' });
  const [savingFutureLead, setSavingFutureLead] = useState(false);
  const [flightReqs, setFlightReqs] = useState([]);
  const [flightRates, setFlightRates] = useState([]);
  const [flightRatesSubTab, setFlightRatesSubTab] = useState('requests');
  const [rateModal, setRateModal] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [rateForm, setRateForm] = useState({ from_city:'', to_city:'', price:'', airline:'Multiple Airlines' });
  const [subscribers, setSubscribers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [serviceReqs, setServiceReqs] = useState([]);
  const [srStats, setSrStats] = useState(null);
  const [srPage, setSrPage] = useState(1);
  const [srTotal, setSrTotalPages] = useState(1);
  const [countries, setCountries] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [businessSettings, setBusinessSettings] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Business Expansion Suite states
  const [leads, setLeads] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [newCampaign, setNewCampaign] = useState({ subject: '', body: '', target_role: 'subscribers' });
  const [submittingCampaign, setSubmittingCampaign] = useState(false);
  const [campaignEditorTab, setCampaignEditorTab] = useState('write');
  const [searchCampQuery, setSearchCampQuery] = useState('');
  const [futureLeads, setFutureLeads] = useState([]);
  const [internalNotes, setInternalNotes] = useState([]);
  const [internalNotesInput, setInternalNotesInput] = useState('');

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal states
  const [pkgModal, setPkgModal] = useState(false);
  const [blogModal, setBlogModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [countryModal, setCountryModal] = useState(false);
  const [staffModal, setStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editingPkg, setEditingPkg] = useState(null);
  const [editingBlog, setEditingBlog] = useState(null);
  const [msgInput, setMsgInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [uploadingChatFile, setUploadingChatFile] = useState(false);
  const chatFileInputRef = useRef(null);
  const [toast, setToast] = useState(null);
  const msgEndRef = useRef(null);

  // Forms
  const emptyPkg = { title:'', destination:'', description:'', duration:'', price:'', original_price:'', type:'adventure', images:'', itinerary:[], includes:[], excludes:[], rating:0, reviews:0, featured:0 };
  const [pkgForm, setPkgForm] = useState(emptyPkg);
  const emptyBlog = { title:'', content:'', excerpt:'', cover_image:'', category:'Travel Guide', published:1 };
  const [blogForm, setBlogForm] = useState(emptyBlog);
  const [countryForm, setCountryForm] = useState({ name:'', code:'', region:'schengen', visa_required:1 });
  const [staffForm, setStaffForm] = useState({ name:'', email:'', password:'', sub_role:'agent', status:'active' });
  const [notesInput, setNotesInput] = useState('');

  // Doc templates & customer & creation modals
  const [docTemplates, setDocTemplates] = useState([]);
  const [templateModal, setTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ service_type:'visa', country:'', name:'', description:'', required:1, folder_id:'' });
  const [customFolders, setCustomFolders] = useState([]);
  const [customFolderModal, setCustomFolderModal] = useState(false);
  const [editingCustomFolder, setEditingCustomFolder] = useState(null);
  const [customFolderForm, setCustomFolderForm] = useState({ name: '' });
  const [selectedCustomFolder, setSelectedCustomFolder] = useState(null);
  const [docSubTab, setDocSubTab] = useState('system');
  
  const [custModal, setCustModal] = useState(false);
  const [editingCust, setEditingCust] = useState(null);
  const [custForm, setCustForm] = useState({ name:'', email:'', phone:'', nationality:'', status:'active', password:'' });

  // Creation forms
  const [bookingCreateModal, setBookingCreateModal] = useState(false);
  const [bookingCreateForm, setBookingCreateForm] = useState({ is_new_customer: false, user_id: '', cust_name: '', cust_email: '', cust_phone: '', cust_nationality: '', package_id: '', travel_date: '', travelers: 1, notes: '' });

  const [visaCreateModal, setVisaCreateModal] = useState(false);
  const [visaCreateForm, setVisaCreateForm] = useState({ is_new_customer: false, user_id: '', cust_name: '', cust_email: '', cust_phone: '', cust_nationality: '', country: '', nationality: '', purpose: 'tourism', notes: '' });

  const [srCreateModal, setSrCreateModal] = useState(false);
  const [srCreateForm, setSrCreateForm] = useState({ is_new_customer: false, user_id: '', cust_name: '', cust_email: '', cust_phone: '', cust_nationality: '', service_type: 'visa', country: '', priority: 'normal', notes: '' });

  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const loadAllData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [dashData, bkData, vsData, custData, inqData, pkgData, blogData, flData, subData, convData, ctryData, stfData, settData, templData, ratesData, fldData, auditData, leadsData, consultationsData, campaignsData, futureLeadsData, mediaData] = await Promise.all([
        api.get('/analytics/dashboard').catch(() => null),
        api.get('/bookings').catch(() => []),
        api.get('/visa/applications').catch(() => []),
        api.get('/auth/customers').catch(() => []),
        api.get('/inquiries').catch(() => []),
        api.get('/packages').catch(() => []),
        api.get('/blog/admin').catch(() => []),
        api.get('/flights/requests').catch(() => []),
        api.get('/newsletter/subscribers').catch(() => []),
        api.get('/messages').catch(() => []),
        api.get('/countries').catch(() => []),
        api.get('/auth/staff').catch(() => []),
        api.get('/analytics/settings').catch(() => ({})),
        api.get('/document-templates').catch(() => []),
        api.get('/flights/rates').catch(() => []),
        api.get('/document-templates/folders').catch(() => []),
        api.get('/analytics/audit-logs').catch(() => []),
        api.get('/business-suite/analytics/leads').catch(() => ({ leads: [] })),
        api.get('/business-suite/consultations').catch(() => []),
        api.get('/business-suite/campaigns').catch(() => []),
        api.get('/business-suite/future-leads').catch(() => []),
        api.get('/media').catch(() => []),
      ]);
      if (dashData) setStats(dashData);
      setBookings(bkData);
      setVisaApps(vsData);
      setCustomers(custData);
      setInquiries(inqData);
      setPackages(Array.isArray(pkgData) ? pkgData : (pkgData.packages || []));
      setBlogPosts(blogData);
      setFlightReqs(Array.isArray(flData) ? flData : (flData.requests || []));
      setFlightRates(ratesData);
      setSubscribers(Array.isArray(subData) ? subData : (subData.subscribers || []));
      setConversations(convData);
      setCountries(ctryData);
      setStaffList(stfData);
      setBusinessSettings(settData);
      if (templData) setDocTemplates(templData);
      if (fldData) setCustomFolders(fldData);
      if (auditData) setAuditLogs(auditData);
      setLeads(leadsData?.leads || []);
      setConsultations(consultationsData);
      setCampaigns(campaignsData);
      setFutureLeads(futureLeadsData);
      setMediaFiles(mediaData);
    } catch (err) { console.error('Admin data load error:', err); }
    finally { setLoading(false); }
  }, []);

  const loadServiceReqs = useCallback(async (page=1, status='all') => {
    try {
      const params = new URLSearchParams({ page, limit: 25 });
      if (status !== 'all') params.set('status', status);
      if (searchTerm) params.set('search', searchTerm);
      const data = await api.get(`/service-requests?${params}`);
      setServiceReqs(data.requests || []);
      setSrPage(data.page || 1);
      setSrTotalPages(data.totalPages || 1);
      const statsData = await api.get('/service-requests/stats').catch(() => null);
      if (statsData) setSrStats(statsData);
    } catch (err) { console.error(err); }
  }, [searchTerm]);

  useEffect(() => { if (user?.role === 'admin') loadAllData(); }, [user, loadAllData]);
  useEffect(() => { if (activeTab === 'queue' && user?.role === 'admin') loadServiceReqs(1, statusFilter); }, [activeTab, statusFilter, loadServiceReqs, user]);

  useEffect(() => {
    if (!supabase || !user || user.role !== 'admin') return;

    const channel = supabase
      .channel('admin-realtime-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        loadAllData(true);
        // If we are currently viewing this specific conversation, refresh its messages
        if (selectedConvo && payload.new && (payload.new.sender_id === selectedConvo.user_id || payload.new.receiver_id === selectedConvo.user_id)) {
          api.get(`/messages?user_id=${selectedConvo.user_id}`).then(setChatMessages).catch(() => {});
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        loadAllData(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAllData, selectedConvo]);

  // Chat
  useEffect(() => {
    if (selectedConvo) {
      api.get(`/messages?user_id=${selectedConvo.user_id}`).then(setChatMessages).catch(() => {});
      api.put('/messages/read', { user_id: selectedConvo.user_id }).catch(() => {});
    }
  }, [selectedConvo]);
  useEffect(() => { if (selectedConvo && activeTab === 'messages') msgEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [chatMessages, selectedConvo, activeTab]);
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const interval = setInterval(async () => {
      if (activeTab === 'messages') {
        const convData = await api.get('/messages').catch(() => []);
        setConversations(convData);
        if (selectedConvo) { const msgs = await api.get(`/messages?user_id=${selectedConvo.user_id}`).catch(() => []); setChatMessages(msgs); }
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [user, activeTab, selectedConvo]);

  // Handlers
  const handleUpdateBooking = async (id, updates) => {
    try { await api.put(`/bookings/${id}`, updates); showToast('Booking updated'); await loadAllData(); } catch (err) { showToast(err.message, 'error'); }
  };
  const handleUpdateVisa = async (id, updates) => {
    try { await api.put(`/visa/applications/${id}`, updates); showToast('Visa app updated'); await loadAllData(); } catch (err) { showToast(err.message, 'error'); }
  };
  const handleUpdateInquiry = async (id, updates) => {
    try { await api.put(`/inquiries/${id}`, updates); showToast('Inquiry updated'); await loadAllData(); } catch (err) { showToast(err.message, 'error'); }
  };
  const handleUpdateFlight = async (id, updates) => {
    try { await api.put(`/flights/requests/${id}`, updates); showToast('Flight request updated'); await loadAllData(); } catch (err) { showToast(err.message, 'error'); }
  };
  const handleUpdateSR = async (id, updates) => {
    try { await api.put(`/service-requests/${id}`, updates); showToast('Request updated'); await loadServiceReqs(srPage, statusFilter); } catch (err) { showToast(err.message, 'error'); }
  };

  // Business Expansion Suite Handlers
  const handleUpdateLeadStage = async (leadId, type, newStage) => {
    try {
      const endpoint = type === 'sr' 
        ? `/business-suite/service-requests/${leadId}/lead-stage` 
        : `/business-suite/inquiries/${leadId}/lead-stage`;
      await api.put(endpoint, { lead_stage: newStage });
      showToast('Lead stage updated successfully');
      await loadAllData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setSubmittingCampaign(true);
    try {
      await api.post('/business-suite/campaigns', newCampaign);
      setNewCampaign({ subject: '', body: '', target_role: 'subscribers' });
      showToast('Draft campaign created successfully');
      await loadAllData(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingCampaign(false);
    }
  };

  const handleSendCampaign = async (campaignId) => {
    if (!confirm('Are you sure you want to blast this campaign to all recipients?')) return;
    try {
      showToast('Campaign blast initiated...');
      await api.post(`/business-suite/campaigns/${campaignId}/send`);
      showToast('Campaign sent successfully!');
      await loadAllData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!confirm('Are you sure you want to delete this campaign? This action is irreversible.')) return;
    try {
      await api.delete(`/business-suite/campaigns/${campaignId}`);
      showToast('Campaign deleted successfully');
      await loadAllData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateConsultation = async (id, status) => {
    try {
      await api.put(`/business-suite/consultations/${id}`, { status });
      showToast('Appointment updated');
      await loadAllData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateFutureLead = async (id, status, notes) => {
    try {
      await api.put(`/business-suite/future-leads/${id}`, { status, notes });
      showToast('Future travel lead status updated');
      await loadAllData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const getPortalShareLink = (email) => {
    const configUrl = businessSettings.website_url;
    // Automatically match the local origin (localhost/127.0.0.1) when testing locally
    const websiteUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? window.location.origin
      : (configUrl || window.location.origin);
    return `${websiteUrl}/login?email=${encodeURIComponent(email)}`;
  };

  const handleCopyShareLink = (email) => {
    const link = getPortalShareLink(email);
    navigator.clipboard.writeText(link)
      .then(() => showToast('Portal login link copied to clipboard!'))
      .catch(() => showToast('Failed to copy link', 'error'));
  };

  const handleWhatsAppSharePortal = (name, email, phone) => {
    const link = getPortalShareLink(email);
    const message = encodeURIComponent(`Hi ${name || 'Traveler'}, here is the link to access your Borderless Trips client portal to track your visa application or booking: ${link}`);
    const cleanPhone = (phone || '').replace(/[+\s()-]+/g, '');
    if (!cleanPhone) {
      showToast('Client has no phone number configured', 'error');
      return;
    }
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const fetchInternalNotes = async (ref) => {
    try {
      const data = await api.get(`/business-suite/internal-notes/${ref}`);
      setInternalNotes(data);
    } catch (err) {
      console.error('Failed to load internal notes:', err);
    }
  };

  const handleSendInternalNote = async (ref) => {
    if (!internalNotesInput.trim()) return;
    try {
      const data = await api.post(`/business-suite/internal-notes/${ref}`, { note: internalNotesInput.trim() });
      setInternalNotes([...internalNotes, data.note]);
      setInternalNotesInput('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleConvertSR = async (sr) => {
    if (!confirm(`Are you sure you want to convert this service request to a live ${sr.service_type === 'visa' ? 'Visa Application' : 'Booking'}? This will also automatically ensure the client has an active customer account.`)) return;
    try {
      const res = await api.post(`/service-requests/${sr.id}/convert`);
      showToast(res.message);
      setDetailModal(null);
      await loadAllData();
      await loadServiceReqs(srPage, statusFilter);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleConvertInquiry = async (inq, targetType) => {
    if (!confirm(`Are you sure you want to convert this Inquiry to a live ${targetType === 'visa' ? 'Visa Application' : 'Booking'}? This will also automatically ensure the client has an active customer account.`)) return;
    try {
      const res = await api.post(`/inquiries/${inq.id}/convert`, { target_type: targetType });
      showToast(res.message);
      setDetailModal(null);
      await loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveCustomer = async () => {
    try {
      const payload = {
        name: custForm.name,
        email: custForm.email,
        phone: custForm.phone,
        nationality: custForm.nationality,
        status: custForm.status
      };
      if (custForm.password) {
        payload.password = custForm.password;
      }
      if (editingCust) {
        await api.put(`/auth/customers/${editingCust.id}`, payload);
        showToast('Customer updated');
      } else {
        await api.post('/auth/customers', payload);
        showToast('Customer created');
      }
      setCustModal(false);
      setEditingCust(null);
      setCustForm({ name:'', email:'', phone:'', nationality:'', status:'active', password:'' });
      await loadAllData();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleFileUpload = async (e, onSuccess) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploadProgress(0);
      const res = await api.uploadWithProgress('/upload', formData, (percent) => {
        setUploadProgress(percent);
      });
      if (res.url) {
        onSuccess(res.url);
        showToast('File uploaded successfully');
      }
    } catch (err) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploadProgress(null);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const payload = {
        ...templateForm,
        required: templateForm.required ? 1 : 0,
        folder_id: templateForm.folder_id === '' ? null : templateForm.folder_id
      };
      if (editingTemplate) {
        await api.put(`/document-templates/${editingTemplate.id}`, payload);
        showToast('Template updated');
      } else {
        await api.post('/document-templates', payload);
        showToast('Template created');
      }
      setTemplateModal(false);
      setEditingTemplate(null);
      setTemplateForm({ service_type:'visa', country:'', name:'', description:'', required:1, folder_id:'' });
      await loadAllData();
    } catch (err) { showToast(err.message, 'error'); }
  };

  // Custom Folder handlers
  const handleSaveCustomFolder = async () => {
    if (!customFolderForm.name || customFolderForm.name.trim() === '') {
      return alert('Folder name is required.');
    }
    try {
      if (editingCustomFolder) {
        await api.put(`/document-templates/folders/${editingCustomFolder.id}`, customFolderForm);
        showToast('Folder updated');
      } else {
        await api.post('/document-templates/folders', customFolderForm);
        showToast('Folder created');
      }
      setCustomFolderModal(false);
      setEditingCustomFolder(null);
      setCustomFolderForm({ name: '' });
      await loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCustomFolder = async (id) => {
    if (!confirm('Are you sure you want to delete this folder? The templates inside it will be unassigned but NOT deleted.')) return;
    try {
      await api.delete(`/document-templates/folders/${id}`);
      showToast('Folder deleted');
      if (selectedCustomFolder?.id === id) {
        setSelectedCustomFolder(null);
      }
      await loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api.delete(`/document-templates/${id}`);
      showToast('Template deleted');
      await loadAllData();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const resolveCustomer = async (form) => {
    if (form.is_new_customer) {
      if (!form.cust_name || !form.cust_email) {
        throw new Error('Customer name and email are required.');
      }
      const result = await api.post('/auth/customers', {
        name: form.cust_name,
        email: form.cust_email,
        phone: form.cust_phone,
        nationality: form.cust_nationality,
        status: 'active'
      });
      return result.customer;
    } else {
      if (!form.user_id) {
        throw new Error('Please select an existing customer.');
      }
      const cust = customers.find(c => String(c.id) === String(form.user_id));
      if (!cust) throw new Error('Customer not found.');
      return cust;
    }
  };

  const handleCreateBooking = async (e) => {
    e?.preventDefault();
    try {
      const customer = await resolveCustomer(bookingCreateForm);
      await api.post('/bookings', {
        package_id: bookingCreateForm.package_id,
        user_id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        travel_date: bookingCreateForm.travel_date,
        travelers: parseInt(bookingCreateForm.travelers) || 1,
        notes: bookingCreateForm.notes
      });
      showToast('Booking created successfully');
      setBookingCreateModal(false);
      setBookingCreateForm({ is_new_customer: false, user_id: '', cust_name: '', cust_email: '', cust_phone: '', cust_nationality: '', package_id: '', travel_date: '', travelers: 1, notes: '' });
      await loadAllData();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleCreateVisa = async (e) => {
    e?.preventDefault();
    try {
      const customer = await resolveCustomer(visaCreateForm);
      await api.post('/visa/apply', {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        user_id: customer.id,
        country: visaCreateForm.country,
        nationality: customer.nationality || visaCreateForm.nationality || 'Unknown',
        purpose: visaCreateForm.purpose,
        notes: visaCreateForm.notes
      });
      showToast('Visa application created successfully');
      setVisaCreateModal(false);
      setVisaCreateForm({ is_new_customer: false, user_id: '', cust_name: '', cust_email: '', cust_phone: '', cust_nationality: '', country: '', nationality: '', purpose: 'tourism', notes: '' });
      await loadAllData();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleCreateSR = async (e) => {
    e?.preventDefault();
    try {
      const customer = await resolveCustomer(srCreateForm);
      await api.post('/service-requests', {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        user_id: customer.id,
        service_type: srCreateForm.service_type,
        country: srCreateForm.country,
        priority: srCreateForm.priority,
        notes: srCreateForm.notes,
        create_account: false
      });
      showToast('Service request created successfully');
      setSrCreateModal(false);
      setSrCreateForm({ is_new_customer: false, user_id: '', cust_name: '', cust_email: '', cust_phone: '', cust_nationality: '', service_type: 'visa', country: '', priority: 'normal', notes: '' });
      await loadServiceReqs(1, statusFilter);
    } catch (err) { showToast(err.message, 'error'); }
  };

  // Package CRUD
  const handleSavePackage = async () => {
    try {
      const payload = {
        ...pkgForm, price: parseFloat(pkgForm.price), original_price: parseFloat(pkgForm.original_price) || null,
        images: pkgForm.images ? (typeof pkgForm.images === 'string' ? pkgForm.images.split(',').map(s=>s.trim()) : pkgForm.images) : [],
        featured: pkgForm.featured ? 1 : 0,
        itinerary: pkgForm.itinerary,
        includes: pkgForm.includes,
        excludes: pkgForm.excludes
      };
      if (editingPkg) { await api.put(`/packages/${editingPkg.id}`, payload); showToast('Package updated'); }
      else { await api.post('/packages', payload); showToast('Package created'); }
      setPkgModal(false); setEditingPkg(null); setPkgForm(emptyPkg); await loadAllData();
    } catch (err) { showToast(err.message, 'error'); }
  };
  const handleDeletePackage = async (id) => { if (!confirm('Delete this package?')) return; try { await api.delete(`/packages/${id}`); showToast('Package deleted'); await loadAllData(); } catch (err) { showToast(err.message, 'error'); } };
  const openEditPkg = (pkg) => {
    setEditingPkg(pkg);
    const parseJson = (v) => { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return v; } };
    setPkgForm({
      title: pkg.title,
      destination: pkg.destination,
      description: pkg.description || '',
      duration: pkg.duration || '',
      price: pkg.price,
      original_price: pkg.original_price || '',
      type: pkg.type || 'adventure',
      images: Array.isArray(parseJson(pkg.images)) ? parseJson(pkg.images).join(', ') : '',
      itinerary: Array.isArray(parseJson(pkg.itinerary)) ? parseJson(pkg.itinerary) : [],
      includes: Array.isArray(parseJson(pkg.includes)) ? parseJson(pkg.includes) : [],
      excludes: Array.isArray(parseJson(pkg.excludes)) ? parseJson(pkg.excludes) : [],
      rating: pkg.rating || 0,
      reviews: pkg.reviews || 0,
      featured: pkg.featured
    });
    setPkgModal(true);
  };

  // Blog CRUD
  const handleSaveBlog = async () => {
    try {
      if (editingBlog) { await api.put(`/blog/${editingBlog.id}`, blogForm); showToast('Blog updated'); }
      else { await api.post('/blog', blogForm); showToast('Blog created'); }
      setBlogModal(false); setEditingBlog(null); setBlogForm(emptyBlog); await loadAllData();
    } catch (err) { showToast(err.message, 'error'); }
  };
  const handleDeleteBlog = async (id) => { if (!confirm('Delete this post?')) return; try { await api.delete(`/blog/${id}`); showToast('Post deleted'); await loadAllData(); } catch (err) { showToast(err.message, 'error'); } };

  const handleDeleteMedia = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this file from storage and database? This may break any packages or blogs using this link.')) return;
    try {
      await api.delete(`/media/${id}`);
      showToast('File deleted successfully');
      await loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Country CRUD
  const handleSaveCountry = async () => {
    try { await api.post('/countries', countryForm); showToast('Country added'); setCountryModal(false); setCountryForm({ name:'', code:'', region:'schengen', visa_required:1 }); await loadAllData(); } catch (err) { showToast(err.message, 'error'); }
  };
  const handleDeleteCountry = async (id) => { try { await api.delete(`/countries/${id}`); showToast('Country deactivated'); await loadAllData(); } catch (err) { showToast(err.message, 'error'); } };

  // Staff Access CRUD
  const handleAddStaffClick = () => {
    setEditingStaff(null);
    setStaffForm({ name:'', email:'', password:'', sub_role:'agent', status:'active' });
    setStaffModal(true);
  };

  const handleEditStaffClick = (staff) => {
    setEditingStaff(staff);
    setStaffForm({
      name: staff.name,
      email: staff.email,
      password: '',
      sub_role: staff.sub_role || 'agent',
      status: staff.status || 'active'
    });
    setStaffModal(true);
  };

  const handleSaveStaff = async () => {
    try {
      if (editingStaff) {
        await api.put(`/auth/staff/${editingStaff.id}`, staffForm);
        showToast('Staff account updated');
      } else {
        await api.post('/auth/create-staff', staffForm);
        showToast('Staff account created');
      }
      setStaffModal(false);
      setEditingStaff(null);
      setStaffForm({ name:'', email:'', password:'', sub_role:'agent', status:'active' });
      await loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await api.delete(`/auth/staff/${id}`);
      showToast('Staff member deleted');
      await loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Settings
  const handleSaveSettings = async () => {
    try {
      await api.put('/analytics/settings', businessSettings);
      showToast('Settings saved');
      if (refreshSettings) {
        await refreshSettings();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Flight Rates CRUD
  const handleSaveFlightRate = async (e) => {
    if (e) e.preventDefault();
    if (!rateForm.from_city || !rateForm.to_city || !rateForm.price) {
      return showToast('From City, To City, and Price are required.', 'error');
    }
    try {
      if (editingRate) {
        await api.put(`/flights/rates/${editingRate.id}`, rateForm);
        showToast('Flight rate updated');
      } else {
        await api.post('/flights/rates', rateForm);
        showToast('Flight rate created');
      }
      setRateModal(false);
      setEditingRate(null);
      setRateForm({ from_city:'', to_city:'', price:'', airline:'Multiple Airlines' });
      await loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteFlightRate = async (id) => {
    if (!confirm('Are you sure you want to delete this flight rate?')) return;
    try {
      await api.delete(`/flights/rates/${id}`);
      showToast('Flight rate deleted');
      await loadAllData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Chat
  const handleSendReply = async () => {
    if (!msgInput.trim() || !selectedConvo) return;
    try {
      setSendingMsg(true);
      await api.post('/messages', { message: msgInput.trim(), user_id: selectedConvo.user_id });
      setMsgInput('');
      const msgs = await api.get(`/messages?user_id=${selectedConvo.user_id}`); setChatMessages(msgs);
      const convData = await api.get('/messages'); setConversations(convData);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSendingMsg(false); }
  };

  const handleAttachFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedConvo) return;
    try {
      setUploadingChatFile(true);
      const formData = new FormData();
      formData.append('file', file);
      
      setUploadProgress(0);
      const res = await api.uploadWithProgress('/upload', formData, (percent) => {
        setUploadProgress(percent);
      });
      
      // Send message immediately with the uploaded attachment
      await api.post('/messages', {
        message: '',
        attachment_url: res.url,
        attachment_name: res.filename,
        attachment_type: res.mimetype,
        user_id: selectedConvo.user_id
      });
      
      // Refresh messages
      const msgs = await api.get(`/messages?user_id=${selectedConvo.user_id}`); setChatMessages(msgs);
      const convData = await api.get('/messages'); setConversations(convData);
    } catch (err) {
      showToast('Failed to upload file: ' + err.message, 'error');
    } finally {
      setUploadingChatFile(false);
      setUploadProgress(null);
      if (chatFileInputRef.current) chatFileInputRef.current.value = '';
    }
  };

  if (!user || user.role !== 'admin') {
    return (<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', paddingTop:'var(--nav-height)', flexDirection:'column', gap:16 }}><AlertCircle size={48} color="var(--color-danger)" /><h2 className="heading-3">Access Denied</h2><p className="text-muted">Admin privileges required.</p></div>);
  }

  const totalUnreadMsgs = conversations.reduce((acc, c) => acc + (c.unread || 0), 0);
  const newInquiriesCount = inquiries.filter(i=>i.status==='new').length;
  const newSRCount = srStats?.new || 0;

  const filterItems = (items, fields) => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item => fields.some(f => String(item[f]||'').toLowerCase().includes(term)));
  };

  const filteredByStatus = (items, field='status') => {
    let filtered = items;
    if (statusFilter && statusFilter !== 'all') filtered = filtered.filter(i => i[field] === statusFilter);
    return filterItems(filtered, ['customer_name','customer_email','booking_ref','app_ref','name','email','ref','package_title','from_city','to_city','country','subject']);
  };

  const serviceTypeLabel = (t) => ({ visa:'Visa Service', holiday_package:'Holiday Package', flight:'Flight Booking', hotel:'Hotel Booking', consultation:'Consultation', other:'Other' }[t] || t);

  const formatParsedJSON = (key, parsed) => {
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return 'None';
      
      // For travelers list
      if (key.includes('traveler') || key.includes('passenger')) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {parsed.map((item, idx) => (
              <div key={idx} style={{ background: 'var(--color-bg-alt)', padding: '6px 10px', borderRadius: 6, fontSize: 12 }}>
                <strong>{item.name || item.fullName || `Traveler ${idx + 1}`}</strong> 
                {item.passport && ` (Passport: ${item.passport})`} 
                {item.relationship && ` - ${item.relationship}`}
              </div>
            ))}
          </div>
        );
      }
      
      // For general list
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {parsed.map((item, idx) => {
            if (typeof item === 'object') {
              return (
                <span key={idx} style={{ fontSize: 11, background: 'var(--color-bg-alt)', padding: '3px 8px', borderRadius: 4 }}>
                  {Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(', ')}
                </span>
              );
            }
            return (
              <span key={idx} style={{ fontSize: 11, background: 'var(--color-bg-alt)', padding: '3px 8px', borderRadius: 4 }}>
                {String(item)}
              </span>
            );
          })}
        </div>
      );
    } else if (typeof parsed === 'object') {
      const entries = Object.entries(parsed);
      if (entries.length === 0) return 'Empty';
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {entries.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px dashed var(--color-border)', paddingBottom: 2 }}>
              <span className="text-muted" style={{ textTransform: 'capitalize', marginRight: 8 }}>{k.replace(/_/g, ' ')}:</span>
              <span style={{ fontWeight: 600 }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
            </div>
          ))}
        </div>
      );
    }
    return JSON.stringify(parsed);
  };

  const formatValue = (key, val) => {
    if (val === null || val === '') return '-';
    
    // If it's a string, try to parse it as JSON
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          const parsed = JSON.parse(val);
          return formatParsedJSON(key, parsed);
        } catch (e) {
          // Fallback to raw string
        }
      }
    }
    
    if (typeof val === 'object') {
      return formatParsedJSON(key, val);
    }

    // Handle date fields
    if (key.includes('date') || key.includes('created_at') || key.includes('updated_at')) {
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch(e) {}
    }
    
    return String(val);
  };

  const kpis = [
    { label:'Total Bookings', value:stats?.kpis?.totalBookings || bookings.length, icon:Package, color:'#0ea5e9', sub:`${stats?.thisWeek?.bookings||0} this week` },
    { label:'Revenue', value:`£${(stats?.kpis?.revenue||0).toLocaleString()}`, icon:DollarSign, color:'#10b981', sub:`£${(stats?.thisWeek?.revenue||0).toLocaleString()} this week` },
    { label:'Conversion Rate', value:`${stats?.kpis?.conversionRate || 0}%`, icon:TrendingUp, color:'#8b5cf6', sub:'Leads to sales conversion' },
    { label:'Visa Processing', value:`${stats?.kpis?.avgVisaProcessingTime || 0} days`, icon:Clock, color:'#d946ef', sub:'Avg successful visa time' },
    { label:'Pending Visas', value:stats?.kpis?.pendingVisas || 0, icon:Shield, color:'#6366f1', sub:`${stats?.kpis?.totalVisaApps||0} total` },
    { label:'Unread Messages', value:stats?.kpis?.unreadMsgs || totalUnreadMsgs, icon:MessageSquare, color:'#ef4444', sub:`${subscribers.length} subscribers` },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-bg)', paddingTop:'var(--nav-height)' }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            style={{ position:'fixed', top:'calc(var(--nav-height) + 16px)', right:16, zIndex:10000, padding:'12px 20px',
              borderRadius:'var(--radius-lg)', background:toast.type==='error'?'var(--color-danger)':'var(--color-success)',
              color:'white', fontWeight:600, fontSize:13, boxShadow:'var(--shadow-lg)', display:'flex', alignItems:'center', gap:8 }}>
            {toast.type==='error' ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display:'flex' }}>
        {/* Mobile toggle */}
        <button className="admin-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu size={20}/> <span>Admin Menu</span>
        </button>

        {/* Sidebar */}
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="admin-sidebar-header">Admin Panel</div>
          <nav className="admin-nav">
            {visibleTabs.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); setStatusFilter('all'); setSearchTerm(''); }}
                className={`admin-nav-item ${activeTab===tab.id?'active':''}`}>
                <tab.icon size={17}/> <span>{tab.label}</span>
                {tab.id==='messages' && totalUnreadMsgs > 0 && <span className="admin-badge">{totalUnreadMsgs}</span>}
                {tab.id==='inquiries' && newInquiriesCount > 0 && <span className="admin-badge">{newInquiriesCount}</span>}
                {tab.id==='queue' && newSRCount > 0 && <span className="admin-badge">{newSRCount}</span>}
              </button>
            ))}
            <div style={{ height:1, background:'rgba(255,255,255,0.1)', margin:'8px 0' }}/>
            <button onClick={logout} className="admin-nav-item" style={{ color:'rgba(255,255,255,0.5)' }}><LogOut size={17}/> <span>Sign Out</span></button>
          </nav>
        </aside>
        {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* Main */}
        <main style={{ flex:1, padding:'24px 32px', minHeight:'calc(100vh - var(--nav-height))', overflow:'hidden' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:'100px 0' }}><div className="spinner"/><p className="text-muted" style={{ marginTop:16 }}>Loading...</p></div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.15 }}>

                {/* ===== DASHBOARD ===== */}
                {activeTab === 'dashboard' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                      <h1 className="heading-2">Dashboard</h1>
                      <button className="btn btn-ghost btn-sm" onClick={loadAllData}><RefreshCw size={14}/> Refresh</button>
                    </div>

                    {/* Warning Alerts for Quotas */}
                    {stats?.quotas && Object.entries(stats.quotas).some(([key, q]) => q.percentage >= 70) && (
                      <div style={{
                        display:'flex', gap:12, background:'rgba(239, 68, 68, 0.08)',
                        border:'1px solid rgba(239, 68, 68, 0.2)', color:'var(--color-danger)',
                        padding:'16px 20px', borderRadius:'var(--radius-lg)', marginBottom:24,
                        alignItems:'center', boxShadow:'var(--shadow-sm)'
                      }}>
                        <AlertCircle size={20} style={{ flexShrink:0 }}/>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13 }}>Attention Required: Approaching Service Free-Tier Limits!</div>
                          <div style={{ fontSize:12, marginTop:2 }}>
                            {Object.entries(stats.quotas)
                              .filter(([key, q]) => q.percentage >= 70)
                              .map(([key, q]) => {
                                const name = key === 'db' ? 'Supabase Database Size' : key === 'r2' ? 'Cloudflare R2 Storage' : 'Supabase Auth Users';
                                return `${name} is currently at ${q.percentage}% capacity.`;
                              }).join(' ')}
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:32 }}>
                      {kpis.map((s,i) => (
                        <div key={i} className="card" style={{ padding:20 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                            <div>
                              <div className="text-muted" style={{ fontSize:11, marginBottom:4 }}>{s.label}</div>
                              <div style={{ fontSize:22, fontWeight:800 }}>{s.value}</div>
                              <div style={{ fontSize:11, color:'var(--color-text-muted)', marginTop:4 }}>{s.sub}</div>
                            </div>
                            <div style={{ width:44, height:44, borderRadius:'var(--radius-lg)', background:`${s.color}14`, color:s.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <s.icon size={20}/>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(350px, 1fr))', gap:24 }}>
                      <div>
                        {/* Recent Activity */}
                        <h3 className="heading-4" style={{ marginBottom:12 }}>Recent Activity</h3>
                        <div className="card" style={{ overflow:'hidden' }}>
                          {stats?.recentActivity?.length > 0 ? stats.recentActivity.map((item,i,arr) => (
                            <div key={i} style={{ padding:'12px 16px', borderBottom:i<arr.length-1?'1px solid var(--color-border)':'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                                <div style={{ width:32, height:32, borderRadius:8, background:item.type==='booking'?'#0ea5e914':item.type==='visa'?'#6366f114':'#f59e0b14', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                  {item.type==='booking'?<Package size={14} color="#0ea5e9"/>:item.type==='visa'?<Shield size={14} color="#6366f1"/>:<ClipboardList size={14} color="#f59e0b"/>}
                                </div>
                                <div>
                                  <div style={{ fontWeight:600, fontSize:13 }}>{item.name}</div>
                                  <div className="text-muted" style={{ fontSize:11 }}>{item.ref} · {new Date(item.created_at).toLocaleDateString()}</div>
                                </div>
                              </div>
                              <StatusBadge status={item.status}/>
                            </div>
                          )) : <div style={{ padding:30, textAlign:'center', color:'var(--color-text-muted)' }}>No recent activity</div>}
                        </div>
                      </div>

                      <div>
                        {/* Service Usage & Quotas */}
                        <h3 className="heading-4" style={{ marginBottom:12 }}>Service Usage & Free Tier Quotas</h3>
                        <div className="card" style={{ padding:24 }}>
                          {stats?.quotas ? (
                            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                              {/* Database size */}
                              <div>
                                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12, fontWeight:600 }}>
                                  <span>Supabase Database Size</span>
                                  <span style={{ color: stats.quotas.db.percentage >= 70 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                                    {formatBytes(stats.quotas.db.used)} / {formatBytes(stats.quotas.db.limit)} ({stats.quotas.db.percentage}%)
                                  </span>
                                </div>
                                <div style={{ height:8, background:'var(--color-border)', borderRadius:4, overflow:'hidden' }}>
                                  <div style={{
                                    height:'100%',
                                    width: `${stats.quotas.db.percentage}%`,
                                    background: stats.quotas.db.percentage >= 85 ? 'var(--color-danger)' : stats.quotas.db.percentage >= 70 ? '#f59e0b' : '#10b981',
                                    borderRadius:4,
                                    transition: 'width 0.5s ease'
                                  }} />
                                </div>
                              </div>

                              {/* Cloudflare R2 */}
                              <div>
                                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12, fontWeight:600 }}>
                                  <span>Cloudflare R2 Storage</span>
                                  <span style={{ color: stats.quotas.r2.percentage >= 70 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                                    {formatBytes(stats.quotas.r2.used)} / {formatBytes(stats.quotas.r2.limit)} ({stats.quotas.r2.percentage}%)
                                  </span>
                                </div>
                                <div style={{ height:8, background:'var(--color-border)', borderRadius:4, overflow:'hidden' }}>
                                  <div style={{
                                    height:'100%',
                                    width: `${stats.quotas.r2.percentage}%`,
                                    background: stats.quotas.r2.percentage >= 85 ? 'var(--color-danger)' : stats.quotas.r2.percentage >= 70 ? '#f59e0b' : '#10b981',
                                    borderRadius:4,
                                    transition: 'width 0.5s ease'
                                  }} />
                                </div>
                                <div style={{ fontSize:10, color:'var(--color-text-muted)', marginTop:4 }}>
                                  {stats.quotas.r2.configured ? `Active Connection (${stats.quotas.r2.objectsCount} files stored)` : 'R2 not configured'}
                                </div>
                              </div>

                              {/* Auth / Users */}
                              <div>
                                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:12, fontWeight:600 }}>
                                  <span>Supabase Auth (DB Users)</span>
                                  <span style={{ color: stats.quotas.auth.percentage >= 70 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                                    {stats.quotas.auth.used.toLocaleString()} / {stats.quotas.auth.limit.toLocaleString()} MAU ({stats.quotas.auth.percentage}%)
                                  </span>
                                </div>
                                <div style={{ height:8, background:'var(--color-border)', borderRadius:4, overflow:'hidden' }}>
                                  <div style={{
                                    height:'100%',
                                    width: `${stats.quotas.auth.percentage}%`,
                                    background: stats.quotas.auth.percentage >= 85 ? 'var(--color-danger)' : stats.quotas.auth.percentage >= 70 ? '#f59e0b' : '#10b981',
                                    borderRadius:4,
                                    transition: 'width 0.5s ease'
                                  }} />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ textAlign:'center', color:'var(--color-text-muted)' }}>No quota metrics available</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Advanced Business Analytics breakdowns */}
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:24, marginTop:24 }}>
                      <div className="card" style={{ padding:20 }}>
                        <h3 style={{ fontSize:14, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                          📈 Monthly Revenue (Paid Bookings)
                        </h3>
                        {stats?.breakdowns?.monthlyRevenue?.length > 0 ? (
                          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                            {stats.breakdowns.monthlyRevenue.map((r, i) => (
                              <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, paddingBottom:6, borderBottom:'1px solid var(--color-border)' }}>
                                <span style={{ fontFamily:'monospace' }}>{r.month}</span>
                                <span style={{ fontWeight:700 }}>£{parseFloat(r.total || '0').toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted" style={{ fontSize:12, textAlign:'center', padding:'20px 0' }}>No revenue records yet.</div>
                        )}
                      </div>

                      <div className="card" style={{ padding:20 }}>
                        <h3 style={{ fontSize:14, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                          🌍 Top Visa Destination Countries
                        </h3>
                        {stats?.breakdowns?.topCountries?.length > 0 ? (
                          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                            {stats.breakdowns.topCountries.map((c, i) => (
                              <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, paddingBottom:6, borderBottom:'1px solid var(--color-border)' }}>
                                <span>{c.country}</span>
                                <span className="text-muted" style={{ fontWeight:600 }}>{c.count} applications</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted" style={{ fontSize:12, textAlign:'center', padding:'20px 0' }}>No visa requests logged.</div>
                        )}
                      </div>

                      <div className="card" style={{ padding:20 }}>
                        <h3 style={{ fontSize:14, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                          ⭐ Satisfaction Ratings & Feedback
                        </h3>
                        {stats?.breakdowns?.surveyStats?.totalResponses > 0 ? (
                          <div style={{ textAlign:'center', padding:'10px 0' }}>
                            <div style={{ fontSize:36, fontWeight:800, color:'var(--color-secondary)' }}>
                              {stats.breakdowns.surveyStats.avgRating} / 5.0
                            </div>
                            <p className="text-muted" style={{ fontSize:12, marginTop:6 }}>
                              Based on {stats.breakdowns.surveyStats.totalResponses} customer feedback ratings
                            </p>
                            <div style={{ display:'flex', justifyContent:'center', gap:2, color:'var(--color-secondary)', fontSize:18, marginTop:8 }}>
                              {Array.from({ length: Math.round(stats.breakdowns.surveyStats.avgRating) }).map((_, i) => '⭐').join('')}
                            </div>
                          </div>
                        ) : (
                          <div className="text-muted" style={{ fontSize:12, textAlign:'center', padding:'20px 0' }}>No customer surveys submitted yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== SERVICE QUEUE ===== */}
                {activeTab === 'queue' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
                      <h1 className="heading-2">Service Queue {srStats && <span style={{ fontSize:14, color:'var(--color-text-muted)', fontWeight:400 }}>({srStats.total} total)</span>}</h1>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        {user.sub_role !== 'agent' && (
                          <button className="btn btn-primary btn-sm" onClick={() => { setSrCreateForm({ is_new_customer: false, user_id: '', cust_name: '', cust_email: '', cust_phone: '', cust_nationality: '', service_type: 'visa', country: countries[0]?.name || '', priority: 'normal', notes: '' }); setSrCreateModal(true); }}><Plus size={14}/> Add Request</button>
                        )}
                        <div style={{ position:'relative' }}>
                          <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }}/>
                          <input className="form-input" placeholder="Search..." value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);}} onKeyDown={e=>{if(e.key==='Enter')loadServiceReqs(1,statusFilter);}} style={{ paddingLeft:32, width:200, fontSize:13, height:36 }}/>
                        </div>
                      </div>
                    </div>
                    {srStats && (
                      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                        {[
                          { label:'All', value:'all', count:srStats.total },
                          { label:'New', value:'new', count:srStats.new },
                          { label:'Accepted', value:'accepted', count:srStats.accepted },
                          { label:'In Progress', value:'in_progress', count:srStats.in_progress },
                          { label:'Completed', value:'completed', count:srStats.completed },
                          { label:'Rejected', value:'rejected', count:srStats.rejected },
                        ].map(opt => (
                          <button key={opt.value} onClick={() => { setStatusFilter(opt.value); loadServiceReqs(1, opt.value); }} style={{
                            padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:600, border:'1px solid', cursor:'pointer', transition:'all 0.15s',
                            background: statusFilter===opt.value ? 'var(--color-secondary)' : 'transparent',
                            color: statusFilter===opt.value ? 'white' : 'var(--color-text-muted)',
                            borderColor: statusFilter===opt.value ? 'var(--color-secondary)' : 'var(--color-border)',
                          }}>{opt.label} ({opt.count})</button>
                        ))}
                      </div>
                    )}
                    <div className="card admin-table-wrap">
                      <table className="admin-table">
                        <thead><tr>{['Ref','Client','Service','Country','Priority','Status','Date','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                        <tbody>
                          {serviceReqs.map((sr,i) => (
                            <tr key={i}>
                              <td style={{ fontWeight:600, fontFamily:'monospace', fontSize:12 }}>{sr.ref}</td>
                              <td><div style={{ fontWeight:600, fontSize:13 }}>{sr.name}</div><div className="text-muted" style={{ fontSize:11 }}>{sr.email}</div></td>
                              <td>{serviceTypeLabel(sr.service_type)}</td>
                              <td>{sr.country || '-'}</td>
                              <td><StatusBadge status={sr.priority}/></td>
                              <td><StatusBadge status={sr.status}/></td>
                              <td style={{ fontSize:12 }}>{new Date(sr.created_at).toLocaleDateString()}</td>
                              <td>
                                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                                  {sr.status==='new' && <>
                                    <button className="admin-action-btn success" onClick={()=>handleUpdateSR(sr.id,{status:'accepted'})}><Check size={12}/> Accept</button>
                                    <button className="admin-action-btn danger" onClick={()=>handleUpdateSR(sr.id,{status:'rejected'})}><XCircle size={12}/> Reject</button>
                                  </>}
                                  {sr.status==='accepted' && <button className="admin-action-btn info" onClick={()=>handleUpdateSR(sr.id,{status:'in_progress'})}>Start</button>}
                                  {sr.status==='in_progress' && <button className="admin-action-btn primary" onClick={()=>handleUpdateSR(sr.id,{status:'completed'})}>Complete</button>}
                                  {sr.status !== 'completed' && sr.status !== 'rejected' && (
                                    <button 
                                      className="admin-action-btn success" 
                                      onClick={() => handleConvertSR(sr)}
                                      title={sr.service_type === 'visa' ? 'Convert to Visa Application' : 'Convert to Booking'}
                                      style={{ display:'flex', alignItems:'center', gap:2 }}
                                    >
                                      <RefreshCw size={10}/> Convert
                                    </button>
                                  )}
                                  <button className="admin-action-btn info" onClick={()=>setDetailModal({type:'sr',data:sr})}><Eye size={12}/></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {serviceReqs.length===0 && <tr><td colSpan={8} style={{ textAlign:'center', padding:30, color:'var(--color-text-muted)' }}>No service requests</td></tr>}
                        </tbody>
                      </table>
                    </div>
                    <Pagination page={srPage} totalPages={srTotal} onPageChange={(p) => loadServiceReqs(p, statusFilter)}/>
                  </div>
                )}

                {/* ===== BOOKINGS ===== */}
                {activeTab === 'bookings' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
                      <h1 className="heading-2">Bookings ({bookings.length})</h1>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        {user.sub_role !== 'agent' && (
                          <button className="btn btn-primary btn-sm" onClick={() => { setBookingCreateForm({ is_new_customer: false, user_id: customers[0]?.id || '', cust_name: '', cust_email: '', cust_phone: '', cust_nationality: '', package_id: packages[0]?.id || '', travel_date: '', travelers: 1, notes: '' }); setBookingCreateModal(true); }}><Plus size={14}/> Add Booking</button>
                        )}
                        <div style={{ position:'relative' }}>
                          <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }}/>
                          <input className="form-input" placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{ paddingLeft:32, width:200, fontSize:13, height:36 }}/>
                        </div>
                      </div>
                    </div>
                    <FilterPills value={statusFilter} onChange={setStatusFilter} options={[{label:'All',value:'all'},{label:'Pending',value:'pending'},{label:'Confirmed',value:'confirmed'},{label:'Completed',value:'completed'},{label:'Cancelled',value:'cancelled'}]}/>
                    <div className="card admin-table-wrap" style={{ marginTop:12 }}>
                      <table className="admin-table">
                        <thead><tr>{['Ref','Customer','Package','Date','Price','Status','Payment','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                        <tbody>
                          {filteredByStatus(bookings).map((b,i) => (
                            <tr key={i}>
                              <td style={{ fontWeight:600, fontFamily:'monospace', fontSize:12 }}>{b.booking_ref}</td>
                              <td><div style={{ fontWeight:600, fontSize:13 }}>{b.customer_name}</div><div className="text-muted" style={{ fontSize:11 }}>{b.customer_email}</div></td>
                              <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.package_title}</td>
                              <td style={{ fontSize:12 }}>{b.travel_date || '-'} <span className="text-muted" style={{ fontSize:11 }}>({b.travelers}pax)</span></td>
                              <td style={{ fontWeight:700 }}>£{b.total_price?.toLocaleString()}</td>
                              <td><StatusBadge status={b.status}/></td>
                              <td><StatusBadge status={b.payment_status}/>{b.payment_ref && <div style={{ fontSize:10, marginTop:3, color:'var(--color-text-muted)' }}>Ref: {b.payment_ref}</div>}</td>
                              <td>
                                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                                  {b.status==='pending' && <button className="admin-action-btn success" onClick={()=>handleUpdateBooking(b.id,{status:'confirmed'})}><Check size={12}/></button>}
                                  {b.payment_ref && b.payment_status==='pending' && <button className="admin-action-btn info" onClick={()=>handleUpdateBooking(b.id,{payment_status:'paid'})}>Pay✓</button>}
                                  {b.status==='confirmed' && <button className="admin-action-btn primary" onClick={()=>handleUpdateBooking(b.id,{status:'completed'})}>Done</button>}
                                  {!['cancelled','completed'].includes(b.status) && <button className="admin-action-btn danger" onClick={()=>handleUpdateBooking(b.id,{status:'cancelled'})}><XCircle size={12}/></button>}
                                  <button className="admin-action-btn info" onClick={()=>setDetailModal({type:'booking',data:b})}><Eye size={12}/></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {bookings.length===0 && <tr><td colSpan={8} style={{ textAlign:'center', padding:30, color:'var(--color-text-muted)' }}>No bookings</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ===== VISA ===== */}
                {activeTab === 'visa' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
                      <h1 className="heading-2">Visa Applications ({visaApps.length})</h1>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        {user.sub_role !== 'agent' && (
                          <button className="btn btn-primary btn-sm" onClick={() => { setVisaCreateForm({ is_new_customer: false, user_id: customers[0]?.id || '', cust_name: '', cust_email: '', cust_phone: '', cust_nationality: '', country: countries[0]?.name || '', nationality: '', purpose: 'tourism', notes: '' }); setVisaCreateModal(true); }}><Plus size={14}/> Add Application</button>
                        )}
                        <div style={{ position:'relative' }}>
                          <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }}/>
                          <input className="form-input" placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{ paddingLeft:32, width:200, fontSize:13, height:36 }}/>
                        </div>
                      </div>
                    </div>
                    <FilterPills value={statusFilter} onChange={setStatusFilter} options={[
                      {label:'All',value:'all'},
                      {label:'Submitted',value:'submitted'},
                      {label:'In Review',value:'in_review'},
                      {label:'Docs Complete',value:'document_complete'},
                      {label:'Fee Processing',value:'fee_processing'},
                      {label:'Embassy Submitted',value:'embassy_submitted'},
                      {label:'Interview Scheduled',value:'interview_scheduled'},
                      {label:'Approved',value:'approved'},
                      {label:'Rejected',value:'rejected'},
                      {label:'Visa Successful',value:'visa_successful'},
                      {label:'Visa Refused',value:'visa_refused'}
                    ]}/>
                    <div className="card admin-table-wrap" style={{ marginTop:12 }}>
                      <table className="admin-table">
                        <thead><tr>{['Ref','Customer','Country','Purpose','Status','Docs','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                        <tbody>
                          {filteredByStatus(visaApps).map((v,i) => (
                            <tr key={i}>
                              <td style={{ fontWeight:600, fontFamily:'monospace', fontSize:12 }}>{v.app_ref}</td>
                              <td><div style={{ fontWeight:600, fontSize:13 }}>{v.customer_name}</div><div className="text-muted" style={{ fontSize:11 }}>{v.customer_email}</div></td>
                              <td>{v.country}</td>
                              <td style={{ textTransform:'capitalize', fontSize:13 }}>{v.purpose || '-'}</td>
                              <td><StatusBadge status={v.status}/></td>
                              <td>{v.documents_json?.length > 0 ? <span style={{ color:'var(--color-success)', fontSize:12 }}>{v.documents_json.length} file(s)</span> : <span className="text-muted" style={{ fontSize:11 }}>None</span>}</td>
                              <td>
                                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                                  {v.status==='submitted' && <button className="admin-action-btn info" onClick={()=>handleUpdateVisa(v.id,{status:'in_review'})}>Review</button>}
                                  {v.status==='in_review' && <>
                                    <button className="admin-action-btn primary" style={{ color:'#0ea5e9', borderColor:'#0ea5e9' }} onClick={()=>handleUpdateVisa(v.id,{status:'document_complete'})}>Docs Complete</button>
                                    <button className="admin-action-btn success" onClick={()=>handleUpdateVisa(v.id,{status:'approved'})}><Check size={12}/></button>
                                    <button className="admin-action-btn danger" onClick={()=>handleUpdateVisa(v.id,{status:'rejected'})}><XCircle size={12}/></button>
                                  </>}
                                  {v.status==='document_complete' && <>
                                    <button className="admin-action-btn success" onClick={()=>handleUpdateVisa(v.id,{status:'approved'})}><Check size={12}/></button>
                                    <button className="admin-action-btn danger" onClick={()=>handleUpdateVisa(v.id,{status:'rejected'})}><XCircle size={12}/></button>
                                  </>}
                                  <button className="admin-action-btn info" onClick={()=>setDetailModal({type:'visa',data:v})}><Eye size={12}/></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {visaApps.length===0 && <tr><td colSpan={7} style={{ textAlign:'center', padding:30, color:'var(--color-text-muted)' }}>No visa applications</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ===== CUSTOMERS ===== */}
                {activeTab === 'customers' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
                      <h1 className="heading-2">Customers ({customers.length})</h1>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => { setEditingCust(null); setCustForm({ name:'', email:'', phone:'', nationality:'', status:'active', password:'' }); setCustModal(true); }}><Plus size={14}/> Add Customer</button>
                        <div style={{ position:'relative' }}>
                          <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }}/>
                          <input className="form-input" placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{ paddingLeft:32, width:200, fontSize:13, height:36 }}/>
                        </div>
                      </div>
                    </div>
                    <div className="card admin-table-wrap">
                      <table className="admin-table">
                        <thead><tr>{['Name','Email','Phone','Nationality','Bookings','Visas','Requests','Status','Joined','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                        <tbody>
                          {filterItems(customers, ['name','email','phone','nationality']).map((c,i) => (
                            <tr key={i}>
                              <td style={{ fontWeight:600 }}>{c.name}</td>
                              <td style={{ fontSize:12 }}>{c.email}</td>
                              <td style={{ fontSize:12 }}>{c.phone||'-'}</td>
                              <td style={{ fontSize:12 }}>{c.nationality||'-'}</td>
                              <td style={{ fontWeight:600 }}>{c.booking_count || 0}</td>
                              <td style={{ fontWeight:600 }}>{c.visa_count || 0}</td>
                              <td style={{ fontWeight:600 }}>{c.request_count || 0}</td>
                              <td><StatusBadge status={c.status || 'active'}/></td>
                              <td style={{ fontSize:12 }}>{new Date(c.created_at).toLocaleDateString()}</td>
                              <td>
                                <div style={{ display:'flex', gap:4 }}>
                                  <button className="admin-action-btn info" onClick={() => {
                                    setEditingCust(c);
                                    setCustForm({ name:c.name||'', email:c.email||'', phone:c.phone||'', nationality:c.nationality||'', status:c.status||'active', password:'' });
                                    setCustModal(true);
                                  }}><Edit2 size={12}/> Edit</button>
                                  <button className="admin-action-btn success" style={{ background:'rgba(16,185,129,0.06)', color:'#10b981', border:'1px solid rgba(16,185,129,0.1)' }} title="Copy Portal Login Link" onClick={() => handleCopyShareLink(c.email)}>
                                    <ExternalLink size={12}/> Link
                                  </button>
                                  <button className="admin-action-btn" style={{ background:'rgba(37,211,102,0.06)', color:'#25d366', border:'1px solid rgba(37,211,102,0.1)' }} title="Invite via WhatsApp" onClick={() => handleWhatsAppSharePortal(c.name, c.email, c.phone)}>
                                    💬 Invite
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {customers.length===0 && <tr><td colSpan={10} style={{ textAlign:'center', padding:30, color:'var(--color-text-muted)' }}>No customers</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ===== DOC TEMPLATES ===== */}
                {activeTab === 'doc-templates' && (
                  <div>
                    {(() => {
                      const getFolderCount = (f) => {
                        if (f.id === 'visa-general') {
                          return docTemplates.filter(t => t.service_type === 'visa' && (!t.country || t.country.toLowerCase() === 'schengen' || t.country.trim() === '')).length;
                        }
                        if (f.id === 'visa-france') {
                          return docTemplates.filter(t => t.service_type === 'visa' && t.country?.toLowerCase() === 'france').length;
                        }
                        if (f.id === 'visa-germany') {
                          return docTemplates.filter(t => t.service_type === 'visa' && t.country?.toLowerCase() === 'germany').length;
                        }
                        if (f.id === 'visa-italy') {
                          return docTemplates.filter(t => t.service_type === 'visa' && t.country?.toLowerCase() === 'italy').length;
                        }
                        if (f.id === 'visa-uk') {
                          return docTemplates.filter(t => t.service_type === 'visa' && (t.country?.toLowerCase() === 'united kingdom' || t.country?.toLowerCase() === 'uk')).length;
                        }
                        if (f.id === 'visa-other') {
                          return docTemplates.filter(t => t.service_type === 'visa' && t.country && !['france', 'germany', 'italy', 'united kingdom', 'uk', 'schengen', ''].includes(t.country.toLowerCase())).length;
                        }
                        if (f.id === 'holiday') {
                          return docTemplates.filter(t => t.service_type === 'holiday_package').length;
                        }
                        if (f.id === 'flight') {
                          return docTemplates.filter(t => t.service_type === 'flight').length;
                        }
                        if (f.id === 'other') {
                          return docTemplates.filter(t => !['visa', 'holiday_package', 'flight'].includes(t.service_type)).length;
                        }
                        return 0;
                      };

                      const getFolderTemplates = (f) => {
                        if (!f) return [];
                        if (f.id === 'visa-general') {
                          return docTemplates.filter(t => t.service_type === 'visa' && (!t.country || t.country.toLowerCase() === 'schengen' || t.country.trim() === ''));
                        }
                        if (f.id === 'visa-france') {
                          return docTemplates.filter(t => t.service_type === 'visa' && t.country?.toLowerCase() === 'france');
                        }
                        if (f.id === 'visa-germany') {
                          return docTemplates.filter(t => t.service_type === 'visa' && t.country?.toLowerCase() === 'germany');
                        }
                        if (f.id === 'visa-italy') {
                          return docTemplates.filter(t => t.service_type === 'visa' && t.country?.toLowerCase() === 'italy');
                        }
                        if (f.id === 'visa-uk') {
                          return docTemplates.filter(t => t.service_type === 'visa' && (t.country?.toLowerCase() === 'united kingdom' || t.country?.toLowerCase() === 'uk'));
                        }
                        if (f.id === 'visa-other') {
                          return docTemplates.filter(t => t.service_type === 'visa' && t.country && !['france', 'germany', 'italy', 'united kingdom', 'uk', 'schengen', ''].includes(t.country.toLowerCase()));
                        }
                        if (f.id === 'holiday') {
                          return docTemplates.filter(t => t.service_type === 'holiday_package');
                        }
                        if (f.id === 'flight') {
                          return docTemplates.filter(t => t.service_type === 'flight');
                        }
                        if (f.id === 'other') {
                          return docTemplates.filter(t => !['visa', 'holiday_package', 'flight'].includes(t.service_type));
                        }
                        return [];
                      };

                      return (
                        <div>
                          {/* Sub-tab Switcher */}
                          <div style={{ display:'flex', gap:12, borderBottom:'1px solid var(--color-border)', marginBottom:20, paddingBottom:8 }}>
                            <button 
                              onClick={() => { setDocSubTab('system'); setSelectedFolder(null); setSelectedCustomFolder(null); }}
                              style={{
                                background:'none', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', padding:'4px 8px',
                                color: docSubTab === 'system' ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                                borderBottom: docSubTab === 'system' ? '2px solid var(--color-secondary)' : 'none',
                              }}
                            >
                              Service & Country Groups (System)
                            </button>
                            <button 
                              onClick={() => { setDocSubTab('custom'); setSelectedFolder(null); setSelectedCustomFolder(null); }}
                              style={{
                                background:'none', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', padding:'4px 8px',
                                color: docSubTab === 'custom' ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                                borderBottom: docSubTab === 'custom' ? '2px solid var(--color-secondary)' : 'none',
                              }}
                            >
                              Custom Document Folders
                            </button>
                          </div>

                          {docSubTab === 'system' ? (
                            !selectedFolder ? (
                              <div>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                                  <h1 className="heading-2">Document Checklist Templates</h1>
                                  <button className="btn btn-primary btn-sm" onClick={() => { setEditingTemplate(null); setTemplateForm({ service_type:'visa', country:'', name:'', description:'', required:1, folder_id:'' }); setTemplateModal(true); }}><Plus size={14}/> Add Template</button>
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:16, marginTop:16 }}>
                                  {folders.map(f => {
                                    const count = getFolderCount(f);
                                    return (
                                      <div
                                        key={f.id}
                                        className="card hover-glow"
                                        style={{ padding:24, cursor:'pointer', display:'flex', flexDirection:'column', gap:12, position:'relative', border:'1px solid var(--color-border)', borderRadius:'var(--radius-xl)', transition:'all 0.2s' }}
                                        onClick={() => setSelectedFolder(f)}
                                      >
                                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                          <span style={{ fontSize:32 }}>{f.icon}</span>
                                          <span style={{ fontSize:11, fontWeight:700, color:'var(--color-text-muted)', background:'var(--color-bg)', padding:'3px 10px', borderRadius:12 }}>{count} items</span>
                                        </div>
                                        <div>
                                          <h4 style={{ fontWeight:700, fontSize:15, margin:0 }}>{f.name}</h4>
                                          <p className="text-muted" style={{ fontSize:11, marginTop:4, marginBottom:0 }}>
                                            {f.service_type === 'visa' ? `${f.country ? f.country + ' Visa' : 'General Schengen'} templates` : `${f.name} templates`}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
                                  <div>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedFolder(null)} style={{ marginBottom:8, padding:0, display:'flex', alignItems:'center', gap:4, color:'var(--color-secondary)', fontWeight:600 }}><ChevronLeft size={16}/> Back to Folders</button>
                                    <h1 className="heading-2">{selectedFolder.name}</h1>
                                  </div>
                                  <button className="btn btn-primary btn-sm" onClick={() => {
                                    setEditingTemplate(null);
                                    setTemplateForm({
                                      service_type: selectedFolder.service_type || 'visa',
                                      country: selectedFolder.country || '',
                                      name: '',
                                      description: '',
                                      required: 1,
                                      folder_id: ''
                                    });
                                    setTemplateModal(true);
                                  }}><Plus size={14}/> Add Template in {selectedFolder.name}</button>
                                </div>
                                <div className="card admin-table-wrap">
                                  <table className="admin-table">
                                    <thead><tr>{['Service','Country','Document Name','Description','Required','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                                    <tbody>
                                      {getFolderTemplates(selectedFolder).map((t,i) => (
                                        <tr key={i}>
                                          <td style={{ textTransform:'capitalize', fontWeight:600 }}>{t.service_type?.replace(/_/g,' ')}</td>
                                          <td>{t.country || 'All Countries'}</td>
                                          <td style={{ fontWeight:600 }}>{t.name}</td>
                                          <td style={{ fontSize:12, color:'var(--color-text-muted)' }}>{t.description || '-'}</td>
                                          <td>{t.required ? <span style={{ color:'var(--color-danger)', fontWeight:600 }}>Yes</span> : <span className="text-muted">No</span>}</td>
                                          <td>
                                            <div style={{ display:'flex', gap:4 }}>
                                              <button className="admin-action-btn info" onClick={() => {
                                                setEditingTemplate(t);
                                                setTemplateForm({ service_type:t.service_type, country:t.country||'', name:t.name, description:t.description||'', required:t.required, folder_id: t.folder_id || '' });
                                                setTemplateModal(true);
                                              }}><Edit2 size={12}/> Edit</button>
                                              <button className="admin-action-btn danger" onClick={() => handleDeleteTemplate(t.id)}><Trash2 size={12}/></button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                      {getFolderTemplates(selectedFolder).length===0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:30, color:'var(--color-text-muted)' }}>No document templates in this folder.</td></tr>}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )
                          ) : (
                            !selectedCustomFolder ? (
                              <div>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                                  <h1 className="heading-2">Custom Document Folders</h1>
                                  <button className="btn btn-primary btn-sm" onClick={() => { setEditingCustomFolder(null); setCustomFolderForm({ name:'' }); setCustomFolderModal(true); }}><Plus size={14}/> Add Custom Folder</button>
                                </div>
                                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:16, marginTop:16 }}>
                                  {customFolders.map(f => (
                                    <div
                                      key={f.id}
                                      className="card hover-glow"
                                      style={{ padding:24, cursor:'pointer', display:'flex', flexDirection:'column', gap:12, position:'relative', border:'1px solid var(--color-border)', borderRadius:'var(--radius-xl)', transition:'all 0.2s' }}
                                      onClick={() => setSelectedCustomFolder(f)}
                                    >
                                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                        <span style={{ fontSize:32 }}>📁</span>
                                        <span style={{ fontSize:11, fontWeight:700, color:'var(--color-text-muted)', background:'var(--color-bg)', padding:'3px 10px', borderRadius:12 }}>{f.template_count || 0} items</span>
                                      </div>
                                      <div>
                                        <h4 style={{ fontWeight:700, fontSize:15, margin:0 }}>{f.name}</h4>
                                        <p className="text-muted" style={{ fontSize:11, marginTop:4, marginBottom:0 }}>
                                          Custom shared checklist folder
                                        </p>
                                      </div>
                                      <div style={{ display:'flex', gap:6, justifyContent:'flex-end', marginTop:8 }} onClick={e => e.stopPropagation()}>
                                        <button className="admin-action-btn info" onClick={() => { setEditingCustomFolder(f); setCustomFolderForm({ name: f.name }); setCustomFolderModal(true); }}><Edit2 size={12}/></button>
                                        <button className="admin-action-btn danger" onClick={() => handleDeleteCustomFolder(f.id)}><Trash2 size={12}/></button>
                                      </div>
                                    </div>
                                  ))}
                                  {customFolders.length === 0 && (
                                    <div style={{ gridColumn:'1/-1', textAlign:'center', padding:40, color:'var(--color-text-muted)', border:'1px dashed var(--color-border)', borderRadius:12 }}>
                                      No custom folders created yet. Click "Add Custom Folder" to get started.
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
                                  <div>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCustomFolder(null)} style={{ marginBottom:8, padding:0, display:'flex', alignItems:'center', gap:4, color:'var(--color-secondary)', fontWeight:600 }}><ChevronLeft size={16}/> Back to Folders</button>
                                    <h1 className="heading-2">{selectedCustomFolder.name}</h1>
                                  </div>
                                  <button className="btn btn-primary btn-sm" onClick={() => {
                                    setEditingTemplate(null);
                                    setTemplateForm({
                                      service_type: 'visa',
                                      country: '',
                                      name: '',
                                      description: '',
                                      required: 1,
                                      folder_id: selectedCustomFolder.id
                                    });
                                    setTemplateModal(true);
                                  }}><Plus size={14}/> Add Template in {selectedCustomFolder.name}</button>
                                </div>
                                <div className="card admin-table-wrap">
                                  <table className="admin-table">
                                    <thead><tr>{['Service','Country','Document Name','Description','Required','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                                    <tbody>
                                      {docTemplates.filter(t => t.folder_id === selectedCustomFolder.id).map((t,i) => (
                                        <tr key={i}>
                                          <td style={{ textTransform:'capitalize', fontWeight:600 }}>{t.service_type?.replace(/_/g,' ')}</td>
                                          <td>{t.country || 'All Countries'}</td>
                                          <td style={{ fontWeight:600 }}>{t.name}</td>
                                          <td style={{ fontSize:12, color:'var(--color-text-muted)' }}>{t.description || '-'}</td>
                                          <td>{t.required ? <span style={{ color:'var(--color-danger)', fontWeight:600 }}>Yes</span> : <span className="text-muted">No</span>}</td>
                                          <td>
                                            <div style={{ display:'flex', gap:4 }}>
                                              <button className="admin-action-btn info" onClick={() => {
                                                setEditingTemplate(t);
                                                setTemplateForm({ service_type:t.service_type, country:t.country||'', name:t.name, description:t.description||'', required:t.required, folder_id: t.folder_id || '' });
                                                setTemplateModal(true);
                                              }}><Edit2 size={12}/> Edit</button>
                                              <button className="admin-action-btn danger" onClick={() => handleDeleteTemplate(t.id)}><Trash2 size={12}/></button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                      {docTemplates.filter(t => t.folder_id === selectedCustomFolder.id).length === 0 && (
                                        <tr><td colSpan={6} style={{ textAlign:'center', padding:30, color:'var(--color-text-muted)' }}>No document templates in this folder.</td></tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ===== INQUIRIES ===== */}
                {activeTab === 'inquiries' && (
                  <div>
                    <h1 className="heading-2" style={{ marginBottom:16 }}>Inquiries ({inquiries.length})</h1>
                    <FilterPills value={statusFilter} onChange={setStatusFilter} options={[{label:'All',value:'all'},{label:'New',value:'new'},{label:'Replied',value:'replied'},{label:'Closed',value:'closed'}]}/>
                    <div style={{ marginTop:12 }}>
                    {filteredByStatus(inquiries).length > 0 ? filteredByStatus(inquiries).map((inq,i) => (
                      <div key={i} className="card" style={{ padding:20, marginBottom:12 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                          <div>
                            <div style={{ fontWeight:700, fontSize:14 }}>{inq.name}</div>
                            <div className="text-muted" style={{ fontSize:12 }}>{inq.email} {inq.phone && `· ${inq.phone}`} · {new Date(inq.created_at).toLocaleDateString()}</div>
                            <span style={{ display:'inline-block', padding:'2px 8px', background:'#0ea5e914', color:'#0ea5e9', borderRadius:10, fontSize:10, fontWeight:600, marginTop:6 }}>{inq.subject}</span>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <StatusBadge status={inq.status}/>
                            <button className="admin-action-btn info" onClick={()=>setDetailModal({type:'inquiry',data:inq})}><Eye size={12}/> View</button>
                            {inq.status==='new' && <button className="admin-action-btn info" onClick={()=>handleUpdateInquiry(inq.id,{status:'replied'})}>Replied</button>}
                            {inq.status!=='closed' && <button className="admin-action-btn danger" onClick={()=>handleUpdateInquiry(inq.id,{status:'closed'})}>Close</button>}
                            <button className="admin-action-btn success" style={{ background:'rgba(16,185,129,0.06)', color:'#10b981', border:'1px solid rgba(16,185,129,0.1)' }} title="Copy Portal Link" onClick={() => handleCopyShareLink(inq.email)}>
                              Share Portal
                            </button>
                            {inq.phone && (
                              <button className="admin-action-btn" style={{ background:'rgba(37,211,102,0.06)', color:'#25d366', border:'1px solid rgba(37,211,102,0.1)' }} title="Invite via WhatsApp" onClick={() => handleWhatsAppSharePortal(inq.name, inq.email, inq.phone)}>
                                💬 WhatsApp
                              </button>
                            )}
                          </div>
                        </div>
                        <p style={{ marginTop:12, fontSize:13, color:'var(--color-text)', background:'var(--color-bg)', padding:'10px 14px', borderRadius:8, borderLeft:'3px solid var(--color-secondary)', lineHeight:1.6 }}>{inq.message}</p>
                      </div>
                    )) : <div className="card" style={{ padding:30, textAlign:'center', color:'var(--color-text-muted)' }}>No inquiries</div>}
                    </div>
                  </div>
                )}

                {/* ===== MESSAGES ===== */}
                {activeTab === 'messages' && (
                  <div>
                    <h1 className="heading-2" style={{ marginBottom:16 }}>Customer Messages</h1>
                    <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:0, height:500 }} className="card">
                      <div style={{ borderRight:'1px solid var(--color-border)', overflowY:'auto' }}>
                        {conversations.length > 0 ? conversations.map((c,i) => (
                          <button key={i} onClick={() => setSelectedConvo(c)} style={{
                            width:'100%', display:'flex', gap:10, padding:'12px 14px', border:'none', cursor:'pointer', textAlign:'left',
                            background:selectedConvo?.user_id===c.user_id ? 'rgba(14,165,233,0.06)' : 'transparent',
                            borderBottom:'1px solid var(--color-border)', transition:'background 0.15s'
                          }}>
                            <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#0ea5e9,#06b6d4)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0 }}>{c.name?.[0]||'?'}</div>
                            <div style={{ flex:1, overflow:'hidden' }}>
                              <div style={{ display:'flex', justifyContent:'space-between' }}>
                                <span style={{ fontWeight:600, fontSize:13 }}>{c.name}</span>
                                {c.unread > 0 && <span style={{ background:'#ef4444', color:'white', fontSize:10, fontWeight:700, borderRadius:9, minWidth:18, height:18, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 5px' }}>{c.unread}</span>}
                              </div>
                              <div style={{ fontSize:11, color:'var(--color-text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.last_message}</div>
                            </div>
                          </button>
                        )) : <div style={{ padding:30, textAlign:'center', color:'var(--color-text-muted)', fontSize:13 }}>No conversations</div>}
                      </div>
                      <div style={{ display:'flex', flexDirection:'column' }}>
                        {selectedConvo ? (<>
                          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--color-border)', background:'var(--color-surface)', display:'flex', flexDirection:'column', gap:10 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#0ea5e9,#6366f1)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14 }}>
                                  {selectedConvo.name?.[0]||'?'}
                                </div>
                                <div>
                                  <div style={{ fontWeight:700, fontSize:14, display:'flex', alignItems:'center', gap:6 }}>
                                    {selectedConvo.name}
                                  </div>
                                  <div className="text-muted" style={{ fontSize:11 }}>{selectedConvo.email}</div>
                                </div>
                              </div>

                              {/* Assignee Dropdown */}
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <span style={{ fontSize:11, fontWeight:600, color:'var(--color-text-muted)' }}>Assigned Agent:</span>
                                <select
                                  className="form-input form-select"
                                  style={{ fontSize:12, padding:'3px 24px 3px 10px', height:28, minWidth:130, width:'auto' }}
                                  value={selectedConvo.assigned_to || ''}
                                  onChange={async (e) => {
                                    const nextAgentId = e.target.value;
                                    try {
                                      await api.put(`/auth/customers/${selectedConvo.user_id}`, {
                                        name: selectedConvo.name,
                                        email: selectedConvo.email,
                                        assigned_to: nextAgentId ? parseInt(nextAgentId) : null
                                      });
                                      showToast('Chat agent assigned successfully');
                                      const convData = await api.get('/messages');
                                      setConversations(convData);
                                      setSelectedConvo({ ...selectedConvo, assigned_to: nextAgentId ? parseInt(nextAgentId) : null });
                                      await loadAllData();
                                    } catch (err) {
                                      showToast(err.message, 'error');
                                    }
                                  }}
                                >
                                  <option value="">Unassigned</option>
                                  {staffList.filter(s => s.sub_role === 'agent').map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Client active cases banner */}
                            <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', paddingTop:4, borderTop:'1px dashed var(--color-border)' }}>
                              <span style={{ fontSize:10, fontWeight:700, color:'var(--color-text-muted)', textTransform:'uppercase' }}>Client Cases:</span>
                              {(() => {
                                const clientBookings = bookings.filter(b => b.user_id === selectedConvo.user_id || b.customer_email?.toLowerCase() === selectedConvo.email?.toLowerCase());
                                const clientVisas = visaApps.filter(v => v.user_id === selectedConvo.user_id || v.customer_email?.toLowerCase() === selectedConvo.email?.toLowerCase());
                                const clientFlights = flightReqs.filter(f => f.user_id === selectedConvo.user_id || f.customer_email?.toLowerCase() === selectedConvo.email?.toLowerCase());
                                
                                if (clientBookings.length === 0 && clientVisas.length === 0 && clientFlights.length === 0) {
                                  return <span style={{ fontSize:11, color:'var(--color-text-muted)' }}>No active cases</span>;
                                }
                                
                                return (
                                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                    {clientBookings.map(b => (
                                      <span key={b.id} style={{ fontSize:10, background:'#0ea5e910', color:'#0ea5e9', padding:'2px 6px', borderRadius:4, fontWeight:600, border:'1px solid #0ea5e920' }}>
                                        Booking: {b.booking_ref} ({b.status})
                                      </span>
                                    ))}
                                    {clientVisas.map(v => (
                                      <span key={v.id} style={{ fontSize:10, background:'#6366f110', color:'#6366f1', padding:'2px 6px', borderRadius:4, fontWeight:600, border:'1px solid #6366f120' }}>
                                        Visa: {v.app_ref} ({v.status})
                                      </span>
                                    ))}
                                    {clientFlights.map(f => (
                                      <span key={f.id} style={{ fontSize:10, background:'#f59e0b10', color:'#f59e0b', padding:'2px 6px', borderRadius:4, fontWeight:600, border:'1px solid #f59e0b20' }}>
                                        Flight: {f.from_city}✈️{f.to_city} ({f.status})
                                      </span>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                          <div style={{ flex:1, overflowY:'auto', padding:20, display:'flex', flexDirection:'column', gap:12, background:'var(--color-bg)' }}>
                            {chatMessages.map((msg,i) => {
                              const isSelf = msg.sender === 'admin'; // Agent/Admin sent it
                              const hasAttachment = !!msg.attachment_url;
                              const isImage = hasAttachment && msg.attachment_type && msg.attachment_type.toLowerCase().startsWith('image/');
                              return (
                                <div key={i} style={{ display:'flex', justifyContent:isSelf?'flex-end':'flex-start', gap:8, alignItems:'flex-start' }}>
                                  {!isSelf && (
                                    <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:10, flexShrink:0, marginTop:2 }}>
                                      {selectedConvo.name?.[0]||'?'}
                                    </div>
                                  )}
                                  <div style={{
                                    maxWidth:'70%', padding:'10px 14px', borderRadius:14, fontSize:13, lineHeight:1.5,
                                    background:isSelf?'linear-gradient(135deg, #0ea5e9, #0284c7)':'var(--color-surface)',
                                    color:isSelf?'white':'var(--color-text)',
                                    boxShadow:'0 1px 2px rgba(0,0,0,0.05)',
                                    border:isSelf?'none':'1px solid var(--color-border)',
                                    borderBottomRightRadius:isSelf?4:14,
                                    borderBottomLeftRadius:isSelf?14:4
                                  }}>
                                    {isImage && (
                                      <div style={{ marginBottom: msg.message ? 8 : 0, overflow:'hidden', borderRadius:8 }}>
                                        <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                          <img src={msg.attachment_url} alt={msg.attachment_name || "Uploaded Image"} style={{ maxWidth:'100%', maxHeight:200, display:'block', objectFit:'cover', borderRadius:6 }} />
                                        </a>
                                      </div>
                                    )}
                                    {hasAttachment && !isImage && (
                                      <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" style={{
                                        display:'flex', alignItems:'center', gap:10, textDecoration:'none',
                                        padding:'8px 12px', background:isSelf?'rgba(255,255,255,0.1)':'var(--color-bg-alt)',
                                        borderRadius:8, color:isSelf?'#ffffff':'var(--color-text)',
                                        marginBottom: msg.message ? 8 : 0, border:isSelf?'1px solid rgba(255,255,255,0.15)':'1px solid var(--color-border)'
                                      }}>
                                        <div style={{ background:isSelf?'rgba(255,255,255,0.15)':'rgba(14,165,233,0.1)', color:isSelf?'#ffffff':'#0ea5e9', padding:6, borderRadius:6 }}>
                                          <FileText size={18} />
                                        </div>
                                        <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, fontSize:12 }}>
                                          <div style={{ fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{msg.attachment_name || 'Attachment'}</div>
                                          <div style={{ fontSize:10, opacity:0.8 }}>Click to download</div>
                                        </div>
                                      </a>
                                    )}
                                    {msg.message && <div style={{ wordBreak:'break-word' }}>{msg.message}</div>}
                                    <div style={{ fontSize:10, opacity:0.6, marginTop:4, textAlign:'right' }}>
                                      {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                                    </div>
                                  </div>
                                  {isSelf && (
                                    <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#0ea5e9,#06b6d4)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:10, flexShrink:0, marginTop:2 }}>
                                      {user.name?.[0]||'A'}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            <div ref={msgEndRef}/>
                          </div>
                          <div style={{ display:'flex', gap:6, padding:'8px 12px', borderTop:'1px solid var(--color-border)', alignItems:'center' }}>
                            <input type="file" ref={chatFileInputRef} onChange={handleAttachFile} style={{ display:'none' }} />
                            <button className="btn btn-outline btn-icon" onClick={() => chatFileInputRef.current?.click()} disabled={uploadingChatFile || sendingMsg} style={{ flexShrink:0, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center' }} title="Attach image or file">
                              {uploadingChatFile ? (
                                <div className="spinner-border" style={{ width:16, height:16, border:'2px solid var(--color-secondary)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
                              ) : (
                                <Paperclip size={15}/>
                              )}
                            </button>
                            <input className="form-input" placeholder={uploadingChatFile ? "Uploading attachment..." : "Type reply..."} value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter' && !e.shiftKey){e.preventDefault();handleSendReply();}}} style={{ flex:1, border:'none', background:'transparent', padding:'8px 12px' }} disabled={uploadingChatFile}/>
                            <button className="btn btn-primary btn-icon" onClick={handleSendReply} disabled={sendingMsg || uploadingChatFile || (!msgInput.trim())} style={{ width:38, height:38 }}><Send size={15}/></button>
                          </div>
                        </>) : (
                          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', color:'var(--color-text-muted)' }}>
                            <MessageSquare size={36} style={{ opacity:0.2, marginBottom:10 }}/><p style={{ fontSize:13 }}>Select a conversation</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== PACKAGES ===== */}
                {activeTab === 'packages' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                      <h1 className="heading-2">Packages ({packages.length})</h1>
                      <button className="btn btn-primary btn-sm" onClick={() => { setEditingPkg(null); setPkgForm(emptyPkg); setPkgModal(true); }}><Plus size={14}/> Add Package</button>
                    </div>
                    <div className="card admin-table-wrap">
                      <table className="admin-table">
                        <thead><tr>{['Title','Destination','Price','Type','Rating','Featured','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                        <tbody>
                          {packages.map((p,i) => (
                            <tr key={i}>
                              <td style={{ fontWeight:600 }}>{p.title}</td>
                              <td>{p.destination}</td>
                              <td>£{p.price} {p.original_price && <span className="text-muted" style={{ textDecoration:'line-through', fontSize:11 }}>£{p.original_price}</span>}</td>
                              <td style={{ textTransform:'capitalize' }}>{p.type}</td>
                              <td>⭐ {p.rating} ({p.reviews})</td>
                              <td>{p.featured ? '✅' : '—'}</td>
                              <td>
                                <div style={{ display:'flex', gap:4 }}>
                                  <button className="admin-action-btn info" onClick={() => openEditPkg(p)}><Edit2 size={12}/></button>
                                  <button className="admin-action-btn danger" onClick={() => handleDeletePackage(p.id)}><Trash2 size={12}/></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {packages.length===0 && <tr><td colSpan={7} style={{ textAlign:'center', padding:30, color:'var(--color-text-muted)' }}>No packages</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ===== BLOG ===== */}
                {activeTab === 'blog' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                      <h1 className="heading-2">Blog Posts ({blogPosts.length})</h1>
                      <button className="btn btn-primary btn-sm" onClick={() => { setEditingBlog(null); setBlogForm(emptyBlog); setBlogModal(true); }}><Plus size={14}/> New Post</button>
                    </div>
                    <div className="card admin-table-wrap">
                      <table className="admin-table">
                        <thead><tr>{['Title','Category','Status','Date','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                        <tbody>
                          {blogPosts.map((p,i) => (
                            <tr key={i}>
                              <td style={{ fontWeight:600 }}>{p.title}</td>
                              <td>{p.category}</td>
                              <td>{p.published ? <StatusBadge status="approved"/> : <StatusBadge status="pending"/>}</td>
                              <td style={{ fontSize:12 }}>{new Date(p.created_at).toLocaleDateString()}</td>
                              <td>
                                <div style={{ display:'flex', gap:4 }}>
                                  <button className="admin-action-btn info" onClick={() => { setEditingBlog(p); setBlogForm({ title:p.title, content:p.content||'', excerpt:p.excerpt||'', cover_image:p.cover_image||'', category:p.category||'Travel Guide', published:p.published }); setBlogModal(true); }}><Edit2 size={12}/></button>
                                  <button className="admin-action-btn danger" onClick={() => handleDeleteBlog(p.id)}><Trash2 size={12}/></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {blogPosts.length===0 && <tr><td colSpan={5} style={{ textAlign:'center', padding:30, color:'var(--color-text-muted)' }}>No posts</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ===== MEDIA LIBRARY ===== */}
                {activeTab === 'media' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                      <div>
                        <h1 className="heading-2" style={{ margin:0 }}>Media Library</h1>
                        <p className="text-muted" style={{ fontSize:12, marginTop:4 }}>Upload files to use as covers, logos, or attachments in your campaigns, blogs, or packages.</p>
                      </div>
                      <div>
                        <label className="btn btn-primary btn-sm" style={{ cursor:'pointer' }}>
                          <Plus size={14}/> Upload Files
                          <input 
                            type="file" 
                            multiple 
                            accept="image/*,video/*,application/pdf" 
                            style={{ display:'none' }} 
                            onChange={async (e) => {
                              if (!e.target.files.length) return;
                              setLoading(true);
                              let successCount = 0;
                              let index = 0;
                              const totalFiles = e.target.files.length;
                              for (let file of e.target.files) {
                                index++;
                                const formData = new FormData();
                                formData.append('file', file);
                                try {
                                  setUploadProgress({
                                    filename: file.name,
                                    percent: 0,
                                    current: index,
                                    total: totalFiles
                                  });
                                  await api.uploadWithProgress('/upload', formData, (percent) => {
                                    setUploadProgress({
                                      filename: file.name,
                                      percent,
                                      current: index,
                                      total: totalFiles
                                    });
                                  });
                                  successCount++;
                                } catch (uploadErr) {
                                  showToast(`Failed to upload ${file.name}: ${uploadErr.message}`, 'error');
                                }
                              }
                              setUploadProgress(null);
                              if (successCount > 0) {
                                showToast(`Successfully uploaded ${successCount} file(s)`);
                                await loadAllData(true);
                              }
                              setLoading(false);
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="card" style={{ padding:20, background:'var(--color-bg-card)', borderRadius:12 }}>
                      {mediaFiles.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--color-text-muted)' }}>
                          <Image size={40} style={{ opacity:0.5, marginBottom:12 }} />
                          <h3 style={{ fontSize:16, fontWeight:600, color:'var(--color-text)' }}>Your Media Library is empty</h3>
                          <p style={{ fontSize:13, maxWidth:350, margin:'4px auto 0' }}>Upload images, itineraries or PDFs here, then copy their URLs to link them anywhere in the application.</p>
                        </div>
                      ) : (
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:16 }}>
                          {mediaFiles.map((file) => {
                            const isImage = file.mimetype.startsWith('image/');
                            return (
                              <div 
                                key={file.id} 
                                className="card" 
                                style={{ 
                                  display:'flex', 
                                  flexDirection:'column', 
                                  borderRadius:8, 
                                  overflow:'hidden', 
                                  border:'1px solid var(--color-border)',
                                  background:'var(--color-surface)',
                                  position:'relative',
                                  height:230
                                }}
                              >
                                {/* Preview Panel */}
                                <div style={{ 
                                  height:110, 
                                  background:'var(--color-bg)', 
                                  display:'flex', 
                                  alignItems:'center', 
                                  justifyContent:'center',
                                  overflow:'hidden',
                                  borderBottom:'1px solid var(--color-border)'
                                }}>
                                  {isImage ? (
                                    <img 
                                      src={file.url} 
                                      alt={file.original_name} 
                                      style={{ width:'100%', height:'100%', objectFit:'cover' }} 
                                    />
                                  ) : (
                                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                                      <FileText size={32} color="var(--color-primary)" />
                                      <span style={{ fontSize:9, fontWeight:600, color:'var(--color-text-muted)' }}>{file.mimetype.split('/')[1]?.toUpperCase()}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Content Details */}
                                <div style={{ padding:10, flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                                  <div>
                                    <h4 
                                      style={{ 
                                        fontSize:12, 
                                        fontWeight:600, 
                                        margin:0, 
                                        whiteSpace:'nowrap', 
                                        overflow:'hidden', 
                                        textOverflow:'ellipsis',
                                        color:'var(--color-text-title)'
                                      }}
                                      title={file.original_name}
                                    >
                                      {file.original_name}
                                    </h4>
                                    <span style={{ fontSize:10, color:'var(--color-text-muted)' }}>
                                      {(file.size / 1024).toFixed(1)} KB
                                    </span>
                                  </div>

                                  <div style={{ display:'flex', gap:6, marginTop:8 }}>
                                    <button 
                                      className="btn btn-outline btn-xs" 
                                      style={{ flex:1, fontSize:10, padding:'4px 6px' }}
                                      onClick={() => {
                                        navigator.clipboard.writeText(window.location.origin + file.url);
                                        showToast('Link copied to clipboard!');
                                      }}
                                    >
                                      Copy URL
                                    </button>
                                    <button 
                                      className="btn btn-outline btn-xs btn-danger" 
                                      style={{ padding:'4px 6px', color:'var(--color-danger)', borderColor:'var(--color-border-danger)' }}
                                      onClick={() => handleDeleteMedia(file.id)}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== FLIGHTS ===== */}
                {activeTab === 'flights' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <h1 className="heading-2" style={{ margin: 0 }}>Flights</h1>
                        <div style={{ display: 'flex', background: 'var(--color-bg)', padding: 4, borderRadius: 8, border: '1px solid var(--color-border)' }}>
                          <button
                            onClick={() => setFlightRatesSubTab('requests')}
                            style={{
                              padding: '6px 16px',
                              borderRadius: 6,
                              fontSize: 13,
                              fontWeight: 600,
                              border: 'none',
                              cursor: 'pointer',
                              background: flightRatesSubTab === 'requests' ? 'var(--color-surface)' : 'transparent',
                              color: flightRatesSubTab === 'requests' ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                              boxShadow: flightRatesSubTab === 'requests' ? 'var(--shadow-sm)' : 'none',
                              transition: 'all 0.2s'
                            }}
                          >
                            Requests
                          </button>
                          <button
                            onClick={() => setFlightRatesSubTab('rates')}
                            style={{
                              padding: '6px 16px',
                              borderRadius: 6,
                              fontSize: 13,
                              fontWeight: 600,
                              border: 'none',
                              cursor: 'pointer',
                              background: flightRatesSubTab === 'rates' ? 'var(--color-surface)' : 'transparent',
                              color: flightRatesSubTab === 'rates' ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                              boxShadow: flightRatesSubTab === 'rates' ? 'var(--shadow-sm)' : 'none',
                              transition: 'all 0.2s'
                            }}
                          >
                            Flight Rates / Deals
                          </button>
                        </div>
                      </div>
                      {flightRatesSubTab === 'rates' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setEditingRate(null);
                            setRateForm({ from_city: '', to_city: '', price: '', airline: 'Multiple Airlines' });
                            setRateModal(true);
                          }}
                        >
                          <Plus size={14} /> Add Flight Rate
                        </button>
                      )}
                    </div>

                    {flightRatesSubTab === 'requests' && (
                      <div>
                        <FilterPills value={statusFilter} onChange={setStatusFilter} options={[{label:'All',value:'all'},{label:'New',value:'new'},{label:'Quoted',value:'quoted'},{label:'Accepted',value:'accepted'},{label:'Completed',value:'completed'}]}/>
                        <div className="card admin-table-wrap" style={{ marginTop:12 }}>
                          <table className="admin-table">
                            <thead><tr>{['Client','From','To','Depart','Return','Pax','Class','Status','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                            <tbody>
                              {filteredByStatus(flightReqs).map((f,i) => (
                                <tr key={i}>
                                  <td><div style={{ fontWeight:600, fontSize:13 }}>{f.customer_name||'Guest'}</div><div className="text-muted" style={{ fontSize:11 }}>{f.customer_email||'-'}</div></td>
                                  <td style={{ fontWeight:600 }}>{f.from_city}</td>
                                  <td style={{ fontWeight:600 }}>{f.to_city}</td>
                                  <td style={{ fontSize:12 }}>{f.depart_date}</td>
                                  <td style={{ fontSize:12 }}>{f.return_date || '-'}</td>
                                  <td>{f.passengers}</td>
                                  <td style={{ textTransform:'capitalize', fontSize:12 }}>{f.class}</td>
                                  <td><StatusBadge status={f.status}/></td>
                                  <td>
                                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                                      <button className="admin-action-btn info" onClick={()=>setDetailModal({type:'flight',data:f})}><Eye size={12}/></button>
                                      {f.status==='new' && <button className="admin-action-btn info" onClick={()=>handleUpdateFlight(f.id,{status:'quoted'})}>Quote</button>}
                                      {f.status==='quoted' && <button className="admin-action-btn success" onClick={()=>handleUpdateFlight(f.id,{status:'accepted'})}><Check size={12}/></button>}
                                      {f.status==='accepted' && <button className="admin-action-btn primary" onClick={()=>handleUpdateFlight(f.id,{status:'completed'})}>Done</button>}
                                      {!['completed','rejected'].includes(f.status) && <button className="admin-action-btn danger" onClick={()=>handleUpdateFlight(f.id,{status:'rejected'})}><XCircle size={12}/></button>}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {flightReqs.length===0 && <tr><td colSpan={9} style={{ textAlign:'center', padding:30, color:'var(--color-text-muted)' }}>No flight requests</td></tr>}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {flightRatesSubTab === 'rates' && (
                      <div className="card admin-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>{['From City','To City','Price','Airline','Actions'].map(h=><th key={h}>{h}</th>)}</tr>
                          </thead>
                          <tbody>
                            {flightRates.map((rate, i) => (
                              <tr key={rate.id || i}>
                                <td style={{ fontWeight: 600 }}>{rate.from_city}</td>
                                <td style={{ fontWeight: 600 }}>{rate.to_city}</td>
                                <td style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>£{rate.price}</td>
                                <td>{rate.airline || 'Multiple Airlines'}</td>
                                <td>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button
                                      className="admin-action-btn info"
                                      onClick={() => {
                                        setEditingRate(rate);
                                        setRateForm({
                                          from_city: rate.from_city,
                                          to_city: rate.to_city,
                                          price: rate.price,
                                          airline: rate.airline || 'Multiple Airlines'
                                        });
                                        setRateModal(true);
                                      }}
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      className="admin-action-btn danger"
                                      onClick={() => handleDeleteFlightRate(rate.id)}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {flightRates.length === 0 && (
                              <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: 30, color: 'var(--color-text-muted)' }}>
                                  No flight rates defined. Click "Add Flight Rate" to add one.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== COUNTRIES ===== */}
                {activeTab === 'countries' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                      <h1 className="heading-2">Countries ({countries.length})</h1>
                      <button className="btn btn-primary btn-sm" onClick={() => { setCountryForm({ name:'', code:'', region:'schengen', visa_required:1 }); setCountryModal(true); }}><Plus size={14}/> Add Country</button>
                    </div>
                    <div className="card admin-table-wrap">
                      <table className="admin-table">
                        <thead><tr>{['Name','Code','Region','Visa Required','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                        <tbody>
                          {countries.map((c,i) => (
                            <tr key={i}>
                              <td style={{ fontWeight:600 }}>{c.name}</td>
                              <td style={{ fontFamily:'monospace' }}>{c.code}</td>
                              <td style={{ textTransform:'capitalize' }}>{c.region?.replace('_',' ')}</td>
                              <td>{c.visa_required ? 'Yes' : 'No'}</td>
                              <td>
                                <button className="admin-action-btn danger" onClick={() => handleDeleteCountry(c.id)}><Trash2 size={12}/></button>
                              </td>
                            </tr>
                          ))}
                          {countries.length===0 && <tr><td colSpan={5} style={{ textAlign:'center', padding:30, color:'var(--color-text-muted)' }}>No countries</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ===== STAFF ===== */}
                {activeTab === 'staff' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                      <h1 className="heading-2">Staff Members ({staffList.length})</h1>
                      <button className="btn btn-primary btn-sm" onClick={handleAddStaffClick}><UserPlus size={14}/> Add Staff</button>
                    </div>
                    <div className="card admin-table-wrap">
                      <table className="admin-table">
                        <thead><tr>{['Name','Email','Role','Status','Joined','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                        <tbody>
                          {staffList.map((s,i) => (
                            <tr key={i}>
                              <td style={{ fontWeight:600 }}>{s.name}</td>
                              <td style={{ fontSize:12 }}>{s.email}</td>
                              <td><StatusBadge status={s.sub_role || 'manager'}/></td>
                              <td><StatusBadge status={s.status || 'active'}/></td>
                              <td style={{ fontSize:12 }}>{new Date(s.created_at).toLocaleDateString()}</td>
                              <td>
                                <div style={{ display:'flex', gap:4 }}>
                                  <button className="admin-action-btn info" onClick={() => handleEditStaffClick(s)} title="Edit Staff Access"><Edit2 size={12}/></button>
                                  <button
                                    className="admin-action-btn danger"
                                    onClick={() => handleDeleteStaff(s.id)}
                                    disabled={s.id === user?.id}
                                    style={{ opacity: s.id === user?.id ? 0.5 : 1, cursor: s.id === user?.id ? 'not-allowed' : 'pointer' }}
                                    title={s.id === user?.id ? "You cannot delete yourself" : "Delete Staff"}
                                  >
                                    <Trash2 size={12}/>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {staffList.length===0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:30, color:'var(--color-text-muted)' }}>No staff</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ===== NEWSLETTER ===== */}
                {activeTab === 'newsletter' && (
                  <div>
                    <h1 className="heading-2" style={{ marginBottom:16 }}>Newsletter Subscribers ({subscribers.length})</h1>
                    <div className="card admin-table-wrap">
                      <table className="admin-table">
                        <thead><tr>{['Email','Subscribed Date'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                        <tbody>
                          {subscribers.map((s,i) => (
                            <tr key={i}><td style={{ fontWeight:600 }}>{s.email}</td><td style={{ fontSize:12 }}>{new Date(s.subscribed_at || s.created_at).toLocaleDateString()}</td></tr>
                          ))}
                          {subscribers.length===0 && <tr><td colSpan={2} style={{ textAlign:'center', padding:30, color:'var(--color-text-muted)' }}>No subscribers</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ===== SETTINGS ===== */}
                {activeTab === 'settings' && (
                  <div>
                    <h1 className="heading-2" style={{ marginBottom:16 }}>Business Settings</h1>
                    <div className="card" style={{ padding:24 }}>
                      <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Business Information</h3>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                        {[['business_name','Business Name'],['phone','Phone'],['email','Email'],['whatsapp','WhatsApp'],['address','Address'],['currency','Currency'],['website_url','Website URL (e.g. https://yourdomain.com)']].map(([key,label]) => (
                          <div key={key} className="form-group"><label className="form-label">{label}</label><input className="form-input" value={businessSettings[key]||''} onChange={e=>setBusinessSettings({...businessSettings,[key]:e.target.value})}/></div>
                        ))}
                      </div>
                      <h3 style={{ fontSize:15, fontWeight:700, margin:'24px 0 16px' }}>Bank Details (shown to customers)</h3>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                        {[['bank_name','Bank Name'],['account_name','Account Name'],['sort_code','Sort Code'],['account_number','Account Number']].map(([key,label]) => (
                          <div key={key} className="form-group"><label className="form-label">{label}</label><input className="form-input" value={businessSettings[key]||''} onChange={e=>setBusinessSettings({...businessSettings,[key]:e.target.value})}/></div>
                        ))}
                      </div>

                      <h3 style={{ fontSize:15, fontWeight:700, margin:'24px 0 16px' }}>Brand Customization & Hero Media</h3>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:16, background:'rgba(255,255,255,0.02)', padding:16, borderRadius:12, border:'1px solid var(--color-border)' }}>
                        {/* Logo Upload */}
                        <div className="form-group">
                          <label className="form-label">Company Logo Image</label>
                          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                            <input
                              className="form-input"
                              value={businessSettings.logo_url || ''}
                              onChange={e => setBusinessSettings({ ...businessSettings, logo_url: e.target.value })}
                              placeholder="/logo.svg"
                              style={{ flex:1 }}
                            />
                            <label className="btn btn-outline btn-sm" style={{ cursor:'pointer', height:38, display:'flex', alignItems:'center', margin:0 }}>
                              Upload Logo
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display:'none' }}
                                onChange={e => handleFileUpload(e, url => setBusinessSettings({ ...businessSettings, logo_url: url }))}
                              />
                            </label>
                          </div>
                          {businessSettings.logo_url && (
                            <img src={businessSettings.logo_url} alt="Logo Preview" style={{ width:60, height:60, borderRadius:8, objectFit:'cover', border:'1px solid var(--color-border)', marginTop:8 }} />
                          )}
                        </div>

                        {/* Hero BG Type */}
                        <div className="form-group">
                          <label className="form-label">Homepage Hero Media Mode</label>
                          <select
                            className="form-input form-select"
                            value={businessSettings.hero_bg_type || 'images'}
                            onChange={e => setBusinessSettings({ ...businessSettings, hero_bg_type: e.target.value })}
                          >
                            <option value="images">🌅 Image Slideshow (Cycles configured images)</option>
                            <option value="video">🎥 Cinematic Video (Plays looping background video)</option>
                          </select>
                        </div>

                        {/* Hero Video Upload */}
                        <div className="form-group">
                          <label className="form-label">Hero Background Video URL (MP4, YouTube, or Vimeo)</label>
                          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                            <input
                              className="form-input"
                              value={businessSettings.hero_video || ''}
                              onChange={e => setBusinessSettings({ ...businessSettings, hero_video: e.target.value })}
                              placeholder="Paste YouTube, Vimeo, or direct .mp4 URL"
                              style={{ flex:1 }}
                            />
                            <label className="btn btn-outline btn-sm" style={{ cursor:'pointer', height:38, display:'flex', alignItems:'center', margin:0 }}>
                              Upload Video
                              <input
                                type="file"
                                accept="video/*"
                                style={{ display:'none' }}
                                onChange={e => handleFileUpload(e, url => setBusinessSettings({ ...businessSettings, hero_video: url }))}
                              />
                            </label>
                          </div>
                          {businessSettings.hero_video && (
                            <div style={{ fontSize:11, color:'var(--color-success)', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
                              ✅ Video active: {businessSettings.hero_video}
                            </div>
                          )}
                          <div style={{ fontSize:11, color:'var(--color-text-muted)', marginTop:4 }}>
                            💡 Supports YouTube (e.g. https://youtube.com/watch?v=xxx), Vimeo (e.g. https://vimeo.com/123), or direct video file URLs (.mp4, .webm)
                          </div>
                        </div>

                        {/* Hero Images Upload */}
                        <div className="form-group">
                          <label className="form-label">Hero Slideshow Images (comma-separated URLs)</label>
                          <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                            <textarea
                              className="form-input form-textarea"
                              value={businessSettings.hero_images || ''}
                              onChange={e => setBusinessSettings({ ...businessSettings, hero_images: e.target.value })}
                              placeholder="Image 1 URL, Image 2 URL, ..."
                              style={{ flex:1, minHeight:80 }}
                            />
                            <label className="btn btn-outline btn-sm" style={{ cursor:'pointer', height:38, display:'flex', alignItems:'center', margin:0, whiteSpace:'nowrap' }}>
                              Add Image
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display:'none' }}
                                onChange={e => handleFileUpload(e, url => {
                                  const current = businessSettings.hero_images || '';
                                  setBusinessSettings({
                                    ...businessSettings,
                                    hero_images: current ? `${current}, ${url}` : url
                                  });
                                })}
                              />
                            </label>
                          </div>
                          {/* Image Previews */}
                          {businessSettings.hero_images && (
                            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
                              {businessSettings.hero_images.split(',').map((imgUrl, i) => (
                                <div key={i} style={{ position:'relative' }}>
                                  <img
                                    src={imgUrl.trim()}
                                    alt="Preview"
                                    style={{ width:60, height:60, borderRadius:8, objectFit:'cover', border:'1px solid var(--color-border)' }}
                                    onError={e => { e.target.style.display = 'none'; }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const filtered = businessSettings.hero_images.split(',')
                                        .filter((_, idx) => idx !== i)
                                        .map(s => s.trim())
                                        .join(', ');
                                      setBusinessSettings({ ...businessSettings, hero_images: filtered });
                                    }}
                                    style={{ position:'absolute', top:-4, right:-4, background:'red', color:'white', borderRadius:'50%', width:16, height:16, display:'flex', alignItems:'center', justifycontent:'center', fontSize:9, cursor:'pointer', border:'none' }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <h3 style={{ fontSize:15, fontWeight:700, margin:'24px 0 16px' }}>Policy Pages Editor</h3>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:16, background:'rgba(255,255,255,0.02)', padding:16, borderRadius:12, border:'1px solid var(--color-border)' }}>
                        <div className="form-group">
                          <label className="form-label">Refund & Cancellation Policy</label>
                          <textarea
                            className="form-input form-textarea"
                            value={businessSettings.page_refund_policy || ''}
                            onChange={e => setBusinessSettings({ ...businessSettings, page_refund_policy: e.target.value })}
                            placeholder="Refund Policy content..."
                            style={{ minHeight: 180, fontFamily: 'monospace', fontSize: 13, background: 'var(--color-bg)' }}
                          />
                          <p style={{ fontSize:11, color:'var(--color-text-muted)', marginTop:4 }}>
                            Supports simple Markdown: Use <code>## Heading</code> for titles, <code>* item</code> for lists, and <code>**bold**</code> for strong text.
                          </p>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Terms of Service</label>
                          <textarea
                            className="form-input form-textarea"
                            value={businessSettings.page_terms_of_service || ''}
                            onChange={e => setBusinessSettings({ ...businessSettings, page_terms_of_service: e.target.value })}
                            placeholder="Terms of Service content..."
                            style={{ minHeight: 180, fontFamily: 'monospace', fontSize: 13, background: 'var(--color-bg)' }}
                          />
                          <p style={{ fontSize:11, color:'var(--color-text-muted)', marginTop:4 }}>
                            Supports simple Markdown: Use <code>## Heading</code> for titles, <code>* item</code> for lists, and <code>**bold**</code> for strong text.
                          </p>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Privacy Policy</label>
                          <textarea
                            className="form-input form-textarea"
                            value={businessSettings.page_privacy_policy || ''}
                            onChange={e => setBusinessSettings({ ...businessSettings, page_privacy_policy: e.target.value })}
                            placeholder="Privacy Policy content..."
                            style={{ minHeight: 180, fontFamily: 'monospace', fontSize: 13, background: 'var(--color-bg)' }}
                          />
                          <p style={{ fontSize:11, color:'var(--color-text-muted)', marginTop:4 }}>
                            Supports simple Markdown: Use <code>## Heading</code> for titles, <code>* item</code> for lists, and <code>**bold**</code> for strong text.
                          </p>
                        </div>
                      </div>

                      <h3 style={{ fontSize:15, fontWeight:700, margin:'24px 0 16px' }}>SMTP Email Configuration</h3>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, background:'rgba(255,255,255,0.02)', padding:16, borderRadius:12, border:'1px solid var(--color-border)' }}>
                        <div className="form-group"><label className="form-label">SMTP Server Host</label><input className="form-input" value={businessSettings.smtp_host||''} onChange={e=>setBusinessSettings({...businessSettings,smtp_host:e.target.value})} placeholder="e.g. smtp.gmail.com or smtp-relay.brevo.com"/></div>
                        <div className="form-group"><label className="form-label">SMTP Port</label><input className="form-input" value={businessSettings.smtp_port||''} onChange={e=>setBusinessSettings({...businessSettings,smtp_port:e.target.value})} placeholder="e.g. 587 or 465"/></div>
                        <div className="form-group"><label className="form-label">SMTP Login User</label><input className="form-input" value={businessSettings.smtp_user||''} onChange={e=>setBusinessSettings({...businessSettings,smtp_user:e.target.value})} placeholder="your-email@gmail.com"/></div>
                        <div className="form-group"><label className="form-label">SMTP Password / App Key</label><input className="form-input" type="password" value={businessSettings.smtp_pass||''} onChange={e=>setBusinessSettings({...businessSettings,smtp_pass:e.target.value})} placeholder="••••••••••••"/></div>
                        <div className="form-group"><label className="form-label">SMTP Sender Address ("From")</label><input className="form-input" value={businessSettings.smtp_from||''} onChange={e=>setBusinessSettings({...businessSettings,smtp_from:e.target.value})} placeholder="Borderless Trips &lt;info@borderlesstrips.com&gt;"/></div>
                        <div className="form-group"><label className="form-label">Admin Notification Recipient</label><input className="form-input" value={businessSettings.smtp_alert_recipient||''} onChange={e=>setBusinessSettings({...businessSettings,smtp_alert_recipient:e.target.value})} placeholder="admin@borderlesstrips.com"/></div>
                        <div style={{ gridColumn: 'span 2', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                          💡 <strong>Setting Up For Free:</strong> You can use a free <strong>Brevo (formerly Sendinblue)</strong> SMTP account (300 emails/day free) or a free <strong>Gmail App Password</strong>. If these fields are left empty, the server will operate in offline mock mode, printing emails directly to the server terminal log.
                        </div>
                      </div>

                      <button className="btn btn-primary" style={{ marginTop:24 }} onClick={handleSaveSettings}><Save size={16}/> Save Settings</button>
                    </div>
                  </div>
                )}

                {/* ===== AUDIT TRAIL ===== */}
                {activeTab === 'audit' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                      <h1 className="heading-2">System Audit Trail</h1>
                      <button className="btn btn-outline btn-sm" onClick={loadAllData} style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <RefreshCw size={14}/> Refresh Logs
                      </button>
                    </div>
                    <div className="card admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            {['Timestamp', 'User', 'Action', 'Details'].map(h => <th key={h}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map((log, i) => (
                            <tr key={i}>
                              <td style={{ fontSize:12, whiteSpace:'nowrap', color:'var(--color-text-muted)' }}>
                                {new Date(log.created_at).toLocaleString()}
                              </td>
                              <td>
                                <div style={{ fontWeight:600, fontSize:13 }}>{log.user_name || 'System / Guest'}</div>
                                <div className="text-muted" style={{ fontSize:11 }}>{log.user_email || '-'}</div>
                              </td>
                              <td>
                                <span className={`status-pill`} style={{ 
                                  background: log.action.includes('delete') ? 'rgba(239, 68, 68, 0.1)' : log.action.includes('create') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                  color: log.action.includes('delete') ? '#ef4444' : log.action.includes('create') ? '#10b981' : '#6366f1',
                                  padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: 'capitalize'
                                }}>
                                  {log.action.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td style={{ fontSize:12, fontFamily:'monospace', maxWidth: 400, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(JSON.parse(log.details_json || '{}'), null, 2)}
                              </td>
                            </tr>
                          ))}
                          {auditLogs.length === 0 && (
                            <tr>
                              <td colSpan={4} style={{ textAlign:'center', padding:40, color:'var(--color-text-muted)' }}>
                                No audit events logged yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ===== LEAD PIPELINE KANBAN BOARD ===== */}
                {activeTab === 'leads' && (
                  <div>
                    <h1 className="heading-2" style={{ marginBottom:24 }}>Lead Pipeline & Scoring</h1>
                    
                    <div style={{ display:'flex', gap:16, overflowX:'auto', paddingBottom:16 }}>
                      {['new', 'contacted', 'proposal', 'won', 'lost'].map(stage => {
                        const stageLeads = leads.filter(l => (l.lead_stage || 'new') === stage);
                        return (
                          <div key={stage} style={{ flex:'1 0 280px', background:'var(--color-bg-alt)', borderRadius:12, padding:16, border:'1px solid var(--color-border)' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                              <h3 style={{ textTransform:'uppercase', fontSize:12, fontWeight:700, color:'var(--color-text)' }}>
                                {stage}
                              </h3>
                              <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', background:'var(--color-border)', borderRadius:12 }}>
                                {stageLeads.length}
                              </span>
                            </div>
                            
                            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                              {stageLeads.map(lead => (
                                <div key={`${lead.type}-${lead.id}`} className="card" style={{ padding:14, cursor:'pointer' }}>
                                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                                    <span style={{ fontSize:10, fontWeight:700, background: lead.lead_score >= 80 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: lead.lead_score >= 80 ? '#10b981' : '#f59e0b', padding:'2px 6px', borderRadius:4 }}>
                                      Score: {lead.lead_score}
                                    </span>
                                    <span className="text-muted" style={{ fontSize:10 }}>
                                      {lead.service_type || 'Visa'}
                                    </span>
                                  </div>
                                  <h4 style={{ fontWeight:700, fontSize:13, color:'var(--color-text)' }}>{lead.name}</h4>
                                  <p className="text-muted" style={{ fontSize:11, marginTop:2 }}>{lead.email}</p>
                                  {lead.phone && <p className="text-muted" style={{ fontSize:11 }}>{lead.phone}</p>}
                                  
                                  <div style={{ display:'flex', gap:6, marginTop:12, borderTop:'1px solid var(--color-border)', paddingTop:8, justifyContent:'flex-end' }}>
                                    {stage !== 'contacted' && <button className="btn btn-outline btn-xs" style={{ fontSize:9 }} onClick={() => handleUpdateLeadStage(lead.id, lead.type, 'contacted')}>Contact</button>}
                                    {stage !== 'proposal' && <button className="btn btn-outline btn-xs" style={{ fontSize:9 }} onClick={() => handleUpdateLeadStage(lead.id, lead.type, 'proposal')}>Proposal</button>}
                                    {stage !== 'won' && <button className="btn btn-primary btn-xs" style={{ fontSize:9 }} onClick={() => handleUpdateLeadStage(lead.id, lead.type, 'won')}>Won</button>}
                                    {stage !== 'lost' && <button className="btn btn-ghost btn-xs" style={{ fontSize:9, color:'var(--color-danger)' }} onClick={() => handleUpdateLeadStage(lead.id, lead.type, 'lost')}>Lost</button>}
                                  </div>
                                </div>
                              ))}
                              {stageLeads.length === 0 && (
                                <div style={{ fontSize:11, color:'var(--color-text-muted)', textAlign:'center', padding:'20px 0', border:'2px dashed var(--color-border)', borderRadius:8 }}>
                                  No leads in this stage
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ===== CONSULTATIONS SCHEDULER ===== */}
                {activeTab === 'consultations' && (
                  <div>
                    <h1 className="heading-2" style={{ marginBottom:24 }}>Consultation Appointments</h1>
                    
                    <div className="card admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            {['Customer', 'Reason / Title', 'Scheduled Slot', 'Duration', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {consultations.map((c, i) => (
                            <tr key={i}>
                              <td>
                                <div style={{ fontWeight:600 }}>{c.customer_name || 'Guest User'}</div>
                                <div className="text-muted" style={{ fontSize:11 }}>{c.customer_email || '-'}</div>
                              </td>
                              <td style={{ fontWeight:600 }}>{c.title}</td>
                              <td>{new Date(c.scheduled_at).toLocaleString()}</td>
                              <td>{c.duration} mins</td>
                              <td>
                                <span className="status-pill" style={{
                                  background: c.status === 'scheduled' ? 'rgba(245,158,11,0.1)' : (c.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'),
                                  color: c.status === 'scheduled' ? '#f59e0b' : (c.status === 'completed' ? '#10b981' : '#ef4444'),
                                  padding:'3px 8px', borderRadius:10, fontSize:11, fontWeight:700
                                }}>
                                  {c.status}
                                </span>
                              </td>
                              <td>
                                <div style={{ display:'flex', gap:6 }}>
                                  {c.status === 'scheduled' && (
                                    <>
                                      <button className="btn btn-primary btn-xs" onClick={() => handleUpdateConsultation(c.id, 'completed')}>Complete</button>
                                      <button className="btn btn-outline btn-xs" style={{ color:'var(--color-danger)' }} onClick={() => handleUpdateConsultation(c.id, 'cancelled')}>Cancel</button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {consultations.length === 0 && (
                            <tr>
                              <td colSpan={6} style={{ textAlign:'center', padding:40, color:'var(--color-text-muted)' }}>
                                No consultations booked.
                              </td>
                            </tr>
                          )}
                        </tbody>
                        </table>
                      </div>
                    </div>
                )}

                {/* ===== MARKETING CAMPAIGNS ===== */}
                {activeTab === 'campaigns' && (() => {
                  const campaignPresets = {
                    announcement: {
                      subject: "📢 Important Updates from Borderless Trips!",
                      body: `<h3>Hello Traveler,</h3>\n<p>We are thrilled to announce that we have upgraded our travel platform to provide an even smoother journey for your Schengen and global applications.</p>\n<div style="background-color:#f1f5f9; border-left:4px solid #d4a574; padding:16px; margin:20px 0; border-radius:4px;">\n  <strong>💡 What's New?</strong>\n  <p style="margin:6px 0 0 0; color:#475569; font-size:13px;">✓ Real-time Application Status Timeline Tracker<br/>✓ Secure Digital Document E-Signing Modal<br/>✓ Client Loyalty Rewards & Referral Points tracking</p>\n</div>\n<p>Access your updated travel profile and view new premium packages by clicking the button below.</p>\n<div style="text-align:center; margin:24px 0;">\n  <a href="https://palegreen-bison-521258.hostingersite.com/login" style="display:inline-block; background-color:#0b1d35; color:#ffffff; padding:12px 24px; border-radius:30px; font-weight:600; text-decoration:none; font-size:14px; box-shadow:0 4px 10px rgba(11,29,53,0.25);">Go to Portal</a>\n</div>`
                    },
                    promo: {
                      subject: "✈️ Exclusive Schengen Promo: 10% Off Visa Support Services!",
                      body: `<div style="text-align:center;">\n  <h3 style="color:#d4a574; margin-top:0;">Celebrate Travel with Our Exclusive Offer!</h3>\n  <p>Planning your next holiday? For the next 7 days, get 10% off our premium Schengen visa preparation and appointment support package.</p>\n  <div style="background:linear-gradient(135deg, #d4a574 0%, #b28354 100%); padding:20px; border-radius:12px; display:inline-block; margin:16px 0; color:#ffffff;">\n    <span style="font-size:11px; text-transform:uppercase; letter-spacing:1px; display:block;">Use Promo Code</span>\n    <strong style="font-size:24px; font-family:monospace; letter-spacing:2px; display:block; margin:4px 0;">EXPLORE10</strong>\n    <span style="font-size:10px; opacity:0.9;">10% Off All Schengen Package Bookings • Valid for 7 Days</span>\n  </div>\n  <p>Apply this coupon code in your client portal dashboard when creating a new request, or contact your assigned agent.</p>\n</div>`
                    },
                    deal: {
                      subject: "🔥 Hot Deal: 12-Day Schengen Express Tour & Flight Reservation!",
                      body: `<h3>Ready for an Unforgettable Adventure?</h3>\n<p>We are highlighting our top-rated European package of the month with guaranteed visa slot queue booking included:</p>\n<div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin:20px 0;">\n  <h4 style="color:#0b1d35; margin:0 0 6px 0;">Schengen Express Tour (Paris • Rome • Berlin)</h4>\n  <p style="margin:0 0 10px 0; font-size:12px; color:#64748b;">Includes 4-Star Accommodations • Daily Breakfasts • Visa Consultation & Filings</p>\n  <ul style="margin:0; padding-left:20px; font-size:13px; line-height:1.5; color:#334155;">\n    <li>Complete flight itinerary reservation documents</li>\n    <li>Official VFS/TLS booking slots coordination</li>\n    <li>Comprehensive travel insurance voucher cards</li>\n  </ul>\n</div>\n<p>Claim your slot now before bookings close for this quarter.</p>\n<div style="text-align:center; margin:24px 0;">\n  <a href="https://palegreen-bison-521258.hostingersite.com/holiday-packages" style="display:inline-block; background-color:#d4a574; color:#ffffff; padding:12px 24px; border-radius:30px; font-weight:600; text-decoration:none; font-size:14px; box-shadow:0 4px 10px rgba(212,165,116,0.35);">View Package Details</a>\n</div>`
                    }
                  };

                  const emailTemplateWrapper = (subjectText, bodyContent) => `
                    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background-color:#f8fafc; color:#1e293b; padding:16px; border-radius:8px; max-width:600px; margin:0 auto; border:1px solid #e2e8f0;">
                      <div style="background:linear-gradient(135deg, #0b1d35 0%, #1e3a5f 100%); padding:20px; text-align:center; border-bottom:3px solid #d4a574; border-radius:8px 8px 0 0;">
                        <h1 style="font-size:20px; font-weight:800; color:#ffffff; margin:0; letter-spacing:0.5px;">BORDERLESS<span style="color:#d4a574">TRIPS</span></h1>
                      </div>
                      <div style="padding:20px; background-color:#ffffff; line-height:1.6; font-size:14px; color:#334155; min-height:150px;">
                        ${bodyContent ? bodyContent.replace(/\n/g, '<br/>') : '<p style="color:#94a3b8; font-style:italic;">Message body content will appear here...</p>'}
                      </div>
                      <div style="background-color:#f1f5f9; padding:16px; text-align:center; border-radius:0 0 8px 8px; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b;">
                        <p style="margin:0 0 6px 0;">© ${new Date().getFullYear()} Borderless Trips. All rights reserved.</p>
                        <div style="margin-top:4px;">
                          <a href="#" style="color:#d4a574; text-decoration:none; margin:0 6px;">Terms</a>
                          <a href="#" style="color:#d4a574; text-decoration:none; margin:0 6px;">Privacy</a>
                          <a href="#" style="color:#d4a574; text-decoration:none; margin:0 6px;">Unsubscribe</a>
                        </div>
                      </div>
                    </div>
                  `;

                  // Simple local filter for campaigns list
                  const filteredCampaigns = campaigns.filter(c => 
                    c.subject.toLowerCase().includes(searchCampQuery.toLowerCase()) || 
                    c.body.toLowerCase().includes(searchCampQuery.toLowerCase())
                  );

                  return (
                    <div>
                      {/* STATS STRIP */}
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:24 }}>
                        <div className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:14 }}>
                          <div style={{ background:'rgba(212,165,116,0.1)', color:'var(--color-secondary)', padding:12, borderRadius:10 }}><Users size={22}/></div>
                          <div>
                            <span style={{ fontSize:11, color:'var(--color-text-muted)', display:'block', fontWeight:600 }}>SUBSCRIBERS</span>
                            <strong style={{ fontSize:18, color:'var(--color-text)' }}>{subscribers.length}</strong>
                          </div>
                        </div>
                        <div className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:14 }}>
                          <div style={{ background:'rgba(14,165,233,0.1)', color:'#0ea5e9', padding:12, borderRadius:10 }}><Users size={22}/></div>
                          <div>
                            <span style={{ fontSize:11, color:'var(--color-text-muted)', display:'block', fontWeight:600 }}>PORTAL CUSTOMERS</span>
                            <strong style={{ fontSize:18, color:'var(--color-text)' }}>{customers.length}</strong>
                          </div>
                        </div>
                        <div className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:14 }}>
                          <div style={{ background:'rgba(245,158,11,0.1)', color:'#f59e0b', padding:12, borderRadius:10 }}><Clock size={22}/></div>
                          <div>
                            <span style={{ fontSize:11, color:'var(--color-text-muted)', display:'block', fontWeight:600 }}>ACTIVE DRAFTS</span>
                            <strong style={{ fontSize:18, color:'var(--color-text)' }}>{campaigns.filter(c=>c.status==='draft').length}</strong>
                          </div>
                        </div>
                        <div className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:14 }}>
                          <div style={{ background:'rgba(16,185,129,0.1)', color:'#10b981', padding:12, borderRadius:10 }}><CheckCircle2 size={22}/></div>
                          <div>
                            <span style={{ fontSize:11, color:'var(--color-text-muted)', display:'block', fontWeight:600 }}>CAMPAIGNS SENT</span>
                            <strong style={{ fontSize:18, color:'var(--color-text)' }}>{campaigns.filter(c=>c.status==='sent').length}</strong>
                          </div>
                        </div>
                      </div>

                      <h1 className="heading-2" style={{ marginBottom:20 }}>Email Marketing Campaigns</h1>

                      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1.8fr', gap:24 }}>
                        {/* COMPOSER CARD */}
                        <div className="card" style={{ padding:24, height:'fit-content' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                            <h3 style={{ fontSize:15, fontWeight:700 }}>Compose Campaign</h3>
                            <div style={{ display:'flex', gap:6 }}>
                              <button className={`btn btn-xs ${campaignEditorTab === 'write' ? 'btn-primary' : 'btn-outline'}`} onClick={()=>setCampaignEditorTab('write')}>
                                Edit Content
                              </button>
                              <button className={`btn btn-xs ${campaignEditorTab === 'preview' ? 'btn-primary' : 'btn-outline'}`} onClick={()=>setCampaignEditorTab('preview')}>
                                Visual Preview
                              </button>
                            </div>
                          </div>

                          {campaignEditorTab === 'write' ? (
                            <form onSubmit={handleCreateCampaign} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                              {/* PRESETS LOADER */}
                              <div>
                                <label className="form-label" style={{ marginBottom:6, display:'block' }}>Load Pre-designed Template</label>
                                <div style={{ display:'flex', gap:8 }}>
                                  <button type="button" className="btn btn-outline btn-xs" style={{ flex:1 }}
                                    onClick={() => setNewCampaign({ ...newCampaign, subject: campaignPresets.announcement.subject, body: campaignPresets.announcement.body })}>
                                    📢 Announcement
                                  </button>
                                  <button type="button" className="btn btn-outline btn-xs" style={{ flex:1 }}
                                    onClick={() => setNewCampaign({ ...newCampaign, subject: campaignPresets.promo.subject, body: campaignPresets.promo.body })}>
                                    🎟️ Discount Promo
                                  </button>
                                  <button type="button" className="btn btn-outline btn-xs" style={{ flex:1 }}
                                    onClick={() => setNewCampaign({ ...newCampaign, subject: campaignPresets.deal.subject, body: campaignPresets.deal.body })}>
                                    🔥 Travel Deal
                                  </button>
                                </div>
                              </div>

                              <div className="form-group">
                                <label className="form-label">Subject Line</label>
                                <input className="form-input" placeholder="e.g. Exclusive Schengen Holiday Packages 2026!" value={newCampaign.subject} onChange={e => setNewCampaign({ ...newCampaign, subject: e.target.value })} required/>
                              </div>

                              <div className="form-group">
                                <label className="form-label">Target Audience</label>
                                <select className="form-input" value={newCampaign.target_role} onChange={e => setNewCampaign({ ...newCampaign, target_role: e.target.value })}>
                                  <option value="subscribers">Newsletter Subscribers Only ({subscribers.length} recipients)</option>
                                  <option value="customers">Registered Portal Customers Only ({customers.length} recipients)</option>
                                  <option value="all">Everyone ({subscribers.length + customers.length} unique recipients)</option>
                                </select>
                              </div>

                              <div className="form-group">
                                <label className="form-label">Campaign Message Body (HTML supported)</label>
                                <textarea className="form-input" rows="10" placeholder="Write HTML or plain text campaign details..." value={newCampaign.body} onChange={e => setNewCampaign({ ...newCampaign, body: e.target.value })} required style={{ fontFamily:'monospace', fontSize:13 }}/>
                              </div>

                              <button type="submit" className="btn btn-primary" disabled={submittingCampaign}>
                                {submittingCampaign ? 'Saving...' : 'Save Draft Campaign'}
                              </button>
                            </form>
                          ) : (
                            <div style={{ background:'var(--color-bg-alt)', padding:12, borderRadius:8, border:'1px solid var(--color-border)' }}>
                              <div style={{ marginBottom:12, paddingBottom:8, borderBottom:'1px solid var(--color-border)', fontSize:12 }}>
                                <strong style={{ color:'var(--color-text-muted)' }}>Subject:</strong> {newCampaign.subject || '(No Subject Line)'}
                              </div>
                              <div dangerouslySetInnerHTML={{ __html: emailTemplateWrapper(newCampaign.subject, newCampaign.body) }} style={{ overflowY:'auto', maxHeight:450 }} />
                            </div>
                          )}
                        </div>

                        {/* CAMPAIGN LISTS */}
                        <div>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                            <h3 className="heading-4">Campaign Lists</h3>
                            <div style={{ position:'relative', width:200 }}>
                              <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }}/>
                              <input className="form-input" placeholder="Search campaigns..." value={searchCampQuery} onChange={e=>setSearchCampQuery(e.target.value)} style={{ paddingLeft:30, height:30, fontSize:12 }}/>
                            </div>
                          </div>

                          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                            {filteredCampaigns.map((camp, idx) => (
                              <div key={idx} className="card" style={{ padding:20, position:'relative' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                                  <div style={{ paddingRight:40 }}>
                                    <h4 style={{ fontWeight:700, fontSize:15, color:'var(--color-text)' }}>{camp.subject}</h4>
                                    <p className="text-muted" style={{ fontSize:11, marginTop:4, display:'flex', gap:10 }}>
                                      <span>Audience: <strong style={{ textTransform:'capitalize', color:'var(--color-secondary)' }}>{camp.target_role}</strong></span>
                                      <span>•</span>
                                      <span>Created: {new Date(camp.created_at).toLocaleDateString()}</span>
                                    </p>
                                  </div>
                                  <span className="status-pill" style={{
                                    background: camp.status === 'draft' ? 'var(--color-border)' : 'rgba(16,185,129,0.1)',
                                    color: camp.status === 'draft' ? 'var(--color-text-muted)' : '#10b981',
                                    padding:'3px 8px', borderRadius:10, fontSize:10, fontWeight:700, textTransform:'uppercase'
                                  }}>
                                    {camp.status}
                                  </span>
                                </div>

                                <p className="text-muted" style={{ fontSize:12, marginTop:10, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', background:'rgba(255,255,255,0.01)', padding:8, borderRadius:6, border:'1px solid var(--color-border)' }}>
                                  {camp.body.replace(/<[^>]*>/g, '')}
                                </p>

                                <div style={{ display:'flex', gap:10, marginTop:14, justifyContent:'flex-end', alignItems:'center', borderTop:'1px solid var(--color-border)', paddingTop:12 }}>
                                  <button className="btn btn-outline btn-xs" style={{ borderColor:'rgba(239,68,68,0.2)', color:'var(--color-danger)' }} onClick={() => handleDeleteCampaign(camp.id)}>
                                    <Trash2 size={12}/> Delete
                                  </button>
                                  {camp.status === 'draft' && (
                                    <button className="btn btn-primary btn-xs" onClick={() => handleSendCampaign(camp.id)} style={{ display:'flex', alignItems:'center', gap:4 }}>
                                      <Send size={12}/> Send Email Blast
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}

                            {filteredCampaigns.length === 0 && (
                              <div className="card" style={{ padding:40, textAlign:'center', color:'var(--color-text-muted)' }}>
                                No campaigns found matching "{searchCampQuery}".
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ===== FUTURE LEADS TRACKER ===== */}
                {activeTab === 'future-leads' && (() => {
                  const handleSave = async (e) => {
                    e.preventDefault();
                    setSavingFutureLead(true);
                    try {
                      await api.post('/business-suite/future-leads', fForm);
                      showToast('Future travel plan created successfully!');
                      setFForm({ name: '', email: '', phone: '', destination: '', intended_travel_date: '', notes: '' });
                      setCreatingFutureLead(false);
                      await loadAllData();
                    } catch (err) {
                      showToast(err.message, 'error');
                    } finally {
                      setSavingFutureLead(false);
                    }
                  };

                  return (
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                        <h1 className="heading-2" style={{ margin:0 }}>Future Travel Leads</h1>
                        <button className="btn btn-primary" onClick={() => setCreatingFutureLead(true)}>Add Future Travel Plan</button>
                      </div>

                      {creatingFutureLead && (
                        <div className="card" style={{ padding:24, marginBottom:24 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                            <h3 style={{ fontSize:15, fontWeight:700, margin:0 }}>New Future Travel Plan</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setCreatingFutureLead(false)}>Close</button>
                          </div>
                          <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
                              <div className="form-group">
                                <label className="form-label">Client Name *</label>
                                <input className="form-input" value={fForm.name} onChange={e => setFForm({ ...fForm, name: e.target.value })} required/>
                              </div>
                              <div className="form-group">
                                <label className="form-label">Client Email *</label>
                                <input type="email" className="form-input" value={fForm.email} onChange={e => setFForm({ ...fForm, email: e.target.value })} required/>
                              </div>
                              <div className="form-group">
                                <label className="form-label">Client Phone</label>
                                <input className="form-input" value={fForm.phone} onChange={e => setFForm({ ...fForm, phone: e.target.value })}/>
                              </div>
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                              <div className="form-group">
                                <label className="form-label">Destination Country / City</label>
                                <input className="form-input" placeholder="e.g. France, Tokyo" value={fForm.destination} onChange={e => setFForm({ ...fForm, destination: e.target.value })} required/>
                              </div>
                              <div className="form-group">
                                <label className="form-label">Intended Travel Date</label>
                                <input type="date" className="form-input" value={fForm.intended_travel_date} onChange={e => setFForm({ ...fForm, intended_travel_date: e.target.value })} required/>
                              </div>
                            </div>
                            <div className="form-group">
                              <label className="form-label">Specific requests or notes for this future trip</label>
                              <textarea className="form-input" rows="2" placeholder="Describe the future trip timeline and coordination notes..." value={fForm.notes} onChange={e => setFForm({ ...fForm, notes: e.target.value })}/>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ alignSelf:'flex-start' }} disabled={savingFutureLead}>
                              {savingFutureLead ? 'Creating...' : 'Create Future Plan'}
                            </button>
                          </form>
                        </div>
                      )}
                      
                      <div className="card admin-table-wrap">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              {['Lead Details', 'Intended Travel', 'Follow Up', 'Notes', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {futureLeads.map((lead, i) => (
                              <tr key={i}>
                                <td>
                                  <div style={{ fontWeight:600 }}>{lead.name}</div>
                                  <div className="text-muted" style={{ fontSize:11 }}>{lead.email} • {lead.phone || '-'}</div>
                                </td>
                                <td style={{ fontWeight:600 }}>{lead.destination || 'Anywhere'} ({lead.intended_travel_date})</td>
                                <td style={{ color:'var(--color-secondary)', fontWeight:700 }}>{lead.follow_up_date}</td>
                                <td style={{ fontSize:12, maxWidth:200, wordBreak:'break-word' }}>{lead.notes}</td>
                                <td>
                                  <span className="status-pill" style={{
                                    background: lead.status === 'pending' ? 'rgba(245,158,11,0.1)' : (lead.status === 'converted' ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)'),
                                    color: lead.status === 'pending' ? '#f59e0b' : (lead.status === 'converted' ? '#10b981' : '#94a3b8'),
                                    padding:'3px 8px', borderRadius:10, fontSize:11, fontWeight:700
                                  }}>
                                    {lead.status}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display:'flex', gap:6 }}>
                                    {lead.status === 'pending' && (
                                      <>
                                        <button className="btn btn-primary btn-xs" onClick={() => handleUpdateFutureLead(lead.id, 'converted')}>Convert</button>
                                        <button className="btn btn-outline btn-xs" onClick={() => handleUpdateFutureLead(lead.id, 'contacted')}>Contacted</button>
                                        <button className="btn btn-ghost btn-xs" style={{ color:'var(--color-danger)' }} onClick={() => handleUpdateFutureLead(lead.id, 'ignored')}>Ignore</button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {futureLeads.length === 0 && (
                              <tr>
                                <td colSpan={6} style={{ textAlign:'center', padding:40, color:'var(--color-text-muted)' }}>
                                  No future leads scheduled.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}

              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Package Modal */}
      <Modal open={pkgModal} onClose={() => setPkgModal(false)} title={editingPkg ? 'Edit Package' : 'Add New Package'} wide>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div className="form-group" style={{ gridColumn:'span 2' }}><label className="form-label">Title *</label><input className="form-input" value={pkgForm.title} onChange={e=>setPkgForm({...pkgForm,title:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Destination *</label><input className="form-input" value={pkgForm.destination} onChange={e=>setPkgForm({...pkgForm,destination:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Duration</label><input className="form-input" placeholder="e.g. 5 Days / 4 Nights" value={pkgForm.duration} onChange={e=>setPkgForm({...pkgForm,duration:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Price (£) *</label><input className="form-input" type="number" value={pkgForm.price} onChange={e=>setPkgForm({...pkgForm,price:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Original Price (£)</label><input className="form-input" type="number" value={pkgForm.original_price} onChange={e=>setPkgForm({...pkgForm,original_price:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Type</label>
            <select className="form-input form-select" value={pkgForm.type} onChange={e=>setPkgForm({...pkgForm,type:e.target.value})}>
              {['adventure','romance','luxury','culture','family','honeymoon','budget'].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Featured</label>
            <select className="form-input form-select" value={pkgForm.featured} onChange={e=>setPkgForm({...pkgForm,featured:parseInt(e.target.value)})}>
              <option value={0}>No</option><option value={1}>Yes</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn:'span 2' }}><label className="form-label">Description</label><textarea className="form-input form-textarea" value={pkgForm.description} onChange={e=>setPkgForm({...pkgForm,description:e.target.value})} rows={3}/></div>
          <div className="form-group" style={{ gridColumn:'span 2' }}>
            <label className="form-label">Images (comma separated URLs or Upload)</label>
            <div style={{ display:'flex', gap:8 }}>
              <input className="form-input" value={pkgForm.images} onChange={e=>setPkgForm({...pkgForm,images:e.target.value})} style={{ flex:1 }}/>
              <label className="btn btn-outline" style={{ cursor:'pointer', whiteSpace:'nowrap' }}>
                <Image size={14}/> Upload
                <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleFileUpload(e, url => setPkgForm(prev => ({ ...prev, images: prev.images ? prev.images + ', ' + url : url })))} />
              </label>
            </div>
          </div>
          {/* Inclusions */}
          <div className="form-group" style={{ gridColumn:'span 2' }}>
            <label className="form-label" style={{ fontWeight:700 }}>Inclusions (What's Included)</label>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
              {Array.isArray(pkgForm.includes) && pkgForm.includes.map((inc, index) => (
                <div key={index} style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input
                    className="form-input"
                    value={inc || ''}
                    onChange={e => {
                      const next = [...pkgForm.includes];
                      next[index] = e.target.value;
                      setPkgForm({ ...pkgForm, includes: next });
                    }}
                    placeholder="e.g. 4 Nights boutique hotel accommodation"
                  />
                  <button
                    type="button"
                    className="admin-action-btn danger"
                    onClick={() => {
                      setPkgForm({ ...pkgForm, includes: pkgForm.includes.filter((_, idx) => idx !== index) });
                    }}
                    style={{ height:38, display:'flex', alignItems:'center', padding:'0 12px' }}
                  >
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setPkgForm({ ...pkgForm, includes: [...(pkgForm.includes || []), ''] });
              }}
            >
              <Plus size={14}/> Add Inclusion Item
            </button>
          </div>

          {/* Exclusions */}
          <div className="form-group" style={{ gridColumn:'span 2' }}>
            <label className="form-label" style={{ fontWeight:700 }}>Exclusions (What's Not Included)</label>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:10 }}>
              {Array.isArray(pkgForm.excludes) && pkgForm.excludes.map((exc, index) => (
                <div key={index} style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input
                    className="form-input"
                    value={exc || ''}
                    onChange={e => {
                      const next = [...pkgForm.excludes];
                      next[index] = e.target.value;
                      setPkgForm({ ...pkgForm, excludes: next });
                    }}
                    placeholder="e.g. International flights & Visa fees"
                  />
                  <button
                    type="button"
                    className="admin-action-btn danger"
                    onClick={() => {
                      setPkgForm({ ...pkgForm, excludes: pkgForm.excludes.filter((_, idx) => idx !== index) });
                    }}
                    style={{ height:38, display:'flex', alignItems:'center', padding:'0 12px' }}
                  >
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                setPkgForm({ ...pkgForm, excludes: [...(pkgForm.excludes || []), ''] });
              }}
            >
              <Plus size={14}/> Add Exclusion Item
            </button>
          </div>

          {/* Itinerary */}
          <div className="form-group" style={{ gridColumn:'span 2', marginTop: 10 }}>
            <label className="form-label" style={{ fontWeight:700, fontSize:14, borderBottom:'1px solid var(--color-border)', paddingBottom:6, display:'block' }}>🗺️ Daily Itinerary Builder</label>
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:10, marginBottom:14 }}>
              {Array.isArray(pkgForm.itinerary) && pkgForm.itinerary.map((dayItem, index) => (
                <div key={index} style={{ background:'var(--color-bg)', padding:16, borderRadius:8, border:'1px solid var(--color-border)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <span style={{ fontWeight:700, fontSize:13, color:'var(--color-secondary)' }}>Day {index + 1}</span>
                    <button
                      type="button"
                      className="admin-action-btn danger"
                      onClick={() => {
                        const updatedItinerary = pkgForm.itinerary
                          .filter((_, idx) => idx !== index)
                          .map((item, idx) => ({ ...item, day: idx + 1 })); // Recalculate day numbers
                        setPkgForm({ ...pkgForm, itinerary: updatedItinerary });
                      }}
                    >
                      <Trash2 size={12}/> Remove Day
                    </button>
                  </div>
                  <div style={{ display:'grid', gap:10 }}>
                    <div className="form-group" style={{ margin:0 }}>
                      <label className="form-label" style={{ fontSize:11 }}>Day Title</label>
                      <input
                        className="form-input"
                        value={dayItem.title || ''}
                        onChange={e => {
                          const next = [...pkgForm.itinerary];
                          next[index] = { ...next[index], title: e.target.value };
                          setPkgForm({ ...pkgForm, itinerary: next });
                        }}
                        placeholder="e.g. Arrival in Paris & Seine Dinner Cruise"
                      />
                    </div>
                    <div className="form-group" style={{ margin:0 }}>
                      <label className="form-label" style={{ fontSize:11 }}>Day Details</label>
                      <textarea
                        className="form-input form-textarea"
                        value={dayItem.details || ''}
                        onChange={e => {
                          const next = [...pkgForm.itinerary];
                          next[index] = { ...next[index], details: e.target.value };
                          setPkgForm({ ...pkgForm, itinerary: next });
                        }}
                        placeholder="Describe activities, accommodation, transfers for this day..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!pkgForm.itinerary || pkgForm.itinerary.length === 0) && (
                <div style={{ textAlign:'center', padding:'20px 0', border:'2px dashed var(--color-border)', borderRadius:8, color:'var(--color-text-muted)', fontSize:13 }}>
                  No days added yet. Click below to add Day 1!
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                const nextDay = (pkgForm.itinerary || []).length + 1;
                setPkgForm({
                  ...pkgForm,
                  itinerary: [...(pkgForm.itinerary || []), { day: nextDay, title: '', details: '' }]
                });
              }}
            >
              <Plus size={14}/> Add Day to Itinerary
            </button>
          </div>
        </div>
        <div style={{ marginTop:20, display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setPkgModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSavePackage}><Save size={16}/> {editingPkg ? 'Update' : 'Create'}</button>
        </div>
      </Modal>

      {/* Blog Modal */}
      <Modal open={blogModal} onClose={() => setBlogModal(false)} title={editingBlog ? 'Edit Blog Post' : 'New Blog Post'} wide>
        <div style={{ display:'grid', gap:14 }}>
          <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={blogForm.title} onChange={e=>setBlogForm({...blogForm,title:e.target.value})}/></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div className="form-group"><label className="form-label">Category</label>
              <select className="form-input form-select" value={blogForm.category} onChange={e=>setBlogForm({...blogForm,category:e.target.value})}>
                {['Travel Guide','Visa Guide','Travel Inspiration','Travel Tips','News','Destinations'].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-input form-select" value={blogForm.published} onChange={e=>setBlogForm({...blogForm,published:parseInt(e.target.value)})}>
                <option value={1}>Published</option><option value={0}>Draft</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Excerpt</label><textarea className="form-input form-textarea" value={blogForm.excerpt} onChange={e=>setBlogForm({...blogForm,excerpt:e.target.value})} rows={2}/></div>
          <div className="form-group"><label className="form-label">Content (HTML)</label><textarea className="form-input form-textarea" value={blogForm.content} onChange={e=>setBlogForm({...blogForm,content:e.target.value})} rows={10} style={{ fontFamily:'monospace', fontSize:12 }}/></div>
          {blogForm.content && <div className="form-group"><label className="form-label">Preview</label><div style={{ border:'1px solid var(--color-border)', borderRadius:8, padding:16, maxHeight:200, overflowY:'auto', fontSize:14, lineHeight:1.7 }} dangerouslySetInnerHTML={{ __html: blogForm.content }}/></div>}
          <div className="form-group">
            <label className="form-label">Cover Image</label>
            <div style={{ display:'flex', gap:8 }}>
              <input className="form-input" placeholder="Image URL" value={blogForm.cover_image} onChange={e=>setBlogForm({...blogForm,cover_image:e.target.value})} style={{ flex:1 }}/>
              <label className="btn btn-outline" style={{ cursor:'pointer', whiteSpace:'nowrap' }}>
                <Image size={14}/> Upload
                <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => handleFileUpload(e, url => setBlogForm({ ...blogForm, cover_image: url }))} />
              </label>
            </div>
          </div>
          {blogForm.cover_image && <img src={blogForm.cover_image} alt="Cover preview" style={{ maxHeight:120, borderRadius:8, objectFit:'cover' }} onError={e=>{e.target.style.display='none'}}/>}
        </div>
        <div style={{ marginTop:20, display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setBlogModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveBlog}><Save size={16}/> {editingBlog ? 'Update' : 'Publish'}</button>
        </div>
      </Modal>

      {/* Country Modal */}
      <Modal open={countryModal} onClose={() => setCountryModal(false)} title="Add Country">
        <div style={{ display:'grid', gap:14 }}>
          <div className="form-group"><label className="form-label">Country Name *</label><input className="form-input" value={countryForm.name} onChange={e=>setCountryForm({...countryForm,name:e.target.value})}/></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div className="form-group"><label className="form-label">Code (e.g. FR)</label><input className="form-input" value={countryForm.code} onChange={e=>setCountryForm({...countryForm,code:e.target.value.toUpperCase()})} maxLength={2}/></div>
            <div className="form-group"><label className="form-label">Region</label>
              <select className="form-input form-select" value={countryForm.region} onChange={e=>setCountryForm({...countryForm,region:e.target.value})}>
                {['schengen','europe','asia','middle_east','africa','americas','oceania'].map(r=><option key={r} value={r}>{r.replace('_',' ')}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ marginTop:20, display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setCountryModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveCountry}><Save size={16}/> Add Country</button>
        </div>
      </Modal>

      {/* Staff Modal */}
      <Modal open={staffModal} onClose={() => setStaffModal(false)} title={editingStaff ? "Edit Staff Member" : "Add Staff Member"}>
        <div style={{ display:'grid', gap:14 }}>
          <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={staffForm.name} onChange={e=>setStaffForm({...staffForm,name:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" value={staffForm.email} onChange={e=>setStaffForm({...staffForm,email:e.target.value})}/></div>
          <div className="form-group">
            <label className="form-label">{editingStaff ? "Password (Leave blank to keep current)" : "Password *"}</label>
            <input className="form-input" type="password" value={staffForm.password} onChange={e=>setStaffForm({...staffForm,password:e.target.value})}/>
          </div>
          <div className="form-group"><label className="form-label">Role</label>
            <select className="form-input form-select" value={staffForm.sub_role} onChange={e=>setStaffForm({...staffForm,sub_role:e.target.value})}>
              <option value="manager">Manager — Full access</option>
              <option value="agent">Agent — Process requests</option>
              <option value="viewer">Viewer — Read only</option>
            </select>
          </div>
          {editingStaff && (
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-input form-select" value={staffForm.status} onChange={e=>setStaffForm({...staffForm,status:e.target.value})}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          )}
        </div>
        <div style={{ marginTop:20, display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setStaffModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveStaff}>
            {editingStaff ? <Save size={16}/> : <UserPlus size={16}/>} {editingStaff ? "Save Changes" : "Create Staff"}
          </button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={detailModal?.type==='sr'?`Request ${detailModal?.data?.ref}`:detailModal?.type==='booking'?`Booking ${detailModal?.data?.booking_ref}`:detailModal?.type==='inquiry'?`Inquiry #${detailModal?.data?.id}`:`Visa ${detailModal?.data?.app_ref}`} wide>
        {detailModal && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {Object.entries(detailModal.data).filter(([k])=>!['id','user_id','assigned_to','details_json','assessment_json','documents_json','password_hash'].includes(k)).map(([key, val]) => (
                <div key={key} style={{ fontSize:13 }}>
                  <div className="text-muted" style={{ fontSize:11, textTransform:'uppercase', marginBottom:2 }}>{key.replace(/_/g,' ')}</div>
                  <div style={{ fontWeight:600 }}>{formatValue(key, val)}</div>
                </div>
              ))}
            </div>
            {(() => {
              let detailsObj = {};
              try {
                detailsObj = typeof detailModal.data.details_json === 'string' ? JSON.parse(detailModal.data.details_json) : (detailModal.data.details_json || {});
              } catch(e) {}
              if (!detailsObj || Object.keys(detailsObj).length === 0) return null;
              return (
                <div style={{ marginTop:20 }}>
                  <h4 style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>Request Details</h4>
                  <div style={{ background:'var(--color-bg)', padding:14, borderRadius:8, fontSize:13 }}>
                    {Object.entries(detailsObj).map(([k,v]) => (
                      <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid var(--color-border)' }}>
                        <span className="text-muted" style={{ textTransform:'capitalize' }}>{k.replace(/_/g,' ')}</span>
                        <span style={{ fontWeight:600 }}>{formatValue(k, v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            {detailModal.type === 'visa' && (
              <div style={{ marginTop:20, borderTop:'1px solid var(--color-border)', paddingTop:20 }}>
                <h4 style={{ fontSize:14, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}><ClipboardList size={16} color="var(--color-secondary)"/> 📁 Document Checklist Management</h4>
                
                {/* Request from Template */}
                {/* Request from Template or Folder */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                  {/* System checklist select */}
                  <div style={{ display:'flex', gap:8, background:'var(--color-bg)', padding:12, borderRadius:8, border:'1px solid var(--color-border)', flexWrap:'wrap', alignItems:'center' }}>
                    <span style={{ fontSize:12, fontWeight:600 }}>Apply System Checklist:</span>
                    <select 
                      id="doc-template-select" 
                      className="form-input form-select" 
                      style={{ flex:1, fontSize:13, padding:'4px 8px', height:34, minWidth:200 }}
                    >
                      <option value="">Select a template checklist...</option>
                      {/* Unique template groupings */}
                      {Array.from(new Set(docTemplates.map(t => `${t.service_type}${t.country ? '-' + t.country : ''}`))).map(groupKey => {
                        const tSample = docTemplates.find(t => `${t.service_type}${t.country ? '-' + t.country : ''}` === groupKey);
                        return (
                          <option key={groupKey} value={groupKey}>
                            {tSample.service_type.toUpperCase()} {tSample.country ? `(${tSample.country})` : '(General)'}
                          </option>
                        );
                      })}
                    </select>
                    <select id="template-traveler-select" className="form-input form-select" style={{ fontSize:13, height:34, maxWidth:180 }}>
                      <option value="Primary Applicant">Primary Applicant</option>
                      {getArrayField(detailModal.data.travelers_json).map((t, idx) => (
                        <option key={idx} value={t.name}>{t.name} (Co-applicant)</option>
                      ))}
                    </select>
                    <button 
                      className="btn btn-outline btn-sm"
                      style={{ whiteSpace:'nowrap', padding:'6px 12px' }}
                      onClick={async () => {
                        const select = document.getElementById('doc-template-select');
                        const selectedGroup = select?.value;
                        if (!selectedGroup) return alert('Select a template first.');
                        
                        const travelerSelect = document.getElementById('template-traveler-select');
                        const travelerName = travelerSelect?.value || 'Primary Applicant';
                        
                        const filteredTemplates = docTemplates.filter(t => `${t.service_type}${t.country ? '-' + t.country : ''}` === selectedGroup);
                        if (filteredTemplates.length === 0) return alert('No templates found.');
                        
                        const currentDocs = detailModal.data.documents_json || [];
                        const nextDocs = [...currentDocs];
                        for (const temp of filteredTemplates) {
                          if (!nextDocs.some(d => d.name && d.name.toLowerCase() === temp.name.toLowerCase() && (d.traveler_name || 'Primary Applicant') === travelerName)) {
                            nextDocs.push({
                              id: 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                              name: temp.name,
                              is_requested: true,
                              status: 'pending_upload',
                              filename: '',
                              url: '',
                              traveler_name: travelerName
                            });
                          }
                        }
                        
                        try {
                          await api.put(`/visa/applications/${detailModal.data.id}`, { documents: nextDocs });
                          showToast('Checklist applied from template');
                          setDetailModal({
                            ...detailModal,
                            data: { ...detailModal.data, documents_json: nextDocs }
                          });
                          await loadAllData();
                        } catch (err) { showToast(err.message, 'error'); }
                      }}
                    >
                      Apply Group
                    </button>
                  </div>

                  {/* Custom Folder select */}
                  <div style={{ display:'flex', gap:8, background:'var(--color-bg)', padding:12, borderRadius:8, border:'1px solid var(--color-border)', flexWrap:'wrap', alignItems:'center' }}>
                    <span style={{ fontSize:12, fontWeight:600 }}>Apply Custom Folder:</span>
                    <select 
                      id="doc-folder-select" 
                      className="form-input form-select" 
                      style={{ flex:1, fontSize:13, padding:'4px 8px', height:34, minWidth:200 }}
                    >
                      <option value="">Select a custom folder...</option>
                      {customFolders.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.template_count || 0} docs)</option>
                      ))}
                    </select>
                    <select id="folder-traveler-select" className="form-input form-select" style={{ fontSize:13, height:34, maxWidth:180 }}>
                      <option value="Primary Applicant">Primary Applicant</option>
                      {getArrayField(detailModal.data.travelers_json).map((t, idx) => (
                        <option key={idx} value={t.name}>{t.name} (Co-applicant)</option>
                      ))}
                    </select>
                    <button 
                      className="btn btn-outline btn-sm"
                      style={{ whiteSpace:'nowrap', padding:'6px 12px' }}
                      onClick={async () => {
                        const select = document.getElementById('doc-folder-select');
                        const selectedFolderId = select?.value;
                        if (!selectedFolderId) return alert('Select a folder first.');
                        
                        const travelerSelect = document.getElementById('folder-traveler-select');
                        const travelerName = travelerSelect?.value || 'Primary Applicant';
                        
                        const folderTemplates = docTemplates.filter(t => t.folder_id === parseInt(selectedFolderId));
                        if (folderTemplates.length === 0) return alert('No templates found in this folder.');
                        
                        const currentDocs = detailModal.data.documents_json || [];
                        const nextDocs = [...currentDocs];
                        for (const temp of folderTemplates) {
                          if (!nextDocs.some(d => d.name && d.name.toLowerCase() === temp.name.toLowerCase() && (d.traveler_name || 'Primary Applicant') === travelerName)) {
                            nextDocs.push({
                              id: 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                              name: temp.name,
                              is_requested: true,
                              status: 'pending_upload',
                              filename: '',
                              url: '',
                              traveler_name: travelerName
                            });
                          }
                        }
                        
                        try {
                          await api.put(`/visa/applications/${detailModal.data.id}`, { documents: nextDocs });
                          showToast('Checklist applied from custom folder');
                          setDetailModal({
                            ...detailModal,
                            data: { ...detailModal.data, documents_json: nextDocs }
                          });
                          await loadAllData();
                        } catch (err) { showToast(err.message, 'error'); }
                      }}
                    >
                      Apply Folder
                    </button>
                  </div>
                </div>
 
                {/* Request New Document Form */}
                <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center' }}>
                  <input 
                    id="new-doc-name-input"
                    className="form-input" 
                    placeholder="Request specific document (e.g. Bank Statement)" 
                    style={{ fontSize:13, flex:1 }}
                  />
                  <select id="new-doc-traveler-select" className="form-input form-select" style={{ fontSize:13, height:34, maxWidth:180 }}>
                    <option value="Primary Applicant">Primary Applicant</option>
                    {getArrayField(detailModal.data.travelers_json).map((t, idx) => (
                      <option key={idx} value={t.name}>{t.name} (Co-applicant)</option>
                    ))}
                  </select>
                  <button 
                    className="btn btn-primary btn-sm"
                    style={{ whiteSpace:'nowrap' }}
                    onClick={async () => {
                      const input = document.getElementById('new-doc-name-input');
                      const docName = input?.value?.trim();
                      if (!docName) return alert('Enter document name.');
                      
                      const travelerSelect = document.getElementById('new-doc-traveler-select');
                      const travelerName = travelerSelect?.value || 'Primary Applicant';
                      
                      const currentDocs = detailModal.data.documents_json || [];
                      const updatedDocs = [
                        ...currentDocs, 
                        { id: 'req_' + Date.now(), name: docName, is_requested: true, status: 'pending_upload', filename: '', url: '', traveler_name: travelerName }
                      ];
                      
                      try {
                        await api.put(`/visa/applications/${detailModal.data.id}`, { documents: updatedDocs });
                        showToast('Document requested');
                        input.value = '';
                        setDetailModal({
                          ...detailModal,
                          data: { ...detailModal.data, documents_json: updatedDocs }
                        });
                        await loadAllData();
                      } catch (err) { showToast(err.message, 'error'); }
                    }}
                  >
                    Request
                  </button>
                </div>
 
                {/* Documents List */}
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {(() => {
                    const docs = detailModal.data.documents_json || [];
                    const genericDocs = docs.filter(d => !d.is_requested);
                    const requestedDocs = docs.filter(d => d.is_requested);
 
                    return (<>
                      {requestedDocs.length > 0 && (
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:'var(--color-text-secondary)', marginBottom:6 }}>Requested Documents Checklist</div>
                          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                            {requestedDocs.map((doc, idx) => (
                              <div key={idx} style={{ background:'var(--color-bg)', padding:10, borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid var(--color-border)' }}>
                                <div style={{ fontSize:13 }}>
                                  <div style={{ fontWeight:600, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                                    {doc.name}
                                    <span style={{ fontSize:10, background:'rgba(14,165,233,0.08)', color:'#0ea5e9', padding:'2px 6px', borderRadius:4, fontWeight:700 }}>
                                      👤 {doc.traveler_name || 'Primary Applicant'}
                                    </span>
                                  </div>
                                  {doc.filename ? (
                                    <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'var(--color-secondary)', display:'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                      Download: {doc.filename}
                                    </a>
                                  ) : (
                                    <div style={{ fontSize:11, color:'var(--color-text-muted)', marginTop: 2 }}>Waiting for client upload...</div>
                                  )}
                                  {doc.feedback && <div style={{ fontSize:11, color:'var(--color-danger)', marginTop:2 }}>Feedback: {doc.feedback}</div>}
                                </div>
                                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                                  {doc.status === 'uploaded' ? (<>
                                    <button 
                                      className="admin-action-btn success"
                                      onClick={async () => {
                                        const updatedDocs = docs.map(d => d.id === doc.id ? { ...d, status: 'approved' } : d);
                                        try {
                                          await api.put(`/visa/applications/${detailModal.data.id}`, { documents: updatedDocs });
                                          showToast('Document approved');
                                          setDetailModal({ ...detailModal, data: { ...detailModal.data, documents_json: updatedDocs } });
                                          await loadAllData();
                                        } catch (err) { showToast(err.message, 'error'); }
                                      }}
                                    >
                                      Approve
                                    </button>
                                    <button 
                                      className="admin-action-btn danger"
                                      onClick={async () => {
                                        const feedback = prompt('Enter rejection reason / feedback for client:');
                                        if (feedback === null) return; // cancelled
                                        const updatedDocs = docs.map(d => d.id === doc.id ? { ...d, status: 'rejected', feedback } : d);
                                        try {
                                          await api.put(`/visa/applications/${detailModal.data.id}`, { documents: updatedDocs });
                                          showToast('Document rejected');
                                          setDetailModal({ ...detailModal, data: { ...detailModal.data, documents_json: updatedDocs } });
                                          await loadAllData();
                                        } catch (err) { showToast(err.message, 'error'); }
                                      }}
                                    >
                                      Reject
                                    </button>
                                  </>) : (
                                    <StatusBadge status={doc.status} />
                                  )}
                                  <button
                                    className="admin-action-btn danger"
                                    onClick={async () => {
                                      if (!confirm(`Are you sure you want to remove the request for "${doc.name}"?`)) return;
                                      const updatedDocs = docs.filter(d => d.id !== doc.id);
                                      try {
                                        await api.put(`/visa/applications/${detailModal.data.id}`, { documents: updatedDocs });
                                        showToast('Document request removed');
                                        setDetailModal({ ...detailModal, data: { ...detailModal.data, documents_json: updatedDocs } });
                                        await loadAllData();
                                      } catch (err) { showToast(err.message, 'error'); }
                                    }}
                                    title="Remove Document Request"
                                    style={{ padding: 4 }}
                                  >
                                    <Trash2 size={12}/>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {genericDocs.length > 0 && (
                        <div style={{ marginTop:10 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:'var(--color-text-secondary)', marginBottom:6 }}>Generic Client Uploads</div>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                            {genericDocs.map((doc, idx) => (
                              <a key={idx} href={doc.url} target="_blank" rel="noreferrer" className="portal-doc-chip" style={{ background:'var(--color-bg)', padding:'6px 10px', borderRadius:20, fontSize:12, textDecoration:'none', color:'var(--color-text)', border:'1px solid var(--color-border)', display:'inline-flex', alignItems:'center', gap:4 }}>
                                <CheckCircle2 size={12} color="#10b981"/> {doc.filename}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </>);
                  })()}
                </div>
              </div>
            )}
            
            <CaseExtensions detailModal={detailModal} setDetailModal={setDetailModal} loadAllData={loadAllData} user={user} showToast={showToast} handleFileUpload={handleFileUpload} />

            <div style={{ marginTop:20 }}>
              <label className="form-label">Admin Notes</label>
              <textarea className="form-input form-textarea" placeholder="Add internal notes..." defaultValue={detailModal.data.admin_notes || detailModal.data.notes || ''} onChange={e=>setNotesInput(e.target.value)} rows={3}/>
              
              {(user?.sub_role === 'manager' || (user?.role === 'admin' && user?.sub_role !== 'agent' && user?.sub_role !== 'viewer')) && (
                <div style={{ marginTop: 14 }}>
                  <label className="form-label">Assigned Agent</label>
                  <select className="form-input form-select" value={detailModal.data.assigned_to || ''} onChange={async (e) => {
                    const newAgent = e.target.value;
                    const id = detailModal.data.id;
                    const type = detailModal.type;
                    try {
                      if (type==='sr') await api.put(`/service-requests/${id}`, { assigned_to: newAgent || null });
                      else if (type==='booking') await api.put(`/bookings/${id}`, { assigned_to: newAgent || null });
                      else if (type==='visa') await api.put(`/visa/applications/${id}`, { assigned_to: newAgent || null });
                      else if (type==='inquiry') await api.put(`/inquiries/${id}`, { assigned_to: newAgent || null });
                      else if (type==='flight') await api.put(`/flights/requests/${id}`, { assigned_to: newAgent || null });
                      showToast('Agent assigned');
                      setDetailModal({...detailModal, data: {...detailModal.data, assigned_to: newAgent || null}});
                      api.get('/visa/applications').then(setVisaApps).catch(()=>{});
                      api.get('/bookings').then(setBookings).catch(()=>{});
                      api.get('/inquiries').then(setInquiries).catch(()=>{});
                      api.get('/flights/requests').then(setFlightReqs).catch(()=>{});
                    } catch (err) { showToast(err.message, 'error'); }
                  }}>
                    <option value="">Unassigned</option>
                    {staffList.filter(s => s.sub_role === 'agent').map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>
              )}

              {detailModal.data.email && (
                <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, margin: 0, fontSize: 12 }}>
                    🔑 Portal Access Link
                  </label>
                  <p className="text-muted" style={{ fontSize: 11, margin: '4px 0 10px' }}>
                    Share the portal access link with this client to track progress.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-xs" style={{ flex: 1, height: 30, fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }} onClick={() => handleCopyShareLink(detailModal.data.email)}>
                      <ExternalLink size={12} /> Copy Link
                    </button>
                    <button className="btn btn-xs" style={{ flex: 1, height: 30, fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'rgba(37,211,102,0.1)', color: '#25d366', border: '1px solid rgba(37,211,102,0.2)' }} onClick={() => handleWhatsAppSharePortal(detailModal.data.customer_name || detailModal.data.name || 'Traveler', detailModal.data.email, detailModal.data.customer_phone || detailModal.data.phone)}>
                      💬 WhatsApp
                    </button>
                  </div>
                </div>
              )}

              <button className="btn btn-primary btn-sm" style={{ marginTop:14 }} onClick={async () => {
                const id = detailModal.data.id;
                const type = detailModal.type;
                try {
                  if (type==='sr') await api.put(`/service-requests/${id}`, { admin_notes: notesInput });
                  else if (type==='booking') await api.put(`/bookings/${id}`, { admin_notes: notesInput });
                  else if (type==='visa') await api.put(`/visa/applications/${id}`, { admin_notes: notesInput, notes: notesInput });
                  else if (type==='inquiry') await api.put(`/inquiries/${id}`, { admin_notes: notesInput });
                  else if (type==='flight') await api.put(`/flights/requests/${id}`, { admin_notes: notesInput });
                  showToast('Notes saved');
                  setDetailModal({...detailModal, data: {...detailModal.data, admin_notes: notesInput}});
                  loadAllData();
                } catch (err) { showToast(err.message, 'error'); }
              }}><Save size={14}/> Save Notes</button>
            </div>
            
            {detailModal.type === 'sr' && detailModal.data.status !== 'completed' && detailModal.data.status !== 'rejected' && (
              <div style={{ marginTop:24, borderTop:'1px solid var(--color-border)', paddingTop:20 }}>
                <h4 style={{ fontSize:14, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                  ⚡ Workflow Actions
                </h4>
                <div style={{ background:'rgba(255,255,255,0.02)', padding:16, borderRadius:12, border:'1px solid var(--color-border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13 }}>Promote Inquiry in Service Queue</div>
                    <div className="text-muted" style={{ fontSize:11, marginTop:2 }}>
                      Convert this request into a live {detailModal.data.service_type === 'visa' ? 'Visa Application' : 'Booking'} record and create customer credentials.
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleConvertSR(detailModal.data)}
                    style={{ display:'flex', alignItems:'center', gap:6 }}
                  >
                    <RefreshCw size={14}/> Move to {detailModal.data.service_type === 'visa' ? 'Visa Applications' : 'Bookings'}
                  </button>
                </div>
              </div>
            )}

            {detailModal.type === 'inquiry' && detailModal.data.status !== 'completed' && detailModal.data.status !== 'cancelled' && (
              <div style={{ marginTop:24, borderTop:'1px solid var(--color-border)', paddingTop:20 }}>
                <h4 style={{ fontSize:14, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
                  ⚡ Workflow Actions
                </h4>
                <div style={{ background:'rgba(255,255,255,0.02)', padding:16, borderRadius:12, border:'1px solid var(--color-border)', display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--color-border-alt)', paddingBottom:12 }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>Convert to Visa Application</div>
                      <div className="text-muted" style={{ fontSize:11, marginTop:2 }}>
                        Create a formal visa application file and login credentials for this customer.
                      </div>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleConvertInquiry(detailModal.data, 'visa')}
                      style={{ display:'flex', alignItems:'center', gap:6 }}
                    >
                      <RefreshCw size={14}/> Convert to Visa Application
                    </button>
                  </div>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>Convert to Package Booking</div>
                      <div className="text-muted" style={{ fontSize:11, marginTop:2 }}>
                        Create a holiday package or general booking record and customer credentials.
                      </div>
                    </div>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleConvertInquiry(detailModal.data, 'booking')}
                      style={{ display:'flex', alignItems:'center', gap:6 }}
                    >
                      <RefreshCw size={14}/> Convert to Booking
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Flight Rate Modal */}
      <Modal open={rateModal} onClose={() => setRateModal(false)} title={editingRate ? 'Edit Flight Rate' : 'Add New Flight Rate'}>
        <form onSubmit={handleSaveFlightRate}>
          <div style={{ display:'grid', gap:14 }}>
            <div className="form-group">
              <label className="form-label">From City *</label>
              <input
                className="form-input"
                placeholder="e.g. London"
                value={rateForm.from_city}
                onChange={e => setRateForm({ ...rateForm, from_city: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">To City *</label>
              <input
                className="form-input"
                placeholder="e.g. Paris"
                value={rateForm.to_city}
                onChange={e => setRateForm({ ...rateForm, to_city: e.target.value })}
                required
              />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div className="form-group">
                <label className="form-label">Price (£) *</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="e.g. 199"
                  value={rateForm.price}
                  onChange={e => setRateForm({ ...rateForm, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Airline</label>
                <input
                  className="form-input"
                  placeholder="e.g. British Airways"
                  value={rateForm.airline}
                  onChange={e => setRateForm({ ...rateForm, airline: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div style={{ marginTop:20, display:'flex', gap:12, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setRateModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Save size={16}/> {editingRate ? 'Save Changes' : 'Create Rate'}</button>
          </div>
        </form>
      </Modal>

      {/* Customer Create/Edit Modal */}
      <Modal open={custModal} onClose={() => setCustModal(false)} title={editingCust ? 'Edit Customer' : 'Add New Customer'}>
        <div style={{ display:'grid', gap:14 }}>
          <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={custForm.name} onChange={e=>setCustForm({...custForm,name:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Email Address *</label><input className="form-input" type="email" value={custForm.email} onChange={e=>setCustForm({...custForm,email:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Phone Number</label><input className="form-input" value={custForm.phone} onChange={e=>setCustForm({...custForm,phone:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Nationality</label><input className="form-input" value={custForm.nationality} onChange={e=>setCustForm({...custForm,nationality:e.target.value})}/></div>
          {!editingCust && (
            <div className="form-group">
              <label className="form-label">Password (Optional - defaults to welcome123)</label>
              <input className="form-input" type="password" value={custForm.password} onChange={e=>setCustForm({...custForm,password:e.target.value})}/>
            </div>
          )}
          {editingCust && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input form-select" value={custForm.status} onChange={e=>setCustForm({...custForm,status:e.target.value})}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          )}
        </div>
        <div style={{ marginTop:20, display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setCustModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveCustomer}><Save size={16}/> Save</button>
        </div>
      </Modal>

      {/* Template Modal */}
      <Modal open={templateModal} onClose={() => setTemplateModal(false)} title={editingTemplate ? 'Edit Document Template' : 'Add Document Template'}>
        <div style={{ display:'grid', gap:14 }}>
          <div className="form-group">
            <label className="form-label">Service Type *</label>
            <select className="form-input form-select" value={templateForm.service_type} onChange={e=>setTemplateForm({...templateForm,service_type:e.target.value})}>
              {['visa','holiday_package','flight','hotel','consultation','other'].map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Country (Optional - blank for all)</label><input className="form-input" placeholder="e.g. France" value={templateForm.country} onChange={e=>setTemplateForm({...templateForm,country:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Document Name *</label><input className="form-input" placeholder="e.g. Passport Scan" value={templateForm.name} onChange={e=>setTemplateForm({...templateForm,name:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Description / Details</label><textarea className="form-input form-textarea" placeholder="Instructions for client..." value={templateForm.description} onChange={e=>setTemplateForm({...templateForm,description:e.target.value})} rows={3}/></div>
          <div className="form-group">
            <label className="form-label">Mandatory Requirement?</label>
            <select className="form-input form-select" value={templateForm.required} onChange={e=>setTemplateForm({...templateForm,required:parseInt(e.target.value)})}>
              <option value={1}>Yes (Required)</option>
              <option value={0}>No (Optional)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Folder (Optional)</label>
            <select className="form-input form-select" value={templateForm.folder_id || ''} onChange={e=>setTemplateForm({...templateForm,folder_id:e.target.value ? parseInt(e.target.value) : ''})}>
              <option value="">No Folder (Unassigned)</option>
              {customFolders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop:20, display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setTemplateModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveTemplate}><Save size={16}/> Save Template</button>
        </div>
      </Modal>

      {/* Custom Folder Modal */}
      <Modal open={customFolderModal} onClose={() => setCustomFolderModal(false)} title={editingCustomFolder ? "Rename Folder" : "Add Custom Folder"}>
        <div style={{ display:'grid', gap:14 }}>
          <div className="form-group">
            <label className="form-label">Folder Name *</label>
            <input className="form-input" placeholder="e.g. Employee Visa Documents" value={customFolderForm.name} onChange={e => setCustomFolderForm({ name: e.target.value })}/>
          </div>
        </div>
        <div style={{ marginTop:20, display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => setCustomFolderModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveCustomFolder}><Save size={16}/> Save Folder</button>
        </div>
      </Modal>

      {/* Create Booking Modal */}
      <Modal open={bookingCreateModal} onClose={() => setBookingCreateModal(false)} title="Create New Booking" wide>
        <form onSubmit={handleCreateBooking}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Customer Account Info</div>
          <div style={{ background:'var(--color-bg)', padding:14, borderRadius:8, marginBottom:14, border:'1px solid var(--color-border)' }}>
            <div style={{ display:'flex', gap:14, marginBottom:10 }}>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600 }}>
                <input type="radio" name="booking-cust" checked={!bookingCreateForm.is_new_customer} onChange={() => setBookingCreateForm({ ...bookingCreateForm, is_new_customer: false })} />
                Existing Customer
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600 }}>
                <input type="radio" name="booking-cust" checked={bookingCreateForm.is_new_customer} onChange={() => setBookingCreateForm({ ...bookingCreateForm, is_new_customer: true })} />
                New Customer Account
              </label>
            </div>
            {!bookingCreateForm.is_new_customer ? (
              <div className="form-group" style={{ margin:0 }}>
                <label className="form-label">Select Customer *</label>
                <select className="form-input form-select" value={bookingCreateForm.user_id} onChange={e => setBookingCreateForm({ ...bookingCreateForm, user_id: e.target.value })} required={!bookingCreateForm.is_new_customer}>
                  <option value="">Choose customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                </select>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" placeholder="Name" value={bookingCreateForm.cust_name} onChange={e => setBookingCreateForm({ ...bookingCreateForm, cust_name: e.target.value })} required={bookingCreateForm.is_new_customer}/></div>
                <div className="form-group"><label className="form-label">Email Address *</label><input className="form-input" type="email" placeholder="Email" value={bookingCreateForm.cust_email} onChange={e => setBookingCreateForm({ ...bookingCreateForm, cust_email: e.target.value })} required={bookingCreateForm.is_new_customer}/></div>
                <div className="form-group"><label className="form-label">Phone Number</label><input className="form-input" placeholder="Phone" value={bookingCreateForm.cust_phone} onChange={e => setBookingCreateForm({ ...bookingCreateForm, cust_phone: e.target.value })}/></div>
                <div className="form-group"><label className="form-label">Nationality</label><input className="form-input" placeholder="Nationality" value={bookingCreateForm.cust_nationality} onChange={e => setBookingCreateForm({ ...bookingCreateForm, cust_nationality: e.target.value })}/></div>
              </div>
            )}
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Booking Details</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div className="form-group">
              <label className="form-label">Holiday Package *</label>
              <select className="form-input form-select" value={bookingCreateForm.package_id} onChange={e => setBookingCreateForm({ ...bookingCreateForm, package_id: e.target.value })} required>
                <option value="">Select package...</option>
                {packages.map(p => <option key={p.id} value={p.id}>{p.title} (£{p.price})</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Travel Date *</label><input className="form-input" type="date" value={bookingCreateForm.travel_date} onChange={e => setBookingCreateForm({ ...bookingCreateForm, travel_date: e.target.value })} required/></div>
            <div className="form-group"><label className="form-label">Number of Travelers</label><input className="form-input" type="number" min="1" value={bookingCreateForm.travelers} onChange={e => setBookingCreateForm({ ...bookingCreateForm, travelers: parseInt(e.target.value) || 1 })}/></div>
            <div className="form-group" style={{ gridColumn:'span 2' }}><label className="form-label">Special Notes / Requests</label><textarea className="form-input form-textarea" value={bookingCreateForm.notes} onChange={e => setBookingCreateForm({ ...bookingCreateForm, notes: e.target.value })} rows={3}/></div>
          </div>

          <div style={{ marginTop:20, display:'flex', gap:12, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setBookingCreateModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Save size={16}/> Create Booking</button>
          </div>
        </form>
      </Modal>

      {/* Create Visa App Modal */}
      <Modal open={visaCreateModal} onClose={() => setVisaCreateModal(false)} title="Create Visa Application" wide>
        <form onSubmit={handleCreateVisa}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Customer Account Info</div>
          <div style={{ background:'var(--color-bg)', padding:14, borderRadius:8, marginBottom:14, border:'1px solid var(--color-border)' }}>
            <div style={{ display:'flex', gap:14, marginBottom:10 }}>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600 }}>
                <input type="radio" name="visa-cust" checked={!visaCreateForm.is_new_customer} onChange={() => setVisaCreateForm({ ...visaCreateForm, is_new_customer: false })} />
                Existing Customer
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600 }}>
                <input type="radio" name="visa-cust" checked={visaCreateForm.is_new_customer} onChange={() => setVisaCreateForm({ ...visaCreateForm, is_new_customer: true })} />
                New Customer Account
              </label>
            </div>
            {!visaCreateForm.is_new_customer ? (
              <div className="form-group" style={{ margin:0 }}>
                <label className="form-label">Select Customer *</label>
                <select className="form-input form-select" value={visaCreateForm.user_id} onChange={e => setVisaCreateForm({ ...visaCreateForm, user_id: e.target.value })} required={!visaCreateForm.is_new_customer}>
                  <option value="">Choose customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                </select>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" placeholder="Name" value={visaCreateForm.cust_name} onChange={e => setVisaCreateForm({ ...visaCreateForm, cust_name: e.target.value })} required={visaCreateForm.is_new_customer}/></div>
                <div className="form-group"><label className="form-label">Email Address *</label><input className="form-input" type="email" placeholder="Email" value={visaCreateForm.cust_email} onChange={e => setVisaCreateForm({ ...visaCreateForm, cust_email: e.target.value })} required={visaCreateForm.is_new_customer}/></div>
                <div className="form-group"><label className="form-label">Phone Number</label><input className="form-input" placeholder="Phone" value={visaCreateForm.cust_phone} onChange={e => setVisaCreateForm({ ...visaCreateForm, cust_phone: e.target.value })}/></div>
                <div className="form-group"><label className="form-label">Nationality *</label><input className="form-input" placeholder="e.g. Pakistani" value={visaCreateForm.cust_nationality} onChange={e => setVisaCreateForm({ ...visaCreateForm, cust_nationality: e.target.value })} required={visaCreateForm.is_new_customer}/></div>
              </div>
            )}
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Visa Details</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div className="form-group">
              <label className="form-label">Destination Country *</label>
              <select className="form-input form-select" value={visaCreateForm.country} onChange={e => setVisaCreateForm({ ...visaCreateForm, country: e.target.value })} required>
                <option value="">Select country...</option>
                {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Purpose of Travel</label>
              <select className="form-input form-select" value={visaCreateForm.purpose} onChange={e => setVisaCreateForm({ ...visaCreateForm, purpose: e.target.value })}>
                <option value="tourism">Tourism</option>
                <option value="business">Business</option>
                <option value="family">Family Visit</option>
                <option value="medical">Medical Treatment</option>
                <option value="study">Study</option>
              </select>
            </div>
            {!visaCreateForm.is_new_customer && (
              <div className="form-group"><label className="form-label">Nationality *</label><input className="form-input" placeholder="Nationality" value={visaCreateForm.nationality} onChange={e => setVisaCreateForm({ ...visaCreateForm, nationality: e.target.value })} required/></div>
            )}
            <div className="form-group" style={{ gridColumn:'span 2' }}><label className="form-label">Additional Info / Notes</label><textarea className="form-input form-textarea" value={visaCreateForm.notes} onChange={e => setVisaCreateForm({ ...visaCreateForm, notes: e.target.value })} rows={3}/></div>
          </div>

          <div style={{ marginTop:20, display:'flex', gap:12, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setVisaCreateModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Save size={16}/> Create Application</button>
          </div>
        </form>
      </Modal>

      {/* Create Service Request Modal */}
      <Modal open={srCreateModal} onClose={() => setSrCreateModal(false)} title="Create New Service Request" wide>
        <form onSubmit={handleCreateSR}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Customer Account Info</div>
          <div style={{ background:'var(--color-bg)', padding:14, borderRadius:8, marginBottom:14, border:'1px solid var(--color-border)' }}>
            <div style={{ display:'flex', gap:14, marginBottom:10 }}>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600 }}>
                <input type="radio" name="sr-cust" checked={!srCreateForm.is_new_customer} onChange={() => setSrCreateForm({ ...srCreateForm, is_new_customer: false })} />
                Existing Customer
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600 }}>
                <input type="radio" name="sr-cust" checked={srCreateForm.is_new_customer} onChange={() => setSrCreateForm({ ...srCreateForm, is_new_customer: true })} />
                New Customer Account
              </label>
            </div>
            {!srCreateForm.is_new_customer ? (
              <div className="form-group" style={{ margin:0 }}>
                <label className="form-label">Select Customer *</label>
                <select className="form-input form-select" value={srCreateForm.user_id} onChange={e => setSrCreateForm({ ...srCreateForm, user_id: e.target.value })} required={!srCreateForm.is_new_customer}>
                  <option value="">Choose customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                </select>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" placeholder="Name" value={srCreateForm.cust_name} onChange={e => setSrCreateForm({ ...srCreateForm, cust_name: e.target.value })} required={srCreateForm.is_new_customer}/></div>
                <div className="form-group"><label className="form-label">Email Address *</label><input className="form-input" type="email" placeholder="Email" value={srCreateForm.cust_email} onChange={e => setSrCreateForm({ ...srCreateForm, cust_email: e.target.value })} required={srCreateForm.is_new_customer}/></div>
                <div className="form-group"><label className="form-label">Phone Number</label><input className="form-input" placeholder="Phone" value={srCreateForm.cust_phone} onChange={e => setSrCreateForm({ ...srCreateForm, cust_phone: e.target.value })}/></div>
                <div className="form-group"><label className="form-label">Nationality</label><input className="form-input" placeholder="Nationality" value={srCreateForm.cust_nationality} onChange={e => setSrCreateForm({ ...srCreateForm, cust_nationality: e.target.value })}/></div>
              </div>
            )}
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Request Details</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div className="form-group">
              <label className="form-label">Service Type *</label>
              <select className="form-input form-select" value={srCreateForm.service_type} onChange={e => setSrCreateForm({ ...srCreateForm, service_type: e.target.value })} required>
                <option value="visa">Visa Assistance</option>
                <option value="holiday_package">Holiday Package</option>
                <option value="flight">Flight Booking</option>
                <option value="hotel">Hotel Booking</option>
                <option value="consultation">Consultation</option>
                <option value="other">Other Service</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Destination Country</label><input className="form-input" placeholder="e.g. France" value={srCreateForm.country} onChange={e => setSrCreateForm({ ...srCreateForm, country: e.target.value })}/></div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input form-select" value={srCreateForm.priority} onChange={e => setSrCreateForm({ ...srCreateForm, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn:'span 2' }}><label className="form-label">Details / Requirements</label><textarea className="form-input form-textarea" value={srCreateForm.notes} onChange={e => setSrCreateForm({ ...srCreateForm, notes: e.target.value })} rows={3}/></div>
          </div>

          <div style={{ marginTop:20, display:'flex', gap:12, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setSrCreateModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Save size={16}/> Submit Request</button>
          </div>
        </form>
      </Modal>

      <style>{`
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes slideUp { from{transform:translateY(20px); opacity:0} to{transform:translateY(0); opacity:1} }
        .spinner { width:36px; height:36px; border:3px solid var(--color-border); border-top:3px solid var(--color-secondary); border-radius:50%; animation:spin 1s linear infinite; margin:0 auto; }
        .admin-mobile-toggle { display:none; position:fixed; bottom:85px; left:20px; right:auto; z-index:var(--z-widget); background:var(--color-primary); color:white; border:none; border-radius:var(--radius-full); padding:12px 20px; font-weight:600; font-size:13px; box-shadow:var(--shadow-lg); cursor:pointer; gap:8px; align-items:center; }
        .admin-sidebar { width:220px; background:var(--color-primary); min-height:calc(100vh - var(--nav-height)); position:sticky; top:var(--nav-height); flex-shrink:0; padding:20px 12px; overflow-y:auto; max-height:calc(100vh - var(--nav-height)); }
        .admin-sidebar-header { color:white; font-weight:700; font-size:16px; padding:0 12px; margin-bottom:20px; }
        .admin-nav { display:flex; flex-direction:column; gap:1px; }
        .admin-nav-item { display:flex; align-items:center; gap:9px; padding:9px 12px; border-radius:8px; font-size:13px; cursor:pointer; border:none; width:100%; text-align:left; transition:all 0.15s; background:transparent; color:rgba(255,255,255,0.55); font-weight:400; }
        .admin-nav-item.active { background:rgba(255,255,255,0.1); color:white; font-weight:600; }
        .admin-nav-item:hover { background:rgba(255,255,255,0.07); color:white; }
        .admin-badge { margin-left:auto; background:#ef4444; color:white; font-size:10px; font-weight:700; min-width:18px; height:18px; border-radius:9px; display:flex; align-items:center; justify-content:center; padding:0 5px; }
        .admin-overlay { display:none; }
        .admin-table-wrap { overflow-x:auto; }
        .admin-table { width:100%; border-collapse:collapse; }
        .admin-table th { padding:10px 14px; text-align:left; font-size:11px; font-weight:600; color:var(--color-text-muted); text-transform:uppercase; background:var(--color-bg); white-space:nowrap; }
        .admin-table td { padding:10px 14px; font-size:13px; border-top:1px solid var(--color-border); vertical-align:middle; }
        .admin-table tr:hover td { background:rgba(14,165,233,0.02); }
        .admin-action-btn { padding:4px 10px; border:1px solid; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer; background:transparent; transition:all 0.15s; display:inline-flex; align-items:center; gap:3px; white-space:nowrap; }
        .admin-action-btn.success { color:#10b981; border-color:#10b981; }
        .admin-action-btn.success:hover { background:#10b981; color:white; }
        .admin-action-btn.danger { color:#ef4444; border-color:#ef4444; }
        .admin-action-btn.danger:hover { background:#ef4444; color:white; }
        .admin-action-btn.info { color:#0ea5e9; border-color:#0ea5e9; }
        .admin-action-btn.info:hover { background:#0ea5e9; color:white; }
        .admin-action-btn.primary { color:var(--color-primary); border-color:var(--color-primary); }
        .admin-action-btn.primary:hover { background:var(--color-primary); color:white; }
        @media(max-width:768px) {
          .admin-mobile-toggle { display:flex; }
          .admin-sidebar { position:fixed; left:-100%; top:var(--nav-height); bottom:0; z-index:var(--z-modal); transition:left 0.3s ease; width:240px; box-shadow:var(--shadow-2xl); }
          .admin-sidebar.open { left:0; }
          .admin-overlay { display:block; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:calc(var(--z-modal) - 1); }
          main { padding:16px 16px 140px 16px !important; }
        }
      `}</style>

      {uploadProgress !== null && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 99999,
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xl)',
          borderRadius: 12,
          padding: '16px 20px',
          width: 320,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
              {typeof uploadProgress === 'object' 
                ? `Uploading (${uploadProgress.current}/${uploadProgress.total})` 
                : 'Uploading File...'}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-secondary)' }}>
              {typeof uploadProgress === 'object' ? uploadProgress.percent : uploadProgress}%
            </span>
          </div>
          {typeof uploadProgress === 'object' && uploadProgress.filename && (
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {uploadProgress.filename}
            </div>
          )}
          <div style={{ width: '100%', height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ 
              width: `${typeof uploadProgress === 'object' ? uploadProgress.percent : uploadProgress}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--color-secondary), var(--color-secondary-hover))', 
              transition: 'width 0.2s ease-out',
              borderRadius: 3
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
