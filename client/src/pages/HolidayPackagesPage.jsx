import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, SlidersHorizontal, MapPin, Clock, Users, Star, ArrowRight,
  Calendar, Heart, Filter, X, ChevronDown, Plane
} from 'lucide-react';

const Reveal = ({ children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }} transition={{ duration: 0.5, delay }}>{children}</motion.div>
);

const allPackages = [
  { id: 1, title: 'Romantic Paris Getaway', destination: 'Paris, France', duration: '5 Days / 4 Nights', price: 499, originalPrice: 649, type: 'honeymoon', rating: 4.9, reviews: 128, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80', featured: true, includes: ['Hotel', 'Flights', 'Tours', 'Breakfast'] },
  { id: 2, title: 'Italian Dream Tour', destination: 'Rome & Venice, Italy', duration: '7 Days / 6 Nights', price: 799, originalPrice: 999, type: 'adventure', rating: 4.8, reviews: 95, image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80', featured: true, includes: ['Hotel', 'Flights', 'Transfers', 'Guide'] },
  { id: 3, title: 'Barcelona Beach Holiday', destination: 'Barcelona, Spain', duration: '5 Days / 4 Nights', price: 479, originalPrice: 599, type: 'family', rating: 4.7, reviews: 82, image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80', featured: false, includes: ['Hotel', 'Flights', 'City Tour'] },
  { id: 4, title: 'Santorini Honeymoon', destination: 'Santorini, Greece', duration: '6 Days / 5 Nights', price: 899, originalPrice: 1199, type: 'honeymoon', rating: 5.0, reviews: 67, image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&q=80', featured: true, includes: ['Hotel', 'Flights', 'Wine Tour', 'Sunset Cruise'] },
  { id: 5, title: 'Swiss Alps Adventure', destination: 'Zurich & Interlaken', duration: '6 Days / 5 Nights', price: 999, originalPrice: 1299, type: 'adventure', rating: 4.9, reviews: 54, image: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=600&q=80', featured: false, includes: ['Hotel', 'Flights', 'Train Pass', 'Activities'] },
  { id: 6, title: 'Amsterdam City Break', destination: 'Amsterdam, Netherlands', duration: '4 Days / 3 Nights', price: 399, originalPrice: 499, type: 'budget', rating: 4.6, reviews: 110, image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&q=80', featured: false, includes: ['Hotel', 'Flights', 'Canal Tour'] },
  { id: 7, title: 'Turkish Delight Tour', destination: 'Istanbul, Turkey', duration: '5 Days / 4 Nights', price: 449, originalPrice: 579, type: 'adventure', rating: 4.8, reviews: 73, image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=600&q=80', featured: false, includes: ['Hotel', 'Flights', 'Tours', 'Meals'] },
  { id: 8, title: 'Portugal Explorer', destination: 'Lisbon & Porto', duration: '7 Days / 6 Nights', price: 649, originalPrice: 849, type: 'adventure', rating: 4.7, reviews: 61, image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&q=80', featured: false, includes: ['Hotel', 'Flights', 'Wine Tour', 'Transfer'] },
  { id: 9, title: 'Family Fun in Dubai', destination: 'Dubai, UAE', duration: '5 Days / 4 Nights', price: 699, originalPrice: 899, type: 'family', rating: 4.9, reviews: 142, image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80', featured: true, includes: ['Hotel', 'Flights', 'Theme Parks', 'Desert Safari'] },
];

const types = ['all', 'honeymoon', 'family', 'adventure', 'budget'];
const sortOptions = ['Popular', 'Price: Low to High', 'Price: High to Low', 'Rating'];

export default function HolidayPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [sortBy, setSortBy] = useState('Popular');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const dest = params.get('destination');
    if (type) setActiveType(type);
    if (dest) setSearch(dest);

    // Fetch from backend
    fetch('/api/packages')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Normalize image/images key
          const normalized = data.map(p => ({
            ...p,
            image: p.images?.[0] || p.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80'
          }));
          setPackages(normalized);
        } else {
          setPackages(allPackages);
        }
        setLoading(false);
      })
      .catch(() => {
        setPackages(allPackages);
        setLoading(false);
      });
  }, []);

  const filtered = packages
    .filter(p => activeType === 'all' || p.type === activeType)
    .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
    .filter(p => {
      if (!search) return true;
      const s = search.toLowerCase();
      return p.title?.toLowerCase().includes(s) || p.destination?.toLowerCase().includes(s);
    })
    .sort((a, b) => {
      if (sortBy === 'Price: Low to High') return a.price - b.price;
      if (sortBy === 'Price: High to Low') return b.price - a.price;
      if (sortBy === 'Rating') return b.rating - a.rating;
      return b.reviews - a.reviews;
    });

  return (
    <div className="page-packages">
      {/* Hero */}
      <section className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80)' }} />
        <div className="page-hero-overlay" />
        <div className="container page-hero-content">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="section-label" style={{ color: 'var(--color-accent)' }}>Curated Experiences</span>
            <h1 className="heading-1" style={{ color: 'white', margin: '0.5rem 0 1rem' }}>Holiday Packages</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 550, fontSize: 'var(--text-lg)' }}>
              Discover handpicked travel packages with flights, hotels, and unforgettable experiences — all at the best prices.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="section">
        <div className="container">
          {/* Search & Filter Bar */}
          <div className="packages-toolbar">
            <div className="packages-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search destinations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-input"
                style={{ border: 'none', background: 'transparent', paddingLeft: 0 }}
              />
            </div>
            <div className="packages-type-tabs hide-mobile">
              {types.map(t => (
                <button
                  key={t}
                  className={`packages-tab ${activeType === t ? 'active' : ''}`}
                  onClick={() => setActiveType(t)}
                >
                  {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="packages-sort hide-mobile">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="form-input form-select"
                style={{ minWidth: 180, padding: '8px 36px 8px 12px' }}
              >
                {sortOptions.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button className="btn btn-ghost hide-desktop" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={18} /> Filters
            </button>
          </div>

          {/* Mobile filter types */}
          {showFilters && (
            <div className="hide-desktop" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {types.map(t => (
                <button key={t} className={`packages-tab ${activeType === t ? 'active' : ''}`}
                  onClick={() => setActiveType(t)}>
                  {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Results count */}
          <p className="text-muted" style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
            Showing {filtered.length} packages
          </p>

          {/* Package Grid */}
          <div className="grid grid-3" style={{ gap: 'var(--space-6)' }}>
            {filtered.map((pkg, i) => (
              <Reveal key={pkg.id} delay={i * 0.05}>
                <Link to={`/holiday-packages/${pkg.id}`} className="package-card" id={`package-${pkg.id}`}>
                  <div className="package-image-wrap">
                    <img src={pkg.image} alt={pkg.title} className="package-image" loading="lazy" />
                    {pkg.featured && <span className="package-featured">Featured</span>}
                    <div className="package-save">{Math.round((1 - pkg.price / pkg.originalPrice) * 100)}% OFF</div>
                  </div>
                  <div className="package-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                      <MapPin size={14} color="var(--color-secondary)" />
                      <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>{pkg.destination}</span>
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: 'var(--text-base)', marginBottom: 8 }}>{pkg.title}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      <span className="tag"><Clock size={12} /> {pkg.duration}</span>
                      <span className="tag"><Star size={12} fill="#F59E0B" color="#F59E0B" /> {pkg.rating}</span>
                    </div>
                    <div className="package-includes">
                      {pkg.includes?.map((inc, j) => (
                        <span key={j} className="package-include-tag">{inc}</span>
                      ))}
                    </div>
                    <div className="package-footer">
                      <div>
                        <span className="package-original-price">£{pkg.originalPrice}</span>
                        <span className="package-price">£{pkg.price}</span>
                        <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}> /person</span>
                      </div>
                      <span className="btn btn-primary btn-sm">View <ArrowRight size={14} /></span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center" style={{ padding: 'var(--space-16) 0' }}>
              <Plane size={48} color="var(--color-text-muted)" />
              <h3 className="heading-3" style={{ marginTop: 16 }}>No packages found</h3>
              <p className="text-muted">Try adjusting your filters or search term</p>
            </div>
          )}
        </div>
      </section>

      <style>{`
        .page-hero {
          position: relative;
          padding: calc(var(--nav-height) + var(--space-20)) 0 var(--space-20);
          min-height: 400px;
          display: flex;
          align-items: center;
        }
        .page-hero-bg {
          position: absolute; inset: 0; background-size: cover; background-position: center;
        }
        .page-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(11,29,53,0.93) 0%, rgba(11,29,53,0.8) 100%);
        }
        .page-hero-content { position: relative; z-index: 1; }

        .packages-toolbar {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-4);
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
          margin-bottom: var(--space-6);
          flex-wrap: wrap;
        }

        .packages-search {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex: 1;
          min-width: 200px;
          color: var(--color-text-muted);
        }

        .packages-type-tabs {
          display: flex;
          gap: var(--space-1);
        }

        .packages-tab {
          padding: var(--space-2) var(--space-4);
          font-size: var(--text-sm);
          font-weight: 500;
          border-radius: var(--radius-full);
          color: var(--color-text-secondary);
          background: none;
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .packages-tab.active {
          background: var(--color-secondary);
          color: white;
        }

        .packages-tab:hover:not(.active) {
          background: var(--color-bg-alt);
        }

        .package-card {
          display: flex;
          flex-direction: column;
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          transition: all var(--transition-base);
        }

        .package-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-card-hover);
        }

        .package-image-wrap {
          position: relative;
          overflow: hidden;
        }

        .package-image {
          width: 100%;
          aspect-ratio: 16/10;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .package-card:hover .package-image {
          transform: scale(1.05);
        }

        .package-featured {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 4px 12px;
          background: var(--gradient-gold);
          color: var(--color-primary);
          font-size: var(--text-xs);
          font-weight: 700;
          border-radius: var(--radius-full);
        }

        .package-save {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 10px;
          background: var(--color-danger);
          color: white;
          font-size: var(--text-xs);
          font-weight: 700;
          border-radius: var(--radius-full);
        }

        .package-body {
          padding: var(--space-5);
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .package-includes {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: var(--space-4);
        }

        .package-include-tag {
          padding: 2px 8px;
          font-size: 10px;
          font-weight: 600;
          background: rgba(14,165,233,0.08);
          color: var(--color-secondary);
          border-radius: var(--radius-sm);
        }

        .package-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border);
        }

        .package-original-price {
          text-decoration: line-through;
          color: var(--color-text-muted);
          font-size: var(--text-sm);
          margin-right: 6px;
        }

        .package-price {
          font-size: var(--text-xl);
          font-weight: 800;
          color: var(--color-primary);
        }

        @media (max-width: 768px) {
          .packages-toolbar { flex-direction: column; align-items: stretch; }
          .grid-3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
