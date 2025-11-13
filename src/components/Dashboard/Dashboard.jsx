import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../../styles/Dashboard.css';
import SubjectManagement from '../Admin/SubjectManagement';

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [pendingTutors, setPendingTutors] = useState([]);
  const [verifiedTutors, setVerifiedTutors] = useState([]);
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, pageSize: 20, totalPages: 1, totalCount: 0 });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userStatusFilter, setUserStatusFilter] = useState('All');
  const [profileSaved, setProfileSaved] = useState(false);
  const [tutorProfile, setTutorProfile] = useState({ 
    firstName: '',
    lastName: '',
    hourlyRate: '', 
    subjectIds: [],
    bio: '',
    yearsofExperience: '',
    gradeLevels: [],
    teachingStyle: ''
  });
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toFileUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const trimmed = String(path).startsWith('/') ? path.slice(1) : String(path);
    // Use relative path which will be proxied by Vite
    return `/api/${trimmed}`;
  };
  const fetchAllUsers = async (page = 1, pageSize = 20, silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const token = localStorage.getItem('mentormeet_token');
    
      const response = await axios.get(`http://localhost:5010/api/admin/users?page=${page}&pageSize=${pageSize}&excludeRole=Admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const { users, pagination } = response.data || {};
      setUsersList(Array.isArray(users) ? users : []);
      if (pagination) {
        setUsersPagination({
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages: pagination.totalPages,
          totalCount: pagination.totalCount
        });
      }
    } catch (err) {
      setError('Failed to load users list');
    } finally {
      if (!silent) setLoading(false);
    }
  };  useEffect(() => {
    console.log('User data in dashboard:', user);
  }, [user]);

  useEffect(() => {
    console.log('User object:', user);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchTutorProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('mentormeet_token');
      console.log('Fetching tutor profile from /api/tutor/profile');
      
      const response = await axios.get('/api/tutor/profile', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const profile = response.data;
      console.log('Fetched tutor profile:', profile);
      
      const initialProfile = {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        hourlyRate: profile.hourlyRate || profile.HourlyRate || '',
        bio: profile.bio || profile.Bio || '',
        yearsofExperience: profile.yearsofExperience || profile.YearofExperience || 1,
        subjectIds: (profile.Subjects || []).map(s => s.subjectId || s.SubjectId) || [],
        gradeLevels: (profile.gradeLevels || profile.GradeLevels || '').split(',').filter(Boolean) || [],
        teachingStyle: profile.teachingStyle || profile.TeachingStyle || ''
      };
      
      console.log('Initializing tutor profile with:', initialProfile);
      setTutorProfile(initialProfile);
      
    } catch (err) {
      console.error('Error fetching tutor profile:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
      setError('Failed to load tutor profile..');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = user?.role?.toLowerCase();
    if (role === 'tutor') {
      fetchTutorProfile();
      fetchAvailableSubjects();
    }
  }, [user]);

  const fetchAvailableSubjects = async () => {
    try {
      const predefinedSubjects = [
        { subjectId: 1, name: 'Mathematics', category: 'Sciences' },
        { subjectId: 2, name: 'Physics', category: 'Sciences' },
        { subjectId: 3, name: 'Chemistry', category: 'Sciences' },
        { subjectId: 4, name: 'Biology', category: 'Sciences' },
        { subjectId: 5, name: 'English', category: 'Languages' },
        { subjectId: 6, name: 'Amharic', category: 'Languages' },
        { subjectId: 7, name: 'ICT', category: 'Technology' },
        { subjectId: 9, name: 'Economics', category: 'Business' },
        { subjectId: 10, name: 'Business Studies', category: 'Business' },
      ];

      console.log('Using predefined subjects:', predefinedSubjects);
      
      setAvailableSubjects(predefinedSubjects);
      try {
        const token = localStorage.getItem('mentormeet_token');
        if (token) {
          const response = await axios.get('/api/tutor/profile', {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const tutorSubjects = response?.data?.Subjects || [];
          if (tutorSubjects.length > 0) {
            const selectedSubjectIds = tutorSubjects
              .map(s => s.subjectId || s.SubjectId)
              .filter(Boolean);
              
            console.log('Loaded tutor\'s current subjects:', selectedSubjectIds);
            setTutorProfile(prev => ({
              ...prev,
              subjectIds: selectedSubjectIds
            }));
            return;
          }
        }
      } catch (profileError) {
        console.error('Error loading tutor profile (continuing with default):', profileError);
       
      }
      console.log('No subjects currently selected !');
      setTutorProfile(prev => ({
        ...prev,
        subjectIds: []
      }));
      
    } catch (err) {
      console.error('Error in fetchAvailableSubjects:', err);
      setAvailableSubjects([]);
      setTutorProfile(prev => ({
        ...prev,
        subjectIds: []
      }));
    }
  };

  const saveTutorProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('mentormeet_token');
      
      if (!tutorProfile.hourlyRate || !tutorProfile.subjectIds || tutorProfile.subjectIds.length === 0) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }
      const subjectIds = (tutorProfile.subjectIds || [])
        .map(id => Number(id))
        .filter(id => !isNaN(id));
      const data = {
        hourlyRate: parseFloat(tutorProfile.hourlyRate) || 0,
        bio: tutorProfile.bio || '',
        yearofExperience: (tutorProfile.yearsofExperience || 1).toString(),
        subjectIds: subjectIds,
        gradeLevels: Array.isArray(tutorProfile.gradeLevels) 
          ? tutorProfile.gradeLevels.join(',') 
          : tutorProfile.gradeLevels || '',
        teachingStyle: tutorProfile.teachingStyle || ''
      };
      
      console.log('Sending profile data to server:', JSON.stringify(data, null, 2));

      console.log('Sending profile data to server:', JSON.stringify(data, null, 2));

      
      const response = await axios.put('/api/tutor/profile', data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Profile saved successfully:', response.data);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 1500);
      
      fetchTutorProfile();
    } catch (err) {
      console.error('Error saving tutor profile:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
      const errorMessage = err.response?.data?.message || 'Failed to save profile. Please check the console for details.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingTutors = async (silent = false) => {
    const token = localStorage.getItem('mentormeet_token');
    
    if (!token) {
      setError('No authentication token found. Please log in again.');
      onLogout();
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
        setError('');
      }
      
      const response = await axios.get('/api/admin/tutors/pending', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (Array.isArray(response?.data)) {
        setPendingTutors(response.data);
        setData(response.data);
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (err) {
      console.error('Error fetching pending tutors:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        onLogout();
      } else if (err.response?.status === 403) {
        setError('Access denied: Admin privileges required');
      } else if (err.response?.data?.message) {
        setError(`Error: ${err.response.data.message}`);
      } else if (!navigator.onLine) {
        setError('No internet connection. Please check your network.');
      } else {
        setError('Failed to load data. Please try again later.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchStats = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const token = localStorage.getItem('mentormeet_token');
      const response = await axios.get('/api/admin/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setStats(response.data);
    } catch (err) {
      if (!silent) setError('Failed to load dashboard stats');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const verifyTutor = async (tutorUserId) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('mentormeet_token');
      await axios.post(`http://localhost:5010/api/admin/tutors/verify/${tutorUserId}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      await fetchPendingTutors(true);
      await fetchVerifiedTutors(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify tutor');
    } finally {
      setLoading(false);
    }
  };

  const fetchVerifiedTutors = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const token = localStorage.getItem('mentormeet_token');
      console.log('=== DEBUG VERIFIED TUTORS REQUEST ===');
      console.log('Token exists:', !!token);
      console.log('User role:', user.role);
      console.log('Full user object:', user);
      
      const response = await axios.get('/api/Admin/tutors/verified', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(' SUCCESS - Verified tutors response:', response.data);
      setVerifiedTutors(Array.isArray(response.data) ? response.data : []);
      setData(Array.isArray(response.data) ? response.data : []);
      
    } catch (err) {
      console.log(' FULL ERROR DETAILS:');
      console.log('Error object:', err);
      console.log('Error message:', err.message);
      console.log('Error code:', err.code);
      console.log('Error status:', err.response?.status);
      console.log('Error status text:', err.response?.statusText);
      console.log('Error data:', err.response?.data);
      console.log('Error headers:', err.response?.headers);
      
      if (err.response?.status === 401) {
        setError('Unauthorized: Please login again');
        onLogout();
      } else if (err.response?.status === 403) {
        setError('Access denied: Admin privileges required');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK') {
        setError('Network error: Cannot connect to server');
      } else {
        setError(`Failed to load verified tutors: ${err.message}`);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    if (!window.confirm(`Are you sure you want to ${isActive ? 'activate' : 'deactivate'} this user?`)) {
      return;
    }
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('mentormeet_token');
      await axios.put(
        `/api/admin/users/${userId}/status`,
        { isActive },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      setUsersList(usersList.map(user => 
        user.id === userId ? { ...user, isActive } : user
      ));
      if (stats) {
        setStats({
          ...stats,
          activeUsers: isActive 
            ? (stats.activeUsers || 0) + 1 
            : Math.max(0, (stats.activeUsers || 1) - 1)
        });
      }
    } catch (err) {
      setError('Failed to update user status');
      console.error('Error updating user status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role?.toLowerCase() === 'admin') {
      fetchPendingTutors(true);
      fetchVerifiedTutors(true);
      fetchStats(true);
    }
  }, [user]);

  useEffect(() => {
    const role = user?.role?.toLowerCase();
    if (role === 'admin') {
      if (!stats) {
        fetchStats();
      }
      if (activeTab === 'totalUsers' && usersList.length === 0) {
        fetchAllUsers(1, 20, true);
      }
    }
  }, [activeTab, user?.role]);

  const totalUsers = stats?.usersByRole 
    ? Object.entries(stats.usersByRole)
        .filter(([role]) => role.toLowerCase() !== 'admin')
        .reduce((sum, [, count]) => sum + (Number.isInteger(count) ? count : 0), 0)
    : 0;

  const renderAdminContent = () => {
    let mainContent = null;
    const filteredUsers = usersList.filter(user => {
      const isAdmin = Array.isArray(user.Roles) 
        ? user.Roles.some(role => role.toLowerCase() === 'admin')
        : (user.UserType || '').toLowerCase() === 'admin';
      if (isAdmin) return false;
      
      const fullName = `${user.FirstName || ''} ${user.LastName || ''}`.toLowerCase().trim();
      const searchTerm = userSearch.toLowerCase();
      
      const matchesSearch = 
        (user.Email?.toLowerCase().includes(searchTerm)) ||
        fullName.includes(searchTerm) ||
        (user.PhoneNumber?.includes(searchTerm));
      
      let matchesRole = true;
      if (userRoleFilter !== 'All') {
        if (Array.isArray(user.Roles)) {
          matchesRole = user.Roles.some(role => 
            role.toLowerCase() === userRoleFilter.toLowerCase()
          );
        } else if (user.UserType) {
          matchesRole = user.UserType.toLowerCase() === userRoleFilter.toLowerCase();
        } else {
          matchesRole = false;
        }
      }
      
      const matchesStatus = userStatusFilter === 'All' || 
                          (userStatusFilter === 'Active' ? user.IsActive : !user.IsActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
    const getAllUserRoles = () => {
      const standardRoles = ['Student', 'Tutor', 'Institution', 'Parent'];
      const foundRoles = new Set(standardRoles);
      
      usersList.forEach(user => {
        if (Array.isArray(user.Roles)) {
          user.Roles.forEach(role => {
            if (role !== 'Admin') foundRoles.add(role);
          });
        } else if (user.UserType && user.UserType !== 'Admin') {
          foundRoles.add(user.UserType);
        }
      });
      
      return Array.from(foundRoles).sort();
    };

    switch (activeTab) {
      case 'subjectManagement':
        mainContent = <SubjectManagement />;
        break;
      case 'verifications':
        mainContent = (
          <div>
            <h3>Pending Tutors</h3>
            {error && <div className="error-message mt-15">{error}</div>}
            {loading && <div className="loading mt-15">Loading tutor data...</div>}
            {data && data.length > 0 && (
              <div className="mt-20">
                <h4>Pending Tutors ({data.length})</h4>
                {data.map(tutor => (
                  <div key={tutor.userId} className="tutor-card">
                    <p><strong>{tutor.name}</strong> - {tutor.email}</p>
                    <p>Experience: {tutor.yearofexperience} years</p>
                    <p>Hourly Rate: {tutor.hourlyRate}</p>
                    <p>ID Type: {tutor.idType}</p>
                    {tutor.phoneNumber && <p>Phone: {tutor.phoneNumber}</p>}
                    {tutor.dateOfBirth && <p>DOB: {new Date(tutor.dateOfBirth).toLocaleDateString()}</p>}
                    {tutor.gender && <p>Gender: {tutor.gender}</p>}
                    {tutor.createdAt && <p>Applied: {new Date(tutor.createdAt).toLocaleString()}</p>}
                    <div className="row gap-8 wrap mt-8">
                      {toFileUrl(tutor.resumePath) && (
                        <a className="primary-btn" href={toFileUrl(tutor.resumePath)} target="_blank" rel="noreferrer">View Resume</a>
                      )}
                      {toFileUrl(tutor.idDocumentPath) && (
                        <a className="primary-btn" href={toFileUrl(tutor.idDocumentPath)} target="_blank" rel="noreferrer">View ID</a>
                      )}
                      {toFileUrl(tutor.certificationPath) && (
                        <a className="secondary-btn" href={toFileUrl(tutor.certificationPath)} target="_blank" rel="noreferrer">View Certificate</a>
                      )}
                    </div>
                    <button onClick={() => verifyTutor(tutor.userId)} className="primary-btn mt-10">Verify Tutor</button>
                  </div>
                ))}
              </div>
            )}
            {data && data.length === 0 && !loading && (
              <div style={{marginTop: '20px', textAlign: 'center', color: '#718096'}}>No pending tutor verifications</div>
            )}
          </div>
        );
        break;
      case 'users':
        mainContent = (
          <div>
            {renderTutorsList()}
          </div>
        );
        break;
      case 'totalUsers':
        mainContent = (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-6">User Management</h2>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 200px 180px',
                gap: '16px',
                alignItems: 'flex-end'
              }}>
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 15px 12px 40px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box',
                        height: '44px'
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      color: '#a0aec0',
                      pointerEvents: 'none'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </div>
                </div>
                <div style={{ flex: '0 0 200px' }}>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      height: '44px',
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'8\' viewBox=\'0 0 12 8\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1.5L6 6.5L11 1.5\' stroke=\'%234A5568\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 15px center',
                      paddingRight: '40px'
                    }}
                  >
                    <option value="All">All Roles</option>
                    {getAllUserRoles().map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: '0 0 180px' }}>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      height: '44px',
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'8\' viewBox=\'0 0 12 8\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1.5L6 6.5L11 1.5\' stroke=\'%234A5568\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 15px center',
                      paddingRight: '40px'
                    }}
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div key={user.Id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {user.FirstName} {user.LastName}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.IsActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.IsActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{user.Email}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {Array.isArray(user.Roles) ? user.Roles[0] : (user.UserType || 'User')}
                      </span>
                      <button
                        onClick={() => updateUserStatus(user.Id, !user.IsActive)}
                        className={`action-button ${!user.IsActive ? 'inactive' : ''}`}
                      >
                        {user.IsActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No users found matching your search criteria
                </div>
              )}
            </div>
            {usersPagination.totalPages > 1 && (
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => fetchAllUsers(usersPagination.page - 1, usersPagination.pageSize)}
                  disabled={usersPagination.page <= 1}
                  className="px-4 py-2 border rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {usersPagination.page} of {usersPagination.totalPages}
                </span>
                <button
                  onClick={() => fetchAllUsers(usersPagination.page + 1, usersPagination.pageSize)}
                  disabled={usersPagination.page >= usersPagination.totalPages}
                  className="px-4 py-2 border rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        );
        break;
      case 'activeUsers':
        mainContent = (
          <div>
            <h2>Active Users</h2>
            <p className="text-muted">Currently active user sessions.</p>
            <div className="stat-card" style={{maxWidth: '300px'}}>
              <h3>Active Sessions</h3>
              <p className="stat-value">{stats?.activeUsers ?? 0}</p>
            </div>
          </div>
        );
        break;
      default:
        mainContent = (
          <div>
            <h2>Admin Dashboard</h2>
          </div>
        );
    }

    return (
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ width: '240px', flexShrink: 0 }}>
          <div className="form-section">
            <h3>Admin Menu</h3>
            <div className="admin-nav">
              <button 
                className={activeTab === 'verifications' ? 'active' : ''} 
                onClick={() => { setActiveTab('verifications'); fetchPendingTutors(true); }}
              >
                <span>Pending Tutors</span>
                <span className="badge">{(stats?.pendingTutors ?? pendingTutors.length) || 0}</span>
              </button>
              <button 
                className={activeTab === 'users' ? 'active' : ''} 
                onClick={() => { 
                  setActiveTab('users'); 
                  fetchVerifiedTutors(true); 
                }}
              >
                <span>Verified Tutors</span>
                <span className="badge">{(stats?.verifiedTutors ?? verifiedTutors.length) || 0}</span>
              </button>
              <button 
                className={activeTab === 'totalUsers' ? 'active' : ''} 
                onClick={() => { 
                  setActiveTab('totalUsers');
                  fetchAllUsers(1, 20, true);
                }}
              >
                <span>Total Users</span>
                <span className="badge">{totalUsers}</span>
              </button>
              <button 
                className={activeTab === 'activeUsers' ? 'active' : ''} 
                onClick={() => setActiveTab('activeUsers')}
              >
                <span>Active Sessions</span>
                <span className="badge">{stats?.activeUsers ?? 0}</span>
              </button>
              <button 
                className={activeTab === 'subjectManagement' ? 'active' : ''} 
                onClick={() => setActiveTab('subjectManagement')}
              >
                <span>Manage Subjects</span>
              </button>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {mainContent}
        </div>
      </div>
    );
  };
  const renderTutorProfileEditor = () => {
    const gradeLevels = [
      'Elementary', 'Middle School', 'High School', 'Undergraduate', 'Graduate'
    ];

    const toggleGradeLevel = (level) => {
      setTutorProfile(prev => {
        const currentGradeLevels = Array.isArray(prev.gradeLevels) ? prev.gradeLevels : [];
        const newGradeLevels = currentGradeLevels.includes(level)
          ? currentGradeLevels.filter(gl => gl !== level)
          : [...currentGradeLevels, level];
        return { ...prev, gradeLevels: newGradeLevels };
      });
    };

    const toggleSubject = (subjectId) => {
      setIsDropdownOpen(false);
      setTutorProfile(prev => {
        const currentSubjectIds = Array.isArray(prev.subjectIds) ? prev.subjectIds : [];
        const newSubjectIds = currentSubjectIds.includes(subjectId)
          ? currentSubjectIds.filter(id => id !== subjectId)
          : [...currentSubjectIds, subjectId];
        return { ...prev, subjectIds: newSubjectIds };
      });
    };

    return (
      <div className="tutor-dashboard">
        <h2 className="dashboard-title">Edit Tutor Profile</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {profileSaved && (
          <div className="success-message">
            Profile saved successfully!
          </div>
        )}

        <div className="profile-editor">
          <div className="form-section">
            <h3 className="section-title">Basic Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={tutorProfile.firstName}
                  onChange={(e) => setTutorProfile(p => ({ ...p, firstName: e.target.value }))}
                  placeholder="Enter your first name"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={tutorProfile.lastName}
                  onChange={(e) => setTutorProfile(p => ({ ...p, lastName: e.target.value }))}
                  placeholder="Enter your last name"
                  className="form-input"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="form-input"
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Teaching Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Hourly Rate (ETB)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={tutorProfile.hourlyRate || ''}
                  onChange={(e) => setTutorProfile(p => ({ ...p, hourlyRate: e.target.value }))}
                  placeholder="e.g., 500"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  value={tutorProfile.yearsofExperience || ''}
                  onChange={(e) => setTutorProfile(p => ({ ...p, yearsofExperience: e.target.value }))}
                  placeholder="e.g., 3"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Teaching Preferences</h3>
            <div className="form-group">
              <label>Grade Levels</label>
              <div className="grade-levels">
                {gradeLevels.map(level => (
                  <button
                    key={level}
                    type="button"
                    className={`grade-level ${tutorProfile.gradeLevels?.includes(level) ? 'selected' : ''}`}
                    onClick={() => toggleGradeLevel(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Subjects</label>
              <div className="subject-selector-container" ref={dropdownRef}>
                <div 
                  className="subject-selector"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {tutorProfile.subjectIds?.length > 0 ? (
                    <div className="selected-subjects">
                      {tutorProfile.subjectIds.map(subjectId => {
                        const subject = availableSubjects.find(s => s.subjectId === subjectId);
                        return subject ? (
                          <span key={subjectId} className="subject-tag">
                            {subject.name}
                            <span 
                              className="remove-subject"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSubject(subjectId);
                              }}
                            >
                              ×
                            </span>
                          </span>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <span className="placeholder">Select subjects...</span>
                  )}
                  <span className="dropdown-arrow">▼</span>
                </div>
                
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    {availableSubjects.map(subject => (
                      <div
                        key={subject.subjectId}
                        className={`dropdown-item ${tutorProfile.subjectIds?.includes(subject.subjectId) ? 'selected' : ''}`}
                        onClick={() => toggleSubject(subject.subjectId)}
                      >
                        {subject.name}
                        {tutorProfile.subjectIds?.includes(subject.subjectId) && (
                          <span className="checkmark">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Teaching Style</label>
              <textarea
                value={tutorProfile.teachingStyle || ''}
                onChange={(e) => setTutorProfile(p => ({ ...p, teachingStyle: e.target.value }))}
                placeholder="Describe your teaching approach..."
                className="form-textarea"
                rows="4"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                value={tutorProfile.bio || ''}
                onChange={(e) => setTutorProfile(p => ({ ...p, bio: e.target.value }))}
                placeholder="Tell students about yourself, your experience, and your teaching philosophy..."
                className="form-textarea"
                rows="6"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={saveTutorProfile}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTutorsList = () => (
    <div className="dashboard-section">
      <h2>Verified Tutors</h2>
      
      {loading ? (
        <p>Loading tutors...</p>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="dashboard-grid">
          {verifiedTutors.map(tutor => (
            <div key={tutor.userId} className="dashboard-card">
              <div className="card-header">
                <h4>{tutor.firstName} {tutor.lastName}</h4>
                <span className={`status-badge ${tutor.isActive ? 'active' : 'inactive'}`}>
                  {tutor.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{tutor.email}</p>
              <div className="flex justify-end">
                <button 
                  onClick={() => updateUserStatus(tutor.userId, !tutor.isActive)}
                  className={`action-button ${tutor.isActive ? '' : 'inactive'}`}
                  >
                    {tutor.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );

  const renderTutorContent = () => {
    const hourlyRate = tutorProfile.hourlyRate || 
      user?.hourlyRate || 
      user?.HourlyRate || 
      user?.tutorProfile?.hourlyRate || 
      user?.TutorProfile?.HourlyRate || 
      '';
    const subjectIds = tutorProfile.subjectIds || [];
    const availableSubjectsList = availableSubjects || [];
    
    const subjectsList = subjectIds
      .map(id => {
        const subject = availableSubjectsList.find(s => s.subjectId === id);
        return subject ? subject.name : null;
      })
      .filter(Boolean);
      
    const subjectsCount = subjectsList.length;
    const experienceText = tutorProfile.yearsofExperience 
      ? `${tutorProfile.yearsofExperience} ${tutorProfile.yearsofExperience === 1 ? 'year' : 'years'}`
      : 'Not specified';
    const fullName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user?.name || 'Tutor';

    return (
      <div className="tutor-dashboard">
        <h2 className="dashboard-title">Tutor Dashboard</h2>
        
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Personal Information</h3>
            <p><span className="label">Name:</span> {fullName}</p>
            <p><span className="label">Email:</span> {user?.email || '—'}</p>
            <p><span className="label">Experience:</span> {experienceText}</p>
          </div>
          
          <div className="dashboard-card">
            <h3>Teaching Details</h3>
            <p><span className="label">Hourly Rate:</span> {hourlyRate ? `${hourlyRate} ETB` : 'Not set'}</p>
            <p><span className="label">Subjects:</span> {subjectsCount || 'None selected'}</p>
            <p><span className="label">Grade Levels:</span> {tutorProfile.gradeLevels?.join(', ') || 'Not specified'}</p>
          </div>
          
          <div className="dashboard-card">
            <h3>Profile Status</h3>
            <p><span className="label">Profile Complete:</span> {hourlyRate && subjectsCount > 0 ? 'Yes' : 'No'}</p>
            <p><span className="label">Teaching Style:</span> {tutorProfile.teachingStyle || 'Not specified'}</p>
          </div>
        </div>
        
        {subjectsList.length > 0 && (
          <div className="dashboard-card subjects-section">
            <h3>Your Subjects</h3>
            <div className="subjects-list">
              {subjectsList.map((subject, index) => (
                <span key={index} className="subject-tag">
                  {subject}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {tutorProfile.bio && (
          <div className="dashboard-card">
            <h3>About You</h3>
            <p className="bio-text">{tutorProfile.bio}</p>
          </div>
        )}
      </div>
    );
  };

  const renderInstitutionContent = () => {
    return (
      <div>
        <h3>Institution Dashboard</h3>
        <p>Welcome to your institution portal</p>
        <div className="overview-grid">
          <div className="stat-card">
            <h3>0</h3>
            <p>Sponsored Students</p>
          </div>
          <div className="stat-card">
            <h3>0</h3>
            <p>Available Tutors</p>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    const userRole = user.role?.toLowerCase();
    
    if (userRole === 'admin') {
      if (activeTab === 'subjectManagement' || activeTab === 'subjects') {
        return <SubjectManagement />;
      }
      return renderAdminContent();
    }
    if (userRole === 'tutor') {
      switch (activeTab) {
        case 'overview':
          return renderTutorContent();
        case 'profile':
          return renderTutorProfileEditor();
        default:
          return renderTutorContent();
      }
    }
  
    if (userRole === 'institution') {
      return renderInstitutionContent();
    }
  
    return <div>Unknown role: {user.role}</div>;
  };
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>MentorMeet</h1>
          <div className="tab-container">
            {user.role?.toLowerCase() === 'admin' ? (
              <>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('subjectManagement')}
                  className={`tab-button ${activeTab === 'subjectManagement' ? 'active' : ''}`}
                >
                  Subject Management
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                >
                  Profile
                </button>
              </>
            )}
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span>Welcome, {user.name}</span>
            <div className="user-role">{user.role}</div>
          </div>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="tab-content">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}
export default Dashboard;