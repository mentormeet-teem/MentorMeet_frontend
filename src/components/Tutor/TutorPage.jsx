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
    difficulty: 'BEGINNER'
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      file: null,
      isPublic: true,
      type: 'StudyMaterial',
      difficulty: 'BEGINNER'
    });
    setEditingMaterial(null);
    const fileInput = document.getElementById('materialFile');
    if (fileInput) fileInput.value = '';
  };

  const showAddForm = () => {
    resetForm();
    setView('form');
  };

  const showEditForm = (material) => {
    setEditingMaterial(material);
    setFormData({
      title: material.Title || '',
      description: material.Description || '',
      file: null,
      isPublic: material.IsPublic !== false,
      type: material.Type || 'StudyMaterial',
      difficulty: material.Difficulty || 'BEGINNER'
    });
    setView('form');
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
    setFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file && !editingMaterial) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setIsUploading(true);
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token found');

      if (editingMaterial) {
        // Editing existing material
        if (formData.file) {
          const dataToSend = new FormData();
          dataToSend.append('file', formData.file);
          Object.entries({
            Title: formData.title,
            Description: formData.description,
            Type: formData.type,
            IsPublic: formData.isPublic.toString(),
            Difficulty: formData.difficulty
          }).forEach(([key, value]) => dataToSend.append(key, value));

          await axios.put(
            `${API_BASE_URL}/api/Material/tutor/materials/${editingMaterial.MaterialId}`,
            dataToSend,
            { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
          );
        } else {
          const jsonData = {
            Title: formData.title,
            Description: formData.description,
            Type: formData.type,
            IsPublic: formData.isPublic,
            Difficulty: formData.difficulty
          };

          await axios.put(
            `${API_BASE_URL}/api/Material/tutor/materials/${editingMaterial.MaterialId}`,
            jsonData,
            { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        // Creating new material
        const dataToSend = new FormData();
        if (formData.file) dataToSend.append('file', formData.file);
        Object.entries({
          Title: formData.title,
          Description: formData.description,
          Type: formData.type,
          IsPublic: formData.isPublic.toString(),
          Difficulty: formData.difficulty
        }).forEach(([key, value]) => dataToSend.append(key, value));

        await axios.post(`${API_BASE_URL}/api/Material/tutor/upload`, dataToSend, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
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
    if (!window.confirm('Are you sure you want to delete this material?')) return;

    try {
      const token = getAuthToken();
      if (!token) throw new Error('No authentication token found');

      await axios.delete(`${API_BASE_URL}/api/Material/tutor/materials/${materialId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMaterials(prev => prev.filter(m => m.MaterialId !== materialId));
      if (editingMaterial?.MaterialId === materialId) resetForm();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete material.');
      fetchMaterials();
    }
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
              <div className="form-section">
                <div className="form-group">
                  <label htmlFor="title" className="form-label">Material Title</label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    disabled={isUploading}
                    placeholder="Enter material title"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type" className="form-label">Material Type</label>
                  <select
                    className="form-select"
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    disabled={isUploading}
                    required
                  >
                    <option value="StudyMaterial">Study Material</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Homework">Homework</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="difficulty" className="form-label">Difficulty Level</label>
                  <select
                    className="form-select"
                    id="difficulty"
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    disabled={isUploading}
                    required
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>

                <div className="form-group">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isPublic"
                      name="isPublic"
                      checked={formData.isPublic}
                      onChange={handleInputChange}
                      disabled={isUploading}
                    />
                    <label className="form-check-label" htmlFor="isPublic">
                      Make this material public
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    disabled={isUploading}
                    placeholder="Enter a detailed description of this material (optional)"
                  />
                </div>
                <div className="col-md-4">
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
                </div>
                <div className="form-actions">
                  <div className="button-group">
                    <button 
                      type="button" 
                      className="button button-cancel"
                      onClick={showList}
                      disabled={isUploading}
                    >
                      <i className="fas fa-times"></i>Cancel
                    </button>
                    <button 
                      type="submit"
                      className="button button-submit"
                      disabled={isUploading || (!editingMaterial && !formData.file)}
                    >
                      {isUploading ? (
                        <><i className="fas fa-spinner fa-spin me-2"></i>Saving...</>
                      ) : editingMaterial ? (
                        <><i className="fas fa-save me-2"></i>Update Material</>
                      ) : (
                        <><i className="fas fa-upload me-2"></i>Upload Material</>
                      )}
                    </button>
                  </div>
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
                                day: 'numeric'
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
