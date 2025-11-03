import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [pendingTutors, setPendingTutors] = useState([]);
  const [verifiedTutors, setVerifiedTutors] = useState([]);
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, pageSize: 20, totalPages: 1, totalCount: 0 });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userStatusFilter, setUserStatusFilter] = useState('All');
  const [tutorSearch, setTutorSearch] = useState('');
  const [tutorProfile, setTutorProfile] = useState({ hourlyRate: '', subjects: '' });
  const [profileSaved, setProfileSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toFileUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const trimmed = String(path).startsWith('/') ? path.slice(1) : String(path);
    return `http://localhost:5010/${trimmed}`;
  };

  const normalizedIncludes = (text, q) => String(text || '').toLowerCase().includes(String(q || '').toLowerCase());

  const fetchAllUsers = async (page = 1, pageSize = 20, silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const token = localStorage.getItem('mentormeet_token');
      const response = await axios.get(`http://localhost:5010/api/admin/users?page=${page}&pageSize=${pageSize}` , {
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
  };

  const toggleTutorActive = async (tutorUserId, nextActive) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('mentormeet_token');
      await axios.put(`http://localhost:5010/api/admin/users/${tutorUserId}/status`,
        { IsActive: nextActive },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setVerifiedTutors(prev => Array.isArray(prev) ? prev.map(t => t.userId === tutorUserId ? { ...t, isActive: nextActive } : t) : prev);
      setData(prev => Array.isArray(prev) ? prev.map(t => t.userId === tutorUserId ? { ...t, isActive: nextActive } : t) : prev);
      await fetchStats(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update tutor status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('User data in dashboard:', user);
  }, [user]);

  useEffect(() => {
    const role = user?.role?.toLowerCase();
    if (role === 'tutor') {
      const key = `tutor_profile_${user?.id || 'me'}`;
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          setTutorProfile({
            hourlyRate: parsed.hourlyRate ?? '',
            subjects: parsed.subjects ?? ''
          });
        }
      } catch {}
    }
  }, [user]);

  const saveTutorProfile = () => {
    const key = `tutor_profile_${user?.id || 'me'}`;
    const data = {
      hourlyRate: tutorProfile.hourlyRate,
      subjects: tutorProfile.subjects
    };
    try {
      localStorage.setItem(key, JSON.stringify(data));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 1500);
    } catch (e) {
      setError('Failed to save profile locally');
    }
  };

  const fetchPendingTutors = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      const token = localStorage.getItem('mentormeet_token');
      console.log('Fetching pending tutors with token:', token ? 'Token exists' : 'No token');
      
      const response = await axios.get('http://localhost:5010/api/admin/tutors/pending', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Pending tutors response:', response.data);
      setPendingTutors(Array.isArray(response.data) ? response.data : []);
      setData(Array.isArray(response.data) ? response.data : []);
      
    } catch (err) {
      console.error('Error fetching pending tutors:', err);
      console.error('Error response:', err.response);
      
      if (err.response?.status === 401) {
        setError('Unauthorized: Please login again');
        onLogout();
      } else if (err.response?.status === 403) {
        setError('Access denied: Admin privileges required');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to load pending tutors. Please try again.');
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
      const response = await axios.get('http://localhost:5010/api/admin/dashboard/stats', {
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
      
      const response = await axios.get('http://localhost:5010/api/admin/tutors/verified', {
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
    if (role === 'admin' && activeTab === 'totalUsers') {
      fetchAllUsers(1, 20, true);
    }
  }, [activeTab]);

  const renderAdminContent = () => {
    let mainContent = null;
    switch (activeTab) {
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
        const filteredTutors = Array.isArray(data)
          ? data.filter(t => normalizedIncludes(t.name, tutorSearch) || normalizedIncludes(t.email, tutorSearch))
          : [];
        mainContent = (
          <div>
            <h3>Verified Tutors</h3>
            <div className="row gap-10 center wrap">
              <input
                type="text"
                placeholder="Search name or email..."
                value={tutorSearch}
                onChange={(e) => setTutorSearch(e.target.value)}
                className="input-basic"
              />
              <button onClick={fetchVerifiedTutors} className="primary-btn" disabled={loading}>
                {loading ? 'Loading...' : 'Reload'}
              </button>
            </div>
            {error && <div className="error-message mt-15">{error}</div>}
            {loading && <div className="loading mt-15">Loading user data...</div>}
            {filteredTutors && filteredTutors.length > 0 && (
              <div className="mt-20">
                <h4>Verified Tutors ({filteredTutors.length})</h4>
                {filteredTutors.map(tutor => (
                  <div key={tutor.userId} className="tutor-card">
                    <p><strong>{tutor.name}</strong> - {tutor.email}</p>
                    <p>Experience: {tutor.yearofexperience} years</p>
                    <p>Hourly Rate: {tutor.hourlyRate}</p>
                    {tutor.verifiedAt && (<p>Verified on: {new Date(tutor.verifiedAt).toLocaleDateString()}</p>)}
                    {typeof tutor.isActive === 'boolean' && (<p>Status: {tutor.isActive ? 'Active' : 'Inactive'}</p>)}
                    <div className="row gap-8 wrap mt-8">
                      {toFileUrl(tutor.resumePath) && (<a className="primary-btn" href={toFileUrl(tutor.resumePath)} target="_blank" rel="noreferrer">View Resume</a>)}
                      {toFileUrl(tutor.idDocumentPath) && (<a className="primary-btn" href={toFileUrl(tutor.idDocumentPath)} target="_blank" rel="noreferrer">View ID</a>)}
                      {toFileUrl(tutor.certificationPath) && (<a className="secondary-btn" href={toFileUrl(tutor.certificationPath)} target="_blank" rel="noreferrer">View Certificate</a>)}
                      <button
                        className={tutor.isActive ? 'btn-deactivate' : 'btn-activate'}
                        onClick={() => toggleTutorActive(tutor.userId, !tutor.isActive)}
                        disabled={loading}
                      >
                        {tutor.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {Array.isArray(data) && filteredTutors.length === 0 && !loading && (
              <div style={{marginTop: '20px', textAlign: 'center', color: '#718096'}}>No verified tutors found</div>
            )}
          </div>
        );
        break;
      case 'totalUsers':
        const filteredUsers = Array.isArray(usersList)
          ? usersList.filter(u => {
              const matchText = normalizedIncludes(`${u.FirstName} ${u.LastName}`, userSearch) || normalizedIncludes(u.Email, userSearch);
              const matchRole = userRoleFilter === 'All' ? true : (Array.isArray(u.Roles) ? u.Roles.includes(userRoleFilter) : (u.UserType === userRoleFilter));
              const matchStatus = userStatusFilter === 'All' ? true : (userStatusFilter === 'Active' ? u.IsActive === true : u.IsActive === false);
              return matchText && matchRole && matchStatus;
            })
          : [];
        mainContent = (
          <div>
            <h3>Total Users</h3>
            <div className="grid-gap-16">
              <div className="row gap-10 wrap center space-between">
                <p className="muted" style={{fontSize:'16px'}}>Total: {usersPagination.totalCount ?? stats?.totalUsers ?? 0}</p>
                <div className="row gap-10 wrap">
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="input-basic"
                  />
                  <select value={userRoleFilter} onChange={(e)=>setUserRoleFilter(e.target.value)} className="input-basic">
                    <option>All</option>
                    <option>Student</option>
                    <option>Parent</option>
                    <option>Tutor</option>
                    <option>Institution</option>
                    <option>Admin</option>
                  </select>
                  <select value={userStatusFilter} onChange={(e)=>setUserStatusFilter(e.target.value)} className="input-basic">
                    <option>All</option>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                  <button onClick={() => fetchAllUsers(usersPagination.page, usersPagination.pageSize)} className="primary-btn" disabled={loading}>
                    {loading ? 'Loading...' : 'Reload'}
                  </button>
                </div>
              </div>
            </div>
            {error && <div className="error-message mt-10">{error}</div>}

            <div className="mt-16 grid-gap-8">
              {filteredUsers.map(u => (
                <div key={u.Id} className="tutor-card row space-between center">
                  <div>
                    <div style={{fontWeight:600, color:'#1f2937'}}>{u.FirstName} {u.LastName}</div>
                    <div className="muted" style={{fontSize:'0.9rem'}}>{u.Email}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div className="muted" style={{fontSize:'0.85rem'}}>{Array.isArray(u.Roles) && u.Roles.length ? u.Roles.join(', ') : (u.UserType || 'User')}</div>
                    {typeof u.IsActive === 'boolean' && <div style={{fontSize:'0.85rem', color: u.IsActive ? '#059669' : '#b91c1c'}}>{u.IsActive ? 'Active' : 'Inactive'}</div>}
                  </div>
                </div>
              ))}
            </div>

            {usersPagination.totalPages > 1 && (
              <div className="row gap-8" style={{justifyContent:'center', marginTop:'12px'}}>
                <button
                  className="primary-btn"
                  onClick={() => fetchAllUsers(Math.max(1, usersPagination.page - 1), usersPagination.pageSize)}
                  disabled={loading || usersPagination.page <= 1}
                >
                  Prev
                </button>
                <div style={{alignSelf:'center', color:'#718096'}}>Page {usersPagination.page} of {usersPagination.totalPages}</div>
                <button
                  className="primary-btn"
                  onClick={() => fetchAllUsers(Math.min(usersPagination.totalPages, usersPagination.page + 1), usersPagination.pageSize)}
                  disabled={loading || usersPagination.page >= usersPagination.totalPages}
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
            <h3>Active Users</h3>
            <p style={{fontSize:'28px', fontWeight:600}}>{stats?.activeUsers ?? 0}</p>
          </div>
        );
        break;
      default:
        mainContent = (
          <div>
            <h3>Welcome, Admin</h3>
          </div>
        );
    }

    return (
      <div style={{display:'flex', gap:'16px'}}>
        <aside style={{width:'260px', borderRight:'1px solid #e2e8f0', paddingRight:'12px'}}>
          <h4>Admin</h4>
          <nav style={{display:'grid', gap:'8px', marginTop:'10px'}}>
            <button className={activeTab==='verifications'?'active':''} onClick={() => { setActiveTab('verifications'); fetchPendingTutors(true); }}>
              Pending Tutors ({(stats?.pendingTutors ?? pendingTutors.length) || 0})
            </button>
            <button className={activeTab==='users'?'active':''} onClick={() => { setActiveTab('users'); fetchVerifiedTutors(true); }}>
              Verified Tutors ({(stats?.verifiedTutors ?? verifiedTutors.length) || 0})
            </button>
            <button className={activeTab==='totalUsers'?'active':''} onClick={() => { setActiveTab('totalUsers'); fetchStats(true); }}>
              Total Users ({stats?.totalUsers ?? 0})
            </button>
            <button className={activeTab==='activeUsers'?'active':''} onClick={() => { setActiveTab('activeUsers'); fetchStats(true); }}>
              Active Sessions ({stats?.activeUsers ?? 0})
            </button>
          </nav>
        </aside>
        <section style={{flex:1}}>
          {mainContent}
        </section>
      </div>
    );
  };

  const renderTutorProfileEditor = () => {
    return (
      <div>
        <h3>Edit Profile</h3>
        {profileSaved && (<div className="loading mt-10">Saved</div>)}
        <div className="grid-gap-16" style={{maxWidth:'520px'}}>
          <div>
            <label style={{display:'block', fontWeight:600, marginBottom:6, color:'#4a5568'}}>Hourly Rate (ETB)</label>
            <input
              type="number"
              min="0"
              step="50"
              value={tutorProfile.hourlyRate}
              onChange={(e)=> setTutorProfile(p=>({...p, hourlyRate: e.target.value }))}
              placeholder="e.g. 500"
              className="input-basic"
              style={{ width:'100%' }}
            />
          </div>
          <div>
            <label style={{display:'block', fontWeight:600, marginBottom:6, color:'#4a5568'}}>Subjects (comma-separated)</label>
            <input
              type="text"
              value={tutorProfile.subjects}
              onChange={(e)=> setTutorProfile(p=>({...p, subjects: e.target.value }))}
              placeholder="Math, Physics, Chemistry"
              className="input-basic"
              style={{ width:'100%' }}
            />
            <div className="muted mt-8" style={{fontSize:'0.9rem'}}>
              Preview: {tutorProfile.subjects ? tutorProfile.subjects.split(',').map(s=>s.trim()).filter(Boolean).join(', ') : '—'}
            </div>
          </div>
          <div className="row gap-8">
            <button className="primary-btn" onClick={saveTutorProfile} disabled={loading}>Save</button>
          </div>
        </div>
      </div>
    );
  };

  const renderTutorContent = () => {
    const hourly = (tutorProfile.hourlyRate && String(tutorProfile.hourlyRate).trim())
      ? tutorProfile.hourlyRate
      : (user?.hourlyRate ?? user?.HourlyRate ?? user?.tutorProfile?.hourlyRate ?? user?.TutorProfile?.HourlyRate ?? '');
    const rawSubjects = (tutorProfile.subjects && String(tutorProfile.subjects).trim())
      ? tutorProfile.subjects
      : (user?.subjects ?? user?.Subjects ?? user?.tutorProfile?.subjects ?? user?.TutorProfile?.Subjects ?? '');
    const subjectsList = Array.isArray(rawSubjects)
      ? rawSubjects.map(s => String(s).trim()).filter(Boolean)
      : (typeof rawSubjects === 'string' && rawSubjects.trim() ? rawSubjects.split(',').map(s => s.trim()).filter(Boolean) : []);
    const subjectsCount = subjectsList.length;
    return (
      <div>
        <h3>Tutor Dashboard</h3>

        <div className="overview-grid">
          <div className="stat-card">
            <h3>{user?.name || 'Tutor'}</h3>
            <p>{user?.email}</p>
          </div>
          <div className="stat-card">
            <h3>{hourly ? `${hourly} ETB` : '—'}</h3>
            <p>Hourly Rate</p>
          </div>
          <div className="stat-card">
            <h3>{subjectsCount}</h3>
            <p>Subjects</p>
          </div>
        </div>
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
    
    switch (userRole) {
      case 'admin': return renderAdminContent();
      case 'tutor': return activeTab === 'profile' ? renderTutorProfileEditor() : renderTutorContent();
      case 'institution': return renderInstitutionContent();
      default: return <div>Unknown role: {user.role}</div>;
    }
  };

  const userRole = user.role?.toLowerCase();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>MentorMeet</h1>
          <nav className="main-nav">
            <button className={activeTab === 'overview' ? 'active' : ''} 
                    onClick={() => setActiveTab('overview')}>
              Overview
            </button>
            {userRole === 'admin' && (
              <>
                <button className={activeTab === 'verifications' ? 'active' : ''} 
                        onClick={() => setActiveTab('verifications')}>
                  Verifications
                </button>
                <button className={activeTab === 'users' ? 'active' : ''} 
                        onClick={() => setActiveTab('users')}>
                  Users
                </button>
              </>
            )}
            <button className={activeTab === 'profile' ? 'active' : ''} 
                    onClick={() => setActiveTab('profile')}>
              Profile
            </button>
          </nav>
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
        <div className="content-header">
          <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
        </div>

        <div className="tab-content">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;