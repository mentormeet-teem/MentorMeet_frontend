import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import '../../styles/Dashboard.css';


const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
  });

  // Fetch all subjects from the backend
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError('');
      const token = sessionStorage.getItem('mentormeet_token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/admin/subjects`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Handle different response formats
      const subjectsData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.data || [];
      
      setSubjects(subjectsData);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Failed to load subjects. Please try again later.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const subjectsByCategory = subjects.reduce((acc, subject) => {
    const category = subject.Category || subject.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(subject);
    return acc;
  }, {});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSubject = async () => {
    const name = formData.name?.trim() || '';
    const category = formData.category?.trim() || '';
    
    if (!name) {
      setError('Please enter a subject name');
      return;
    }
    if (!category) {
      setError('Please enter a category');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = sessionStorage.getItem('mentormeet_token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/subjects`,
        {
          Name: name,
          Category: category
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      await fetchSubjects();
      setFormData({ name: '', category: '' });
      setIsAdding(false);
      
    } catch (err) {
      console.error('Add subject error:', err);
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error?.message ||
                         err.response?.data?.error || 
                         'Failed to add subject. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubject = async (subject) => {
    const name = formData.name?.trim() || '';
    const category = formData.category?.trim() || '';
    if (!name) {
      setError('Please enter a subject name');
      return;
    }
    if (!category) {
      setError('Please enter a category');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = sessionStorage.getItem('mentormeet_token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      const subjectId = subject._id || subject.subjectId || subject.SubjectId || subject.id;
      
      if (!subjectId) {
        throw new Error('Invalid subject ID');
      }
      const updateData = {
        Name: name,
        Category: category,
        IsActive: true 
      };
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/subjects/${subjectId}`,
        updateData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      await fetchSubjects();
      setEditingSubject(null);
      setFormData({ name: '', category: '' });
      setError('');
      
    } catch (err) {
      console.error('Update subject error:', err);
      if (err.response?.data?.message?.includes('already exists')) {
        setError('A subject with this name already exists. Please choose a different name.');
      } else {
        const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error?.message ||
                           err.response?.data?.error || 
                           'Failed to update subject. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subject) => {
    const subjectId = subject.SubjectId || subject.subjectId || subject.id;
    
    if (!subjectId) {
      setError('Invalid subject: Missing ID');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this subject?')) {
      return;
    }
    try {
      setLoading(true);
      setError('');
      const token = sessionStorage.getItem('mentormeet_token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }await axios.delete(`${API_BASE_URL}/api/admin/subjects/${subjectId}`, 
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      await fetchSubjects();
      
    } catch (err) {
      console.error('Delete subject error:', err);
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error?.message ||
                         err.response?.data?.error || 
                         'Failed to delete subject. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
const startEditing = (subject) => {
    if (!subject) {
      console.error('No subject provided for editing');
      return;
    }
    
    console.log('Starting to edit subject:', subject);
    
    setEditingSubject(subject);
    setFormData({
      name: subject.Name || subject.name || '',
      category: subject.Category || subject.category || ''
    });
  };

  const cancelEditing = () => {
    setEditingSubject(null);
    setIsAdding(false);
    setFormData({ name: '', category: '' });
    setError('');
  };

  // Loading state
  if (loading && subjects.length === 0) {
    return (
      <div className="tutor-dashboard">
        <div className="loading-container text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading subjects...</p>
        </div>
      </div>
    );
  }
  
  if (!loading && subjects.length === 0) {
    return (
      <div className="tutor-dashboard">
        <div className="empty-state text-center py-5">
          <p className="mb-4">No subjects found. Add your first subject to get started.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setIsAdding(true)}
          >
            Add First Subject
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="subject-management">
      <div className="page-header">
        <h2>Subject Management</h2>
        <button 
          className="btn btn-submit"
          onClick={() => {
            setEditingSubject(null);
            setFormData({ name: '', category: '' });
            setIsAdding(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          disabled={loading || isAdding || editingSubject}
        >
          <i className="fas fa-plus"></i>
          <span className="d-none d-md-inline ms-1">Add New Subject</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </div>
      )}
      {(isAdding || editingSubject) && (
        <div className="subject-form-container">
          <div className="form-header">
            <h3>
              <i className="fas fa-edit"></i>
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </h3>
          </div>
          <div className="form-content">
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="name">Subject Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Enter subject name"
                />
              </div>
              <div className="form-field">
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Enter category name"
                />
              </div>
              <div className="form-actions">
                <div className="button-group">
                  <button 
                    className="button button-submit" 
                    onClick={editingSubject ? () => handleUpdateSubject(editingSubject) : handleAddSubject}
                    disabled={loading || !formData.name || !formData.category}
                  >
                    {loading ? (
                      <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                    ) : editingSubject ? (
                      <><i className="fas fa-save"></i>Update</>
                    ) : (
                      <><i className="fas fa-plus"></i>Add</>
                    )}
                  </button>
                  <button 
                    className="button button-cancel"
                    onClick={cancelEditing}
                    disabled={loading}
                  >
                    <i className="fas fa-times"></i>Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-list-ul me-2"></i>
            Subjects List
          </h5>
          <button 
            className="btn btn-submit d-none d-lg-block"
            onClick={() => {
              setEditingSubject(null);
              setFormData({ name: '', category: '' });
              setIsAdding(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={loading || isAdding || editingSubject}
          >
            <i className="fas fa-plus"></i>
            <span className="ms-1">Add New Subject</span>
          </button>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="subject-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Category</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(subjectsByCategory).map(([category, categorySubjects]) => (
                  <React.Fragment key={category}>
                    {categorySubjects.map((subject, index) => {
                      const subjectId = subject._id || subject.subjectId || subject.SubjectId || `temp-${index}`;
                      
                      return (
                        <tr key={`subject-${subjectId}`}>
                          <td data-label="Subject">
                            <div className="d-flex align-items-center">
                              <i className="fas fa-book me-2 text-primary"></i>
                              <span>{subject.Name || subject.name}</span>
                            </div>
                          </td>
                          <td data-label="Category">
                            <span className="badge bg-light">
                              {subject.Category || subject.category || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="actions">
                            <div className="actions">
                              <button 
                                className="btn-action btn-edit"
                                onClick={() => {
                                  setFormData({
                                    name: subject.Name || subject.name || '',
                                    category: subject.Category || subject.category || ''
                                  });
                                  setEditingSubject(subject);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={loading || (editingSubject && editingSubject._id !== subjectId)}
                              >
                                <i className="fas fa-edit"></i>
                                <span>Edit</span>
                              </button>
                              <button 
                                className="btn-action btn-delete"
                                onClick={() => handleDeleteSubject(subject)}
                                disabled={loading || editingSubject}
                              >
                                <i className="fas fa-trash"></i>
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            
            {subjects.length === 0 && !loading && (
              <div className="empty-state">
                <i className="fas fa-inbox"></i>
                <h5>No subjects found</h5>
                <p>Add your first subject to get started</p>
                <button 
                  className="btn-submit mt-3"
                  onClick={() => {
                    setEditingSubject(null);
                    setFormData({ name: '', category: '' });
                    setIsAdding(true);
                  }}
                >
                  <i className="fas fa-plus me-2"></i>Add First Subject
                </button>
              </div>
            )}
            
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default SubjectManagement;
