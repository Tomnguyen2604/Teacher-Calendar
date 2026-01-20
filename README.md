# School Calendar Exchange

A modern GraphQL-based application for teachers to coordinate and share school calendar events.

## Features

- 🔐 **Authentication**: Secure JWT-based authentication for teachers
- 📅 **Event Management**: Create, read, update, and delete calendar events
- 💬 **Comments**: Add comments and discussions to events
- 🔔 **Real-time Updates**: Live updates using GraphQL subscriptions
- 🎨 **Modern UI**: Beautiful dark theme with glassmorphism effects
- 🔍 **Search & Filter**: Find events by status, priority, or search term
- 👥 **Teacher Collaboration**: Assign events to specific teachers

## Tech Stack

### Backend
- Node.js with Express
- Apollo Server (GraphQL)
- SQLite database
- JWT authentication
- GraphQL subscriptions with WebSockets

### Frontend
- React 18
- Apollo Client
- React Router
- Vite
- Modern CSS with custom design system

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. **Clone the repository**
```bash
cd /Users/john/Desktop/project/GraphQL
```

2. **Install backend dependencies**
```bash
cd server
npm install
```

3. **Install frontend dependencies**
```bash
cd ../client
npm install
```

### Running the Application

1. **Start the backend server** (in the `server` directory):
```bash
npm start
```
The GraphQL server will start at `http://localhost:4000/graphql`

2. **Start the frontend** (in the `client` directory):
```bash
npm run dev
```
The React app will start at `http://localhost:3000`

3. **Access the application**
Open your browser and navigate to `http://localhost:3000`

## Usage

### First Time Setup

1. **Register an account**: Click "Sign Up" and create a teacher account
2. **Create events**: Click "Create Event" to add new calendar events
3. **Manage events**: View, edit, or delete events from the dashboard
4. **Collaborate**: Assign events to other teachers and add comments

### GraphQL Playground

You can explore the GraphQL API directly at `http://localhost:4000/graphql`

Example queries:

```graphql
# Get all events
query {
  tickets {
    id
    title
    status
    priority
    creator {
      name
    }
  }
}

# Create a new event
mutation {
  createTicket(
    title: "Parent-Teacher Conference"
    description: "Annual conference with parents"
    priority: HIGH
  ) {
    id
    title
  }
}
```

## Project Structure

```
GraphQL/
├── server/
│   ├── server.js          # Main server file
│   ├── schema.js          # GraphQL schema definitions
│   ├── resolvers.js       # GraphQL resolvers
│   ├── database.js        # Database setup and operations
│   ├── auth.js            # Authentication utilities
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.jsx        # Main app component
│   │   ├── apolloClient.js # Apollo Client setup
│   │   └── index.css      # Design system
│   ├── index.html
│   └── package.json
└── README.md
```

## Environment Variables

The server uses the following environment variables (see `.env.example`):

- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 4000)
- `DATABASE_PATH`: Path to SQLite database file

## License

MIT
