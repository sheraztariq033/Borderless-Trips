import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Phone, ChevronDown, User, LogOut, LayoutDashboard, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const navLinks = [
  { path: '/', label: 'Home' },
  {
    label: 'Services', children: [
      { path: '/visa-services', label: 'Schengen Visa Services' },
      { path: '/holiday-packages', label: 'Holiday Packages' },
      { path: '/flights', label: 'Flights' },
    ]
  },
  { path: '/about', label: 'About' },
  { path: '/blog', label: 'Blog' },
  { path: '/contact', label: 'Contact' },
  { path: '/faq', label: 'FAQ' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdown, setDropdown] = useState(null);
  const [userMenu, setUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdown(null);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;
  const isHome = location.pathname === '/';

  return (
    <>
      <nav
        className={`navbar ${scrolled ? 'navbar-scrolled' : ''} ${!isHome || scrolled ? 'navbar-solid' : ''}`}
        id="main-navbar"
        style={mobileOpen ? { zIndex: 1000001 } : {}}
      >
        <div className="container navbar-inner">
          <Link to="/" className="navbar-logo" id="nav-logo">
            <img src={settings.logo_url || "/logo.svg"} alt={settings.business_name || "Borderless Trips"} className="navbar-logo-img" onError={e => { e.target.onerror = null; e.target.src = '/logo.svg'; }} />
            <div className="navbar-logo-text">
              <span className="navbar-brand">{settings.business_name || "Borderless Trips"}</span>
              <span className="navbar-tagline">Unlimited Journeys</span>
            </div>
          </Link>

          <div className="navbar-links hide-mobile">
            {navLinks.map((link, i) =>
              link.children ? (
                <div
                  key={i}
                  className="navbar-dropdown"
                  onMouseEnter={() => setDropdown(i)}
                  onMouseLeave={() => setDropdown(null)}
                >
                  <button className="navbar-link" id={`nav-${link.label.toLowerCase()}`}>
                    {link.label} <ChevronDown size={14} />
                  </button>
                  <AnimatePresence>
                    {dropdown === i && (
                      <motion.div
                        className="navbar-dropdown-menu"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {link.children.map(child => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`navbar-dropdown-item ${isActive(child.path) ? 'active' : ''}`}
                            id={`nav-${child.path.slice(1)}`}
                          >
                            <Globe size={16} />
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`navbar-link ${isActive(link.path) ? 'active' : ''}`}
                  id={`nav-${link.path === '/' ? 'home' : link.path.slice(1)}`}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          <div className="navbar-actions">
            <a href={`tel:${(settings.phone || '+44 123 456 7890').replace(/\s+/g, '')}`} className="navbar-phone hide-mobile" id="nav-phone">
              <Phone size={16} />
              <span>{settings.phone || '+44 123 456 7890'}</span>
            </a>

            {user ? (
              <div className="navbar-user-menu" onMouseEnter={() => setUserMenu(true)} onMouseLeave={() => setUserMenu(false)}>
                <button className="btn btn-ghost navbar-user-btn" id="nav-user-btn">
                  <User size={18} />
                  <span className="hide-mobile">{user.name?.split(' ')[0]}</span>
                </button>
                <AnimatePresence>
                  {userMenu && (
                    <motion.div
                      className="navbar-dropdown-menu navbar-user-dropdown"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <Link to={user.role === 'admin' ? '/admin' : '/portal'} className="navbar-dropdown-item">
                        <LayoutDashboard size={16} />
                        {user.role === 'admin' ? 'Admin Panel' : 'My Portal'}
                      </Link>
                      <button className="navbar-dropdown-item" onClick={logout}>
                        <LogOut size={16} />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm hide-mobile" id="nav-login-btn">
                Get Started
              </Link>
            )}

            <button
              className="navbar-hamburger hide-desktop"
              onClick={() => setMobileOpen(!mobileOpen)}
              id="nav-hamburger"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            style={{ zIndex: 1000000 }}
          >
            <div className="mobile-menu-inner">
              {navLinks.map((link, i) =>
                link.children ? (
                  <div key={i} className="mobile-menu-group">
                    <span className="mobile-menu-label">{link.label}</span>
                    {link.children.map(child => (
                      <Link key={child.path} to={child.path} className="mobile-menu-link sub">
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link key={link.path} to={link.path} className={`mobile-menu-link ${isActive(link.path) ? 'active' : ''}`}>
                    {link.label}
                  </Link>
                )
              )}
              <div className="mobile-menu-divider" />
              <a href={`tel:${(settings.phone || '+44 123 456 7890').replace(/\s+/g, '')}`} className="mobile-menu-link">
                <Phone size={18} /> {settings.phone || 'Call Us Now'}
              </a>
              {user ? (
                <>
                  <Link to={user.role === 'admin' ? '/admin' : '/portal'} className="mobile-menu-link">
                    <LayoutDashboard size={18} /> {user.role === 'admin' ? 'Admin Panel' : 'My Portal'}
                  </Link>
                  <button className="mobile-menu-link" onClick={logout}>
                    <LogOut size={18} /> Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem' }}>
                  Get Started
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--nav-height);
          z-index: var(--z-fixed);
          transition: all var(--transition-base);
        }

        .navbar-solid,
        .navbar-scrolled {
          background: var(--glass-bg);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          border-bottom: 1px solid var(--glass-border);
          box-shadow: var(--shadow-sm);
        }

        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
          gap: var(--space-8);
        }

        .navbar-logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          text-decoration: none;
          flex-shrink: 0;
        }

        .navbar-logo-img {
          width: auto;
          height: 40px;
          object-fit: contain;
          border-radius: var(--radius-md);
        }

        .navbar-logo-text {
          display: flex;
          flex-direction: column;
        }

        .navbar-brand {
          font-family: var(--font-serif);
          font-size: var(--text-lg);
          font-weight: 700;
          color: ${isHome && !scrolled ? 'white' : 'var(--color-text)'};
          transition: color var(--transition-base);
          line-height: 1.2;
        }

        .navbar-tagline {
          font-size: var(--text-xs);
          color: ${isHome && !scrolled ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)'};
          transition: color var(--transition-base);
          letter-spacing: 0.05em;
        }

        .navbar-links {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .navbar-link {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-2) var(--space-3);
          font-size: var(--text-sm);
          font-weight: 500;
          color: ${isHome && !scrolled ? 'rgba(255,255,255,0.85)' : 'var(--color-text-secondary)'};
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
          text-decoration: none;
          cursor: pointer;
          background: none;
          border: none;
        }

        .navbar-link:hover,
        .navbar-link.active {
          color: ${isHome && !scrolled ? 'white' : 'var(--color-secondary)'};
          background: ${isHome && !scrolled ? 'rgba(255,255,255,0.1)' : 'rgba(14,165,233,0.08)'};
        }

        .navbar-dropdown {
          position: relative;
        }

        .navbar-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          min-width: 240px;
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--color-border);
          padding: var(--space-2);
          z-index: var(--z-dropdown);
        }

        .navbar-dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
          text-decoration: none;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }

        .navbar-dropdown-item:hover,
        .navbar-dropdown-item.active {
          background: rgba(14,165,233,0.08);
          color: var(--color-secondary);
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .navbar-phone {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          font-weight: 600;
          color: ${isHome && !scrolled ? 'white' : 'var(--color-text)'};
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .navbar-phone:hover {
          color: var(--color-secondary);
        }

        .navbar-user-menu {
          position: relative;
        }

        .navbar-user-btn {
          color: ${isHome && !scrolled ? 'white' : 'var(--color-text)'};
        }

        .navbar-user-dropdown {
          right: 0;
          left: auto;
          min-width: 180px;
        }

        .navbar-hamburger {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          color: ${isHome && !scrolled ? 'white' : 'var(--color-text)'};
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .navbar-hamburger:hover {
          background: rgba(14,165,233,0.1);
        }

        /* Mobile Menu */
        .mobile-menu {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 320px;
          max-width: 90vw;
          background: var(--color-surface);
          z-index: var(--z-modal);
          box-shadow: var(--shadow-2xl);
          overflow-y: auto;
        }

        .mobile-menu-inner {
          padding: calc(var(--nav-height) + var(--space-4)) var(--space-6) var(--space-8);
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .mobile-menu-link {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          font-size: var(--text-base);
          font-weight: 500;
          color: var(--color-text);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
        }

        .mobile-menu-link.sub {
          padding-left: var(--space-8);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }

        .mobile-menu-link:hover,
        .mobile-menu-link.active {
          background: rgba(14,165,233,0.08);
          color: var(--color-secondary);
        }

        .mobile-menu-label {
          display: block;
          padding: var(--space-3) var(--space-4) var(--space-1);
          font-size: var(--text-xs);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-text-muted);
        }

        .mobile-menu-divider {
          height: 1px;
          background: var(--color-border);
          margin: var(--space-3) 0;
        }

        @media (max-width: 768px) {
          .navbar-logo-img {
            width: auto;
            height: 32px;
          }
          .navbar-brand {
            font-size: var(--text-base);
          }
          .navbar-tagline {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
