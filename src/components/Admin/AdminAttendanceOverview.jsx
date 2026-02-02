import React, { useState, useEffect, useCallback } from 'react';
import { searchAttendance, getAdminAttendanceSummary as getAttendanceSummary, getTutorsForAttendance, getStudentsForAttendance } from '../../services/attendanceService';
import { format, parseISO, subDays } from 'date-fns';
import { 
  FaSearch, 
  FaCalendarAlt, 
  FaSync, 
  FaExclamationTriangle, 
  FaEye, 
  FaUserGraduate, 
  FaChalkboardTeacher,
  FaClock,
  FaBook,
  FaUsers,
  FaStickyNote,
  FaInfoCircle
} from 'react-icons/fa';
import '../../styles/AdminAttendance.css';

const AdminAttendanceOverview = () => {
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);
  
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    status: '',
    role: '',
    userId: ''
  });
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString || 'N/A';
    }
  };

  const formatTime = (timeString) => {
    try {
      return format(parseISO(timeString), 'h:mm a');
    } catch (e) {
      return timeString || 'N/A';
    }
  };
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
      return format(parseISO(dateTimeString), 'MMM dd, yyyy h:mm a');
    } catch (e) {
      return dateTimeString;
    }
  };
  const getMarkedBy = (record) => {
    const markers = [];
    if (record.tutorMarkedAt) markers.push('Tutor');
    if (record.studentMarkedAt) markers.push('Student');
    if (markers.length === 0) return 'None';
    return markers.join(' & ');
  };
   const hasActualConflict = (record) => {
    const bothMarked = record.tutorMarkedAt && record.studentMarkedAt;
    
    if (!bothMarked) return false;
    
    const marksDiffer = record.tutorMarkedPresent !== record.studentMarkedPresent;
    
    console.log('Conflict check for record:', {
      id: record.id,
      tutorMarked: record.tutorMarkedPresent,
      studentMarked: record.studentMarkedPresent,
      tutorMarkedAt: record.tutorMarkedAt,
      studentMarkedAt: record.studentMarkedAt,
      bothMarked,
      marksDiffer,
      hasConflict: marksDiffer
    });
    
    return marksDiffer;
  };
  
  const hasStudentMarked = (record) => {
    return record.studentMarkedPresent !== undefined;
  };
  const getStatusBadgeClass = (status) => {
    if (!status) return 'bg-warning text-dark';
    
    const statusLower = status.toString().toLowerCase().replace(/\s+/g, '');
    
    switch (statusLower) {
      case 'present':
        return 'bg-success';
      case 'absent':
        return 'bg-danger';
      case 'pending':
        return 'bg-warning text-dark';
      case 'disputed':
        return 'bg-danger';
      case 'noshow':
      case 'noshows':  
        return 'bg-danger';
      default:
        console.warn(`Unexpected status value: "${status}", defaulting to Pending`);
        return 'bg-warning text-dark';
    }
  };

  const fetchSummaryData = useCallback(async () => {
    try {
      const summaryData = await getAttendanceSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching summary data:', error);
      setError('Failed to load summary data. Please try again later.');
    }
  }, []);

  const fetchAttendanceData = useCallback(async (applyFilters = true) => {
    try {
      setLoading(true);
      setError('');
      const requestData = {
        FromDate: filters.startDate || format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        ToDate: filters.endDate || format(new Date(), 'yyyy-MM-dd'),
        Status: filters.status || undefined,
        Page: 1,
        PageSize: 100,
        HasConflict: filters.status === 'Disputed' ? true : undefined
      };

      if (filters.role) {
        if (filters.role === 'tutor' && filters.userId) {
          requestData.TutorUserId = filters.userId;
        } else if (filters.role === 'student' && filters.userId) {
          requestData.StudentUserId = filters.userId;
        } else if (filters.role === 'tutor') {
           const tutorsData = await getTutorsForAttendance();
          if (tutorsData.length > 0) {
            requestData.TutorUserIds = tutorsData.map(t => t.id).join(',');
          }
        } else if (filters.role === 'student') {
          const studentsData = await fetchStudents();
          if (studentsData.length > 0) {
            requestData.StudentUserIds = studentsData.map(s => s.id).join(',');
          }
        }
      }

      console.log('Sending request to /api/Attendance/admin/search with:', requestData);

      const attendanceResponse = await searchAttendance(requestData);
      console.log('Raw attendance response:', attendanceResponse);
      const records = Array.isArray(attendanceResponse.records) ? attendanceResponse.records : [];
      
      console.log('Processed records:', records);
      setAttendance(prevAttendance => {
        console.log('Updating attendance state with', records.length, 'records');
        return records;
      });
      const presentCount = records.filter(r => r.status === 'Present').length;
      const absentCount = records.filter(r => r.status === 'Absent').length;
      const pendingCount = records.filter(r => r.status === 'Pending').length;
      const disputedCount = records.filter(r => r.status === 'Disputed' || r.hasConflict).length;
      
      const summaryData = {
        totalSessions: records.length,
        presentSessions: presentCount,
        absentSessions: absentCount,
        pendingSessions: pendingCount,
        disputedSessions: disputedCount,
        attendancePercentage: records.length > 0 ? (presentCount / records.length) * 100 : 0
      };
      
      console.log('Updating summary with data:', summaryData);
      setSummary(prevSummary => ({
        ...prevSummary,
        ...summaryData
      }));
      
      setFiltersApplied(applyFilters);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try again.');
      setAttendance([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [filters, filtersApplied]);

  const fetchTutors = useCallback(async () => {
    try {
      const tutorsData = await getTutorsForAttendance();
      setTutors(tutorsData);
      return tutorsData;
    } catch (error) {
      console.error('Error fetching tutors:', error);
      setError('Failed to load tutors. Please try again later.');
      setTutors([]);
      return [];
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      console.log('Fetching students for attendance...');
      const studentsData = await getStudentsForAttendance();
      console.log('Fetched students:', studentsData);
      
      const validStudents = Array.isArray(studentsData) ? studentsData : [];
      setStudents(validStudents);
      
      if (validStudents.length === 0) {
        console.warn('No students found or user may not have permission');
      }
      
      return validStudents;
    } catch (error) {
      console.error('Error in fetchStudents:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError('Failed to load students. Please try again later.');
      setStudents([]);
      return [];
    }
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'role' && { userId: '' })
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      status: '',
      role: '',
      userId: ''
    });
    setFiltersApplied(false);
    fetchAttendanceData(false);
  };

  const handleResolveConflict = async (resolutionType) => {
    if (!selectedRecord) return;
    
    setIsResolving(true);
    try {
      setAttendance(prev => prev.map(record => 
        record.id === selectedRecord.id 
          ? { ...record, status: resolutionType, hasConflict: false }
          : record
      ));
      setShowConflictModal(false);
    } catch (err) {
      console.error('Error resolving conflict:', err);
      setError('Failed to resolve conflict. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchAttendanceData();
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again.');
      }
    };
    
    fetchData();
  }, [filters, fetchAttendanceData]);
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchTutors(),
          fetchStudents()
        ]);
        await fetchAttendanceData();
      } catch (error) {
        console.error('Error in initial data load:', error);
        setError('Failed to load initial data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    return () => {
    };
  }, []);

  if (loading && attendance.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  const applyFilters = (e) => {
    e?.preventDefault();
    fetchAttendanceData(true);
  };
  const resetFilters = () => {
    const newFilters = {
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      status: '',
      role: '',
      userId: '',
      hasConflict: false
    };
    
    setFilters(newFilters);
    setFiltersApplied(false);
    fetchAttendanceData(false);
  };

  const handleViewClick = (record) => {
    setSelectedRecord(record);
    if (hasActualConflict(record)) {
      setShowConflictModal(true);
      setShowViewModal(false);
    } else {
      setShowViewModal(true);
      setShowConflictModal(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Attendance Management</h2>
      
      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="filter-section">
            <div className="filter-row">
              <div className="filter-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="filter-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                />
              </div>

              {/* Status Filter */}
              <div className="filter-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="">All Statuses</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Pending">Pending</option>
                  <option value="Disputed">Disputed</option>
                  <option value="NoShow">No Show</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  name="role"
                  value={filters.role}
                  onChange={handleFilterChange}
                >
                  <option value="">Select Role</option>
                  <option value="tutor">Tutor</option>
                  <option value="student">Student</option>
                </select>
              </div>
              {filters.role && (
                <div className="filter-group">
                  <label className="form-label">
                    {filters.role === 'tutor' ? 'Select Tutor' : 'Select Student'}
                  </label>
                  <select
                    className="form-select"
                    name="userId"
                    value={filters.userId}
                    onChange={handleFilterChange}
                  >
                    <option value="">All {filters.role}s</option>
                    {(filters.role === 'tutor' ? tutors : students).map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="filter-actions">
              <button 
                type="button"
                className="btn btn-primary"
                onClick={applyFilters}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Applying...
                  </>
                ) : (
                  <>
                    <FaSearch className="me-1" /> Apply Filters
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={resetFilters}
                disabled={loading}
              >
                <FaSync className="me-1" /> Reset
              </button>
              {filtersApplied && (
                <button 
                  type="button" 
                  className="btn btn-outline-info ms-auto"
                  onClick={clearAllFilters}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
          {filtersApplied && (
            <div className="col-12 mt-2">
              <div className="alert alert-info py-2 mb-0">
                <strong>Active Filters:</strong>
                {filters.status && <span className="badge bg-primary ms-2">Status: {filters.status}</span>}
                {filters.role && <span className="badge bg-secondary ms-2">Role: {filters.role}</span>}
                {filters.userId && (
                  <span className="badge bg-info text-dark ms-2">
                    {filters.role === 'tutor' ? 'Tutor: ' : 'Student: '}
                    {(filters.role === 'tutor' 
                      ? tutors.find(t => t.id === filters.userId)?.name 
                      : students.find(s => s.id === filters.userId)?.name) || filters.userId}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {summary && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <h6 className="card-title">Total Sessions</h6>
                <h2 className="mb-0">{summary.totalSessions || 0}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body">
                <h6 className="card-title">Present</h6>
                <h2 className="mb-0">{summary.presentSessions || 0}</h2>
                <small>{summary.attendancePercentage?.toFixed(1) || 0}% of total</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-danger text-white">
              <div className="card-body">
                <h6 className="card-title">Absent</h6>
                <h2 className="mb-0">{summary.absentSessions || 0}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-dark">
              <div className="card-body">
                <h6 className="card-title">Pending</h6>
                <h2 className="mb-0">{summary.pendingSessions || 0}</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading attendance records...</p>
            </div>
          ) : attendance.length === 0 ? (
            <div className="alert alert-info mb-0">
              No attendance records found matching your criteria.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Tutor</th>
                    <th>Student</th>
                    <th>Status</th>
                    <th>Marked By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(record => (
                    <tr key={record.id} className={hasActualConflict(record) ? 'table-warning' : ''}>
                      <td>{formatDate(record.sessionDate)}</td>
                      <td>
                        {record.startTime && record.endTime 
                          ? `${formatTime(record.startTime)} - ${formatTime(record.endTime)}`
                          : 'N/A'}
                      </td>
                      <td>{record.tutorName || 'N/A'}</td>
                      <td>{record.studentName || 'N/A'}</td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className={`badge ${getStatusBadgeClass(record.status)}`}>
                            {record.status || 'N/A'}
                            {hasActualConflict(record) && <FaExclamationTriangle className="ms-1" />}
                          </span>
                          {record.status === 'Disputed' && (
                            <small className="text-muted mt-1">
                              Conflict detected
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <span>{getMarkedBy(record)}</span>
                          <small className="text-muted">
                            Tutor: {record.tutorMarkedAt ? 
                              (record.tutorMarkedPresent ? 'Present' : 'Absent') : 
                              'Not Marked'}
                            {record.tutorMarkedAt && ` at ${formatDateTime(record.tutorMarkedAt)}`}
                          </small>
                          <small className="text-muted">
                            Student: {record.studentMarkedAt ? 
                              (record.studentMarkedPresent ? 'Present' : 'Absent') : 
                              'Not Marked'}
                            {record.studentMarkedAt && ` at ${formatDateTime(record.studentMarkedAt)}`}
                          </small>
                        </div>
                      </td>
                      <td>
                        <button 
                          className={`btn btn-sm ${hasActualConflict(record) ? 'btn-warning' : 'btn-outline-primary'}`}
                          onClick={() => handleViewClick(record)}
                          title={hasActualConflict(record) ? 'Resolve attendance conflict' : 'View attendance details'}
                        >
                          <FaEye className="me-1" /> {hasActualConflict(record) ? 'Resolve' : 'View'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showViewModal && selectedRecord && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">
              {/* Header */}
              <div className="modal-header bg-gradient-primary text-white border-0">
                <div>
                  <h5 className="modal-title fw-bold">Session Attendance Details</h5>
                  <div className="d-flex align-items-center mt-1">
                    <span className={`badge ${getStatusBadgeClass(selectedRecord.status)}`}>
                      {selectedRecord.status}
                    </span>
                    {hasActualConflict(selectedRecord) && (
                      <span className="badge bg-warning text-dark ms-2">
                        <FaExclamationTriangle className="me-1" /> Conflict Detected
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowViewModal(false)}
                  aria-label="Close"
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-4">
                  <div className="col-lg-6">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-header bg-light">
                        <h6 className="mb-0 fw-bold">
                          <FaCalendarAlt className="me-2 text-primary" />
                          Session Information
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <div className="icon-circle bg-soft-primary text-primary me-3">
                              <FaCalendarAlt />
                            </div>
                            <div>
                              <div className="text-muted small">Date</div>
                              <div className="fw-medium">{formatDate(selectedRecord.sessionDate)}</div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-2">
                            <div className="icon-circle bg-soft-primary text-primary me-3">
                              <FaClock />
                            </div>
                            <div>
                              <div className="text-muted small">Time</div>
                              <div className="fw-medium">
                                {formatTime(selectedRecord.startTime)} - {formatTime(selectedRecord.endTime)}
                              </div>
                            </div>
                          </div>
                          {selectedRecord.subjectName && (
                            <div className="d-flex align-items-center mb-2">
                              <div className="icon-circle bg-soft-primary text-primary me-3">
                                <FaBook />
                              </div>
                              <div>
                                <div className="text-muted small">Subject</div>
                                <div className="fw-medium">{selectedRecord.subjectName}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-6">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-header bg-light">
                        <h6 className="mb-0 fw-bold">
                          <FaUsers className="me-2 text-primary" />
                          Participants
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="participant-card mb-3">
                          <div className="avatar avatar-sm bg-primary text-white rounded-circle me-3">
                            <FaChalkboardTeacher />
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="mb-0 fw-bold">Tutor</h6>
                              {selectedRecord.tutorMarkedAt && (
                                <span className={`badge ${selectedRecord.tutorMarkedPresent ? 'bg-success' : 'bg-danger'}`}>
                                  {selectedRecord.tutorMarkedPresent ? 'Present' : 'Absent'}
                                </span>
                              )}
                            </div>
                            <div className="text-muted small">
                              {selectedRecord.tutorName || 'Not specified'}
                              {selectedRecord.tutorMarkedAt && (
                                <div className="mt-1">
                                  <small className="text-muted">
                                    Marked at: {formatDateTime(selectedRecord.tutorMarkedAt)}
                                  </small>
                                  {selectedRecord.tutorNotes && (
                                    <div className="alert alert-light p-2 mt-2 small">
                                      <strong>Notes:</strong> {selectedRecord.tutorNotes}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="participant-card">
                          <div className="avatar avatar-sm bg-info text-white rounded-circle me-3">
                            <FaUserGraduate />
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="mb-0 fw-bold">Student</h6>
                              {selectedRecord.studentMarkedAt ? (
                                <span className={`badge ${selectedRecord.studentMarkedPresent ? 'bg-success' : 'bg-danger'}`}>
                                  {selectedRecord.studentMarkedPresent ? 'Present' : 'Absent'}
                                </span>
                              ) : (
                                <span className="badge bg-secondary">Not Marked</span>
                              )}
                            </div>
                            <div className="text-muted small">
                              {selectedRecord.studentName || 'Not specified'}
                              {selectedRecord.studentMarkedAt ? (
                                <div className="mt-1">
                                  <small className="text-muted">
                                    Marked at: {formatDateTime(selectedRecord.studentMarkedAt)}
                                  </small>
                                  {selectedRecord.studentNotes && (
                                    <div className="alert alert-light p-2 mt-2 small">
                                      <strong>Notes:</strong> {selectedRecord.studentNotes}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="mt-1">
                                  <small className="text-warning">
                                    Awaiting student's attendance mark
                                  </small>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                {selectedRecord.notes && (
                  <div className="card border-0 shadow-sm mt-4">
                    <div className="card-header bg-light">
                      <h6 className="mb-0 fw-bold">
                        <FaStickyNote className="me-2 text-primary" />
                        Additional Notes
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="p-3 bg-light rounded">
                        {selectedRecord.notes}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="modal-footer border-0 bg-light">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
                
                {hasActualConflict(selectedRecord) && (
                  <button 
                    type="button" 
                    className="btn btn-warning"
                    onClick={() => {
                      setShowViewModal(false);
                      setShowConflictModal(true);
                    }}
                  >
                    <FaExclamationTriangle className="me-1" /> Resolve Conflict
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Resolution Modal */}
      {showConflictModal && selectedRecord && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-warning text-white">
                <h5 className="modal-title">Resolve Attendance Conflict</h5>
                <button type="button" className="btn-close" onClick={() => setShowConflictModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6>Session Details</h6>
                    <div className="card mb-3">
                      <div className="card-body">
                        <p className="mb-2"><strong>Date:</strong> {formatDate(selectedRecord.sessionDate)}</p>
                        <p className="mb-2"><strong>Time:</strong> {formatTime(selectedRecord.startTime)} - {formatTime(selectedRecord.endTime)}</p>
                        <p className="mb-2"><strong>Subject:</strong> {selectedRecord.subjectName || 'N/A'}</p>
                        <p className="mb-2"><strong>Tutor:</strong> {selectedRecord.tutorName || 'N/A'}</p>
                        <p className="mb-0"><strong>Student:</strong> {selectedRecord.studentName || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card h-100">
                      <div className="card-header bg-light">
                        <strong>Current Markings</strong>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <strong>Tutor:</strong>
                            <span className={`badge ${selectedRecord.tutorMarkedPresent ? 'bg-success' : 'bg-danger'}`}>
                              {selectedRecord.tutorMarkedPresent ? 'Present' : 'Absent'}
                            </span>
                          </div>
                          <small className="text-muted">
                            {formatDateTime(selectedRecord.tutorMarkedAt)}
                          </small>
                        </div>
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <strong>Student:</strong>
                            <span className={`badge ${selectedRecord.studentMarkedPresent ? 'bg-success' : 'bg-danger'}`}>
                              {selectedRecord.studentMarkedPresent ? 'Present' : 'Absent'}
                            </span>
                          </div>
                          <small className="text-muted">
                            {formatDateTime(selectedRecord.studentMarkedAt)}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="alert alert-warning">
                  <div className="d-flex">
                    <FaExclamationTriangle className="me-2 mt-1" />
                    <div>
                      <strong>Attendance Conflict Detected</strong>
                      <p className="mb-0">The tutor and student have marked different attendance statuses for this session. Please resolve this conflict.</p>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Resolution Notes</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Please explain the resolution..."
                  ></textarea>
                  <div className="form-text">
                    These notes will be recorded with the resolution.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={() => setShowConflictModal(false)}
                  disabled={isResolving}
                >
                  Cancel
                </button>
                <div className="btn-group" role="group">
                  <button 
                    type="button" 
                    className="btn btn-success"
                    onClick={() => handleResolveConflict('Present')}
                    disabled={isResolving}
                  >
                    {isResolving ? 'Processing...' : 'Mark as Present'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-danger"
                    onClick={() => handleResolveConflict('Absent')}
                    disabled={isResolving}
                  >
                    {isResolving ? 'Processing...' : 'Mark as Absent'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-warning"
                    onClick={() => handleResolveConflict('NoShow')}
                    disabled={isResolving}
                  >
                    {isResolving ? 'Processing...' : 'Mark as No Show'}
                  </button>
                </div>
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConflictModal(false)}
                  disabled={isResolving}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendanceOverview;