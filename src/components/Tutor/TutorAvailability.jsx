import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthToken } from '../../utils/auth';
import { API_BASE_URL } from '../../config';
import '../../styles/TutorAvailability.css';

const TutorAvailability = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('calendar');
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState(null);
  const [slotBookings, setSlotBookings] = useState([]);
  const today = new Date().toISOString().split('T')[0];
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const defaultEndDate = oneYearFromNow.toISOString().split('T')[0];

  const [formData, setFormData] = useState(() => ({
    daysOfWeek: ['Monday'],
    startTime: '09:00',
    endTime: '10:00',
    isRecurring: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    validFrom: today,
    validTo: defaultEndDate,
    specificDate: ''
  }));
  
  const [showDateRange, setShowDateRange] = useState(true);
  
  const allDays = [
    { value: 'Monday', label: 'Mon' },
    { value: 'Tuesday', label: 'Tue' },
    { value: 'Wednesday', label: 'Wed' },
    { value: 'Thursday', label: 'Thu' },
    { value: 'Friday', label: 'Fri' },
    { value: 'Saturday', label: 'Sat' },
    { value: 'Sunday', label: 'Sun' }
  ];

  // Using centralized getAuthToken from auth.js

  const fetchSlots = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        // Set loading to false to show the error state
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/availability/tutor/slots`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        const mappedSlots = response.data.map(slot => ({
          id: slot.AvailabilitySlotId,
          dayOfWeek: slot.DayOfWeek,
          startTime: slot.StartTime,
          endTime: slot.EndTime,
          isActive: slot.IsActive,
          isRecurring: slot.IsRecurring,
          maxBookingsPerSlot: slot.MaxBookingsPerSlot,
          timeZone: slot.TimeZone,
        }));
        
        console.log('Mapped slots:', mappedSlots);
        setSlots(mappedSlots);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'daysOfWeek') {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setFormData(prev => ({
        ...prev,
        daysOfWeek: selectedOptions
      }));
    } else if (name === 'isRecurring') {
      const isRecurring = checked;
      setFormData(prev => {
        const newState = {
          ...prev,
          isRecurring,
          specificDate: isRecurring ? '' : (prev.specificDate || today),
          validFrom: isRecurring ? (prev.validFrom || today) : (prev.specificDate || today),
          validTo: isRecurring ? (prev.validTo || defaultEndDate) : (prev.specificDate || today)
        };
        setShowDateRange(isRecurring);
        return newState;
      });
    } else if (name === 'validFrom' || name === 'validTo') {
      // Ensure validTo is not before validFrom
      if (name === 'validFrom' && value > formData.validTo) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          validTo: value
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value || (name === 'validFrom' ? today : defaultEndDate)
        }));
      }
    } else if (name === 'specificDate') {
      setFormData(prev => ({
        ...prev,
        specificDate: value || today,
        validFrom: value || today,
        validTo: value || today
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : (value || '')
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      // Validate date range
      if (new Date(formData.validFrom) > new Date(formData.validTo)) {
        alert('End date cannot be before start date');
        return;
      }
      
      // Validate specific date if not recurring
      if (!formData.isRecurring && !formData.specificDate) {
        alert('Please select a specific date for non-recurring slots');
        return;
      }
      
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      const prepareSlotData = () => {
        const baseData = {
          startTime: formData.startTime,
          endTime: formData.endTime,
          isRecurring: formData.isRecurring,
          timeZone: formData.timeZone,
          validFrom: formData.validFrom,
          validTo: formData.validTo
        };
        
        if (formData.isRecurring) {
          return formData.daysOfWeek.map(dayOfWeek => ({
            ...baseData,
            dayOfWeek,
            specificDate: null // Ensure specificDate is null for recurring slots
          }));
        } else {
          // For non-recurring, use the specific date
          return [{
            ...baseData,
            dayOfWeek: new Date(formData.specificDate).toLocaleDateString('en-US', { weekday: 'long' }),
            specificDate: formData.specificDate,
            validFrom: formData.specificDate,
            validTo: formData.specificDate
          }];
        }
      };
      
      if (editingSlot && editingSlot.id) {
        // For editing, we'll still only edit one slot at a time
        const slotData = prepareSlotData()[0]; // Take first slot for editing
        
        // Ensure we're not sending null/undefined values
        const cleanSlotData = Object.fromEntries(
          Object.entries(slotData).filter(([_, v]) => v != null)
        );
        
        console.log('Updating slot with data:', cleanSlotData);
        
        try {
          const response = await axios.put(
            `${API_BASE_URL}/api/availability/tutor/slots/${editingSlot.id}`,
            cleanSlotData,
            { 
              headers,
              validateStatus: (status) => status >= 200 && status < 500
            }
          );
          
          if (response.status === 409) {
            throw new Error(response.data?.message || 'This time slot conflicts with an existing one. Please choose a different time.');
          } else if (response.status !== 200) {
            throw new Error(response.data?.message || 'Failed to update slot');
          }
        } catch (error) {
          console.error('Update error details:', error.response?.data || error.message);
          throw error;
        }
      } else {
        // For new slots, create multiple slots - one for each selected day
        const slots = prepareSlotData();
        
        // Clean each slot data
        const cleanSlots = slots.map(slot => 
          Object.fromEntries(
            Object.entries(slot).filter(([_, v]) => v != null)
          )
        );
        
        console.log('Creating slots with data:', cleanSlots);
        
        const response = await axios.post(
          `${API_BASE_URL}/api/availability/tutor/slots/bulk`,
          { slots: cleanSlots },
          { 
            headers,
            validateStatus: (status) => status >= 200 && status < 500
          }
        );
        
        if (response.status === 409) {
          throw new Error(response.data?.message || 'One or more slots conflict with existing availability. Please check your selections.');
        } else if (response.status !== 201) {
          throw new Error(response.data?.message || 'Failed to create slots');
        }
      }
      
      setShowForm(false);
      const handleEdit = (slot) => {
        setEditingSlot(slot);
        setFormData(prev => ({
          ...prev,
          daysOfWeek: slot.dayOfWeek ? [slot.dayOfWeek] : ['Monday'],
          startTime: slot.startTime || '09:00',
          endTime: slot.endTime || '10:00',
          isRecurring: slot.isRecurring !== undefined ? slot.isRecurring : true,
          maxBookingsPerSlot: slot.maxBookingsPerSlot || 1,
          timeZone: slot.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          validFrom: slot.validFrom || today,
          validTo: slot.validTo || defaultEndDate,
          specificDate: slot.specificDate || ''
        }));
        setShowForm(true);
      };
      setEditingSlot(null);
      fetchSlots();
      setFormData(prev => ({
        ...prev,
        daysOfWeek: ['Monday'],
        startTime: '09:00',
        endTime: '10:00',
        isRecurring: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        validFrom: today,
        validTo: defaultEndDate,
        specificDate: ''
      }));
      setShowDateRange(true);
    } catch (error) {
      console.error('Error saving availability:', error);
      // Show error message to user
      alert(error.response?.data?.message || error.message || 'An error occurred while saving availability. Please try again.');
    }
  };

  const handleDeleteClick = async (slot) => {
    if (!slot?.id) {
      console.error('Cannot delete: slot or slot.id is undefined');
      return;
    }
    
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      // Fetch booking details for this slot
      const response = await axios.get(
        `${API_BASE_URL}/api/availability/slots/${slot.id}/bookings`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );
      
      setSlotBookings(response.data || []);
      setSlotToDelete(slot);
      setShowDeleteModal(true);
      
    } catch (error) {
      console.error('Error fetching slot bookings:', error.response?.data || error.message);
      // If there's an error, just show the delete confirmation
      setSlotToDelete(slot);
      setShowDeleteModal(true);
    }
  };

  const confirmDeleteSlot = async () => {
    if (!slotToDelete?.id) return;
    
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      await axios.delete(
        `${API_BASE_URL}/api/availability/tutor/slots/${slotToDelete.id}`, 
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      await fetchSlots();
      setShowDeleteModal(false);
      setSlotToDelete(null);
      setSlotBookings([]);
      
    } catch (error) {
      console.error('Error deleting slot:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Failed to delete time slot. Please try again.';
      alert(errorMessage);
      setShowDeleteModal(false);
    }
  };
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const toggleStatus = async (slotId, currentStatus) => {
    console.log('Toggling status for slot:', slotId, 'Current status:', currentStatus);
    if (!slotId) {
      console.error('Cannot toggle status: slotId is undefined');
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const newStatus = !currentStatus;
      console.log('Setting new status to:', newStatus);

      // Optimistically update the UI
      setSlots(prevSlots => 
        prevSlots.map(slot => 
          slot.id === slotId ? { ...slot, isActive: newStatus } : slot
        )
      );

      await axios.put(
        `${API_BASE_URL}/api/availability/tutor/slots/${slotId}/status`,
        newStatus,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log('Status toggled successfully');
      
    } catch (error) {
      console.error('Error toggling status:', error.response?.data || error.message);
      // Revert the UI if the API call fails
      setSlots(prevSlots => 
        prevSlots.map(slot => 
          slot.id === slotId ? { ...slot, isActive: currentStatus } : slot
        )
      );
      alert('Failed to update slot status. Please try again.');
    }
};
  useEffect(() => {
    if (editingSlot) {
      console.log('Editing slot data:', editingSlot);
      setFormData({
        dayOfWeek: editingSlot.dayOfWeek || editingSlot.DayOfWeek,
        startTime: editingSlot.startTime || editingSlot.StartTime,
        endTime: editingSlot.endTime || editingSlot.EndTime,
        isRecurring: editingSlot.isRecurring ?? editingSlot.IsRecurring ?? true,
        timeZone: editingSlot.timeZone || editingSlot.TimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        validFrom: editingSlot.validFrom || editingSlot.ValidFrom || today,
        validTo: editingSlot.validTo || editingSlot.ValidTo || defaultEndDate,
        specificDate: editingSlot.specificDate || editingSlot.SpecificDate || ''
      });
      setShowForm(true);
    }
  }, [editingSlot]);
  useEffect(() => {
    fetchSlots();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="tutor-availability">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Delete Time Slot</h3>
              <button className="close-button" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {slotBookings.length > 0 ? (
                <div>
                  <p>This time slot has {slotBookings.length} active booking(s). Deleting it will cancel these bookings.</p>
                  <div className="booking-list">
                    <h4>Affected Bookings:</h4>
                    <ul>
                      {slotBookings.map(booking => (
                        <li key={booking.bookingId} className="booking-item">
                          <div>Student: {booking.studentName || 'N/A'}</div>
                          <div>Date: {formatDate(booking.bookingDate)}</div>
                          <div>Status: {booking.status || 'N/A'}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="warning-text">Are you sure you want to delete this slot and cancel all associated bookings?</p>
                </div>
              ) : (
                <p>Are you sure you want to delete this time slot?</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="danger-btn" onClick={confirmDeleteSlot}>
                {slotBookings.length > 0 ? 'Delete and Cancel Bookings' : 'Delete Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="view-controls">
        <button 
          className={view === 'calendar' && !showForm ? 'active' : ''} 
          data-view="calendar"
          onClick={() => {
            setView('calendar');
            setShowForm(false);
            setEditingSlot(null);
          }}
        >
          Calendar View
        </button>
        <button 
          className={view === 'list' && !showForm ? 'active' : ''} 
          data-view="list"
          onClick={() => {
            setView('list');
            setShowForm(false);
            setEditingSlot(null);
          }}
        >
          List View
        </button>
        <button 
          className={showForm ? 'active' : ''}
          data-view="add"
          onClick={() => {
            setFormData({
              daysOfWeek: ['Monday'],
              startTime: '09:00',
              endTime: '10:00',
              isRecurring: true,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });
            setEditingSlot(null);
            setShowForm(true);
          }}
        >
          + Add Slot
        </button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="slot-form">
          <h3>{editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}</h3>
          
          <div className="form-group">
            <label>Days of Week</label>
            <div className="days-checkbox-container">
              {allDays.map(day => (
                <label key={day.value} className="day-checkbox-label">
                  <input
                    type="checkbox"
                    name="daysOfWeek"
                    value={day.value}
                    checked={Array.isArray(formData.daysOfWeek) && formData.daysOfWeek.includes(day.value)}
                    onChange={(e) => {
                      const { checked, value } = e.target;
                      setFormData(prev => {
                        const currentDays = Array.isArray(prev.daysOfWeek) ? prev.daysOfWeek : [];
                        return {
                          ...prev,
                          daysOfWeek: checked
                            ? [...currentDays, value]
                            : currentDays.filter(d => d !== value)
                        };
                      });
                    }}
                    className="day-checkbox"
                  />
                  <span className="day-label">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Start Time</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="isRecurring"
                checked={formData.isRecurring}
                onChange={handleChange}
              />
              Recurring Slot
            </label>
          </div>
          
          {formData.isRecurring ? (
            <div className="form-group date-range">
              <label>Valid From:</label>
              <input
                type="date"
                name="validFrom"
                value={formData.validFrom}
                min={today}
                max={formData.validTo}
                onChange={handleChange}
                className="form-control"
              />
              <label>Valid To:</label>
              <input
                type="date"
                name="validTo"
                value={formData.validTo}
                min={formData.validFrom || today}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Specific Date:</label>
              <input
                type="date"
                name="specificDate"
                value={formData.specificDate}
                min={today}
                onChange={handleChange}
                className="form-control"
                required={!formData.isRecurring}
              />
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className="secondary-btn"
              onClick={() => {
                setShowForm(false);
                setEditingSlot(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              {editingSlot ? 'Update' : 'Add'} Slot
            </button>
          </div>
        </form>
      ) : view === 'list' ? (
        <div className="slots-list">
          {slots.length === 0 ? (
            <p key="no-slots" className="no-slots">Add your first Time slot!</p>
          ) : (
            slots.map(slot => {
              if (!slot.id) {
                console.error('Invalid slot data:', slot);
                return null; 
              }
              return (
                <div key={`slot-${slot.id}`} className="slot-item">
                  <div className="slot-details">
                    <span className="day">{slot.dayOfWeek || 'N/A'}</span>
                    <span className="time">
                      {slot.startTime || '00:00'} - {slot.endTime || '00:00'}
                    </span>
                    <span className={`status ${slot.isActive ? 'active' : 'inactive'}`}>
                      {slot.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="slot-actions">
                    <button 
                      type="button"
                      className="edit-btn"
                      onClick={() => setEditingSlot(slot)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="toggle-btn"
                      onClick={() => toggleStatus(slot.id, slot.isActive)}
                    >
                      {slot.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDeleteClick(slot)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="calendar-view">
          <p>Calendar view will be implemented here</p>
          <div className="slots-grid">
            {slots.map(slot => (
              <div 
                key={slot.id} 
                className="calendar-slot"
                onClick={() => setEditingSlot(slot)}
              >
                <div className="slot-time">
                  {slot.startTime} - {slot.endTime}
                </div>
                <div className="slot-day">{slot.dayOfWeek}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorAvailability;