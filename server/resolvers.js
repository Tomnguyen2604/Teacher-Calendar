import { PubSub } from 'graphql-subscriptions';
import { userDb, ticketDb, commentDb } from './database.js';
import { hashPassword, comparePassword, generateToken, requireAuth } from './auth.js';

const pubsub = new PubSub();

// Subscription event names
const TICKET_UPDATED = 'TICKET_UPDATED';
const TICKET_CREATED = 'TICKET_CREATED';
const COMMENT_ADDED = 'COMMENT_ADDED';

export const resolvers = {
  Query: {
    me: (_, __, { user }) => {
      requireAuth(user);
      return userDb.findById(user.userId);
    },

    users: (_, __, { user }) => {
      requireAuth(user);
      return userDb.getAll();
    },

    tickets: (_, { filter }, { user }) => {
      requireAuth(user);
      return ticketDb.getAll(filter || {});
    },

    ticket: (_, { id }, { user }) => {
      requireAuth(user);
      return ticketDb.findById(id);
    },

    searchTickets: (_, { searchTerm }, { user }) => {
      requireAuth(user);
      return ticketDb.search(searchTerm);
    },

    comments: (_, { ticketId }, { user }) => {
      requireAuth(user);
      return commentDb.getByTicketId(ticketId);
    }
  },

  Mutation: {
    register: async (_, { email, password, name }) => {
      // Check if user already exists
      const existingUser = userDb.findByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const userId = userDb.create(email, hashedPassword, name);
      const user = userDb.findById(userId);

      // Generate token
      const token = generateToken(user);

      return { token, user };
    },

    login: async (_, { email, password }) => {
      // Find user
      const user = userDb.findByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const valid = await comparePassword(password, user.password);
      if (!valid) {
        throw new Error('Invalid email or password');
      }

      // Generate token
      const token = generateToken(user);

      return { token, user };
    },

    createTicket: (_, { title, description, status, priority, assigneeId }, { user }) => {
      requireAuth(user);

      const ticketId = ticketDb.create(
        title,
        description || '',
        status || 'OPEN',
        priority || 'MEDIUM',
        user.userId,
        assigneeId || null
      );

      const ticket = ticketDb.findById(ticketId);

      // Publish subscription event
      pubsub.publish(TICKET_CREATED, { ticketCreated: ticket });

      return ticket;
    },

    updateTicket: (_, { id, input }, { user }) => {
      requireAuth(user);

      const ticket = ticketDb.findById(id);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const updatedTicket = ticketDb.update(id, input);

      // Publish subscription event
      pubsub.publish(TICKET_UPDATED, { 
        ticketUpdated: updatedTicket,
        ticketId: id 
      });

      return updatedTicket;
    },

    deleteTicket: (_, { id }, { user }) => {
      requireAuth(user);

      const ticket = ticketDb.findById(id);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Only creator or admin can delete
      if (ticket.creator_id !== user.userId && user.role !== 'admin') {
        throw new Error('Not authorized to delete this ticket');
      }

      return ticketDb.delete(id);
    },

    addComment: (_, { ticketId, content }, { user }) => {
      requireAuth(user);

      const ticket = ticketDb.findById(ticketId);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const commentId = commentDb.create(ticketId, user.userId, content);
      const comment = commentDb.findById(commentId);

      // Publish subscription event
      pubsub.publish(COMMENT_ADDED, { 
        commentAdded: comment,
        ticketId 
      });

      return comment;
    },

    deleteComment: (_, { id }, { user }) => {
      requireAuth(user);

      const comment = commentDb.findById(id);
      if (!comment) {
        throw new Error('Comment not found');
      }

      // Only comment creator or admin can delete
      if (comment.user_id !== user.userId && user.role !== 'admin') {
        throw new Error('Not authorized to delete this comment');
      }

      return commentDb.delete(id);
    }
  },

  Subscription: {
    ticketUpdated: {
      subscribe: (_, { ticketId }) => {
        if (ticketId) {
          return pubsub.asyncIterator([TICKET_UPDATED]);
        }
        return pubsub.asyncIterator([TICKET_UPDATED]);
      },
      resolve: (payload, { ticketId }) => {
        if (ticketId && payload.ticketId !== parseInt(ticketId)) {
          return null;
        }
        return payload.ticketUpdated;
      }
    },

    ticketCreated: {
      subscribe: () => pubsub.asyncIterator([TICKET_CREATED])
    },

    commentAdded: {
      subscribe: (_, { ticketId }) => {
        return pubsub.asyncIterator([COMMENT_ADDED]);
      },
      resolve: (payload, { ticketId }) => {
        if (payload.ticketId !== parseInt(ticketId)) {
          return null;
        }
        return payload.commentAdded;
      }
    }
  },

  // Field resolvers
  Ticket: {
    creator: (ticket) => {
      return userDb.findById(ticket.creator_id);
    },

    assignee: (ticket) => {
      return ticket.assignee_id ? userDb.findById(ticket.assignee_id) : null;
    },

    comments: (ticket) => {
      return commentDb.getByTicketId(ticket.id);
    },

    createdAt: (ticket) => ticket.created_at,
    updatedAt: (ticket) => ticket.updated_at
  },

  Comment: {
    user: (comment) => {
      return userDb.findById(comment.user_id);
    },

    ticket: (comment) => {
      return ticketDb.findById(comment.ticket_id);
    },

    createdAt: (comment) => comment.created_at
  },

  User: {
    createdAt: (user) => user.created_at
  }
};

export { pubsub };
