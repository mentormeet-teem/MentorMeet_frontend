import React, { useState, useEffect, useMemo } from 'react';
const formatTime = (timeString) => {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch (e) {
    console.error('Error formatting time:', e);
    return timeString; 
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString; 
  }
};

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'N/A';
  
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return 'Invalid Date/Time';
    
    return date.toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch (e) {
    console.error('Error formatting date/time:', e);
    return dateTimeString;
  }
};
import axios from 'axios';
import { getAuthToken } from '../../utils/auth';
import { API_BASE_URL } from '../../config';
import '../../styles/TutorBookings.css';

const TutorBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
 
  const statusFilters = [
    { value: 'all', label: 'All Bookings' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const fetchBookings = async () => {
  setLoading(true);
  try {
    const token = getAuthToken();
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }
     const statusMap = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };

    const params = {};
    if (statusFilter !== 'all' && statusMap[statusFilter]) {
      params.status = statusMap[statusFilter];
    }

    const response = await axios.get(
      `${API_BASE_URL}/api/booking/tutor/bookings`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: params
      }
    );

    if (!response.data || !Array.isArray(response.data.bookings)) {
      setBookings([]);
      return;
    }

    const processed = response.data.bookings.map(b => {
      const status = (b.Status || 'Pending').toLowerCase();
      
      return {
        id: b.BookingId,
        bookingId: b.BookingId,
        student: {
          name: b.StudentName || 'N/A',
          email: b.StudentEmail || 'N/A',
        },
        sessionDate: b.SessionDate,
        startTime: b.StartTime,
        endTime: b.EndTime,
        formattedSessionDate: formatDate(b.SessionDate),
        formattedCreatedAt: formatDateTime(b.CreatedAt),
        formattedTimeRange: `${formatTime(b.StartTime)} - ${formatTime(b.EndTime)}`,
        status: status,
        statusForDisplay: status === 'cancelled' ? 'rejected' : status,
        notes: b.Notes || '',
        duration: b.Duration,
      };
    });

    setBookings(processed);
  } catch (error) {
    console.error('Error fetching bookings:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    setError('Failed to load bookings. Please try again.');
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const filteredBookings = useMemo(() => {
    return statusFilter === 'all'
      ? bookings
      : bookings.filter(b => b.status === statusFilter);
  }, [bookings, statusFilter]);
  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-pending';
  };
  const renderStatusFilters = () => (
    <div className="status-filter">
      {statusFilters.map(filter => (
        <button
          key={filter.value}
          className={`status-filter-btn ${statusFilter === filter.value ? 'active' : ''}`}
          onClick={() => setStatusFilter(filter.value)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
  const renderBookingRow = (booking) => (
    <tr key={booking.bookingId} onClick={() => {
      setSelectedBooking(booking);
      setShowDetailsModal(true);
    }} className="booking-row">
      <td>{booking.student.name}</td>
      <td>{booking.formattedSessionDate}</td>
      <td>{booking.formattedTimeRange}</td>
      <td>
        <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
          {booking.status === 'cancelled' && booking.statusForDisplay === 'rejected' ? 'Rejected' : booking.status}
        </span>
      </td>
      <td className="action-buttons">
        {booking.status === 'pending' && (
          <>
            <button 
              className="action-button accept"
              onClick={(e) => {
                e.stopPropagation();
                updateBookingStatus(booking.bookingId, 'confirmed');
              }}
              disabled={isUpdating}
            >
              Accept
            </button>
            <button 
              className="action-button reject"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to reject this booking?')) {
                  setSelectedBooking(booking);
                  setShowDetailsModal(true);
                }
              }}
              disabled={isUpdating}
            >
              Reject
            </button>
          </>
        )}
      </td>
    </tr>
  );
  const renderBookingDetails = () => {
    if (!selectedBooking) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Booking Details</h3>
            <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
          </div>
            
          <div className="modal-body">
            <div className="booking-detail">
              <h4>Student Information</h4>
              <p><strong>Name:</strong> {selectedBooking.student.name}</p>
              <p><strong>Email:</strong> {selectedBooking.student.email}</p>
            </div>
              
            <div className="booking-detail">
              <h4>Session Details</h4>
              <p><strong>Date:</strong> {selectedBooking.formattedSessionDate}</p>
              <p><strong>Time:</strong> {selectedBooking.formattedTimeRange}</p>
              <p><strong>Status:</strong> 
                <span className={`status-badge ${getStatusBadgeClass(selectedBooking.status)}`}>
                  {selectedBooking.status === 'cancelled' && selectedBooking.statusForDisplay === 'rejected' 
                    ? 'Rejected' 
                    : selectedBooking.status}
                </span>
              </p>
            </div>
              
            {selectedBooking.notes && (
              <div className="booking-detail">
                <h4>Notes</h4>
                <p>{selectedBooking.notes}</p>
              </div>
            )}
              
            {selectedBooking.status === 'pending' && (
              <div className="booking-actions">
                <h4>Actions</h4>
                <div className="action-buttons">
                  <button 
                    className="action-button accept"
                    onClick={() => {
                      updateBookingStatus(selectedBooking.bookingId, 'confirmed');
                      setShowDetailsModal(false);
                    }}
                    disabled={isUpdating}
                  >
                    Accept Booking
                  </button>
                  <div className="reject-section">
                    <input
                      type="text"
                      className="rejection-reason"
                      placeholder="Rejection reason (optional)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      onClick={e => e.stopPropagation()}
                    />
                    <button 
                      className="action-button reject"
                      onClick={() => {
                        updateBookingStatus(selectedBooking.bookingId, 'cancelled');
                        setShowDetailsModal(false);
                      }}
                      disabled={isUpdating}
                    >
                      Reject Booking
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading && bookings.length === 0) {
    return <div className="loading">Loading bookings...</div>;
  }

  return (
    <div className="tutor-bookings-container">
      <h2>My Bookings</h2>
      {error && <div className="error-message">{error}</div>}
      
      {renderStatusFilters()}
      
      <div className="bookings-table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings.map(renderBookingRow)
            ) : (
              <tr>
                <td colSpan="5" className="no-bookings">
                  No bookings found{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {showDetailsModal && selectedBooking && renderBookingDetails()}
        
    </div>
  );
};

export default TutorBookings;
