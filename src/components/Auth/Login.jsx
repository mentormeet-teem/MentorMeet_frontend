import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState({ success: false, message: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    if (error) setError('');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetStatus({ success: false, message: 'Please enter your email address' });
      return;
    }

    setLoading(true);
    setResetStatus({ success: false, message: '' });

    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
        email: resetEmail.trim()
      });
      
      setResetStatus({
        success: true,
        message: 'Password reset link has been sent to your email. Please check your inbox.'
      });
      setResetEmail('');
    } catch (err) {
      console.error('Password reset error:', err);
      setResetStatus({
        success: false,
        message: err.response?.data?.message || 'Failed to send reset link. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleForgotPassword = (e) => {
    e.preventDefault();
    setShowForgotPassword(!showForgotPassword);
    setResetStatus({ success: false, message: '' });
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
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                disabled={loading}
                className="password-input"
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                disabled={loading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {!showForgotPassword ? (
          <div className="auth-footer">
            <p>
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
            <a href="#forgot" className="forgot-link" onClick={toggleForgotPassword}>
              Forgot password?
            </a>
          </div>
        ) : (
          <div className="forgot-password-form">
            <h3>Reset Password</h3>
            <p>Enter your email to recive a link.</p>
            
            {resetStatus.message && (
              <div className={`reset-message ${resetStatus.success ? 'success' : 'error'}`}>
                {resetStatus.message}
              </div>
            )}
            
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label htmlFor="reset-email">Email Address</label>
                <input
                  type="email"
                  id="reset-email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="auth-button secondary"
                  onClick={toggleForgotPassword}
                  disabled={loading}
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  className="auth-button"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;