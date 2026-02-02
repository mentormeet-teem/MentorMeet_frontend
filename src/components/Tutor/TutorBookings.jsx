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

  const handleUpdateStatus = async (booking, newStatus, reason = '') => {
    if (isUpdating) return false;
    
    try {
      setIsUpdating(true);
      const token = getAuthToken();
      
      if (!token) {
        setError('Authentication required');
        return false;
      }
      console.log('Booking object:', booking);
      const bookingId = booking.bookingId || booking.BookingId || booking.id;
      
      if (!bookingId) {
        throw new Error('Booking ID is missing');
      }
      const currentStatus = ((booking.status || booking.Status || 'pending') + '').toLowerCase().trim();
      const normalizedNew = (newStatus || '').toLowerCase().trim();
      
      if (!normalizedNew) {
        throw new Error('Invalid status provided');
      }
      const validTransitions = {
        'pending': ['confirmed', 'cancelled'], 
        'confirmed': ['completed', 'cancelled'],
        'cancelled': [],
        'completed': [],
        'rejected': []
      };

      if (!validTransitions[currentStatus]?.includes(normalizedNew)) {
        throw new Error(`Cannot change status from ${currentStatus} to ${normalizedNew}`);
      }

      const backendStatusMap = {
        'confirmed': 'Confirmed',
        'cancelled': 'Cancelled',
        'completed': 'Completed',
        'pending': 'Pending',
        'rejected': 'Rejected',
        'reject': 'Rejected' 
      };

      const backendStatus = backendStatusMap[normalizedNew];
      
      if (!backendStatus) {
        throw new Error(`Invalid status: ${normalizedNew}`);
      }
      
      const endpoint = `${API_BASE_URL}/api/booking/tutor/bookings/${bookingId}/status`;
      
      console.log('Making request to:', endpoint);
      console.log('Updating status to:', backendStatus);
      
      const response = await axios.put(
        endpoint,
        `"${backendStatus}"`,  
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      if (reason && backendStatus === 'Rejected') {
        await axios.put(
          `${API_BASE_URL}/api/booking/tutor/bookings/${bookingId}`,
          { notes: reason },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      console.log('Update response:', response.data);

      if (response.data) {
        setBookings(prevBookings => 
          prevBookings.map(b => 
            b.bookingId === booking.bookingId 
              ? { 
                  ...b, 
                  status: normalizedNew,
                  statusForDisplay: normalizedNew === 'cancelled' ? 'rejected' : normalizedNew
                } 
              : b
          )
        );
        
        if (selectedBooking && selectedBooking.bookingId === booking.bookingId) {
          setSelectedBooking(prev => ({
            ...prev,
            status: normalizedNew,
            statusForDisplay: normalizedNew === 'cancelled' ? 'rejected' : normalizedNew
          }));
        }
        
        if (normalizedNew === 'cancelled') {
          setShowDetailsModal(false);
          setRejectionReason('');
        }
        
        return true;
      }
    } catch (error) {
console.error('Error updating booking status:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        endpoint: error.config?.url,
        requestData: error.config?.data,
        headers: error.config?.headers
      });
      
      let errorMessage = error.response?.data?.message || 
        `Failed to update booking status: ${error.message}`;
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid status transition';
      } else if (error.response?.status === 404) {
        errorMessage = 'Booking not found. It may have been deleted.';
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your network.';
      }
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectClick = async (booking) => {
    try {
      setError(''); 
      console.log('Rejecting booking:', booking);
      
      const reason = window.prompt('Please enter the reason for rejection (optional):');
      if (reason === null) {
        return; 
      }
      const success = await handleUpdateStatus(booking, 'cancelled', reason || '');
      if (success) {
        await fetchBookings();
        setRejectionReason('');
        setShowDetailsModal(false);
        alert('Booking has been rejected successfully');
      }
    } catch (error) {
      console.error('Error in handleRejectClick:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reject booking';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleAcceptClick = async (bookingOrId) => {
    try {
      setError(''); 
      let booking = bookingOrId;
      if (typeof bookingOrId === 'string' || typeof bookingOrId === 'number') {
        booking = bookings.find(b => b.bookingId === bookingOrId || b.id === bookingOrId);
      }
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      console.log('Accepting booking:', booking);
      
      if (window.confirm('Are you sure you want to accept this booking?')) {
        const success = await handleUpdateStatus(booking, 'confirmed');
        if (success) {
          await fetchBookings();
          alert('Booking has been accepted successfully');
        }
      }
    } catch (error) {
      console.error('Error in handleAcceptClick:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to accept booking';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    }
  };


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
                  handleAcceptClick(booking);
                }}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Accept'}
              </button>
              <button 
                className="action-button reject"
                onClick={async (e) => {
                  e.stopPropagation();
                  const reason = window.prompt('Please enter the reason for rejection (optional):');
                  if (reason === null) return;
                  
                  if (window.confirm('Are you sure you want to reject this booking?')) {
                    try {
                      await handleUpdateStatus(booking, 'cancelled', reason || '');
                      await fetchBookings();
                      alert('Booking has been rejected successfully');
                    } catch (error) {
                      console.error('Error rejecting booking:', error);
                      const errorMessage = error.response?.data?.message || error.message || 'Failed to reject booking';
                      alert(`Error: ${errorMessage}`);
                    }
                  }
                }}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Reject'}
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
                        handleAcceptClick(selectedBooking);
                      }}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Updating...' : 'Accept Booking'}
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
                      onClick={() => handleRejectClick(selectedBooking)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Updating...' : 'Reject Booking'}
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
