import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--color-bg)', padding:'var(--space-6)', textAlign:'center' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
        <Compass size={64} color="var(--color-secondary)" style={{ margin:'0 auto' }} />
        <h1 style={{ fontSize:'6rem', fontWeight:900, color:'var(--color-primary)', lineHeight:1, margin:'1rem 0' }}>404</h1>
        <h2 className="heading-3" style={{ marginBottom:8 }}>Page Not Found</h2>
        <p className="text-muted" style={{ maxWidth:400, margin:'0 auto 2rem' }}>
          Looks like this destination doesn't exist. Let's get you back on track.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          <Link to="/" className="btn btn-primary btn-lg"><Home size={18}/> Back to Home</Link>
          <button onClick={() => window.history.back()} className="btn btn-outline btn-lg"><ArrowLeft size={18}/> Go Back</button>
        </div>
      </motion.div>
    </div>
  );
}
