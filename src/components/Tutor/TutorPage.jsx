import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { getAuthToken } from '../../utils/auth';
import '../../styles/TutorPage.css';

const TutorPage = () => {
  const [view, setView] = useState('list');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
  title: '',
  description: '',
  file: null,
  isPublic: true,
  type: 'StudyMaterial',
  visibility: 'BookingsOnly',  
  difficulty: 'Beginner',
  access: 'Public',
  gradeLevels: [], 
  allowedStudentEmails: [],
  isActive: true  
});
  
  const materialTypes = [
    { value: 'StudyMaterial', label: 'Study Material' },
    { value: 'Quiz', label: 'Quiz' },
    { value: 'Homework', label: 'Homework' },
    { value: 'Video', label: 'Video' },
    { value: 'Worksheet', label: 'Worksheet' },
    { value: 'CourseOutline', label: 'Course Outline' }
  ];
  
  const difficultyLevels = [
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' },
    { value: 'Expert', label: 'Expert' }
  ];
  
  const accessTypes = [
    { value: 'Public', label: 'Public' },
    { value: 'Private', label: 'Private' },
    { value: 'SpecificStudents', label: 'Specific Students' }
  ];
  
  const visibilityOptions = [
    { value: 'Public', label: 'Public' },
    { value: 'BookingsOnly', label: 'Bookings Only' },
    { value: 'Private', label: 'Private' }
  ];

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      file: null,
      isPublic: true,
      type: 'StudyMaterial',
      visibility: 'Public',
      difficulty: 'Beginner',
      access: 'Public',
      allowedStudentEmails: []
    });
    setEditingMaterial(null);
    const fileInput = document.getElementById('materialFile');
    if (fileInput) fileInput.value = '';
    setError('');
  };

  const showAddForm = () => {
    resetForm();
    setView('form');
  };

  const showEditForm = async (material) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token found');

      const response = await axios.get(
        `${API_BASE_URL}/api/Material/tutor/materials/${material.MaterialId}`, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      const materialData = response.data;
      setEditingMaterial(materialData);
      
      setFormData({
        title: materialData.title || '',
        description: materialData.description || '',
        file: null,
        isPublic: materialData.isPublic !== false,
        type: materialData.type || 'StudyMaterial',
        visibility: materialData.visibility || 'Public',
        difficulty: materialData.difficulty || 'Beginner',
        access: materialData.access || 'Public',
        allowedStudentEmails: materialData.allowedStudents?.map(s => s.email) || []
      });
      
      setView('form');
    } catch (err) {
      console.error('Error fetching material details:', err);
      setError('Failed to load material details. Please try again.');
    }
  };

  const showList = () => {
    setView('list');
    resetForm();
  };

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token found');

      const response = await axios.get(`${API_BASE_URL}/api/Material/tutor/materials`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMaterials(response.data.materials || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load materials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 100MB');
      return;
    }
    
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a document, image, or video file.');
      return;
    }
    
    setFormData(prev => ({ ...prev, file, error: '' }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    
    if (!editingMaterial && !formData.file) {
      setError('Please select a file to upload');
      return false;
    }
    
    if (formData.access === 'SpecificStudents' && formData.allowedStudentEmails.length === 0) {
      setError('Please add at least one student email for specific access');
      return false;
    }
    
    return true;
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsUploading(true);
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token found');

      if (editingMaterial) {
        const dataToSend = new FormData();
        
        if (formData.file) {
          dataToSend.append('File', formData.file);
        }
        
        const materialData = {
          Title: formData.title,
          Description: formData.description,
          Type: formData.type,
          Visibility: formData.visibility,
          Difficulty: formData.difficulty,
          IsPublic: formData.isPublic,
          Access: formData.access,
          AllowedStudentEmails: formData.access === 'SpecificStudents' ? formData.allowedStudentEmails : []
        };
        
        Object.entries(materialData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(item => dataToSend.append(key, item));
          } else if (value !== null && value !== undefined) {
            dataToSend.append(key, value);
          }
        });

        await axios.put(
          `${API_BASE_URL}/api/Material/tutor/materials/${editingMaterial.materialId}`,
          dataToSend,
          { 
            headers: { 
              Authorization: `Bearer ${token}`, 
              'Content-Type': 'multipart/form-data' 
            } 
          }
        );
      } else {
        const dataToSend = new FormData();
        
        if (formData.file) {
          dataToSend.append('File', formData.file);
        }
        
        const materialData = {
          Title: formData.title,
          Description: formData.description,
          Type: formData.type,
          Visibility: formData.visibility,
          Difficulty: formData.difficulty,
          IsPublic: formData.isPublic,
          Access: formData.access,
          AllowedStudentEmails: formData.access === 'SpecificStudents' ? formData.allowedStudentEmails : []
        };
        
        Object.entries(materialData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(item => dataToSend.append(key, item));
          } else if (value !== null && value !== undefined) {
            dataToSend.append(key, value);
          }
        });

        await axios.post(
          `${API_BASE_URL}/api/Material/tutor/upload`, 
          dataToSend,
          { 
            headers: { 
              Authorization: `Bearer ${token}`, 
              'Content-Type': 'multipart/form-data' 
            } 
          }
        );
      }

      await fetchMaterials();
      showList();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save material.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material? This action cannot be undone.')) return;

    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token found');

      await axios.delete(`${API_BASE_URL}/api/Material/tutor/materials/${materialId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      setMaterials(prev => prev.filter(m => m.materialId !== materialId));
      
      if (editingMaterial?.materialId === materialId) {
        resetForm();
        setView('list');
      }
      
      setError('');
      alert('Material deleted successfully');
      
    } catch (err) {
      console.error('Error deleting material:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete material. Please try again.';
      setError(errorMessage);
      
      if (err.response?.status !== 404) {
        fetchMaterials();
      }
    }
  };
  
  const handleAddStudentEmail = (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    if (!email) return;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      allowedStudentEmails: [...new Set([...prev.allowedStudentEmails, email])],
      error: ''
    }));
    
    e.target.email.value = '';
  };
  
  const removeStudentEmail = (emailToRemove) => {
    setFormData(prev => ({
      ...prev,
      allowedStudentEmails: prev.allowedStudentEmails.filter(email => email !== emailToRemove)
    }));
  };

  if (loading && materials.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5>Loading your materials...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="material-management">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <h2>My Teaching Materials</h2>
        <button 
          className="btn btn-submit"
          onClick={view === 'list' ? showAddForm : showList}
          disabled={loading || isUploading}
        >
          <i className={view === 'list' ? 'fas fa-plus' : 'fas fa-arrow-left'}></i>
          <span className="d-none d-md-inline ms-1">
            {view === 'list' ? 'Add New Material' : 'Back to List'}
          </span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </div>
      )}

      {view === 'form' ? (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="fas fa-upload me-2"></i>
              {editingMaterial ? 'Edit Material' : 'Add New Material'}
            </h5>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleUpload} className="material-form">
              <div className="form-group mb-3">
                <label>Title *</label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>Type *</label>
                    <select
                      className="form-select"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                    >
                      {materialTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>Difficulty *</label>
                    <select
                      className="form-select"
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleInputChange}
                      required
                    >
                      {difficultyLevels.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>Visibility *</label>
                    <select
                      className="form-select"
                      name="visibility"
                      value={formData.visibility}
                      onChange={handleInputChange}
                      required
                    >
                      {visibilityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label>Access *</label>
                    <select
                      className="form-select"
                      name="access"
                      value={formData.access}
                      onChange={(e) => {
                        handleInputChange(e);
                        if (e.target.value !== 'SpecificStudents') {
                          setFormData((prev) => ({ ...prev, allowedStudentEmails: [] }));
                        }
                      }}
                      required
                    >
                      {accessTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {formData.access === 'SpecificStudents' && (
                <div className="form-group mb-3">
                  <label>Allowed Students *</label>
                  <div className="input-group mb-2">
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="Enter student email"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStudentEmail(e)}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={handleAddStudentEmail}
                    >
                      Add
                    </button>
                  </div>

                  {formData.allowedStudentEmails.length > 0 && (
                    <div className="mt-2">
                      {formData.allowedStudentEmails.map((email, index) => (
                        <span key={index} className="badge bg-primary me-1 mb-1">
                          {email}
                          <button
                            type="button"
                            className="btn-close btn-close-white ms-2"
                            style={{ fontSize: '0.5rem' }}
                            onClick={() => removeStudentEmail(email)}
                            aria-label="Remove email"
                          />
                        </span>
                      ))}
                    </div>
                  )}
                  <small className="form-text text-muted">
                    Only these students will be able to access this material
                  </small>
                </div>
              )}

              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                />
                <label className="form-check-label" htmlFor="isPublic">
                  Make this material publicly accessible
                </label>
              </div>

              <div className="form-group mb-3">
                <label>Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter a description for this material..."
                />
              </div>

              <div className="file-upload">
                <label className="file-upload-label">
                  <i className="fas fa-cloud-upload-alt me-2"></i>
                  {editingMaterial ? 'Replace File' : 'Choose a file'}
                </label>
                <input
                  type="file"
                  id="materialFile"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  required={!editingMaterial}
                />
                {formData.file ? (
                  <div className="file-selected">
                    <i className="fas fa-check-circle me-1"></i>
                    {formData.file.name}
                  </div>
                ) : (
                  <div className="text-muted small mt-2">
                    {editingMaterial ? 'No file selected (optional)' : 'No file chosen'}
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-between mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={showList}
                  disabled={isUploading}
                >
                  <i className="bi bi-arrow-left me-1"></i> Back to List
                </button>
                <div>
                  <button
                    type="button"
                    className="btn btn-outline-secondary me-2"
                    onClick={resetForm}
                    disabled={isUploading}
                  >
                    <i className="bi bi-arrow-counterclockwise me-1"></i> Reset
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        {editingMaterial ? 'Updating...' : 'Uploading...'}
                      </>
                    ) : (
                      <>
                        <i className={`bi ${editingMaterial ? 'bi-pencil' : 'bi-upload'} me-1`}></i>
                        {editingMaterial ? 'Update Material' : 'Upload Material'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="fas fa-list-ul me-2"></i>
              Materials List
            </h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="subject-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Uploaded</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {materials.length === 0 ? (
                    <tr>
                      <td colSpan="3">
                        <div className="empty-state text-center py-4">
                          <i className="fas fa-inbox fa-2x mb-2"></i>
                          <h5>No materials found</h5>
                          <p>Upload your first teaching material </p>
                          <button
                            className="btn btn-primary mt-2"
                            onClick={showAddForm}
                          >
                            <i className="fas fa-plus me-2"></i>Upload First Material
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    materials.map((material) => (
                      <tr key={material.MaterialId}>
                        <td data-label="Material">
                          <div className="d-flex align-items-center">
                            <i className="fas fa-file-alt me-2 text-primary"></i>
                            <div>
                              <div>{material.Title || 'Untitled'}</div>
                              {material.Description && (
                                <div className="small text-muted">
                                  {material.Description.length > 50
                                    ? material.Description.substring(0, 50) + '...'
                                    : material.Description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td data-label="Uploaded">
                          {material.CreatedAt
                            ? new Date(material.CreatedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'N/A'}
                        </td>
                        <td className="actions">
                          <div className="actions d-flex gap-2">
                            <button
                              className="btn-action btn-edit"
                              onClick={() => showEditForm(material)}
                              disabled={isUploading}
                            >
                              <i className="fas fa-edit"></i>
                              <span>Edit</span>
                            </button>
                            <button
                              className="btn-action btn-delete"
                              onClick={() => handleDelete(material.MaterialId)}
                              disabled={isUploading}
                            >
                              <i className="fas fa-trash"></i>
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              {loading && materials.length > 0 && (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorPage;