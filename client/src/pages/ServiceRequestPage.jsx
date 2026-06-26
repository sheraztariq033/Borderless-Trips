import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Globe, Plane, Hotel, Phone, HelpCircle,
  ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Copy, Check, Lock, Mail, User, PhoneCall
} from 'lucide-react';

export default function ServiceRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [step, setStep] = useState(1);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    service_type: '',
    country: '',
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    // Visa
    nationality: user?.nationality || '',
    purpose: 'tourism',
    employment: 'employed',
    monthlyIncome: '',
    previousVisa: 'no',
    previousRejection: 'no',
    // Flights
    fromCity: '',
    toCity: '',
    travelDate: '',
    duration: '', // Used as return date for flights, duration for packages/hotels
    travelers: '1',
    flightClass: 'economy',
    tripType: 'return',
    // Package & Hotel & Other
    budget: '',
    notes: '',
    // Signup
    create_account: true,
    password: ''
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        nationality: user.nationality || '',
        create_account: false
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        const data = await api.get('/countries');
        setCountries(data);
      } catch (err) {
        console.error('Failed to load countries:', err);
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  const handleCopyPassword = () => {
    if (result?.tempPassword) {
      navigator.clipboard.writeText(result.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.service_type) {
        setError('Please select a service type to continue.');
        return false;
      }
    } else if (step === 2) {
      if (['visa', 'holiday_package', 'hotel'].includes(formData.service_type) && !formData.country) {
        setError('Please select a destination country.');
        return false;
      }
      if (formData.service_type === 'visa' && !formData.nationality) {
        setError('Nationality is required for visa assistance.');
        return false;
      }
      if (formData.service_type === 'flight') {
        if (!formData.fromCity || !formData.toCity || !formData.travelDate) {
          setError('Origin, destination, and departure date are required.');
          return false;
        }
      }
      if (['holiday_package', 'hotel', 'consultation', 'other'].includes(formData.service_type) && !formData.travelDate) {
        setError('Please select a target travel date.');
        return false;
      }
    } else if (step === 3) {
      if (!formData.name || !formData.email) {
        setError('Name and Email are required.');
        return false;
      }
      if (formData.create_account && formData.password && formData.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    try {
      setSubmitting(true);
      setError('');
      const details = {};

      if (formData.service_type === 'visa') {
        Object.assign(details, {
          nationality: formData.nationality,
          purpose: formData.purpose,
          travelDate: formData.travelDate,
          employment: formData.employment,
          monthlyIncome: formData.monthlyIncome,
          previousVisa: formData.previousVisa,
          previousRejection: formData.previousRejection,
        });
      } else if (formData.service_type === 'flight') {
        Object.assign(details, {
          fromCity: formData.fromCity,
          toCity: formData.toCity,
          departDate: formData.travelDate,
          returnDate: formData.duration,
          passengers: formData.travelers,
          flightClass: formData.flightClass,
          tripType: formData.tripType,
        });
      } else if (['holiday_package', 'hotel'].includes(formData.service_type)) {
        Object.assign(details, {
          travelDate: formData.travelDate,
          duration: formData.duration,
          travelers: formData.travelers,
          budget: formData.budget,
        });
      } else {
        Object.assign(details, {
          travelDate: formData.travelDate,
          travelers: formData.travelers,
          budget: formData.budget,
        });
      }

      if (formData.notes) details.notes = formData.notes;

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        service_type: formData.service_type,
        country: formData.country,
        details,
        create_account: formData.create_account,
        password: formData.password || undefined
      };

      const response = await api.post('/service-requests', payload);
      setResult(response);
      setStep(4);
    } catch (err) {
      setError(err.message || 'Failed to submit service request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceedToPortal = () => {
    if (result?.token) {
      localStorage.setItem('bt_token', result.token);
      window.location.href = '/portal';
    } else {
      navigate('/login');
    }
  };

  const serviceTypes = [
    { id: 'visa', label: 'Visa Assistance', desc: 'Schengen & worldwide visa processing', icon: Shield, color: '#0ea5e9' },
    { id: 'holiday_package', label: 'Holiday Package', desc: 'Custom curated tour itineraries', icon: Globe, color: '#10b981' },
    { id: 'flight', label: 'Flight Booking', desc: 'Premium flight route quotes', icon: Plane, color: '#6366f1' },
    { id: 'hotel', label: 'Hotel Booking', desc: 'Luxury & boutique accommodation', icon: Hotel, color: '#d4a574' },
    { id: 'consultation', label: 'Travel Consultation', desc: 'Expert 1-on-1 trip planning', icon: Phone, color: '#f59e0b' },
    { id: 'other', label: 'Other Services', desc: 'Custom requirements & requests', icon: HelpCircle, color: '#94a3b8' }
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - var(--nav-height))', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 680, width: '100%', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        
        {/* Progress Bar */}
        {step < 4 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
              <span>Step {step} of 3: {step === 1 ? 'Service Type' : step === 2 ? 'Details' : 'Contact Info'}</span>
              <span>{Math.round((step / 3) * 100)}% Complete</span>
            </div>
            <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${(step / 3) * 100}%` }} 
                transition={{ duration: 0.3 }}
                style={{ height: '100%', background: 'var(--color-secondary)' }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="card"
            style={{ padding: '32px 24px', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--color-border)' }}
          >
            
            {/* Header */}
            {step === 1 && (
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h1 className="heading-3" style={{ margin: '0 0 8px', fontSize: 24 }}>Request a Service</h1>
                <p className="text-muted" style={{ fontSize: 14 }}>Select the travel service you need help with. Our managers will process it within 24 hours.</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div style={{ display: 'flex', gap: 10, background: 'var(--color-danger)10', border: '1px solid var(--color-danger)30', color: 'var(--color-danger)', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 13, alignItems: 'center' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: SERVICE TYPE */}
            {step === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                {serviceTypes.map(item => {
                  const Icon = item.icon;
                  const isSelected = formData.service_type === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, service_type: item.id })}
                      style={{
                        textAlign: 'left',
                        padding: 16,
                        borderRadius: 12,
                        border: `2px solid ${isSelected ? 'var(--color-secondary)' : 'var(--color-border)'}`,
                        background: isSelected ? 'rgba(14, 165, 233, 0.04)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        gap: 14,
                        alignItems: 'center'
                      }}
                    >
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: `${item.color}15`,
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text)' }}>{item.label}</div>
                        <div className="text-muted" style={{ fontSize: 11, marginTop: 2 }}>{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* STEP 2: DETAILS */}
            {step === 2 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📝 Provide Request Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  
                  {/* Destination Country */}
                  {['visa', 'holiday_package', 'hotel'].includes(formData.service_type) && (
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Destination Country *</label>
                      <select 
                        className="form-input form-select" 
                        value={formData.country} 
                        onChange={e => setFormData({ ...formData, country: e.target.value })} 
                        required
                      >
                        <option value="">Select country...</option>
                        {loadingCountries ? (
                          <option disabled>Loading countries...</option>
                        ) : (
                          countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                        )}
                      </select>
                    </div>
                  )}

                  {/* Visa Fields */}
                  {formData.service_type === 'visa' && (<>
                    <div className="form-group">
                      <label className="form-label">Nationality *</label>
                      <input className="form-input" placeholder="e.g. Pakistani, Indian" value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Purpose of Visit</label>
                      <select className="form-input form-select" value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })}>
                        <option value="tourism">Tourism</option>
                        <option value="business">Business</option>
                        <option value="family">Family / Friend Visit</option>
                        <option value="study">Study</option>
                        <option value="medical">Medical Treatment</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Employment Status</label>
                      <select className="form-input form-select" value={formData.employment} onChange={e => setFormData({ ...formData, employment: e.target.value })}>
                        <option value="employed">Employed (Full-time / Part-time)</option>
                        <option value="self_employed">Self-employed / Business Owner</option>
                        <option value="student">Student</option>
                        <option value="unemployed">Unemployed</option>
                        <option value="retired">Retired</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Monthly Income (£)</label>
                      <input className="form-input" type="number" placeholder="e.g. 2500" value={formData.monthlyIncome} onChange={e => setFormData({ ...formData, monthlyIncome: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Previous Schengen Visa?</label>
                      <select className="form-input form-select" value={formData.previousVisa} onChange={e => setFormData({ ...formData, previousVisa: e.target.value })}>
                        <option value="no">No, this is my first time</option>
                        <option value="yes">Yes, in the last 59 months</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Any Previous Refusals?</label>
                      <select className="form-input form-select" value={formData.previousRejection} onChange={e => setFormData({ ...formData, previousRejection: e.target.value })}>
                        <option value="no">No</option>
                        <option value="yes">Yes (any Schengen country)</option>
                      </select>
                    </div>
                  </>)}

                  {/* Flight Fields */}
                  {formData.service_type === 'flight' && (<>
                    <div className="form-group">
                      <label className="form-label">From City/Airport *</label>
                      <input className="form-input" placeholder="e.g. London LHR" value={formData.fromCity} onChange={e => setFormData({ ...formData, fromCity: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">To City/Airport *</label>
                      <input className="form-input" placeholder="e.g. Paris CDG" value={formData.toCity} onChange={e => setFormData({ ...formData, toCity: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Departure Date *</label>
                      <input className="form-input" type="date" value={formData.travelDate} onChange={e => setFormData({ ...formData, travelDate: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Return Date (if return)</label>
                      <input className="form-input" type="date" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Travelers</label>
                      <input className="form-input" type="number" min="1" value={formData.travelers} onChange={e => setFormData({ ...formData, travelers: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Flight Class</label>
                      <select className="form-input form-select" value={formData.flightClass} onChange={e => setFormData({ ...formData, flightClass: e.target.value })}>
                        <option value="economy">Economy</option>
                        <option value="premium_economy">Premium Economy</option>
                        <option value="business">Business</option>
                        <option value="first">First Class</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Trip Type</label>
                      <select className="form-input form-select" value={formData.tripType} onChange={e => setFormData({ ...formData, tripType: e.target.value })}>
                        <option value="return">Round Trip (Return)</option>
                        <option value="one_way">One Way</option>
                        <option value="multi_city">Multi-City / Custom</option>
                      </select>
                    </div>
                  </>)}

                  {/* Holiday / Hotel Details */}
                  {['holiday_package', 'hotel'].includes(formData.service_type) && (<>
                    <div className="form-group">
                      <label className="form-label">Travel Start Date *</label>
                      <input className="form-input" type="date" value={formData.travelDate} onChange={e => setFormData({ ...formData, travelDate: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Duration (e.g. 5 days) *</label>
                      <input className="form-input" placeholder="e.g. 7 Days" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Travelers</label>
                      <input className="form-input" type="number" min="1" value={formData.travelers} onChange={e => setFormData({ ...formData, travelers: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Estimated Budget (£)</label>
                      <input className="form-input" type="number" placeholder="e.g. 1500" value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                    </div>
                  </>)}

                  {/* Consultation / Other Details */}
                  {['consultation', 'other'].includes(formData.service_type) && (<>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Preferred Date *</label>
                      <input className="form-input" type="date" value={formData.travelDate} onChange={e => setFormData({ ...formData, travelDate: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Travelers</label>
                      <input className="form-input" type="number" min="1" value={formData.travelers} onChange={e => setFormData({ ...formData, travelers: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Budget (£)</label>
                      <input className="form-input" type="number" placeholder="e.g. 1000" value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} />
                    </div>
                  </>)}

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Special Requirements / Notes</label>
                    <textarea 
                      className="form-input form-textarea" 
                      placeholder="Share any special instructions, preferences, hotel ratings, flight times, or details..." 
                      value={formData.notes} 
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                    />
                  </div>

                </div>
              </div>
            )}

            {/* STEP 3: CONTACT INFO & AUTO-SIGNUP */}
            {step === 3 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📞 Contact Information</h3>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <div style={{ position: 'relative' }}>
                      <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Your name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required disabled={!!user} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input className="form-input" style={{ paddingLeft: 36 }} type="email" placeholder="Your email address" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required disabled={!!user} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <PhoneCall size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input className="form-input" style={{ paddingLeft: 36 }} placeholder="e.g. +44 7911 123456" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                  </div>

                  {!user && (
                    <div style={{ marginTop: 10, background: 'rgba(14, 165, 233, 0.03)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16 }}>
                      <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.create_account} 
                          onChange={e => setFormData({ ...formData, create_account: e.target.checked })}
                          style={{ accentColor: 'var(--color-secondary)' }}
                        />
                        <span>🔑 Auto-create a portal account with this email</span>
                      </label>
                      <p className="text-muted" style={{ fontSize: 11, marginLeft: 22, marginTop: 4 }}>
                        Save time! Track your request status, chat directly with visa agents, and upload files in real time.
                      </p>
                      
                      {formData.create_account && (
                        <div className="form-group" style={{ marginTop: 14 }}>
                          <label className="form-label">Choose Password (Optional)</label>
                          <div style={{ position: 'relative' }}>
                            <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input 
                              className="form-input" 
                              style={{ paddingLeft: 36 }}
                              type="password" 
                              placeholder="Leave blank for auto-generated password" 
                              value={formData.password} 
                              onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: SUCCESS SUMMARY */}
            {step === 4 && result && (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-success)15', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle2 size={36} />
                </div>
                <h1 className="heading-3" style={{ margin: '0 0 8px', fontSize: 24 }}>Request Submitted!</h1>
                <p className="text-muted" style={{ fontSize: 14, marginBottom: 24 }}>We have received your service request. A visa agent or manager will review it shortly.</p>

                {/* Reference Code Panel */}
                <div style={{ background: 'var(--color-bg-alt)', padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 400, margin: '0 auto 24px', border: '1px solid var(--color-border)' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reference Code</div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-primary)' }}>{result.request.ref}</div>
                  </div>
                  <StatusBadgePublic status="new" />
                </div>

                {/* Auto Account Creation Info */}
                {result.autoCreated && (
                  <div style={{ maxWidth: 440, margin: '0 auto 24px', border: '1px dashed var(--color-secondary)', borderRadius: 12, padding: 18, background: 'rgba(14, 165, 233, 0.01)', textAlign: 'left' }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>🔑 Your Account Details</h4>
                    <p className="text-muted" style={{ fontSize: 11, marginBottom: 12 }}>
                      We have automatically created a portal account for you. Use these credentials to log in:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                      <div><strong>Email:</strong> {formData.email.toLowerCase()}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong>Temp Password:</strong> 
                        <code style={{ fontSize: 12, padding: '2px 6px', background: 'var(--color-bg-alt)' }}>{result.tempPassword}</code>
                        <button 
                          onClick={handleCopyPassword} 
                          style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                          title="Copy Password"
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                  <button className="btn btn-primary" onClick={handleProceedToPortal}>
                    Proceed to Portal
                  </button>
                  <Link to="/" className="btn btn-ghost">Return Home</Link>
                </div>
              </div>
            )}

            {/* Form Actions (Steps 1-3) */}
            {step < 4 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
                {step > 1 ? (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleBack} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ArrowLeft size={14} /> Back
                  </button>
                ) : (
                  <div />
                )}
                
                {step < 3 ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Continue <ArrowRight size={14} />
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatusBadgePublic({ status }) {
  const map = {
    new: ['NEW', '#ef4444'],
  };
  const [label, color] = map[status] || [status, '#94a3b8'];
  return (
    <span style={{ 
      background: `${color}12`, 
      color, 
      padding: '4px 10px', 
      borderRadius: 20, 
      fontSize: 11, 
      fontWeight: 700,
      letterSpacing: '0.04em',
      border: `1px solid ${color}25`
    }}>
      {label}
    </span>
  );
}
