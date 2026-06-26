import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Award, Users, Globe, Shield, Heart, Target, Eye, Star, MapPin, Phone, ArrowRight } from 'lucide-react';

const Reveal = ({ children, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }} transition={{ duration: 0.5, delay }}>{children}</motion.div>
);

const team = [
  { name: 'Mohammad Ali', role: 'Founder & CEO', bio: 'Experienced travel industry professional with over 15 years in visa services and travel planning.' },
  { name: 'Sarah Khan', role: 'Visa Specialist', bio: 'Expert in Schengen visa applications with a remarkable 98% approval rate across all EU countries.' },
  { name: 'James Wilson', role: 'Travel Consultant', bio: 'Passionate about curating luxury holiday experiences that exceed client expectations.' },
  { name: 'Aisha Patel', role: 'Customer Support Lead', bio: 'Dedicated to ensuring every client receives responsive, personalised service throughout their journey.' },
];

const values = [
  { icon: Shield, title: 'Trust & Transparency', desc: 'We believe in honest pricing, clear communication, and no hidden fees.' },
  { icon: Heart, title: 'Client-First Approach', desc: 'Every decision we make is focused on delivering the best experience for our clients.' },
  { icon: Award, title: 'Excellence', desc: 'We strive for the highest standards in visa processing and travel planning.' },
  { icon: Globe, title: 'Global Expertise', desc: 'Deep knowledge of international travel regulations, visa requirements, and destinations.' },
];

export default function AboutPage() {
  return (
    <div>
      <section className="page-hero">
        <div className="page-hero-bg" style={{ backgroundImage:'url(https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&q=80)' }} />
        <div className="page-hero-overlay" />
        <div className="container page-hero-content">
          <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}>
            <span className="section-label" style={{ color:'var(--color-accent)' }}>Our Story</span>
            <h1 className="heading-1" style={{ color:'white', margin:'0.5rem 0 1rem' }}>About Borderless Trips</h1>
            <p style={{ color:'rgba(255,255,255,0.7)', maxWidth:550, fontSize:'var(--text-lg)', lineHeight:1.7 }}>
              UK-based travel agency passionate about making world travel accessible, affordable, and stress-free.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="section">
        <div className="container" style={{ maxWidth:900 }}>
          <Reveal>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-12)', alignItems:'center' }}>
              <div>
                <span className="section-label">Who We Are</span>
                <h2 className="heading-2" style={{ margin:'0.5rem 0 1.5rem' }}>Your Trusted Travel Partner</h2>
                <p style={{ color:'var(--color-text-secondary)', lineHeight:1.8, marginBottom:16 }}>
                  Founded in London, Borderless Trips was born from a simple idea: everyone deserves to explore the world 
                  without the stress and confusion of visa applications and travel planning.
                </p>
                <p style={{ color:'var(--color-text-secondary)', lineHeight:1.8, marginBottom:16 }}>
                  Our team of experienced travel professionals and visa specialists have helped thousands of UK residents 
                  obtain Schengen visas and plan unforgettable holidays across Europe and beyond.
                </p>
                <p style={{ color:'var(--color-text-secondary)', lineHeight:1.8 }}>
                  With a 95%+ visa approval rate and countless happy travellers, we've established ourselves as one of the 
                  most trusted travel agencies in the UK.
                </p>
              </div>
              <div style={{ borderRadius:'var(--radius-xl)', overflow:'hidden' }}>
                <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80" alt="Our team" style={{ width:'100%', aspectRatio:'4/3', objectFit:'cover' }} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="section" style={{ background:'var(--color-bg-alt)' }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-8)' }}>
            <Reveal>
              <div className="card" style={{ padding:'var(--space-8)', height:'100%' }}>
                <Target size={32} color="var(--color-secondary)" />
                <h3 className="heading-3" style={{ margin:'1rem 0 0.75rem' }}>Our Mission</h3>
                <p style={{ color:'var(--color-text-secondary)', lineHeight:1.8 }}>
                  To simplify international travel for everyone. We handle the complexity of visa applications, 
                  travel planning, and logistics so our clients can focus on creating memories.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="card" style={{ padding:'var(--space-8)', height:'100%' }}>
                <Eye size={32} color="var(--color-accent)" />
                <h3 className="heading-3" style={{ margin:'1rem 0 0.75rem' }}>Our Vision</h3>
                <p style={{ color:'var(--color-text-secondary)', lineHeight:1.8 }}>
                  To be the UK's most trusted and innovative travel agency, breaking down borders and making 
                  the world more accessible through technology, expertise, and exceptional service.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-header text-center">
              <span className="section-label">What We Stand For</span>
              <h2 className="heading-2" style={{ marginTop:'0.5rem' }}>Our Core Values</h2>
              <div className="divider divider-center" />
            </div>
          </Reveal>
          <div className="grid grid-4">
            {values.map((v,i) => (
              <Reveal key={i} delay={i*0.1}>
                <div style={{ textAlign:'center', padding:'var(--space-6)' }}>
                  <div style={{ width:64, height:64, borderRadius:'var(--radius-xl)', background:'rgba(14,165,233,0.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto var(--space-4)', color:'var(--color-secondary)' }}>
                    <v.icon size={28} />
                  </div>
                  <h3 className="heading-4">{v.title}</h3>
                  <p className="text-muted" style={{ fontSize:'var(--text-sm)', marginTop:8 }}>{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section" style={{ background:'var(--color-bg-alt)' }}>
        <div className="container">
          <Reveal>
            <div className="section-header text-center">
              <span className="section-label">Our Team</span>
              <h2 className="heading-2" style={{ marginTop:'0.5rem' }}>Meet the Experts</h2>
              <div className="divider divider-center" />
            </div>
          </Reveal>
          <div className="grid grid-4">
            {team.map((member,i) => (
              <Reveal key={i} delay={i*0.1}>
                <div className="card" style={{ padding:'var(--space-6)', textAlign:'center' }}>
                  <div style={{ width:80, height:80, borderRadius:'50%', background:'var(--gradient-accent)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'var(--text-2xl)', fontWeight:700, margin:'0 auto var(--space-4)' }}>
                    {member.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <h4 className="heading-4">{member.name}</h4>
                  <p style={{ color:'var(--color-secondary)', fontSize:'var(--text-sm)', fontWeight:600, marginBottom:8 }}>{member.role}</p>
                  <p className="text-muted" style={{ fontSize:'var(--text-sm)' }}>{member.bio}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background:'var(--gradient-primary)', padding:'var(--space-16) 0', textAlign:'center' }}>
        <div className="container">
          <Reveal>
            <h2 className="heading-2" style={{ color:'white', marginBottom:'1rem' }}>Let's Plan Your Next Adventure</h2>
            <p style={{ color:'rgba(255,255,255,0.7)', maxWidth:500, margin:'0 auto 2rem' }}>
              Get in touch with our team for personalised travel advice and visa consultation.
            </p>
            <Link to="/contact" className="btn btn-secondary btn-lg">
              Contact Us <ArrowRight size={18}/>
            </Link>
          </Reveal>
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
