import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ApolloProvider, useQuery, gql } from '@apollo/client';
import client from './apolloClient';
import Login from './components/Login';
import TicketList from './components/TicketList';
import TicketForm from './components/TicketForm';
import TicketDetail from './components/TicketDetail';
import CalendarView from './components/CalendarView';
import './App.css';

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
      role
    }
  }
`;

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const { data, error } = useQuery(ME_QUERY, {
    skip: !localStorage.getItem('token'),
    onCompleted: (data) => {
      setUser(data.me);
      setLoading(false);
    },
    onError: () => {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  });

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <nav className="navbar glass">
        <div className="navbar-content">
          <div className="navbar-brand">
            <h2 className="navbar-title">School Calendar Exchange</h2>
            <span className="navbar-subtitle">Teacher Portal</span>
          </div>
          <div className="navbar-links">
            <a href="/" className="nav-link">📋 List View</a>
            <a href="/calendar" className="nav-link">📅 Calendar</a>
          </div>
          <div className="navbar-user">
            <span className="user-name">{user.name}</span>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<TicketList currentUser={user} />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/create" element={<TicketForm />} />
          <Route path="/ticket/:id" element={<TicketDetail currentUser={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <Router>
        <AppContent />
      </Router>
    </ApolloProvider>
  );
}

export default App;
