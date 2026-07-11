const db = require('../models/database');
const { sendStatusUpdateEmail } = require('./mailer');

async function checkPassportExpiries() {
  console.log('⏳ Checking for passport expiries...');
  try {
    const users = await db.prepare(`
      SELECT id, name, email, passport_expiry FROM users 
      WHERE passport_expiry IS NOT NULL AND passport_expiry != ''
    `).all();
    
    const today = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setDate(today.getDate() + 180);
    
    for (const u of users) {
      const expiryDate = new Date(u.passport_expiry);
      if (!isNaN(expiryDate) && expiryDate <= sixMonthsFromNow && expiryDate >= today) {
        // Prevent sending duplicate passport alerts on the same day
        const alreadyNotified = await db.prepare(`
          SELECT id FROM notifications 
          WHERE user_id = ? AND title = 'Passport Expiration Alert' AND created_at >= CURRENT_DATE
        `).get(u.id);
        
        if (!alreadyNotified) {
          console.log(`⚠️ Passport expiring soon for user ${u.name} (${u.email}) - Expiry: ${u.passport_expiry}`);
          
          await db.prepare(`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, 'Passport Expiration Alert', 'Your passport is set to expire on ' || ? || '. Many international destinations require at least 6 months of validity. Please renew it to prevent travel disruptions.', 'warning')
          `).run(u.id, u.passport_expiry);
          
          await sendStatusUpdateEmail({
            email: u.email,
            name: u.name,
            type: 'system_alert',
            ref: 'PASSPORT-ALERT',
            oldStatus: 'Valid',
            newStatus: 'Expiring Soon',
            notes: `Your passport is expiring on ${u.passport_expiry}. Many destinations require at least 6 months of passport validity. Please plan your renewal accordingly.`
          }).catch(err => console.error('Passport alert email failed:', err.message));
        }
      }
    }
  } catch (err) {
    console.error('💥 Passport expiry check failed:', err.message);
  }
}

async function checkTravelDateReminders() {
  console.log('⏳ Checking for travel reminders...');
  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const targetDateString = threeDaysFromNow.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    
    const bookings = await db.prepare(`
      SELECT id, booking_ref, user_id, customer_name, customer_email, travel_date FROM bookings
      WHERE travel_date = ? AND status = 'confirmed'
    `).all(targetDateString);
    
    for (const b of bookings) {
      if (b.user_id) {
        const alreadyNotified = await db.prepare(`
          SELECT id FROM notifications 
          WHERE user_id = ? AND title = 'Upcoming Travel Reminder'
        `).get(b.user_id);
        
        if (!alreadyNotified) {
          console.log(`🔔 Sending upcoming travel reminder to ${b.customer_name} for Booking ${b.booking_ref}`);
          
          await db.prepare(`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, 'Upcoming Travel Reminder', 'Your travel is in 3 days! Please review your visa documents and checklists.', 'success')
          `).run(b.user_id);
          
          await sendStatusUpdateEmail({
            email: b.customer_email,
            name: b.customer_name,
            type: 'system_alert',
            ref: b.booking_ref,
            oldStatus: 'Confirmed',
            newStatus: 'Travel in 3 Days',
            notes: 'Your travel date is coming up in 3 days! Please make sure all your travel checklists are ready and printed.'
          }).catch(err => console.error('Travel reminder email failed:', err.message));
        }
      }
    }
  } catch (err) {
    console.error('💥 Travel reminder check failed:', err.message);
  }
}

async function checkFutureLeadsFollowUps() {
  console.log('⏳ Checking for future travel lead follow-up dates...');
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const leads = await db.prepare(`
      SELECT id, name, email, destination, intended_travel_date, follow_up_date 
      FROM future_leads 
      WHERE follow_up_date <= ? AND status = 'pending'
    `).all(todayStr);

    for (const lead of leads) {
      const title = 'Future Travel Follow-up Reminder';
      const message = `It is time to follow up with ${lead.name} (${lead.email}) regarding their planned future travel to ${lead.destination || 'any destination'} in ${lead.intended_travel_date}.`;

      // Check if notification already exists for today to avoid spamming
      const alreadyNotified = await db.prepare(`
        SELECT id FROM notifications 
        WHERE title = ? AND ref = ? AND created_at >= CURRENT_DATE
      `).get(title, `LEAD-${lead.id}`);

      if (!alreadyNotified) {
        // Create notifications for all admins
        await db.prepare(`
          INSERT INTO notifications (user_id, title, message, type, ref)
          SELECT id, ?, ?, 'warning', ?
          FROM users WHERE role = 'admin'
        `).run(title, message, `LEAD-${lead.id}`);

        console.log(`⏰ Triggered follow-up alert for future lead: ${lead.name}`);
      }
    }
  } catch (err) {
    console.error('💥 Future leads follow-up check failed:', err.message);
  }
}

function startScheduler() {
  console.log('⏰ Starting background cron scheduler (daily checks)...');
  // Run checks initially on startup
  setTimeout(() => {
    checkPassportExpiries();
    checkTravelDateReminders();
    checkFutureLeadsFollowUps();
  }, 10000);
  
  // Run checks once every 24 hours
  setInterval(() => {
    checkPassportExpiries();
    checkTravelDateReminders();
    checkFutureLeadsFollowUps();
  }, 24 * 60 * 60 * 1000);
}

module.exports = { startScheduler };
