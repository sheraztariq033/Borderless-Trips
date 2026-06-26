const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, adminOnly } = require('../middleware/auth');

// Helper to make slug
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
}

// Seed blog posts if empty
const blogCount = db.prepare('SELECT COUNT(*) as count FROM blog_posts').get().count;
if (blogCount === 0) {
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

  const stmt = db.prepare(`
    INSERT INTO blog_posts (title, slug, content, excerpt, cover_image, category, published)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const blog of initialBlogs) {
    stmt.run(blog.title, blog.slug, blog.content, blog.excerpt, blog.cover_image, blog.category, blog.published);
  }
  console.log('✅ Blog posts seeded.');
}

// GET /api/blog - get all published posts
router.get('/', (req, res) => {
  try {
    const posts = db.prepare('SELECT id, title, slug, excerpt, cover_image, author, category, published, created_at FROM blog_posts WHERE published = 1 ORDER BY created_at DESC').all();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to fetch blog posts.' });
  }
});

// GET /api/blog/admin - get all posts including drafts (Admin Only)
router.get('/admin', authenticate, adminOnly, (req, res) => {
  try {
    const posts = db.prepare('SELECT * FROM blog_posts ORDER BY created_at DESC').all();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to fetch admin blog posts.' });
  }
});

// GET /api/blog/:slug - get post by slug
router.get('/:slug', (req, res) => {
  const { slug } = req.params;
  try {
    const post = db.prepare('SELECT * FROM blog_posts WHERE slug = ?').get(slug);
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found.' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to retrieve blog post.' });
  }
});

// POST /api/blog - Create post (Admin Only)
router.post('/', authenticate, adminOnly, (req, res) => {
  const { title, content, excerpt, cover_image, category, published } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  const slug = slugify(title) + '-' + Date.now().toString().slice(-4);

  try {
    const result = db.prepare(`
      INSERT INTO blog_posts (title, slug, content, excerpt, cover_image, category, published)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      slug,
      content,
      excerpt || '',
      cover_image || '',
      category || 'Travel Guide',
      published ? 1 : 0
    );

    res.status(201).json({ message: 'Blog post created successfully.', postId: result.lastInsertRowid, slug });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to create blog post.' });
  }
});

// PUT /api/blog/:id - Update post (Admin Only)
router.put('/:id', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  const { title, content, excerpt, cover_image, category, published } = req.body;

  try {
    const post = db.prepare('SELECT id FROM blog_posts WHERE id = ?').get(id);
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found.' });
    }

    db.prepare(`
      UPDATE blog_posts SET
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        excerpt = COALESCE(?, excerpt),
        cover_image = COALESCE(?, cover_image),
        category = COALESCE(?, category),
        published = COALESCE(?, published)
      WHERE id = ?
    `).run(
      title,
      content,
      excerpt,
      cover_image,
      category,
      published !== undefined ? (published ? 1 : 0) : null,
      id
    );

    res.json({ message: 'Blog post updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to update blog post.' });
  }
});

// DELETE /api/blog/:id - Delete post (Admin Only)
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  try {
    const post = db.prepare('SELECT id FROM blog_posts WHERE id = ?').get(id);
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found.' });
    }

    db.prepare('DELETE FROM blog_posts WHERE id = ?').run(id);
    res.json({ message: 'Blog post deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to delete blog post.' });
  }
});

module.exports = router;
