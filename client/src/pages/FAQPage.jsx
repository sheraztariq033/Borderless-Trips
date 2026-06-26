import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, HelpCircle } from 'lucide-react';

const Reveal = ({ children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }} transition={{ duration: 0.5, delay }}>{children}</motion.div>
);

const faqCategories = {
  'Visa Services': [
    { q:'How long does a Schengen visa take?', a:'Processing typically takes 10-15 working days. We recommend applying 4-6 weeks before your planned travel date.' },
    { q:'What is your visa success rate?', a:'We maintain a 95%+ success rate for Schengen visa applications. Our experts ensure thorough documentation and preparation.' },
    { q:'Can you help with a rejected visa?', a:'Yes! We specialise in re-applications after rejection. We analyse the rejection reason and build a stronger case.' },
    { q:'What documents are needed for a Schengen visa?', a:'Common requirements include valid passport, photos, travel insurance, proof of accommodation, bank statements, employment letter, and flight itinerary. The exact list depends on your nationality and purpose of travel.' },
    { q:'Which country should I apply to?', a:'You should apply to the country where you\'ll spend the most time (main destination), or the first country of entry if equal time is spent.' },
    { q:'Do you offer visa services for countries outside Schengen?', a:'Currently we specialise in Schengen visas. For other visa types, please contact us and we\'ll advise on available options.' },
  ],
  'Holiday Packages': [
    { q:'Are flights included in your packages?', a:'Most of our packages include return flights from major UK airports. Check individual package details for specifics.' },
    { q:'Can I customise a package?', a:'Absolutely! All packages can be customised to suit your preferences, including dates, hotels, and activities. Contact us for a bespoke quote.' },
    { q:'What\'s included in the package price?', a:'Each package clearly states inclusions and exclusions. Typically includes accommodation, flights, transfers, and selected tours. Meals, personal expenses, and optional tours are usually excluded.' },
    { q:'Is travel insurance included?', a:'Basic travel insurance is included in most packages. We can arrange comprehensive cover for an additional fee.' },
  ],
  'Booking & Payment': [
    { q:'How do I make a payment?', a:'We accept payment via direct bank transfer only. After booking, you\'ll receive our bank details and a unique reference number. No online payment is required.' },
    { q:'Is a deposit required?', a:'Yes, a 30% deposit is required to confirm your booking. The remaining balance is due 30 days before departure.' },
    { q:'What is your cancellation policy?', a:'Cancellation policies vary by package. Generally: 30+ days before departure — full refund minus admin fee; 15-29 days — 50% refund; Less than 15 days — no refund. Travel insurance is recommended.' },
    { q:'Do you offer payment plans?', a:'Yes, we offer flexible payment plans for packages over £500. Contact us to discuss options.' },
  ],
  'General': [
    { q:'Are you a registered travel agency?', a:'Yes, Borderless Trips is a fully registered and licensed travel agency based in the United Kingdom.' },
    { q:'Do you have physical offices?', a:'Our main office is in London. We operate by appointment only. Most consultations are conducted online or by phone for your convenience.' },
    { q:'How can I reach customer support?', a:'You can reach us via phone (+44 123 456 7890), email (info@borderlesstrips.com), WhatsApp, or through our website contact form. We respond within 2 hours during business hours.' },
    { q:'Do you offer group discounts?', a:'Yes! Groups of 4+ travellers receive special discounted rates. Contact us for a group quote.' },
  ],
};

export default function FAQPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState(null);

  const allFaqs = Object.entries(faqCategories).flatMap(([cat, faqs]) =>
    faqs.map(f => ({ ...f, category: cat }))
  );

  const filtered = allFaqs.filter(f => {
    const matchSearch = !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === 'all' || f.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div>
      <section className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage:'url(https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1600&q=80)' }} />
        <div className="page-hero-overlay" />
        <div className="container page-hero-content text-center">
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}>
            <h1 className="heading-1" style={{ color:'white', margin:'0 0 1rem' }}>Frequently Asked Questions</h1>
            <p style={{ color:'rgba(255,255,255,0.7)', maxWidth:550, margin:'0 auto 2rem', fontSize:'var(--text-lg)' }}>
              Find answers to common questions about our visa services, holiday packages, and bookings.
            </p>
            <div style={{ maxWidth:500, margin:'0 auto', display:'flex', background:'rgba(255,255,255,0.1)', borderRadius:'var(--radius-lg)', border:'1px solid rgba(255,255,255,0.2)', padding:'4px' }}>
              <Search size={18} style={{ margin:'auto 12px', color:'rgba(255,255,255,0.5)' }} />
              <input type="text" placeholder="Search questions..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{ flex:1, padding:'12px 0', background:'transparent', border:'none', color:'white', outline:'none', fontSize:'var(--text-base)' }} />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container container-narrow">
          {/* Category tabs */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:'var(--space-8)', justifyContent:'center' }}>
            <button className={`btn ${activeCategory==='all'?'btn-primary':'btn-ghost'}`} onClick={()=>setActiveCategory('all')}>All</button>
            {Object.keys(faqCategories).map(cat => (
              <button key={cat} className={`btn ${activeCategory===cat?'btn-primary':'btn-ghost'}`} onClick={()=>setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)' }}>
            {filtered.map((faq,i) => (
              <Reveal key={i} delay={i*0.03}>
                <div className="card" style={{ overflow:'hidden' }}>
                  <button onClick={() => setOpenFaq(openFaq===i?null:i)}
                    style={{ width:'100%', padding:'var(--space-5)', display:'flex', justifyContent:'space-between', alignItems:'center', textAlign:'left', cursor:'pointer', fontWeight:600, background:'none', border:'none', color:'var(--color-text)', gap:16 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <HelpCircle size={18} color="var(--color-secondary)" style={{ flexShrink:0 }}/>
                      {faq.q}
                    </span>
                    <ChevronDown size={18} style={{ transform:openFaq===i?'rotate(180deg)':'none', transition:'0.2s', flexShrink:0 }} />
                  </button>
                  {openFaq === i && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
                      style={{ padding:'0 var(--space-5) var(--space-5)', paddingLeft:'calc(var(--space-5) + 30px)', color:'var(--color-text-secondary)', fontSize:'var(--text-sm)', lineHeight:1.8 }}>
                      {faq.a}
                      <div className="badge badge-primary" style={{ marginTop:8, fontSize:10 }}>{faq.category}</div>
                    </motion.div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center" style={{ padding:'var(--space-16)' }}>
              <HelpCircle size={48} color="var(--color-text-muted)" />
              <p className="text-muted" style={{ marginTop:16 }}>No questions found matching your search.</p>
            </div>
          )}

          {/* Still need help */}
          <Reveal>
            <div className="card text-center" style={{ padding:'var(--space-10)', marginTop:'var(--space-10)', background:'var(--color-bg-alt)' }}>
              <h3 className="heading-3">Still have questions?</h3>
              <p className="text-muted" style={{ marginBottom:24 }}>Can't find what you're looking for? Our team is happy to help.</p>
              <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
                <a href="tel:+441234567890" className="btn btn-primary">Call Us</a>
                <a href="https://wa.me/441234567890" className="btn btn-outline" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <style>{`
        .page-hero { position:relative; padding:calc(var(--nav-height)+var(--space-20)) 0 var(--space-20); min-height:400px; display:flex; align-items:center; }
        .page-hero-bg { position:absolute; inset:0; background-size:cover; background-position:center; }
        .page-hero-overlay { position:absolute; inset:0; background:linear-gradient(135deg,rgba(11,29,53,0.93),rgba(11,29,53,0.8)); }
        .page-hero-content { position:relative; z-index:1; }
      `}</style>
    </div>
  );
}
