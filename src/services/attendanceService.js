import axios from 'axios';
import { API_BASE_URL } from '../config';

const getAuthToken = () => {
  return sessionStorage.getItem('mentormeet_token') || localStorage.getItem('mentormeet_token');
};

export const searchAttendance = async (filters = {}) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    const statusMap = {
      'Pending': 1,
      'Present': 2,    
      'Absent': 3,     
      'Disputed': 4, 
      'NoShow': 5,     
      'No Show': 5,    
      'Cancelled': 6   
    };
    
    const statusDisplayMap = {
      0: 'Pending',
      1: 'Present',
    };
    const requestData = {
      ...filters,
      FromDate: filters.FromDate ? new Date(filters.FromDate).toISOString() : undefined,
      ToDate: filters.ToDate ? new Date(filters.ToDate).toISOString() : undefined,
      Status: filters.Status ? statusMap[filters.Status] : undefined,
      Page: filters.Page || 1,
      PageSize: filters.PageSize || 20
    };
    console.log('Request data being sent to backend:', JSON.stringify(requestData, null, 2));

    Object.keys(requestData).forEach(key => {
      if (requestData[key] === undefined) {
        delete requestData[key];
      }
    });

    console.log('Fetching attendance with filters:', requestData);
    
    const response = await axios({
      method: 'POST',
      url: `${API_BASE_URL}/api/Attendance/admin/search`,
      data: requestData,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('Received response from /api/attendance/admin/search:', response.data);
    
    if (response.data) {
      const responseData = response.data;
      const items = responseData.records || [];
      const mappedItems = items.map(item => {
        let status = item.Status || item.status || 'Pending';
        status = String(status).charAt(0).toUpperCase() + String(status).slice(1).toLowerCase();
        const validStatuses = ['Present', 'Absent', 'Pending', 'Disputed', 'NoShow', 'No Show', 'Cancelled'];
        if (!validStatuses.includes(status)) {
          console.warn(`Unexpected status value: ${status}, defaulting to Pending`);
          status = 'Pending';
        }

        if (status === 'No Show') status = 'NoShow';
        const statusDisplay = status === 'NoShow' ? 'No Show' : status;
        const statusMap = {
          'Pending': 0,
          'Present': 1,
          'Absent': 2,
          'Disputed': 3,
          'NoShow': 4,
          'Cancelled': 5
        };
        console.log('Processing attendance item:', {
          id: item.AttendanceId,
          tutorMarked: item.TutorMarkedPresent,
          studentMarked: item.StudentMarkedPresent,
          tutorMarkedAt: item.TutorMarkedAt,
          studentMarkedAt: item.StudentMarkedAt,
          status: status,
          hasTutorMarked: item.TutorMarkedAt !== null,
          hasStudentMarked: item.StudentMarkedAt !== null
        });
        const hasStudentMarked = item.StudentMarkedAt !== null;
        const hasTutorMarked = item.TutorMarkedAt !== null;

        return {
          id: item.AttendanceId,
          bookingId: item.BookingId,
          sessionDate: item.SessionDate,
          startTime: item.SessionTime?.split(' - ')[0] ? `1970-01-01T${item.SessionTime.split(' - ')[0]}` : '',
          endTime: item.SessionTime?.split(' - ')[1] ? `1970-01-01T${item.SessionTime.split(' - ')[1]}` : '',
          tutorName: item.TutorName,
          studentName: item.StudentName,
          subjectName: item.Subject,
          status: status,
          statusDisplay: statusDisplay,
          statusValue: statusMap[status] || 0,
          // Only mark as conflict if both tutor and student have marked differently
          hasConflict: hasTutorMarked && hasStudentMarked && 
                      item.TutorMarkedPresent !== item.StudentMarkedPresent,
          tutorMarkedAt: item.TutorMarkedAt,
          studentMarkedAt: item.StudentMarkedAt,
          // Only include tutorMarkedPresent if tutor has marked
          tutorMarkedPresent: hasTutorMarked ? item.TutorMarkedPresent : undefined,
          // Only include studentMarkedPresent if student has marked
          studentMarkedPresent: hasStudentMarked ? item.StudentMarkedPresent : undefined,
          tutorNotes: item.TutorNotes,
          studentNotes: item.StudentNotes,
          markedAt: item.TutorMarkedAt || item.StudentMarkedAt,
          notes: item.TutorNotes || item.StudentNotes || ''
        };
      });
      
      return {
        records: mappedItems,
        totalCount: responseData.pagination?.totalCount || mappedItems.length,
        page: responseData.pagination?.Page || 1,
        pageSize: responseData.pagination?.PageSize || mappedItems.length,
        summary: responseData.summary };
    }
    
    return { records: [], totalCount: 0, page: 1, pageSize: 20 };
  } catch (error) {
    console.error('Error in getAdminAttendanceOverview:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};
export const getAdminAttendanceSummary = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(
      `${API_BASE_URL}/api/Attendance/admin/summary`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    throw error;
  }
};
export const getTodaysSessions = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/attendance/tutor/today-sessions`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data?.sessions || [];
  } catch (error) {
    console.error('Error fetching today\'s sessions:', {
      error: error.message,
      response: error.response?.data
    });
    throw new Error(error.response?.data?.message || 'Failed to fetch today\'s sessions');
  }
};

export const markAttendance = async (bookingId, isPresent) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/attendance/tutor/mark/${bookingId}`,
      { isPresent },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error marking attendance:', {
      error: error.message,
      response: error.response?.data
    });
    throw new Error(error.response?.data?.message || 'Failed to mark attendance');
  }
};
export const getAttendanceByTutor = async (tutorId) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const requestData = {
      TutorUserId: tutorId,
      FromDate: thirtyDaysAgo.toISOString().split('T')[0],
      ToDate: today.toISOString().split('T')[0],
      Page: 1,
      PageSize: 100
    };

    console.log('Fetching tutor attendance with data:', requestData);
    
    const response = await axios.post(
      `${API_BASE_URL}/api/attendance/admin/search`,
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
      }
    }
  );
  
  console.log('Tutor attendance response:', response.data);
  const items = response.data?.records || [];
  return items.map(item => ({
    id: item.AttendanceId,
    bookingId: item.BookingId,
    sessionDate: item.SessionDate,
    startTime: item.SessionTime?.split(' - ')[0] ? `1970-01-01T${item.SessionTime.split(' - ')[0]}` : '',
    endTime: item.SessionTime?.split(' - ')[1] ? `1970-01-01T${item.SessionTime.split(' - ')[1]}` : '',
    tutorName: item.TutorName,
    studentName: item.StudentName,
    subjectName: item.Subject,
    status: item.Status,
    markedAt: item.TutorMarkedAt || item.StudentMarkedAt,
    notes: item.TutorNotes || item.StudentNotes || ''
  }));
} catch (error) {
  console.error('Error in getAttendanceByTutor:', {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data
  });
  throw error;
}
};
export const getAttendanceDetails = async (attendanceId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(
      `${API_BASE_URL}/api/attendance/${attendanceId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance details:', error);
    throw error;
  }
};
export const getTutorsForAttendance = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Fetching verified tutors from /api/auth/admin/verified-tutors');
    const response = await axios.get(
      `${API_BASE_URL}/api/auth/admin/verified-tutors`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('Verified tutors response:', response.data);

    let tutors = [];
    if (response.data && Array.isArray(response.data)) {
      tutors = response.data;
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      tutors = response.data.data;
    } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
      tutors = response.data.items;
    }

    console.log('Fetched tutors:', tutors);
    
    return tutors.map(user => ({
      id: user.id || user.userId,
      name: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email,
      email: user.email,
      // Include any additional fields that might be needed
      ...(user.firstName && { firstName: user.firstName }),
      ...(user.lastName && { lastName: user.lastName })
    }));
  } catch (error) {
    console.error('Error fetching tutors list:', error);
    throw error;
  }
};
export const getStudentsForAttendance = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Fetching all users from /api/Admin/users');
    const response = await axios.get(
      `${API_BASE_URL}/api/Admin/users`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          page: 1,
          pageSize: 1000 }
      }
    );

    let users = [];
    if (response.data && response.data.users) {
      users = response.data.users;
    } else if (Array.isArray(response.data)) {
      users = response.data;
    }
    const students = users.filter(user => 
      user.Roles && 
      Array.isArray(user.Roles) && 
      user.Roles.includes('Student') ||
      user.UserType === 'Student'
    );

    if (students.length === 0) {
      console.warn('No students found in the users list');
      return [];
    }

    console.log(`Found ${students.length} students`);
    return students.map(student => ({
      id: student.Id || student.id || student.userId,
      firstName: student.FirstName || student.firstName || 'Student',
      lastName: student.LastName || student.lastName || '',
      email: student.Email || student.email || '',
      name: `${student.FirstName || ''} ${student.LastName || ''}`.trim() || 'Student',
      isActive: student.IsActive !== undefined ? student.IsActive : true
    }));

  } catch (error) {
    console.error('Error in getStudentsForAttendance:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    return [];
  }
};