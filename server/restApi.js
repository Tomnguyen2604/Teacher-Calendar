import express from 'express';
import { userDb, ticketDb, commentDb } from './database.js';
import { hashPassword, comparePassword, generateToken, verifyToken } from './auth.js';

const router = express.Router();

// Middleware to verify JWT token for protected routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
};

// ============================================
// Authentication Routes
// ============================================

// POST /api/auth/register - Register a new user
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = userDb.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const userId = userDb.create(email, hashedPassword, name);
    const user = userDb.findById(userId);

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login - Login user
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = userDb.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me - Get current user
router.get('/auth/me', authenticateToken, (req, res) => {
  try {
    const user = userDb.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// User Routes
// ============================================

// GET /api/users - Get all users
router.get('/users', authenticateToken, (req, res) => {
  try {
    const users = userDb.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/users/:id', authenticateToken, (req, res) => {
  try {
    const user = userDb.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Ticket Routes
// ============================================

// GET /api/tickets - Get all tickets with optional filters
router.get('/tickets', authenticateToken, (req, res) => {
  try {
    const { status, priority, assigneeId, creatorId, search } = req.query;
    
    let tickets;
    if (search) {
      tickets = ticketDb.search(search);
    } else {
      const filter = {};
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (assigneeId) filter.assigneeId = assigneeId;
      if (creatorId) filter.creatorId = creatorId;
      
      tickets = ticketDb.getAll(filter);
    }

    // Enrich tickets with creator and assignee data
    const enrichedTickets = tickets.map(ticket => ({
      ...ticket,
      creator: userDb.findById(ticket.creator_id),
      assignee: ticket.assignee_id ? userDb.findById(ticket.assignee_id) : null,
      comments: commentDb.getByTicketId(ticket.id)
    }));

    res.json(enrichedTickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tickets/:id - Get ticket by ID
router.get('/tickets/:id', authenticateToken, (req, res) => {
  try {
    const ticket = ticketDb.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Enrich with related data
    const enrichedTicket = {
      ...ticket,
      creator: userDb.findById(ticket.creator_id),
      assignee: ticket.assignee_id ? userDb.findById(ticket.assignee_id) : null,
      comments: commentDb.getByTicketId(ticket.id).map(comment => ({
        ...comment,
        user: userDb.findById(comment.user_id)
      }))
    };

    res.json(enrichedTicket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tickets - Create a new ticket
router.post('/tickets', authenticateToken, (req, res) => {
  try {
    const { title, description, status, priority, assigneeId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const ticketId = ticketDb.create(
      title,
      description || '',
      status || 'OPEN',
      priority || 'MEDIUM',
      req.user.userId,
      assigneeId || null
    );

    const ticket = ticketDb.findById(ticketId);
    const enrichedTicket = {
      ...ticket,
      creator: userDb.findById(ticket.creator_id),
      assignee: ticket.assignee_id ? userDb.findById(ticket.assignee_id) : null
    };

    res.status(201).json(enrichedTicket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/tickets/:id - Update a ticket
router.put('/tickets/:id', authenticateToken, (req, res) => {
  try {
    const ticket = ticketDb.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const { title, description, status, priority, assigneeId } = req.body;
    const updates = {};
    
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (assigneeId !== undefined) updates.assigneeId = assigneeId;

    const updatedTicket = ticketDb.update(req.params.id, updates);
    const enrichedTicket = {
      ...updatedTicket,
      creator: userDb.findById(updatedTicket.creator_id),
      assignee: updatedTicket.assignee_id ? userDb.findById(updatedTicket.assignee_id) : null
    };

    res.json(enrichedTicket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/tickets/:id - Delete a ticket
router.delete('/tickets/:id', authenticateToken, (req, res) => {
  try {
    const ticket = ticketDb.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Only creator or admin can delete
    if (ticket.creator_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this ticket' });
    }

    const deleted = ticketDb.delete(req.params.id);
    res.json({ success: deleted, message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Comment Routes
// ============================================

// GET /api/tickets/:ticketId/comments - Get comments for a ticket
router.get('/tickets/:ticketId/comments', authenticateToken, (req, res) => {
  try {
    const comments = commentDb.getByTicketId(req.params.ticketId);
    const enrichedComments = comments.map(comment => ({
      ...comment,
      user: userDb.findById(comment.user_id)
    }));
    res.json(enrichedComments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tickets/:ticketId/comments - Add a comment to a ticket
router.post('/tickets/:ticketId/comments', authenticateToken, (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const ticket = ticketDb.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const commentId = commentDb.create(req.params.ticketId, req.user.userId, content);
    const comment = commentDb.findById(commentId);
    const enrichedComment = {
      ...comment,
      user: userDb.findById(comment.user_id)
    };

    res.status(201).json(enrichedComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/comments/:id - Delete a comment
router.delete('/comments/:id', authenticateToken, (req, res) => {
  try {
    const comment = commentDb.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only comment creator or admin can delete
    if (comment.user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    const deleted = commentDb.delete(req.params.id);
    res.json({ success: deleted, message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// Health Check
// ============================================

// GET /api/health - Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'School Calendar Exchange API'
  });
});

export default router;
