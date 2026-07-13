import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { api } from '../utils/api';
import { supabase } from '../utils/supabase';
import {
  LayoutDashboard, FileText, Plane, Upload, User, Bell, LogOut, Clock,
  CheckCircle2, AlertCircle, Package, DollarSign, Send, MessageSquare,
  Plus, ChevronRight, Globe, Shield, Calendar, Users as UsersIcon,
  MapPin, X, ArrowRight, Download, Eye, Menu, ClipboardList,
  Briefcase, Hotel, HelpCircle, Phone, Gift, PenTool, Award, Paperclip
} from 'lucide-react';

const tabs = [
  { id:'dashboard', label:'Dashboard', icon:LayoutDashboard },
  { id:'bookings', label:'My Bookings', icon:Package },
  { id:'visa', label:'Visa Applications', icon:FileText },
  { id:'request-service', label:'Request a Service', icon:ClipboardList },
  { id:'my-requests', label:'My Requests', icon:Briefcase },
  { id:'documents', label:'Documents', icon:Upload },
  { id:'consultations', label:'Consultations', icon:Calendar },
  { id:'referrals', label:'Referrals', icon:Gift },
  { id:'messages', label:'Support Chat', icon:MessageSquare },
  { id:'notifications', label:'Notifications', icon:Bell },
  { id:'profile', label:'Profile', icon:User },
];

const statusColors = {
  confirmed:'#10b981', pending:'#f59e0b', approved:'#10b981', in_review:'#6366f1',
  rejected:'#ef4444', submitted:'#f59e0b', completed:'#0ea5e9', cancelled:'#ef4444',
  paid:'#10b981', partial:'#0ea5e9', new:'#f59e0b', accepted:'#10b981', in_progress:'#6366f1',
  pending_upload:'#f59e0b', uploaded:'#6366f1', document_complete:'#0ea5e9',
  fee_processing:'#d946ef', embassy_submitted:'#4f46e5', interview_scheduled:'#8b5cf6',
  visa_successful:'#10b981', visa_refused:'#ef4444'
};
const statusLabels = {
  confirmed:'Confirmed', pending:'Pending', approved:'Approved', in_review:'In Review',
  rejected:'Rejected', submitted:'Submitted', completed:'Completed', cancelled:'Cancelled',
  paid:'Paid', partial:'Partial', new:'New', accepted:'Accepted', in_progress:'In Progress',
  pending_upload:'Pending Upload', uploaded:'Pending Review', document_complete:'Docs Complete',
  fee_processing:'Fee Processing', embassy_submitted:'Embassy Submitted',
  interview_scheduled:'Interview Scheduled', visa_successful:'Visa Successful',
  visa_refused:'Visa Refused'
};

function StatusBadge({ status }) {
  const color = statusColors[status] || '#94a3b8';
  const label = statusLabels[status] || status;
  return (
    <span style={{
      background:`${color}14`, color, padding:'3px 10px', borderRadius:20,
      fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.03em',
      border:`1px solid ${color}30`, whiteSpace:'nowrap', display:'inline-block'
    }}>{label}</span>
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

function PortalCaseExtensions({ item, type, loadPortalData, setSigningFile, setActiveTab }) {
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedTravelers, setEditedTravelers] = useState([]);
  
  const travelers = getArrayField(item.travelers_json);
  const payments = getArrayField(item.payment_info_json);
  const comments = getArrayField(item.comments_json).filter(c => c.is_public);
  
  const handleProofUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if(res.url) {
        const endpoint = type === 'visa' ? `/visa/applications/${item.id}` : `/bookings/${item.id}`;
        await api.put(endpoint, { payment_proof: res.url });
        await loadPortalData();
        alert('Payment proof uploaded successfully!');
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSignedDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if(res.url) {
        const endpoint = type === 'visa' ? `/visa/applications/${item.id}` : `/bookings/${item.id}`;
        await api.put(endpoint, { signed_document_url: res.url });
        await loadPortalData();
        alert('Signed agreement uploaded successfully!');
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveTravelers = async () => {
    const endpoint = type === 'visa' ? `/visa/applications/${item.id}` : `/bookings/${item.id}`;
    try {
      await api.put(endpoint, { travelers: editedTravelers });
      await loadPortalData();
      setEditMode(false);
      alert('Travelers list updated successfully!');
    } catch (err) {
      alert('Failed to update: ' + err.message);
    }
  };

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* 1. Premium Banking Card & Invoicing Details */}
      {item.payment_requested === 1 && item.payment_status !== 'paid' && item.status !== 'cancelled' && (
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 20, marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              💳 Payment Requested
            </h4>
            <span style={{ fontSize: 11, background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
              Action Required
            </span>
          </div>

          {/* Dynamic Amount Card */}
          <div style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', borderRadius: 10, padding: 18, border: '1px solid rgba(245, 158, 11, 0.25)', position: 'relative', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.04)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <span style={{ color: '#94A3B8', fontSize: 10, textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>Total Amount Due</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'white', display: 'block', marginTop: 4 }}>
                  {settings.currency || '£'}{parseFloat(item.total_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {item.invoice_url && (
                <a href={item.invoice_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '6px 12px', background: 'var(--color-secondary)', color: '#000', fontWeight: 600, borderRadius: 6 }}>
                  <Download size={13}/> View Invoice
                </a>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
              <div>
                <span style={{ color: '#94A3B8', fontSize: 9, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Payment Reference</span>
                <span style={{ fontWeight: 600, color: 'white', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <code>BT-{item.id}-{item.booking_ref || item.app_ref}</code>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(`BT-${item.id}-${item.booking_ref || item.app_ref}`); alert('Payment reference copied!'); }} 
                    style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'inline-flex', padding: 0 }}
                    title="Copy Reference"
                  >
                    📋
                  </button>
                </span>
              </div>
              <div>
                <span style={{ color: '#94A3B8', fontSize: 9, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Payment Status</span>
                <span style={{ fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.5px' }}>
                  {item.payment_status || 'unpaid'}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Transfer Details Box */}
          <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <h5 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 12px 0', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🏛️ Official Bank Transfer details
            </h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 12 }}>
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 10, display: 'block', marginBottom: 2 }}>Bank Name</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{settings.bank_name || 'BARCLAYS'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 10, display: 'block', marginBottom: 2 }}>Account Name</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{settings.account_name || 'Borderless Trips Ltd'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 10, display: 'block', marginBottom: 2 }}>Sort Code</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)', fontFamily: 'monospace' }}>
                  {settings.sort_code || '20-XX-XX'}
                  <button 
                    onClick={() => { navigator.clipboard.writeText(settings.sort_code || '20-XX-XX'); alert('Sort code copied!'); }} 
                    style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', marginLeft: 4 }}
                    title="Copy Sort Code"
                  >
                    📋
                  </button>
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 10, display: 'block', marginBottom: 2 }}>Account Number</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)', fontFamily: 'monospace' }}>
                  {settings.account_number || 'XXXXXXXX'}
                  <button 
                    onClick={() => { navigator.clipboard.writeText(settings.account_number || 'XXXXXXXX'); alert('Account number copied!'); }} 
                    style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', marginLeft: 4 }}
                    title="Copy Account Number"
                  >
                    📋
                  </button>
                </span>
              </div>
            </div>
          </div>

          {/* Specific Custom Payments (if any) */}
          {payments.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h5 style={{ fontSize: 12, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                💳 Alternative Bank Options
              </h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {payments.map((p, i) => (
                  <div key={i} style={{ background: 'var(--color-bg)', padding: 12, borderRadius: 8, fontSize: 12, border: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: 600 }}>{p.bank_name}</div>
                    <div style={{ color: 'var(--color-text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{p.account_name} • {p.account_number}</span>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(p.account_number); alert('Account number copied!'); }} 
                        style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                        title="Copy"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment receipt upload wrapper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 8, border: '1px dashed var(--color-border)' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 600, display: 'block', color: 'var(--color-text)' }}>Have you made the transfer?</span>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginTop: 2 }}>Upload your payment receipt / bank transaction receipt for validation.</span>
            </div>
            {!item.payment_proof ? (
              <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
                <Upload size={14} style={{ marginRight: 4 }} /> {uploading ? 'Uploading...' : 'Upload Receipt'}
                <input type="file" disabled={uploading} onChange={handleProofUpload} style={{ display: 'none' }} accept="image/*,.pdf"/>
              </label>
            ) : null}
          </div>
        </div>
      )}

      {item.payment_proof && (
        <div style={{ fontSize: 12, background: 'rgba(16, 185, 129, 0.08)', padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--color-success)', marginTop: 4 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ✅ Payment proof uploaded. We are verifying your transfer.
          </span>
          <a href={item.payment_proof} target="_blank" rel="noreferrer" style={{ color: 'var(--color-success)', fontWeight: 700, textDecoration: 'underline', fontSize: 12 }}>
            View Receipt
          </a>
        </div>
      )}

      {/* 3. Signature & Agreement Section */}
      {(item.signature_link || item.signature_doc || item.signed_document_url) && (
        <div style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16 }}>
          <h4 style={{ fontSize:13, fontWeight:700, marginBottom:8, color:'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            ✍️ Travelers Agreement & E-Signing
          </h4>
          
          {item.signed_document_url ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-success)', fontSize: 12 }}>
              <CheckCircle2 size={16} />
              <span>Agreement Signed and Submitted successfully.</span>
              <a href={item.signed_document_url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, textDecoration: 'underline', color: 'var(--color-success)', marginLeft: 6 }}>
                View Signed Copy
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245,158,11,0.2)', padding: 12, borderRadius: 8 }}>
                <p style={{ margin: '0 0 10px 0', lineHeight: 1.4 }}>
                  Please click the button below to sign the travel agreement digitally.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {setSigningFile && (
                    <button onClick={() => setSigningFile(item)} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}>
                      <PenTool size={12}/> Sign Document Here
                    </button>
                  )}
                  {item.signature_link && (
                    <a href={item.signature_link} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-secondary)', color: '#000', fontWeight: 'bold' }}>
                      Sign Online Now
                    </a>
                  )}
                </div>
              </div>

              {item.signature_doc && (
                <div style={{ fontSize: 12, background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: 12, borderRadius: 8 }}>
                  <p style={{ margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    Please download the agreement document, sign it, and upload the signed copy.
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <a href={item.signature_doc} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Download size={12}/> Download Agreement
                    </a>
                    
                    <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Upload size={12}/> {uploading ? 'Uploading...' : 'Upload Signed PDF'}
                      <input type="file" disabled={uploading} onChange={handleSignedDocUpload} style={{ display: 'none' }} accept=".pdf,.png,.jpg,.jpeg"/>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Satisfaction Survey Prompt */}
      {(item.status === 'completed' || item.status === 'visa_successful' || item.status === 'approved') && (
        <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 10, padding: 16 }}>
          <h4 style={{ fontSize:13, fontWeight:700, marginBottom:8, color:'var(--color-success)', display: 'flex', alignItems: 'center', gap: 6 }}>
            ⭐ Share Your Feedback
          </h4>
          <p style={{ margin: '0 0 10px 0', fontSize:12, lineHeight: 1.4 }}>
            We'd love to hear about your experience! Please take a moment to submit a quick satisfaction rating.
          </p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button className="btn btn-success btn-sm" onClick={() => {
              setActiveTab('referrals');
            }}>
              Rate Our Service
            </button>
          </div>
        </div>
      )}

      {/* 4. Travelers / Co-Travelers Editor */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h4 style={{ fontSize:13, fontWeight:700, color:'var(--color-text-secondary)', margin: 0 }}>👥 Co-Travelers List</h4>
          {!editMode && (type === 'booking' ? item.status === 'pending' || item.edit_unlocked === 1 : item.status === 'submitted' || item.edit_unlocked === 1) && (
            <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => {
              setEditedTravelers(travelers.length > 0 ? travelers : [{ name: '', passport: '', email: '', phone: '', nationality: '' }]);
              setEditMode(true);
            }}>
              Edit Travelers
            </button>
          )}
        </div>

        {/* Lockout Notice */}
        {!(type === 'booking' ? item.status === 'pending' || item.edit_unlocked === 1 : item.status === 'submitted' || item.edit_unlocked === 1) && (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '8px 12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 6, border: '1px solid rgba(239, 68, 68, 0.15)' }}>
            <span>🔒 Co-travelers and applications are locked. If edits are needed, ask support to unlock editing.</span>
          </div>
        )}

        {editMode ? (
          <div style={{ background: 'var(--color-bg-alt)', padding: 16, borderRadius: 10, border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              {editedTravelers.map((t, idx) => (
                <div key={idx} style={{ background: 'var(--color-bg)', padding: 12, borderRadius: 8, border: '1px solid var(--color-border)', position: 'relative' }}>
                  <button type="button" onClick={() => setEditedTravelers(editedTravelers.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: 12 }}>
                    Remove
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, display: 'block', marginBottom: 2 }}>Name</label>
                      <input className="form-input" style={{ padding: '6px 10px', fontSize: 12 }} value={t.name || ''} onChange={e => {
                        const newT = [...editedTravelers];
                        newT[idx].name = e.target.value;
                        setEditedTravelers(newT);
                      }} placeholder="Name" />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, display: 'block', marginBottom: 2 }}>Passport No</label>
                      <input className="form-input" style={{ padding: '6px 10px', fontSize: 12 }} value={t.passport || ''} onChange={e => {
                        const newT = [...editedTravelers];
                        newT[idx].passport = e.target.value;
                        setEditedTravelers(newT);
                      }} placeholder="Passport" />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, display: 'block', marginBottom: 2 }}>Email</label>
                      <input className="form-input" style={{ padding: '6px 10px', fontSize: 12 }} value={t.email || ''} onChange={e => {
                        const newT = [...editedTravelers];
                        newT[idx].email = e.target.value;
                        setEditedTravelers(newT);
                      }} placeholder="Email" />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, display: 'block', marginBottom: 2 }}>Nationality</label>
                      <input className="form-input" style={{ padding: '6px 10px', fontSize: 12 }} value={t.nationality || ''} onChange={e => {
                        const newT = [...editedTravelers];
                        newT[idx].nationality = e.target.value;
                        setEditedTravelers(newT);
                      }} placeholder="Nationality" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditedTravelers([...editedTravelers, { name: '', passport: '', email: '', phone: '', nationality: '' }])}>
                + Add Traveler
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveTravelers}>Save List</button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {travelers.length > 0 ? travelers.map((t, i) => (
              <div key={i} style={{ background:'var(--color-bg)', padding:'8px 12px', borderRadius:6, fontSize:12, border:'1px solid var(--color-border)', flex: '1 1 200px' }}>
                <strong style={{ display: 'block' }}>{t.name || 'Traveler'}</strong>
                <div style={{ color:'var(--color-text-muted)', fontSize: 11, marginTop: 4 }}>
                  {t.passport && <span>Passport: {t.passport}</span>}
                  {t.email && <span style={{ marginLeft: 8 }}>Email: {t.email}</span>}
                  {t.nationality && <span style={{ marginLeft: 8 }}>({t.nationality})</span>}
                </div>
              </div>
            )) : (
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No additional travelers added.</span>
            )}
          </div>
        )}
      </div>

      {/* 5. Messages from Agent */}
      {comments.length > 0 && (
        <div>
          <h4 style={{ fontSize:13, fontWeight:700, marginBottom:8, color:'var(--color-text-secondary)' }}>💬 Messages from Agent</h4>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {comments.map((c, i) => (
              <div key={i} style={{ background:'rgba(16, 185, 129, 0.05)', padding:'10px 14px', borderRadius:8, fontSize:12, border:'1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontWeight:700, color:'var(--color-success)', marginBottom:4 }}>{c.agent_name} <span style={{ opacity:0.6, fontWeight:400, fontSize:10 }}>• {new Date(c.date).toLocaleString()}</span></div>
                <p style={{ margin:0, lineHeight:1.5 }}>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientPortalPage() {
  const { user, loading: authLoading, logout, updateProfile } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [docSubTab, setDocSubTab] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [visaApps, setVisaApps] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [countries, setCountries] = useState([]);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form states
  const [paymentRefs, setPaymentRefs] = useState({});
  const [profileForm, setProfileForm] = useState({ name:'', phone:'', nationality:'', passport_expiry:'' });
  const [msgInput, setMsgInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [uploadingChatFile, setUploadingChatFile] = useState(false);
  const chatFileInputRef = useRef(null);
  const msgEndRef = useRef(null);

  // Service request form
  const [srForm, setSrForm] = useState({
    service_type: '', country: '', name: '', email: '', phone: '',
    travelDate: '', duration: '', travelers: '1', budget: '',
    nationality: '', purpose: 'tourism', employment: 'employed',
    monthlyIncome: '', previousVisa: 'no', previousRejection: 'no',
    fromCity: '', toCity: '', flightClass: 'economy', tripType: 'return',
    notes: ''
  });
  const [submittingSR, setSubmittingSR] = useState(false);
  const [srSuccess, setSrSuccess] = useState(null);

  // Business Expansion Suite states
  const [referralStats, setReferralStats] = useState(null);
  const [refCodeInput, setRefCodeInput] = useState('');
  const [applyingRef, setApplyingRef] = useState(false);
  const [refSuccessMsg, setRefSuccessMsg] = useState('');
  const [refErrorMsg, setRefErrorMsg] = useState('');

  const [consultations, setConsultations] = useState([]);
  const [bookingConsultation, setBookingConsultation] = useState(false);
  const [submittingConsultation, setSubmittingConsultation] = useState(false);
  const [consForm, setConsForm] = useState({ title: 'Visa Consultation', scheduled_at: '', duration: 30, notes: '' });

  const [surveyForm, setSurveyForm] = useState({ ref: '', rating: 5, feedback: '' });
  const [submittingSurvey, setSubmittingSurvey] = useState(false);
  const [surveySuccess, setSurveySuccess] = useState(false);

  const [futureIntentForm, setFutureIntentForm] = useState({ destination: '', intended_travel_date: '', notes: '' });
  const [submittingFutureLead, setSubmittingFutureLead] = useState(false);
  const [futureLeadSuccess, setFutureLeadSuccess] = useState(false);

  const [signingFile, setSigningFile] = useState(null); // visa app or booking
  const [signatureType, setSignatureType] = useState('typed'); // 'typed' or 'drawn'
  const [typedSignature, setTypedSignature] = useState('');
  const [submittingSignature, setSubmittingSignature] = useState(false);

  const loadPortalData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [bookingsData, visaData, msgsData, notifsData, unreadMsgData, unreadNotifData, srData, ctryData, referralData, consultationsData] = await Promise.all([
        api.get('/bookings').catch(() => []),
        api.get('/visa/applications').catch(() => []),
        api.get('/messages').catch(() => []),
        api.get('/notifications').catch(() => []),
        api.get('/messages/unread-count').catch(() => ({ count:0 })),
        api.get('/notifications/unread-count').catch(() => ({ count:0 })),
        api.get('/service-requests').catch(() => []),
        api.get('/countries').catch(() => []),
        api.get('/business-suite/referrals/my-stats').catch(() => null),
        api.get('/business-suite/consultations').catch(() => []),
      ]);
      setBookings(bookingsData);
      setVisaApps(visaData);
      setMessages(msgsData);
      setNotifications(notifsData);
      setUnreadMsgs(unreadMsgData.count);
      setUnreadNotifs(unreadNotifData.count);
      setServiceRequests(Array.isArray(srData) ? srData : (srData.requests || []));
      setCountries(ctryData);
      setReferralStats(referralData);
      setConsultations(consultationsData);
    } catch (err) { console.error('Portal load error:', err); }
    finally { setLoading(false); }
  };

  const handleApplyReferral = async (e) => {
    e.preventDefault();
    if (!refCodeInput.trim()) return;
    setApplyingRef(true);
    setRefSuccessMsg('');
    setRefErrorMsg('');
    try {
      const data = await api.post('/business-suite/referrals/apply', { referral_code: refCodeInput.trim() });
      setRefSuccessMsg(data.message);
      setRefCodeInput('');
      await loadPortalData(true);
    } catch (err) {
      setRefErrorMsg(err.message || 'Failed to apply referral code.');
    } finally {
      setApplyingRef(false);
    }
  };

  const handleBookConsultation = async (e) => {
    e.preventDefault();
    if (!consForm.scheduled_at) return;
    setSubmittingConsultation(true);
    try {
      await api.post('/business-suite/consultations', consForm);
      setConsForm({ title: 'Visa Consultation', scheduled_at: '', duration: 30, notes: '' });
      await loadPortalData(true);
      alert('Consultation booked successfully!');
      setBookingConsultation(false);
    } catch (err) {
      alert(err.message || 'Failed to book consultation.');
    } finally {
      setSubmittingConsultation(false);
    }
  };

  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    setSubmittingSurvey(true);
    try {
      await api.post('/business-suite/surveys', surveyForm);
      setSurveySuccess(true);
      setSurveyForm({ ref: '', rating: 5, feedback: '' });
      setTimeout(() => setSurveySuccess(false), 5000);
    } catch (err) {
      alert(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingSurvey(false);
    }
  };

  const handleFutureLeadSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFutureLead(true);
    try {
      await api.post('/business-suite/future-leads', {
        name: user.name,
        email: user.email,
        phone: user.phone,
        destination: futureIntentForm.destination,
        intended_travel_date: futureIntentForm.intended_travel_date,
        notes: futureIntentForm.notes
      });
      setFutureLeadSuccess(true);
      setFutureIntentForm({ destination: '', intended_travel_date: '', notes: '' });
      setTimeout(() => setFutureLeadSuccess(false), 5000);
    } catch (err) {
      alert(err.message || 'Failed to register future travel.');
    } finally {
      setSubmittingFutureLead(false);
    }
  };

  const handleSignatureSubmit = async (e) => {
    e.preventDefault();
    if (signatureType === 'typed' && !typedSignature.trim()) return;
    setSubmittingSignature(true);
    try {
      const type = signingFile.app_ref ? 'visa' : 'bookings';
      const ref = signingFile.app_ref || signingFile.booking_ref;
      const signatureText = signatureType === 'typed' ? typedSignature : 'Drawn Signature (base64 placeholder)';
      
      await api.put(`/${type}/${signingFile.id}`, {
        signature_link: signatureText,
        signature_doc: `Agreement signed by ${user.name} on ${new Date().toLocaleDateString()}`,
        signed_document_url: `/uploads/signed-${ref}.pdf`
      });
      
      setSigningFile(null);
      setTypedSignature('');
      await loadPortalData(true);
      alert('Document signed successfully!');
    } catch (err) {
      alert(err.message || 'Failed to sign document.');
    } finally {
      setSubmittingSignature(false);
    }
  };

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name||'', phone: user.phone||'', nationality: user.nationality||'', passport_expiry: user.passport_expiry||'' });
      setSrForm(f => ({ ...f, name: user.name||'', email: user.email||'', phone: user.phone||'' }));
      loadPortalData();
    }
  }, [user]);

  useEffect(() => {
    if (!supabase || !user) return;

    const channel = supabase
      .channel(`portal-realtime-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        loadPortalData(true);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        loadPortalData(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'messages') {
      msgEndRef.current?.scrollIntoView({ behavior:'smooth' });
      api.put('/messages/read', {}).catch(() => {});
      setUnreadMsgs(0);
    }
  }, [activeTab, messages]);

  // Polling
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const data = await api.get('/messages/unread-count');
        setUnreadMsgs(data.count);
        if (activeTab === 'messages') {
          const msgsData = await api.get('/messages');
          setMessages(msgsData);
        }
      } catch {}
    }, 8000);
    return () => clearInterval(interval);
  }, [user, activeTab]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const handlePaymentSubmit = async (bookingId) => {
    const ref = paymentRefs[bookingId];
    if (!ref) return alert('Please enter your deposit transaction reference.');
    try {
      await api.post(`/bookings/${bookingId}/payment`, { paymentRef: ref });
      alert('Payment reference submitted! Admin will verify shortly.');
      setPaymentRefs({ ...paymentRefs, [bookingId]: '' });
      await loadPortalData();
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      alert('Booking cancelled.');
      await loadPortalData();
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const handleCancelRequest = async (id) => {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    try {
      await api.delete(`/service-requests/${id}`);
      alert('Request cancelled.');
      await loadPortalData();
    } catch (err) { alert('Failed to cancel request: ' + err.message); }
  };

  const handleDocumentUpload = async (e, visaAppId, docId = null) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploadingDoc(true);
      const fileData = await api.upload('/upload', formData);
      const app = visaApps.find(a => a.id === visaAppId);
      if (!app) return;
      
      const currentDocs = app.documents_json || [];
      let updatedDocs;
      if (docId) {
        // Specific requested document
        updatedDocs = currentDocs.map(d => d.id === docId ? { 
          ...d, 
          filename: fileData.filename, 
          url: fileData.url, 
          status: 'uploaded',
          uploaded_at: new Date().toISOString()
        } : d);
      } else {
        // Generic document upload
        updatedDocs = [...currentDocs, { filename: fileData.filename, url: fileData.url, is_requested: false }];
      }
      
      await api.put(`/visa/applications/${app.id}`, { documents: updatedDocs });
      await loadPortalData();
    } catch (err) { alert('Upload failed: ' + err.message); }
    finally { setUploadingDoc(false); }
  };

  const handleSendMessage = async () => {
    if (!msgInput.trim() || sendingMsg) return;
    try {
      setSendingMsg(true);
      await api.post('/messages', { message: msgInput.trim() });
      setMsgInput('');
      const msgsData = await api.get('/messages');
      setMessages(msgsData);
    } catch (err) { alert('Failed: ' + err.message); }
    finally { setSendingMsg(false); }
  };

  const handleAttachFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingChatFile(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('/upload', formData);
      
      // Send message immediately with the uploaded attachment
      await api.post('/messages', {
        message: '',
        attachment_url: res.url,
        attachment_name: res.filename,
        attachment_type: res.mimetype
      });
      
      // Refresh messages
      const msgsData = await api.get('/messages');
      setMessages(msgsData);
    } catch (err) {
      alert('Failed to upload file: ' + err.message);
    } finally {
      setUploadingChatFile(false);
      if (chatFileInputRef.current) chatFileInputRef.current.value = '';
    }
  };

  const handleMarkNotifsRead = async () => {
    await api.put('/notifications/read-all', {}).catch(() => {});
    setUnreadNotifs(0);
    setNotifications(n => n.map(x => ({ ...x, is_read: 1 })));
  };

  // Service Request Submit
  const handleSRSubmit = async (e) => {
    e.preventDefault();
    if (!srForm.service_type) return alert('Please select a service type.');
    if (!srForm.name || !srForm.email) return alert('Name and email are required.');

    try {
      setSubmittingSR(true);
      const details = {};

      // Build details based on service type
      if (srForm.service_type === 'visa') {
        Object.assign(details, {
          nationality: srForm.nationality, purpose: srForm.purpose,
          travelDate: srForm.travelDate, employment: srForm.employment,
          monthlyIncome: srForm.monthlyIncome, previousVisa: srForm.previousVisa,
          previousRejection: srForm.previousRejection,
        });
      } else if (srForm.service_type === 'flight') {
        Object.assign(details, {
          fromCity: srForm.fromCity, toCity: srForm.toCity,
          departDate: srForm.travelDate, returnDate: srForm.duration,
          passengers: srForm.travelers, flightClass: srForm.flightClass, tripType: srForm.tripType,
        });
      } else if (['holiday_package', 'hotel'].includes(srForm.service_type)) {
        Object.assign(details, {
          travelDate: srForm.travelDate, duration: srForm.duration,
          travelers: srForm.travelers, budget: srForm.budget,
        });
      } else {
        Object.assign(details, {
          travelDate: srForm.travelDate, travelers: srForm.travelers, budget: srForm.budget,
        });
      }

      if (srForm.notes) details.notes = srForm.notes;

      const result = await api.post('/service-requests', {
        name: srForm.name, email: srForm.email, phone: srForm.phone,
        service_type: srForm.service_type, country: srForm.country, details,
      });
      setSrSuccess(result.request);
      await loadPortalData();
    } catch (err) { alert('Failed: ' + err.message); }
    finally { setSubmittingSR(false); }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', paddingTop:'var(--nav-height)', flexDirection:'column', gap:16 }}>
        <div className="portal-spinner"/>
        <p className="text-muted" style={{ marginTop:16 }}>Authenticating...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', paddingTop:'var(--nav-height)', flexDirection:'column', gap:16 }}>
        <AlertCircle size={48} color="#f59e0b"/>
        <h2 className="heading-3">Login Required</h2>
        <p className="text-muted">Please log in or register to access your portal.</p>
        <Link to="/login" className="btn btn-primary">Login / Register</Link>
      </div>
    );
  }

  // Only documents that have actually been uploaded by the user (having a valid URL and filename)
  const uploadedDocs = visaApps.flatMap(v => 
    (v.documents_json || []).filter(d => d.url && d.filename).map(d => ({
      ...d,
      appRef: v.app_ref,
      country: v.country,
      type: 'User Upload'
    }))
  );

  // Official Documents provided by the portal (Invoices, Signed Agreements, Templates, Receipts)
  const officialDocs = [];
  visaApps.forEach(v => {
    if (v.invoice_url) {
      officialDocs.push({
        id: `inv-${v.id}`,
        name: 'Official Invoice',
        filename: `Invoice_${v.app_ref}.pdf`,
        url: v.invoice_url,
        appRef: v.app_ref,
        country: `Visa — ${v.country}`,
        type: 'Invoice'
      });
    }
    if (v.signature_doc) {
      officialDocs.push({
        id: `sig-tmpl-${v.id}`,
        name: 'Agreement Template',
        filename: `Agreement_Template_${v.app_ref}.pdf`,
        url: v.signature_doc,
        appRef: v.app_ref,
        country: `Visa — ${v.country}`,
        type: 'Agreement Template'
      });
    }
    if (v.signed_document_url) {
      officialDocs.push({
        id: `sig-signed-${v.id}`,
        name: 'Signed Agreement',
        filename: `Signed_Agreement_${v.app_ref}.pdf`,
        url: v.signed_document_url,
        appRef: v.app_ref,
        country: `Visa — ${v.country}`,
        type: 'Signed Contract'
      });
    }
    if (v.payment_proof) {
      officialDocs.push({
        id: `proof-${v.id}`,
        name: 'Payment Evidence',
        filename: `Payment_Proof_${v.app_ref}${v.payment_proof.substring(v.payment_proof.lastIndexOf('.')) || '.pdf'}`,
        url: v.payment_proof,
        appRef: v.app_ref,
        country: `Visa — ${v.country}`,
        type: 'Payment Evidence'
      });
    }
  });

  bookings.forEach(b => {
    if (b.invoice_url) {
      officialDocs.push({
        id: `inv-b-${b.id}`,
        name: 'Official Invoice',
        filename: `Invoice_${b.booking_ref}.pdf`,
        url: b.invoice_url,
        appRef: b.booking_ref,
        country: b.package_title || 'Package Booking',
        type: 'Invoice'
      });
    }
    if (b.signature_doc) {
      officialDocs.push({
        id: `sig-tmpl-b-${b.id}`,
        name: 'Agreement Template',
        filename: `Agreement_Template_${b.booking_ref}.pdf`,
        url: b.signature_doc,
        appRef: b.booking_ref,
        country: b.package_title || 'Package Booking',
        type: 'Agreement Template'
      });
    }
    if (b.signed_document_url) {
      officialDocs.push({
        id: `sig-signed-b-${b.id}`,
        name: 'Signed Agreement',
        filename: `Signed_Agreement_${b.booking_ref}.pdf`,
        url: b.signed_document_url,
        appRef: b.booking_ref,
        country: b.package_title || 'Package Booking',
        type: 'Signed Contract'
      });
    }
    if (b.payment_proof) {
      officialDocs.push({
        id: `proof-b-${b.id}`,
        name: 'Payment Evidence',
        filename: `Payment_Proof_${b.booking_ref}${b.payment_proof.substring(b.payment_proof.lastIndexOf('.')) || '.pdf'}`,
        url: b.payment_proof,
        appRef: b.booking_ref,
        country: b.package_title || 'Package Booking',
        type: 'Payment Evidence'
      });
    }
  });

  const guidebooks = [
    {
      id: 'guide-interview',
      name: 'Schengen Visa Interview Preparation Guide',
      filename: 'Schengen_Visa_Interview_Preparation_Guide.pdf',
      url: '/guides/Schengen_Visa_Interview_Preparation_Guide.pdf',
      appRef: 'N/A',
      country: 'Schengen Area',
      type: 'Guide'
    },
    {
      id: 'guide-checklist',
      name: 'Required Documents Checklist Guide',
      filename: 'Required_Documents_Checklist_Guide.pdf',
      url: '/guides/Required_Documents_Checklist_Guide.pdf',
      appRef: 'N/A',
      country: 'Schengen Area',
      type: 'Guide'
    },
    {
      id: 'tmpl-sponsorship',
      name: 'Sponsorship / Invitation Letter Template',
      filename: 'Sponsorship_Letter_Template.docx',
      url: '/guides/Sponsorship_Letter_Template.docx',
      appRef: 'N/A',
      country: 'Generic',
      type: 'Template'
    }
  ];

  const totalDocsCount = uploadedDocs.length + officialDocs.length + guidebooks.length;
  const allDocs = visaApps.flatMap(v => (v.documents_json || []).map(d => ({ ...d, appRef: v.app_ref, country: v.country })));

  const serviceTypeLabel = (t) => ({ visa:'Visa Service', holiday_package:'Holiday Package', flight:'Flight Booking', hotel:'Hotel Booking', consultation:'Consultation', other:'Other' }[t] || t);
  const serviceTypeIcon = (t) => ({ visa:Shield, holiday_package:Globe, flight:Plane, hotel:Hotel, consultation:Phone, other:HelpCircle }[t] || ClipboardList);

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-bg)', paddingTop:'var(--nav-height)' }}>
      <div style={{ display:'flex', maxWidth:1400, margin:'0 auto' }}>
        {/* Mobile toggle */}
        <button className="portal-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={20}/> <span>Menu</span></button>

        {/* Sidebar */}
        <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="portal-user-card">
            <div className="portal-avatar">{user.name?.[0] || 'U'}</div>
            <div style={{ fontWeight:600, fontSize:13 }}>{user.name}</div>
            <div className="text-muted" style={{ fontSize:11 }}>{user.email}</div>
          </div>
          <nav className="portal-nav">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                className={`portal-nav-item ${activeTab===tab.id ? 'active' : ''}`}>
                <tab.icon size={18}/>
                <span>{tab.label}</span>
                {tab.id === 'messages' && unreadMsgs > 0 && <span className="portal-badge">{unreadMsgs}</span>}
                {tab.id === 'notifications' && unreadNotifs > 0 && <span className="portal-badge">{unreadNotifs}</span>}
                {tab.id === 'my-requests' && serviceRequests.filter(r=>r.status==='new').length > 0 && <span className="portal-badge">{serviceRequests.filter(r=>r.status==='new').length}</span>}
              </button>
            ))}
            <div style={{ height:1, background:'var(--color-border)', margin:'8px 0' }}/>
            <button onClick={logout} className="portal-nav-item" style={{ color:'var(--color-danger)' }}>
              <LogOut size={18}/> <span>Sign Out</span>
            </button>
          </nav>
        </aside>
        {sidebarOpen && <div className="portal-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* Content */}
        <main style={{ flex:1, padding:'24px 32px', minHeight:'calc(100vh - var(--nav-height))' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:'100px 0' }}><div className="portal-spinner"/><p className="text-muted" style={{ marginTop:16 }}>Loading your portal...</p></div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}>

                {/* ===== DASHBOARD ===== */}
                {activeTab === 'dashboard' && (
                  <div>
                    <h1 className="heading-2" style={{ marginBottom:4 }}>Welcome back, {user.name?.split(' ')[0]}!</h1>
                    <p className="text-muted" style={{ marginBottom:24 }}>Here's an overview of your travel journey with us.</p>

                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:14, marginBottom:32 }}>
                      {[
                        { label:'Active Bookings', value:bookings.filter(b=>b.status!=='cancelled').length, icon:Package, color:'#0ea5e9' },
                        { label:'Visa Applications', value:visaApps.length, icon:FileText, color:'#d4a574' },
                        { label:'Service Requests', value:serviceRequests.length, icon:ClipboardList, color:'#6366f1' },
                        { label:'Documents', value:totalDocsCount, icon:Upload, color:'#10b981' },
                        { label:'Unread Messages', value:unreadMsgs, icon:MessageSquare, color:'#f59e0b' },
                      ].map((s,i) => (
                        <div key={i} className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:14 }}>
                          <div style={{ width:44, height:44, borderRadius:10, background:`${s.color}14`, color:s.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <s.icon size={20}/>
                          </div>
                          <div>
                            <div style={{ fontSize:22, fontWeight:800 }}>{s.value}</div>
                            <div className="text-muted" style={{ fontSize:11 }}>{s.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quick Actions */}
                    <h3 className="heading-4" style={{ marginBottom:12 }}>Quick Actions</h3>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:10, marginBottom:32 }}>
                      <button className="portal-action-btn" onClick={() => setActiveTab('request-service')}>
                        <ClipboardList size={20} color="#6366f1"/> Request a Service <ArrowRight size={14}/>
                      </button>
                      <Link to="/holiday-packages" className="portal-action-btn">
                        <Globe size={20} color="#d4a574"/> Browse Packages <ArrowRight size={14}/>
                      </Link>
                      <button className="portal-action-btn" onClick={() => setActiveTab('messages')}>
                        <MessageSquare size={20} color="#10b981"/> Chat with Us <ArrowRight size={14}/>
                      </button>
                      <button className="portal-action-btn" onClick={() => setActiveTab('documents')}>
                        <Upload size={20} color="#0ea5e9"/> Upload Documents <ArrowRight size={14}/>
                      </button>
                    </div>

                    {/* Recent Activity */}
                    <h3 className="heading-4" style={{ marginBottom:12 }}>Recent Activity</h3>
                    <div className="card" style={{ overflow:'hidden' }}>
                      {[...bookings, ...visaApps, ...serviceRequests].length > 0 ? (
                        [...bookings, ...visaApps, ...serviceRequests].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,6).map((item,i,arr) => (
                          <div key={i} style={{ padding:'12px 18px', borderBottom:i<arr.length-1?'1px solid var(--color-border)':'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                              <div style={{ width:34, height:34, borderRadius:8, background:item.booking_ref?'#0ea5e914':item.app_ref?'#d4a57414':'#6366f114', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                {item.booking_ref ? <Package size={15} color="#0ea5e9"/> : item.app_ref ? <FileText size={15} color="#d4a574"/> : <ClipboardList size={15} color="#6366f1"/>}
                              </div>
                              <div>
                                <div style={{ fontWeight:600, fontSize:13 }}>{item.package_title || (item.country ? `Visa — ${item.country}` : serviceTypeLabel(item.service_type))}</div>
                                <div className="text-muted" style={{ fontSize:11 }}>Ref: {item.booking_ref || item.app_ref || item.ref} · {new Date(item.created_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <StatusBadge status={item.status}/>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding:40, textAlign:'center', color:'var(--color-text-muted)' }}>
                          <Globe size={32} style={{ marginBottom:8, opacity:0.3 }}/>
                          <p>No activity yet. Start your travel journey today!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== MY BOOKINGS ===== */}
                {activeTab === 'bookings' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
                      <h1 className="heading-2">My Bookings</h1>
                      <Link to="/holiday-packages" className="btn btn-primary btn-sm"><Plus size={14}/> Book New Package</Link>
                    </div>
                    {bookings.length > 0 ? bookings.map((b,i) => (
                      <div key={i} className="card" style={{ padding:20, marginBottom:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:14 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                              <span style={{ fontWeight:700, fontSize:16 }}>{b.package_title}</span>
                              <StatusBadge status={b.status}/>
                            </div>
                            <div className="text-muted" style={{ fontSize:12, marginTop:6, display:'flex', gap:14, flexWrap:'wrap' }}>
                              <span><Calendar size={13} style={{ verticalAlign:'middle', marginRight:4 }}/>{b.travel_date || 'TBD'}</span>
                              <span><UsersIcon size={13} style={{ verticalAlign:'middle', marginRight:4 }}/>{b.travelers} traveller(s)</span>
                              <span style={{ fontFamily:'monospace', opacity:0.6 }}>#{b.booking_ref}</span>
                            </div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontWeight:800, fontSize:18, color:'var(--color-primary)' }}>£{b.total_price?.toLocaleString()}</div>
                            <div style={{ fontSize:11, marginTop:4 }}>Payment: <StatusBadge status={b.payment_status}/></div>
                          </div>
                        </div>

                        {b.payment_status === 'pending' && b.status !== 'cancelled' && (
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:14, padding:'12px 16px', background:'var(--color-bg)', borderRadius:8, flexWrap:'wrap' }}>
                            <div style={{ flex:1, minWidth:200 }}>
                              <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>💳 Pay by Bank Transfer</div>
                              <div style={{ fontSize:11, color:'var(--color-text-muted)' }}>Use booking ref <strong>{b.booking_ref}</strong> as payment reference</div>
                            </div>
                            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                              <input className="form-input" placeholder="Transaction ID" value={paymentRefs[b.id]||''} onChange={e => setPaymentRefs({...paymentRefs, [b.id]:e.target.value})} style={{ maxWidth:180, padding:'7px 12px', fontSize:13 }}/>
                              <button className="btn btn-primary btn-sm" onClick={() => handlePaymentSubmit(b.id)}><CheckCircle2 size={14}/> Submit</button>
                            </div>
                          </div>
                        )}
                        {b.payment_ref && (
                          <div style={{ marginTop:10, fontSize:12, color:'var(--color-text-muted)', background:'var(--color-bg)', padding:'8px 12px', borderRadius:8 }}>
                            ✅ Payment ref: <strong>{b.payment_ref}</strong>
                            {b.payment_status === 'paid' ? ' — Verified' : ' — Awaiting verification'}
                          </div>
                        )}
                        {!['cancelled','completed'].includes(b.status) && (
                          <div style={{ marginTop:10, display:'flex', justifyContent:'flex-end' }}>
                            <button className="btn btn-ghost btn-sm" style={{ color:'var(--color-danger)', fontSize:12 }} onClick={() => handleCancelBooking(b.id)}>Cancel Booking</button>
                          </div>
                        )}
                        {b.notes && (
                          <div style={{
                            background: 'var(--color-bg-alt)',
                            borderLeft: '4px solid var(--color-primary)',
                            borderRadius: '0 8px 8px 0',
                            padding: '14px 16px',
                            marginTop: 14,
                            marginBottom: 14,
                            borderTop: '1px solid var(--color-border)',
                            borderRight: '1px solid var(--color-border)',
                            borderBottom: '1px solid var(--color-border)',
                          }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                              <Shield size={14} color="var(--color-primary)"/>
                              <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--color-text)' }}>📌 Special Instructions & Notes</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.4, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
                              {b.notes}
                            </p>
                          </div>
                        )}

                        <PortalCaseExtensions item={b} type="booking" loadPortalData={loadPortalData} setSigningFile={setSigningFile} setActiveTab={setActiveTab} />
                      </div>
                    )) : (
                      <div className="card" style={{ padding:50, textAlign:'center' }}>
                        <Package size={40} color="var(--color-text-muted)" style={{ marginBottom:12, opacity:0.3 }}/>
                        <h3 className="heading-4">No Bookings Yet</h3>
                        <p className="text-muted" style={{ fontSize:13, margin:'8px 0 20px' }}>Browse our holiday packages and book your dream trip.</p>
                        <Link to="/holiday-packages" className="btn btn-primary">Explore Packages</Link>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== VISA APPLICATIONS ===== */}
                {activeTab === 'visa' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
                      <h1 className="heading-2">Visa Applications</h1>
                      <button className="btn btn-primary btn-sm" onClick={() => { setSrForm(f=>({...f, service_type:'visa'})); setActiveTab('request-service'); }}><Plus size={14}/> New Application</button>
                    </div>
                    {visaApps.length > 0 ? visaApps.map((v,i) => {
                      const isLocked = v.status !== 'submitted' && v.edit_unlocked !== 1;
                      return (
                        <div key={i} className="card" style={{ padding:20, marginBottom:14 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                            <div>
                              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                                <Shield size={18} color="#0ea5e9"/>
                                <span style={{ fontWeight:700 }}>Schengen Visa — {v.country}</span>
                                <StatusBadge status={v.status}/>
                              </div>
                              <div className="text-muted" style={{ fontSize:12, marginTop:4 }}>
                                ID: {v.app_ref} · Applied: {new Date(v.created_at).toLocaleDateString()} · Purpose: {v.purpose}
                              </div>
                            </div>
                          </div>

                          {/* Progress Timeline */}
                          <div className="portal-timeline">
                            {(() => {
                              const steps = ['Submitted', 'In Review', 'Docs Complete', 'Fee Processing', 'Embassy Submitted', 'Interview Scheduled', 'Decision'];
                              const statusStepMap = {
                                submitted: 0,
                                in_review: 1,
                                document_complete: 2,
                                fee_processing: 3,
                                embassy_submitted: 4,
                                interview_scheduled: 5,
                                approved: 6,
                                rejected: 6,
                                visa_successful: 6,
                                visa_refused: 6
                              };
                              const currentStep = statusStepMap[v.status] ?? 0;
                              return steps.map((step, j) => {
                                const done = currentStep >= j;
                                const isCurrent = currentStep === j;
                                const isRejected = j === 6 && ['rejected', 'visa_refused'].includes(v.status);
                                return (
                                  <div key={j} className="portal-timeline-step">
                                    <div className={`portal-timeline-dot ${done?'done':''} ${isCurrent?'current':''} ${isRejected?'rejected':''}`}>
                                      {done ? '✓' : j + 1}
                                    </div>
                                    <div className="portal-timeline-label" style={{ fontSize:11, fontWeight:600, color:done?'var(--color-text)':'var(--color-text-muted)', whiteSpace:'nowrap', marginTop:6 }}>{step}</div>
                                    {j < steps.length - 1 && <div className={`portal-timeline-line ${done && currentStep > j?'done':''}`}/>}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                          
                          {/* Agent Notes / Interview Scheduled details */}
                          {v.notes && (
                            <div style={{
                              background: v.status === 'interview_scheduled' ? 'rgba(139, 92, 246, 0.05)' : 'var(--color-bg-alt)',
                              borderLeft: `4px solid ${v.status === 'interview_scheduled' ? '#8b5cf6' : 'var(--color-secondary)'}`,
                              borderRadius: '0 8px 8px 0',
                              padding: '16px',
                              marginTop: 18,
                              marginBottom: 18,
                              borderTop: v.status === 'interview_scheduled' ? '1px solid rgba(139, 92, 246, 0.15)' : '1px solid var(--color-border)',
                              borderRight: v.status === 'interview_scheduled' ? '1px solid rgba(139, 92, 246, 0.15)' : '1px solid var(--color-border)',
                              borderBottom: v.status === 'interview_scheduled' ? '1px solid rgba(139, 92, 246, 0.15)' : '1px solid var(--color-border)',
                            }}>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                <Calendar size={16} color={v.status === 'interview_scheduled' ? '#8b5cf6' : 'var(--color-secondary)'}/>
                                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>
                                  {v.status === 'interview_scheduled' ? '📅 Official Interview Details & Schedule' : '📌 Important Note from your Visa Expert'}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
                                {v.notes}
                              </p>

                              {v.status === 'interview_scheduled' && (
                                <div style={{ marginTop: 14, borderTop: '1px solid rgba(139, 92, 246, 0.15)', paddingTop: 12 }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    💡 Preparation Checklist for Your Interview
                                  </div>
                                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <li>Carry all <strong>physical documents</strong> that you uploaded in the checklist below.</li>
                                    <li>Bring your <strong>original current Passport</strong> and any previous passports.</li>
                                    <li>Ensure you have the <strong>printed Visa Application Form</strong> signed.</li>
                                    <li>Be present at the Embassy/Visa Application Centre at least 15 minutes before your scheduled slot.</li>
                                    <li>Download and review our interview guide below for common questions and tips.</li>
                                  </ul>
                                  <div style={{ marginTop: 12 }}>
                                    <a href="/guides/Schengen_Visa_Interview_Preparation_Guide.pdf" download target="_blank" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#8b5cf6', color: 'white', border: 'none', padding: '6px 12px', fontSize: 11, borderRadius: 4, cursor: 'pointer' }}>
                                      <Download size={12}/> Download Interview Prep Guide (PDF)
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Official Provided Documents section in individual Visa application */}
                          {(v.invoice_url || v.signature_doc || v.signed_document_url || v.payment_proof) && (
                            <div style={{ marginTop: 14, background: 'rgba(15, 23, 42, 0.02)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 14 }}>
                              <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                                📂 Official Documents to Download
                              </h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                                {v.invoice_url && (
                                  <a href={v.invoice_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', gap: 8, fontSize: 12, padding: '8px 12px', height: 'auto', background: 'var(--color-bg)' }}>
                                    <FileText size={14} color="#10b981"/>
                                    <div style={{ textAlign: 'left' }}>
                                      <div style={{ fontWeight: 600 }}>Official Invoice</div>
                                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Click to View/Download</div>
                                    </div>
                                  </a>
                                )}
                                {v.signature_doc && (
                                  <a href={v.signature_doc} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', gap: 8, fontSize: 12, padding: '8px 12px', height: 'auto', background: 'var(--color-bg)' }}>
                                    <FileText size={14} color="#6366f1"/>
                                    <div style={{ textAlign: 'left' }}>
                                      <div style={{ fontWeight: 600 }}>Agreement Template</div>
                                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Click to View/Download</div>
                                    </div>
                                  </a>
                                )}
                                {v.signed_document_url && (
                                  <a href={v.signed_document_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', gap: 8, fontSize: 12, padding: '8px 12px', height: 'auto', background: 'var(--color-bg)' }}>
                                    <CheckCircle2 size={14} color="#10b981"/>
                                    <div style={{ textAlign: 'left' }}>
                                      <div style={{ fontWeight: 600 }}>Signed Agreement</div>
                                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>E-Signed Copy</div>
                                    </div>
                                  </a>
                                )}
                                {v.payment_proof && (
                                  <a href={v.payment_proof} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', gap: 8, fontSize: 12, padding: '8px 12px', height: 'auto', background: 'var(--color-bg)' }}>
                                    <FileText size={14} color="#0ea5e9"/>
                                    <div style={{ textAlign: 'left' }}>
                                      <div style={{ fontWeight: 600 }}>Payment Evidence</div>
                                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Uploaded receipt</div>
                                    </div>
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Documents */}
                          <div style={{ marginTop:14, paddingTop:14, borderTop:'1px dashed var(--color-border)' }}>
                            
                            {/* Document Completion Status Banner */}
                            {(() => {
                              const docs = v.documents_json || [];
                              const requestedDocs = docs.filter(d => d.is_requested);
                              const approvedDocs = requestedDocs.filter(d => d.status === 'approved');
                              const isComplete = requestedDocs.length > 0 && requestedDocs.every(d => d.status === 'approved');
                              
                              if (requestedDocs.length > 0) {
                                return (
                                  <div style={{ 
                                    background: isComplete ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                                    border: `1px dashed ${isComplete ? 'var(--color-success)' : 'var(--color-warning)'}`,
                                    borderRadius: 8,
                                    padding: '10px 14px',
                                    marginBottom: 16,
                                    fontSize: 12,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}>
                                    <div>
                                      <span style={{ fontWeight: 700 }}>
                                        {isComplete ? '🎉 All Documents Complete' : '⚠️ Action Required: Document Checklist'}
                                      </span>
                                      <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>
                                        {isComplete 
                                          ? 'All requested documents have been approved by your visa agent.' 
                                          : `${approvedDocs.length} of ${requestedDocs.length} requested documents approved.`
                                        }
                                      </div>
                                    </div>
                                    <span style={{ 
                                      fontWeight: 700, 
                                      color: isComplete ? 'var(--color-success)' : 'var(--color-warning)',
                                      fontSize: 11
                                    }}>
                                      {isComplete ? 'COMPLETE' : 'PENDING REVIEW'}
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            <h4 style={{ fontSize:13, fontWeight:600, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}><Upload size={14}/> Documents Checklist</h4>
                            
                            {(() => {
                              const docs = v.documents_json || [];
                              const genericDocs = docs.filter(d => !d.is_requested);
                              const requestedDocs = docs.filter(d => d.is_requested);
                              const passportDocs = requestedDocs.filter(d => d.name && d.name.toLowerCase().includes('passport'));
                              const otherChecklistDocs = requestedDocs.filter(d => !d.name || !d.name.toLowerCase().includes('passport'));

                              return (
                                <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:12 }}>
                                  {/* Passport Upload Section */}
                                  {passportDocs.length > 0 && (
                                    <div>
                                      <div style={{ fontSize:11, fontWeight:700, color:'var(--color-text-secondary)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.03em', display:'flex', alignItems:'center', gap:4 }}>
                                        <Shield size={12} color="#0ea5e9"/> Passport Section
                                      </div>
                                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                        {passportDocs.map((doc, dIdx) => (
                                          <div key={`pass-${dIdx}`} style={{ 
                                            background: 'rgba(14, 165, 233, 0.03)', 
                                            padding: '12px 14px', 
                                            borderRadius: 8, 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '12px',
                                            border: '1px solid rgba(14, 165, 233, 0.15)'
                                          }}>
                                            <div style={{ fontSize: 12 }}>
                                              <div style={{ fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                {doc.name}
                                                <span style={{ fontSize: 10, background: 'rgba(14, 165, 233, 0.08)', color: '#0ea5e9', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                                  👤 {doc.traveler_name || 'Primary Applicant'}
                                                </span>
                                              </div>
                                              {doc.filename && (
                                                <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'var(--color-secondary)', display:'inline-block', marginTop:2, fontWeight:600 }}>
                                                  Uploaded: {doc.filename}
                                                </a>
                                              )}
                                              {doc.feedback && doc.status === 'rejected' && (
                                                <div style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 2 }}>
                                                  Feedback: {doc.feedback}
                                                </div>
                                              )}
                                            </div>
                                            <div>
                                              {['pending_upload', 'rejected'].includes(doc.status) ? (
                                                isLocked ? (
                                                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    🔒 Locked
                                                  </span>
                                                ) : (
                                                  <label className="btn btn-outline btn-sm" style={{ cursor:'pointer', padding:'4px 10px', fontSize:11, borderColor:'#0ea5e9', color:'#0ea5e9' }}>
                                                    <Upload size={12}/> {uploadingDoc ? '...' : (doc.status === 'rejected' ? 'Re-upload' : 'Upload Passport')}
                                                    <input type="file" disabled={uploadingDoc} onChange={(e) => handleDocumentUpload(e, v.id, doc.id)} style={{ display:'none' }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"/>
                                                  </label>
                                                )
                                              ) : (
                                                <StatusBadge status={doc.status} />
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Other Required Documents */}
                                  {otherChecklistDocs.length > 0 && (
                                    <div>
                                      <div style={{ fontSize:11, fontWeight:700, color:'var(--color-text-secondary)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.03em', display:'flex', alignItems:'center', gap:4 }}>
                                        <FileText size={12} color="#6366f1"/> Other Required Documents
                                      </div>
                                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                        {otherChecklistDocs.map((doc, dIdx) => (
                                          <div key={`other-${dIdx}`} style={{ 
                                            background: 'var(--color-bg-alt)', 
                                            padding: 10, 
                                            borderRadius: 8, 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '12px',
                                            border: '1px solid var(--color-border)'
                                          }}>
                                            <div style={{ fontSize: 12 }}>
                                              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                {doc.name}
                                                <span style={{ fontSize: 10, background: 'rgba(14, 165, 233, 0.08)', color: '#0ea5e9', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                                  👤 {doc.traveler_name || 'Primary Applicant'}
                                                </span>
                                              </div>
                                              {doc.filename && (
                                                <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'var(--color-secondary)', display:'inline-block', marginTop:2 }}>
                                                  Uploaded: {doc.filename}
                                                </a>
                                              )}
                                              {doc.feedback && doc.status === 'rejected' && (
                                                <div style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 2 }}>
                                                  Feedback: {doc.feedback}
                                                </div>
                                              )}
                                            </div>
                                            <div>
                                              {['pending_upload', 'rejected'].includes(doc.status) ? (
                                                isLocked ? (
                                                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    🔒 Locked
                                                  </span>
                                                ) : (
                                                  <label className="btn btn-outline btn-sm" style={{ cursor:'pointer', padding:'3px 8px', fontSize:11 }}>
                                                    <Upload size={12}/> {uploadingDoc ? '...' : (doc.status === 'rejected' ? 'Re-upload' : 'Upload')}
                                                    <input type="file" disabled={uploadingDoc} onChange={(e) => handleDocumentUpload(e, v.id, doc.id)} style={{ display:'none' }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"/>
                                                  </label>
                                                )
                                              ) : (
                                                <StatusBadge status={doc.status} />
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Generic list */}
                                  {genericDocs.length > 0 && (
                                    <div>
                                      <div style={{ fontSize:11, fontWeight:700, color:'var(--color-text-secondary)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.03em' }}>Supporting Documents</div>
                                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                                        {genericDocs.map((doc, dIdx) => (
                                          <a key={`gen-${dIdx}`} href={doc.url} target="_blank" rel="noreferrer" className="portal-doc-chip" style={{ background:'var(--color-bg)', padding:'6px 10px', borderRadius:20, fontSize:12, textDecoration:'none', color:'var(--color-text)', border:'1px solid var(--color-border)', display:'inline-flex', alignItems:'center', gap:4 }}>
                                            <CheckCircle2 size={12} color="#10b981"/> {doc.filename}
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            {!isLocked ? (
                              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                <label className="btn btn-outline btn-sm" style={{ cursor:'pointer' }}>
                                  <Upload size={14}/> {uploadingDoc ? 'Uploading...' : 'Upload General Doc'}
                                  <input type="file" disabled={uploadingDoc} onChange={(e) => handleDocumentUpload(e, v.id)} style={{ display:'none' }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"/>
                                </label>
                                <span style={{ fontSize:11, color:'var(--color-text-muted)' }}>PDF, JPG, PNG · Max 10MB</span>
                              </div>
                            ) : (
                              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                🔒 Uploading documents is locked for this application.
                              </div>
                            )}
                          </div>

                          <PortalCaseExtensions item={v} type="visa" loadPortalData={loadPortalData} setSigningFile={setSigningFile} setActiveTab={setActiveTab} />
                        </div>
                      );
                    }) : (
                      <div className="card" style={{ padding:50, textAlign:'center' }}>
                        <Shield size={40} color="var(--color-text-muted)" style={{ marginBottom:12, opacity:0.3 }}/>
                        <h3 className="heading-4">No Visa Applications</h3>
                        <p className="text-muted" style={{ fontSize:13, margin:'8px 0 20px' }}>Apply for your Schengen visa right here in the portal.</p>
                        <button className="btn btn-primary" onClick={() => { setSrForm(f=>({...f, service_type:'visa'})); setActiveTab('request-service'); }}>Start Application</button>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== REQUEST A SERVICE ===== */}
                {activeTab === 'request-service' && (
                  <div>
                    <h1 className="heading-2" style={{ marginBottom:4 }}>Request a Service</h1>
                    <p className="text-muted" style={{ marginBottom:24 }}>Tell us what you need and our team will get back to you within 24 hours.</p>

                    {srSuccess ? (
                      <div className="card" style={{ padding:40, textAlign:'center' }}>
                        <CheckCircle2 size={56} color="#10b981" style={{ marginBottom:16 }}/>
                        <h2 className="heading-3">Request Submitted!</h2>
                        <p className="text-muted" style={{ margin:'8px auto 16px', maxWidth:450 }}>
                          Your request <strong>{srSuccess.ref}</strong> has been submitted. Our team will review it within 24 hours.
                        </p>
                        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
                          <button className="btn btn-primary" onClick={() => { setSrSuccess(null); setActiveTab('my-requests'); }}>View Requests</button>
                          <button className="btn btn-outline" onClick={() => setSrSuccess(null)}>Submit Another</button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSRSubmit}>
                        {/* Step 1: Service Type */}
                        <div className="card" style={{ padding:20, marginBottom:16 }}>
                          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>🎯 What do you need?</h3>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:10 }}>
                            {[
                              { id:'visa', label:'Visa Service', icon:Shield, color:'#0ea5e9' },
                              { id:'holiday_package', label:'Holiday Package', icon:Globe, color:'#10b981' },
                              { id:'flight', label:'Flight Booking', icon:Plane, color:'#6366f1' },
                              { id:'hotel', label:'Hotel Booking', icon:Hotel, color:'#d4a574' },
                              { id:'consultation', label:'Consultation', icon:Phone, color:'#f59e0b' },
                              { id:'other', label:'Other', icon:HelpCircle, color:'#94a3b8' },
                            ].map(s => (
                              <button type="button" key={s.id} onClick={() => setSrForm({...srForm, service_type:s.id})} style={{
                                padding:'16px 14px', borderRadius:10, border:`2px solid ${srForm.service_type===s.id ? s.color : 'var(--color-border)'}`,
                                background:srForm.service_type===s.id ? `${s.color}08` : 'var(--color-surface)',
                                cursor:'pointer', textAlign:'center', transition:'all 0.2s'
                              }}>
                                <s.icon size={24} color={s.color} style={{ marginBottom:6 }}/>
                                <div style={{ fontWeight:600, fontSize:12 }}>{s.label}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {srForm.service_type && (
                          <div className="card" style={{ padding:20, marginBottom:16 }}>
                            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>📝 Details</h3>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                              {/* Country selector (visa, holiday, hotel) */}
                              {['visa','holiday_package','hotel'].includes(srForm.service_type) && (
                                <div className="form-group">
                                  <label className="form-label">Destination Country {srForm.service_type==='visa'?'*':''}</label>
                                  <select className="form-input form-select" value={srForm.country} onChange={e=>setSrForm({...srForm,country:e.target.value})} required={srForm.service_type==='visa'}>
                                    <option value="">Select country...</option>
                                    {countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                  </select>
                                </div>
                              )}

                              {/* Visa-specific fields */}
                              {srForm.service_type === 'visa' && (<>
                                <div className="form-group">
                                  <label className="form-label">Your Nationality *</label>
                                  <input className="form-input" placeholder="e.g. Pakistani, Indian" value={srForm.nationality} onChange={e=>setSrForm({...srForm,nationality:e.target.value})} required/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Purpose of Visit</label>
                                  <select className="form-input form-select" value={srForm.purpose} onChange={e=>setSrForm({...srForm,purpose:e.target.value})}>
                                    {['tourism','business','family','medical','study'].map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                                  </select>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Planned Travel Date</label>
                                  <input className="form-input" type="date" value={srForm.travelDate} onChange={e=>setSrForm({...srForm,travelDate:e.target.value})}/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Employment Status</label>
                                  <select className="form-input form-select" value={srForm.employment} onChange={e=>setSrForm({...srForm,employment:e.target.value})}>
                                    {['employed','self-employed','student','retired','unemployed'].map(e=><option key={e} value={e}>{e.charAt(0).toUpperCase()+e.slice(1)}</option>)}
                                  </select>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Monthly Income (GBP)</label>
                                  <input className="form-input" type="number" placeholder="e.g. 2500" value={srForm.monthlyIncome} onChange={e=>setSrForm({...srForm,monthlyIncome:e.target.value})}/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Previous Schengen Visa?</label>
                                  <select className="form-input form-select" value={srForm.previousVisa} onChange={e=>setSrForm({...srForm,previousVisa:e.target.value})}>
                                    <option value="yes">Yes</option><option value="no">No</option>
                                  </select>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Any Previous Rejection?</label>
                                  <select className="form-input form-select" value={srForm.previousRejection} onChange={e=>setSrForm({...srForm,previousRejection:e.target.value})}>
                                    <option value="no">No</option><option value="yes">Yes</option>
                                  </select>
                                </div>
                              </>)}

                              {/* Flight-specific fields */}
                              {srForm.service_type === 'flight' && (<>
                                <div className="form-group">
                                  <label className="form-label">From City *</label>
                                  <input className="form-input" placeholder="e.g. London" value={srForm.fromCity} onChange={e=>setSrForm({...srForm,fromCity:e.target.value})} required/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">To City *</label>
                                  <input className="form-input" placeholder="e.g. Paris" value={srForm.toCity} onChange={e=>setSrForm({...srForm,toCity:e.target.value})} required/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Departure Date *</label>
                                  <input className="form-input" type="date" value={srForm.travelDate} onChange={e=>setSrForm({...srForm,travelDate:e.target.value})} required/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Return Date</label>
                                  <input className="form-input" type="date" value={srForm.duration} onChange={e=>setSrForm({...srForm,duration:e.target.value})}/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Passengers</label>
                                  <input className="form-input" type="number" min="1" value={srForm.travelers} onChange={e=>setSrForm({...srForm,travelers:e.target.value})}/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Class</label>
                                  <select className="form-input form-select" value={srForm.flightClass} onChange={e=>setSrForm({...srForm,flightClass:e.target.value})}>
                                    {['economy','premium_economy','business','first'].map(c=><option key={c} value={c}>{c.replace('_',' ').split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ')}</option>)}
                                  </select>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Trip Type</label>
                                  <select className="form-input form-select" value={srForm.tripType} onChange={e=>setSrForm({...srForm,tripType:e.target.value})}>
                                    <option value="return">Return</option><option value="one_way">One Way</option><option value="multi_city">Multi City</option>
                                  </select>
                                </div>
                              </>)}

                              {/* Package/Hotel fields */}
                              {['holiday_package','hotel'].includes(srForm.service_type) && (<>
                                <div className="form-group">
                                  <label className="form-label">Travel Date</label>
                                  <input className="form-input" type="date" value={srForm.travelDate} onChange={e=>setSrForm({...srForm,travelDate:e.target.value})}/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Duration</label>
                                  <input className="form-input" placeholder="e.g. 5 days" value={srForm.duration} onChange={e=>setSrForm({...srForm,duration:e.target.value})}/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Travellers</label>
                                  <input className="form-input" type="number" min="1" value={srForm.travelers} onChange={e=>setSrForm({...srForm,travelers:e.target.value})}/>
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Budget (£)</label>
                                  <input className="form-input" type="number" placeholder="e.g. 1500" value={srForm.budget} onChange={e=>setSrForm({...srForm,budget:e.target.value})}/>
                                </div>
                              </>)}

                              {/* Consultation / Other minimal fields */}
                              {['consultation','other'].includes(srForm.service_type) && (
                                <div className="form-group" style={{ gridColumn:'span 2' }}>
                                  <label className="form-label">What do you need help with?</label>
                                  <textarea className="form-input form-textarea" placeholder="Describe what you're looking for..." value={srForm.notes} onChange={e=>setSrForm({...srForm,notes:e.target.value})} rows={4}/>
                                </div>
                              )}
                            </div>

                            {/* Common notes field (except consultation/other which already have it) */}
                            {!['consultation','other'].includes(srForm.service_type) && (
                              <div className="form-group" style={{ marginTop:14 }}>
                                <label className="form-label">Additional Notes</label>
                                <textarea className="form-input form-textarea" placeholder="Any special requirements or preferences..." value={srForm.notes} onChange={e=>setSrForm({...srForm,notes:e.target.value})} rows={3}/>
                              </div>
                            )}
                          </div>
                        )}

                        {srForm.service_type && (
                          <div style={{ display:'flex', gap:12, alignItems:'center', marginTop:4 }}>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={submittingSR}>
                              {submittingSR ? 'Submitting...' : <><Send size={16}/> Submit Request</>}
                            </button>
                            <span style={{ fontSize:12, color:'var(--color-text-muted)' }}>Free consultation included · No fees until you proceed</span>
                          </div>
                        )}
                      </form>
                    )}

                    {/* ===== FUTURE TRAVEL INTEREST CHECK-IN ===== */}
                    <div className="card" style={{ padding:24, marginTop:24, border:'1px solid var(--color-border)', borderTop:'3px solid var(--color-secondary)' }}>
                      <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
                        📅 Planning Future Travel?
                      </h3>
                      <p className="text-muted" style={{ fontSize:12, marginBottom:16 }}>
                        Not traveling immediately? Save your intended future travel dates and destinations. We'll set a reminder to contact you at the perfect time to start planning!
                      </p>
                      {futureLeadSuccess ? (
                        <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', padding:'12px 16px', borderRadius:8, color:'var(--color-success)', fontSize:13 }}>
                          Future travel plans registered! We'll keep track and get back to you at the right time.
                        </div>
                      ) : (
                        <form onSubmit={handleFutureLeadSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                            <div className="form-group">
                              <label className="form-label">Destination Country / City</label>
                              <input className="form-input" placeholder="e.g. France, Tokyo" value={futureIntentForm.destination} onChange={e => setFutureIntentForm({ ...futureIntentForm, destination: e.target.value })} required/>
                            </div>
                            <div className="form-group">
                              <label className="form-label">Intended Travel Date</label>
                              <input type="date" className="form-input" value={futureIntentForm.intended_travel_date} onChange={e => setFutureIntentForm({ ...futureIntentForm, intended_travel_date: e.target.value })} required/>
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Specific requests or notes for this future trip</label>
                            <textarea className="form-input" rows="2" placeholder="Tell us what you'd like to do or any milestones you're waiting for..." value={futureIntentForm.notes} onChange={e => setFutureIntentForm({ ...futureIntentForm, notes: e.target.value })}/>
                          </div>
                          <button type="submit" className="btn btn-secondary btn-sm" style={{ alignSelf:'flex-start' }} disabled={submittingFutureLead}>
                            Register Future Plan
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== MY REQUESTS ===== */}
                {activeTab === 'my-requests' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
                      <h1 className="heading-2">My Requests ({serviceRequests.length})</h1>
                      <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('request-service')}><Plus size={14}/> New Request</button>
                    </div>
                    {serviceRequests.length > 0 ? serviceRequests.map((sr,i) => {
                      const Icon = serviceTypeIcon(sr.service_type);
                      const steps = ['Submitted','Accepted','In Progress','Completed'];
                      const statusToStep = { new:0, accepted:1, in_progress:2, completed:3, rejected:3 };
                      const currentStep = statusToStep[sr.status] ?? 0;
                      return (
                        <div key={i} className="card" style={{ padding:20, marginBottom:14 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                              <div style={{ width:40, height:40, borderRadius:10, background:'#6366f114', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <Icon size={18} color="#6366f1"/>
                              </div>
                              <div>
                                <div style={{ fontWeight:700, fontSize:14 }}>{serviceTypeLabel(sr.service_type)} {sr.country && `— ${sr.country}`}</div>
                                <div className="text-muted" style={{ fontSize:11 }}>Ref: {sr.ref} · {new Date(sr.created_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <StatusBadge status={sr.status}/>
                              {sr.status === 'new' && (
                                <button 
                                  className="btn btn-outline btn-sm" 
                                  style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                                  onClick={() => handleCancelRequest(sr.id)}
                                >
                                  Cancel Request
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Progress bar */}
                          {sr.status !== 'rejected' && (
                            <div style={{ display:'flex', alignItems:'center', gap:0, marginTop:16, padding:'0 4px' }}>
                              {steps.map((step,j) => (
                                <div key={j} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
                                  <div style={{
                                    width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                                    fontSize:11, fontWeight:700, zIndex:1,
                                    background: j <= currentStep ? '#6366f1' : 'var(--color-border)',
                                    color: j <= currentStep ? 'white' : 'var(--color-text-muted)',
                                  }}>{j <= currentStep ? '✓' : j+1}</div>
                                  <div style={{ fontSize:10, marginTop:4, fontWeight:600, color: j<=currentStep ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{step}</div>
                                  {j < steps.length - 1 && (
                                    <div style={{ position:'absolute', top:13, left:'50%', width:'100%', height:2, background: j < currentStep ? '#6366f1' : 'var(--color-border)', zIndex:0 }}/>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {sr.status === 'rejected' && (
                            <div style={{ marginTop:12, padding:'8px 14px', background:'#ef444414', borderRadius:8, fontSize:13, color:'#ef4444', fontWeight:600 }}>
                              ❌ This request was declined. Please contact support for more details.
                            </div>
                          )}
                        </div>
                      );
                    }) : (
                      <div className="card" style={{ padding:50, textAlign:'center' }}>
                        <ClipboardList size={40} color="var(--color-text-muted)" style={{ marginBottom:12, opacity:0.3 }}/>
                        <h3 className="heading-4">No Requests Yet</h3>
                        <p className="text-muted" style={{ fontSize:13, margin:'8px 0 20px' }}>Submit a service request and track its progress here.</p>
                        <button className="btn btn-primary" onClick={() => setActiveTab('request-service')}>Request a Service</button>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== DOCUMENTS ===== */}
                {activeTab === 'documents' && (
                  <div>
                    <h1 className="heading-2" style={{ marginBottom:24 }}>My Documents</h1>
                    
                    {/* Pills Category Filters */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                      {[
                        { id: 'all', label: 'All Files', count: totalDocsCount },
                        { id: 'uploaded', label: 'Uploaded by You', count: uploadedDocs.length },
                        { id: 'official', label: 'Official Documents', count: officialDocs.length },
                        { id: 'guides', label: 'Guides & Templates', count: guidebooks.length }
                      ].map(subTab => (
                        <button
                          key={subTab.id}
                          onClick={() => setDocSubTab(subTab.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            border: '1px solid var(--color-border)',
                            background: docSubTab === subTab.id ? 'var(--color-primary)' : 'var(--color-bg)',
                            color: docSubTab === subTab.id ? 'white' : 'var(--color-text)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <span>{subTab.label}</span>
                          <span style={{
                            fontSize: '11px',
                            background: docSubTab === subTab.id ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                            padding: '2px 7px',
                            borderRadius: '10px',
                            color: docSubTab === subTab.id ? 'white' : 'var(--color-text-muted)'
                          }}>{subTab.count}</span>
                        </button>
                      ))}
                    </div>

                    {(() => {
                      const currentDocs = docSubTab === 'uploaded' ? uploadedDocs :
                                          docSubTab === 'official' ? officialDocs :
                                          docSubTab === 'guides' ? guidebooks :
                                          [...uploadedDocs, ...officialDocs, ...guidebooks];

                      if (currentDocs.length > 0) {
                        return (
                          <div className="card" style={{ overflow:'hidden' }}>
                            <table style={{ width:'100%', borderCollapse:'collapse' }}>
                              <thead>
                                <tr style={{ background:'var(--color-bg)' }}>
                                  {['File Name','Type','Ref Code','Category / Scope','Actions'].map(h => (
                                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--color-text-muted)', textTransform:'uppercase' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {currentDocs.map((doc, i) => (
                                  <tr key={doc.id || i} style={{ borderTop:'1px solid var(--color-border)' }}>
                                    <td style={{ padding:'12px 16px', fontSize:13, fontWeight: 600 }}>
                                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                        <FileText size={16} color={doc.type === 'Guide' || doc.type === 'Template' ? '#8b5cf6' : doc.type === 'Invoice' ? '#10b981' : '#0ea5e9'}/>
                                        <div>
                                          <div>{doc.name || doc.filename}</div>
                                          <div className="text-muted" style={{ fontSize:11, fontWeight: 400 }}>{doc.filename}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding:'12px 16px', fontSize:12 }}>
                                      <span style={{
                                        background: doc.type === 'User Upload' ? 'rgba(14, 165, 233, 0.08)' :
                                                    doc.type === 'Invoice' ? 'rgba(16, 185, 129, 0.08)' :
                                                    doc.type === 'Signed Contract' ? 'rgba(16, 185, 129, 0.08)' :
                                                    doc.type === 'Agreement Template' ? 'rgba(99, 102, 241, 0.08)' :
                                                    'rgba(139, 92, 246, 0.08)',
                                        color: doc.type === 'User Upload' ? '#0ea5e9' :
                                               doc.type === 'Invoice' ? '#10b981' :
                                               doc.type === 'Signed Contract' ? '#10b981' :
                                               doc.type === 'Agreement Template' ? '#6366f1' :
                                               '#8b5cf6',
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        fontWeight: 600
                                      }}>{doc.type}</span>
                                    </td>
                                    <td style={{ padding:'12px 16px', fontSize:13, fontFamily:'monospace' }}>{doc.appRef || 'N/A'}</td>
                                    <td style={{ padding:'12px 16px', fontSize:13 }}>{doc.country}</td>
                                    <td style={{ padding:'12px 16px' }}>
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                          <Eye size={12}/> View
                                        </a>
                                        <a href={doc.url} download={doc.filename} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', fontSize: 11 }}>
                                          <Download size={12}/> Download
                                        </a>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      return (
                        <div className="card" style={{ padding:50, textAlign:'center', border:'2px dashed var(--color-border)' }}>
                          <Upload size={48} color="var(--color-text-muted)" style={{ marginBottom:12, opacity:0.3 }}/>
                          <h3 className="heading-4">No Files Found</h3>
                          <p className="text-muted" style={{ fontSize:13, margin:'8px auto 20px', maxWidth:400 }}>
                            {docSubTab === 'uploaded' ? 'You have not uploaded any checklist documents yet.' :
                             docSubTab === 'official' ? 'No invoices or agreements have been issued yet.' :
                             'No guides or templates are available at this moment.'}
                          </p>
                          {(docSubTab === 'uploaded' || docSubTab === 'all') && (
                            <button className="btn btn-outline" onClick={() => setActiveTab('visa')}>Go to Visa Applications</button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ===== SUPPORT CHAT ===== */}
                {activeTab === 'messages' && (
                  <div>
                    <h1 className="heading-2" style={{ marginBottom:24 }}>Support Chat</h1>
                    <div className="card" style={{ overflow:'hidden', display:'flex', flexDirection:'column', height:500 }}>
                      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#0ea5e9,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <MessageSquare size={15} color="white"/>
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13 }}>
                            {user.assigned_name ? `Support (Agent: ${user.assigned_name})` : 'Borderless Trips Support'}
                          </div>
                          <div style={{ fontSize:11, color:'#10b981', display:'flex', alignItems:'center', gap:4 }}>
                            <span style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', display:'inline-block' }}/> Online
                          </div>
                        </div>
                      </div>
                      <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12, background:'var(--color-bg)' }}>
                        {messages.length === 0 && (
                          <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--color-text-muted)' }}>
                            <MessageSquare size={32} style={{ opacity:0.3, marginBottom:8 }}/>
                            <p style={{ fontSize:13 }}>No messages yet. Start a conversation!</p>
                          </div>
                        )}
                        {messages.map((msg,i) => {
                          const isSelf = msg.sender === 'customer';
                          const hasAttachment = !!msg.attachment_url;
                          const isImage = hasAttachment && msg.attachment_type && msg.attachment_type.toLowerCase().startsWith('image/');
                          return (
                            <div key={i} style={{ display:'flex', justifyContent:isSelf?'flex-end':'flex-start', gap:8, alignItems:'flex-start' }}>
                              {!isSelf && (
                                <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:10, flexShrink:0, marginTop:2 }}>
                                  {user.assigned_name?.[0] || 'A'}
                                </div>
                              )}
                              <div style={{
                                maxWidth:'70%', padding:'10px 14px', borderRadius:14, fontSize:13, lineHeight:1.5,
                                background:isSelf?'linear-gradient(135deg, #0ea5e9, #0284c7)':'var(--color-surface)',
                                color:isSelf?'white':'var(--color-text)',
                                boxShadow:'0 1px 2px rgba(0,0,0,0.05)',
                                border:isSelf?'none':'1px solid var(--color-border)',
                                borderBottomRightRadius:isSelf?4:14,
                                borderBottomLeftRadius:isSelf?14:4,
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
                                  {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </div>
                              </div>
                              {isSelf && (
                                <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#0ea5e9,#06b6d4)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:10, flexShrink:0, marginTop:2 }}>
                                  {user.name?.[0] || 'C'}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <div ref={msgEndRef}/>
                      </div>
                      <div style={{ display:'flex', gap:6, padding:'8px 12px', borderTop:'1px solid var(--color-border)', alignItems:'center' }}>
                        <input type="file" ref={chatFileInputRef} onChange={handleAttachFile} style={{ display:'none' }} />
                        <button className="btn btn-outline btn-icon" onClick={() => chatFileInputRef.current?.click()} disabled={uploadingChatFile || sendingMsg} style={{ flexShrink:0, width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center' }} title="Attach image or file">
                          {uploadingChatFile ? (
                            <div className="spinner-border" style={{ width:16, height:16, border:'2px solid var(--color-secondary)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
                          ) : (
                            <Paperclip size={16}/>
                          )}
                        </button>
                        <input
                          className="form-input"
                          placeholder={uploadingChatFile ? "Uploading attachment..." : "Type your message..."}
                          value={msgInput}
                          onChange={e => setMsgInput(e.target.value)}
                          onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                          style={{ flex:1, border:'none', background:'transparent', padding:'8px 14px' }}
                          disabled={uploadingChatFile}
                        />
                        <button className="btn btn-primary btn-icon" onClick={handleSendMessage} disabled={sendingMsg || uploadingChatFile || (!msgInput.trim())} style={{ flexShrink:0, width:40, height:40 }}>
                          <Send size={16}/>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== NOTIFICATIONS ===== */}
                {activeTab === 'notifications' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                      <h1 className="heading-2">Notifications</h1>
                      {notifications.some(n => !n.is_read) && (
                        <button className="btn btn-ghost btn-sm" onClick={handleMarkNotifsRead}>Mark all as read</button>
                      )}
                    </div>
                    {notifications.length > 0 ? (
                      <div className="card" style={{ overflow:'hidden' }}>
                        {notifications.map((n,i) => (
                          <div key={i} style={{
                            padding:'14px 18px', borderBottom:i<notifications.length-1?'1px solid var(--color-border)':'none',
                            display:'flex', gap:12, alignItems:'flex-start',
                            background:n.is_read ? 'transparent' : 'rgba(14,165,233,0.03)'
                          }}>
                            <div style={{ width:34, height:34, borderRadius:'50%', background:n.is_read?'var(--color-bg)':'#0ea5e914', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              <Bell size={15} color={n.is_read?'var(--color-text-muted)':'#0ea5e9'}/>
                            </div>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:n.is_read?400:600, fontSize:13 }}>{n.title}</div>
                              <div className="text-muted" style={{ fontSize:12, marginTop:2 }}>{n.message}</div>
                              <div className="text-muted" style={{ fontSize:11, marginTop:4 }}>{new Date(n.created_at).toLocaleString()}</div>
                            </div>
                            {!n.is_read && <span style={{ width:8, height:8, borderRadius:'50%', background:'#0ea5e9', flexShrink:0, marginTop:6 }}/>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="card" style={{ padding:50, textAlign:'center' }}>
                        <Bell size={40} color="var(--color-text-muted)" style={{ opacity:0.3, marginBottom:12 }}/>
                        <h3 className="heading-4">No Notifications</h3>
                        <p className="text-muted" style={{ fontSize:13 }}>You're all caught up!</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ===== PROFILE ===== */}
                {activeTab === 'profile' && (
                  <div>
                    <h1 className="heading-2" style={{ marginBottom:24 }}>Profile Settings</h1>
                    <div className="card" style={{ padding:24 }}>
                      <form onSubmit={handleProfileSubmit}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                          <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name:e.target.value})} required/></div>
                          <div className="form-group"><label className="form-label">Email Address</label><input className="form-input" defaultValue={user.email} disabled style={{ opacity:0.6 }}/></div>
                          <div className="form-group"><label className="form-label">Phone Number</label><input className="form-input" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone:e.target.value})} placeholder="+44 xxx xxx xxxx"/></div>
                          <div className="form-group"><label className="form-label">Nationality</label><input className="form-input" value={profileForm.nationality} onChange={e => setProfileForm({...profileForm, nationality:e.target.value})} placeholder="e.g. British, Pakistani"/></div>
                          <div className="form-group"><label className="form-label">Passport Expiry Date</label><input type="date" className="form-input" value={profileForm.passport_expiry} onChange={e => setProfileForm({...profileForm, passport_expiry:e.target.value})}/></div>
                        </div>
                        <div style={{ marginTop:20, display:'flex', alignItems:'center', gap:12 }}>
                          <button type="submit" className="btn btn-primary">Save Changes</button>
                          {profileSaved && <span style={{ color:'#10b981', fontSize:13, fontWeight:600 }}>✓ Profile updated!</span>}
                        </div>
                      </form>
                    </div>

                    <div className="card" style={{ padding:24, marginTop:20 }}>
                      <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12, color:'var(--color-danger)' }}>Danger Zone</h3>
                      <p className="text-muted" style={{ fontSize:13, marginBottom:12 }}>Logging out will clear your session.</p>
                      <button className="btn btn-outline" style={{ borderColor:'var(--color-danger)', color:'var(--color-danger)' }} onClick={logout}><LogOut size={14}/> Sign Out</button>
                    </div>
                  </div>
                )}

                {/* ===== REFERRALS & LOYALTY ===== */}
                {activeTab === 'referrals' && (
                  <div>
                    <h1 className="heading-2" style={{ marginBottom:24 }}>Referral & Loyalty Program</h1>
                    
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:20, marginBottom:24 }}>
                      <div className="card" style={{ padding:20, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', background:'linear-gradient(135deg, var(--color-primary) 0%, #1e3a8a) 100%', color:'white' }}>
                        <Gift size={40} color="var(--color-secondary)" style={{ marginBottom:12 }}/>
                        <div style={{ fontSize:14, textTransform:'uppercase', opacity:0.8, fontWeight:700 }}>Loyalty Points</div>
                        <div style={{ fontSize:42, fontWeight:800, margin:'10px 0' }}>{referralStats?.loyalty_points || 0}</div>
                        <div style={{ fontSize:13, opacity:0.9 }}>1 point per £10 spent on confirmed packages</div>
                      </div>

                      <div className="card" style={{ padding:20, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', background:'linear-gradient(135deg, var(--color-secondary) 0%, #d97706 100%)', color:'black' }}>
                        <Award size={40} style={{ marginBottom:12 }}/>
                        <div style={{ fontSize:14, textTransform:'uppercase', opacity:0.8, fontWeight:700 }}>Cashback Credits</div>
                        <div style={{ fontSize:42, fontWeight:800, margin:'10px 0' }}>£{(referralStats?.credits_balance || 0).toFixed(2)}</div>
                        <div style={{ fontSize:13, opacity:0.9 }}>Earn 5% cashback credit from your referrals' bookings</div>
                      </div>
                    </div>

                    <div className="card" style={{ padding:24, marginBottom:24 }}>
                      <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Your Referral Code</h3>
                      <p className="text-muted" style={{ fontSize:13, marginBottom:16 }}>
                        Share your referral link with friends. When they register using your code and book a package, they get 50 points and you get 100 points + 5% cashback on their booking total!
                      </p>
                      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                        <div style={{ flex:1, padding:'10px 14px', background:'var(--color-bg)', border:'1px solid var(--color-border)', borderRadius:8, fontFamily:'monospace', fontWeight:700, fontSize:15 }}>
                          {referralStats?.referral_code || 'Generating...'}
                        </div>
                        <button type="button" className="btn btn-primary" onClick={() => {
                          navigator.clipboard.writeText(referralStats?.referral_code || '');
                          alert('Referral code copied to clipboard!');
                        }}>Copy Code</button>
                      </div>

                      {!user.referred_by && (
                        <form onSubmit={handleApplyReferral} style={{ marginTop:24, borderTop:'1px solid var(--color-border)', paddingTop:20 }}>
                          <h4 style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>Have a referral code?</h4>
                          <div style={{ display:'flex', gap:10 }}>
                            <input className="form-input" placeholder="Enter code (e.g. BT-XXXX-1234)" value={refCodeInput} onChange={e => setRefCodeInput(e.target.value)} required/>
                            <button type="submit" className="btn btn-primary" disabled={applyingRef}>
                              {applyingRef ? 'Applying...' : 'Apply Code'}
                            </button>
                          </div>
                          {refSuccessMsg && <p style={{ color:'var(--color-success)', fontSize:12, marginTop:8 }}>{refSuccessMsg}</p>}
                          {refErrorMsg && <p style={{ color:'var(--color-danger)', fontSize:12, marginTop:8 }}>{refErrorMsg}</p>}
                        </form>
                      )}
                    </div>

                    <div className="card" style={{ padding:24, marginBottom:24 }}>
                      <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Your Referrals</h3>
                      {referralStats?.referrals?.length > 0 ? (
                        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                          {referralStats.referrals.map((refUser, idx) => (
                            <div key={idx} style={{ display:'flex', justifyContent:'space-between', padding:'10px 12px', background:'var(--color-bg)', border:'1px solid var(--color-border)', borderRadius:8, fontSize:13 }}>
                              <div>
                                <strong>{refUser.name}</strong>
                                <span style={{ color:'var(--color-text-muted)', marginLeft:8 }}>({refUser.email})</span>
                              </div>
                              <span className="text-muted">{new Date(refUser.created_at).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted" style={{ fontSize:13, textAlign:'center', padding:'20px 0' }}>No friends referred yet. Share your code to earn points!</p>
                      )}
                    </div>

                    {/* Customer Survey Feedback Section */}
                    <div className="card" style={{ padding:24 }}>
                      <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Customer Satisfaction Survey</h3>
                      <p className="text-muted" style={{ fontSize:13, marginBottom:16 }}>
                        Have you recently completed a trip or application? Rate our service and help us improve.
                      </p>
                      {surveySuccess ? (
                        <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', padding:'12px 16px', borderRadius:8, color:'var(--color-success)', fontSize:13 }}>
                          Thank you for sharing your feedback! Your review helps us deliver better travel experiences.
                        </div>
                      ) : (
                        <form onSubmit={handleSurveySubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                            <div className="form-group">
                              <label className="form-label">Select File Reference</label>
                              <select className="form-input" value={surveyForm.ref} onChange={e => setSurveyForm({ ...surveyForm, ref: e.target.value })} required>
                                <option value="">-- Choose travel file --</option>
                                {[...bookings, ...visaApps].map((item, idx) => (
                                  <option key={idx} value={item.booking_ref || item.app_ref}>
                                    {item.package_title || `Visa to ${item.country}`} ({item.booking_ref || item.app_ref})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="form-label">Service Rating (1 to 5 Stars)</label>
                              <select className="form-input" value={surveyForm.rating} onChange={e => setSurveyForm({ ...surveyForm, rating: parseInt(e.target.value) })} required>
                                <option value="5">⭐⭐⭐⭐⭐ (Excellent)</option>
                                <option value="4">⭐⭐⭐⭐ (Good)</option>
                                <option value="3">⭐⭐⭐ (Average)</option>
                                <option value="2">⭐⭐ (Fair)</option>
                                <option value="1">⭐ (Poor)</option>
                              </select>
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Your Feedback / Review Comments</label>
                            <textarea className="form-input" rows="3" placeholder="Tell us about your experience..." value={surveyForm.feedback} onChange={e => setSurveyForm({ ...surveyForm, feedback: e.target.value })} required/>
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ alignSelf:'flex-start' }} disabled={submittingSurvey}>
                            {submittingSurvey ? 'Submitting...' : 'Submit Feedback'}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {/* ===== CONSULTATIONS CALENDAR ===== */}
                {activeTab === 'consultations' && (
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
                      <h1 className="heading-2">Book a Consultation</h1>
                      <button type="button" className="btn btn-primary" onClick={() => setBookingConsultation(true)}>Schedule Appointment</button>
                    </div>

                    <div className="card" style={{ padding:24, marginBottom:24 }}>
                      <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Upcoming Consultations</h3>
                      {consultations.length > 0 ? (
                        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                          {consultations.map((c, idx) => (
                            <div key={idx} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', background:'var(--color-bg)', border:'1px solid var(--color-border)', borderRadius:10 }}>
                              <div>
                                <h4 style={{ fontWeight:700, fontSize:14, color:'var(--color-text)' }}>{c.title}</h4>
                                <div className="text-muted" style={{ fontSize:12, marginTop:4, display:'flex', gap:14 }}>
                                  <span>📅 {new Date(c.scheduled_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                  <span>⏱️ {c.duration} mins</span>
                                </div>
                                {c.notes && <p className="text-muted" style={{ fontSize:11, marginTop:6, fontStyle:'italic' }}>Notes: {c.notes}</p>}
                              </div>
                              <span style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', color: c.status === 'scheduled' ? 'var(--color-secondary)' : (c.status === 'completed' ? 'var(--color-success)' : 'var(--color-danger)') }}>
                                {c.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted" style={{ fontSize:13, textAlign:'center', padding:'20px 0' }}>No consultations booked yet. Need help? Book a free slot with our advisors.</p>
                      )}
                    </div>

                    {bookingConsultation && (
                      <div className="card" style={{ padding:24 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                          <h3 style={{ fontSize:15, fontWeight:700 }}>New Appointment Details</h3>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBookingConsultation(false)}>Close Form</button>
                        </div>
                        <form onSubmit={handleBookConsultation} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                            <div className="form-group">
                              <label className="form-label">Consultation Reason</label>
                              <select className="form-input" value={consForm.title} onChange={e => setConsForm({ ...consForm, title: e.target.value })} required>
                                <option value="Visa Consultation">Visa Eligibility Review</option>
                                <option value="Holiday Package Customization">Holiday Package Planning</option>
                                <option value="Document Audit & Review">Document Preparation Review</option>
                                <option value="General Travel Enquiry">General Travel Inquiry</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="form-label">Date & Time Slot</label>
                              <input type="datetime-local" className="form-input" value={consForm.scheduled_at} onChange={e => setConsForm({ ...consForm, scheduled_at: e.target.value })} required/>
                            </div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Additional Consultation Notes (Optional)</label>
                            <textarea className="form-input" rows="2" placeholder="List details or specific questions you have..." value={consForm.notes} onChange={e => setConsForm({ ...consForm, notes: e.target.value })}/>
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ alignSelf:'flex-start' }} disabled={submittingConsultation}>
                            {submittingConsultation ? 'Booking...' : 'Book Slot'}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          )}

          {/* ===== DIGITAL SIGNATURE MODAL OVERLAY ===== */}
          {signingFile && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
              <div className="card animate-fadeIn" style={{ maxWidth:500, width:'100%', padding:24, background:'var(--color-surface)', boxShadow:'var(--shadow-2xl)', borderRadius:12 }}>
                <h3 style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>✍️ E-Sign Travel Agreement</h3>
                <p className="text-muted" style={{ fontSize:13, marginBottom:16 }}>
                  By signing below, you agree to the travel terms, cancellation policy, and document compliance terms.
                </p>
                
                <form onSubmit={handleSignatureSubmit}>
                  <div style={{ display:'flex', gap:10, marginBottom:16 }}>
                    <button type="button" className={`btn btn-sm ${signatureType==='typed' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSignatureType('typed')}>Type Signature</button>
                    <button type="button" className={`btn btn-sm ${signatureType==='drawn' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSignatureType('drawn')}>Draw Signature</button>
                  </div>

                  {signatureType === 'typed' ? (
                    <div className="form-group" style={{ marginBottom:20 }}>
                      <label className="form-label">Type your full legal name</label>
                      <input className="form-input" style={{ fontStyle:'italic', fontFamily:'Georgia, serif', fontSize:18, padding:'10px 14px' }} placeholder={user.name} value={typedSignature} onChange={e => setTypedSignature(e.target.value)} required/>
                    </div>
                  ) : (
                    <div style={{ height:120, border:'2px dashed var(--color-border)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--color-bg)', marginBottom:20 }}>
                      <span style={{ fontSize:12, color:'var(--color-text-muted)' }}>[ Signature Canvas Area - Draw with Mouse/Touch ]</span>
                    </div>
                  )}

                  <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => { setSigningFile(null); setTypedSignature(''); }}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={submittingSignature}>
                      {submittingSignature ? 'Signing...' : 'Sign Agreement'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .portal-spinner { width:36px; height:36px; border:3px solid var(--color-border); border-top:3px solid var(--color-secondary); border-radius:50%; animation:spin 1s linear infinite; margin:0 auto; }
        .portal-mobile-toggle { display:none; position:fixed; bottom:85px; left:20px; right:auto; z-index:var(--z-widget); background:var(--color-secondary); color:white; border:none; border-radius:var(--radius-full); padding:12px 20px; font-weight:600; font-size:13px; box-shadow:var(--shadow-lg); cursor:pointer; gap:8px; align-items:center; }
        .portal-sidebar { width:240px; background:var(--color-surface); border-right:1px solid var(--color-border); min-height:calc(100vh - var(--nav-height)); position:sticky; top:var(--nav-height); flex-shrink:0; overflow-y:auto; max-height:calc(100vh - var(--nav-height)); }
        .portal-user-card { padding:20px 16px; text-align:center; border-bottom:1px solid var(--color-border); }
        .portal-avatar { width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg,#0ea5e9,#06b6d4); color:white; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:18px; margin:0 auto 8px; }
        .portal-nav { padding:8px; display:flex; flex-direction:column; gap:2px; }
        .portal-nav-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; font-size:13px; cursor:pointer; border:none; width:100%; text-align:left; transition:all 0.15s; background:transparent; color:var(--color-text-muted); font-weight:400; }
        .portal-nav-item.active { background:#0ea5e90a; color:var(--color-secondary); font-weight:600; }
        .portal-nav-item:hover { background:var(--color-bg); color:var(--color-text); }
        .portal-badge { margin-left:auto; background:#ef4444; color:white; font-size:10px; font-weight:700; min-width:18px; height:18px; border-radius:9px; display:flex; align-items:center; justify-content:center; padding:0 5px; }
        .portal-overlay { display:none; }
        .portal-action-btn { display:flex; align-items:center; gap:10px; padding:14px 16px; background:var(--color-surface); border:1px solid var(--color-border); border-radius:10px; cursor:pointer; font-size:13px; font-weight:600; color:var(--color-text); transition:all 0.2s; text-decoration:none; }
        .portal-action-btn:hover { border-color:var(--color-secondary); background:#0ea5e906; }
        .portal-doc-chip { display:inline-flex; align-items:center; gap:5px; padding:5px 10px; background:var(--color-bg); border:1px solid var(--color-border); border-radius:6px; font-size:12px; color:var(--color-text); text-decoration:none; }
        .portal-doc-chip:hover { border-color:var(--color-secondary); }
        .portal-timeline { display:flex; align-items:center; gap:0; margin-top:16px; padding:10px 20px; overflow-x:auto; -webkit-overflow-scrolling:touch; }
        .portal-timeline-step { display:flex; flex-direction:column; align-items:center; position:relative; flex:1; min-width:115px; }
        .portal-timeline-dot { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; background:var(--color-border); color:var(--color-text-muted); z-index:1; }
        .portal-timeline-dot.done { background:#10b981; color:white; }
        .portal-timeline-dot.current { box-shadow:0 0 0 4px #10b98130; }
        .portal-timeline-dot.rejected { background:#ef4444; color:white; box-shadow:0 0 0 4px #ef444430; }
        .portal-timeline-line { position:absolute; top:14px; left:50%; width:100%; height:2px; background:var(--color-border); z-index:0; }
        .portal-timeline-line.done { background:#10b981; }
        @media(max-width:768px) {
          .portal-mobile-toggle { display:flex; }
          .portal-sidebar { position:fixed; left:-100%; top:var(--nav-height); bottom:0; z-index:var(--z-modal); transition:left 0.3s ease; width:260px; box-shadow:var(--shadow-2xl); }
          .portal-sidebar.open { left:0; }
          .portal-overlay { display:block; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:calc(var(--z-modal) - 1); }
          main { padding:16px 16px 140px 16px !important; }

          /* Responsive Timeline Stacking */
          .portal-timeline {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 24px !important;
            overflow-x: visible !important;
            padding: 10px 10px 10px 15px !important;
          }
          .portal-timeline-step {
            flex-direction: row !important;
            align-items: center !important;
            gap: 16px !important;
            min-width: 0 !important;
            width: 100% !important;
          }
          .portal-timeline-label {
            margin-top: 0 !important;
            white-space: normal !important;
            font-size: 12px !important;
            text-align: left !important;
            word-break: break-word !important;
          }
          .portal-timeline-line {
            top: 14px !important;
            left: 13px !important;
            width: 2px !important;
            height: calc(100% + 24px) !important;
            background: var(--color-border) !important;
            z-index: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
