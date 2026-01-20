import React, { useState } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import './TicketForm.css';

const CREATE_TICKET_MUTATION = gql`
  mutation CreateTicket(
    $title: String!
    $description: String
    $status: TicketStatus
    $priority: TicketPriority
    $assigneeId: ID
  ) {
    createTicket(
      title: $title
      description: $description
      status: $status
      priority: $priority
      assigneeId: $assigneeId
    ) {
      id
      title
      description
      status
      priority
    }
  }
`;

const USERS_QUERY = gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;

function TicketForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    assigneeId: ''
  });
  const [error, setError] = useState('');

  const { data: usersData } = useQuery(USERS_QUERY);

  const [createTicket, { loading }] = useMutation(CREATE_TICKET_MUTATION, {
    onCompleted: (data) => {
      navigate(`/ticket/${data.createTicket.id}`);
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const variables = {
      title: formData.title,
      description: formData.description || null,
      status: formData.status,
      priority: formData.priority,
      assigneeId: formData.assigneeId || null
    };

    createTicket({ variables });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="ticket-form-container">
      <div className="ticket-form-wrapper">
        <div className="ticket-form-header">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/')}
          >
            ← Back
          </button>
          <h1 className="page-title">Create New Event</h1>
          <p className="page-subtitle">Share a new calendar event with other teachers</p>
        </div>

        <form onSubmit={handleSubmit} className="ticket-form glass">
          <div className="form-group">
            <label className="form-label" htmlFor="title">Event Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              className="input"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Parent-Teacher Conference, Field Trip, Staff Meeting"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className="textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide details about the event..."
              rows="5"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                className="select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                className="select"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="assigneeId">Assign To (Optional)</label>
            <select
              id="assigneeId"
              name="assigneeId"
              className="select"
              value={formData.assigneeId}
              onChange={handleChange}
            >
              <option value="">-- Select a teacher --</option>
              {usersData?.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TicketForm;
