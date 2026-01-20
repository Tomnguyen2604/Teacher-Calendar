import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String!
    role: String!
    createdAt: String!
  }

  type Ticket {
    id: ID!
    title: String!
    description: String
    status: TicketStatus!
    priority: TicketPriority!
    creator: User!
    assignee: User
    comments: [Comment!]!
    createdAt: String!
    updatedAt: String!
  }

  type Comment {
    id: ID!
    content: String!
    user: User!
    ticket: Ticket!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  enum TicketStatus {
    OPEN
    IN_PROGRESS
    RESOLVED
    CLOSED
  }

  enum TicketPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  input TicketFilterInput {
    status: TicketStatus
    priority: TicketPriority
    assigneeId: ID
    creatorId: ID
  }

  input UpdateTicketInput {
    title: String
    description: String
    status: TicketStatus
    priority: TicketPriority
    assigneeId: ID
  }

  type Query {
    # Get current user
    me: User

    # Get all users
    users: [User!]!

    # Get all tickets with optional filters
    tickets(filter: TicketFilterInput): [Ticket!]!

    # Get a single ticket by ID
    ticket(id: ID!): Ticket

    # Search tickets by title or description
    searchTickets(searchTerm: String!): [Ticket!]!

    # Get comments for a ticket
    comments(ticketId: ID!): [Comment!]!
  }

  type Mutation {
    # Authentication
    register(email: String!, password: String!, name: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    # Ticket operations
    createTicket(
      title: String!
      description: String
      status: TicketStatus
      priority: TicketPriority
      assigneeId: ID
    ): Ticket!

    updateTicket(id: ID!, input: UpdateTicketInput!): Ticket!

    deleteTicket(id: ID!): Boolean!

    # Comment operations
    addComment(ticketId: ID!, content: String!): Comment!

    deleteComment(id: ID!): Boolean!
  }

  type Subscription {
    # Subscribe to ticket updates
    ticketUpdated(ticketId: ID): Ticket!

    # Subscribe to new tickets
    ticketCreated: Ticket!

    # Subscribe to new comments on a ticket
    commentAdded(ticketId: ID!): Comment!
  }
`;
