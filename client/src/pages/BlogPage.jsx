import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, Tag, ArrowLeft } from 'lucide-react';

const Reveal = ({ children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }} transition={{ duration: 0.5, delay }}>{children}</motion.div>
);

const staticPosts = [
  { id: 1, slug: 'schengen-visa-guide-2026', title: 'Complete Schengen Visa Guide 2026', excerpt: 'Everything you need to know about applying for a Schengen visa in 2026, including new digital requirements and updated document checklists.', category: 'Visa Tips', date: 'June 15, 2026', readTime: '8 min', image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80', featured: true, content: '<h3>Welcome to the 2026 Schengen Visa Guide</h3><p>Applying for a Schengen visa has undergone significant updates this year. In 2026, several member states have transitioned to fully digital portals to streamline application processes.</p><h4>Key Documentation Required:</h4><ul><li>A valid passport with at least two blank pages, issued within the last 10 years.</li><li>Completed and signed visa application form.</li><li>Recent biometric passport-size photographs.</li><li>Round-trip flight reservations and hotel bookings.</li><li>Comprehensive travel insurance covering up to €30,000.</li></ul>' },
  { id: 2, slug: 'top-10-european-destinations', title: 'Top 10 European Destinations for 2026', excerpt: 'Discover the most trending European destinations this year, from hidden gems to iconic cities that never go out of style.', category: 'Travel Guide', date: 'June 10, 2026', readTime: '6 min', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80', featured: true, content: '<h3>Discover Europe in 2026</h3><p>From the romantic bridges of Florence to the pristine shores of Portugal, Europe remains a dream destination. Here are the top 10 handpicked spots trending for 2026 travelers looking to balance popular wonders and off-beat charm.</p>' },
  { id: 3, slug: 'budget-travel-europe', title: 'How to Travel Europe on a Budget', excerpt: 'Expert tips for experiencing the best of Europe without breaking the bank. From accommodation hacks to free attractions.', category: 'Budget Travel', date: 'June 5, 2026', readTime: '5 min', image: 'https://images.unsplash.com/photo-1503917988258-f87a78e3c995?w=600&q=80', content: '<h3>Budget Travel Hacks for Europe</h3><p>Traveling across Europe doesn’t have to drain your savings account. By using trains instead of domestic flights, lodging in boutique hostels, and tasting local street foods, you can discover Europe on less than £50 per day.</p>' },
  { id: 4, slug: 'visa-rejection-tips', title: 'Visa Rejected? Here\'s What to Do Next', excerpt: 'Don\'t lose hope! Learn the common reasons for Schengen visa rejections and how to successfully reapply.', category: 'Visa Tips', date: 'May 28, 2026', readTime: '7 min', image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80', content: '<h3>Recovering from a Visa Rejection</h3><p>Receiving a visa rejection letter can be incredibly discouraging, but it doesn’t mean your travel plans are canceled forever. Most rejections are due to administrative omissions or insufficient proof of travel intent.</p>' },
  { id: 5, slug: 'uk-residents-schengen-visa-guide', title: 'UK Residents Guide to Schengen Visa Checklist (2026)', excerpt: 'A complete guide for UK residents (BRP holders) applying for a Schengen visa, covering exact document lists, photo specs, and processing times.', category: 'Visa Tips', date: 'July 18, 2026', readTime: '8 min', image: 'https://images.unsplash.com/photo-1513568692650-f4dbaf036963?w=600&q=80', content: '<h3>Applying from the UK: What BRP Holders Need to Know</h3><p>If you reside in the United Kingdom under a Biometric Residence Permit (BRP) or other valid UK residency status, applying for a Schengen visa involves a specific set of procedures. Since the UK is no longer part of the European Union, UK residents holding non-visa-exempt passports must apply for a Schengen visa at the respective consulate or authorized visa application centre (such as VFS Global, TLScontact, or BLS International) in London, Manchester, or Edinburgh.</p><h4>Essential Document Checklist:</h4><ul><li><strong>UK Residence Permit (BRP):</strong> Must be valid for at least 3 months beyond your planned departure from the Schengen area.</li><li><strong>Passport:</strong> Issued within the last 10 years, valid for at least 3 months after leaving the Schengen zone, with at least 2 blank pages.</li><li><strong>Schengen Visa Application Form:</strong> Fully completed and signed.</li><li><strong>Proof of Employment/Studies in the UK:</strong> An official letter from your UK employer (issued within the last 30 days) or enrollment letter from your university.</li><li><strong>Financial Sufficiency:</strong> Recent 3 months UK bank statements showing sufficient funds (typically £50-£100 per day of stay).</li><li><strong>Travel Insurance:</strong> Covering repatriation and medical emergency expenses up to €30,000.</li></ul>' },
  { id: 6, slug: 'travel-insurance-schengen-requirements', title: 'Schengen Visa Travel Insurance: Requirements & Best Providers', excerpt: 'Understand the mandatory travel insurance requirements for Schengen visa applications, including minimum €30,000 coverage, repatriation, and zero-deductible policies.', category: 'Visa Tips', date: 'July 12, 2026', readTime: '6 min', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80', content: '<h3>Mandatory Schengen Visa Insurance Criteria</h3><p>One of the most common reasons for Schengen visa rejections is submitting an invalid or insufficient travel insurance policy. The Schengen visa code enforces strict requirements for travel insurance that all applicants must meet without exception.</p><h4>Standard Requirements:</h4><ul><li><strong>Minimum Coverage:</strong> The policy must cover medical expenses up to at least €30,000 (or equivalent in GBP/USD).</li><li><strong>Geographical Scope:</strong> It must be valid across all 29 Schengen member states.</li><li><strong>Repatriation Cover:</strong> Must cover expenses related to repatriation for medical reasons or urgent medical attention.</li><li><strong>Deductible:</strong> The policy should ideally have a €0 deductible (excess), meaning the insurance covers the costs from the very first cent.</li><li><strong>Duration:</strong> It must cover the entire period of your intended stay in the Schengen zone.</li></ul>' }
];

export default function BlogPage() {
  const { slug } = useParams();
  const [posts, setPosts] = useState([]);
  const [activePost, setActivePost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all posts from DB
  const loadPosts = async () => {
    try {
      const res = await fetch('/api/blog');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const normalized = data.map(p => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          category: p.category || 'Travel Guide',
          date: new Date(p.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
          readTime: p.read_time || '5 min',
          image: p.cover_image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80',
          content: p.content,
          featured: false
        }));
        // Mark first one as featured if none is explicitly featured
        if (normalized.length > 0) normalized[0].featured = true;
        setPosts(normalized);
      } else {
        setPosts(staticPosts);
      }
    } catch (e) {
      setPosts(staticPosts);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single post by slug
  const loadSinglePost = async (postSlug) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog/${postSlug}`);
      if (!res.ok) throw new Error();
      const p = await res.json();
      setActivePost({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        category: p.category || 'Travel Guide',
        date: new Date(p.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
        readTime: p.read_time || '5 min',
        image: p.cover_image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80',
        content: p.content
      });
    } catch (e) {
      // Fallback to static posts lookup
      const local = staticPosts.find(p => p.slug === postSlug);
      if (local) {
        setActivePost(local);
      } else {
        setActivePost(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (slug) {
      loadSinglePost(slug);
    } else {
      setActivePost(null);
    }
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ border: '4px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // --- DETAIL VIEW ---
  if (slug && activePost) {
    const recommended = posts.filter(p => p.slug !== slug).slice(0, 3);
    return (
      <div>
        <section className="page-hero" style={{ minHeight: '300px', padding: 'calc(var(--nav-height) + var(--space-12)) 0 var(--space-12)' }}>
          <div className="page-hero-bg" style={{ backgroundImage: `url(${activePost.image})` }} />
          <div className="page-hero-overlay" />
          <div className="container page-hero-content">
            <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
              <ArrowLeft size={16} /> Back to Blog
            </Link>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <span className="badge badge-primary"><Tag size={10} /> {activePost.category}</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {activePost.date}</span>
            </div>
            <h1 className="heading-1" style={{ color: 'white', margin: '0.5rem 0', fontSize: '2.5rem', lineHeight: 1.2 }}>{activePost.title}</h1>
          </div>
        </section>

        <section className="section">
          <div className="container" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 40 }}>
            {/* Article Content */}
            <div className="card" style={{ padding: 32, background: 'var(--color-bg-card)', borderRadius: 16 }}>
              <div 
                className="blog-content-body" 
                dangerouslySetInnerHTML={{ __html: activePost.content || activePost.excerpt }} 
                style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--color-text)' }}
              />
            </div>

            {/* Sidebar (Recent Posts) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, borderBottom: '2px solid var(--color-border)', paddingBottom: 8 }}>Recommended Articles</h3>
              {recommended.map(p => (
                <Link key={p.id} to={`/blog/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit' }} className="card sidebar-card">
                  <img src={p.image} alt={p.title} style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', borderRadius: '8px 8px 0 0' }} />
                  <div style={{ padding: 12 }}>
                    <span style={{ fontSize: 10, color: 'var(--color-secondary)', fontWeight: 600 }}>{p.category}</span>
                    <h4 style={{ fontSize: 13, fontWeight: 700, margin: '4px 0 0', lineHeight: 1.4 }}>{p.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <style>{`
          .blog-content-body h3 { font-size: 20px; font-weight: 700; margin: 24px 0 12px; color: var(--color-text-title); }
          .blog-content-body h4 { font-size: 16px; font-weight: 700; margin: 20px 0 10px; color: var(--color-text-title); }
          .blog-content-body p { margin-bottom: 16px; }
          .blog-content-body ul, .blog-content-body ol { padding-left: 20px; margin-bottom: 16px; }
          .blog-content-body li { margin-bottom: 6px; }
          .sidebar-card { transition: transform 0.2s, box-shadow 0.2s; }
          .sidebar-card:hover { transform: translateY(-3px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .page-hero { position:relative; min-height:300px; display:flex; align-items:center; }
          .page-hero-bg { position:absolute; inset:0; background-size:cover; background-position:center; }
          .page-hero-overlay { position:absolute; inset:0; background:linear-gradient(135deg,rgba(11,29,53,0.93),rgba(11,29,53,0.8)); }
          .page-hero-content { position:relative; z-index:1; }
          @media(max-width:768px) {
            .container { grid-template-columns:1fr !important; }
          }
        `}</style>
      </div>
    );
  }

  if (slug && !activePost) {
    return (
      <div style={{ minHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <h2 className="heading-3">Blog Post Not Found</h2>
        <Link to="/blog" className="btn btn-primary">Back to Blog List</Link>
      </div>
    );
  }

  // --- LIST VIEW ---
  const featured = posts.filter(p => p.featured);
  const regular = posts.filter(p => !p.featured);

  return (
    <div>
      <section className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=80)' }} />
        <div className="page-hero-overlay" />
        <div className="container page-hero-content">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="section-label" style={{ color: 'var(--color-accent)' }}>Travel Insights</span>
            <h1 className="heading-1" style={{ color: 'white', margin: '0.5rem 0 1rem' }}>Travel Blog</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 550, fontSize: 'var(--text-lg)' }}>
              Expert advice, destination guides, and visa tips to help plan your perfect trip.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* Featured Posts */}
          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-12)' }}>
              {featured.map((post, i) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="card" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <img src={post.image} alt={post.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', transition: 'transform 0.5s' }}
                      onMouseOver={e => e.target.style.transform = 'scale(1.05)'} onMouseOut={e => e.target.style.transform = 'scale(1)'} />
                  </div>
                  <div style={{ padding: 'var(--space-6)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <span className="badge badge-primary"><Tag size={10} /> {post.category}</span>
                      <span className="text-muted" style={{ fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {post.date}</span>
                    </div>
                    <h2 className="heading-3" style={{ marginBottom: 8 }}>{post.title}</h2>
                    <p className="text-muted" style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, marginBottom: 16 }}>{post.excerpt}</p>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--color-secondary)', fontSize: 'var(--text-sm)', marginTop: 'auto' }}>
                      Read More <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>

          {/* Regular Posts */}
          <div className="grid grid-3">
            {(() => {
              const itemsPerPage = 6;
              const paginated = regular.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
              return paginated.map((post, i) => (
                <Reveal key={post.id} delay={i * 0.1}>
                  <Link to={`/blog/${post.slug}`} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ overflow: 'hidden' }}>
                      <img src={post.image} alt={post.title} style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', transition: 'transform 0.5s' }}
                        onMouseOver={e => e.target.style.transform = 'scale(1.05)'} onMouseOut={e => e.target.style.transform = 'scale(1)'} />
                    </div>
                    <div style={{ padding: 'var(--space-5)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <span className="badge badge-primary" style={{ fontSize: 10 }}>{post.category}</span>
                        <span className="text-muted" style={{ fontSize: 11 }}>{post.readTime} read</span>
                      </div>
                      <h3 style={{ fontWeight: 700, fontSize: 'var(--text-base)', marginBottom: 6 }}>{post.title}</h3>
                      <p className="text-muted" style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>{post.excerpt}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--color-border)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        <Calendar size={12} /> {post.date}
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ));
            })()}
          </div>

          {/* Pagination Controls */}
          {(() => {
            const itemsPerPage = 6;
            const totalPages = Math.ceil(regular.length / itemsPerPage);
            if (totalPages <= 1) return null;
            return (
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:10, marginTop:40 }}>
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button 
                      key={pNum} 
                      className={`btn btn-sm ${currentPage === pNum ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => { setCurrentPage(pNum); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            );
          })()}
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
