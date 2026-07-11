import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, Star, Users, CheckCircle2, X as XIcon, Calendar, ArrowRight, Share2, Heart, Phone, ChevronDown } from 'lucide-react';

const packageData = {
  1: { id:1, title:'Romantic Paris Getaway', destination:'Paris, France', duration:'5 Days / 4 Nights', price:499, originalPrice:649, type:'honeymoon', rating:4.9, reviews:128, image:'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80', images:['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80','https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80','https://images.unsplash.com/photo-1503917988258-f87a78e3c995?w=800&q=80'], description:'Experience the city of love with our carefully curated Paris getaway. From the Eiffel Tower to Montmartre, immerse yourself in Parisian charm.', includes:['4-star boutique hotel','Return flights from London','Daily breakfast','Eiffel Tower tickets','Seine River cruise','Airport transfers','Travel insurance'], excludes:['Lunch & dinner','Personal expenses','Optional tours'], itinerary:[{day:1,title:'Arrival & City Walk',desc:'Arrive in Paris, check into hotel, evening walk along Champs-Élysées.'},{day:2,title:'Iconic Paris',desc:'Visit the Eiffel Tower, lunch near Trocadéro, afternoon at the Louvre.'},{day:3,title:'Montmartre & Culture',desc:'Explore Montmartre, Sacré-Cœur, artist quarter, and local café culture.'},{day:4,title:'Seine & Shopping',desc:'Morning Seine river cruise, afternoon at Galeries Lafayette, farewell dinner.'},{day:5,title:'Departure',desc:'Breakfast and airport transfer for your return flight.'}]},
  2: { id:2, title:'Italian Dream Tour', destination:'Rome & Venice, Italy', duration:'7 Days / 6 Nights', price:799, originalPrice:999, type:'adventure', rating:4.8, reviews:95, image:'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80', images:['https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80','https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80'], description:'Discover Italy\'s greatest treasures. From Rome\'s ancient wonders to Venice\'s romantic canals.', includes:['4-star hotels','Return flights','Daily breakfast','Colosseum tour','Gondola ride','Train Rome-Venice','Travel insurance'], excludes:['Lunch & dinner','Personal expenses'], itinerary:[{day:1,title:'Welcome to Rome',desc:'Arrive, hotel check-in, evening at Trevi Fountain.'},{day:2,title:'Ancient Rome',desc:'Colosseum, Roman Forum, Palatine Hill.'},{day:3,title:'Vatican City',desc:'St Peter\'s Basilica, Sistine Chapel.'},{day:4,title:'Rome to Venice',desc:'High-speed train to Venice, afternoon walk.'},{day:5,title:'Venice Highlights',desc:'St Mark\'s Square, gondola ride, Murano island.'},{day:6,title:'Free Day',desc:'Explore at leisure, shopping, local dining.'},{day:7,title:'Departure',desc:'Transfer to airport.'}]},
};

// Fallback for any id
const getPackage = (id) => packageData[id] || packageData[1];

export default function PackageDetailPage() {
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [showBooking, setShowBooking] = useState(false);
  const [formData, setFormData] = useState({ name:'', email:'', phone:'', date:'', travelers:1, notes:'' });
  const [submitted, setSubmitted] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/packages/${id}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        let imgs = [];
        if (Array.isArray(data.images)) {
          imgs = data.images;
        } else if (typeof data.images === 'string' && data.images.trim()) {
          try {
            const parsed = JSON.parse(data.images);
            imgs = Array.isArray(parsed) ? parsed : [data.images];
          } catch (e) {
            imgs = data.images.split(',').map(s => s.trim()).filter(Boolean);
          }
        }

        const normalized = {
          ...data,
          images: imgs,
          image: imgs[0] || data.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80'
        };

        if (typeof normalized.includes === 'string') {
          try { normalized.includes = JSON.parse(normalized.includes); } catch (e) { normalized.includes = []; }
        }
        if (typeof normalized.excludes === 'string') {
          try { normalized.excludes = JSON.parse(normalized.excludes); } catch (e) { normalized.excludes = []; }
        }
        if (typeof normalized.itinerary === 'string') {
          try { normalized.itinerary = JSON.parse(normalized.itinerary); } catch (e) { normalized.itinerary = []; }
        }
        setPkg(normalized);
        setLoading(false);
      })
      .catch(() => {
        const staticPkg = getPackage(id);
        setPkg(staticPkg);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem('bt_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setFormData(prev => ({
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

  const handlePrev = () => {
    if (pkg && pkg.images && pkg.images.length > 0) {
      setActiveImg(prev => (prev === 0 ? pkg.images.length - 1 : prev - 1));
    }
  };

  const handleNext = () => {
    if (pkg && pkg.images && pkg.images.length > 0) {
      setActiveImg(prev => (prev === pkg.images.length - 1 ? 0 : prev + 1));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('bt_token');
    fetch('/api/bookings', { 
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }, 
      body: JSON.stringify({ 
        ...formData, 
        packageId: pkg.id, 
        packageTitle: pkg.title, 
        price: pkg.price 
      }) 
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit booking request.');
      return data;
    })
    .then(data => {
      if (data.booking) {
        setBookingResult(data);
        setSubmitted(true);
        if (data.token) {
          localStorage.setItem('bt_token', data.token);
          localStorage.setItem('bt_user', JSON.stringify({
            id: data.booking.user_id,
            email: data.email,
            name: formData.name,
            role: 'customer'
          }));
          window.dispatchEvent(new Event('auth_change'));
        }
      }
    })
    .catch((err) => {
      alert(err.message || 'Something went wrong. Please try again.');
    });
  };

  if (loading) {
    return (
      <div style={{ paddingTop: 'var(--nav-height)', textAlign: 'center', padding: '100px 0', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <div style={{ width: 40, height: 40, border: '4px solid var(--color-border)', borderTop: '4px solid var(--color-secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p className="text-muted">Loading package details...</p>
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div style={{ paddingTop: 'var(--nav-height)', textAlign: 'center', padding: '100px 0' }}>
        <h2 className="heading-3">Package not found</h2>
        <p className="text-muted">The requested package could not be loaded.</p>
        <Link to="/holiday-packages" className="btn btn-primary" style={{ marginTop: 16 }}>Back to Packages</Link>
      </div>
    );
  }

  return (
    <div>
      <section className="page-hero" style={{ minHeight:350 }}>
        <div className="page-hero-bg" style={{ backgroundImage:`url(${pkg.image})` }} />
        <div className="page-hero-overlay" />
        <div className="container page-hero-content">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              <span className="badge badge-gold">{pkg.type}</span>
              <span className="badge badge-primary">{pkg.duration}</span>
            </div>
            <h1 className="heading-1" style={{ color:'white' }}>{pkg.title}</h1>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginTop:12, color:'rgba(255,255,255,0.7)' }}>
              <span style={{ display:'flex', alignItems:'center', gap:4 }}><MapPin size={16}/> {pkg.destination}</span>
              <span style={{ display:'flex', alignItems:'center', gap:4 }}><Star size={16} fill="#F59E0B" color="#F59E0B"/> {pkg.rating} ({pkg.reviews} reviews)</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:'var(--space-8)', alignItems:'start' }}>
            <div>
              {/* Gallery with Navigation Overlay Arrows */}
              <div style={{ position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: 'var(--space-4)', boxShadow: 'var(--shadow-md)' }}>
                <img 
                  src={pkg.images?.[activeImg] || pkg.image} 
                  alt={pkg.title} 
                  style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', transition: 'all 0.3s ease' }} 
                />
                {pkg.images && pkg.images.length > 1 && (
                  <>
                    <button 
                      onClick={handlePrev} 
                      style={{
                        position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                        background: 'rgba(11,29,53,0.7)', color: 'white', border: 'none', borderRadius: '50%',
                        width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'background 0.2s', backdropFilter: 'blur(4px)',
                        fontSize: '24px', fontWeight: 'bold'
                      }}
                      type="button"
                    >
                      ‹
                    </button>
                    <button 
                      onClick={handleNext} 
                      style={{
                        position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                        background: 'rgba(11,29,53,0.7)', color: 'white', border: 'none', borderRadius: '50%',
                        width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'background 0.2s', backdropFilter: 'blur(4px)',
                        fontSize: '24px', fontWeight: 'bold'
                      }}
                      type="button"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              
              {/* Thumbnail Gallery with Active Borders */}
              {pkg.images && pkg.images.length > 1 && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 'var(--space-8)', overflowX: 'auto', padding: '4px 0' }}>
                  {pkg.images.map((img, i) => (
                    <img 
                      key={i} src={img} alt="" onClick={() => setActiveImg(i)}
                      style={{ 
                        width: 100, height: 68, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', 
                        transition: 'all 0.2s ease',
                        border: activeImg === i ? '3px solid var(--color-secondary)' : '3px solid transparent',
                        boxShadow: activeImg === i ? '0 0 8px rgba(245,158,11,0.5)' : 'none',
                        opacity: activeImg === i ? 1 : 0.6
                      }} 
                    />
                  ))}
                </div>
              )}

              <h2 className="heading-3" style={{ marginBottom:12 }}>About This Package</h2>
              <p style={{ color:'var(--color-text-secondary)', lineHeight:1.8, marginBottom:'var(--space-8)' }}>{pkg.description}</p>

              {/* Inclusions */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-6)', marginBottom:'var(--space-8)' }}>
                <div>
                  <h3 className="heading-4" style={{ marginBottom:12, color:'var(--color-success)' }}>What's Included</h3>
                  {pkg.includes?.map((item,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, fontSize:'var(--text-sm)' }}>
                      <CheckCircle2 size={16} color="var(--color-success)" /> {item}
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="heading-4" style={{ marginBottom:12, color:'var(--color-danger)' }}>Not Included</h3>
                  {pkg.excludes?.map((item,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, fontSize:'var(--text-sm)', color:'var(--color-text-muted)' }}>
                      <XIcon size={16} color="var(--color-danger)" /> {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Itinerary */}
              <h2 className="heading-3" style={{ marginBottom:16 }}>Day-by-Day Itinerary</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:0, marginBottom:'var(--space-8)' }}>
                {pkg.itinerary?.map((day,i) => (
                  <div key={i} style={{ display:'flex', gap:'var(--space-5)' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                      <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--gradient-accent)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'var(--text-sm)', flexShrink:0 }}>
                        D{day.day}
                      </div>
                      {i < pkg.itinerary.length-1 && <div style={{ width:2, flex:1, background:'var(--color-border)', margin:'4px 0' }} />}
                    </div>
                    <div style={{ paddingBottom:'var(--space-6)' }}>
                      <h4 style={{ fontWeight:600 }}>{day.title}</h4>
                      <p className="text-muted" style={{ fontSize:'var(--text-sm)', marginTop:4 }}>{day.desc || day.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar - Booking */}
            <div className="card" style={{ position:'sticky', top:'calc(var(--nav-height) + 24px)', padding:'var(--space-6)' }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:'var(--space-4)' }}>
                {pkg.originalPrice || pkg.original_price ? (
                  <span style={{ textDecoration:'line-through', color:'var(--color-text-muted)' }}>£{pkg.originalPrice || pkg.original_price}</span>
                ) : null}
                <span style={{ fontSize:'var(--text-3xl)', fontWeight:800, color:'var(--color-primary)' }}>£{pkg.price}</span>
                <span className="text-muted">/person</span>
              </div>
              {(pkg.originalPrice || pkg.original_price) && (
                <div className="badge badge-danger" style={{ marginBottom:'var(--space-6)' }}>
                  Save £{(pkg.originalPrice || pkg.original_price) - pkg.price} ({Math.round((1 - pkg.price/(pkg.originalPrice || pkg.original_price))*100)}% off)
                </div>
              )}

              {!submitted ? (
                <form onSubmit={handleSubmit}>
                  <div className="form-group" style={{ marginBottom:12 }}>
                    <input className="form-input" placeholder="Your Name" required value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} />
                  </div>
                  <div className="form-group" style={{ marginBottom:12 }}>
                    <input className="form-input" type="email" placeholder="Email Address" required value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} />
                  </div>
                  <div className="form-group" style={{ marginBottom:12 }}>
                    <input className="form-input" placeholder="Phone Number" required value={formData.phone} onChange={e=>setFormData({...formData,phone:e.target.value})} />
                  </div>
                  <div className="form-group" style={{ marginBottom:12 }}>
                    <input className="form-input" type="date" required value={formData.date} onChange={e=>setFormData({...formData,date:e.target.value})} />
                  </div>
                  <div className="form-group" style={{ marginBottom:12 }}>
                    <select className="form-input form-select" value={formData.travelers} onChange={e=>setFormData({...formData,travelers:e.target.value})}>
                      {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} Traveller{n>1?'s':''}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom:16 }}>
                    <textarea className="form-input form-textarea" placeholder="Special requests (optional)" rows={2} value={formData.notes} onChange={e=>setFormData({...formData,notes:e.target.value})} style={{ minHeight:60 }} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%' }}>
                    Book Now — £{pkg.price * (formData.travelers || 1)}
                  </button>
                  <p className="text-muted text-center" style={{ fontSize:'var(--text-xs)', marginTop:12 }}>
                    Submit booking to secure reservation. Complete payment inside portal.
                  </p>
                </form>
              ) : (
                <div className="text-center" style={{ padding: '12px 0' }}>
                  <div style={{ background: 'rgba(16,185,129,0.1)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle2 size={36} color="var(--color-success)" />
                  </div>
                  <h3 className="heading-4">Booking Request Sent!</h3>
                  <p className="text-muted" style={{ fontSize: 'var(--text-sm)', margin: '12px 0 20px', lineHeight: 1.5 }}>
                    We have received your booking request for <strong>{pkg.title}</strong>.
                  </p>

                  {bookingResult?.autoCreated && (
                    <div style={{ background: '#0F172A', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: 16, margin: '20px 0', textAlign: 'left' }}>
                      <h5 style={{ color: 'var(--color-gold)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        🔑 Portal Account Active
                      </h5>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 12 }}>
                        We've created a customer account so you can manage this booking, upload payment receipts, and sign traveler agreements.
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
                    <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px dashed var(--color-gold)', borderRadius: 12, padding: 12, margin: '20px 0', textAlign: 'left', fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      An account already exists for <strong>{bookingResult.email}</strong>. Log in to your portal to review and manage this booking.
                    </div>
                  )}

                  {localStorage.getItem('bt_token') && (
                    <div style={{ margin: '16px 0' }}>
                      <Link to="/portal" className="btn btn-primary" style={{ width: '100%' }}>
                        Go to Customer Portal
                      </Link>
                    </div>
                  )}

                  <a href="tel:+441234567890" className="btn btn-outline" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}>
                    <Phone size={16}/> Call Us Now
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>


      <style>{`
        .page-hero { position:relative; padding:calc(var(--nav-height)+var(--space-16)) 0 var(--space-16); display:flex; align-items:center; }
        .page-hero-bg { position:absolute; inset:0; background-size:cover; background-position:center; }
        .page-hero-overlay { position:absolute; inset:0; background:linear-gradient(135deg,rgba(11,29,53,0.93) 0%,rgba(11,29,53,0.8) 100%); }
        .page-hero-content { position:relative; z-index:1; }
        @media(max-width:1024px) {
          .container > div { grid-template-columns:1fr !important; }
        }
      `}</style>
    </div>
  );
}
