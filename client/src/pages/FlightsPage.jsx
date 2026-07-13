import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Search, ArrowRight, Calendar, Users, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Reveal = ({ children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }} transition={{ duration: 0.5, delay }}>{children}</motion.div>
);

const popularRoutes = [
  { from: 'London', to: 'Paris', price: '£89', airline: 'Multiple Airlines' },
  { from: 'London', to: 'Rome', price: '£109', airline: 'Multiple Airlines' },
  { from: 'London', to: 'Barcelona', price: '£79', airline: 'Multiple Airlines' },
  { from: 'London', to: 'Amsterdam', price: '£69', airline: 'Multiple Airlines' },
  { from: 'London', to: 'Istanbul', price: '£149', airline: 'Multiple Airlines' },
  { from: 'London', to: 'Dubai', price: '£299', airline: 'Multiple Airlines' },
  { from: 'Manchester', to: 'Paris', price: '£99', airline: 'Multiple Airlines' },
  { from: 'Birmingham', to: 'Rome', price: '£119', airline: 'Multiple Airlines' },
];

export default function FlightsPage() {
  const { settings } = useSettings();
  const [form, setForm] = useState({ 
    from:'', to:'', departDate:'', returnDate:'', passengers:1, class:'economy', tripType:'return',
    name: '', email: '', phone: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [flightRates, setFlightRates] = useState([]);

  useEffect(() => {
    // 1. Fetch dynamic flight rates
    fetch('/api/flights/rates')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setFlightRates(data);
        } else {
          setFlightRates(popularRoutes);
        }
      })
      .catch(() => {
        setFlightRates(popularRoutes);
      });

    // 2. Pre-fill logged in user info
    const token = localStorage.getItem('bt_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setForm(prev => ({
            ...prev,
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || ''
          }));
        }
      })
      .catch(() => {});
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('bt_token');
    fetch('/api/flights/request', { 
      method:'POST', 
      headers:{
        'Content-Type':'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }, 
      body:JSON.stringify({
        fromCity: form.from,
        toCity: form.to,
        departDate: form.departDate,
        returnDate: form.returnDate,
        passengers: form.passengers,
        flightClass: form.class,
        tripType: form.tripType,
        name: form.name,
        email: form.email,
        phone: form.phone
      }) 
    })
    .then(res => res.json())
    .then(data => {
      setBookingResult(data);
      setSubmitted(true);
      if (data.token) {
        localStorage.setItem('bt_token', data.token);
        localStorage.setItem('bt_user', JSON.stringify({
          email: data.email,
          name: form.name,
          role: 'customer'
        }));
        window.dispatchEvent(new Event('auth_change'));
      }
    })
    .catch(()=>{});
  };

  return (
    <div>
      <section className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage:'url(https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=1600&q=80)' }} />
        <div className="page-hero-overlay" />
        <div className="container page-hero-content">
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}>
            <span className="section-label" style={{ color:'var(--color-accent)' }}>Best Deals Guaranteed</span>
            <h1 className="heading-1" style={{ color:'white', margin:'0.5rem 0 1rem' }}>Flight Bookings</h1>
            <p style={{ color:'rgba(255,255,255,0.7)', maxWidth:550, fontSize:'var(--text-lg)' }}>
              Get the best deals on international flights. Request a quote and we'll find you the most competitive fares.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search Form */}
      <section className="section">
        <div className="container container-narrow">
          <Reveal>
            <div className="card" style={{ padding:'var(--space-8)' }}>
              {!submitted ? (
                <>
                  <h2 className="heading-3" style={{ marginBottom:'var(--space-6)', textAlign:'center' }}>
                    <Plane size={24} style={{ display:'inline', verticalAlign:'middle', marginRight:8, color:'var(--color-secondary)' }} />
                    Request a Flight Quote
                  </h2>
                  <div style={{ display:'flex', gap:16, marginBottom:24 }}>
                    {['return','one-way'].map(t => (
                      <label key={t} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
                        <input type="radio" name="tripType" checked={form.tripType===t} onChange={() => setForm({...form, tripType:t})} />
                        <span style={{ fontWeight:500, textTransform:'capitalize' }}>{t.replace('-',' ')}</span>
                      </label>
                    ))}
                  </div>
                  <form onSubmit={handleSubmit}>
                    {/* Contact Information */}
                    <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr', gap:16, marginBottom:16 }}>
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-input" placeholder="Passenger Name" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input className="form-input" type="email" placeholder="email@domain.com" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input className="form-input" placeholder="Phone Number" required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
                      </div>
                    </div>

                    {/* Flight Details */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                      <div className="form-group">
                        <label className="form-label">From</label>
                        <input className="form-input" placeholder="e.g. London Heathrow" required value={form.from} onChange={e=>setForm({...form,from:e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">To</label>
                        <input className="form-input" placeholder="e.g. Paris CDG" required value={form.to} onChange={e=>setForm({...form,to:e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Departure Date</label>
                        <input className="form-input" type="date" required value={form.departDate} onChange={e=>setForm({...form,departDate:e.target.value})} />
                      </div>
                      {form.tripType === 'return' && (
                        <div className="form-group">
                          <label className="form-label">Return Date</label>
                          <input className="form-input" type="date" value={form.returnDate} onChange={e=>setForm({...form,returnDate:e.target.value})} />
                        </div>
                      )}
                      <div className="form-group">
                        <label className="form-label">Passengers</label>
                        <select className="form-input form-select" value={form.passengers} onChange={e=>setForm({...form,passengers:e.target.value})}>
                          {[1,2,3,4,5,6,7,8].map(n=><option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Class</label>
                        <select className="form-input form-select" value={form.class} onChange={e=>setForm({...form,class:e.target.value})}>
                          <option value="economy">Economy</option>
                          <option value="premium">Premium Economy</option>
                          <option value="business">Business</option>
                          <option value="first">First Class</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%', marginTop:24 }}>
                      <Search size={18}/> Get Quote
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center" style={{ padding:'var(--space-8) 0' }}>
                  <CheckCircle2 size={56} color="var(--color-success)" />
                  <h3 className="heading-3" style={{ marginTop:16 }}>Quote Request Received!</h3>
                  <p className="text-muted" style={{ margin:'8px auto 24px', maxWidth:400 }}>
                    Our team will find the best available fares and contact you within 1-2 hours with options.
                  </p>

                  {bookingResult?.autoCreated && (
                    <div style={{ background: '#0F172A', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: 16, margin: '20px auto', textAlign: 'left', maxWidth: 450 }}>
                      <h5 style={{ color: 'var(--color-gold)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        🔑 Portal Account Active
                      </h5>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 12 }}>
                        We've created a customer account so you can view flight quote status, upload payment evidence, and message our agents.
                      </p>
                      <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 6, marginBottom: 12 }}>
                        <div><strong>Email:</strong> {bookingResult.email}</div>
                        <div><strong>Password:</strong> {bookingResult.tempPassword}</div>
                      </div>
                      <div>
                        <Link to="/portal" className="btn btn-secondary btn-sm" style={{ width: '100%', fontSize: '11px', textAlign: 'center', display: 'block' }}>
                          Go to Customer Portal
                        </Link>
                      </div>
                    </div>
                  )}

                  {bookingResult?.userExists && !localStorage.getItem('bt_token') && (
                    <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px dashed var(--color-gold)', borderRadius: 12, padding: 12, margin: '20px auto', textAlign: 'left', fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5, maxWidth: 450 }}>
                      An account already exists for <strong>{bookingResult.email}</strong>. Log in to your portal to review and manage this flight quote request.
                    </div>
                  )}

                  {localStorage.getItem('bt_token') && (
                    <div style={{ margin: '16px auto', maxWidth: 300 }}>
                      <Link to="/portal" className="btn btn-primary" style={{ width: '100%' }}>
                        Go to Customer Portal
                      </Link>
                    </div>
                  )}

                  <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginTop: 16 }}>
                    <a href={`tel:${(settings.phone || '+44 123 456 7890').replace(/\s+/g, '')}`} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={16}/> Call Now</a>
                    <button className="btn btn-outline" onClick={()=>setSubmitted(false)}>New Search</button>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>


      {/* Popular Routes */}
      <section className="section" style={{ background:'var(--color-bg-alt)' }}>
        <div className="container">
          <Reveal>
            <div className="section-header text-center">
              <span className="section-label">Popular Routes</span>
              <h2 className="heading-2" style={{ marginTop:'0.5rem' }}>Trending Flight Deals</h2>
              <div className="divider divider-center" />
              <p className="section-subtitle" style={{ margin:'1rem auto 0' }}>Indicative prices — contact us for exact fares and availability</p>
            </div>
          </Reveal>
          <div className="grid grid-4">
            {flightRates.map((r,i) => (
              <Reveal key={i} delay={i*0.05}>
                <div className="card" style={{ padding:'var(--space-5)', display:'flex', alignItems:'center', gap:'var(--space-4)' }}>
                  <Plane size={20} color="var(--color-secondary)" />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:'var(--text-sm)' }}>{r.from_city || r.from} → {r.to_city || r.to}</div>
                    <div className="text-muted" style={{ fontSize:'var(--text-xs)' }}>{r.airline}</div>
                  </div>
                  <div style={{ fontWeight:700, color:'var(--color-secondary)', fontSize:'var(--text-lg)' }}>
                    {r.price?.startsWith('£') ? r.price : `£${r.price}`}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .page-hero { position:relative; padding:calc(var(--nav-height)+var(--space-20)) 0 var(--space-20); min-height:400px; display:flex; align-items:center; }
        .page-hero-bg { position:absolute; inset:0; background-size:cover; background-position:center; }
        .page-hero-overlay { position:absolute; inset:0; background:linear-gradient(135deg,rgba(11,29,53,0.93),rgba(11,29,53,0.8)); }
        .page-hero-content { position:relative; z-index:1; }
        @media(max-width:768px) {
          form > div { grid-template-columns:1fr !important; }
        }
      `}</style>
    </div>
  );
}
