import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../styles/Dashboard.css';
import { API_BASE_URL } from '../../config';
import { getAuthToken, isAuthenticated, removeAuthToken } from '../../utils/auth';
import SubjectManagement from '../Admin/SubjectManagement';
import TutorPage from '../Tutor/TutorPage';
import TutorAvailability from '../Tutor/TutorAvailability';
import TutorBookings from '../Tutor/TutorBookings';
const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [userRole, setUserRole] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  useEffect(() => {
    if (user) {
      setUserRole((user.role || '').toLowerCase());
      setIsInitializing(false);
    }
  }, [user]);
  
  const [userStatusFilter, setUserStatusFilter] = useState('All');
  const [userSearch, setUserSearch] = useState('');
  const [pendingTutors, setPendingTutors] = useState([]);
  const [verifiedTutors, setVerifiedTutors] = useState([]);
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ 
    page: 1, 
    pageSize: 20, 
    totalPages: 1, 
    totalCount: 0 
  });
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
    return `/api/${trimmed}`;
  };
  // Function to toggle user active status
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('mentormeet_token');
      const newStatus = !currentStatus;
      
      console.log('Toggling status for user:', userId, 'Current status:', currentStatus, 'New status:', newStatus);
      
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/users/${userId}/status`,
        { isActive: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Status update response:', response.data);
      
      setUsersList(usersList.map(user => {
        const matchesId = user.id === userId || user.Id === userId || user.userId === userId || user.UserId === userId;
        if (matchesId) {
          console.log('Updating user in state:', user.id, 'New status:', newStatus);
          return {
            ...user,
            isActive: newStatus,
            IsActive: newStatus
          };
        }
        return user;
      }));
      
      fetchAllUsers(usersPagination.page, usersPagination.pageSize, true);
      
    } catch (err) {
      console.error('Error updating user status:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
      setError('Failed to update user status: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async (page = 1, pageSize = 20, silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const token = sessionStorage.getItem('mentormeet_token');
    
      const response = await axios.get(`${API_BASE_URL}/api/admin/users?page=${page}&pageSize=${pageSize}&excludeRole=Admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const { users, pagination } = response.data || {};
      
      console.log('Fetched users:', users);
      
      setUsersList(Array.isArray(users) ? users.map(user => ({
        ...user,
        firstName: user.firstName || user.FirstName || '',
        lastName: user.lastName || user.LastName || '',
        email: user.email || user.Email || 'N/A',
        isActive: user.isActive ?? user.IsActive ?? true,
        id: user.id || user.Id || user.userId || user.UserId
      })) : []);
      
      if (pagination) {
        setUsersPagination({
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages: pagination.totalPages,
          totalCount: pagination.totalCount
        });
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users list');
    } finally {
      if (!silent) setLoading(false);
    }
  };  useEffect(() => {
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
      const token = sessionStorage.getItem('mentormeet_token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      console.log(`Fetching tutor profile from ${API_BASE_URL}/api/tutor/profile`);
      
      const response = await axios.get(
        `${API_BASE_URL}/api/tutor/profile`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      const profile = response.data?.data || response.data; 
       console.log('Fetched tutor profile:', profile);
      
      let gradeLevels = [];
      if (profile.gradeLevels) {
        gradeLevels = Array.isArray(profile.gradeLevels) 
          ? profile.gradeLevels 
          : String(profile.gradeLevels).split(',').filter(Boolean);
      } else if (profile.GradeLevels) {
        gradeLevels = Array.isArray(profile.GradeLevels)
          ? profile.GradeLevels
          : String(profile.GradeLevels).split(',').filter(Boolean);
      }
      
      let subjectIds = [];
      if (profile.subjectIds) {
        subjectIds = Array.isArray(profile.subjectIds) 
          ? profile.subjectIds.map(id => Number(id)).filter(id => !isNaN(id))
          : [];
      } else if (profile.Subjects) {
        const subjects = Array.isArray(profile.Subjects) ? profile.Subjects : [];
        subjectIds = subjects
          .map(s => s.subjectId || s.SubjectId)
          .filter(id => id !== undefined && id !== null)
          .map(Number)
          .filter(id => !isNaN(id));
      }
      
      const initialProfile = {
        firstName: user?.firstName || profile.firstName || profile.FirstName || '',
        lastName: user?.lastName || profile.lastName || profile.LastName || '',
        hourlyRate: profile.hourlyRate || profile.HourlyRate || '',
        bio: profile.bio || profile.Bio || '',
        yearsofExperience: profile.yearsofExperience || profile.YearofExperience || 0,
        subjectIds: subjectIds,
        gradeLevels: gradeLevels,
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
    if (!isAuthenticated()) {
      console.error('User not authenticated. Redirecting to login...');
      removeAuthToken();
      navigate('/login');
      return;
    }

    const role = user?.role?.toLowerCase();
    if (role === 'tutor') {
      fetchTutorProfile();
      fetchAvailableSubjects();
    }
  }, [user, navigate]);

const fetchAvailableSubjects = async () => {
  try {
    setLoading(true);
    setError('');
    
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }

    
    const subjectsResponse = await axios.get(
      `${API_BASE_URL}/api/tutor/subjects`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('Subjects API Response:', subjectsResponse.data);

    let subjectsData = [];
    if (Array.isArray(subjectsResponse.data)) {
      subjectsData = subjectsResponse.data;
    } else if (subjectsResponse.data && Array.isArray(subjectsResponse.data.subjects)) {
      subjectsData = subjectsResponse.data.subjects;
    } else if (subjectsResponse.data && subjectsResponse.data.data && Array.isArray(subjectsResponse.data.data)) {
      subjectsData = subjectsResponse.data.data;
    }

    const processedSubjects = subjectsData
      .filter(subject => subject && (subject.SubjectId || subject.id) && (subject.Name || subject.name))
      .map(subject => ({
        subjectId: subject.SubjectId || subject.id,
        name: subject.Name || subject.name,
        category: subject.Category || subject.category || 'Uncategorized'
      }));
    
    console.log('Processed subjects:', processedSubjects);
    setAvailableSubjects(processedSubjects);
    try {
      const profileResponse = await axios.get(
        `${API_BASE_URL}/api/tutor/profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      const tutorSubjects = profileResponse?.data?.Subjects || profileResponse?.data?.subjects || [];
      if (tutorSubjects.length > 0) {
        const selectedSubjectIds = tutorSubjects
          .filter(subject => subject && (subject.SubjectId || subject.id))
          .map(subject => subject.SubjectId || subject.id);
        
        setTutorProfile(prev => ({
          ...prev,
          subjectIds: selectedSubjectIds
        }));
      }
    } catch (profileErr) {
      console.error('Error fetching tutor profile:', profileErr);
    }
  } catch (err) {
    console.error('Error in fetchAvailableSubjects:', err);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
  } finally {
    setLoading(false);
  }
};
  const saveTutorProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getAuthToken();
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        navigate('/login');
        return;
      }
      const requiredFields = {
        hourlyRate: tutorProfile.hourlyRate,
        subjectIds: tutorProfile.subjectIds?.length > 0
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([field]) => field);

      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }
      const currentProfile = { ...tutorProfile };
      
      const subjectIds = (tutorProfile.subjectIds || [])
        .map(id => Number(id))
        .filter(id => !isNaN(id));
      const gradeLevels = Array.isArray(tutorProfile.gradeLevels)
        ? tutorProfile.gradeLevels.join(',')
        : (tutorProfile.gradeLevels || '');
      const data = new FormData();
      data.append('bio', tutorProfile.bio || currentProfile.bio || '');
      data.append('teachingStyle', tutorProfile.teachingStyle || currentProfile.teachingStyle || '');
      data.append('yearofExperience', 
        (tutorProfile.yearsofExperience !== undefined 
          ? tutorProfile.yearsofExperience 
          : currentProfile.yearsofExperience || 0).toString()
      );
      data.append('hourlyRate', 
        (tutorProfile.hourlyRate !== undefined 
          ? parseFloat(tutorProfile.hourlyRate) 
          : parseFloat(currentProfile.hourlyRate) || 0)
      );
       const finalSubjectIds = subjectIds.length > 0 
        ? subjectIds 
        : (currentProfile.subjectIds || []).map(id => Number(id)).filter(id => !isNaN(id));
      
      finalSubjectIds.forEach(id => data.append('subjectIds', id));
      data.append('gradeLevels', 
        gradeLevels || 
        (Array.isArray(currentProfile.gradeLevels) 
          ? currentProfile.gradeLevels.join(',') 
          : currentProfile.gradeLevels || '')
      );
      
      console.log('Sending profile data to server:', JSON.stringify(data, null, 2));
      const response = await axios.put(
        `${API_BASE_URL}/api/tutor/profile`,
        data,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 10000 
        }
      );
      
      console.log('Profile saved successfully:', response.data);
      const savedProfile = response.data?.data || response.data;
      const getGradeLevels = (profile) => {
        if (profile.gradeLevels) {
          return Array.isArray(profile.gradeLevels) 
            ? profile.gradeLevels 
            : String(profile.gradeLevels).split(',').filter(Boolean);
        }
        if (profile.GradeLevels) {
          return Array.isArray(profile.GradeLevels)
            ? profile.GradeLevels
            : String(profile.GradeLevels).split(',').filter(Boolean);
        }
        return [];
      };
       const getSubjectIds = (profile) => {
        if (profile.subjectIds) {
          return Array.isArray(profile.subjectIds) 
            ? profile.subjectIds.map(id => Number(id)).filter(id => !isNaN(id))
            : [];
        }
        if (profile.Subjects) {
          const subjects = Array.isArray(profile.Subjects) ? profile.Subjects : [];
          return subjects
            .map(s => s.subjectId || s.SubjectId)
            .filter(id => id !== undefined && id !== null)
            .map(Number)
            .filter(id => !isNaN(id));
        }
        return [];
      };
      setTutorProfile(prev => {
        const updated = {
          ...prev,
          hourlyRate: savedProfile.hourlyRate || savedProfile.HourlyRate || prev.hourlyRate || '',
          bio: savedProfile.bio || savedProfile.Bio || prev.bio || '',
          yearsofExperience: savedProfile.yearsofExperience || savedProfile.YearofExperience || prev.yearsofExperience || 0,
          teachingStyle: savedProfile.teachingStyle || savedProfile.TeachingStyle || prev.teachingStyle || '',
          
          ...(savedProfile.gradeLevels || savedProfile.GradeLevels ? {
            gradeLevels: getGradeLevels(savedProfile)
          } : {}),
          ...((savedProfile.subjectIds || savedProfile.Subjects) ? {
            subjectIds: getSubjectIds(savedProfile)
          } : {})
        };
        
        console.log('Updated tutor profile state:', updated);
        return updated;
      });
      
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      console.error('Error saving tutor profile:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
      const errorMessage = err.response?.data?.message || 'Failed to save profile.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingTutors = async (silent = false) => {
    const token = sessionStorage.getItem('mentormeet_token');
    
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
      
      const response = await axios.get(`${API_BASE_URL}/api/admin/tutors/pending`, {
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
      const token = sessionStorage.getItem('mentormeet_token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/dashboard/stats`, {
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
      const token = sessionStorage.getItem('mentormeet_token');
      await axios.post(`${API_BASE_URL}/api/admin/tutors/verify/${tutorUserId}`, null, {
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
      const token = sessionStorage.getItem('mentormeet_token');
      console.log('=== DEBUG VERIFIED TUTORS REQUEST ===');
      console.log('Token exists:', !!token);
      console.log('User role:', user.role);
      console.log('Full user object:', user);
      
      const response = await axios.get(`${API_BASE_URL}/api/Admin/tutors/verified`, {
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
      
      const matchesSearch = 
        !userSearch || 
        (user.firstName?.toLowerCase().includes(userSearch.toLowerCase())) ||
        (user.lastName?.toLowerCase().includes(userSearch.toLowerCase())) ||
        (user.email?.toLowerCase().includes(userSearch.toLowerCase()));
        
      const matchesRole = 
        userRoleFilter === 'All' || 
        (Array.isArray(user.Roles) 
          ? user.Roles.includes(userRoleFilter)
          : user.UserType === userRoleFilter);
          
      const matchesStatus = 
        userStatusFilter === 'All' ||
        (userStatusFilter === 'Active' && user.isActive) ||
        (userStatusFilter === 'Inactive' && !user.isActive);
      
      return !isAdmin && matchesSearch && matchesRole && matchesStatus;
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
          <div className="users-management">
            <h2 className="section-title">Pending Tutor Verifications</h2>
            {error && <div className="error-message">{error}</div>}
            {loading && <div className="loading">Loading tutor data...</div>}
            
            {data && data.length > 0 ? (
              <div className="table-responsive" style={{ width: '100%', overflowX: 'auto' }}>
                <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>#</th>
                      <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Contact</th>
                      <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Details</th>
                      <th style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Documents</th>
                      <th style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((tutor, index) => (
                      <tr key={tutor.userId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            backgroundColor: '#f7fafc',
                            border: '1px solid #e2e8f0',
                            minWidth: '40px',
                            textAlign: 'center'
                          }}>
                            {index + 1}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            borderRadius: '16px',
                            backgroundColor: '#f7fafc',
                            border: '1px solid #e2e8f0',
                            color: '#2d3748',
                            fontWeight: '500'
                          }}>
                            {tutor.name || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '6px 12px',
                              borderRadius: '16px',
                              backgroundColor: '#f7fafc',
                              border: '1px solid #e2e8f0',
                              color: '#4a5568',
                              fontSize: '0.9em'
                            }}>
                              {tutor.email || 'N/A'}
                            </span>
                            {tutor.phoneNumber && (
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                backgroundColor: '#f0f9ff',
                                border: '1px solid #e0f2fe',
                                color: '#0369a1',
                                fontSize: '0.85em',
                                width: 'fit-content'
                              }}>
                                {tutor.phoneNumber}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              backgroundColor: '#f0fdf4',
                              border: '1px solid #dcfce7',
                              color: '#166534',
                              fontSize: '0.85em',
                              width: 'fit-content'
                            }}>
                              {tutor.yearofexperience || '0'} years exp
                            </span>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              backgroundColor: '#fef2f2',
                              border: '1px solid #fee2e2',
                              color: '#991b1b',
                              fontSize: '0.85em',
                              width: 'fit-content'
                            }}>
                              ${tutor.hourlyRate || '0'}/hr
                            </span>
                            {tutor.gender && (
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                backgroundColor: '#eff6ff',
                                border: '1px solid #dbeafe',
                                color: '#1e40af',
                                fontSize: '0.85em',
                                width: 'fit-content'
                              }}>
                                {tutor.gender}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {toFileUrl(tutor.resumePath) && (
                              <a 
                                href={toFileUrl(tutor.resumePath)} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '4px 12px',
                                  borderRadius: '16px',
                                  backgroundColor: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  color: '#334155',
                                  fontSize: '0.85em',
                                  textDecoration: 'none',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    backgroundColor: '#f1f5f9',
                                    transform: 'translateY(-1px)'
                                  }
                                }}
                              >
                                📄 Resume
                              </a>
                            )}
                            {toFileUrl(tutor.idDocumentPath) && (
                              <a 
                                href={toFileUrl(tutor.idDocumentPath)} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '4px 12px',
                                  borderRadius: '16px',
                                  backgroundColor: '#f0f9ff',
                                  border: '1px solid #e0f2fe',
                                  color: '#0369a1',
                                  fontSize: '0.85em',
                                  textDecoration: 'none',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    backgroundColor: '#e0f2fe',
                                    transform: 'translateY(-1px)'
                                  }
                                }}
                              >
                                🆔 ID
                              </a>
                            )}
                            {toFileUrl(tutor.certificationPath) && (
                              <a 
                                href={toFileUrl(tutor.certificationPath)} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '4px 12px',
                                  borderRadius: '16px',
                                  backgroundColor: '#f0fdf4',
                                  border: '1px solid #dcfce7',
                                  color: '#166534',
                                  fontSize: '0.85em',
                                  textDecoration: 'none',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    backgroundColor: '#dcfce7',
                                    transform: 'translateY(-1px)'
                                  }
                                }}
                              >
                              </a>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => verifyTutor(tutor.userId)}
                            disabled={loading}
                            style={{
                              padding: '8px 20px',
                              borderRadius: '20px',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: '500',
                              background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                              color: 'white',
                              opacity: loading ? 0.7 : 1,
                              pointerEvents: loading ? 'none' : 'auto',
                              transition: 'all 0.3s ease',
                              minWidth: '110px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              fontSize: '0.9em',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                              },
                              '&:active': {
                                transform: 'translateY(0)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }
                            }}
                          >
                            {loading ? 'Verifying...' : 'Verify Tutor'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{
                marginTop: '20px', 
                padding: '40px 20px',
                textAlign: 'center', 
                color: '#64748b',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px dashed #e2e8f0'
              }}>
                No pending tutor verifications at the moment
              </div>
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
          <div className="users-management">
            <h2 className="section-title">User Management</h2>
            
            <div className="users-filters">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
              
              <div className="filter-group">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All Roles</option>
                  <option value="Student">Student</option>
                  <option value="Tutor">Tutor</option>
                  <option value="Admin">Admin</option>
                </select>
                
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="table-responsive" style={{ width: '100%', overflowX: 'auto' }}>
              <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Role</th>
                    <th style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                    <th style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            backgroundColor: '#f7fafc',
                            border: '1px solid #e2e8f0',
                            minWidth: '40px',
                            textAlign: 'center'
                          }}>
                            {index + 1}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            borderRadius: '16px',
                            backgroundColor: '#f7fafc',
                            border: '1px solid #e2e8f0',
                            color: '#2d3748',
                            fontWeight: '500'
                          }}>
                            {user.firstName || user.FirstName || 'No Name'} {user.lastName || user.LastName || ''}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            borderRadius: '16px',
                            backgroundColor: '#f7fafc',
                            border: '1px solid #e2e8f0',
                            color: '#4a5568',
                            fontSize: '0.95em'
                          }}>
                            {user.email || user.Email || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: '#e2e8f0',
                            color: '#1a365d',
                            display: 'inline-block',
                            minWidth: '60px'
                          }}>
                            {Array.isArray(user.Roles) && user.Roles.length > 0 
                              ? user.Roles[0] 
                              : (user.UserType || 'User')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: (user.isActive || user.IsActive) ? '#c6f6d5' : '#fed7d7',
                            color: (user.isActive || user.IsActive) ? '#22543d' : '#822727',
                            display: 'inline-block',
                            minWidth: '60px'
                          }}>
                            {(user.isActive || user.IsActive) ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px' }}>
                          <button
                            style={{
                              padding: '8px 20px',
                              borderRadius: '20px',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: '500',
                              background: (user.isActive || user.IsActive) 
                                ? 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)' 
                                : 'linear-gradient(135deg, #48bb78 0%, #2f855a 100%)',
                              color: 'white',
                              opacity: loading ? 0.7 : 1,
                              pointerEvents: loading ? 'none' : 'auto',
                              transition: 'all 0.3s ease',
                              minWidth: '110px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              fontSize: '0.9em',
                              letterSpacing: '0.5px',
                              textTransform: 'capitalize',
                              position: 'relative',
                              overflow: 'hidden',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                                '&::after': {
                                  opacity: 1
                                }
                              },
                              '&:active': {
                                transform: 'translateY(0)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              },
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(255,255,255,0.2)',
                                opacity: 0,
                                transition: 'opacity 0.3s ease'
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const userId = user.id || user.Id || user.userId || user.UserId;
                              const currentStatus = user.isActive || user.IsActive;
                              console.log('Button clicked - User ID:', userId, 'Current status:', currentStatus);
                              toggleUserStatus(userId, currentStatus);
                            }}
                            disabled={loading}
                          >
                            {(user.isActive || user.IsActive) ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                        {loading ? 'Loading users...' : 'No users found matching your criteria'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {usersPagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => fetchAllUsers(usersPagination.page - 1, usersPagination.pageSize)}
                  disabled={usersPagination.page <= 1 || loading}
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, usersPagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (usersPagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (usersPagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (usersPagination.page >= usersPagination.totalPages - 2) {
                    pageNum = usersPagination.totalPages - 4 + i;
                  } else {
                    pageNum = usersPagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchAllUsers(pageNum, usersPagination.pageSize)}
                      className={usersPagination.page === pageNum ? 'active' : ''}
                      disabled={loading}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => fetchAllUsers(usersPagination.page + 1, usersPagination.pageSize)}
                  disabled={usersPagination.page >= usersPagination.totalPages || loading}
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
        const currentSubjects = Array.isArray(prev.subjectIds) ? prev.subjectIds : [];
        const subjectIdNum = Number(subjectId);
        
        const newSubjects = currentSubjects.includes(subjectIdNum)
          ? currentSubjects.filter(id => id !== subjectIdNum)
          : [...currentSubjects, subjectIdNum];
        
        console.log('Toggling subject:', { subjectId, currentSubjects, newSubjects });
        
        return {
          ...prev,
          subjectIds: newSubjects
        };
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
                <label>First Name</label>
                <input
                  type="text"
                  value={user?.firstName || ''}
                  disabled
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={user?.lastName || ''}
                  disabled
                  className="form-input"
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
                      {tutorProfile.subjectIds?.map(subjectId => {
                        const subject = availableSubjects.find(s => s.subjectId === subjectId);
                        return subject ? (
                          <span key={`selected-${subjectId}`} className="subject-tag">
                            {subject.name}
                            <span 
                              className="remove-subject"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSubject(subjectId);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleSubject(subjectId);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              aria-label={`Remove ${subject.name}`}
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
                    {availableSubjects.length > 0 ? (
                      availableSubjects.map((subject) => {
                        if (!subject || !subject.subjectId) return null;
                        
                        const subjectId = subject.subjectId;
                        const isSelected = tutorProfile.subjectIds?.includes(subjectId);
                        const displayName = subject.name + (subject.category ? ` (${subject.category})` : '');
                        
                        return (
                          <div
                            key={`subject-${subjectId}`}
                            className={`dropdown-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleSubject(subjectId)}
                            title={displayName}
                          >
                            {displayName}
                            {isSelected && <span className="checkmark">✓</span>}
                          </div>
                        );
                      })
                    ) : (
                      <div className="dropdown-item disabled">No subjects available</div>
                    )}
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
    
    if (!userRole) {
      return (
        <div className="alert alert-warning">
          Unable to determine user role. Please try refreshing the page or contact support.
        </div>
      );
    }
    
    if (userRole === 'admin') {
      if (activeTab === 'subjectManagement' || activeTab === 'subjects') {
        return <SubjectManagement />;
      }
      return renderAdminContent();
    }
    if (userRole === 'tutor') {
      switch (activeTab) {
        case 'tutor-dashboard':
          return renderTutorContent();
        case 'profile':
          return renderTutorProfileEditor();
        case 'tutor-materials':
          return (
            <div className="materials-tab">
              <TutorPage />
            </div>
          );
        case 'tutor-bookings':
          return <TutorBookings />;
        case 'tutor-availability':
          return <TutorAvailability />;
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
                <div className="tabs">
                  {userRole === 'tutor' ? (
                    <>
                      <button 
                        className={`tab-button ${activeTab === 'tutor-dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tutor-dashboard')}
                      >
                        <i className="fas fa-tachometer-alt"></i> Overview
                      </button>
                      <button 
                        className={`tab-button ${activeTab === 'tutor-materials' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tutor-materials')}
                      >
                        <i className="fas fa-book"></i> Materials
                      </button>
                      <button 
                        className={`tab-button ${activeTab === 'tutor-bookings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tutor-bookings')}
                      >
                        <i className="fas fa-calendar-check"></i> Bookings
                      </button>
                      <button 
                        className={`tab-button ${activeTab === 'tutor-availability' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tutor-availability')}
                      >
                        <i className="fas fa-calendar-alt"></i> Availability
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    >
                      Overview
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                  >
                    Profile
                  </button>
                </div>
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