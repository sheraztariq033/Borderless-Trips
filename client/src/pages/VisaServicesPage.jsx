import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEvaluation } from '../context/EvaluationContext';
import { useAuth } from '../context/AuthContext';
import {
  Shield, CheckCircle2, Clock, FileText, ArrowRight, ChevronDown,
  Globe, MapPin, AlertCircle, Star, Phone, Users
} from 'lucide-react';

const Reveal = ({ children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }} transition={{ duration: 0.5, delay }}>{children}</motion.div>
);

const countries = [
  { name: 'France', flagCode: 'fr', time: '10-15 days', price: '£149' },
  { name: 'Germany', flagCode: 'de', time: '10-15 days', price: '£149' },
  { name: 'Italy', flagCode: 'it', time: '10-15 days', price: '£149' },
  { name: 'Spain', flagCode: 'es', time: '10-15 days', price: '£149' },
  { name: 'Netherlands', flagCode: 'nl', time: '10-15 days', price: '£149' },
  { name: 'Switzerland', flagCode: 'ch', time: '10-15 days', price: '£149' },
  { name: 'Austria', flagCode: 'at', time: '10-15 days', price: '£149' },
  { name: 'Belgium', flagCode: 'be', time: '10-15 days', price: '£149' },
  { name: 'Greece', flagCode: 'gr', time: '10-15 days', price: '£149' },
  { name: 'Portugal', flagCode: 'pt', time: '10-15 days', price: '£149' },
  { name: 'Czech Republic', flagCode: 'cz', time: '10-15 days', price: '£149' },
  { name: 'Sweden', flagCode: 'se', time: '15-20 days', price: '£149' },
];

const visaTypes = [
  { type: 'Tourist Visa', desc: 'For holidays, sightseeing, and leisure travel. Up to 90 days.', icon: Globe },
  { type: 'Business Visa', desc: 'For meetings, conferences, and business activities.', icon: FileText },
  { type: 'Visit Visa', desc: 'For visiting family or friends residing in Schengen countries.', icon: Users },
  { type: 'Transit Visa', desc: 'For passing through a Schengen country to your final destination.', icon: MapPin },
];

const timeline = [
  { step: 1, title: 'Free Consultation', desc: 'We assess your eligibility and advise the best approach.' },
  { step: 2, title: 'Document Preparation', desc: 'We prepare, review, and organise all required documents.' },
  { step: 3, title: 'Application Filing', desc: 'We fill your application form and book embassy appointment.' },
  { step: 4, title: 'Interview Prep', desc: 'We brief you on possible interview questions and tips.' },
  { step: 5, title: 'Tracking & Updates', desc: 'We track your application and keep you informed.' },
  { step: 6, title: 'Visa Collection', desc: 'Collect your approved visa and prepare for travel!' },
];

const faqs = [
  { q: 'How long does a Schengen visa take?', a: 'Processing typically takes 10-15 working days from the date of appointment. We recommend applying at least 4-6 weeks before travel.' },
  { q: 'What is your success rate?', a: 'We maintain a 95%+ success rate for Schengen visa applications. Our expert team ensures every application is thoroughly prepared.' },
  { q: 'Can you help with rejected visas?', a: 'Yes! We specialise in re-applications after rejection. We analyse the reason for rejection and prepare a stronger case.' },
  { q: 'What documents do I need?', a: 'Requirements vary by nationality and purpose. Use our AI eligibility checker or contact us for a personalised document checklist.' },
  { q: 'How much does your service cost?', a: 'Our visa consultation service starts from £149. This includes document preparation, application filling, and interview prep.' },
];

export default function VisaServicesPage() {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const { openEvaluation } = useEvaluation();

  const quizQuestions = [
    { id: 'nationality', q: 'What is your nationality?', opts: ['Pakistani', 'Indian', 'Bangladeshi', 'Nigerian', 'Egyptian', 'Other'] },
    { id: 'purpose', q: 'Purpose of visit?', opts: ['Tourism', 'Business', 'Family Visit', 'Study', 'Transit'] },
    { id: 'employed', q: 'Employment status?', opts: ['Employed', 'Self-Employed', 'Student', 'Retired', 'Unemployed'] },
    { id: 'funds', q: 'Can you show sufficient funds?', opts: ['Yes, savings', 'Will be sponsored', 'Not sure'] },
    { id: 'history', q: 'Previous international travel?', opts: ['Yes, Schengen', 'Yes, other countries', 'No'] },
    { id: 'rejection', q: 'Any previous visa rejections?', opts: ['No', 'Yes, once', 'Yes, multiple'] },
  ];

  const handleQuizAnswer = (answer) => {
    const newAnswers = { ...quizAnswers, [quizQuestions[quizStep].id]: answer };
    setQuizAnswers(newAnswers);
    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      setShowResult(true);
    }
  };

  const getScore = () => {
    let s = 80;
    if (quizAnswers.history === 'Yes, Schengen') s += 10;
    if (quizAnswers.history === 'No') s -= 10;
    if (quizAnswers.employed === 'Unemployed') s -= 20;
    if (quizAnswers.funds === 'Not sure') s -= 15;
    if (quizAnswers.rejection === 'Yes, once') s -= 10;
    if (quizAnswers.rejection === 'Yes, multiple') s -= 25;
    return Math.max(20, Math.min(100, s));
  };

  return (
    <div className="page-visa">
      {/* Hero */}
      <section className="page-hero">
        <div className="page-hero-bg" style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1600&q=80)',
        }} />
        <div className="page-hero-overlay" />
        <div className="container page-hero-content">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="section-label" style={{ color: 'var(--color-accent)' }}>Expert Visa Services</span>
            <h1 className="heading-1" style={{ color: 'white', margin: '0.5rem 0 1rem' }}>
              Schengen Visa Services
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 600, fontSize: 'var(--text-lg)', lineHeight: 1.7 }}>
              Professional visa consultation with 95%+ approval rate. We handle everything from 
              documentation to embassy appointments.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
              <button onClick={() => openEvaluation()} className="btn btn-secondary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer' }}>
                <Shield size={18} /> Check Eligibility
              </button>
              <Link to="/contact" className="btn btn-outline btn-lg" style={{ borderColor: 'white', color: 'white' }}>
                <Phone size={18} /> Book Consultation
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Visa Types */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-header text-center">
              <span className="section-label">Visa Categories</span>
              <h2 className="heading-2" style={{ marginTop: '0.5rem' }}>Types of Schengen Visa</h2>
              <div className="divider divider-center" />
            </div>
          </Reveal>
          <div className="grid grid-4" style={{ gap: 'var(--space-6)' }}>
            {visaTypes.map((v, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="card" style={{ padding: 'var(--space-6)' }}>
                  <div className="service-icon" style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--color-secondary)', marginBottom: '1rem' }}>
                    <v.icon size={24} />
                  </div>
                  <h3 className="heading-4">{v.type}</h3>
                  <p className="text-muted" style={{ fontSize: 'var(--text-sm)', marginTop: '0.5rem' }}>{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Countries */}
      <section className="section" style={{ background: 'var(--color-bg-alt)' }}>
        <div className="container">
          <Reveal>
            <div className="section-header text-center">
              <span className="section-label">Schengen Zone</span>
              <h2 className="heading-2" style={{ marginTop: '0.5rem' }}>Countries We Cover</h2>
              <div className="divider divider-center" />
            </div>
          </Reveal>
          <div className="grid grid-4" style={{ gap: 'var(--space-4)' }}>
            {countries.map((c, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <img
                    src={`https://flagcdn.com/w40/${c.flagCode}.png`}
                    alt=""
                    style={{ width: 32, height: 22, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{c.name}</div>
                    <div className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                      <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                      {c.time}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>{c.price}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility Quiz */}
      <section className="section" id="eligibility" style={{ background: 'var(--gradient-primary)' }}>
        <div className="container">
          <Reveal>
            <div className="section-header text-center">
              <span className="section-label" style={{ color: 'var(--color-accent)' }}>AI-Powered Tool</span>
              <h2 className="heading-2" style={{ color: 'white', marginTop: '0.5rem' }}>Check Your Visa Eligibility</h2>
              <div className="divider divider-center divider-gold" />
              <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '1rem' }}>
                Answer a few questions to get an instant eligibility assessment
              </p>
            </div>
          </Reveal>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="card" style={{ padding: 'var(--space-8)' }}>
              {!showResult ? (
                <>
                  {/* Progress bar */}
                  <div style={{ background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-full)', height: 6, marginBottom: 'var(--space-6)' }}>
                    <div style={{
                      background: 'var(--gradient-accent)', height: '100%', borderRadius: 'var(--radius-full)',
                      width: `${((quizStep + 1) / quizQuestions.length) * 100}%`, transition: 'width 0.3s'
                    }} />
                  </div>
                  <p className="text-muted" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
                    Question {quizStep + 1} of {quizQuestions.length}
                  </p>
                  <h3 className="heading-3" style={{ marginBottom: 'var(--space-6)' }}>
                    {quizQuestions[quizStep].q}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {quizQuestions[quizStep].opts.map(opt => (
                      <button
                        key={opt}
                        className="btn btn-outline"
                        style={{ justifyContent: 'flex-start', width: '100%' }}
                        onClick={() => handleQuizAnswer(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div style={{
                    width: 120, height: 120, borderRadius: '50%',
                    border: `4px solid ${getScore() >= 70 ? 'var(--color-success)' : getScore() >= 50 ? 'var(--color-warning)' : 'var(--color-danger)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                    margin: '0 auto var(--space-6)'
                  }}>
                    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: getScore() >= 70 ? 'var(--color-success)' : getScore() >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                      {getScore()}%
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {getScore() >= 70 ? 'HIGH' : getScore() >= 50 ? 'MEDIUM' : 'LOW'}
                    </div>
                  </div>
                  <h3 className="heading-3">Your Eligibility Score</h3>
                  <p className="text-muted" style={{ margin: '1rem 0 2rem', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
                    {getScore() >= 70
                      ? 'Great news! You have a strong chance of approval. Book a free consultation to get started.'
                      : getScore() >= 50
                      ? 'You have a moderate chance. Our experts can help strengthen your application.'
                      : 'Your case needs professional attention. We specialise in challenging applications.'}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to={user ? "/portal" : "/register"} className="btn btn-primary btn-lg">
                      {user ? "Access Client Portal" : "Start Application & View Checklist"}
                    </Link>
                    <button className="btn btn-outline" onClick={() => { setShowResult(false); setQuizStep(0); setQuizAnswers({}); }}>
                      Retake Quiz
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-header text-center">
              <span className="section-label">Our Process</span>
              <h2 className="heading-2" style={{ marginTop: '0.5rem' }}>How We Help You</h2>
              <div className="divider divider-center" />
            </div>
          </Reveal>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            {timeline.map((t, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div style={{ display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', background: 'var(--gradient-accent)',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, flexShrink: 0
                    }}>{t.step}</div>
                    {i < timeline.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--color-border)', marginTop: 8 }} />}
                  </div>
                  <div style={{ paddingBottom: 'var(--space-4)' }}>
                    <h4 className="heading-4">{t.title}</h4>
                    <p className="text-muted" style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>{t.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" style={{ background: 'var(--color-bg-alt)' }}>
        <div className="container container-narrow">
          <Reveal>
            <div className="section-header text-center">
              <span className="section-label">Common Questions</span>
              <h2 className="heading-2" style={{ marginTop: '0.5rem' }}>Visa FAQ</h2>
              <div className="divider divider-center" />
            </div>
          </Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="card" style={{ overflow: 'hidden' }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: '100%', padding: 'var(--space-5)', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', textAlign: 'left', cursor: 'pointer', fontWeight: 600,
                      background: 'none', border: 'none', color: 'var(--color-text)'
                    }}
                  >
                    {faq.q}
                    <ChevronDown size={18} style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: '0.2s', flexShrink: 0, marginLeft: 16 }} />
                  </button>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      style={{ padding: '0 var(--space-5) var(--space-5)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--gradient-accent)', padding: 'var(--space-16) 0', textAlign: 'center' }}>
        <div className="container">
          <h2 className="heading-2" style={{ color: 'white', marginBottom: '1rem' }}>Ready to Apply?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 500, margin: '0 auto 2rem' }}>
            Get expert assistance with your Schengen visa application. Free initial consultation.
          </p>
          <Link to="/contact" className="btn btn-white btn-lg">
            Book Free Consultation <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <style>{`
        .page-hero {
          position: relative;
          padding: calc(var(--nav-height) + var(--space-20)) 0 var(--space-20);
          min-height: 500px;
          display: flex;
          align-items: center;
        }
        .page-hero-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
        }
        .page-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(11,29,53,0.93) 0%, rgba(11,29,53,0.8) 100%);
        }
        .page-hero-content {
          position: relative;
          z-index: 1;
        }
        .service-icon {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
