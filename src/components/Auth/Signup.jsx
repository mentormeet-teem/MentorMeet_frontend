import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Auth.css';
import { API_BASE_URL } from '../../config';

const Signup = ({ onLogin }) => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = sessionStorage.getItem('mentormeet_token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    experience: '',
    hourlyRate: '500',
    idType: 'National ID',
    cvFile: null,
    certificateFile: null,
    idFile: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else if (name === 'PhoneNumber') {
      let digits = value.replace(/\D/g, '');
      
      let formattedPhone;
      if (digits.startsWith('251')) {
        formattedPhone = `+${digits}`;
      } else if (digits.startsWith('0') && digits.length > 1) {
        formattedPhone = `+251${digits.substring(1)}`;
      } else if (digits.startsWith('+')) {
        formattedPhone = value;
      } else {
        formattedPhone = `+251${digits}`;
      }
      
      formattedPhone = formattedPhone.substring(0, 20);
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
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

    if (!formData.cvFile) {
      setError('Please upload your CV');
      return;
    }

    if (!formData.idFile) {
      setError('Please upload your ID document');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = `${API_BASE_URL}/api/auth/web/register/tutor`;
      const requestData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        ConfirmPassword: formData.confirmPassword,
        dateOfBirth: formData.dateOfBirth || '2000-01-01',
        gender: formData.gender || 'Other',
        qualifications: "See uploaded CV",
        subjects: "See uploaded CV",
        YearofExperience: formData.experience ? parseInt(formData.experience) : 1,
        certifications: formData.certificateFile ? "See uploaded certificates" : "None",
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : 500,
        idNumber: "See uploaded ID",
        idType: formData.idType
      };

      const formDataToSend = new FormData();
      Object.keys(requestData).forEach(key => {
        formDataToSend.append(key, requestData[key]);
      });

      formDataToSend.append('ResumeFile', formData.cvFile);
      if (formData.certificateFile) {
        formDataToSend.append('CertificateFile', formData.certificateFile);
      }
      formDataToSend.append('IdDocumentFile', formData.idFile);

      const response = await axios.post(endpoint, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert(response.data.message || 'Tutor registration submitted! Please wait for admin verification.');
      window.location.href = '/login';
      
    } catch (err) {
      console.log('Full error:', err);
      console.log('Error response:', err.response?.data);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data) {
        setError('Registration error: ' + JSON.stringify(err.response.data));
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  const renderCommonFields = () => (
    <>
      <div className="form-section">
        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
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
  
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
              disabled={loading}
            />
          </div>
  
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
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
        </div>
        <small>Password must be at least 6 characters long and include a number</small>
      </div>
    </>
  );
  const renderTutorFields = () => (
    <>
     <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">First Name *</label>
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
          <label htmlFor="lastName">Last Name *</label>
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

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dateOfBirth">Date of Birth *</label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="gender">Gender *</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            disabled={loading}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>
    
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="experience">Years of Experience *</label>
          <select
            id="experience"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            required
            disabled={loading}
          >
            <option value="">Select Experience</option>
            <option value="0">No experience (Just starting)</option>
            <option value="1">1-2 years</option>
            <option value="3">3-5 years</option>
            <option value="6">6-10 years</option>
            <option value="11">10+ years</option>
          </select>
        </div>
  
        <div className="form-group">
          <label htmlFor="hourlyRate">Hourly Rate (ETB) *</label>
          <input
            type="number"
            id="hourlyRate"
            name="hourlyRate"
            value={formData.hourlyRate}
            onChange={handleChange}
            placeholder="500"
            min="0"
            max="1000"
            step="50"
            required
            disabled={loading}
          />
        </div>
      </div>
  
      <div className="form-group">
        <label htmlFor="cvFile">CV/Resume *</label>
        <input
          type="file"
          id="cvFile"
          name="cvFile"
          onChange={handleChange}
          accept=".pdf,.doc,.docx"
          required
          disabled={loading}
        />
        <small>Upload your CV (PDF, DOC, DOCX) - includes qualifications and subjects</small>
      </div>
  
      <div className="form-group">
        <label htmlFor="certificateFile">Certifications (Optional)</label>
        <input
          type="file"
          id="certificateFile"
          name="certificateFile"
          onChange={handleChange}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          disabled={loading}
        />
        <small>Upload teaching certificates or qualifications</small>
      </div>
  
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="idType">ID Type *</label>
          <select
            id="idType"
            name="idType"
            value={formData.idType}
            onChange={handleChange}
            required
            disabled={loading}
          >
            <option value="">Select ID Type</option>
            <option value="Passport">Passport</option>
            <option value="Driving License">Driving License</option>
            <option value="National ID">National ID</option>
          </select>
        </div>
  
        <div className="form-group">
          <label htmlFor="idFile">ID Document *</label>
          <input
            type="file"
            id="idFile"
            name="idFile"
            onChange={handleChange}
            accept=".pdf,.jpg,.jpeg,.png"
            required
            disabled={loading}
          />
        </div>
      </div>
    </>
  );
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>MentorMeet</h1>
          <p>Create new account</p>
        </div>
  
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
  
        <form onSubmit={handleSubmit} className="auth-form" encType="multipart/form-data">
          {renderTutorFields()}
          {renderCommonFields()}
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
          
        </div>
      </div>
    </div>
  );
};

export default Signup;