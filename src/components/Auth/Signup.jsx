import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Auth.css';

const Signup = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    // Base user fields
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    role: 'tutor',
    
    // Tutor specific
    qualifications: '',
    subjects: '',
    experience: '',
    certifications: '',
    hourlyRate: '',
    idNumber: '',
    idType: '',
    
    // Institution specific
    institutionName: '',
    institutionType: '',
    address: '',
    contactPerson: '',
    contactPersonPosition: '',
    website: '',
    businessRegistrationNumber: ''
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
    
    // Basic validation
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
      // Prepare base user data
      const baseUserData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender
      };

      let endpoint = '';
      let requestData = {};

      if (formData.role === 'tutor') {
        endpoint = 'http://localhost:5010/api/auth/web/register/tutor';
        requestData = {
          ...baseUserData,
          qualifications: formData.qualifications,
          subjects: formData.subjects,
          experience: formData.experience,
          certifications: formData.certifications || '', // Handle optional field
          hourlyRate: parseFloat(formData.hourlyRate) || 0,
          idNumber: formData.idNumber,
          idType: formData.idType
        };
      } else if (formData.role === 'institution') {
        endpoint = 'http://localhost:5010/api/auth/web/register/institution';
        requestData = {
          ...baseUserData,
          institutionName: formData.institutionName,
          institutionType: formData.institutionType,
          address: formData.address,
          contactPerson: formData.contactPerson,
          contactPersonPosition: formData.contactPersonPosition,
          website: formData.website || '', // Handle optional field
          businessRegistrationNumber: formData.businessRegistrationNumber
        };
      }

      const response = await axios.post(endpoint, requestData);
      
      // Handle different responses based on role
      if (formData.role === 'tutor') {
        // Tutors get verification message, not auto-login
        alert(response.data.message); // "Tutor registration submitted successfully. Please wait for admin verification."
        // Redirect to login
        window.location.href = '/login';
      } else {
        // Institutions get token and auto-login
        const { token, user } = response.data;
        
        // Convert her format to our format
        const adaptedUser = {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role.toLowerCase()
        };
        
        onLogin(adaptedUser, token);
      }
      
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTutorFields = () => (
    <>
      <div className="form-group">
        <label htmlFor="qualifications">Qualifications *</label>
        <input
          type="text"
          id="qualifications"
          name="qualifications"
          value={formData.qualifications}
          onChange={handleChange}
          placeholder="e.g., BSc in Mathematics, Teaching Certificate"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="subjects">Subjects *</label>
        <input
          type="text"
          id="subjects"
          name="subjects"
          value={formData.subjects}
          onChange={handleChange}
          placeholder="e.g., Mathematics, Physics, Chemistry"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="experience">Experience *</label>
        <input
          type="text"
          id="experience"
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          placeholder="e.g., 5 years teaching experience"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="certifications">Certifications</label>
        <input
          type="text"
          id="certifications"
          name="certifications"
          value={formData.certifications}
          onChange={handleChange}
          placeholder="e.g., TEFL Certified, Teaching License"
          disabled={loading}
        />
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
          <option value="Teacher License">Teacher License</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="idNumber">ID Number *</label>
        <input
          type="text"
          id="idNumber"
          name="idNumber"
          value={formData.idNumber}
          onChange={handleChange}
          placeholder="Enter your ID number"
          required
          disabled={loading}
        />
      </div>
    </>
  );

  const renderInstitutionFields = () => (
    <>
      <div className="form-group">
        <label htmlFor="institutionName">Institution Name *</label>
        <input
          type="text"
          id="institutionName"
          name="institutionName"
          value={formData.institutionName}
          onChange={handleChange}
          placeholder="Enter institution name"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="institutionType">Institution Type *</label>
        <select
          id="institutionType"
          name="institutionType"
          value={formData.institutionType}
          onChange={handleChange}
          required
          disabled={loading}
        >
          <option value="">Select Institution Type</option>
          <option value="School">School</option>
          <option value="College">College</option>
          <option value="University">University</option>
          <option value="Training Center">Training Center</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="address">Address *</label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Enter institution address"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="contactPerson">Contact Person *</label>
        <input
          type="text"
          id="contactPerson"
          name="contactPerson"
          value={formData.contactPerson}
          onChange={handleChange}
          placeholder="Full name of contact person"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="contactPersonPosition">Contact Person Position *</label>
        <input
          type="text"
          id="contactPersonPosition"
          name="contactPersonPosition"
          value={formData.contactPersonPosition}
          onChange={handleChange}
          placeholder="e.g., Principal, Director, Manager"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="website">Website</label>
        <input
          type="url"
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          placeholder="https://example.com"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="businessRegistrationNumber">Business Registration Number *</label>
        <input
          type="text"
          id="businessRegistrationNumber"
          name="businessRegistrationNumber"
          value={formData.businessRegistrationNumber}
          onChange={handleChange}
          placeholder="Enter business registration number"
          required
          disabled={loading}
        />
      </div>
    </>
  );

  const renderBaseUserFields = () => (
    <>
      <div className="name-group">
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
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="password">Password *</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="At least 6 characters with a number"
          required
          disabled={loading}
        />
        <small>Password must be at least 6 characters long and include a number</small>
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
    </>
  );

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>MentorMeet</h1>
          <p>Create your account to join our verified tutoring platform</p>
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

          {renderBaseUserFields()}
          {formData.role === 'tutor' && renderTutorFields()}
          {formData.role === 'institution' && renderInstitutionFields()}

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