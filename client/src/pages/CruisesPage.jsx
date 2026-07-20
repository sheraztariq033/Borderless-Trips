import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ship, Calendar, MapPin, Users, Compass, CheckCircle2, AlertCircle, Anchor } from 'lucide-react';

const destinations = [
  {
    id: 'med',
    name: 'Mediterranean Cruise',
    duration: '7 - 14 Nights',
    price: 'From £599',
    description: 'Explore the historic coastlines of Italy, Spain, France, and Greece. Visit ancient ruins, taste coastal delicacies, and experience stunning sunset views.',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&q=80',
    highlights: ['Rome & Barcelona tours', 'Santorini sunset sails', 'All-inclusive onboard dining', 'English-speaking tour guides']
  },
  {
    id: 'caribbean',
    name: 'Eastern Caribbean Getaway',
    duration: '7 - 10 Nights',
    price: 'From £499',
    description: 'Sail across turquoise waters to private tropical islands. Enjoy white sand beaches, coral reef snorkeling, and duty-free shopping in premium ports.',
    image: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&q=80',
    highlights: ['Cozy private cabanas', 'Snorkeling in Nassau', 'Shipboard waterpark access', 'Duty-free island tours']
  },
  {
    id: 'alaska',
    name: 'Alaskan Glaciers Expedition',
    duration: '7 - 12 Nights',
    price: 'From £899',
    description: 'Witness calving glaciers, snow-capped mountains, and majestic marine wildlife including whales and seals. An unforgettable journey of natural wonder.',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80',
    highlights: ['Glacier Bay sailing', 'Juneau whale watching', 'Helicopter glacier tours', 'Dog sledding experiences']
  },
  {
    id: 'river',
    name: 'European River Cruises',
    duration: '5 - 9 Nights',
    price: 'From £699',
    description: 'Gently glide down the romantic Rhine, Danube, or Seine rivers. Experience charming villages, historic castles, and vineyard tours from a boutique vessel.',
    image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&q=80',
    highlights: ['Vineyard wine tastings', 'Guided castle tours', 'Docking in city centres', 'Boutique river cruisers']
  }
];

const partners = [
  { name: 'Royal Caribbean', logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&q=80', desc: 'World class family entertainment' },
  { name: 'MSC Cruises', logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&q=80', desc: 'Elegant European hospitality' },
  { name: 'Norwegian Cruise Line', logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&q=80', desc: 'Freestyle cruising flexibility' },
  { name: 'Princess Cruises', logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&q=80', desc: 'Premium destination-rich sails' }
];

export default function CruisesPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    destination: 'Mediterranean Cruise',
    cruiseLine: 'Any',
    departureMonth: 'October 2026',
    cabinType: 'Balcony Room',
    duration: '7 - 10 Nights',
    guests: '2',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Dynamic JSON-LD Cruise Schema for Google Search Engine Console indexing
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Global Cruise Packages | Borderless Trips",
      "description": "Tailored luxury ocean and river cruise packages including Mediterranean, Caribbean, Alaska, and European River sails.",
      "image": "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&q=80",
      "brand": {
        "@type": "Brand",
        "name": "Borderless Trips"
      },
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "GBP",
        "lowPrice": "499",
        "highPrice": "4999",
        "offerCount": "4"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'cruise-schema-ld';
    script.innerHTML = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('cruise-schema-ld');
      if (existing) existing.remove();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const message = `Cruise Inquiry Details:
- Destination: ${formData.destination}
- Preferred Cruise Line: ${formData.cruiseLine}
- Departure: ${formData.departureMonth}
- Cabin Type: ${formData.cabinType}
- Duration: ${formData.duration}
- Number of Guests: ${formData.guests}
- Customer Notes: ${formData.notes || 'None'}`;

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: `Cruise Inquiry - ${formData.destination}`,
          message: message,
          type: 'cruise'
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit booking inquiry');
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        destination: 'Mediterranean Cruise',
        cruiseLine: 'Any',
        departureMonth: 'October 2026',
        cabinType: 'Balcony Room',
        duration: '7 - 10 Nights',
        guests: '2',
        notes: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cruises-page">
      {/* Hero Header */}
      <section className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1548574505-5e239809ee19?w=1600&q=80)' }} />
        <div className="page-hero-overlay" />
        <div className="container page-hero-content">
          <span className="section-label" style={{ color: 'var(--color-accent)' }}><Anchor size={14} style={{ display: 'inline-block', marginRight: 4, transform: 'translateY(1px)' }} /> Premium Voyages</span>
          <h1 className="heading-1" style={{ color: 'white', margin: '0.5rem 0 1rem' }}>Global Cruise Packages</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 550, fontSize: 'var(--text-lg)' }}>
            Sail in absolute luxury across Mediterranean horizons, Caribbean shores, and Alaskan fjords. Tailored bookings with curated itineraries.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="section">
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 40 }}>
          {/* Destination List */}
          <div>
            <h2 className="heading-2" style={{ marginBottom: 24 }}>Popular Voyages</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
              {destinations.map(d => (
                <div key={d.id} className="card cruise-card" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 20, overflow: 'hidden', padding: 0 }}>
                  <img src={d.image} alt={d.name} style={{ width: '100%', height: '100%', minHeight: 220, objectFit: 'cover' }} />
                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {d.duration}</span>
                      <strong style={{ color: 'var(--color-secondary)', fontSize: 18 }}>{d.price}</strong>
                    </div>
                    <h3 className="heading-3" style={{ fontSize: 18, marginBottom: 8 }}>{d.name}</h3>
                    <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{d.description}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 'auto' }}>
                      {d.highlights.map((h, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                          <CheckCircle2 size={12} style={{ color: 'var(--color-secondary)' }} />
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Side */}
          <div>
            <div className="card sticky-form" style={{ padding: 24, background: 'var(--color-bg-card)', borderRadius: 16, border: '1px solid var(--color-border)', position: 'sticky', top: 100 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ padding: 8, borderRadius: 8, background: 'rgba(14,165,233,0.1)', color: 'var(--color-secondary)' }}>
                  <Ship size={20} />
                </div>
                <div>
                  <h3 className="heading-3" style={{ fontSize: 16, margin: 0 }}>Book Cruise Inquiry</h3>
                  <p className="text-muted" style={{ fontSize: 11, margin: 0 }}>Receive dynamic quotes and schedule review</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, color: '#475569' }}>Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 13 }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, color: '#475569' }}>Email</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, color: '#475569' }}>Phone</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+44 7..." style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 13 }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, color: '#475569' }}>Destination</label>
                    <select value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 13 }}>
                      {destinations.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, color: '#475569' }}>Cruise Line</label>
                    <select value={formData.cruiseLine} onChange={e => setFormData({ ...formData, cruiseLine: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 13 }}>
                      <option value="Any">Any Cruise Line</option>
                      <option value="Royal Caribbean">Royal Caribbean</option>
                      <option value="MSC Cruises">MSC Cruises</option>
                      <option value="Norwegian Cruise Line">Norwegian</option>
                      <option value="Princess Cruises">Princess Cruises</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, color: '#475569' }}>Departure</label>
                    <input type="text" value={formData.departureMonth} onChange={e => setFormData({ ...formData, departureMonth: e.target.value })} placeholder="October 2026" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, color: '#475569' }}>Guests</label>
                    <input type="number" min="1" max="10" value={formData.guests} onChange={e => setFormData({ ...formData, guests: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 13 }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, color: '#475569' }}>Cabin Preference</label>
                  <select value={formData.cabinType} onChange={e => setFormData({ ...formData, cabinType: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 13 }}>
                    <option value="Inside Cabin">Inside Cabin (Value)</option>
                    <option value="Oceanview Room">Oceanview Room</option>
                    <option value="Balcony Room">Balcony Room (Recommended)</option>
                    <option value="Luxury Suite">Luxury Suite</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6, color: '#475569' }}>Special Requests</label>
                  <textarea rows="2" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Dietary needs, cabin placement, connecting rooms..." style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 13, resize: 'none' }} />
                </div>

                <button type="submit" disabled={submitting} className="btn btn-secondary" style={{ width: '100%', padding: 12, fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                  {submitting ? 'Sending Request...' : 'Submit Inquiry'}
                </button>

                <AnimatePresence>
                  {success && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, background: 'rgba(34,197,94,0.1)', color: 'var(--color-success)', fontSize: 12, marginTop: 4 }}>
                      <CheckCircle2 size={16} /> Inquiry submitted successfully! Our cruise agents will contact you shortly.
                    </motion.div>
                  )}
                  {error && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', fontSize: 12, marginTop: 4 }}>
                      <AlertCircle size={16} /> {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Grid */}
      <section className="section" style={{ borderTop: '1px solid var(--color-border)', background: 'rgba(248,250,252,0.5)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: 32 }}>
            <span className="section-label">Partners</span>
            <h2 className="heading-3">Featured Cruise Lines</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {partners.map(p => (
              <div key={p.name} className="card text-center" style={{ padding: 20 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(14,165,233,0.08)', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifycontent: 'center', margin: '0 auto 12px' }}>
                  <Compass size={28} />
                </div>
                <h4 style={{ fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>{p.name}</h4>
                <p className="text-muted" style={{ fontSize: 11, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .page-hero { position:relative; padding:calc(var(--nav-height) + var(--space-20)) 0 var(--space-20); min-height:350px; display:flex; align-items:center; }
        .page-hero-bg { position:absolute; inset:0; background-size:cover; background-position:center; }
        .page-hero-overlay { position:absolute; inset:0; background:linear-gradient(135deg,rgba(11,29,53,0.93),rgba(11,29,53,0.8)); }
        .page-hero-content { position:relative; z-index:1; }
        .cruise-card { transition: transform 0.25s, box-shadow 0.25s; }
        .cruise-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
        @media (max-width: 900px) {
          .container { grid-template-columns: 1fr !important; }
          .cruise-card { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
