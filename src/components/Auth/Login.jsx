import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setAuthToken } from '../../utils/auth';
import '../../styles/Auth.css';
import { API_BASE_URL } from '../../config';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    if (error) setError('');
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: formData.email.trim(),
      password: formData.password
    });

    const { token, user } = response.data;

    if (!token) {
      throw new Error('No token received from server');
    }
    setAuthToken(token);

    onLogin(user, token);
    await new Promise(resolve => setTimeout(resolve, 500));

    navigate('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    sessionStorage.removeItem('mentormeet_token');

    setError(
      err.response?.data?.message || 
      'Login failed. Please check your credentials and try again.'
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>MentorMeet</h1>
          <p>Welcome back! Please sign in to your account.</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
          <a href="#forgot" className="forgot-link">Forgot password?</a>
        </div>
      </div>
    </div>
  );
};

export default Login;