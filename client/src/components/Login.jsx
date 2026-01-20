import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import './Login.css';

const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $password: String!, $name: String!) {
    register(email: $email, password: $password, name: $name) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
      }
    }
  }
`;

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');

  const [register, { loading: registerLoading }] = useMutation(REGISTER_MUTATION, {
    onCompleted: (data) => {
      localStorage.setItem('token', data.register.token);
      onLogin(data.register.user);
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  const [login, { loading: loginLoading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      localStorage.setItem('token', data.login.token);
      onLogin(data.login.user);
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      login({ variables: { email: formData.email, password: formData.password } });
    } else {
      register({ 
        variables: { 
          email: formData.email, 
          password: formData.password,
          name: formData.name 
        } 
      });
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const loading = registerLoading || loginLoading;

  return (
    <div className="login-container">
      <div className="login-background"></div>
      <div className="login-card glass">
        <div className="login-header">
          <h1 className="login-title">School Calendar Exchange</h1>
          <p className="login-subtitle">Teacher-to-Teacher Event Coordination</p>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
          >
            Sign In
          </button>
          <button
            className={`login-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                name="name"
                className="input"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              className="input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="teacher@school.edu"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              className="input"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              minLength="6"
            />
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-sm">
                <div className="spinner-small"></div>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="text-muted">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="login-switch-btn"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
