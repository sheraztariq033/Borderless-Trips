const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Non-visa nations list (Schengen Visa-free passport holders)
const VISA_FREE_NATIONS = [
  'united kingdom', 'united states', 'canada', 'australia', 'new zealand',
  'japan', 'singapore', 'south korea', 'israel', 'brazil', 'mexico'
];

// POST /api/ai/assess-eligibility - Visa eligibility assessment engine
router.post('/assess-eligibility', async (req, res) => {
  const { nationality, destination, brpStatus, financialStatus, employmentStatus, purpose } = req.body;

  if (!nationality || !destination) {
    return res.status(400).json({ error: 'Nationality and destination country are required for assessment.' });
  }

  const natClean = nationality.toLowerCase().trim();
  const destClean = destination.trim();

  // 1. Initial Visa Requirement Check
  if (VISA_FREE_NATIONS.includes(natClean)) {
    return res.json({
      verdict: 'NO_VISA_REQUIRED',
      score: 'Exempt',
      scoreNum: 100,
      title: 'Visa Free Travel',
      message: `As a passport holder of ${nationality}, you are likely exempt from requiring a short-stay Schengen Visa for ${destination} for stays up to 90 days. You only need a valid passport and travel insurance.`,
      checklist: [
        'Valid passport (with at least 3 months validity beyond travel date)',
        'Return ticket reservation',
        'Proof of accommodation / hotel booking',
        'Schengen-compliant travel medical insurance (£30,000 / €30,000 coverage)',
        'Sufficient funds for stay'
      ],
      nextSteps: [
        'Verify passport validity (issued within last 10 years, valid for 3+ months)',
        'Purchase travel medical insurance',
        'Book your flights and hotels through Borderless Trips'
      ]
    });
  }

  // 2. Score Calculation for Visa Required Countries
  let points = 50; // Base score
  const flags = [];
  const suggestions = [];

  // BRP Validity Check
  if (brpStatus === 'valid_more_3_months') {
    points += 20;
  } else if (brpStatus === 'valid_less_3_months') {
    points -= 20;
    flags.push('Your UK residency permit (BRP) is valid for less than 3 months after your return date. European consulates strictly require at least 3 months validity.');
    suggestions.push('Renew your UK BRP/residency permit before applying for a Schengen visa, or apply for an extension.');
  } else {
    points -= 30;
    flags.push('No valid UK residency status declared. Schengen visa applications in the UK are restricted to legal residents.');
    suggestions.push('You must apply from your home country or country of legal residence if you do not reside in the UK.');
  }

  // Financial Sufficiency Check (estimated savings/funds)
  const funds = parseFloat(financialStatus) || 0;
  if (funds >= 5000) {
    points += 20;
  } else if (funds >= 3000) {
    points += 10;
  } else if (funds >= 1500) {
    points += 0;
    flags.push('Your current available balance (£1,500 - £3,000) is adequate but close to the minimum required for longer stays.');
    suggestions.push('Ensure your bank statements show consistent savings. Keep at least £1,500+ in your active current account for at least 3 months.');
  } else {
    points -= 25;
    flags.push('Your current balance is below £1,500. Consulates evaluate bank statements to ensure you can support yourself without working in Europe.');
    suggestions.push('Deposit additional funds and maintain a stable balance above £1,500 for the 3 months leading up to your appointment.');
  }

  // Employment/Income Stability Check
  if (employmentStatus === 'employed_full_time' || employmentStatus === 'employed_part_time') {
    points += 10;
  } else if (employmentStatus === 'self_employed') {
    points += 5;
    suggestions.push('As a self-employed applicant, prepare your latest Self-Assessment tax return, HMRC registration, and an accountant letter.');
  } else if (employmentStatus === 'student') {
    points += 5;
    suggestions.push('As a student, obtain an official university or college enrollment letter stating your course details, term dates, and attendance record.');
  } else if (employmentStatus === 'unemployed') {
    points -= 15;
    flags.push('Unemployed status is considered high risk unless you have a sponsor (e.g., spouse or parents) covering all costs.');
    suggestions.push('If sponsored, obtain a formal sponsorship letter, the sponsor passport, and their 3 months bank statements.');
  }

  // Final score category assignment
  let score = 'Medium';
  let message = 'You have a solid case, but you must pay close attention to your documentation to ensure a successful outcome.';
  
  if (points >= 80) {
    score = 'High';
    message = 'Excellent! Your profile meets all standard criteria. Your chances of Schengen Visa approval are very strong. Let us assist you with compiling a flawless file and booking appointments.';
  } else if (points < 50) {
    score = 'Low';
    message = 'Your application has some risk areas (such as BRP validity or financial limits). We recommend addressing these issues before submitting your application to avoid a rejection.';
  }

  // 3. Document Checklist Generation
  const checklist = [
    'Valid Passport (original + photocopy, issued in last 10 years, valid for 3+ months after return)',
    'UK BRP / Visa Permit (valid for 3+ months after return)',
    'Completed & Signed Schengen Visa Application Form',
    'Two recent biometric passport-sized photos (taken within last 6 months)',
    'Schengen-compliant Travel Insurance (minimum €30,000 coverage, covering medical emergencies and repatriation)',
    'Fully-paid flight bookings or reserved round-trip flight itinerary',
    'Confirmed hotel booking or proof of accommodation',
    'Last 3 months of detailed UK current bank statements (showing name, address, and sufficient balance)'
  ];

  if (employmentStatus === 'employed_full_time' || employmentStatus === 'employed_part_time') {
    checklist.push(
      'Employment Letter (dated within 1 month, signed, stating role, salary, and holiday dates)',
      'Last 3 months of official payslips'
    );
  } else if (employmentStatus === 'self_employed') {
    checklist.push(
      'HMRC Self-Assessment tax return or company certificate',
      'Recent letter from a certified accountant',
      'Business bank statements for the last 3 months'
    );
  } else if (employmentStatus === 'student') {
    checklist.push(
      'University Enrollment Letter (dated within 30 days, confirming attendance, course, and holidays)'
    );
  } else if (employmentStatus === 'unemployed') {
    checklist.push(
      'Sponsorship Letter (if sponsored by spouse/parent)',
      'Sponsor last 3 months bank statements',
      'Sponsor proof of income (payslips/employment letter)',
      'Proof of relationship (e.g. Marriage or Birth Certificate, translated if not in English)'
    );
  }

  // 4. Match packages
  let recommendedPackages = [];
  try {
    let typeFilter = 'culture';
    if (purpose === 'tourism_leisure' || purpose === 'tourism') {
      typeFilter = 'culture';
    } else if (purpose === 'honeymoon_romance' || purpose === 'romance') {
      typeFilter = 'romance';
    } else if (purpose === 'business') {
      typeFilter = 'luxury';
    }

    const matched = await db.prepare('SELECT id, title, destination, duration, price, type, images FROM packages WHERE active = 1 AND destination = ? LIMIT 2').all(destClean);
    
    if (matched.length > 0) {
      recommendedPackages = matched;
    } else {
      // Fallback to featured
      recommendedPackages = await db.prepare('SELECT id, title, destination, duration, price, type, images FROM packages WHERE active = 1 AND featured = 1 LIMIT 2').all();
    }

    recommendedPackages = recommendedPackages.map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]')
    }));
  } catch (e) {
    // Ignore package fetching errors
  }

  res.json({
    verdict: 'VISA_REQUIRED',
    score,
    scoreNum: points,
    title: `${score} Approval Eligibility`,
    message,
    checklist,
    flags,
    suggestions,
    recommendedPackages,
    nextSteps: [
      'Compile the documents in the checklist.',
      'Book a visa center appointment (VFS Global / TLScontact).',
      'Schedule a consult call with Borderless Trips for professional document review.'
    ]
  });
});

module.exports = router;
