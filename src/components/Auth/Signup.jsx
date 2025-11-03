import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Auth.css';

const Signup = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'tutor',
    
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    experience: '',
    hourlyRate: '',
    idType: '',
    cvFile: null,
    certificateFile: null,
    idFile: null,
    
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
    if (e.target.type === 'file') {
      setFormData({
        ...formData,
        [e.target.name]: e.target.files[0]
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
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

    if (formData.role === 'tutor') {
      if (!formData.cvFile) {
        setError('Please upload your CV');
        return;
      }
      if (!formData.idFile) {
        setError('Please upload your ID document');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      let endpoint = '';
      let requestData = {};

      if (formData.role === 'tutor') {
        endpoint = 'http://localhost:5010/api/auth/web/register/tutor';
        requestData = {
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
          idType: formData.idType || "National ID"
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

      } else if (formData.role === 'institution') {
        endpoint = 'http://localhost:5010/api/auth/web/register/institution';
        requestData = {
        email: formData.email.trim(),
        password: formData.password,
        ConfirmPassword: formData.confirmPassword,
        institutionName: formData.institutionName,
        institutionType: formData.institutionType || 'School',
        address: formData.address,
        contactPerson: formData.contactPerson,
        contactPersonPosition: formData.contactPersonPosition || 'Manager',
        website: formData.website || '',
        businessRegistrationNumber: formData.businessRegistrationNumber
      };

        if (requestData.website) {
          const w = requestData.website.trim();
          const hasScheme = /^(https?:\/\/|ftp:\/\/)/i.test(w);
          requestData.website = hasScheme ? w : `https://${w}`;
        } else {
          delete requestData.website;
        }

        const response = await axios.post(endpoint, requestData);
        const { token, user } = response.data;
        const adaptedUser = {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role.toLowerCase()
        };
        onLogin(adaptedUser, token);
      }
      
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
            placeholder={formData.role === 'tutor' ? 'you@example.com' : 'institution@institution.edu.et'}
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
            <option value="Other">Other</option>
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
            <option value="Teacher License">Teacher License</option>
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
  );const renderInstitutionFields = () => (
    <>
    <div className="form-row">
      <div className="form-group">
          <label htmlFor="institutionName">Institution Name *</label>
          <input
            type="text"
            id="institutionName"
            name="institutionName"
            value={formData.institutionName}
            onChange={handleChange}
            placeholder="institutionName"
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
              <option value="">Select Type</option>
              <option value="College">College</option>
              <option value="University">School</option>
              <option value="Other">Other</option>
            </select>
          </div>
          </div>
      
      
      <div className="form-group">
          <label htmlFor="phone">Phone Number *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+251 XXX XXX XXX"
            required
            disabled={loading}
          />
        </div>
  
        <div className="form-group">
          <label htmlFor="website">Institution Website</label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://www.institution.edu.et"
            disabled={loading}
          />
        </div>
  
        <div className="form-row">
         
          <div className="form-group">
            <label htmlFor="country">Country *</label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Select Country</option>
              <option value="Ethiopia">Ethiopia</option>
              <option value="Usa">USA</option>
              <option value="Canada">Canada</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="city">City *</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Addis Ababa"
              required
              disabled={loading}
            />
          </div>
  
        </div>
      <div className="form-row">
          <div className="form-group">
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
           <select
              id="contactPersonPosition"
              name="contactPersonPosition"
              value={formData.contactPersonPosition}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Select Position</option>
              <option value="Principal">Principal</option>
              <option value="Director">Director</option>
              <option value="Manager">Manager</option>
              <option value="Other">Other</option>
            </select>
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
         
          {formData.role === 'tutor' && renderTutorFields()}
          {formData.role === 'institution' && renderInstitutionFields()}
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