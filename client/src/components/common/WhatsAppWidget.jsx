import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WhatsAppWidget() {
  const [showTooltip, setShowTooltip] = useState(true);
  const phoneNumber = '441234567890';

  const getWhatsAppUrl = () => {
    const message = encodeURIComponent(
      'Hello Borderless Trips! I would like to enquire about your services.'
    );
    return `https://wa.me/${phoneNumber}?text=${message}`;
  };

  return (
    <div className="whatsapp-widget" id="whatsapp-widget">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="whatsapp-tooltip"
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
          >
            <button className="whatsapp-tooltip-close" onClick={() => setShowTooltip(false)}>
              <X size={12} />
            </button>
            <p>Need help? Chat with us on WhatsApp!</p>
          </motion.div>
        )}
      </AnimatePresence>

      <a
        href={getWhatsAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-btn"
        id="whatsapp-btn"
        aria-label="Chat on WhatsApp"
        onClick={() => setShowTooltip(false)}
      >
        <svg viewBox="0 0 32 32" width="28" height="28" fill="white">
          <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.12-1.958A15.91 15.91 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.31 22.606c-.39 1.1-2.274 2.104-3.142 2.168-.79.058-1.534.376-5.176-1.116-4.392-1.8-7.142-6.322-7.358-6.618-.208-.296-1.756-2.344-1.756-4.47s1.092-3.156 1.514-3.594c.386-.4 1.014-.576 1.612-.576.194 0 .368.01.524.018.422.018.634.042.912.708.348.834 1.194 2.908 1.298 3.12.106.212.194.478.058.756-.128.282-.212.456-.42.7-.21.246-.44.548-.63.736-.208.208-.426.434-.182.846.244.41 1.088 1.794 2.338 2.908 1.608 1.432 2.926 1.888 3.374 2.104.352.17.77.134 1.028-.14.326-.346.728-.92 1.138-1.486.29-.404.66-.456 1.048-.296.394.154 2.478 1.172 2.902 1.386.424.212.706.322.81.496.104.174.104 1.018-.286 2.118z"/>
        </svg>
      </a>

      <style>{`
        .whatsapp-widget {
          position: fixed;
          bottom: 24px;
          left: 24px;
          z-index: var(--z-widget);
          display: flex;
          align-items: flex-end;
          gap: var(--space-3);
        }

        .whatsapp-btn {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-full);
          background: #25D366;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4);
          transition: all var(--transition-base);
          animation: breathe 2s ease-in-out infinite;
        }

        .whatsapp-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(37, 211, 102, 0.5);
          animation: none;
        }

        .whatsapp-tooltip {
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          padding: var(--space-3) var(--space-4);
          padding-right: var(--space-8);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--color-border);
          max-width: 200px;
          position: relative;
        }

        .whatsapp-tooltip p {
          font-size: var(--text-sm);
          color: var(--color-text);
          line-height: 1.4;
          margin: 0;
        }

        .whatsapp-tooltip-close {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 20px;
          height: 20px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          transition: all var(--transition-fast);
        }

        .whatsapp-tooltip-close:hover {
          background: var(--color-bg-alt);
          color: var(--color-text);
        }

        @media (max-width: 768px) {
          .whatsapp-widget {
            bottom: 16px;
            left: 16px;
          }
          .whatsapp-btn {
            width: 52px;
            height: 52px;
          }
          .whatsapp-tooltip {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
