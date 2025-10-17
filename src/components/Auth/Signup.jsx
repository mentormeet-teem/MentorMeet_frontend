import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Auth.css';

const Signup = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'tutor',
    phone: '',
    qualifications: '',
    subjects: '',
    institutionName: '',
    address: ''
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
    
  
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      
      const signupData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role
      };

      if (formData.role === 'tutor') {
        signupData.qualifications = formData.qualifications;
        signupData.subjects = formData.subjects;
      } else if (formData.role === 'institution') {
        signupData.institutionName = formData.institutionName;
        signupData.address = formData.address;
      }

      const response = await axios.post('http://localhost:5010/api/auth/signup', signupData);

      const { token, user } = response.data;
      
      
      onLogin(user, token);
      
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Signup failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSpecificFields = () => {
    switch (formData.role) {
      case 'tutor':
        return (
          <>
            <div className="form-group">
              <label htmlFor="qualifications">Qualifications</label>
              <input
                type="text"
                id="qualifications"
                name="qualifications"
                value={formData.qualifications}
                onChange={handleChange}
                placeholder="e.g., BSc in Mathematics, Teaching Certificate"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="subjects">Subjects</label>
              <input
                type="text"
                id="subjects"
                name="subjects"
                value={formData.subjects}
                onChange={handleChange}
                placeholder="e.g., Mathematics, Physics, Chemistry"
                disabled={loading}
              />
            </div>
          </>
        );
      case 'institution':
        return (
          <>
            <div className="form-group">
              <label htmlFor="institutionName">Institution Name</label>
              <input
                type="text"
                id="institutionName"
                name="institutionName"
                value={formData.institutionName}
                onChange={handleChange}
                placeholder="Enter institution name"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter institution address"
                disabled={loading}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>MentorMeet</h1>
          <p>Create Your Account </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>I am a</label>
            <div className="role-selection">
              {['tutor', 'institution'].map(role => (
                <label key={role} className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={formData.role === role}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="name-group">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last name"
                required
                disabled={loading}
              />
            </div>
          </div>

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
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+251 XXX XX XX XX"
              required
              disabled={loading}
            />
          </div>

          {renderRoleSpecificFields()}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password (min. 6 characters)"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
          <div className="terms">
            By creating an account, you agree to our <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;