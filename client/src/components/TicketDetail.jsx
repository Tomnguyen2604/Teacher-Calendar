import React, { useState } from 'react';
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';
import { useParams, useNavigate } from 'react-router-dom';
import './TicketDetail.css';

const TICKET_QUERY = gql`
  query GetTicket($id: ID!) {
    ticket(id: $id) {
      id
      title
      description
      status
      priority
      createdAt
      updatedAt
      creator {
        id
        name
        email
      }
      assignee {
        id
        name
        email
      }
      comments {
        id
        content
        createdAt
        user {
          id
          name
        }
      }
    }
  }
`;

const UPDATE_TICKET_MUTATION = gql`
  mutation UpdateTicket($id: ID!, $input: UpdateTicketInput!) {
    updateTicket(id: $id, input: $input) {
      id
      title
      description
      status
      priority
    }
  }
`;

const DELETE_TICKET_MUTATION = gql`
  mutation DeleteTicket($id: ID!) {
    deleteTicket(id: $id)
  }
`;

const ADD_COMMENT_MUTATION = gql`
  mutation AddComment($ticketId: ID!, $content: String!) {
    addComment(ticketId: $ticketId, content: $content) {
      id
      content
      createdAt
      user {
        id
        name
      }
    }
  }
`;

const COMMENT_ADDED_SUBSCRIPTION = gql`
  subscription OnCommentAdded($ticketId: ID!) {
    commentAdded(ticketId: $ticketId) {
      id
      content
      createdAt
      user {
        id
        name
      }
    }
  }
`;

const USERS_QUERY = gql`
  query GetUsers {
    users {
      id
      name
    }
  }
`;

function TicketDetail({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [formData, setFormData] = useState({});

  const { loading, error, data, refetch } = useQuery(TICKET_QUERY, {
    variables: { id },
  });

  const { data: usersData } = useQuery(USERS_QUERY);

  useSubscription(COMMENT_ADDED_SUBSCRIPTION, {
    variables: { ticketId: id },
    onData: () => {
      refetch();
    }
  });

  const [updateTicket, { loading: updateLoading }] = useMutation(UPDATE_TICKET_MUTATION, {
    onCompleted: () => {
      setIsEditing(false);
      refetch();
    }
  });

  const [deleteTicket] = useMutation(DELETE_TICKET_MUTATION, {
    onCompleted: () => {
      navigate('/');
    }
  });

  const [addComment, { loading: commentLoading }] = useMutation(ADD_COMMENT_MUTATION, {
    onCompleted: () => {
      setCommentContent('');
      refetch();
    }
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !data?.ticket) {
    return (
      <div className="error-container">
        <p>Error loading event: {error?.message || 'Event not found'}</p>
        <button className="btn btn-primary mt-lg" onClick={() => navigate('/')}>
          Back to Events
        </button>
      </div>
    );
  }

  const ticket = data.ticket;

  const handleEdit = () => {
    setFormData({
      title: ticket.title,
      description: ticket.description || '',
      status: ticket.status,
      priority: ticket.priority,
      assigneeId: ticket.assignee?.id || ''
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateTicket({
      variables: {
        id,
        input: {
          title: formData.title,
          description: formData.description || null,
          status: formData.status,
          priority: formData.priority,
          assigneeId: formData.assigneeId || null
        }
      }
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteTicket({ variables: { id } });
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (commentContent.trim()) {
      addComment({
        variables: {
          ticketId: id,
          content: commentContent
        }
      });
    }
  };

  return (
    <div className="ticket-detail-container">
      <div className="ticket-detail-header">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          ← Back to Events
        </button>
        <div className="ticket-actions">
          {!isEditing && (
            <>
              <button className="btn btn-primary" onClick={handleEdit}>
                Edit
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="ticket-detail-content">
        <div className="ticket-main glass">
          {isEditing ? (
            <div className="ticket-edit-form">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="5"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select
                  className="select"
                  value={formData.assigneeId}
                  onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                >
                  <option value="">-- Unassigned --</option>
                  {usersData?.users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={updateLoading}
                >
                  {updateLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="ticket-header-section">
                <h1 className="ticket-title">{ticket.title}</h1>
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
                <div className="ticket-description">
                  <h3>Description</h3>
                  <p>{ticket.description}</p>
                </div>
              )}

              <div className="ticket-info-grid">
                <div className="ticket-info-item">
                  <span className="ticket-info-label">Created By</span>
                  <span className="ticket-info-value">{ticket.creator.name}</span>
                  <span className="ticket-info-meta">{ticket.creator.email}</span>
                </div>

                {ticket.assignee && (
                  <div className="ticket-info-item">
                    <span className="ticket-info-label">Assigned To</span>
                    <span className="ticket-info-value">{ticket.assignee.name}</span>
                    <span className="ticket-info-meta">{ticket.assignee.email}</span>
                  </div>
                )}

                <div className="ticket-info-item">
                  <span className="ticket-info-label">Created</span>
                  <span className="ticket-info-value">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="ticket-info-item">
                  <span className="ticket-info-label">Last Updated</span>
                  <span className="ticket-info-value">
                    {new Date(ticket.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="ticket-comments glass">
          <h2 className="comments-title">Comments ({ticket.comments.length})</h2>

          <form onSubmit={handleAddComment} className="comment-form">
            <textarea
              className="textarea"
              placeholder="Add a comment..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              rows="3"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={commentLoading || !commentContent.trim()}
            >
              {commentLoading ? 'Adding...' : 'Add Comment'}
            </button>
          </form>

          <div className="comments-list">
            {ticket.comments.length === 0 ? (
              <p className="text-muted text-center">No comments yet</p>
            ) : (
              ticket.comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">{comment.user.name}</span>
                    <span className="comment-date">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="comment-content">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketDetail;
