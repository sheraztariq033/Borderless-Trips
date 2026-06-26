import { motion } from 'framer-motion';
import { X, Shield } from 'lucide-react';
import { useEvaluation } from '../../context/EvaluationContext';
import VisaQuiz from './VisaQuiz';

export default function EvaluationModal() {
  const { isOpen, closeEvaluation } = useEvaluation();

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11, 29, 53, 0.65)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={closeEvaluation}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }} 
        transition={{ duration: 0.3 }}
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: 580,
          maxHeight: '95vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={20} color="var(--color-secondary)" />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>Visa Eligibility Assessment</h3>
          </div>
          <button onClick={closeEvaluation} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body with VisaQuiz */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, background: 'var(--color-surface)' }}>
          <VisaQuiz inline={false} onClose={closeEvaluation} />
        </div>
      </motion.div>
    </div>
  );
}
