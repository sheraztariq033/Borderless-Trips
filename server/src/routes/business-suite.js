const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const { sendMail, getEmailTemplate } = require('../utils/mailer');
const { logAudit } = require('../utils/audit');

// Helper to auto-generate a unique referral code
function generateReferralCode(email, name) {
  const cleanName = (name || 'USER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `BT-${cleanName}-${randomNum}`;
}

// ----------------------------------------------------
// 1. Referral & Loyalty Program API
// ----------------------------------------------------
router.get('/referrals/my-stats', authenticate, async (req, res) => {
  try {
    let referralCode = req.user.referral_code;
    
    // Auto-generate code if they don't have one
    if (!referralCode) {
      referralCode = generateReferralCode(req.user.email, req.user.name);
      await db.prepare('UPDATE users SET referral_code = ? WHERE id = ?').run(referralCode, req.user.id);
    }
    
    // Get referred users
    const referrals = await db.prepare(`
      SELECT id, name, email, created_at FROM users 
      WHERE referred_by = ? ORDER BY created_at DESC
    `).all(req.user.id);

    res.json({
      referral_code: referralCode,
      loyalty_points: req.user.loyalty_points || 0,
      credits_balance: parseFloat(req.user.credits_balance || '0.00'),
      referrals
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/referrals/apply', authenticate, async (req, res) => {
  const { referral_code } = req.body;
  if (!referral_code) return res.status(400).json({ error: 'Referral code is required.' });

  try {
    if (req.user.referred_by) {
      return res.status(400).json({ error: 'You have already applied a referral code.' });
    }

    // Find referrer
    const referrer = await db.prepare('SELECT id, referral_code FROM users WHERE referral_code = ?').get(referral_code);
    if (!referrer) return res.status(404).json({ error: 'Invalid referral code.' });

    if (referrer.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot refer yourself.' });
    }

    // Apply referred_by
    await db.prepare('UPDATE users SET referred_by = ? WHERE id = ?').run(referrer.id, req.user.id);
    
    // Credit signup bonus (e.g. 50 loyalty points)
    await db.prepare('UPDATE users SET loyalty_points = loyalty_points + 50 WHERE id = ?').run(req.user.id);
    await db.prepare('UPDATE users SET loyalty_points = loyalty_points + 100 WHERE id = ?').run(referrer.id);

    // Create notifications
    await db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, 'Referral Code Applied', 'You applied a referral code and received 50 bonus loyalty points!', 'success')
    `).run(req.user.id);

    await db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, 'New Referral Reward', 'Someone registered using your code! You earned 100 bonus loyalty points.', 'success')
    `).run(referrer.id);

    res.json({ message: 'Referral code applied successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: Hook this when booking is marked 'completed'
async function creditBookingLoyaltyReward(bookingId) {
  try {
    const booking = await db.prepare('SELECT user_id, total_price FROM bookings WHERE id = ?').get(bookingId);
    if (!booking || !booking.user_id) return;

    const user = await db.prepare('SELECT id, referred_by FROM users WHERE id = ?').get(booking.user_id);
    if (!user) return;

    // Standard points credit (1 point per £10 spent)
    const pointsToCredit = Math.floor(parseFloat(booking.total_price || 0) / 10);
    if (pointsToCredit > 0) {
      await db.prepare('UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?').run(pointsToCredit, user.id);
      
      // If referred, give referrer 5% cashback credit!
      if (user.referred_by) {
        const cashback = parseFloat((parseFloat(booking.total_price || 0) * 0.05).toFixed(2));
        await db.prepare('UPDATE users SET credits_balance = credits_balance + ? WHERE id = ?').run(cashback, user.referred_by);
        
        await db.prepare(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES (?, 'Cashback Referral Earned', 'You earned £' || ? || ' cashback credit from your referral\\'s booking.', 'success')
        `).run(user.referred_by, cashback);
      }
    }
  } catch (err) {
    console.error('Failed to credit loyalty points:', err.message);
  }
}

// ----------------------------------------------------
// 2. Lead Pipeline & Auto-Scoring API
// ----------------------------------------------------
router.get('/analytics/leads', authenticate, adminOnly, async (req, res) => {
  try {
    let serviceReqs, inquiries;
    
    if (req.user.sub_role === 'agent') {
      serviceReqs = await db.prepare(`
        SELECT 'sr' as type, id, ref, name, email, phone, service_type, country, lead_score, lead_stage, created_at, assigned_to
        FROM service_requests
        WHERE assigned_to = ?
      `).all(req.user.id);

      inquiries = await db.prepare(`
        SELECT 'inquiry' as type, id, id::text as ref, name, email, phone, 'consultation' as service_type, '' as country, lead_score, lead_stage, created_at, assigned_to
        FROM inquiries
        WHERE assigned_to = ?
      `).all(req.user.id);
    } else {
      serviceReqs = await db.prepare(`
        SELECT 'sr' as type, id, ref, name, email, phone, service_type, country, lead_score, lead_stage, created_at, assigned_to
        FROM service_requests
      `).all();

      inquiries = await db.prepare(`
        SELECT 'inquiry' as type, id, id::text as ref, name, email, phone, 'consultation' as service_type, '' as country, lead_score, lead_stage, created_at, assigned_to
        FROM inquiries
      `).all();
    }

    const allLeads = [...serviceReqs, ...inquiries].sort((a,b) => b.lead_score - a.lead_score);

    res.json({ leads: allLeads });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-scoring calculation helper
function calculateLeadScore(details, phone, priority) {
  let score = 50; // Base score
  if (phone && phone.trim() !== '') score += 15;
  if (priority === 'high') score += 15;
  if (priority === 'urgent') score += 30;
  
  const text = JSON.stringify(details || {}).toLowerCase();
  if (text.includes('schengen') || text.includes('visa')) score += 15;
  if (text.includes('holiday') || text.includes('package')) score += 10;
  if (text.includes('now') || text.includes('immediate') || text.includes('urgent')) score += 20;
  
  return score;
}

router.put('/service-requests/:id/lead-stage', authenticate, adminOnly, async (req, res) => {
  const { lead_stage, lead_score } = req.body;
  try {
    await db.prepare('UPDATE service_requests SET lead_stage = ?, lead_score = COALESCE(?, lead_score) WHERE id = ?')
      .run(lead_stage, lead_score, req.params.id);
    
    // Log history audit
    await logAudit(req.user.id, 'update_lead_stage', { 
      lead_id: req.params.id, 
      type: 'service_request', 
      new_stage: lead_stage 
    });

    res.json({ message: 'Lead stage updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/inquiries/:id/lead-stage', authenticate, adminOnly, async (req, res) => {
  const { lead_stage, lead_score } = req.body;
  try {
    await db.prepare('UPDATE inquiries SET lead_stage = ?, lead_score = COALESCE(?, lead_score) WHERE id = ?')
      .run(lead_stage, lead_score, req.params.id);

    // Log history audit
    await logAudit(req.user.id, 'update_lead_stage', { 
      lead_id: req.params.id, 
      type: 'inquiry', 
      new_stage: lead_stage 
    });

    res.json({ message: 'Lead stage updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 3. Customer Satisfaction Surveys API
// ----------------------------------------------------
router.post('/surveys', authenticate, async (req, res) => {
  const { ref, rating, feedback } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  try {
    const result = await db.prepare(`
      INSERT INTO surveys (user_id, ref, rating, feedback)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, ref, rating, feedback);
    
    res.status(201).json({ message: 'Survey feedback submitted successfully!', surveyId: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/surveys', authenticate, adminOnly, async (req, res) => {
  try {
    const surveys = await db.prepare(`
      SELECT s.id, s.ref, s.rating, s.feedback, s.created_at, u.name as customer_name, u.email as customer_email
      FROM surveys s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `).all();
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 4. Appointment Booking Calendar API
// ----------------------------------------------------
router.get('/consultations', authenticate, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const consultations = isAdmin
      ? await db.prepare(`
          SELECT c.id, c.title, c.scheduled_at, c.duration, c.notes, c.status, c.created_at, u.name as customer_name, u.email as customer_email 
          FROM consultations c
          LEFT JOIN users u ON c.user_id = u.id
          ORDER BY c.scheduled_at ASC
        `).all()
      : await db.prepare(`
          SELECT id, title, scheduled_at, duration, notes, status, created_at 
          FROM consultations 
          WHERE user_id = ? 
          ORDER BY scheduled_at ASC
        `).all(req.user.id);
        
    res.json(consultations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/consultations', authenticate, async (req, res) => {
  const { title, scheduled_at, duration, notes } = req.body;
  if (!title || !scheduled_at) {
    return res.status(400).json({ error: 'Title and scheduled time are required.' });
  }

  try {
    // Basic double booking check for customer
    const conflict = await db.prepare(`
      SELECT id FROM consultations 
      WHERE user_id = ? AND scheduled_at = ? AND status != 'cancelled'
    `).get(req.user.id, scheduled_at);

    if (conflict) {
      return res.status(400).json({ error: 'You already have an appointment booked at this time slot.' });
    }

    const result = await db.prepare(`
      INSERT INTO consultations (user_id, title, scheduled_at, duration, notes, status)
      VALUES (?, ?, ?, ?, ?, 'scheduled')
    `).run(req.user.id, title, scheduled_at, duration || 30, notes || '');

    // Notify admins
    await db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      SELECT id, 'New Appointment Booked', ?, 'system'
      FROM users WHERE role = 'admin'
    `).run(`Customer ${req.user.name} booked a consultation: ${title} at ${scheduled_at}.`);

    res.status(201).json({ message: 'Appointment booked successfully!', consultationId: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/consultations/:id', authenticate, adminOnly, async (req, res) => {
  const { status, notes } = req.body;
  try {
    await db.prepare('UPDATE consultations SET status = COALESCE(?, status), notes = COALESCE(?, notes) WHERE id = ?')
      .run(status, notes, req.params.id);
    
    // Notify customer
    const appointment = await db.prepare('SELECT user_id, title, scheduled_at FROM consultations WHERE id = ?').get(req.params.id);
    if (appointment && appointment.user_id) {
      await db.prepare(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, 'Appointment Updated', ?, 'system')
      `).run(
        appointment.user_id, 
        `Your consultation "${appointment.title}" scheduled for ${appointment.scheduled_at} is now: ${status}.`
      );
    }

    res.json({ message: 'Appointment updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 5. Bulk Email Campaigns API
// ----------------------------------------------------
router.get('/campaigns', authenticate, adminOnly, async (req, res) => {
  try {
    const campaigns = await db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all();
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/campaigns', authenticate, adminOnly, async (req, res) => {
  const { subject, body, target_role } = req.body;
  if (!subject || !body) return res.status(400).json({ error: 'Subject and body are required.' });

  try {
    const result = await db.prepare(`
      INSERT INTO campaigns (subject, body, target_role, status)
      VALUES (?, ?, ?, 'draft')
    `).run(subject, body, target_role || 'subscribers');

    res.status(201).json({ message: 'Draft campaign created!', campaignId: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/campaigns/:id/send', authenticate, adminOnly, async (req, res) => {
  try {
    const campaign = await db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });
    if (campaign.status === 'sent') return res.status(400).json({ error: 'Campaign already sent.' });

    let recipients = [];
    if (campaign.target_role === 'subscribers') {
      const rows = await db.prepare('SELECT email FROM newsletter_subscribers').all();
      recipients = rows.map(r => r.email);
    } else if (campaign.target_role === 'customers') {
      const rows = await db.prepare("SELECT email FROM users WHERE role = 'customer'").all();
      recipients = rows.map(r => r.email);
    } else {
      const subRows = await db.prepare('SELECT email FROM newsletter_subscribers').all();
      const userRows = await db.prepare("SELECT email FROM users WHERE role = 'customer'").all();
      recipients = [...new Set([...subRows.map(r=>r.email), ...userRows.map(r=>r.email)])];
    }

    console.log(`✉️ Starting campaign blast "${campaign.subject}" to ${recipients.length} recipients...`);
    
    // Execute email sends in batches to prevent timeouts
    for (const email of recipients) {
      const html = getEmailTemplate(campaign.subject, campaign.subject, `
        <h2 class="h1">${campaign.subject}</h2>
        <div style="font-size:15px; line-height:1.6; color:#334155;">
          ${campaign.body.replace(/\n/g, '<br/>')}
        </div>
      `);
      
      await sendMail({
        to: email,
        subject: campaign.subject,
        html
      }).catch(e => console.error(`Failed to send campaign email to ${email}:`, e.message));
    }

    await db.prepare('UPDATE campaigns SET status = \'sent\', sent_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(req.params.id);

    res.json({ message: `Campaign sent successfully to ${recipients.length} recipients!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 6. Internal Notes (Team Chat) API
// ----------------------------------------------------
router.get('/internal-notes/:ref', authenticate, adminOnly, async (req, res) => {
  try {
    const notes = await db.prepare(`
      SELECT id, note, created_at, user_name
      FROM internal_notes
      WHERE ref = ?
      ORDER BY created_at ASC
    `).all(req.params.ref);
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/internal-notes/:ref', authenticate, adminOnly, async (req, res) => {
  const { note } = req.body;
  if (!note || note.trim() === '') return res.status(400).json({ error: 'Note content is required.' });

  try {
    const result = await db.prepare(`
      INSERT INTO internal_notes (ref, user_id, user_name, note)
      VALUES (?, ?, ?, ?)
    `).run(req.params.ref, req.user.id, req.user.name, note);

    res.status(201).json({
      message: 'Note added successfully!',
      note: {
        id: result.lastInsertRowid,
        ref: req.params.ref,
        user_name: req.user.name,
        note,
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 7. Future Leads Tracker API
// ----------------------------------------------------
router.get('/future-leads', authenticate, adminOnly, async (req, res) => {
  try {
    const leads = await db.prepare(`
      SELECT f.*, u.name as assigned_name
      FROM future_leads f
      LEFT JOIN users u ON f.assigned_to = u.id
      ORDER BY f.follow_up_date ASC
    `).all();
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/future-leads', authenticate, async (req, res) => {
  const { name, email, phone, destination, intended_travel_date, follow_up_date, notes, assigned_to } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  try {
    // Automatically calculate default follow up date if none provided (e.g. 1 month before intended travel, or 30 days from now)
    let followUp = follow_up_date;
    if (!followUp && intended_travel_date) {
      const travelDateObj = new Date(intended_travel_date);
      if (!isNaN(travelDateObj)) {
        travelDateObj.setMonth(travelDateObj.getMonth() - 1);
        followUp = travelDateObj.toISOString().split('T')[0];
      }
    }
    if (!followUp) {
      const thirtyDaysOut = new Date();
      thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
      followUp = thirtyDaysOut.toISOString().split('T')[0];
    }

    const assignedVal = assigned_to || (req.user.sub_role === 'agent' ? req.user.id : null);

    const result = await db.prepare(`
      INSERT INTO future_leads (name, email, phone, destination, intended_travel_date, follow_up_date, notes, status, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(name, email, phone || '', destination || '', intended_travel_date || '', followUp, notes || '', assignedVal);

    // Notify admins of new lead
    await db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      SELECT id, 'New Future Travel Lead', ?, 'system'
      FROM users WHERE role = 'admin'
    `).run(`A lead is planning future travel to ${destination || 'Unknown'} in ${intended_travel_date || 'future'}.`);

    res.status(201).json({ message: 'Future travel intent registered successfully!', leadId: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/future-leads/:id', authenticate, adminOnly, async (req, res) => {
  const { status, notes, assigned_to } = req.body;
  try {
    await db.prepare(`
      UPDATE future_leads 
      SET status = COALESCE(?, status), notes = COALESCE(?, notes), assigned_to = COALESCE(?, assigned_to), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, notes, assigned_to, req.params.id);

    res.json({ message: 'Future lead updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = {
  router,
  creditBookingLoyaltyReward,
  calculateLeadScore
};
