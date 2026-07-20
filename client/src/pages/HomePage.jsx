import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useEvaluation } from '../context/EvaluationContext';
import { useSettings } from '../context/SettingsContext';
import VisaQuiz from '../components/common/VisaQuiz';
import {
  Shield, Plane, MapPin, Star, ArrowRight, CheckCircle2, Globe, Users,
  Award, Clock, Heart, Compass, Phone, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';

/* ---------- Animated Counter ---------- */
function Counter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ---------- Section Reveal ---------- */
function Reveal({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Data ---------- */
const services = [
  { icon: Shield, title: 'Schengen Visa Services', desc: 'Expert visa consultation with a 95%+ success rate. Calculate your free visa success score instantly and see your approval chances.', link: '/visa-services', color: '#0EA5E9' },
  { icon: Compass, title: 'Holiday Packages', desc: 'Handpicked luxury and budget-friendly packages to Europe\'s most stunning destinations.', link: '/holiday-packages', color: '#D4A574' },
  { icon: Plane, title: 'Flight Bookings', desc: 'Best deals on international and domestic flights with flexible booking options.', link: '/flights', color: '#10B981' },
  { icon: Heart, title: 'Honeymoon Specials', desc: 'Romantic getaways to Paris, Maldives, Santorini and more — perfectly curated for couples.', link: '/holiday-packages?type=honeymoon', color: '#EF4444' },
];

const stats = [
  { value: 2500, suffix: '+', label: 'Visas Approved', icon: Shield },
  { value: 5000, suffix: '+', label: 'Happy Travellers', icon: Users },
  { value: 50, suffix: '+', label: 'Destinations', icon: Globe },
  { value: 98, suffix: '%', label: 'Success Rate', icon: Award },
];

const testimonials = [
  { name: 'Sarah Mitchell', location: 'London, UK', text: 'Borderless Trips made my Schengen visa process completely stress-free. Approved in just 5 days! Highly recommend their professional service.', rating: 5 },
  { name: 'Ahmed Khan', location: 'Birmingham, UK', text: 'The holiday package to Italy was absolutely amazing. Everything was perfectly organized from flights to hotels. Best trip ever!', rating: 5 },
  { name: 'Priya Sharma', location: 'Manchester, UK', text: 'I was worried about my visa application after a previous rejection, but their team guided me perfectly. Got approved this time!', rating: 5 },
  { name: 'James Wilson', location: 'Leeds, UK', text: 'Fantastic service and great prices. The Switzerland package exceeded all our expectations. Will definitely book again!', rating: 4 },
  { name: 'Fatima Ali', location: 'Bristol, UK', text: 'The AI eligibility checker gave me confidence before applying. The whole process with Borderless Trips was seamless.', rating: 5 },
];

const destinations = [
  { name: 'Paris', country: 'France', flagCode: 'fr', price: '£499', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80' },
  { name: 'Rome', country: 'Italy', flagCode: 'it', price: '£549', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80' },
  { name: 'Barcelona', country: 'Spain', flagCode: 'es', price: '£479', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80' },
  { name: 'Santorini', country: 'Greece', flagCode: 'gr', price: '£699', image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&q=80' },
  { name: 'Amsterdam', country: 'Netherlands', flagCode: 'nl', price: '£399', image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&q=80' },
  { name: 'Zurich', country: 'Switzerland', flagCode: 'ch', price: '£799', image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&q=80' },
];

const steps = [
  { step: 1, title: 'Free Consultation', desc: 'Contact us for a free assessment of your visa eligibility or holiday requirements.' },
  { step: 2, title: 'Planning & Documentation', desc: 'We prepare all documents, itineraries, and handle embassy appointments.' },
  { step: 3, title: 'Application & Booking', desc: 'We submit your application or confirm bookings and keep you updated.' },
  { step: 4, title: 'Travel & Enjoy!', desc: 'Receive your visa or travel documents and enjoy your journey!' },
];

export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { openEvaluation } = useEvaluation();
  const { settings } = useSettings();
  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  const heroBgType = settings.hero_bg_type || 'images';
  const heroImages = settings.hero_images || [
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80",
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80",
    "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1600&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80"
  ];
  const heroVideo = settings.hero_video || "https://www.w3schools.com/html/movie.mp4";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (heroBgType !== 'images') return;
    const timer = setInterval(() => {
      setCurrentHeroImage(prev => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroBgType, heroImages.length]);

  return (
    <div className="home-page">
      {/* ===== HERO SECTION ===== */}
      <section className="hero" id="hero-section">
        <div className="hero-bg">
          {heroBgType === 'images' ? (
            heroImages.map((imgUrl, idx) => (
              <img
                key={imgUrl}
                src={imgUrl}
                alt=""
                className={`hero-bg-img ${idx === currentHeroImage ? 'active' : ''}`}
              />
            ))
          ) : (() => {
            // Detect YouTube URLs
            const ytMatch = heroVideo.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
            // Detect Vimeo URLs
            const vimeoMatch = heroVideo.match(/vimeo\.com\/(?:video\/)?(\d+)/);

            if (ytMatch) {
              return (
                <iframe
                  src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`}
                  title="Hero background video"
                  className="hero-bg-video"
                  style={{ objectFit: 'cover', border: 'none' }}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              );
            }
            if (vimeoMatch) {
              return (
                <iframe
                  src={`https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1&background=1&controls=0`}
                  title="Hero background video"
                  className="hero-bg-video"
                  style={{ objectFit: 'cover', border: 'none' }}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              );
            }
            // Direct video file (mp4, webm, etc.)
            return (
              <video
                src={heroVideo}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                poster="https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=1600"
                className="hero-bg-video"
                style={{ objectFit: 'cover' }}
              />
            );
          })()}
          <div className="hero-overlay" />
        </div>
        <div className="container hero-content">
          <motion.div
            className="hero-text"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="hero-badge">
              <Sparkles size={14} /> UK's Premium Travel Partner
            </div>
            <h1 className="heading-display" style={{ color: 'white', marginBottom: '1rem' }}>
              Unlimited Journeys,<br />
              <span className="text-gradient">Endless Discoveries</span>
            </h1>
            <p className="hero-subtitle">
              Expert Schengen visa services, luxury holiday packages, and seamless flight bookings.
              Your dream destination is just one step away.
            </p>
            <div className="hero-actions">
              <button onClick={() => openEvaluation()} className="btn btn-secondary btn-lg" id="hero-cta-visa" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer' }}>
                <Shield size={18} /> Check Visa Eligibility
              </button>
              <Link to="/holiday-packages" className="btn btn-outline btn-lg" id="hero-cta-packages" style={{ borderColor: 'white', color: 'white' }}>
                Explore Packages <ArrowRight size={18} />
              </Link>
            </div>
            <div className="hero-trust">
              <div className="hero-trust-item">
                <CheckCircle2 size={16} /> 2,500+ Visas Approved
              </div>
              <div className="hero-trust-item">
                <CheckCircle2 size={16} /> 98% Success Rate
              </div>
              <div className="hero-trust-item">
                <CheckCircle2 size={16} /> ATOL Protected
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll-indicator">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="hero-scroll-dot"
          />
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="stats-bar" id="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="stat-item">
                <stat.icon size={28} className="stat-icon" />
                <div className="stat-value">
                  <Counter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SCHENGEN ZONE COUNTRIES BANNER ===== */}
      <section style={{ background: 'var(--color-primary-dark)', padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'white', overflow: 'hidden' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-accent)' }}>
            Schengen Member States Covered
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(212,165,116,0.12)', border: '1px solid rgba(212,165,116,0.3)', padding: '6px 14px', borderRadius: 'var(--radius-full)' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'white' }}>🎉 Want to travel here?</span>
            <button onClick={() => openEvaluation()} style={{ background: 'var(--gradient-accent)', border: 'none', color: 'white', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)', cursor: 'pointer', transition: 'transform 0.2s', display: 'flex', alignItems: 'center', gap: 4 }}>
              Check Free Score
            </button>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            {[
              { code: 'fr', name: 'France' },
              { code: 'de', name: 'Germany' },
              { code: 'it', name: 'Italy' },
              { code: 'es', name: 'Spain' },
              { code: 'ch', name: 'Switzerland' },
              { code: 'nl', name: 'Netherlands' },
              { code: 'be', name: 'Belgium' },
              { code: 'at', name: 'Austria' },
              { code: 'gr', name: 'Greece' },
              { code: 'se', name: 'Sweden' },
              { code: 'no', name: 'Norway' },
              { code: 'dk', name: 'Denmark' },
              { code: 'pt', name: 'Portugal' },
              { code: 'pl', name: 'Poland' },
              { code: 'fi', name: 'Finland' },
              { code: 'is', name: 'Iceland' },
              { code: 'cz', name: 'Czech Republic' }
            ].map(c => (
              <img
                key={c.code}
                src={`https://flagcdn.com/w40/${c.code}.png`}
                alt={c.name}
                title={c.name}
                style={{ width: 28, height: 19, borderRadius: 2, display: 'block', objectFit: 'cover' }}
              />
            ))}
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
            & 10+ MORE
          </span>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section className="section" id="services-section">
        <div className="container">
          <Reveal>
            <div className="section-header text-center">
              <span className="section-label">What We Offer</span>
              <h2 className="heading-2" style={{ marginTop: '0.5rem' }}>Our Premium Services</h2>
              <div className="divider divider-center" />
              <p className="section-subtitle" style={{ margin: '1rem auto 0' }}>
                From visa consultation to luxury holiday planning, we deliver exceptional travel experiences
              </p>
            </div>
          </Reveal>
          <div className="services-grid">
            {services.map((service, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <Link to={service.link} className="service-card" id={`service-card-${i}`}>
                  <div className="service-icon" style={{ background: `${service.color}15`, color: service.color }}>
                    <service.icon size={28} />
                  </div>
                  <h3 className="heading-4">{service.title}</h3>
                  <p className="text-muted" style={{ fontSize: 'var(--text-sm)', lineHeight: '1.6', marginBottom: i === 0 ? 'var(--space-4)' : 0 }}>{service.desc}</p>
                  {i === 0 ? (
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEvaluation(); }} 
                      className="btn btn-secondary btn-sm" 
                      style={{ marginTop: 'auto', border: 'none', cursor: 'pointer', width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Shield size={14} /> Check Free Score
                    </button>
                  ) : (
                    <span className="service-link">
                      Learn More <ArrowRight size={14} />
                    </span>
                  )}
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== VISA CTA ===== */}
      <section className="visa-cta-section" id="visa-cta-section">
        <div className="container">
          <Reveal>
            <div className="visa-cta-inner">
              <div className="visa-cta-content">
                <span className="section-label" style={{ color: 'var(--color-accent)' }}>AI-Powered Assessment</span>
                <h2 className="heading-2" style={{ color: 'white', margin: '0.5rem 0 1rem' }}>
                  Check Your Visa Eligibility in 2 Minutes
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 500, lineHeight: 1.7 }}>
                  Our intelligent assessment tool analyses your profile and gives you an instant eligibility score,
                  personalised document checklist, and expert recommendations.
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                  <button onClick={() => openEvaluation()} className="btn btn-secondary btn-lg" id="visa-cta-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer' }}>
                    <Shield size={18} /> Start Free Assessment
                  </button>
                  <a href={`tel:${(settings.phone || '+44 123 456 7890').replace(/\s+/g, '')}`} className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                    <Phone size={18} /> Call Us Now
                  </a>
                </div>
              </div>
              <div className="visa-cta-features" style={{ background: 'transparent' }}>
                <VisaQuiz inline={true} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== DESTINATIONS ===== */}
      <section className="section" id="destinations-section">
        <div className="container">
          <Reveal>
            <div className="section-header text-center">
              <span className="section-label">Popular Destinations</span>
              <h2 className="heading-2" style={{ marginTop: '0.5rem' }}>Explore Dream Destinations</h2>
              <div className="divider divider-center" />
            </div>
          </Reveal>
          <div className="destinations-grid">
            {destinations.map((dest, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <Link to={`/holiday-packages?destination=${dest.name.toLowerCase()}`} className="destination-card" id={`dest-${dest.name.toLowerCase()}`}>
                  <img src={dest.image} alt={dest.name} className="destination-img" loading="lazy" />
                  <div className="destination-overlay">
                    <div className="destination-info">
                      <h3>{dest.name}</h3>
                      <p style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0 0' }}>
                        <MapPin size={14} />
                        <img src={`https://flagcdn.com/w20/${dest.flagCode}.png`} alt="" style={{ width: 16, height: 11, borderRadius: 1, objectFit: 'cover' }} />
                        <span>{dest.country}</span>
                      </p>
                    </div>
                    <div className="destination-price">
                      <span>From</span>
                      <strong>{dest.price}</strong>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          {/* ===== ELIGIBILITY CALLOUT CARD ===== */}
          <Reveal>
            <div style={{
              background: 'linear-gradient(135deg, rgba(212,165,116,0.1) 0%, rgba(14,165,233,0.06) 100%)',
              border: '1px solid rgba(212,165,116,0.2)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-8) var(--space-6)',
              marginTop: 'var(--space-8)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-4)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                background: 'rgba(14,165,233,0.1)',
                color: 'var(--color-secondary)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Instant Success Calculator
              </div>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0, color: 'var(--color-primary-light)' }}>Not Sure If You Qualify For A Schengen Visa?</h3>
              <p className="text-muted" style={{ maxWidth: 600, margin: 0, fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
                Our AI-powered eligibility tool checks your nationality, travel history, and funds in 2 minutes. Get your **Free Success Score** and a personalized checklist immediately.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={() => openEvaluation()} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer' }}>
                  <Shield size={16} /> Check Free Visa Score
                </button>
                <Link to="/holiday-packages" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  Browse Packages <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </Reveal>

          <div className="text-center" style={{ marginTop: 'var(--space-10)' }}>
            <Link to="/holiday-packages" className="btn btn-primary btn-lg" id="view-all-packages">
              View All Packages <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section how-it-works" id="how-it-works-section">
        <div className="container">
          <Reveal>
            <div className="section-header text-center">
              <span className="section-label">Simple Process</span>
              <h2 className="heading-2" style={{ marginTop: '0.5rem' }}>How It Works</h2>
              <div className="divider divider-center" />
            </div>
          </Reveal>
          <div className="steps-grid">
            {steps.map((step, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <div className="step-card" id={`step-${step.step}`}>
                  <div className="step-number">{step.step}</div>
                  <h3 className="heading-4">{step.title}</h3>
                  <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>{step.desc}</p>
                  {i < steps.length - 1 && <div className="step-connector hide-mobile" />}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="section testimonials-section" id="testimonials-section">
        <div className="container">
          <Reveal>
            <div className="section-header text-center">
              <span className="section-label">Client Reviews</span>
              <h2 className="heading-2" style={{ marginTop: '0.5rem' }}>What Our Clients Say</h2>
              <div className="divider divider-center" />
            </div>
          </Reveal>
          <div className="testimonial-carousel">
            <button
              className="testimonial-nav prev"
              onClick={() => setCurrentTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length)}
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="testimonial-track">
              {testimonials.map((t, i) => (
                <motion.div
                  key={i}
                  className="testimonial-card"
                  initial={false}
                  animate={{
                    opacity: i === currentTestimonial ? 1 : 0.3,
                    scale: i === currentTestimonial ? 1 : 0.9,
                    x: `${(i - currentTestimonial) * 110}%`,
                  }}
                  transition={{ duration: 0.5 }}
                  style={{ 
                    position: i === currentTestimonial ? 'relative' : 'absolute', 
                    left: 0, 
                    right: 0,
                    top: 0
                  }}
                >
                  <div className="stars">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={16} fill={j < t.rating ? '#F59E0B' : 'none'} color={j < t.rating ? '#F59E0B' : '#CBD5E1'} />
                    ))}
                  </div>
                  <p className="testimonial-text">"{t.text}"</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">{t.name[0]}</div>
                    <div>
                      <div className="testimonial-name">{t.name}</div>
                      <div className="testimonial-location">{t.location}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <button
              className="testimonial-nav next"
              onClick={() => setCurrentTestimonial(prev => (prev + 1) % testimonials.length)}
              aria-label="Next testimonial"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="testimonial-dots">
            {testimonials.map((_, i) => (
              <button
                key={i}
                className={`testimonial-dot ${i === currentTestimonial ? 'active' : ''}`}
                onClick={() => setCurrentTestimonial(i)}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="final-cta-section" id="final-cta">
        <div className="container text-center">
          <Reveal>
            <h2 className="heading-1" style={{ color: 'white', marginBottom: '1rem' }}>
              Ready to Start Your Journey?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 600, margin: '0 auto 2rem', fontSize: 'var(--text-lg)' }}>
              Whether it's a Schengen visa or a dream holiday, we're here to make it happen.
              Contact us today for a free consultation.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/contact" className="btn btn-secondary btn-lg" id="final-cta-contact">
                Get Free Consultation
              </Link>
              <Link to="/holiday-packages" className="btn btn-white btn-lg" id="final-cta-packages">
                Browse Packages <ArrowRight size={18} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <style>{`
        /* ===== HERO ===== */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .hero-bg-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transform: scale(1.05);
          transition: opacity 1.5s ease-in-out, transform 6s ease-out;
          z-index: 0;
        }

        .hero-bg-img.active {
          opacity: 1;
          transform: scale(1.01);
          z-index: 1;
        }

        .hero-bg-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
          pointer-events: none;
        }

        /* Iframes (YouTube/Vimeo) can't use object-fit, so we scale them up to cover */
        iframe.hero-bg-video {
          width: 100vw;
          height: 56.25vw; /* 16:9 */
          min-height: 100vh;
          min-width: 177.77vh; /* 16:9 */
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(11,29,53,0.92) 0%, rgba(11,29,53,0.75) 50%, rgba(14,165,233,0.4) 100%);
          z-index: 2;
        }

        .hero-bg-switcher {
          position: absolute;
          bottom: 2rem;
          right: 2rem;
          z-index: 10;
          background: rgba(11, 29, 53, 0.65);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 4px;
          border-radius: var(--radius-xl);
          display: flex;
          gap: 4px;
          box-shadow: var(--shadow-lg);
        }

        .btn-switcher-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius-lg);
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          background: transparent;
          transition: all 0.3s;
          cursor: pointer;
          border: none;
        }

        .btn-switcher-tab.active {
          color: white;
          background: var(--gradient-accent);
        }

        .btn-switcher-tab:hover:not(.active) {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }

        @media (max-width: 768px) {
          .hero-bg-switcher {
            bottom: 5.5rem;
            right: 50%;
            transform: translateX(50%);
          }
        }

        .hero-content {
          position: relative;
          z-index: 1;
          padding-top: calc(var(--nav-height) + var(--space-16));
          padding-bottom: var(--space-16);
        }

        .hero-text {
          max-width: 700px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          background: rgba(212,165,116,0.15);
          border: 1px solid rgba(212,165,116,0.3);
          border-radius: var(--radius-full);
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-accent);
          margin-bottom: var(--space-6);
        }

        .hero-subtitle {
          font-size: var(--text-xl);
          color: rgba(255,255,255,0.75);
          line-height: 1.7;
          margin-bottom: var(--space-8);
          max-width: 560px;
        }

        .hero-actions {
          display: flex;
          gap: var(--space-4);
          flex-wrap: wrap;
          margin-bottom: var(--space-8);
        }

        .hero-trust {
          display: flex;
          gap: var(--space-6);
          flex-wrap: wrap;
        }

        .hero-trust-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          color: rgba(255,255,255,0.6);
        }

        .hero-trust-item svg {
          color: var(--color-success-light);
        }

        .hero-scroll-indicator {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 40px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 12px;
          display: flex;
          justify-content: center;
          padding-top: 6px;
        }

        .hero-scroll-dot {
          width: 4px;
          height: 8px;
          background: white;
          border-radius: 2px;
        }

        /* ===== STATS ===== */
        .stats-bar {
          background: var(--color-surface);
          padding: var(--space-10) 0;
          border-bottom: 1px solid var(--color-border);
          margin-top: -1px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-8);
          text-align: center;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
        }

        .stat-icon {
          color: var(--color-secondary);
          margin-bottom: var(--space-2);
        }

        .stat-value {
          font-size: var(--text-4xl);
          font-weight: 800;
          color: var(--color-primary);
          font-family: var(--font-serif);
        }

        .stat-label {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          font-weight: 500;
        }

        /* ===== SERVICES ===== */
        .section-header {
          margin-bottom: var(--space-12);
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-6);
        }

        .service-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          padding: var(--space-8);
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
          text-decoration: none;
          color: inherit;
          transition: all var(--transition-base);
        }

        .service-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-card-hover);
          border-color: var(--color-secondary);
        }

        .service-icon {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-link {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-secondary);
          margin-top: auto;
        }

        /* ===== VISA CTA ===== */
        .visa-cta-section {
          background: var(--gradient-primary);
          padding: var(--space-20) 0;
        }

        .visa-cta-inner {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: var(--space-12);
          align-items: center;
        }

        .visa-cta-features {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .visa-cta-feature {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          background: rgba(255,255,255,0.05);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255,255,255,0.08);
        }

        /* ===== DESTINATIONS ===== */
        .destinations-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-6);
        }

        .destination-card {
          position: relative;
          border-radius: var(--radius-xl);
          overflow: hidden;
          aspect-ratio: 4/3;
          display: block;
        }

        .destination-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }

        .destination-card:hover .destination-img {
          transform: scale(1.08);
        }

        .destination-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(transparent 40%, rgba(0,0,0,0.7) 100%);
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding: var(--space-5);
        }

        .destination-info h3 {
          font-size: var(--text-xl);
          font-weight: 700;
          color: white;
        }

        .destination-info p {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--text-sm);
          color: rgba(255,255,255,0.7);
        }

        .destination-price {
          text-align: right;
        }

        .destination-price span {
          display: block;
          font-size: var(--text-xs);
          color: rgba(255,255,255,0.6);
        }

        .destination-price strong {
          font-size: var(--text-xl);
          color: var(--color-accent-light);
        }

        /* ===== HOW IT WORKS ===== */
        .how-it-works {
          background: var(--color-bg-alt);
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-6);
        }

        .step-card {
          text-align: center;
          padding: var(--space-6);
          position: relative;
        }

        .step-number {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-full);
          background: var(--gradient-accent);
          color: white;
          font-size: var(--text-xl);
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto var(--space-4);
          box-shadow: 0 4px 15px rgba(14,165,233,0.3);
        }

        .step-connector {
          position: absolute;
          top: 52px;
          right: -24px;
          width: 48px;
          height: 2px;
          background: var(--color-border);
        }

        .step-connector::after {
          content: '';
          position: absolute;
          right: -4px;
          top: -3px;
          width: 8px;
          height: 8px;
          border-right: 2px solid var(--color-border);
          border-bottom: 2px solid var(--color-border);
          transform: rotate(-45deg);
        }

        /* ===== TESTIMONIALS ===== */
        .testimonials-section {
          background: var(--color-surface);
        }

        .testimonial-carousel {
          position: relative;
          max-width: 700px;
          margin: 0 auto;
          overflow: hidden;
        }

        .testimonial-track {
          position: relative;
          min-height: 250px;
        }

        .testimonial-card {
          width: 100%;
          padding: var(--space-8);
          text-align: center;
          top: 0;
        }

        .testimonial-card .stars {
          justify-content: center;
          margin-bottom: var(--space-4);
        }

        .testimonial-text {
          font-size: var(--text-lg);
          font-style: italic;
          color: var(--color-text-secondary);
          line-height: 1.8;
          margin-bottom: var(--space-6);
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          justify-content: center;
        }

        .testimonial-avatar {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-full);
          background: var(--gradient-accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: var(--text-lg);
        }

        .testimonial-name {
          font-weight: 600;
          color: var(--color-text);
        }

        .testimonial-location {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        .testimonial-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--color-text);
          z-index: 2;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-md);
        }

        .testimonial-nav:hover {
          background: var(--color-secondary);
          color: white;
          border-color: var(--color-secondary);
        }

        .testimonial-nav.prev { left: -60px; }
        .testimonial-nav.next { right: -60px; }

        .testimonial-dots {
          display: flex;
          justify-content: center;
          gap: var(--space-2);
          margin-top: var(--space-4);
        }

        .testimonial-dot {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-full);
          background: var(--color-border);
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .testimonial-dot.active {
          width: 24px;
          background: var(--color-secondary);
        }

        /* ===== FINAL CTA ===== */
        .final-cta-section {
          background: var(--gradient-primary);
          padding: var(--space-20) 0;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1024px) {
          .services-grid, .steps-grid { grid-template-columns: repeat(2, 1fr); }
          .visa-cta-inner { grid-template-columns: 1fr; }
          .destinations-grid { grid-template-columns: repeat(2, 1fr); }
          .testimonial-nav { display: none; }
        }

        @media (max-width: 768px) {
          .hero { min-height: 90vh; }
          .hero-subtitle { font-size: var(--text-base); }
          .hero-actions { flex-direction: column; }
          .hero-actions .btn { width: 100%; }
          .hero-trust { flex-direction: column; gap: var(--space-3); }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
          .stat-value { font-size: var(--text-2xl); }
          .services-grid { grid-template-columns: 1fr; }
          .service-card { padding: var(--space-6); }
          .steps-grid { grid-template-columns: 1fr; }
          .step-connector { display: none; }
          .destinations-grid { grid-template-columns: 1fr; }
          .testimonial-card { padding: var(--space-4); }
        }
      `}</style>
    </div>
  );
}
