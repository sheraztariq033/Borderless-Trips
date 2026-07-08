// Borderless Trips 2.0 - Asynchronous Database Seeder for PostgreSQL / Supabase
const db = require('./database');

async function seedDatabase() {
  try {
    console.log('🌱 Checking if database requires seeding...');

    // 1. Seed Countries
    const countryCountRow = await db.prepare('SELECT COUNT(*) as count FROM countries').get();
    const countryCount = countryCountRow ? parseInt(countryCountRow.count || '0') : 0;
    if (countryCount === 0) {
      console.log('🌱 Seeding countries...');
      const countries = [
        // Schengen Area
        { name: 'Austria', code: 'AT', region: 'schengen' },
        { name: 'Belgium', code: 'BE', region: 'schengen' },
        { name: 'Bulgaria', code: 'BG', region: 'schengen' },
        { name: 'Croatia', code: 'HR', region: 'schengen' },
        { name: 'Czech Republic', code: 'CZ', region: 'schengen' },
        { name: 'Denmark', code: 'DK', region: 'schengen' },
        { name: 'Estonia', code: 'EE', region: 'schengen' },
        { name: 'Finland', code: 'FI', region: 'schengen' },
        { name: 'France', code: 'FR', region: 'schengen' },
        { name: 'Germany', code: 'DE', region: 'schengen' },
        { name: 'Greece', code: 'GR', region: 'schengen' },
        { name: 'Hungary', code: 'HU', region: 'schengen' },
        { name: 'Iceland', code: 'IS', region: 'schengen' },
        { name: 'Italy', code: 'IT', region: 'schengen' },
        { name: 'Latvia', code: 'LV', region: 'schengen' },
        { name: 'Liechtenstein', code: 'LI', region: 'schengen' },
        { name: 'Lithuania', code: 'LT', region: 'schengen' },
        { name: 'Luxembourg', code: 'LU', region: 'schengen' },
        { name: 'Malta', code: 'MT', region: 'schengen' },
        { name: 'Netherlands', code: 'NL', region: 'schengen' },
        { name: 'Norway', code: 'NO', region: 'schengen' },
        { name: 'Poland', code: 'PL', region: 'schengen' },
        { name: 'Portugal', code: 'PT', region: 'schengen' },
        { name: 'Romania', code: 'RO', region: 'schengen' },
        { name: 'Slovakia', code: 'SK', region: 'schengen' },
        { name: 'Slovenia', code: 'SI', region: 'schengen' },
        { name: 'Spain', code: 'ES', region: 'schengen' },
        { name: 'Sweden', code: 'SE', region: 'schengen' },
        { name: 'Switzerland', code: 'CH', region: 'schengen' },
        // Popular destinations
        { name: 'Turkey', code: 'TR', region: 'europe' },
        { name: 'United Kingdom', code: 'GB', region: 'europe' },
        { name: 'United Arab Emirates', code: 'AE', region: 'middle_east' },
        { name: 'Thailand', code: 'TH', region: 'asia' },
        { name: 'Malaysia', code: 'MY', region: 'asia' },
        { name: 'Maldives', code: 'MV', region: 'asia' },
        { name: 'Egypt', code: 'EG', region: 'africa' },
        { name: 'Morocco', code: 'MA', region: 'africa' },
        { name: 'Japan', code: 'JP', region: 'asia' },
        { name: 'South Korea', code: 'KR', region: 'asia' },
        { name: 'United States', code: 'US', region: 'americas' },
        { name: 'Canada', code: 'CA', region: 'americas' },
        { name: 'Australia', code: 'AU', region: 'oceania' },
        { name: 'New Zealand', code: 'NZ', region: 'oceania' },
        { name: 'Saudi Arabia', code: 'SA', region: 'middle_east' },
      ];
      for (const c of countries) {
        await db.prepare('INSERT INTO countries (name, code, region, visa_required, active) VALUES (?, ?, ?, 1, 1)')
          .run(c.name, c.code, c.region);
      }
      console.log(`✅ ${countries.length} countries seeded successfully.`);
    }

    // 2. Seed Default Settings
    const settingsCountRow = await db.prepare('SELECT COUNT(*) as count FROM settings').get();
    const settingsCount = settingsCountRow ? parseInt(settingsCountRow.count || '0') : 0;
    if (settingsCount === 0) {
      console.log('🌱 Seeding default settings...');
      const defaults = {
        business_name: 'Borderless Trips',
        phone: '+44 123 456 7890',
        email: 'info@borderlesstrips.com',
        whatsapp: '+441234567890',
        bank_name: 'Barclays',
        account_name: 'Borderless Trips Ltd',
        sort_code: '20-XX-XX',
        account_number: 'XXXXXXXX',
        address: 'London, United Kingdom',
        currency: 'GBP',
        logo_url: '/logo.png',
        hero_images: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80, https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80, https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=80, https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1600&q=80, https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80',
        hero_video: 'https://player.vimeo.com/external/434045526.sd.mp4?s=c27d23d8c1ad2125e98583fb24285e683f491176&profile_id=165&oauth2_token_id=57447761',
        page_refund_policy: `## 1. Visa Services & Consultations\nOur primary goal is to help you successfully obtain your travel visas. Please read the following conditions regarding visa assistance payments:\n* **Professional Service Fees:** The fees charged for travel consultation and application reviews are fully refundable if requested within 24 hours of booking, provided document validation or submission has not commenced.\n* **Government & Embassy Fees:** Government embassy visa fee charges, travel insurance premium cards, and biometric booking slots are non-refundable once paid to the respective consular or third-party visa centers.\n* **Application Decisions:** Consular departments of the destination countries have sole authority regarding visa approvals and rejections. Borderless Trips cannot issue refunds in the event of consular visa refusal, unless you have selected our Premium Guaranteed Visa Service package.\n\n## 2. Holiday Packages & Tours\nCancellations of pre-planned holiday packages are subject to terms dependent on the travel operators and timeline:\n* **30+ Days Before Departure:** Cancellations made 30 days or more prior to the scheduled departure will receive a full refund of deposit payments, less a standard 10% administrative planning fee.\n* **15 to 29 Days Before Departure:** Cancellations will be subject to a 50% penalty fee of the package total deposit, unless booking clauses specify otherwise.\n* **Under 15 Days Before Departure:** Package cancellations made within 14 days of departure are non-refundable, as flights, hotel slots, and transport activities will have been locked by operators.\n\n## 3. Flight & Hotel Bookings\nFlights and hotel room accommodations are governed directly by airline fare rules and provider booking conditions:\n* **Airlines:** Non-refundable promotional flights are strictly non-refundable as per airline rules. Date changes and cancellations on flexible fares will be processed according to the carrier's terms, subject to any processing fees.\n* **Hotels:** Free cancellation rooms can be cancelled without penalty up to the provider's threshold date. Pre-paid non-refundable room rates cannot be refunded.`,
        page_terms_of_service: `## 1. Agreement to Terms\nBy using our website, AI assistant, or Client Portal, you agree to comply with and be bound by these Terms of Service. If you do not agree to all of these terms, please do not access or use our services.\n\n## 2. Services Offered\nBorderless Trips acts as an intermediary agency providing Schengen and global visa application support, premium holiday packages, flight reservations, and luxury hotel bookings.\n\n## 3. User Obligations & Document Accuracy\nAs a client, you agree to:\n* Provide accurate, complete, and up-to-date documentation (bank statements, employer letters, identification cards) for visa applications and flight reservations.\n* Verify that passport validity complies with international rules (must not expire within 6 months of departure and have at least 2 blank pages).\n* Acknowledge that submitting false or doctored paperwork to Schengen embassies will lead to immediate cancellation of your request without refund, and report to regulatory agencies.\n\n## 4. Payments, Billing & Portal Security\nAll bookings and service requests require clear transactions:\n* **Billing:** Visa consultation and booking deposits are billed upfront. Balance payments for holiday packages must be completed 15 days before travel, unless agreed otherwise.\n* **Portal Accounts:** When an account is auto-created or set up manually, you are solely responsible for keeping your password secure. Inform us immediately if you suspect unauthorized access.\n\n## 5. Limitation of Liability\nBorderless Trips holds zero liability for events outside our operational control (force majeure):\n* We do not control consular or diplomatic decisions regarding Schengen visa issuances, administrative delays, or biometric slot queues.\n* We are not liable for flight cancellations, carrier rescheduling, lost baggage, hotel booking cancellations, or activity changes managed by third-party suppliers.\n\n## 6. Amendments to Terms\nWe reserve the right to modify these Terms of Service at any time. Changes will be posted to this page and the updated "Last Modified" date will be updated. Continual use of the portal implies acceptance of modifications.`,
        page_privacy_policy: `## 1. Information We Collect\nTo provide Schengen visa reviews and holiday bookings, we collect the following categories of information:\n* **Contact details:** Name, email address, phone number, and physical mailing address.\n* **Identity information:** Nationality, passport number, visa history, and country details.\n* **Financial records:** Bank statements, employment documents, and payslips submitted to complete visa checklists.\n* **Activity logs:** IP addresses, browser types, session history, and quick-action chats.\n\n## 2. How We Use Your Information\nYour personal and travel information is utilized strictly to run our business services:\n* To calculate your Schengen visa eligibility score and prepare checklist items.\n* To book flight tickets, hotel rooms, and holiday tour packages on your behalf.\n* To provision and administer your personal Client Portal account.\n* To notify you about application updates, payments confirmation, and document reviews.\n\n## 3. Document Sharing & Third-Parties\nWe do not sell, rent, or trade your personal travel profiles or documents. We share data only with trusted partners required to fulfill your bookings:\n* Airlines and hotels to finalize reservations.\n* Embassies and designated visa centers (VFS Global, TLScontact, BLS International) during biometric slot bookings.\n* Government regulatory or judicial institutions where required by law.\n\n## 4. Data Security\nWe implement state-of-the-art security measures to protect your sensitive documents:\n* All uploads are saved on secure server directories.\n* Sessions and API endpoints require JSON Web Token (JWT) authorization header checks.\n* Databases reside in SQLite files mounted in private local server volumes with restricted ssh network layers.\n\n## 5. Your Privacy Rights\nYou retain complete control over your profiles. You can write to our data protection officer at privacy@borderlesstrips.com to download, modify, or permanently purge your account records from our servers.`
      };
      for (const [key, value] of Object.entries(defaults)) {
        await db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(key, value);
      }
      console.log('✅ Default settings seeded successfully.');
    }

    // 3. Seed Premium Packages
    const packagesCountRow = await db.prepare('SELECT COUNT(*) as count FROM packages').get();
    const packagesCount = packagesCountRow ? parseInt(packagesCountRow.count || '0') : 0;
    if (packagesCount === 0) {
      console.log('🌱 Seeding premium packages...');
      const initialPackages = [
        {
          title: 'Romantic Paris & Seine Experience',
          destination: 'France',
          description: 'Experience the magic of Paris, from sunset cruises on the Seine to private tours of the Louvre and high culinary dining. Perfect for couples looking for an unforgettable getaway.',
          duration: '5 Days / 4 Nights',
          price: 799.0,
          original_price: 999.0,
          type: 'romance',
          images: JSON.stringify([
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1503917988258-f87a78e3c995?auto=format&fit=crop&w=800&q=80'
          ]),
          itinerary: JSON.stringify([
            { day: 1, title: 'Arrival & Seine Dinner Cruise', details: 'Arrive in Paris, transfer to your boutique hotel. In the evening, enjoy a 3-course dinner cruise along the Seine with live music.' },
            { day: 2, title: 'Louvre Museum & Eiffel Tower', details: 'Skip-the-line morning tour of the Louvre. Afternoon at leisure, followed by sunset access to the top tier of the Eiffel Tower.' },
            { day: 3, title: 'Palace of Versailles Tour', details: 'Guided half-day excursion to the royal Palace of Versailles, including the Hall of Mirrors and the expansive gardens.' },
            { day: 4, title: 'Montmartre & Wine Tasting', details: 'Explore the artistic history of Montmartre and Sacré-Cœur, ending with a private wine tasting session at a local cellar.' },
            { day: 5, title: 'Departure', details: 'Bid au revoir to Paris. Private transfer to the airport or train station.' }
          ]),
          includes: JSON.stringify([
            '4 nights accommodation in a 4-star boutique hotel',
            'Daily gourmet breakfast',
            'Seine River dinner cruise ticket',
            'Skip-the-line tickets to Louvre and Eiffel Tower',
            'Airport round-trip private transfers'
          ]),
          excludes: JSON.stringify([
            'International flights',
            'Travel insurance',
            'Schengen Visa processing fee (£150)',
            'Personal expenses and lunches'
          ]),
          rating: 4.8,
          reviews: 42,
          featured: 1,
          active: 1
        },
        {
          title: 'Amalfi Coast Luxury Escape',
          destination: 'Italy',
          description: 'Soak up the Italian sun in Positano, Capri, and Ravello. Live the sweet life with luxury cliffside hotels, private yachts, and authentic cooking masterclasses.',
          duration: '7 Days / 6 Nights',
          price: 1499.0,
          original_price: 1899.0,
          type: 'luxury',
          images: JSON.stringify([
            'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1498503182468-3b51cbb6cb24?auto=format&fit=crop&w=800&q=80'
          ]),
          itinerary: JSON.stringify([
            { day: 1, title: 'Rome to Positano Cliffside Hotel', details: 'Private chauffeur transfer from Rome. Check into your luxury room overlooking the Positano bay.' },
            { day: 2, title: 'Capri Yacht Cruise & Blue Grotto', details: 'Board your private yacht to Capri. Cruise around the Faraglioni rocks, visit the Blue Grotto and enjoy lunch in Anacapri.' },
            { day: 3, title: 'Amalfi & Ravello Excursion', details: 'Drive along the iconic coastal road. Tour the historic town of Amalfi and visit the stunning cliffside gardens of Villa Rufolo in Ravello.' },
            { day: 4, title: 'Beach Club Leisure Day', details: 'Enjoy a reserved VIP sunbed at a premier beach club. Cocktails and Mediterranean seafood lunch included.' },
            { day: 5, title: 'Pompeii Guided Tour', details: 'Skip-the-line private tour of the Pompeii ruins. Evening leisure time in Sorrento.' },
            { day: 6, title: 'Sorrento Cooking Masterclass', details: 'Learn to make fresh pasta, limoncello, and tiramisu with a local Michelin-star chef at a coastal estate.' },
            { day: 7, title: 'Departure', details: 'Transfer back to Rome Airport for your flight home.' }
          ]),
          includes: JSON.stringify([
            '6 nights in premium cliff-view hotels',
            'Private yacht day cruise to Capri',
            'Private chauffeured transfers throughout',
            'All entry tickets including Pompeii and Gardens',
            'Sorrento cooking class and Amalfi seafood lunch'
          ]),
          excludes: JSON.stringify([
            'Flights to Rome',
            'Visa fees',
            'Tourist city tax'
          ]),
          rating: 4.9,
          reviews: 28,
          featured: 1,
          active: 1
        },
        {
          title: 'Swiss Alps Adventure & Nature',
          destination: 'Switzerland',
          description: 'Climb the Top of Europe, ride scenic trains, and conquer glacier summits. An exhilarating journey through Interlaken, Grindelwald, and Zermatt.',
          duration: '6 Days / 5 Nights',
          price: 1299.0,
          original_price: 1599.0,
          type: 'adventure',
          images: JSON.stringify([
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80'
          ]),
          itinerary: JSON.stringify([
            { day: 1, title: 'Zurich to Scenic Interlaken', details: 'Board the Swiss Rail (1st Class) to Interlaken. Check in at a luxury chalet-style resort with lake views.' },
            { day: 2, title: 'Jungfraujoch: Top of Europe', details: 'Ride the Eiger Express cable car and cogwheel train up to 3,454m. Tour the Ice Palace and Sphinx Observatory.' },
            { day: 3, title: 'Grindelwald First Mountain Adventure', details: 'Enjoy activities like the Cliff Walk, First Flyer zip-line, and alpine hiking. End with traditional Swiss fondue dinner.' },
            { day: 4, title: 'Scenic GoldenPass Express to Zermatt', details: 'Panoramic train ride through the heart of the Alps to Zermatt, the car-free mountain village under the Matterhorn.' },
            { day: 5, title: 'Matterhorn Glacier Paradise', details: 'Cable car ride to Europe highest station. Skiing, snow tubing, and panoramic views of French, Swiss, and Italian peaks.' },
            { day: 6, title: 'Return Transfer', details: '1st Class rail ticket back to Zurich Airport for departure.' }
          ]),
          includes: JSON.stringify([
            '5 nights accommodation in 5-star mountain lodges',
            'Swiss Travel Pass (1st Class, 8 days)',
            'Full excursions to Jungfraujoch & Glacier Paradise',
            'Daily Swiss buffet breakfast',
            'Specialty cheese fondue dinner'
          ]),
          excludes: JSON.stringify([
            'Flights to Switzerland',
            'Rental of winter/skiing gear',
            'Personal guides'
          ]),
          rating: 4.7,
          reviews: 19,
          featured: 1,
          active: 1
        },
        {
          title: 'Spanish Fiesta: Barcelona & Madrid',
          destination: 'Spain',
          description: 'Discover the rich art, architecture, and street life of Spain. Marvel at Gaudi works, taste authentic tapas, and travel by high-speed AVE train.',
          duration: '8 Days / 7 Nights',
          price: 999.0,
          original_price: 1199.0,
          type: 'culture',
          images: JSON.stringify([
            'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1583779457094-0e0f548d8b97?auto=format&fit=crop&w=800&q=80'
          ]),
          itinerary: JSON.stringify([
            { day: 1, title: 'Welcome to Barcelona', details: 'Private transfer to your hotel. Evening tapas-tour in El Born neighborhood.' },
            { day: 2, title: 'Gaudi Architecture Tour', details: 'Guided skip-the-line visits to Sagrada Família and Park Güell. Walk along Passeig de Grácia.' },
            { day: 3, title: 'Gothic Quarter & Beach Club', details: 'Walk through the historical Gothic Quarter, and spend the afternoon at Barcelona beach.' },
            { day: 4, title: 'AVE High-Speed Train to Madrid', details: '2.5 hour bullet train ride in Club Class to Madrid. Evening walk around Puerta del Sol.' },
            { day: 5, title: 'Royal Palace & Prado Art Museum', details: 'Morning tour of the majestic Royal Palace, followed by Prado Museum access.' },
            { day: 6, title: 'Toledo Medieval Day Excursion', details: 'Day trip to Toledo, the city of three cultures. Explore the old synagogues, cathedrals, and armor shops.' },
            { day: 7, title: 'Flamenco Show & Farewell Dinner', details: 'Watch an authentic Flamenco performance at a historic taberna with a grand Spanish dinner.' },
            { day: 8, title: 'Farewell Madrid', details: 'Transfer to Madrid Barajas Airport for your flight.' }
          ]),
          includes: JSON.stringify([
            '7 nights in centrally-located 4-star hotels',
            'High-speed AVE train ticket (Barcelona - Madrid)',
            'Skip-the-line tickets for Sagrada Familia and Prado Museum',
            'Tapas tour and Flamenco show with dinner',
            'Private airport transfers'
          ]),
          excludes: JSON.stringify([
            'Flights to Spain',
            'Visa costs',
            'Public transit tickets'
          ]),
          rating: 4.8,
          reviews: 35,
          featured: 0,
          active: 1
        }
      ];

      for (const pkg of initialPackages) {
        await db.prepare(`
          INSERT INTO packages (
            title, destination, description, duration, price, original_price,
            type, images, itinerary, includes, excludes, rating, reviews, featured, active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          pkg.title, pkg.destination, pkg.description, pkg.duration,
          pkg.price, pkg.original_price, pkg.type, pkg.images,
          pkg.itinerary, pkg.includes, pkg.excludes,
          pkg.rating, pkg.reviews, pkg.featured, pkg.active
        );
      }
      console.log('✅ Premium packages seeded successfully.');
    }

    // 4. Seed Blog Posts
    const blogCountRow = await db.prepare('SELECT COUNT(*) as count FROM blog_posts').get();
    const blogCount = blogCountRow ? parseInt(blogCountRow.count || '0') : 0;
    if (blogCount === 0) {
      console.log('🌱 Seeding default blog posts...');
      const initialBlogs = [
        {
          title: 'How to Apply for a Schengen Visa from the UK: The Ultimate 2026 Guide',
          slug: 'how-to-apply-schengen-visa-uk-2026',
          content: '<p>Applying for a Schengen visa as a non-UK passport holder residing in the United Kingdom can be a daunting process. In this guide, we break down the exact steps, documentation requirements, and interview preparation you need to guarantee a successful application.</p><h2>1. Understand Who Needs a Schengen Visa</h2><p>If you hold a passport from a country that does not have a visa-waiver agreement with the Schengen Area (such as India, Pakistan, Nigeria, or the Philippines) and you reside in the UK with a BRP or residency card, you must apply for a visa to travel to Europe.</p><h2>2. Choose the Correct Schengen Country</h2><p>You must apply at the embassy or visa centre of the country that is your primary destination (where you will spend the most nights) or the country you enter first if spending an equal number of nights in multiple countries.</p><h2>3. Essential Document Checklist</h2><ul><li><strong>Passport:</strong> Valid for at least 3 months after departure date, issued within the last 10 years, with 2 blank pages.</li><li><strong>UK Residency Permit (BRP):</strong> Must be valid for at least 3 months beyond your return from the Schengen area.</li><li><strong>Application Form:</strong> Completed and signed.</li><li><strong>Travel Insurance:</strong> Covering repatriation and medical expenses up to €30,000.</li><li><strong>Proof of Flight & Accommodation:</strong> Confirmed return flight bookings and hotel reservation/host invitation.</li><li><strong>Financial Sufficiency:</strong> Bank statements showing at least £60-£100 daily balance for the duration.</li><li><strong>Employment Proof:</strong> Letter from your employer (or university certificate if a student).</li></ul><p>If you need assistance gathering documentation, checking eligibility, or booking appointments, our visa experts at Borderless Trips are here to help you get approved seamlessly.</p>',
          excerpt: 'Everything you need to know about Schengen visa requirements, documentation checklists, processing times, and interview tips for UK residents.',
          cover_image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
          category: 'Visa Guide',
          published: 1
        },
        {
          title: '10 Most Spectacular Destinations in Europe to Visit in 2026',
          slug: 'top-european-destinations-2026',
          content: '<p>Europe is filled with incredible cultures, stunning coastlines, and historic cities. If you are planning your next holiday package with Borderless Trips, here are the top 10 places to add to your bucket list this year.</p><h2>1. Positano, Amalfi Coast, Italy</h2><p>Famous for its colorful cliffside houses cascading down to the Mediterranean, Positano is the crown jewel of southern Italy. Experience premium yachts, seaside dining, and stunning coastal hikes.</p><h2>2. Interlaken, Switzerland</h2><p>Nestled between Lake Thun and Lake Brienz, Interlaken is the adventure capital of the Alps. Perfect for hiking, paragliding, or riding the train to the famous Jungfraujoch.</p><h2>3. Barcelona, Spain</h2><p>Blending iconic Antoni Gaudi architecture, sunny sandy beaches, and a vibrant tapas culture, Barcelona is a city that never fails to charm its visitors.</p><h2>4. Santorini, Greece</h2><p>Known for its white-washed houses, blue domes, and world-class sunsets, Santorini is a dream destination for couples and luxury travelers alike.</p>',
          excerpt: 'Plan your ultimate European escape with our curated list of the top destinations in Europe, from Italian cliffside coasts to Swiss mountain summits.',
          cover_image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
          category: 'Travel Inspiration',
          published: 1
        }
      ];

      for (const blog of initialBlogs) {
        await db.prepare(`
          INSERT INTO blog_posts (title, slug, content, excerpt, cover_image, category, published)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(blog.title, blog.slug, blog.content, blog.excerpt, blog.cover_image, blog.category, blog.published);
      }
      console.log('✅ Blog posts seeded successfully.');
    }

    console.log('🎉 Database seeding complete.');
  } catch (error) {
    console.error('💥 Database seeding failed:', error.message);
  }
}

module.exports = { seedDatabase };
