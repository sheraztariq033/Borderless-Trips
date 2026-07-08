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
    await db.prepare(`INSERT INTO inquiries (name, email, phone, subject, message, type, status, admin_notes) VALUES (?, ?, ?, ?, ?, ?, 'new', '')`)
      .run(name, email.toLowerCase(), phone || '', subject || 'general', message, type || 'contact');
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
    let id = draftId;
    if (id) {
      // Check if exists
      const existing = await db.prepare('SELECT id FROM inquiries WHERE id = ?').get(id);
      if (existing) {
        await db.prepare(`
          UPDATE inquiries 
          SET name = ?, email = ?, phone = ?, message = ?, status = 'new'
          WHERE id = ?
        `).run(draftName, draftEmail, phone || '', messageText, id);
      } else {
        const result = await db.prepare(`
          INSERT INTO inquiries (name, email, phone, subject, message, type, status, admin_notes)
          VALUES (?, ?, ?, 'Visa Evaluation (Draft)', ?, 'evaluation_draft', 'new', '')
        `).run(draftName, draftEmail, phone || '', messageText);
        id = result.lastInsertRowid;
      }
    } else {
      const result = await db.prepare(`
        INSERT INTO inquiries (name, email, phone, subject, message, type, status, admin_notes)
        VALUES (?, ?, ?, 'Visa Evaluation (Draft)', ?, 'evaluation_draft', 'new', '')
      `).run(draftName, draftEmail, phone || '', messageText);
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
      const bcrypt = require('bcryptjs');
      tempPassword = `welcome123`;
      const hash = bcrypt.hashSync(tempPassword, 10);
      
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
    if (draftId) {
      const existingDraft = await db.prepare('SELECT id FROM inquiries WHERE id = ?').get(draftId);
      if (existingDraft) {
        await db.prepare(`
          UPDATE inquiries
          SET name = ?, email = ?, phone = ?, subject = 'Visa Evaluation', message = ?, type = 'evaluation', status = 'new', user_id = ?
          WHERE id = ?
        `).run(name, emailLower, phone || '', messageText, userId, draftId);
      } else {
        await db.prepare(`
          INSERT INTO inquiries (name, email, phone, subject, message, type, status, admin_notes, user_id)
          VALUES (?, ?, ?, 'Visa Evaluation', ?, 'evaluation', 'new', '', ?)
        `).run(name, emailLower, phone || '', messageText, userId);
      }
    } else {
      await db.prepare(`
        INSERT INTO inquiries (name, email, phone, subject, message, type, status, admin_notes, user_id)
        VALUES (?, ?, ?, 'Visa Evaluation', ?, 'evaluation', 'new', '', ?)
      `).run(name, emailLower, phone || '', messageText, userId);
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

module.exports = router;
