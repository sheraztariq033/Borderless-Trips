import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, HelpCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Reveal = ({ children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }} transition={{ duration: 0.5, delay }}>{children}</motion.div>
);

export default function FAQPage() {
  const { settings } = useSettings();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState(null);

  const phoneVal = settings.phone || '+44 123 456 7890';
  const emailVal = settings.email || 'info@borderlesstrips.com';
  const whatsappVal = settings.whatsapp || '441234567890';

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
      { q:'Are you a registered travel agency?', a:`Yes, ${settings.business_name || 'Borderless Trips'} is a fully registered and licensed travel agency based in the United Kingdom.` },
      { q:'Do you have physical offices?', a:`Our main office is in ${settings.address || 'London, United Kingdom'}. We operate by appointment only. Most consultations are conducted online or by phone for your convenience.` },
      { q:'How can I reach customer support?', a:`You can reach us via phone (${phoneVal}), email (${emailVal}), WhatsApp, or through our website contact form. We respond within 2 hours during business hours.` },
      { q:'Do you offer group discounts?', a:'Yes! Groups of 4+ travellers receive special discounted rates. Contact us for a group quote.' },
    ],
  };

  const allFaqs = Object.entries(faqCategories).flatMap(([cat, faqs]) =>
    faqs.map(f => ({ ...f, category: cat }))
  );

  const filteredFaqs = allFaqs.filter(faq => {
    const matchesSearch = faq.q.toLowerCase().includes(search.toLowerCase()) ||
                          faq.a.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ background:'var(--color-bg)', minHeight:'100vh' }}>
      <section className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=80')" }}></div>
        <div className="page-hero-overlay"></div>
        <div className="container page-hero-content text-center">
          <Reveal>
            <h1 className="heading-1" style={{ color:'white', marginBottom:16 }}>Frequently Asked Questions</h1>
            <p style={{ color:'rgba(255,255,255,0.8)', maxWidth:600, margin:'0 auto 32px', fontSize:16 }}>
              Find answers to common questions about Schengen visas, holiday packages, bookings, and support.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div style={{ maxWidth:500, margin:'0 auto', position:'relative' }}>
              <Search style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }} size={20} />
              <input
                className="form-input"
                style={{ paddingLeft:48, height:50, borderRadius:25, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'white' }}
                placeholder="Search your question here..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth:800 }}>
          <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:40, flexWrap:'wrap' }}>
            {['all', ...Object.keys(faqCategories)].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                style={{ textTransform:'capitalize' }}
              >
                {cat === 'all' ? 'Show All' : cat}
              </button>
            ))}
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="text-center" style={{ padding:'40px 0', color:'var(--color-text-muted)' }}>
              <HelpCircle size={48} style={{ opacity:0.3, marginBottom:16 }} />
              <h3 className="heading-3">No matching FAQs found</h3>
              <p>Try searching for different keywords or select another category.</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {filteredFaqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <Reveal key={idx} delay={idx * 0.05}>
                    <div className="card" style={{ border:isOpen ? '1px solid var(--color-secondary)' : '1px solid var(--color-border)', transition:'all 0.3s' }}>
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', background:'none', border:'none', padding:'20px 24px', cursor:'pointer', textAlign:'left', color:'var(--color-text)' }}
                      >
                        <span style={{ fontWeight:700, fontSize:15, paddingRight:20 }}>{faq.q}</span>
                        <ChevronDown style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.3s', color:'var(--color-text-muted)', flexShrink:0 }} size={20} />
                      </button>
                      <div style={{
                        height: isOpen ? 'auto' : 0,
                        overflow:'hidden',
                        transition:'all 0.3s'
                      }}>
                        <div style={{ padding:'0 24px 24px 24px', borderTop:'1px dashed var(--color-border)', color:'var(--color-text-muted)', fontSize:14, lineHeight:1.7 }}>
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}

          <Reveal>
            <div className="card text-center" style={{ padding:'var(--space-10)', marginTop:'var(--space-10)', background:'var(--color-bg-alt)' }}>
              <h3 className="heading-3">Still have questions?</h3>
              <p className="text-muted" style={{ marginBottom:24 }}>Can't find what you're looking for? Our team is happy to help.</p>
              <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
                <a href={`tel:${phoneVal.replace(/\s+/g, '')}`} className="btn btn-primary">Call Us</a>
                <a href={`https://wa.me/${whatsappVal.replace(/[+\s]+/g, '')}`} className="btn btn-outline" target="_blank" rel="noopener noreferrer">WhatsApp</a>
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
