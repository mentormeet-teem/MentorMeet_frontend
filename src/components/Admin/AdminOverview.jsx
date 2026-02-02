import React, { useEffect, useState, useRef } from 'react';
import { API_BASE_URL } from '../../config';
import { getAuthToken } from '../../utils/auth';
import { Chart, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

Chart.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTutors: 0,
    pendingTutors: 0,
    verifiedTutors: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getAuthToken();
        console.log('Fetching stats from:', `${API_BASE_URL}/api/admin/dashboard/stats`);
        const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`Failed to fetch dashboard stats: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Response Data:', data);
        
        setStats({
          totalUsers: data.totalUsers || 0,
          activeUsers: data.activeUsers || 0,
          totalTutors: data.usersByRole?.tutors || 0,
          pendingTutors: data.pendingTutors || 0,
          verifiedTutors: data.verifiedTutors || 0,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard statistics'
        }));
      }
    };

    fetchStats();
  }, []);

  if (stats.loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className="dashboard-error">
        <p>{stats.error}</p>
        <button className="retry-button" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }
  const chartData = {
    labels: ['Users', 'Active Users', 'Tutors', 'Pending Tutors'],
    datasets: [
      {
        label: 'Overview',
        data: [
          stats.totalUsers || 0,
          stats.activeUsers || 0,
          stats.verifiedTutors || 0,
          stats.pendingTutors || 0
        ],
        backgroundColor: [
          'var(--chart-primary)',
          'var(--chart-secondary)',
          'var(--chart-tertiary)',
          'var(--chart-quaternary)'
        ],
        borderColor: [
          'var(--chart-primary-hover)',
          'var(--chart-secondary-hover)',
          'var(--chart-tertiary-hover)',
          'var(--chart-quaternary-hover)'
        ],
        borderWidth: 1,
        borderRadius: 8,
        hoverBackgroundColor: [
          'var(--chart-primary-hover)',
          'var(--chart-secondary-hover)',
          'var(--chart-tertiary-hover)',
          'var(--chart-quaternary-hover)'
        ]
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          boxWidth: 10,
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => ({
                text: label,
                fillStyle: data.datasets[0].backgroundColor[i],
                strokeStyle: data.datasets[0].borderColor[i],
                lineWidth: 1,
                hidden: false,
                index: i
              }));
            }
            return [];
          }
        }
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw} users`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'var(--chart-grid)'
        },
        ticks: {
          color: 'var(--chart-axis)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'var(--chart-axis)'
        }
      }
    }
  };

  return (
    <div className="admin-overview">
      <div className="dashboard-header">
        <h1>Overview</h1>
      </div>

      <div className="dashboard-stats">
        <div className="stat-item pending">
          <div className="stat-content">
            <span className="stat-label">Pending Tutors</span>
            <span className="stat-value">{stats.pendingTutors}</span>
          </div>
        </div>

        <div className="stat-item verified">
          <div className="stat-content">
            <span className="stat-label">Verified Tutors</span>
            <span className="stat-value">{stats.verifiedTutors}</span>
          </div>
        </div>

        <div className="stat-item users">
          <div className="stat-content">
            <span className="stat-label">Total Users</span>
            <span className="stat-value">{stats.totalUsers}</span>
          </div>
        </div>

        <div className="stat-item sessions">
          <div className="stat-content">
            <span className="stat-label">Active Users</span>
            <span className="stat-value">{stats.activeUsers}</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Platform Statistics</h3>
          </div>
          <div className="chart-wrapper">
            <Bar data={chartData} options={options} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
