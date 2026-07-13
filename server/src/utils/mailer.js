const nodemailer = require('nodemailer');
const db = require('../models/database');

// Helper to load settings from DB in real time
async function getSystemSettings() {
  try {
    const rows = await db.prepare("SELECT key, value FROM settings").all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    return settings;
  } catch (e) {
    console.error('Failed to read settings from database:', e);
    return {};
  }
}

// Build nodemailer transporter dynamically using DB settings
async function getTransporter() {
  const settings = await getSystemSettings();
  const host = settings.smtp_host || process.env.SMTP_HOST;
  const port = parseInt(settings.smtp_port || process.env.SMTP_PORT || '587');
  const user = settings.smtp_user || process.env.SMTP_USER;
  const pass = settings.smtp_pass || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    // Return null so we run in mock console logger mode
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
}

// HTML wrapper for emails
function getEmailTemplate(title, preheader, contentHtml, settings = {}) {
  const businessName = settings.business_name || 'Borderless Trips';
  const address = settings.address || 'London, United Kingdom';
  const logoUrl = settings.logo_url 
    ? (settings.logo_url.startsWith('http') ? settings.logo_url : `https://palegreen-bison-521258.hostingersite.com${settings.logo_url}`) 
    : 'https://palegreen-bison-521258.hostingersite.com/logo.svg';
  const websiteUrl = settings.website_url || 'https://palegreen-bison-521258.hostingersite.com';
  const phone = settings.phone || '';
  const email = settings.email || '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; background-color: #f8fafc; padding: 24px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0b1d35 0%, #1e3a5f 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #d4a574; }
        .logo-text { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; margin: 0; }
        .logo-accent { color: #d4a574; }
        .content { padding: 36px 32px; line-height: 1.6; }
        .h1 { font-size: 20px; font-weight: 700; color: #0b1d35; margin-top: 0; margin-bottom: 16px; }
        .p { margin-top: 0; margin-bottom: 16px; font-size: 15px; color: #334155; }
        .button-container { text-align: center; margin: 28px 0; }
        .button { display: inline-block; background-color: #d4a574; color: #ffffff !important; padding: 12px 24px; border-radius: 30px; font-weight: 600; text-decoration: none; font-size: 14px; box-shadow: 0 4px 10px rgba(212, 165, 116, 0.35); transition: background-color 0.2s; }
        .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
        .card-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .card-row:last-child { border-bottom: none; }
        .card-label { font-weight: 600; color: #64748b; }
        .card-value { color: #0b1d35; font-weight: 700; }
        .footer { background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer-text { font-size: 12px; color: #64748b; margin: 0 0 8px 0; }
        .footer-links a { color: #d4a574; text-decoration: none; font-weight: 600; margin: 0 8px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1 class="logo-text">${businessName.toUpperCase()}</h1>
          </div>
          <div class="content">
            ${contentHtml}
          </div>
          <div class="footer">
            <p class="footer-text">© ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
            <p class="footer-text">${address}</p>
            ${phone || email ? `<p class="footer-text" style="font-size:11px; margin-top:4px;">${phone ? `Tel: ${phone}` : ''} ${phone && email ? '|' : ''} ${email ? `Email: ${email}` : ''}</p>` : ''}
            <div class="footer-links">
              <a href="${websiteUrl}/terms-of-service">Terms</a>
              <a href="${websiteUrl}/privacy-policy">Privacy</a>
              <a href="${websiteUrl}/refund-policy">Refunds</a>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Core send mail wrapper
async function sendMail({ to, subject, html, text }) {
  const settings = await getSystemSettings();
  const from = settings.smtp_from || process.env.SMTP_FROM || 'info@borderlesstrips.com';
  const pass = settings.smtp_pass || process.env.SMTP_PASS;

  // Use Brevo HTTP API if the password is a Brevo API key (starts with 'xkeysib-')
  if (pass && pass.startsWith('xkeysib-')) {
    try {
      let senderName = settings.business_name || 'Borderless Trip';
      let senderEmail = 'lastlook.pk@gmail.com';
      const match = from.match(/([^<]+)<([^>]+)>/);
      if (match) {
        senderName = match[1].trim();
        senderEmail = match[2].trim();
      } else {
        senderEmail = from.trim();
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': pass,
          'content-type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text || ''
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || JSON.stringify(data));
      }

      console.log(`✉️ Email successfully sent via Brevo HTTP API to ${to} (ID: ${data.messageId})`);
      return { messageId: data.messageId };
    } catch (apiError) {
      console.error(`❌ Failed to send email via Brevo HTTP API to ${to}:`, apiError);
      throw apiError;
    }
  }

  const transporter = await getTransporter();
  if (!transporter) {
    console.log('\n--- ✉️ [MOCK EMAIL SENT] ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`From: ${from}`);
    console.log('--- HTML Preview ---');
    console.log(html);
    console.log('----------------------------\n');
    return { mock: true, messageId: 'mock-id-' + Date.now() };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: text || '',
      html
    });
    console.log(`✉️ Email successfully sent to ${to} (ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
}

// 1. Welcome Email with credentials
async function sendWelcomeEmail({ email, name, tempPassword }) {
  const settings = await getSystemSettings();
  const websiteUrl = settings.website_url || 'https://palegreen-bison-521258.hostingersite.com';
  const loginUrl = `${websiteUrl}/login`;
  
  const content = `
    <h2 class="h1">Welcome to ${settings.business_name || 'Borderless Trips'}, ${name}!</h2>
    <p class="p">Thank you for registering with us. An official client portal account has been prepared for you. You can log in at any time to monitor your visa application, update travelers list, or download travel documents.</p>
    
    <div class="card">
      <h3 style="margin-top:0; font-size:15px; color:#0b1d35; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">Your Temporary Login Credentials</h3>
      <div class="card-row">
        <span class="card-label">Email Address</span>
        <span class="card-value">${email}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Temporary Password</span>
        <span class="card-value" style="font-family:monospace; font-size:15px;">${tempPassword}</span>
      </div>
    </div>

    <p class="p" style="color: #ef4444; font-weight: 600; font-size:13px;">⚠️ Note: For safety, please update your temporary password immediately upon signing in by visiting your Profile settings.</p>

    <div class="button-container">
      <a href="${loginUrl}" class="button">Log In to Customer Portal</a>
    </div>
  `;

  return sendMail({
    to: email,
    subject: `Welcome to ${settings.business_name || 'Borderless Trips'} - Your Client Account is Ready`,
    html: getEmailTemplate(`Welcome to ${settings.business_name || 'Borderless Trips'}`, 'Your client account details', content, settings),
    text: `Welcome to ${settings.business_name || 'Borderless Trips'}!\n\nAn account has been created for you.\nEmail: ${email}\nPassword: ${tempPassword}\n\nLog in at: ${loginUrl}`
  });
}

// 2. Service Request Confirmation
async function sendRequestConfirmation({ email, name, ref, serviceType, country }) {
  const settings = await getSystemSettings();
  const websiteUrl = settings.website_url || 'https://palegreen-bison-521258.hostingersite.com';
  const portalUrl = `${websiteUrl}/login`;
  
  const typeLabels = {
    visa: 'Visa Application Review',
    holiday_package: 'Holiday Package Booking',
    flight: 'Flight Reservation',
    hotel: 'Hotel Booking',
    consultation: 'Agent Consultation',
    other: 'Service Enquiry'
  };
  const label = typeLabels[serviceType] || 'Service Request';

  const content = `
    <h2 class="h1">Service Request Received!</h2>
    <p class="p">Dear ${name}, we have successfully received your service request. Our travel coordinators have been assigned and are currently evaluating your details.</p>
    
    <div class="card">
      <h3 style="margin-top:0; font-size:15px; color:#0b1d35; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">Request Summary</h3>
      <div class="card-row">
        <span class="card-label">Reference Number</span>
        <span class="card-value">${ref}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Service Type</span>
        <span class="card-value">${label}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Destination Country</span>
        <span class="card-value">${country || 'Global'}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Status</span>
        <span class="card-value" style="color:#f59e0b;">Pending Review</span>
      </div>
    </div>

    <p class="p">You can log in to your dashboard to view documents required for your submission, upload files, or message support.</p>

    <div class="button-container">
      <a href="${portalUrl}" class="button">Track Your Request</a>
    </div>
  `;

  return sendMail({
    to: email,
    subject: `Confirming Service Request - Ref: ${ref}`,
    html: getEmailTemplate('Request Confirmed', 'Service request received', content, settings),
    text: `Hello ${name},\n\nWe have received your request for: ${label} (${country}).\nReference Number: ${ref}\n\nTrack progress on your portal: ${portalUrl}`
  });
}

// 3. Application Process Status Update (Visa/Bookings/Requests)
async function sendStatusUpdateEmail({ email, name, type, ref, oldStatus, newStatus, notes }) {
  const settings = await getSystemSettings();
  const websiteUrl = settings.website_url || 'https://palegreen-bison-521258.hostingersite.com';
  const portalUrl = `${websiteUrl}/login`;
  
  const statusLabels = {
    new: 'New / Received',
    pending: 'Pending Information',
    accepted: 'Request Accepted',
    in_progress: 'In Review / Processing',
    completed: 'Completed',
    rejected: 'Declined',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    approved: 'Approved',
    document_complete: 'Documents Complete'
  };

  const typeLabels = {
    visa: 'Visa Application',
    booking: 'Travel Booking',
    request: 'Service Request'
  };

  const typeLabel = typeLabels[type] || 'Travel File';
  const oldLabel = statusLabels[oldStatus] || oldStatus;
  const newLabel = statusLabels[newStatus] || newStatus;

  let statusColor = '#0ea5e9'; // Blue
  if (['completed', 'approved', 'confirmed'].includes(newStatus)) statusColor = '#10b981'; // Green
  if (['rejected', 'cancelled'].includes(newStatus)) statusColor = '#ef4444'; // Red
  if (['new', 'pending'].includes(newStatus)) statusColor = '#f59e0b'; // Amber

  const content = `
    <h2 class="h1">File Update Notification</h2>
    <p class="p">Dear ${name}, the status of your ${typeLabel} (Ref: ${ref}) has been updated by our team.</p>
    
    <div class="card">
      <h3 style="margin-top:0; font-size:15px; color:#0b1d35; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">Status Log</h3>
      <div class="card-row">
        <span class="card-label">Reference Number</span>
        <span class="card-value">${ref}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Previous Status</span>
        <span class="card-value" style="text-decoration:line-through; color:#64748b;">${oldLabel}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Current Status</span>
        <span class="card-value" style="color:${statusColor}; font-weight:800;">${newLabel}</span>
      </div>
    </div>

    ${notes ? `
      <div style="background-color: #f8fafc; border-left: 4px solid #d4a574; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <h4 style="margin-top:0; margin-bottom:8px; font-size:13px; color:#0b1d35;">Team Notes:</h4>
        <p style="margin:0; font-size:14px; color:#334155; line-height:1.5;">${notes}</p>
      </div>
    ` : ''}

    <p class="p">Please log in to your portal to review any updates, upload newly requested files, or see your invoice status.</p>

    <div class="button-container">
      <a href="${portalUrl}" class="button">Log In to Client Portal</a>
    </div>
  `;

  return sendMail({
    to: email,
    subject: `Update on your ${typeLabel} - Ref: ${ref}`,
    html: getEmailTemplate('Status Update', 'Your travel file status has been updated', content, settings),
    text: `Hello ${name},\n\nThe status of your ${typeLabel} (${ref}) has been updated from ${oldLabel} to ${newLabel}.\n\nLog in to portal: ${portalUrl}`
  });
}

// 4. Admin Alert for New Service Requests
async function sendAdminAlert({ ref, name, email, serviceType, country }) {
  // Load admin email from settings (or environment variable as fallback)
  const settings = await getSystemSettings();
  const to = settings.smtp_alert_recipient || process.env.ADMIN_ALERT_EMAIL || settings.email || 'info@borderlesstrips.com';
  const websiteUrl = settings.website_url || 'https://palegreen-bison-521258.hostingersite.com';

  const typeLabels = {
    visa: 'Visa Application Review',
    holiday_package: 'Holiday Package Booking',
    flight: 'Flight Reservation',
    hotel: 'Hotel Booking',
    consultation: 'Agent Consultation',
    other: 'Service Enquiry'
  };
  const label = typeLabels[serviceType] || 'Service Request';

  const content = `
    <h2 class="h1" style="color:#ef4444;">🚨 New Service Request Submitted!</h2>
    <p class="p">An automatic alert notification has been triggered. A client has submitted a service request from the frontend site.</p>
    
    <div class="card">
      <h3 style="margin-top:0; font-size:15px; color:#0b1d35; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">Request Summary Details</h3>
      <div class="card-row">
        <span class="card-label">Reference Number</span>
        <span class="card-value">${ref}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Client Name</span>
        <span class="card-value">${name}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Client Email</span>
        <span class="card-value">${email}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Service Required</span>
        <span class="card-value">${label}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Destination Country</span>
        <span class="card-value">${country || 'Global'}</span>
      </div>
    </div>

    <p class="p">Please sign in to the Admin Panel dashboard to assign coordinators, accept/reject, or convert this file.</p>

    <div class="button-container">
      <a href="${websiteUrl}/admin" class="button" style="background-color:#0b1d35;">Go to Admin Panel</a>
    </div>
  `;

  return sendMail({
    to,
    subject: `🚨 [Admin Alert] New Request (${label}) - Ref: ${ref}`,
    html: getEmailTemplate('Admin Alert', 'New client service request received', content, settings),
    text: `New service request submitted!\n\nRef: ${ref}\nClient: ${name} (${email})\nService: ${label}\n\nGo to Admin Panel: ${websiteUrl}/admin`
  });
}

module.exports = {
  sendMail,
  sendWelcomeEmail,
  sendRequestConfirmation,
  sendStatusUpdateEmail,
  sendAdminAlert,
  getEmailTemplate
};
