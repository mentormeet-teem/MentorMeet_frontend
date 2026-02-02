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

  const initialFormData = {
    daysOfWeek: ['Monday'],
    startTime: '09:00',
    endTime: '10:00',
    isRecurring: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    validFrom: today,
    validTo: defaultEndDate,
    specificDate: today,
    maxBookingsPerSlot: 1
  };
  
  const [formData, setFormData] = useState(() => ({
    ...initialFormData,
    daysOfWeek: [...initialFormData.daysOfWeek] 
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

  const fetchSlots = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    try {
      if (type === 'checkbox') {
        if (name === 'isRecurring') {
          toggleRecurring();
          return;
        } else if (name === 'daysOfWeek') {
          // Handle days of week checkboxes
          const dayValue = e.target.value;
          setFormData(prev => {
            const currentDays = Array.isArray(prev.daysOfWeek) ? [...prev.daysOfWeek] : [];
            
            if (checked) {
              // Add the day if it's not already in the array
              if (!currentDays.includes(dayValue)) {
                return { ...prev, daysOfWeek: [...currentDays, dayValue] };
              }
            } else {
              // Remove the day if it's in the array
              return { 
                ...prev, 
                daysOfWeek: currentDays.filter(day => day !== dayValue) 
              };
            }
            return prev;
          });
          return;
        }
        
        // Handle other checkboxes
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      } else if (type === 'select-multiple') {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({
          ...prev,
          [name]: selectedOptions.length ? selectedOptions : ['Monday']
        }));
      } else {
        if ((name === 'startTime' || name === 'endTime') && !value) {
          return;
        }
        
        setFormData(prev => ({
          ...prev,
          [name]: value || ''
        }));
      }
    } catch (error) {
      console.error('Error in handleInputChange:', error);
    }
  };
  const toggleRecurring = () => {
    setFormData(prev => {
      const newIsRecurring = !prev.isRecurring;
      return {
        ...prev,
        isRecurring: newIsRecurring,
        specificDate: newIsRecurring ? prev.specificDate : today,
        validTo: newIsRecurring ? prev.validTo || defaultEndDate : today
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.startTime || !formData.endTime) {
      alert('Please select both start and end times');
      return;
    }
  
    const start = new Date(`2000-01-01T${formData.startTime}`);
    const end = new Date(`2000-01-01T${formData.endTime}`);
    
    if (end <= start) {
      alert('End time must be after start time');
      return;
    }
    
    try {
      setLoading(true);
      
      const slotData = prepareSlotData();
      
      if (editingSlot) {
        const token = getAuthToken();
        await axios.put(
          `${API_BASE_URL}/api/availability/tutor/slots/${editingSlot.id}`, 
          slotData[0],
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        setSlots(prevSlots => 
          prevSlots.map(slot => 
            slot.id === editingSlot.id ? { ...slot, ...slotData[0] } : slot
          )
        );
        setEditingSlot(null);
      } else {
        const token = getAuthToken();
         const responses = [];
        for (const slot of slotData) {
          const response = await axios.post(
            `${API_BASE_URL}/api/availability/tutor/slots`,
            slot,
            {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          // Extract the slot data from the response
          if (response.data && response.data.slot) {
            responses.push(response.data.slot);
          } else {
            responses.push(response.data);
          }
        }
        // Update the slots with the new ones
        setSlots(prevSlots => [...prevSlots, ...responses]);
      }
      
      setShowForm(false);
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error saving availability:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 409) {
          alert('This time slot conflicts with an existing one. Please choose a different time or day.');
        } else if (error.response.data && error.response.data.message) {
          alert(`Error: ${error.response.data.message}`);
        } else {
          alert('Failed to save availability. The selected time slot may be taken or invalid.');
        }
      } else if (error.request) {
        // The request was made but no response was received
        alert('No response from server. Please check your connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        alert(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const prepareSlotData = () => {
    const startTime = formData.startTime || '09:00';
    const endTime = formData.endTime || '10:00';
    
    const startTime24 = typeof startTime === 'string' && startTime.includes(' ') 
      ? convertTo24Hour(startTime) 
      : startTime;
      
    const endTime24 = typeof endTime === 'string' && endTime.includes(' ')
      ? convertTo24Hour(endTime)
      : endTime;
    if (!formData.isRecurring) {
      const localDate = new Date(formData.specificDate || formData.validFrom || today);
      const dateString = localDate.toISOString().split('T')[0];
      return [{
        dayOfWeek: localDate.toLocaleDateString('en-US', { weekday: 'long' }),
        startTime: startTime24,
        endTime: endTime24,
        isRecurring: false,
        specificDate: dateString,
        validFrom: dateString,
        validTo: dateString,
        maxBookingsPerSlot: formData.maxBookingsPerSlot || 1
      }];
    }
    
    return formData.daysOfWeek.map(dayOfWeek => ({
      dayOfWeek,
      startTime: startTime24,
      endTime: endTime24,
      isRecurring: true,
      specificDate: null,
      validFrom: formData.validFrom || today,
      validTo: formData.validTo || defaultEndDate,
      maxBookingsPerSlot: formData.maxBookingsPerSlot || 1
    }));
  };

  const convertTo24Hour = (time12h) => {
    if (!time12h) return '00:00';
    
    if (!time12h.includes('AM') && !time12h.includes('PM')) {
      return time12h;
    }
    
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    
    return `${hours.padStart(2, '0')}:${minutes || '00'}`;
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
    
    try {
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
      if (error.response?.status === 404) {
        try {
          await axios.delete(
            `${API_BASE_URL}/api/availability/tutor/slots/${slot.id}`,
            {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            }
          );
        
          await fetchSlots();
          alert('Time slot deleted successfully');
          
        } catch (deleteError) {
          console.error('Error deleting slot:', deleteError);
          const errorMessage = deleteError.response?.data?.message || 
                             'Failed to delete time slot. Please try again.';
          alert(errorMessage);
        }
      } else {
        console.error('Error fetching slot bookings:', error);
        setSlotBookings([]);
        setSlotToDelete(slot);
        setShowDeleteModal(true);
      }
    }
    
  } catch (error) {
    console.error('Error in handleDeleteClick:', error);
    setSlotToDelete(slot);
    setShowDeleteModal(true);
  }
};

const confirmDeleteSlot = async () => {
  if (!slotToDelete?.id) {
    console.error('No slot selected for deletion');
    return;
  }

  try {
    const token = getAuthToken();
    if (!token) {
      console.error('No authentication token found');
      alert('Please log in to continue');
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
    alert('Time slot deleted successfully');

  } catch (error) {
    console.error('Error deleting slot:', error);
    const errorMessage = error.response?.data?.message || 
                       'Failed to delete time slot. It may have active bookings.';
    alert(errorMessage);
  } finally {
    setShowDeleteModal(false);
    setSlotToDelete(null);
    setSlotBookings([]);
  }
};

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString('en-US', options);
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
     
      setSlots(prevSlots => 
        prevSlots.map(slot => 
          slot.id === slotId ? { ...slot, isActive: currentStatus } : slot
        )
      );
      alert('Failed to update slot status. Please try again.');
    }
};

  const convertTo24HourForInput = (timeStr) => {
    if (!timeStr) return '';
    
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
      return timeStr;
    }
    
    if (typeof timeStr === 'string' && timeStr.includes(' ')) {
      try {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        
        if (modifier === 'PM' && hours !== '12') {
          hours = parseInt(hours, 10) + 12;
        } else if (modifier === 'AM' && hours === '12') {
          hours = '00';
        }
        
        return `${hours.toString().padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}`;
      } catch (error) {
        console.error('Error converting time:', error);
        return '09:00'; 
      }
    }
    
    return timeStr || '09:00';
  };

  useEffect(() => {
    if (editingSlot) {
      console.log('Editing slot data:', editingSlot);
      const slotData = {
        daysOfWeek: [editingSlot.dayOfWeek || editingSlot.DayOfWeek || 'Monday'],
        startTime: convertTo24HourForInput(editingSlot.startTime || editingSlot.StartTime) || '09:00',
        endTime: convertTo24HourForInput(editingSlot.endTime || editingSlot.EndTime) || '10:00',
        isRecurring: editingSlot.isRecurring ?? editingSlot.IsRecurring ?? true,
        timeZone: editingSlot.timeZone || editingSlot.TimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        validFrom: editingSlot.validFrom || editingSlot.ValidFrom || today,
        validTo: editingSlot.validTo || editingSlot.ValidTo || defaultEndDate,
        specificDate: editingSlot.specificDate || editingSlot.SpecificDate || today,
        maxBookingsPerSlot: editingSlot.maxBookingsPerSlot || editingSlot.MaxBookingsPerSlot || 1
      };
      
      console.log('Setting form data:', slotData);
      
      setFormData(slotData);
      
      const timer = setTimeout(() => {
        setShowForm(true);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [editingSlot]);

  useEffect(() => {
    fetchSlots();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="tutor-availability">
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
            setFormData(initialFormData);
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
              {allDays.map((day) => (
                <div key={`day-${day.value}`} className="day-checkbox-wrapper">
                  <label className="day-checkbox-label">
                    <input
                      type="checkbox"
                      name="daysOfWeek"
                      value={day.value}
                      checked={Array.isArray(formData.daysOfWeek) && formData.daysOfWeek.includes(day.value)}
                      onChange={handleInputChange}
                      className="day-checkbox"
                      id={`day-${day.value}`}
                    />
                    <span className="day-label">{day.label}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Start Time</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime || '09:00'}
              onChange={handleInputChange}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime || '10:00'}
              onChange={handleInputChange}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="isRecurring"
                checked={formData.isRecurring}
                onChange={handleInputChange}
              />
              Recurring Availability
            </label>
          </div>

          {formData.isRecurring ? (
            <div className="form-group">
              <label>Valid To:</label>
              <input
                type="date"
                name="validTo"
                value={formData.validTo || defaultEndDate}
                min={formData.validFrom || today}
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
            slots
            .filter(slot => slot && slot.id) // Filter out any invalid slots
            .map(slot => (
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
                    onClick={() => {
                      setEditingSlot(slot);
                      setShowForm(true);
                    }}
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
            ))
          )}
        </div>
      ) : (
        <div className="calendar-view">
          <p>Calendar view will be implemented here</p>
          <div className="slots-grid">
            {slots
              .filter(slot => slot && slot.id) // Filter out any invalid slots
              .map(slot => (
                <div 
                  key={`calendar-slot-${slot.id}`} 
                  className="calendar-slot"
                  onClick={() => {
                    setEditingSlot(slot);
                    setShowForm(true);
                  }}>
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