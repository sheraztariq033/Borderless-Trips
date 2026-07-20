import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, CheckCircle2, AlertCircle, Copy, Check, MessageCircle, 
  ArrowRight, ArrowLeft, Globe, Briefcase, GraduationCap, Compass, HelpCircle,
  User, Mail, Phone, Award, Lock, Search, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';

export default function VisaQuiz({ inline = false, onClose = null }) {
  const { user, loginWithToken } = useAuth();
  const { settings } = useSettings();
  
  const [step, setStep] = useState(1);
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState(null);
  const [draftId, setDraftId] = useState(null);
  const [displayScore, setDisplayScore] = useState(0);

  // Search filter states
  const [countrySearch, setCountrySearch] = useState('');
  const [nationalitySearch, setNationalitySearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    nationality: user?.nationality || '',
    country: '',
    purpose: 'Tourism',
    employed: 'Employed',
    funds: 'Yes, savings',
    history: 'No',
    rejection: 'No',
  });

  // Fetch Destination Countries
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

  // Debounced Draft Sync Hook
  const draftTimerRef = useRef(null);

  useEffect(() => {
    // Only attempt sync if we are on the contact details step (step 8)
    if (step === 8 && (formData.email.length > 1 || formData.phone.length > 1 || formData.name.length > 1)) {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
      }

      draftTimerRef.current = setTimeout(async () => {
        try {
          const payload = {
            draftId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            nationality: formData.nationality,
            country: formData.country,
            purpose: formData.purpose,
            employed: formData.employed,
          };
          
          const res = await api.post('/inquiries/draft', payload);
          if (res && res.draftId) {
            setDraftId(res.draftId);
          }
        } catch (err) {
          console.error('Failed to sync draft lead:', err);
        }
      }, 500);
    }

    return () => {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
      }
    };
  }, [formData.name, formData.email, formData.phone, step, draftId]);

  // Score counter animation
  useEffect(() => {
    if (step === 9 && result?.score !== undefined) {
      let start = 0;
      const end = result.score;
      if (start === end) {
        setDisplayScore(end);
        return;
      }
      const duration = 1000; // ms
      const range = end - start;
      let current = start;
      const increment = end > start ? 1 : -1;
      const stepTime = Math.abs(Math.floor(duration / range));
      
      const timer = setInterval(() => {
        current += increment;
        setDisplayScore(current);
        if (current === end) {
          clearInterval(timer);
        }
      }, stepTime || 10);

      return () => clearInterval(timer);
    }
  }, [step, result]);

  const validateStep = () => {
    setError('');
    if (step === 1 && !formData.country) {
      setError('Please select a destination country.');
      return false;
    }
    if (step === 2 && !formData.nationality) {
      setError('Please select or enter your nationality.');
      return false;
    }
    if (step === 8) {
      if (!formData.name || !formData.email) {
        setError('Please fill in Name and Email address.');
        return false;
      }
      if (!formData.email.includes('@')) {
        setError('Please enter a valid email address.');
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

  const handleSelectCountry = (countryName) => {
    setFormData(prev => ({ ...prev, country: countryName }));
    setError('');
    setTimeout(() => setStep(2), 220);
  };

  const handleSelectNationality = (nationalityVal) => {
    setFormData(prev => ({ ...prev, nationality: nationalityVal }));
    setError('');
    setTimeout(() => setStep(3), 220);
  };

  const handleSelectPurpose = (purposeVal) => {
    setFormData(prev => ({ ...prev, purpose: purposeVal }));
    setTimeout(() => setStep(4), 220);
  };

  const handleSelectEmployed = (employedVal) => {
    setFormData(prev => ({ ...prev, employed: employedVal }));
    setTimeout(() => setStep(5), 220);
  };

  const handleSelectFunds = (fundsVal) => {
    setFormData(prev => ({ ...prev, funds: fundsVal }));
    setTimeout(() => setStep(6), 220);
  };

  const handleSelectHistory = (historyVal) => {
    setFormData(prev => ({ ...prev, history: historyVal }));
    setTimeout(() => setStep(7), 220);
  };

  const handleSelectRejection = (rejectionVal) => {
    setFormData(prev => ({ ...prev, rejection: rejectionVal }));
    setTimeout(() => setStep(8), 220);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    try {
      setSubmitting(true);
      setError('');
      
      const payload = {
        draftId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        nationality: formData.nationality,
        country: formData.country,
        purpose: formData.purpose,
        employed: formData.employed,
        funds: formData.funds,
        history: formData.history,
        rejection: formData.rejection,
      };

      const res = await api.post('/inquiries/evaluate', payload);
      setResult(res);
      setStep(9);
    } catch (err) {
      setError(err.message || 'Failed to calculate eligibility. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (result?.tempPassword) {
      navigator.clipboard.writeText(result.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleProceedToPortal = () => {
    if (result?.token) {
      loginWithToken(result.token, {
        id: result.userId,
        name: formData.name,
        email: formData.email.toLowerCase(),
        phone: formData.phone,
        role: 'customer',
        sub_role: ''
      });
      window.location.href = '/portal';
    } else {
      window.location.href = '/login';
    }
  };

  const getWhatsAppUrl = () => {
    const waPhone = (settings.whatsapp || '441234567890').replace(/[+\s]+/g, '');
    const message = `Hello! My name is ${formData.name}. I just completed my Schengen Visa eligibility assessment for ${formData.country} and scored ${result?.score}%. I would like to consult with an agent to proceed with my visa file preparation.`;
    return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
  };

  const popularCountries = [
    { name: 'Schengen Zone', code: 'eu', desc: 'Any Schengen country' },
    { name: 'France', code: 'fr', desc: 'Paris, Riviera' },
    { name: 'Italy', code: 'it', desc: 'Rome, Venice' },
    { name: 'Germany', code: 'de', desc: 'Berlin, Munich' },
    { name: 'Spain', code: 'es', desc: 'Madrid, Barcelona' },
    { name: 'Switzerland', code: 'ch', desc: 'Alps, Zurich' },
  ];

  const popularNationalities = [
    { name: 'Pakistani', code: 'pk' },
    { name: 'Indian', code: 'in' },
    { name: 'British', code: 'gb' },
    { name: 'Nigerian', code: 'ng' },
    { name: 'Filipino', code: 'ph' },
  ];

  const stepLabels = [
    'Destination',
    'Passport',
    'Travel Purpose',
    'Employment',
    'Savings Statement',
    'Travel History',
    'Visa Refusals',
    'Submit'
  ];

  // Dynamically filter countries
  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  ).slice(0, 5);

  // Dynamic container classes
  const containerStyle = inline ? {
    background: 'var(--color-surface)',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(11, 29, 53, 0.06)',
    border: '1px solid var(--color-border)',
    padding: '32px 28px',
    width: '100%',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative'
  } : {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    textAlign: 'left',
  };

  return (
    <div style={containerStyle} className="visa-quiz-container">
      {/* Styles Injected locally for clean, responsive design rules */}
      <style>{`
        .quiz-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--color-primary);
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          line-height: 1.25;
        }
        .quiz-desc {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin-bottom: 20px;
          line-height: 1.45;
        }
        .option-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }
        .option-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }
        .option-grid-5 {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: 18px;
        }
        .quiz-btn-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 16px 12px;
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          outline: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .quiz-btn-card:hover {
          border-color: var(--color-secondary-light);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(14, 165, 233, 0.06);
        }
        .quiz-btn-card.active {
          border-color: var(--color-secondary);
          background: rgba(14, 165, 233, 0.05);
          color: var(--color-secondary-dark);
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.12);
        }
        .quiz-btn-card-row {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 18px 20px;
          text-align: left;
          color: var(--color-text);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          gap: 16px;
          align-items: center;
          width: 100%;
          outline: none;
          margin-bottom: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .quiz-btn-card-row:hover {
          border-color: var(--color-secondary-light);
          transform: translateX(2px);
          box-shadow: 0 6px 14px rgba(14, 165, 233, 0.05);
        }
        .quiz-btn-card-row.active {
          border-color: var(--color-secondary);
          background: rgba(14, 165, 233, 0.05);
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
        }
        .search-container {
          position: relative;
          margin-bottom: 8px;
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
        }
        .search-input {
          width: 100%;
          border: 1.5px solid var(--color-border);
          border-radius: 12px;
          padding: 11px 14px 11px 40px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
          background: var(--color-bg);
        }
        .search-input:focus {
          border-color: var(--color-secondary);
          background: var(--color-surface);
        }
        .search-results-box {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .search-pill {
          background: var(--color-bg-alt);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.15s;
        }
        .search-pill:hover {
          background: var(--color-secondary);
          color: white;
          border-color: var(--color-secondary);
        }
        .input-group-quiz {
          margin-bottom: 14px;
        }
        .input-group-quiz label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-secondary);
          margin-bottom: 6px;
        }
        .input-quiz {
          width: 100%;
          border: 1.5px solid var(--color-border);
          border-radius: 12px;
          padding: 12px 14px 12px 42px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          background: var(--color-surface);
        }
        .input-quiz:focus {
          border-color: var(--color-secondary);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }
        @media (max-width: 480px) {
          .option-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .option-grid-3 {
            grid-template-columns: 1fr 1fr;
          }
          .option-grid-5 {
            grid-template-columns: repeat(3, 1fr);
          }
          .quiz-btn-card-row {
            padding: 12px 14px;
            gap: 12px;
          }
        }
      `}</style>

      {/* Visual Step Indicator Header */}
      {step <= 8 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
            <span>Question {step} of 8</span>
            <span style={{ color: 'var(--color-secondary)', fontWeight: 800 }}>{stepLabels[step - 1]}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {stepLabels.map((_, i) => (
              <div key={i} style={{ 
                flex: 1, 
                height: 4, 
                borderRadius: 4, 
                background: (i + 1) === step 
                  ? 'var(--gradient-accent)' 
                  : (i + 1) < step 
                    ? 'var(--color-secondary)' 
                    : 'var(--color-border)',
                boxShadow: (i + 1) === step ? '0 0 8px rgba(14, 165, 233, 0.4)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            ))}
          </div>
        </div>
      )}

      {error && (
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} style={{ display: 'flex', gap: 10, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: 13, alignItems: 'center', fontWeight: 500 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Step Contents with AnimatePresence */}
      <div style={{ minHeight: inline ? 340 : 'auto', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.div 
            key={step} 
            initial={{ opacity: 0, x: 15 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -15 }} 
            transition={{ duration: 0.18 }}
          >
            
            {/* STEP 1: Destination */}
            {step === 1 && (
              <div>
                <h3 className="quiz-title">Where is your dream destination? ✈️</h3>
                <p className="quiz-desc">Select your primary Schengen travel country. We'll load matching checklist templates.</p>
                
                <div className="option-grid-3">
                  {popularCountries.map(c => (
                    <button 
                      key={c.name}
                      onClick={() => handleSelectCountry(c.name)}
                      className={`quiz-btn-card ${formData.country === c.name ? 'active' : ''}`}
                    >
                      <img 
                        src={`https://flagcdn.com/w40/${c.code}.png`} 
                        alt="" 
                        style={{ width: 36, height: 24, borderRadius: 3, objectFit: 'cover', margin: '4px 0 6px' }} 
                      />
                      <span style={{ fontSize: 12, display: 'block', fontWeight: 700 }}>{c.name}</span>
                      <span style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 500 }}>{c.desc}</span>
                    </button>
                  ))}
                </div>

                <div className="search-container">
                  <Search size={15} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Or type to search other destinations..." 
                    className="search-input"
                    value={countrySearch}
                    onChange={e => setCountrySearch(e.target.value)}
                  />
                  {countrySearch && (
                    <div className="search-results-box">
                      {filteredCountries.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => {
                            setCountrySearch('');
                            handleSelectCountry(c.name);
                          }} 
                          className="search-pill"
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <img 
                            src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`} 
                            alt="" 
                            style={{ width: 14, height: 10, borderRadius: 1 }} 
                          />
                          <span>{c.name}</span>
                        </div>
                      ))}
                      {filteredCountries.length === 0 && (
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '4px 6px' }}>No matches found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: Nationality */}
            {step === 2 && (
              <div>
                <h3 className="quiz-title">Which passport do you hold? 🛂</h3>
                <p className="quiz-desc">Required document templates and checklists vary significantly based on your passport.</p>

                <div className="option-grid-5">
                  {popularNationalities.map(n => (
                    <button 
                      key={n.name}
                      onClick={() => handleSelectNationality(n.name)}
                      className={`quiz-btn-card ${formData.nationality === n.name ? 'active' : ''}`}
                    >
                      <img 
                        src={`https://flagcdn.com/w40/${n.code}.png`} 
                        alt="" 
                        style={{ width: 28, height: 18, borderRadius: 2, objectFit: 'cover', margin: '2px 0 4px' }} 
                      />
                      <span style={{ fontSize: 10, width: '100%', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{n.name}</span>
                    </button>
                  ))}
                </div>

                <div className="search-container">
                  <Search size={15} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Or type your passport nationality..." 
                    className="search-input"
                    value={formData.nationality}
                    onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Purpose */}
            {step === 3 && (
              <div>
                <h3 className="quiz-title">What is the purpose of your trip? 🏖️</h3>
                <p className="quiz-desc">We tailor checklists based on whether you are exploring, studying, or doing business.</p>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[
                    { val: 'Tourism', title: 'Tourism / Vacation', icon: Compass, desc: 'Sightseeing, tours, explore Europe' },
                    { val: 'Business', title: 'Business Meetings', icon: Briefcase, desc: 'Conferences, client visits, negotiations' },
                    { val: 'Study', title: 'Academic / Study', icon: GraduationCap, desc: 'Courses, terms, universities' },
                    { val: 'Family Visit', title: 'Family & Friends', icon: Globe, desc: 'Visiting legal EU residents or sponsors' },
                  ].map(p => (
                    <button
                      key={p.val}
                      onClick={() => handleSelectPurpose(p.val)}
                      className={`quiz-btn-card-row ${formData.purpose === p.val ? 'active' : ''}`}
                    >
                      <div style={{
                        padding: 10,
                        borderRadius: 10,
                        background: formData.purpose === p.val ? 'var(--gradient-accent)' : 'rgba(14, 165, 233, 0.08)',
                        color: formData.purpose === p.val ? 'white' : 'var(--color-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <p.icon size={18} />
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: 14, color: 'var(--color-text)', fontWeight: 700 }}>{p.title}</strong>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginTop: 2 }}>{p.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Employment */}
            {step === 4 && (
              <div>
                <h3 className="quiz-title">What is your current occupation? 👔</h3>
                <p className="quiz-desc">Confirming ties to your home country is critical to proving your return intention.</p>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[
                    { val: 'Employed', title: 'Salaried Employee', icon: Briefcase, desc: 'NOC letter, employment contract, tax returns' },
                    { val: 'Self-Employed', title: 'Self-Employed / Owner', icon: Compass, desc: 'Business license, bank invoices, tax slips' },
                    { val: 'Student', title: 'Full-time Student', icon: GraduationCap, desc: 'School ID card, enrollment certificate' },
                    { val: 'Retired', title: 'Retired / Other status', icon: HelpCircle, desc: 'Pension statement, property deeds or savings' },
                  ].map(e => (
                    <button
                      key={e.val}
                      onClick={() => handleSelectEmployed(e.val)}
                      className={`quiz-btn-card-row ${formData.employed === e.val ? 'active' : ''}`}
                    >
                      <div style={{
                        padding: 10,
                        borderRadius: 10,
                        background: formData.employed === e.val ? 'var(--gradient-accent)' : 'rgba(14, 165, 233, 0.08)',
                        color: formData.employed === e.val ? 'white' : 'var(--color-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <e.icon size={18} />
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: 14, color: 'var(--color-text)', fontWeight: 700 }}>{e.title}</strong>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginTop: 2 }}>{e.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: Funds */}
            {step === 5 && (
              <div>
                <h3 className="quiz-title">Can you show personal bank statements? 💰</h3>
                <p className="quiz-desc">Select how you plan to cover your expenses during your Schengen stay.</p>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[
                    { val: 'Yes, savings', title: 'Yes, I hold personal savings', desc: 'Active statements under my own name' },
                    { val: 'Will be sponsored', title: 'No, trip sponsored by family/employer', desc: 'Official sponsorship letter + sponsor statements' },
                    { val: 'Not sure', title: 'No access to standard statements', desc: 'Unsure about bank statements criteria' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => handleSelectFunds(opt.val)}
                      className={`quiz-btn-card-row ${formData.funds === opt.val ? 'active' : ''}`}
                    >
                      <div style={{
                        padding: 10,
                        borderRadius: 50,
                        border: '2px solid',
                        borderColor: formData.funds === opt.val ? 'var(--color-secondary)' : 'var(--color-border)',
                        color: formData.funds === opt.val ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 10
                      }}>
                        {formData.funds === opt.val ? '✓' : ''}
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: 14, color: 'var(--color-text)', fontWeight: 700 }}>{opt.title}</strong>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginTop: 2 }}>{opt.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6: History */}
            {step === 6 && (
              <div>
                <h3 className="quiz-title">Have you held a Schengen visa before? 🇪🇺</h3>
                <p className="quiz-desc">Previous Schengen travel history heavily reinforces your application profile.</p>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[
                    { val: 'Yes, Schengen', title: 'Yes, I held Schengen visa recently', desc: 'Visa stamps in last 5 years' },
                    { val: 'Yes, other countries', title: 'No Schengen, but traveled US/UK/Canada', desc: 'Valid stamps from other major jurisdictions' },
                    { val: 'No', title: 'No, clean passport with no travel stamps', desc: 'First time international visa application' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => handleSelectHistory(opt.val)}
                      className={`quiz-btn-card-row ${formData.history === opt.val ? 'active' : ''}`}
                    >
                      <div style={{
                        padding: 10,
                        borderRadius: 50,
                        border: '2px solid',
                        borderColor: formData.history === opt.val ? 'var(--color-secondary)' : 'var(--color-border)',
                        color: formData.history === opt.val ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 10
                      }}>
                        {formData.history === opt.val ? '✓' : ''}
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: 14, color: 'var(--color-text)', fontWeight: 700 }}>{opt.title}</strong>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginTop: 2 }}>{opt.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 7: Rejections */}
            {step === 7 && (
              <div>
                <h3 className="quiz-title">Have you had visa rejections? ⚠️</h3>
                <p className="quiz-desc">Declaring previous rejections is mandatory. We structure letters to mitigate refusal history.</p>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[
                    { val: 'No', title: 'No, completely clean record', desc: 'No previous visa refusals' },
                    { val: 'Yes, once', title: 'Yes, I have one refusal on record', desc: 'Refused once recently' },
                    { val: 'Yes, multiple', title: 'Yes, I have multiple rejections', desc: 'Refused more than once' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => handleSelectRejection(opt.val)}
                      className={`quiz-btn-card-row ${formData.rejection === opt.val ? 'active' : ''}`}
                    >
                      <div style={{
                        padding: 10,
                        borderRadius: 50,
                        border: '2px solid',
                        borderColor: formData.rejection === opt.val ? 'var(--color-secondary)' : 'var(--color-border)',
                        color: formData.rejection === opt.val ? 'var(--color-secondary)' : 'var(--color-text-muted)',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 10
                      }}>
                        {formData.rejection === opt.val ? '✓' : ''}
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: 14, color: 'var(--color-text)', fontWeight: 700 }}>{opt.title}</strong>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginTop: 2 }}>{opt.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 8: Contact Info */}
            {step === 8 && (
              <div>
                <h3 className="quiz-title">Unlock Your Eligibility Score 🚀</h3>
                <p className="quiz-desc">Provide your contact info to calculate your rating and register your free Client Portal checklist workspace.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="input-group-quiz">
                    <label>Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input 
                        className="input-quiz" 
                        placeholder="Your full name" 
                        value={formData.name} 
                        onChange={e => setFormData({ ...formData, name: e.target.value })} 
                        disabled={!!user} 
                      />
                    </div>
                  </div>

                  <div className="input-group-quiz">
                    <label>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input 
                        className="input-quiz" 
                        type="email" 
                        placeholder="name@example.com" 
                        value={formData.email} 
                        onChange={e => setFormData({ ...formData, email: e.target.value })} 
                        disabled={!!user} 
                      />
                    </div>
                  </div>

                  <div className="input-group-quiz">
                    <label>Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input 
                        className="input-quiz" 
                        placeholder="e.g. +44 7911 123456" 
                        value={formData.phone} 
                        onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: 11, justifyContent: 'center', marginTop: 4 }}>
                    <Lock size={12} />
                    <span>Secure encryption. No spam, ever.</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 9: Results page */}
            {step === 9 && result && (
              <div style={{ padding: '6px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginBottom: 16, position: 'relative' }}>
                  <svg width="120" height="120" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="70" cy="70" r="55" fill="none" stroke="var(--color-border)" strokeWidth="8" />
                    <motion.circle 
                      cx="70" 
                      cy="70" 
                      r="55" 
                      fill="none" 
                      stroke={result.score >= 70 ? 'var(--color-success)' : result.score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'} 
                      strokeWidth="10" 
                      strokeDasharray={345.5}
                      initial={{ strokeDashoffset: 345.5 }}
                      animate={{ strokeDashoffset: 345.5 - (345.5 * result.score) / 100 }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{ position: 'absolute', textAlign: 'center', top: '50%', left: '50%', transform: 'translate(-50%, -55%)' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-primary)', lineHeight: 1 }}>{displayScore}%</div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', color: result.score >= 70 ? 'var(--color-success)' : result.score >= 50 ? 'var(--color-warning)' : 'var(--color-danger)', marginTop: 4 }}>
                      {result.score >= 70 ? 'HIGH CHANCE' : result.score >= 50 ? 'MEDIUM CHANCE' : 'LOW CHANCE'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 18 }}>
                  <h4 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px', color: 'var(--color-primary)' }}>Schengen Eligibility Rating</h4>
                  <p className="text-muted" style={{ fontSize: 13, maxWidth: 440, margin: '0 auto', lineHeight: 1.5 }}>
                    {result.score >= 70
                      ? 'Congratulations! Your profile exhibits strong indicators. Activate your dashboard checklist to review template specifications.'
                      : result.score >= 50
                      ? 'Moderate approval rating. Booking a pre-audit document checklist review with our agents mitigates embassy refusal risks.'
                      : 'High-risk profile detected. We recommend initiating a consultation call to design a professional travel ties mitigation strategy.'}
                  </p>
                </div>

                {/* Structured Rating Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '0 auto 18px', maxWidth: 440 }}>
                  <div style={{ background: 'var(--color-bg)', padding: '12px 14px', borderRadius: 14, border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>✅ Key Strengths</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>• Destination:</span>
                        <img 
                          src={formData.country === 'Schengen Zone' 
                            ? 'https://flagcdn.com/w20/eu.png' 
                            : `https://flagcdn.com/w20/${(countries.find(c => c.name === formData.country)?.code || 'eu').toLowerCase()}.png`} 
                          alt="" 
                          style={{ width: 16, height: 11, borderRadius: 1, objectFit: 'cover' }} 
                        />
                        <span>{formData.country}</span>
                      </div>
                      <div>• Purpose: {formData.purpose}</div>
                      {formData.funds === 'Yes, savings' && <div>• Bank savings verified</div>}
                      {formData.rejection === 'No' && <div>• Clean visa history</div>}
                    </div>
                  </div>
                  <div style={{ background: 'var(--color-bg)', padding: '12px 14px', borderRadius: 14, border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>💡 Recommendation</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                      <div>• Get custom checklist</div>
                      {formData.funds !== 'Yes, savings' && <div>• Structure sponsor slips</div>}
                      {formData.history === 'No' && <div>• Optimize ties documents</div>}
                      {formData.rejection !== 'No' && <div>• Draft cover statement</div>}
                    </div>
                  </div>
                </div>

                {/* Account Credentials Panel */}
                {result.autoCreated ? (
                  <div style={{ background: 'rgba(14, 165, 233, 0.02)', border: '1px dashed var(--color-secondary)', borderRadius: 14, padding: '14px 16px', margin: '0 auto 18px', textAlign: 'left', maxWidth: 440 }}>
                    <h5 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Award size={16} color="var(--color-secondary)" /> Client Portal Account Seeding
                    </h5>
                    <p className="text-muted" style={{ fontSize: 11, marginBottom: 10 }}>
                      We registered a free dashboard containing document guidelines and live agent chat.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
                      <div><strong>Email:</strong> {formData.email.toLowerCase()}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <strong>Password:</strong>
                        <code style={{ fontSize: 12, padding: '2px 6px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 4, fontWeight: 700, fontFamily: 'monospace' }}>{result.tempPassword}</code>
                        <button onClick={handleCopyPassword} style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : result.userExists ? (
                  <div style={{ background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: 12, padding: 12, margin: '0 auto 18px', textAlign: 'left', maxWidth: 440, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    ℹ️ <strong>Registered Workspace Found:</strong> The email <strong>{formData.email}</strong> is already registered. Access the portal to manage your visa files.
                  </div>
                ) : null}

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 440, margin: '0 auto' }}>
                  <a href={getWhatsAppUrl()} target="_blank" rel="noreferrer" className="btn" style={{ background: '#25D366', borderColor: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, width: '100%', textDecoration: 'none', fontSize: 13, fontWeight: 700, borderRadius: 8 }}>
                    <MessageCircle size={18} /> Chat with Agent on WhatsApp
                  </a>
                  <button className="btn btn-primary" onClick={handleProceedToPortal} style={{ height: 42, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, borderRadius: 8 }}>
                    {result.userExists ? 'Access Client Portal' : 'Start Application & View Checklist'} <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation Actions */}
      {step <= 8 && (
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {step > 1 ? (
            <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: 12, padding: '8px 14px' }} onClick={handleBack}>
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 8 ? (
            <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12 }} onClick={handleNext}>
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 12 }} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Calculating...' : 'Get Result'} <CheckCircle2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
