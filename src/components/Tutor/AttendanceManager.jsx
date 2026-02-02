import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { getAuthToken } from '../../utils/auth';
import { format, parseISO } from 'date-fns';
import '../../styles/AttendanceManager.css';

const AttendanceManager = () => {
  const [activeTab, setActiveTab] = useState('today');
  const [sessions, setSessions] = useState({
    today: { data: [], loading: true, error: null },
    upcoming: { data: [], loading: false, error: 'Upcoming sessions feature is coming soon!' }
  });
  const [isMarking, setIsMarking] = useState({});
  const [error, setError] = useState(null);
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };


  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return format(parseISO(dateStr), 'MMMM d, yyyy');
  };

  const fetchTodaysSessions = async () => {
    try {
      setSessions(prev => ({
        ...prev,
        today: { ...prev.today, loading: true, error: null }
      }));

      const token = getAuthToken();
      if (!token) throw new Error('Authentication required');

      const response = await axios.get(
        `${API_BASE_URL}/api/attendance/tutor/today-sessions`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('API Response:', response.data);
      let sessionsData = [];
      if (response.data?.sessions && Array.isArray(response.data.sessions)) {
        sessionsData = response.data.sessions;
      } else if (Array.isArray(response.data)) {
        sessionsData = response.data;
      } else if (response.data?.data) {
        sessionsData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      }

      const processedSessions = sessionsData
        .filter(session => {
          const hasBookingId = 'bookingId' in session || 'BookingId' in session;
          if (!session || !hasBookingId) {
            console.warn('Invalid session data (missing bookingId):', session);
            return false;
          }
          return true;
        })
        .map(session => {
          const bookingId = session.bookingId || session.BookingId;
          const attendanceId = session.attendanceId || session.AttendanceId || 0;
          const sessionDate = session.sessionDate || session.SessionDate || new Date().toISOString().split('T')[0];
          const startTime = session.startTime || session.StartTime || '00:00';
          const endTime = session.endTime || session.EndTime || '00:00';
          const studentName = session.studentName || session.StudentName || 'Unknown Student';
          const subject = session.subject || session.Subject || 'General Session';
          const isAttendanceMarked = session.isAttendanceMarked || session.IsAttendanceMarked || false;
          const attendanceStatus = session.attendanceStatus || session.AttendanceStatus || 'Pending';

          return {
            ...session,
            id: bookingId.toString(),
            bookingId,
            attendanceId,
            isAttendanceMarked: Boolean(isAttendanceMarked),
            attendanceStatus,
            sessionDate,
            startTime,
            endTime,
            studentName,
            subject
          };
        });

    setSessions(prev => ({
      ...prev,
      today: {
        ...prev.today,
        data: processedSessions,
        loading: false,
        error: null
      }
    }));

  } catch (err) {
    console.error('Error fetching sessions:', {
      error: err,
      response: err.response?.data,
      status: err.response?.status
    });

    const errorMessage = err.response?.data?.message || 
                        err.message || 
                        'Failed to fetch today\'s sessions. Please try again.';
    
    setSessions(prev => ({
      ...prev,
      today: {
        ...prev.today,
        loading: false,
        error: errorMessage
      }
    }));
  }
};

 const handleMarkAttendance = async (sessionId, isPresent) => {
  try {
    const session = sessions.today.data.find(s => s.id === sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.isAttendanceMarked) {
      throw new Error(`Attendance is already marked as ${session.attendanceStatus}`);
    }
    const now = new Date();
    
    const sessionDate = new Date(session.sessionDate);
    const [startHours, startMinutes] = session.startTime.split(':').map(Number);
    const sessionStartTime = new Date(sessionDate);
    sessionStartTime.setHours(startHours, startMinutes, 0, 0);
    const fifteenMinutesBefore = new Date(sessionStartTime.getTime() - (15 * 60 * 1000));

    if (now < fifteenMinutesBefore) {
      const formattedTime = format(fifteenMinutesBefore, 'h:mm a');
      throw new Error(`Attendance can only be marked starting from ${formattedTime}`);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDay = new Date(sessionDate);
    sessionDay.setHours(0, 0, 0, 0);
    
    if (today.getTime() !== sessionDay.getTime()) {
      throw new Error('Attendance can only be marked on the session date');
    }

    setIsMarking(prev => ({ ...prev, [sessionId]: true }));

    const payload = {
      isPresent,
      notes: null
    };

    const response = await axios.post(
      `${API_BASE_URL}/api/attendance/tutor/mark/${session.bookingId}`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    await fetchTodaysSessions();
    setError(`Successfully marked as ${isPresent ? 'Present' : 'Absent'}`);
    setTimeout(() => setError(null), 5000);

  } catch (err) {
    console.error('Error marking attendance:', err);
    let errorMessage = 'An error occurred while marking attendance';
    
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  } finally {
    setIsMarking(prev => ({ ...prev, [sessionId]: false }));
  }
}; 
  useEffect(() => {
    fetchTodaysSessions();
  }, []);

  if (sessions[activeTab].loading) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading {activeTab === 'today' ? "Today's" : "Upcoming"} Sessions...</p>
        </div>
      </div>
    );
  }

  return (
  <div className="attendance-container">
    <h2 className="text">Session Attendance</h2>
    
    {error && (
      <div className="error-message">
        {error}
      </div>
    )}

    <div className="session-list">
      {sessions[activeTab].loading ? (
        <div className="loading-container">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading {activeTab === 'today' ? "Today's" : "Upcoming"} Sessions...</p>
        </div>
      ) : sessions[activeTab].data.length === 0 ? (
        <div className="text-center py-5">
          <p>No {activeTab === 'today' ? "sessions" : "upcoming sessions"} found.</p>
        </div>
      ) : (
        <div className="session-list">
          {sessions[activeTab].data.map((session) => (
            <div key={session.id} className="session-card">
              <div className="session-header">
                <div>
                  <h3 className="session-student">{session.studentName}</h3>
                  <p className="session-time">
                    {session.startTime} - {session.endTime}
                  </p>
                </div>
                <span className={`status-badge ${
                  session.attendanceStatus === 'Present' ? 'status-present' : 
                  session.attendanceStatus === 'Absent' ? 'status-absent' : 'status-pending'
                }`}>
                  {session.attendanceStatus}
                </span>
              </div>
              
              <p className="session-subject">{session.subject}</p>
              
              <div className="session-status">
                {!session.isAttendanceMarked ? (
                  <div className="action-buttons">
                    <button
                      className="btn btn-present"
                      onClick={() => handleMarkAttendance(session.id, true)}
                      disabled={isMarking[session.id]}
                    >
                      {isMarking[session.id] ? 'Marking...' : 'Present'}
                    </button>
                    <button
                      className="btn btn-absent"
                      onClick={() => handleMarkAttendance(session.id, false)}
                      disabled={isMarking[session.id]}
                    >
                      {isMarking[session.id] ? 'Marking...' : 'Absent'}
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Marked as {session.attendanceStatus}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
};

export default AttendanceManager;