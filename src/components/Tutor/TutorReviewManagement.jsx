import React, { useState, useEffect } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar, FaReply, FaFlag, FaSearch, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import { format } from 'date-fns';
import { API_BASE_URL, AUTH_TOKEN } from '../../config';
import '../../styles/TutorReviewManagement.css';

// API Service Functions
const reviewService = {
  // Get tutor's reviews
  getTutorReviews: async (tutorId, status = '') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/Review/tutor/my-reviews${status ? `?status=${status}` : ''}`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN)}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      return response.data?.reviews || [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      const errorMsg = error.response?.data?.message || 'Failed to load reviews';
      toast.error(errorMsg);
      throw error; // Re-throw to handle in the component
    }
  },

  // Respond to a review
  respondToReview: async (reviewId, response) => {
    try {
      await axios.post(
        `/api/Review/${reviewId}/respond`,
        { response },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      return true;
    } catch (error) {
      console.error('Error responding to review:', error);
      toast.error('Failed to submit response');
      return false;
    }
  },

  // Report a review
  reportReview: async (reviewId, reason) => {
    try {
      await axios.post(
        `/api/Review/${reviewId}/report`,
        { reason },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      return true;
    } catch (error) {
      console.error('Error reporting review:', error);
      toast.error('Failed to report review');
      return false;
    }
  },

  // Get tutor review statistics
  getReviewStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/Review/tutor/stats`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN)}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching review stats:', error);
      const errorMsg = error.response?.data?.message || 'Failed to load review statistics';
      toast.error(errorMsg);
      throw error; // Re-throw to handle in the component
    }
  }
};

// Star Rating Component
const StarRating = ({ rating, size = '1.25em' }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(<FaStar key={i} className="star-icon filled" style={{ fontSize: size }} />);
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(<FaStarHalfAlt key={i} className="star-icon half" style={{ fontSize: size }} />);
    } else {
      stars.push(<FaRegStar key={i} className="star-icon" style={{ fontSize: size }} />);
    }
  }
  return <div className="star-rating">{stars}</div>;
};

// Main Component
const TutorReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [responseText, setResponseText] = useState('');
  const [activeResponseId, setActiveResponseId] = useState(null);

  // Load reviews with filter support
  const loadReviews = async () => {
    try {
      const reviewsData = await reviewService.getTutorReviews('current', filter);
      setReviews(reviewsData);
      return reviewsData;
    } catch (error) {
      console.error('Failed to load reviews:', error);
      toast.error('Failed to load reviews');
      throw error;
    }
  };

  // Load review statistics
  const loadStats = async () => {
    try {
      const statsData = await reviewService.getReviewStats();
      setStats(statsData);
      return statsData;
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error('Failed to load review statistics');
      throw error;
    }
  };

  // Load data on component mount and when filter changes
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadReviews(), loadStats()]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [filter]);

  // Initialize stats with default values
  const safeStats = stats || {
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: {
      '5Star': 0,
      '4Star': 0,
      '3Star': 0,
      '2Star': 0,
      '1Star': 0
    }
  };

  const handleResponseSubmit = async (reviewId) => {
    if (!responseText.trim()) {
      toast.warning('Please enter a response');
      return;
    }
    
    try {
      setLoading(true);
      await reviewService.respondToReview(reviewId, responseText);
      toast.success('Response submitted successfully');
      setResponseText('');
      setActiveResponseId(null);
      await loadReviews();
    } catch (error) {
      console.error('Failed to submit response:', error);
      toast.error(error.response?.data?.message || 'Failed to submit response');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (reviewId) => {
    const reason = prompt('Please enter the reason for reporting this review:');
    if (reason && reason.trim()) {
      const success = await reviewService.reportReview(reviewId, reason);
      if (success) {
        toast.success('Review reported successfully');
        loadReviews();
      }
    }
  };

  // Filter and search reviews
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = searchTerm === '' || 
      review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !filter || review.status.toLowerCase() === filter.toLowerCase();
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="review-management">
      <h1 className="review-header">My Reviews</h1>
      
      {/* Stats Overview */}
      <div className="stats-card">
        {loading && !stats ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="stats-grid">
            <div className="average-rating">
              <div className="rating-large">{safeStats.averageRating?.toFixed(1) || '0.0'}</div>
              <StarRating rating={safeStats.averageRating || 0} />
              <div className="rating-count">{safeStats.totalReviews || 0} reviews</div>
            </div>
            <div className="rating-bars">
              {[5, 4, 3, 2, 1].map(star => {
                const starCount = safeStats.ratingBreakdown?.[`${star}Star`] || 0;
                const percentage = safeStats.totalReviews > 0 
                  ? (starCount / safeStats.totalReviews) * 100 
                  : 0;
                
                return (
                  <div key={star} className="rating-bar">
                    <div className="rating-label">
                      <span>{star}</span>
                      <FaStar className="star-icon" />
                    </div>
                    <div className="progress-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="rating-count">
                      {starCount}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="filters-container">
        <div className="filters-grid">
          <div className="search-input">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All Reviews</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="flagged">Flagged</option>
          </select>
          
          <button 
            className="refresh-btn"
            onClick={loadReviews}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="reviews-list">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="empty-state">
            <p>No reviews found</p>
          </div>
        ) : (
          filteredReviews.map(review => (
            <div key={review.reviewId} className="review-item">
              <div className="review-header">
                <div>
                  <div className="student-info">
                    <h3 className="student-name">
                      {review.isAnonymous ? 'Anonymous Student' : review.studentName}
                    </h3>
                    <span className="status-badge">{review.status}</span>
                  </div>
                  <div className="review-meta">
                    <StarRating rating={review.rating} />
                    <span className="review-date">
                      {review.createdAt ? format(new Date(review.createdAt), 'MMM d, yyyy') : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="review-actions">
                  {!review.tutorResponse && (
                    <button 
                      className="action-btn primary"
                      onClick={() => setActiveResponseId(
                        activeResponseId === review.reviewId ? null : review.reviewId
                      )}
                    >
                      <FaReply /> {activeResponseId === review.reviewId ? 'Cancel' : 'Respond'}
                    </button>
                  )}
                  <button 
                    className="action-btn danger"
                    onClick={() => handleReport(review.reviewId)}
                    title="Report Review"
                  >
                    <FaFlag /> Report
                  </button>
                </div>
              </div>
              
              <div className="review-content">
                <p>{review.comment}</p>
              </div>
              
              {review.tutorResponse && (
                <div className="tutor-response">
                  <div className="response-header">
                    <strong>Your Response</strong>
                    <span className="response-date">
                      {format(new Date(review.tutorRespondedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p>{review.tutorResponse}</p>
                </div>
              )}
              
              {activeResponseId === review.reviewId && (
                <div className="response-form">
                  <textarea
                    className="response-textarea"
                    placeholder="Type your response here..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows="3"
                  />
                  <div className="form-actions">
                    <button 
                      className="action-btn secondary"
                      onClick={() => setActiveResponseId(null)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="action-btn primary"
                      onClick={() => handleRespond(review.reviewId)}
                      disabled={!responseText.trim()}
                    >
                      Submit Response
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TutorReviewManagement;
