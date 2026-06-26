import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Tag } from 'lucide-react';

const Reveal = ({ children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }} transition={{ duration: 0.5, delay }}>{children}</motion.div>
);

const posts = [
  { id:1, slug:'schengen-visa-guide-2026', title:'Complete Schengen Visa Guide 2026', excerpt:'Everything you need to know about applying for a Schengen visa in 2026, including new digital requirements and updated document checklists.', category:'Visa Tips', date:'June 15, 2026', readTime:'8 min', image:'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80', featured:true },
  { id:2, slug:'top-10-european-destinations', title:'Top 10 European Destinations for 2026', excerpt:'Discover the most trending European destinations this year, from hidden gems to iconic cities that never go out of style.', category:'Travel Guide', date:'June 10, 2026', readTime:'6 min', image:'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80', featured:true },
  { id:3, slug:'budget-travel-europe', title:'How to Travel Europe on a Budget', excerpt:'Expert tips for experiencing the best of Europe without breaking the bank. From accommodation hacks to free attractions.', category:'Budget Travel', date:'June 5, 2026', readTime:'5 min', image:'https://images.unsplash.com/photo-1503917988258-f87a78e3c995?w=600&q=80' },
  { id:4, slug:'visa-rejection-tips', title:'Visa Rejected? Here\'s What to Do Next', excerpt:'Don\'t lose hope! Learn the common reasons for Schengen visa rejections and how to successfully reapply.', category:'Visa Tips', date:'May 28, 2026', readTime:'7 min', image:'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80' },
  { id:5, slug:'family-holidays-europe', title:'Best Family Holiday Destinations in Europe', excerpt:'Kid-friendly destinations, activities, and packages that the whole family will love. From theme parks to beaches.', category:'Family Travel', date:'May 20, 2026', readTime:'6 min', image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80' },
  { id:6, slug:'honeymoon-destinations', title:'Most Romantic European Honeymoon Spots', excerpt:'From Santorini sunsets to Parisian charm, discover the most romantic destinations for your honeymoon.', category:'Honeymoon', date:'May 15, 2026', readTime:'5 min', image:'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&q=80' },
];

export default function BlogPage() {
  const featured = posts.filter(p => p.featured);
  const regular = posts.filter(p => !p.featured);

  return (
    <div>
      <section className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage:'url(https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=80)' }} />
        <div className="page-hero-overlay" />
        <div className="container page-hero-content">
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}>
            <span className="section-label" style={{ color:'var(--color-accent)' }}>Travel Insights</span>
            <h1 className="heading-1" style={{ color:'white', margin:'0.5rem 0 1rem' }}>Travel Blog</h1>
            <p style={{ color:'rgba(255,255,255,0.7)', maxWidth:550, fontSize:'var(--text-lg)' }}>
              Expert advice, destination guides, and visa tips to help plan your perfect trip.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* Featured Posts */}
          <Reveal>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-6)', marginBottom:'var(--space-12)' }}>
              {featured.map((post,i) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="card" style={{ display:'flex', flexDirection:'column', textDecoration:'none', color:'inherit' }}>
                  <div style={{ overflow:'hidden' }}>
                    <img src={post.image} alt={post.title} style={{ width:'100%', aspectRatio:'16/9', objectFit:'cover', transition:'transform 0.5s' }}
                      onMouseOver={e => e.target.style.transform='scale(1.05)'} onMouseOut={e => e.target.style.transform='scale(1)'} />
                  </div>
                  <div style={{ padding:'var(--space-6)', flex:1, display:'flex', flexDirection:'column' }}>
                    <div style={{ display:'flex', gap:12, marginBottom:12 }}>
                      <span className="badge badge-primary"><Tag size={10} /> {post.category}</span>
                      <span className="text-muted" style={{ fontSize:'var(--text-xs)', display:'flex', alignItems:'center', gap:4 }}><Calendar size={12}/> {post.date}</span>
                    </div>
                    <h2 className="heading-3" style={{ marginBottom:8 }}>{post.title}</h2>
                    <p className="text-muted" style={{ fontSize:'var(--text-sm)', lineHeight:1.7, marginBottom:16 }}>{post.excerpt}</p>
                    <span style={{ display:'flex', alignItems:'center', gap:4, fontWeight:600, color:'var(--color-secondary)', fontSize:'var(--text-sm)', marginTop:'auto' }}>
                      Read More <ArrowRight size={14}/>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>

          {/* Regular Posts */}
          <div className="grid grid-3">
            {regular.map((post,i) => (
              <Reveal key={post.id} delay={i*0.1}>
                <Link to={`/blog/${post.slug}`} className="card" style={{ textDecoration:'none', color:'inherit', display:'flex', flexDirection:'column' }}>
                  <div style={{ overflow:'hidden' }}>
                    <img src={post.image} alt={post.title} style={{ width:'100%', aspectRatio:'16/10', objectFit:'cover', transition:'transform 0.5s' }}
                      onMouseOver={e => e.target.style.transform='scale(1.05)'} onMouseOut={e => e.target.style.transform='scale(1)'} />
                  </div>
                  <div style={{ padding:'var(--space-5)', flex:1, display:'flex', flexDirection:'column' }}>
                    <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                      <span className="badge badge-primary" style={{ fontSize:10 }}>{post.category}</span>
                      <span className="text-muted" style={{ fontSize:11 }}>{post.readTime} read</span>
                    </div>
                    <h3 style={{ fontWeight:700, fontSize:'var(--text-base)', marginBottom:6 }}>{post.title}</h3>
                    <p className="text-muted" style={{ fontSize:'var(--text-sm)', lineHeight:1.6 }}>{post.excerpt}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:'auto', paddingTop:12, borderTop:'1px solid var(--color-border)', fontSize:'var(--text-xs)', color:'var(--color-text-muted)' }}>
                      <Calendar size={12}/> {post.date}
                    </div>
                  </div>
                </Link>
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
          .container > div { grid-template-columns:1fr !important; }
        }
      `}</style>
    </div>
  );
}
