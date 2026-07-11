const express = require('express');
const router = express.Router();
const db = require('../models/database');

// GET /api/public/track/:ref
router.get('/track/:ref', async (req, res) => {
  const { ref } = req.params;
  if (!ref || ref.trim() === '') {
    return res.status(400).json({ error: 'Tracking reference is required.' });
  }

  const uppercaseRef = ref.toUpperCase().trim();

  try {
    // 1. Try checking visa applications
    if (uppercaseRef.startsWith('VISA')) {
      const app = await db.prepare(`
        SELECT app_ref as ref, country, status, created_at, updated_at 
        FROM visa_applications 
        WHERE app_ref = ?
      `).get(uppercaseRef);

      if (app) {
        return res.json({
          type: 'visa',
          ref: app.ref,
          title: `Visa Application - ${app.country}`,
          status: app.status,
          created_at: app.created_at,
          updated_at: app.updated_at
        });
      }
    }

    // 2. Try checking bookings
    if (uppercaseRef.startsWith('BKG') || uppercaseRef.startsWith('BT')) {
      const booking = await db.prepare(`
        SELECT booking_ref as ref, package_title, status, created_at, updated_at 
        FROM bookings 
        WHERE booking_ref = ?
      `).get(uppercaseRef);

      if (booking) {
        return res.json({
          type: 'booking',
          ref: booking.ref,
          title: `Booking - ${booking.package_title}`,
          status: booking.status,
          created_at: booking.created_at,
          updated_at: booking.updated_at
        });
      }
    }

    // 3. Fallback: scan both tables generally if prefix doesn't match standard
    const generalVisa = await db.prepare('SELECT app_ref as ref, country, status, created_at, updated_at FROM visa_applications WHERE app_ref = ?').get(uppercaseRef);
    if (generalVisa) {
      return res.json({
        type: 'visa',
        ref: generalVisa.ref,
        title: `Visa Application - ${generalVisa.country}`,
        status: generalVisa.status,
        created_at: generalVisa.created_at,
        updated_at: generalVisa.updated_at
      });
    }

    const generalBooking = await db.prepare('SELECT booking_ref as ref, package_title, status, created_at, updated_at FROM bookings WHERE booking_ref = ?').get(uppercaseRef);
    if (generalBooking) {
      return res.json({
        type: 'booking',
        ref: generalBooking.ref,
        title: `Booking - ${generalBooking.package_title}`,
        status: generalBooking.status,
        created_at: generalBooking.created_at,
        updated_at: generalBooking.updated_at
      });
    }

    res.status(404).json({ error: 'Tracking reference not found. Please verify your reference number.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
