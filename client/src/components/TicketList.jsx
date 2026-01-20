import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import './TicketList.css';

const TICKETS_QUERY = gql`
  query GetTickets($filter: TicketFilterInput) {
    tickets(filter: $filter) {
      id
      title
      description
      status
      priority
      createdAt
      creator {
        id
        name
      }
      assignee {
        id
        name
      }
    }
  }
`;

const TICKET_CREATED_SUBSCRIPTION = gql`
  subscription OnTicketCreated {
    ticketCreated {
      id
      title
      description
      status
      priority
      createdAt
      creator {
        id
        name
      }
      assignee {
        id
        name
      }
    }
  }
`;

const TICKET_UPDATED_SUBSCRIPTION = gql`
  subscription OnTicketUpdated {
    ticketUpdated {
      id
      title
      description
      status
      priority
      createdAt
      creator {
        id
        name
      }
      assignee {
        id
        name
      }
    }
  }
`;

function TicketList({ currentUser }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const { loading, error, data, refetch } = useQuery(TICKETS_QUERY, {
    variables: { filter },
  });

  // Subscribe to new tickets
  useSubscription(TICKET_CREATED_SUBSCRIPTION, {
    onData: () => {
      refetch();
    }
  });

  // Subscribe to ticket updates
  useSubscription(TICKET_UPDATED_SUBSCRIPTION, {
    onData: () => {
      refetch();
    }
  });

  const handleFilterChange = (key, value) => {
    setFilter(prev => {
      if (value === '') {
        const newFilter = { ...prev };
        delete newFilter[key];
        return newFilter;
      }
      return { ...prev, [key]: value };
    });
  };

  const filteredTickets = data?.tickets?.filter(ticket => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      ticket.title.toLowerCase().includes(search) ||
      ticket.description?.toLowerCase().includes(search) ||
      ticket.creator.name.toLowerCase().includes(search)
    );
  }) || [];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error loading events: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="ticket-list-container">
      <div className="ticket-list-header">
        <div>
          <h1 className="page-title">School Calendar Events</h1>
          <p className="page-subtitle">Coordinate and share events with fellow teachers</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/create')}
        >
          <span className="btn-icon">+</span>
          Create Event
        </button>
      </div>

      <div className="ticket-filters glass">
        <input
          type="text"
          className="input search-input"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="select"
          value={filter.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          className="select"
          value={filter.priority || ''}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      <div className="tickets-grid">
        {filteredTickets.length === 0 ? (
          <div className="empty-state glass">
            <h3>No events found</h3>
            <p>Create your first event to get started!</p>
            <button 
              className="btn btn-primary mt-lg"
              onClick={() => navigate('/create')}
            >
              Create Event
            </button>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="ticket-card glass"
              onClick={() => navigate(`/ticket/${ticket.id}`)}
            >
              <div className="ticket-card-header">
                <h3 className="ticket-card-title">{ticket.title}</h3>
                <div className="ticket-badges">
                  <span className={`badge badge-${ticket.status.toLowerCase().replace('_', '-')}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span className={`badge badge-${ticket.priority.toLowerCase()}`}>
                    {ticket.priority}
                  </span>
                </div>
              </div>

              {ticket.description && (
                <p className="ticket-card-description">{ticket.description}</p>
              )}

              <div className="ticket-card-footer">
                <div className="ticket-meta">
                  <span className="ticket-meta-item">
                    <span className="ticket-meta-label">Created by:</span>
                    <span className="ticket-meta-value">{ticket.creator.name}</span>
                  </span>
                  {ticket.assignee && (
                    <span className="ticket-meta-item">
                      <span className="ticket-meta-label">Assigned to:</span>
                      <span className="ticket-meta-value">{ticket.assignee.name}</span>
                    </span>
                  )}
                </div>
                <span className="ticket-date">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TicketList;
