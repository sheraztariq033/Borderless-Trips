const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, adminOnly } = require('../middleware/auth');

// Slugify helper
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

// GET /api/blog - get all published posts
router.get('/', async (req, res) => {
  try {
    const posts = await db.prepare('SELECT id, title, slug, excerpt, cover_image, author, category, published, created_at FROM blog_posts WHERE published = 1 ORDER BY created_at DESC').all();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to fetch blog posts.' });
  }
});

// GET /api/blog/admin - get all posts including drafts (Admin Only)
router.get('/admin', authenticate, adminOnly, async (req, res) => {
  try {
    const posts = await db.prepare('SELECT * FROM blog_posts ORDER BY created_at DESC').all();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to fetch admin blog posts.' });
  }
});

// GET /api/blog/:slug - get post by slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const post = await db.prepare('SELECT * FROM blog_posts WHERE slug = ?').get(slug);
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found.' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to retrieve blog post.' });
  }
});

// POST /api/blog - Create post (Admin Only)
router.post('/', authenticate, adminOnly, async (req, res) => {
  const { title, content, excerpt, cover_image, category, published } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  const slug = slugify(title) + '-' + Date.now().toString().slice(-4);

  try {
    const result = await db.prepare(`
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
router.put('/:id', authenticate, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { title, content, excerpt, cover_image, category, published } = req.body;

  try {
    const post = await db.prepare('SELECT id FROM blog_posts WHERE id = ?').get(id);
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found.' });
    }

    await db.prepare(`
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
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    const post = await db.prepare('SELECT id FROM blog_posts WHERE id = ?').get(id);
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found.' });
    }

    await db.prepare('DELETE FROM blog_posts WHERE id = ?').run(id);
    res.json({ message: 'Blog post deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to delete blog post.' });
  }
});

module.exports = router;
