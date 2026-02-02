import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaFilter, 
  FaCheck, 
  FaTimes, 
  FaFlag, 
  FaTrash, 
  FaEye, 
  FaSync, 
  FaChevronLeft, 
  FaChevronRight 
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import axios from 'axios';
import '../../styles/AdminReviewManagement.css';
import reviewService from '../../services/reviewService';

// Status badge component with consistent styling
const StatusBadge = ({ status }) => {
  const statusConfig = {
    PENDING: { label: 'Pending', className: 'status-pending' },
    APPROVED: { label: 'Approved', className: 'status-approved' },
    FLAGGED: { label: 'Flagged', className: 'status-flagged' },
    REJECTED: { label: 'Rejected', className: 'status-rejected' }
  };

  const config = statusConfig[status] || { label: status, className: '' };

  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
};

const AdminReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({
    totalReviews: 0,
    approvedReviews: 0,
    pendingReviews: 0,
    flaggedReviews: 0,
    rejectedReviews: 0
  });

  const [filters, setFilters] = useState({
    status: '',
    tutorId: '',
    studentUserId: '',
    fromDate: '',
    toDate: ''
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [modalAction, setModalAction] = useState('');
  const [modalNotes, setModalNotes] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const data = await reviewService.getAllReviews({
          status: filters.status || undefined,
          tutorId: filters.tutorId || undefined,
          studentUserId: filters.studentUserId || undefined,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
          page,
          pageSize: 20
        });
        
        setReviews(data.reviews || []);
        
        // Update stats from the API response
        if (data.summary) {
          setStats({
            totalReviews: data.summary.totalReviews || 0,
            approvedReviews: data.summary.reviewsByStatus?.approved || 0,
            pendingReviews: data.summary.reviewsByStatus?.pending || 0,
            flaggedReviews: data.summary.reviewsByStatus?.flagged || 0,
            rejectedReviews: data.summary.reviewsByStatus?.rejected || 0
          });
        }
        
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.totalCount || 0);
      } catch (error) {
        toast.error('Failed to load reviews. Please try again.');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [filters, page]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(1);
  };

  const handleStatusUpdate = async (reviewId, status) => {
    try {
      setLoading(true);
      await reviewService.updateReviewStatus(reviewId, { 
        status: status,
        notes: modalNotes || `Review ${status.toLowerCase()} by admin`
      });
      
      // Refresh the reviews after update
      const data = await reviewService.getAllReviews({
        status: filters.status || undefined,
        tutorId: filters.tutorId || undefined,
        studentUserId: filters.studentUserId || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        page,
        pageSize: 20
      });
      
      setReviews(data.reviews || []);
      if (data.summary) {
        setStats({
          totalReviews: data.summary.totalReviews || 0,
          approvedReviews: data.summary.reviewsByStatus?.approved || 0,
          pendingReviews: data.summary.reviewsByStatus?.pending || 0,
          flaggedReviews: data.summary.reviewsByStatus?.flagged || 0,
          rejectedReviews: data.summary.reviewsByStatus?.rejected || 0
        });
      }
      
      setShowModal(false);
      setModalNotes('');
      toast.success(`Review ${status.toLowerCase()} successfully`);
    } catch (error) {
      toast.error(`Failed to update review status: ${error.response?.data?.message || error.message}`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      try {
        setLoading(true);
        await reviewService.deleteReview(reviewId);
        
        // Refresh the reviews after deletion
        const data = await reviewService.getAllReviews({
          status: filters.status || undefined,
          tutorId: filters.tutorId || undefined,
          studentUserId: filters.studentUserId || undefined,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
          page,
          pageSize: 20
        });
        
        setReviews(data.reviews || []);
        if (data.summary) {
          setStats({
            totalReviews: data.summary.totalReviews || 0,
            approvedReviews: data.summary.reviewsByStatus?.approved || 0,
            pendingReviews: data.summary.reviewsByStatus?.pending || 0,
            flaggedReviews: data.summary.reviewsByStatus?.flagged || 0,
            rejectedReviews: data.summary.reviewsByStatus?.rejected || 0
          });
        }
        
        toast.success('Review deleted successfully');
      } catch (error) {
        toast.error(`Failed to delete review: ${error.response?.data?.message || error.message}`);
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const openModal = (review, action) => {
    setSelectedReview(review);
    setModalAction(action);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReview(null);
    setModalAction('');
    setModalNotes('');
  };

  const renderModal = () => {
    if (!showModal || !selectedReview) return null;

    const actionText = modalAction.charAt(0).toUpperCase() + modalAction.slice(1);
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">{actionText} Review</h3>
            <button className="modal-close" onClick={closeModal}>&times;</button>
          </div>
          <div className="modal-body">
            <p>You are about to <strong>{modalAction}</strong> the following review:</p>
            <div className="review-preview">
              <p><strong>From:</strong> {selectedReview.studentName}</p>
              <p><strong>Rating:</strong> {selectedReview.rating}/5</p>
              <p><strong>Comment:</strong> {selectedReview.comment}</p>
            </div>
            
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label htmlFor="modalNotes" className="filter-label">
                {modalAction === 'delete' ? 'Reason for deletion (optional):' : 'Notes (optional):'}
              </label>
              <textarea
                id="modalNotes"
                className="filter-input"
                rows="3"
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder="Add any additional notes..."
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={closeModal}>
              Cancel
            </button>
            <button 
              className={`btn ${modalAction === 'delete' ? 'btn-danger' : 'btn-primary'}`}
              onClick={() => {
                const handleModalAction = () => {
                  if (!selectedReview) return;
                  
                  if (modalAction === 'delete') {
                    handleDeleteReview(selectedReview.reviewId);
                  } else {
                    handleStatusUpdate(selectedReview.reviewId, modalAction.toUpperCase());
                  }
                };
                handleModalAction();
              }}
            >
              {actionText} Review
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-review-management">
      <header className="admin-header">
        <h1>Review Management</h1>
        <p>Manage and moderate all reviews in the system</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalReviews}</div>
          <div className="stat-label">Total Reviews</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#28a745' }}>{stats.approvedReviews}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ffc107' }}>{stats.pendingReviews}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#dc3545' }}>{stats.flaggedReviews}</div>
          <div className="stat-label">Flagged</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#6c757d' }}>{stats.rejectedReviews}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      <div className="filters-container">
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="status" className="filter-label">Status</label>
            <select 
              id="status"
              name="status"
              className="filter-select"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="FLAGGED">Flagged</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="tutorId" className="filter-label">Tutor ID</label>
            <input
              type="text"
              id="tutorId"
              name="tutorId"
              className="filter-input"
              placeholder="Filter by Tutor ID"
              value={filters.tutorId}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="studentUserId" className="filter-label">Student ID</label>
            <input
              type="text"
              id="studentUserId"
              name="studentUserId"
              className="filter-input"
              placeholder="Filter by Student ID"
              value={filters.studentUserId}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="fromDate" className="filter-label">From Date</label>
            <input
              type="date"
              id="fromDate"
              name="fromDate"
              className="filter-input"
              value={filters.fromDate}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="toDate" className="filter-label">To Date</label>
            <input
              type="date"
              id="toDate"
              name="toDate"
              className="filter-input"
              value={filters.toDate}
              onChange={handleFilterChange}
            />
          </div>
        </div>
        
        <div className="action-buttons">
          <button 
            className="btn btn-outline"
            onClick={() => {
              setFilters({
                status: '',
                tutorId: '',
                studentUserId: '',
                fromDate: '',
                toDate: ''
              });
              setPage(1);
            }}
          >
            <FaTimes /> Clear Filters
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={() => {
              setLoading(true);
              reviewService.getAllReviews({
                ...filters,
                page,
                pageSize: 20
              })
              .then(data => {
                setReviews(data.reviews);
                setStats(data.summary);
              })
              .catch(error => {
                toast.error('Failed to refresh reviews');
                console.error('Error:', error);
              })
              .finally(() => setLoading(false));
            }}
            disabled={loading}
          >
            <FaSync /> Refresh
          </button>
        </div>
      </div>

      <div className="reviews-table-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <h3>No reviews found</h3>
            <p>Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="reviews-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Student</th>
                    <th>Tutor</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.reviewId}>
                      <td>#{review.reviewId}</td>
                      <td>{review.studentName || 'Anonymous'}</td>
                      <td>{review.tutorName || 'N/A'}</td>
                      <td>{review.rating}/5</td>
                      <td className="review-content" title={review.comment}>
                        {review.comment || 'No comment'}
                      </td>
                      <td>
                        <StatusBadge status={review.status} />
                      </td>
                      <td>
                        {format(new Date(review.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-icon"
                            title="View Details"
                            onClick={() => openModal(review, 'view')}
                          >
                            <FaEye />
                          </button>
                          
                          {review.status !== 'APPROVED' && (
                            <button 
                              className="btn-icon approve"
                              title="Approve Review"
                              onClick={() => openModal(review, 'approve')}
                            >
                              <FaCheck />
                            </button>
                          )}
                          
                          {review.status !== 'FLAGGED' && (
                            <button 
                              className="btn-icon flag"
                              title="Flag Review"
                              onClick={() => openModal(review, 'flag')}
                            >
                              <FaFlag />
                            </button>
                          )}
                          
                          <button 
                            className="btn-icon delete"
                            title="Delete Review"
                            onClick={() => openModal(review, 'delete')}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="pagination">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1 || loading}
              >
                <FaChevronLeft />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    className={page === pageNum ? 'active' : ''}
                    onClick={() => setPage(pageNum)}
                    disabled={loading}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages || loading}
              >
                <FaChevronRight />
              </button>
              
              <span style={{ marginLeft: '1rem', color: '#7f8c8d', fontSize: '0.9rem' }}>
                {totalItems} total reviews
              </span>
            </div>
          </>
        )}
      </div>
      
      {renderModal()}
    </div>
  );
};

export default AdminReviewManagement;