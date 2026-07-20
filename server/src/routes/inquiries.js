const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, adminOnly } = require('../middleware/auth');

// POST /api/inquiries - Submit inquiry (public)
router.post('/', async (req, res) => {
  const { name, email, phone, subject, message, type } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }
  try {
    const { calculateLeadScore } = require('./business-suite');
    const leadScore = calculateLeadScore({ subject, message, type }, phone, 'normal');

    await db.prepare(`INSERT INTO inquiries (name, email, phone, subject, message, type, status, admin_notes, lead_score, lead_stage) VALUES (?, ?, ?, ?, ?, ?, 'new', '', ?, 'new')`)
      .run(name, email.toLowerCase(), phone || '', subject || 'general', message, type || 'contact', leadScore);
    res.status(201).json({ message: 'Inquiry submitted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save inquiry.' });
  }
});

// GET /api/inquiries - List all (Admin Only)
router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    let inquiries;
    if (req.user.sub_role === 'agent') {
      inquiries = await db.prepare(`
        SELECT i.*, u.name as assigned_name 
        FROM inquiries i LEFT JOIN users u ON i.assigned_to = u.id 
        WHERE i.assigned_to = ?
        ORDER BY i.created_at DESC
      `).all(req.user.id);
    } else {
      inquiries = await db.prepare(`
        SELECT i.*, u.name as assigned_name 
        FROM inquiries i LEFT JOIN users u ON i.assigned_to = u.id 
        ORDER BY i.created_at DESC
      `).all();
    }
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve inquiries.' });
  }
});

// PUT /api/inquiries/:id - Update (Admin Only)
router.put('/:id', authenticate, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { status, admin_notes, assigned_to } = req.body;
  try {
    const inquiry = await db.prepare('SELECT id, assigned_to FROM inquiries WHERE id = ?').get(id);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found.' });

    if (req.user.sub_role === 'agent' && inquiry.assigned_to !== req.user.id && req.body.assigned_to === undefined) {
      return res.status(403).json({ error: 'Access denied. Case not assigned to you.' });
    }

    await db.prepare(`UPDATE inquiries SET status = COALESCE(?, status), admin_notes = COALESCE(?, admin_notes), assigned_to = COALESCE(?, assigned_to) WHERE id = ?`)
      .run(status, admin_notes, assigned_to, id);
    res.json({ message: 'Inquiry updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update inquiry.' });
  }
});

// DELETE /api/inquiries/:id - Delete (Admin Only)
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const inquiry = await db.prepare('SELECT id FROM inquiries WHERE id = ?').get(id);
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found.' });

    await db.prepare('DELETE FROM inquiries WHERE id = ?').run(id);
    res.json({ message: 'Inquiry deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete inquiry.' });
  }
});

// POST /api/inquiries/draft - Save or update partial evaluation lead
router.post('/draft', async (req, res) => {
  const { draftId, name, email, phone, nationality, country, purpose, employed } = req.body;

  // We need at least email or phone or name to save a draft
  if (!name && !email && !phone) {
    return res.status(400).json({ error: 'No contact information to save.' });
  }

  const emailLower = email ? email.toLowerCase() : '';
  const draftName = name || 'Guest Lead';
  const draftEmail = emailLower || 'no-email@draft.com';
  
  const messageText = `Partial Visa Assessment (Draft):
- Destination Country: ${country || 'Not selected'}
- Passport/Nationality: ${nationality || 'Not selected'}
- Purpose of Visit: ${purpose || 'Not selected'}
- Employment Status: ${employed || 'Not selected'}
- Phone: ${phone || 'Not provided'}
- Email: ${emailLower || 'Not provided'}`;

  try {
    const { calculateLeadScore } = require('./business-suite');
    const leadScore = calculateLeadScore({ message: messageText }, phone, 'normal');

    let id = draftId;
    if (id) {
      // Check if exists
      const existing = await db.prepare('SELECT id FROM inquiries WHERE id = ?').get(id);
      if (existing) {
        await db.prepare(`
          UPDATE inquiries 
          SET name = ?, email = ?, phone = ?, message = ?, status = 'new', lead_score = ?
          WHERE id = ?
        `).run(draftName, draftEmail, phone || '', messageText, leadScore, id);
      } else {
        const result = await db.prepare(`
          INSERT INTO inquiries (name, email, phone, subject, message, type, status, admin_notes, lead_score, lead_stage)
          VALUES (?, ?, ?, 'Visa Evaluation (Draft)', ?, 'evaluation_draft', 'new', '', ?, 'new')
        `).run(draftName, draftEmail, phone || '', messageText, leadScore);
        id = result.lastInsertRowid;
      }
    } else {
      const result = await db.prepare(`
          INSERT INTO inquiries (name, email, phone, subject, message, type, status, admin_notes, lead_score, lead_stage)
          VALUES (?, ?, ?, 'Visa Evaluation (Draft)', ?, 'evaluation_draft', 'new', '', ?, 'new')
      `).run(draftName, draftEmail, phone || '', messageText, leadScore);
      id = result.lastInsertRowid;
    }

    res.json({ success: true, draftId: id });
  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({ error: 'Failed to save draft lead.' });
  }
});

// POST /api/inquiries/evaluate - Public evaluation with auto-registration
router.post('/evaluate', async (req, res) => {
  const { draftId, name, email, phone, nationality, country, purpose, employed, funds, history, rejection } = req.body;

  if (!name || !email || !country || !nationality) {
    return res.status(400).json({ error: 'Name, email, country, and nationality are required.' });
  }

  try {
    // Calculate score
    let score = 80;
    if (history === 'Yes, Schengen') score += 10;
    if (history === 'No') score -= 10;
    if (employed === 'Unemployed') score -= 20;
    if (funds === 'Not sure') score -= 15;
    if (rejection === 'Yes, once') score -= 10;
    if (rejection === 'Yes, multiple') score -= 25;
    score = Math.max(20, Math.min(100, score));

    // Check/create user
    let userId = null;
    let autoCreated = false;
    let tempPassword = '';
    let token = '';
    const emailLower = email.toLowerCase();

    const existingUser = await db.prepare('SELECT id, role FROM users WHERE email = ?').get(emailLower);
    
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../middleware/auth');

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Auto-create account
      const { hashPassword } = require('../utils/crypto');
      tempPassword = `welcome123`;
      const hash = hashPassword(tempPassword);
      
      const userResult = await db.prepare(
        'INSERT INTO users (name, email, password_hash, phone, nationality, role, sub_role) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(name, emailLower, hash, phone || '', nationality, 'customer', '');
      
      userId = userResult.lastInsertRowid;
      autoCreated = true;
      token = jwt.sign({ id: userId, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
    }

    // Format evaluation details message
    const messageText = `Visa Eligibility Evaluation Summary:
- Destination Country: ${country}
- Eligibility Score: ${score}%
- Purpose of Visit: ${purpose || 'Tourism'}
- Nationality: ${nationality}
- Employment Status: ${employed || 'Employed'}
- Can show sufficient funds: ${funds || 'Yes'}
- Previous travel: ${history || 'No'}
- Previous visa rejections: ${rejection || 'No'}`;

    // Insert or update inquiry
    const { calculateLeadScore } = require('./business-suite');
    const leadScore = calculateLeadScore({ country, purpose, employed, funds, history, rejection }, phone, 'normal');

    if (draftId) {
      const existingDraft = await db.prepare('SELECT id FROM inquiries WHERE id = ?').get(draftId);
      if (existingDraft) {
        await db.prepare(`
          UPDATE inquiries
          SET name = ?, email = ?, phone = ?, subject = 'Visa Evaluation', message = ?, type = 'evaluation', status = 'new', user_id = ?, lead_score = ?
          WHERE id = ?
        `).run(name, emailLower, phone || '', messageText, userId, leadScore, draftId);
      } else {
        await db.prepare(`
          INSERT INTO inquiries (name, email, phone, subject, message, type, status, admin_notes, user_id, lead_score, lead_stage)
          VALUES (?, ?, ?, 'Visa Evaluation', ?, 'evaluation', 'new', '', ?, ?, 'new')
        `).run(name, emailLower, phone || '', messageText, userId, leadScore);
      }
    } else {
      await db.prepare(`
        INSERT INTO inquiries (name, email, phone, subject, message, type, status, admin_notes, user_id, lead_score, lead_stage)
        VALUES (?, ?, ?, 'Visa Evaluation', ?, 'evaluation', 'new', '', ?, ?, 'new')
      `).run(name, emailLower, phone || '', messageText, userId, leadScore);
    }

    res.status(201).json({
      message: 'Evaluation submitted successfully.',
      score,
      autoCreated,
      email: emailLower,
      tempPassword: autoCreated ? tempPassword : '',
      token: autoCreated ? token : '',
      userExists: !autoCreated && existingUser ? true : false
    });
  } catch (error) {
    console.error('Evaluation submit error:', error);
    res.status(500).json({ error: 'Failed to process evaluation.' });
  }
});

// POST /api/inquiries/:id/convert - Convert inquiry to booking or visa application (Admin Only)
router.post('/:id/convert', authenticate, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { target_type } = req.body; // 'visa' or 'booking'

  if (!['visa', 'booking'].includes(target_type)) {
    return res.status(400).json({ error: "Invalid target_type. Must be 'visa' or 'booking'." });
  }

  try {
    const inquiry = await db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id);
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }

    if (inquiry.status === 'completed') {
      return res.status(400).json({ error: 'Inquiry is already completed/converted.' });
    }

    // Check if the customer user exists or create a temp customer if needed
    let userId = inquiry.user_id;
    if (!userId) {
      const user = await db.prepare('SELECT id FROM users WHERE email = ?').get(inquiry.email.toLowerCase());
      if (user) {
        userId = user.id;
      } else {
        // Create customer account
        const { hashPassword } = require('../utils/crypto');
        const tempPassword = 'welcome' + Math.floor(1000 + Math.random() * 9000);
        const hash = hashPassword(tempPassword);
        const userInsert = await db.prepare(`
          INSERT INTO users (name, email, password_hash, phone, role, status)
          VALUES (?, ?, ?, ?, 'customer', 'active')
        `).run(inquiry.name, inquiry.email.toLowerCase(), hash, inquiry.phone || '');
        userId = userInsert.lastInsertRowid;
      }
    }

    let resultMsg = '';
    let targetRef = '';

    if (target_type === 'visa') {
      // Convert to Visa Application
      const appRef = 'VISA-' + Math.floor(100000 + Math.random() * 900000);
      targetRef = appRef;

      await db.prepare(`
        INSERT INTO visa_applications (
          app_ref, user_id, customer_name, customer_email, customer_phone, country, nationality,
          purpose, status, assessment_json, documents_json, notes, admin_notes, assigned_to,
          travelers_json, payment_info_json, comments_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', '{}', '[]', ?, ?, ?, '[]', '{}', '[]')
      `).run(
        appRef,
        userId,
        inquiry.name,
        inquiry.email.toLowerCase(),
        inquiry.phone || '',
        'Schengen',
        '',
        'tourism',
        inquiry.message || inquiry.admin_notes || 'Converted from Inquiry #' + inquiry.id,
        `Converted from Inquiry #${inquiry.id}. Initial notes: ${inquiry.admin_notes || ''}`,
        inquiry.assigned_to
      );

      resultMsg = `Successfully converted to Visa Application (${appRef})`;

    } else {
      // Convert to Booking
      const bookingRef = 'BKG-' + Math.floor(100000 + Math.random() * 900000);
      targetRef = bookingRef;

      await db.prepare(`
        INSERT INTO bookings (
          booking_ref, user_id, package_id, package_title, customer_name, customer_email, customer_phone,
          travel_date, travelers, total_price, status, payment_status, notes, admin_notes, assigned_to
        ) VALUES (?, ?, NULL, 'Holiday Package (From Inquiry)', ?, ?, ?, ?, 1, 0.0, 'pending', 'pending', ?, ?, ?)
      `).run(
        bookingRef,
        userId,
        inquiry.name,
        inquiry.email.toLowerCase(),
        inquiry.phone || '',
        '',
        inquiry.message || inquiry.admin_notes || 'Converted from Inquiry #' + inquiry.id,
        `Converted from Inquiry #${inquiry.id}. Initial notes: ${inquiry.admin_notes || ''}`,
        inquiry.assigned_to
      );

      resultMsg = `Successfully converted to Booking (${bookingRef})`;
    }

    // Update inquiry status to completed
    const updatedNotes = `${inquiry.admin_notes || ''}\n[System] Converted to ${targetRef} on ${new Date().toLocaleDateString()}`.trim();
    await db.prepare("UPDATE inquiries SET status = 'completed', admin_notes = ? WHERE id = ?")
      .run(updatedNotes, id);

    // Also update lead_stage to won since they are converted
    await db.prepare("UPDATE inquiries SET lead_stage = 'won' WHERE id = ?").run(id);

    // Log to Audit Trail
    const { logAudit } = require('../utils/audit');
    await logAudit(req.user.id, 'convert_inquiry', {
      inquiry_id: id,
      target_type,
      target_ref: targetRef
    });

    res.json({ message: resultMsg, targetRef, status: 'completed' });

  } catch (error) {
    console.error('Inquiry conversion error:', error);
    res.status(500).json({ error: 'Failed to convert inquiry. ' + error.message });
  }
});

module.exports = router;
