import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, Globe, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const [form, setForm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      email: params.get('email') || '',
      password: params.get('password') || ''
    };
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Google authentication failed');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      navigate(data.user.role === 'admin' ? '/admin' : '/portal');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--color-bg)', padding:'var(--space-6)' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ width:'100%', maxWidth:440, padding:0 }}>
        <div className="text-center" style={{ marginBottom:'var(--space-8)' }}>
          <Link to="/"><img src="/logo.png" alt="Borderless Trips" style={{ width:64, height:64, margin:'0 auto', borderRadius:12 }}/></Link>
          <h1 className="heading-2" style={{ marginTop:16 }}>Welcome Back</h1>
          <p className="text-muted">Sign in to your Borderless Trips account</p>
        </div>
        <div className="card" style={{ padding:'var(--space-8)' }}>
          {error && <div style={{ padding:'12px 16px', background:'rgba(239,68,68,0.08)', color:'var(--color-danger)', borderRadius:'var(--radius-md)', fontSize:'var(--text-sm)', marginBottom:16 }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom:16 }}>
              <label className="form-label">Email Address</label>
              <div style={{ position:'relative' }}>
                <Mail size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }}/>
                <input className="form-input" type="email" placeholder="you@example.com" required value={form.email}
                  onChange={e=>setForm({...form,email:e.target.value})} style={{ paddingLeft:38 }}/>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom:24 }}>
              <label className="form-label">Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }}/>
                <input className="form-input" type={showPw?'text':'password'} placeholder="••••••••" required value={form.password}
                  onChange={e=>setForm({...form,password:e.target.value})} style={{ paddingLeft:38, paddingRight:38 }}/>
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--color-text-muted)' }}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            <span style={{ padding: '0 12px', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>

          <button 
            type="button" 
            onClick={handleGoogleSignIn} 
            className="btn btn-outline" 
            disabled={loading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, height: 42, fontSize: 13, fontWeight: 700, borderRadius: 8, borderColor: 'var(--color-border)', cursor: 'pointer', background: 'transparent' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-6.16-4.53z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Sign In with Google
          </button>

          <p className="text-center text-muted" style={{ marginTop:24, fontSize:'var(--text-sm)' }}>
            Don't have an account? <Link to="/register" style={{ fontWeight:600 }}>Create Account</Link>
          </p>
        </div>
        <p className="text-center" style={{ marginTop:24 }}>
          <Link to="/" className="text-muted" style={{ fontSize:'var(--text-sm)' }}>← Back to Home</Link>
        </p>
      </motion.div>
    </div>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ name:'', email:'', phone:'', nationality:'', password:'', confirmPassword:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Google authentication failed');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register({ name:form.name, email:form.email, phone:form.phone, nationality:form.nationality, password:form.password });
      navigate('/portal');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--color-bg)', padding:'var(--space-6)' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ width:'100%', maxWidth:440 }}>
        <div className="text-center" style={{ marginBottom:'var(--space-6)' }}>
          <Link to="/"><img src="/logo.png" alt="Borderless Trips" style={{ width:64, height:64, margin:'0 auto', borderRadius:12 }}/></Link>
          <h1 className="heading-2" style={{ marginTop:16 }}>Create Account</h1>
          <p className="text-muted">Join Borderless Trips for exclusive access</p>
        </div>
        <div className="card" style={{ padding:'var(--space-8)' }}>
          {error && <div style={{ padding:'12px 16px', background:'rgba(239,68,68,0.08)', color:'var(--color-danger)', borderRadius:'var(--radius-md)', fontSize:'var(--text-sm)', marginBottom:16 }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom:12 }}>
              <label className="form-label">Full Name</label>
              <div style={{ position:'relative' }}>
                <User size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }}/>
                <input className="form-input" placeholder="John Doe" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={{ paddingLeft:38 }}/>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom:12 }}>
              <label className="form-label">Email</label>
              <div style={{ position:'relative' }}>
                <Mail size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }}/>
                <input className="form-input" type="email" placeholder="you@example.com" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={{ paddingLeft:38 }}/>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+44 XXX" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
              </div>
              <div className="form-group">
                <label className="form-label">Nationality</label>
                <input className="form-input" placeholder="e.g. British" value={form.nationality} onChange={e=>setForm({...form,nationality:e.target.value})}/>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom:12 }}>
              <label className="form-label">Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }}/>
                <input className="form-input" type={showPw?'text':'password'} placeholder="Min. 6 characters" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} style={{ paddingLeft:38 }}/>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom:24 }}>
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" placeholder="Repeat password" required value={form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})}/>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            <span style={{ padding: '0 12px', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>

          <button 
            type="button" 
            onClick={handleGoogleSignIn} 
            className="btn btn-outline" 
            disabled={loading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, height: 42, fontSize: 13, fontWeight: 700, borderRadius: 8, borderColor: 'var(--color-border)', cursor: 'pointer', background: 'transparent' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-6.16-4.53z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Sign Up with Google
          </button>

          <p className="text-center text-muted" style={{ marginTop:24, fontSize:'var(--text-sm)' }}>
            Already have an account? <Link to="/login" style={{ fontWeight:600 }}>Sign In</Link>
          </p>
        </div>
        <p className="text-center" style={{ marginTop:24 }}>
          <Link to="/" className="text-muted" style={{ fontSize:'var(--text-sm)' }}>← Back to Home</Link>
        </p>
      </motion.div>
    </div>
  );
}
