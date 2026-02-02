import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";
import { getAuthToken } from "../../utils/auth";
import "./../../styles/TutorPayments.css";
import { toast } from "react-toastify";

const Icons = {
  Wallet: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
      <rect x="3" y="9" width="18" height="12" rx="2"></rect>
      <path d="M7 15h.01"></path>
    </svg>
  ),
  Clock: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  DollarSign: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  ),
  ArrowUp: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 19V5"></path>
      <path d="M5 12l7-7 7 7"></path>
    </svg>
  ),
  ArrowDown: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 5v14"></path>
      <path d="M19 12l-7 7-7-7"></path>
    </svg>
  ),
  CheckCircle: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
};
const TutorPaymentsService = {
  fetchBookingsWithPayments: async () => {
    try {
      const token = getAuthToken();
      const bookingsRes = await fetch(
        `${API_BASE_URL}/api/booking/tutor/bookings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!bookingsRes.ok) return [];
      const bookingsData = await bookingsRes.json();
      const bookings = bookingsData.bookings ?? bookingsData ?? [];
      if (!Array.isArray(bookings) || bookings.length === 0) return [];

      const results = [];
      for (const b of bookings) {
        const bookingId = b.BookingId ?? b.bookingId ?? b.id;
        if (!bookingId) continue;
        try {
          const payRes = await fetch(
            `${API_BASE_URL}/api/payment/tutor/payments/${bookingId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (payRes.ok) {
            const pay = await payRes.json();
            results.push({
              bookingId,
              studentName:
                pay.StudentName ??
                pay.studentName ??
                b.student?.name ??
                "Student",
              amount: pay.Amount ?? pay.amount ?? 0,
              tutorAmount: pay.TutorAmount ?? pay.tutorAmount ?? 0,
              status: pay.Status ?? pay.status ?? 0,
              isReleased: pay.IsReleased ?? pay.isReleased ?? false,
              createdAt: pay.CreatedAt ?? pay.createdAt,
              completedAt: pay.CompletedAt ?? pay.completedAt,
            });
          }
        } catch (_) {
          /* skip */
        }
      }
      return results.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    } catch (e) {
      console.error("Error fetching bookings with payments:", e);
      return [];
    }
  },

  fetchEarnings: async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/payment/wallet/balance`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch wallet balance");
      }

      const data = await response.json();
      // Backend uses PascalCase (PropertyNamingPolicy = null)
      const available = data.AvailableBalance ?? data.availableBalance ?? 0;
      const pending = data.PendingBalance ?? data.pendingBalance ?? 0;
      const total = data.TotalBalance ?? available + pending;
      return {
        availableBalance: available,
        pendingBalance: pending,
        totalEarnings: total,
      };
    } catch (error) {
      console.error("Error fetching earnings:", error);
      return {
        availableBalance: 0,
        pendingBalance: 0,
        totalEarnings: 0,
      };
    }
  },
fetchTransactions: async (filter = "all") => {
  try {
    // Build query parameters based on filter
    const params = new URLSearchParams();
    
    // Add pagination parameters
    params.append('page', 1);
    params.append('pageSize', 50);
    
    const response = await fetch(
      `${API_BASE_URL}/api/Payment/transactions/history?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Error response from server:", errorData);
      throw new Error("Failed to fetch transactions");
    }

    const transactions = await response.json();
    
    if (!Array.isArray(transactions)) {
      console.error("Unexpected transactions format:", transactions);
      return [];
    }

    // Map the transactions to the expected format
    return transactions.map(tx => {
      const isCredit = (tx.Type || '').toLowerCase() === 'credit';
      const status = (tx.Status || '').toLowerCase();
      
      return {
        id: tx.Id,
        amount: tx.Amount || 0,
        type: isCredit ? 'credit' : 'debit',
        description: tx.Description || 'Transaction',
        status: status || 'completed',
        createdAt: tx.CreatedAt || new Date().toISOString(),
        reference: tx.ReferenceId || tx.TransactionId
      };
    });

  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
},

  requestWithdrawal: async (amount) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/withdraw`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Amount: amount }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.Message ??
            errorData.message ??
            "Failed to process withdrawal"
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Withdrawal error:", error);
      throw error;
    }
  },
};
const TutorPayments = () => {
  const [earnings, setEarnings] = useState({
    availableBalance: 0, // Can be withdrawn immediately
    pendingBalance: 0,   // In escrow, pending admin release after session
    totalEarnings: 0,    // availableBalance + pendingBalance
    isLoading: true,
    error: null,
  });

  const [transactions, setTransactions] = useState({
    data: [],
    isLoading: true,
    filter: "all",
    error: null,
  });

  const [withdrawal, setWithdrawal] = useState({
    amount: "",
    isSubmitting: false,
    error: null,
    success: false,
  });

  const [bookingsWithPayments, setBookingsWithPayments] = useState({
    data: [],
    isLoading: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setEarnings((prev) => ({ ...prev, isLoading: true, error: null }));
        setTransactions((prev) => ({ ...prev, isLoading: true, error: null }));
        setBookingsWithPayments((prev) => ({ ...prev, isLoading: true }));

        const [earningsData, transactionsData, bookingsPayments] =
          await Promise.all([
            TutorPaymentsService.fetchEarnings(),
            TutorPaymentsService.fetchTransactions(transactions.filter),
            TutorPaymentsService.fetchBookingsWithPayments(),
          ]);

        setEarnings({
          ...earningsData,
          isLoading: false,
          error: null,
        });

        setTransactions({
          filter: transactions.filter,
          data: transactionsData,
          isLoading: false,
          error: null,
        });

        setBookingsWithPayments({ data: bookingsPayments, isLoading: false });
      } catch (error) {
        console.error("Error fetching data:", error);
        setEarnings((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to load wallet data.",
        }));
        setTransactions((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to load transaction history.",
        }));
        setBookingsWithPayments((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchData();
  }, [transactions.filter]);

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawal.amount);

    if (isNaN(amount) || amount < 10) {
      setWithdrawal((prev) => ({
        ...prev,
        error: "Minimum withdrawal amount is 10 ETB",
      }));
      return;
    }

    if (amount > earnings.availableBalance) {
      setWithdrawal((prev) => ({
        ...prev,
        error: "Insufficient available balance",
      }));
      return;
    }

    try {
      setWithdrawal((prev) => ({
        ...prev,
        isSubmitting: true,
        error: null,
        success: false,
      }));

      const result = await TutorPaymentsService.requestWithdrawal(amount);

      const [updatedEarnings, updatedTransactions, bookingsPayments] =
        await Promise.all([
          TutorPaymentsService.fetchEarnings(),
          TutorPaymentsService.fetchTransactions(transactions.filter),
          TutorPaymentsService.fetchBookingsWithPayments(),
        ]);

      setEarnings({
        ...updatedEarnings,
        isLoading: false,
        error: null,
      });

      setTransactions((prev) => ({
        ...prev,
        data: updatedTransactions,
        isLoading: false,
      }));
      setBookingsWithPayments({ data: bookingsPayments, isLoading: false });

      setWithdrawal({
        amount: "",
        isSubmitting: false,
        error: null,
        success: true,
      });
    } catch (error) {
      console.error("Withdrawal error:", error);
      setWithdrawal((prev) => ({
        ...prev,
        isSubmitting: false,
        error: error.message || "Failed to process withdrawal",
        success: false,
      }));
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    const response = await fetch(`${API_BASE_URL}/api/Bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error('Failed to update booking status');
    }
    
    return await response.json();
  };

  const fetchBookings = async () => {
    try {
      const data = await TutorPaymentsService.fetchBookingsWithPayments();
      setBookingsWithPayments({ data, isLoading: false });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookingsWithPayments(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      // First, update the booking status
      await updateBookingStatus(bookingId, newStatus);
      
      // If the new status is "Completed", release the escrow
      if (newStatus === 'Completed') {
        try {
          const response = await fetch(`${API_BASE_URL}/api/Payment/release-escrow/${bookingId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to release escrow');
          }

          // Show success message
          toast.success('Session completed. Payment will be processed after admin verification.');
          
          // Refresh all data
          const [updatedEarnings, transactionsData, bookingsPayments] = await Promise.all([
            fetchEarnings(),
            TutorPaymentsService.fetchTransactions(transactions.filter),
            TutorPaymentsService.fetchBookingsWithPayments(),
          ]);
          
          setEarnings({
            ...updatedEarnings,
            isLoading: false,
            error: null,
          });
          
          setTransactions(prev => ({
            ...prev,
            data: transactionsData,
            isLoading: false,
          }));
          
          setBookingsWithPayments({ 
            data: bookingsPayments, 
            isLoading: false 
          });
          
        } catch (error) {
          console.error('Error releasing escrow:', error);
          toast.error(error.message || 'Failed to process payment release');
          return;
        }
      } else {
        // For other status updates, just refresh the bookings
        await fetchBookings();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update booking status');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (earnings.isLoading) {
    return (
      <div className="tutor-payments">
        <h2>My Earnings</h2>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (earnings.error) {
    return (
      <div className="tutor-payments">
        <h2>My Earnings</h2>
        <div className="error">{earnings.error}</div>
      </div>
    );
  }

  return (
    <div className="tutor-payments">
      <h2>My Earnings</h2>

      <div className="dashboard-grid">
        <div className="card balance-card">
          <h3>Available Balance</h3>
          <div className="amount">
            {formatCurrency(earnings.availableBalance)}
          </div>
          <p className="hint">Ready to withdraw</p>
          <button
            className="btn btn-primary"
            onClick={() => document.getElementById("withdrawAmount")?.focus()}
            disabled={earnings.availableBalance < 10}
          >
            <Icons.Wallet /> Withdraw
          </button>
        </div>

        <div className="card balance-card">
          <h3>Pending Clearance</h3>
          <div className="amount">
            {formatCurrency(earnings.pendingBalance)}
          </div>
          <p className="hint">
            <Icons.Clock /> Released by admin after session ends and attendance
            is verified
          </p>
        </div>

        <div className="card balance-card">
          <h3>Total Earnings</h3>
          <div className="amount">{formatCurrency(earnings.totalEarnings)}</div>
          <p className="hint">
            <Icons.DollarSign /> All-time earnings
          </p>
        </div>
      </div>

      <div className="card">
        <h3>Withdraw Funds</h3>
        <form onSubmit={handleWithdrawal} className="withdrawal-form">
          <div className="form-group">
            <label htmlFor="withdrawAmount">Amount (Min: 10 ETB)</label>
            <input
              id="withdrawAmount"
              type="number"
              className="form-control"
              min="10"
              step="0.01"
              value={withdrawal.amount}
              onChange={(e) =>
                setWithdrawal((prev) => ({
                  ...prev,
                  amount: e.target.value,
                  error: null,
                  success: false,
                }))
              }
              placeholder="Enter amount to withdraw"
              disabled={withdrawal.isSubmitting}
            />
          </div>

          {withdrawal.error && (
            <div className="error-message">{withdrawal.error}</div>
          )}

          {withdrawal.success && (
            <div className="success-message">
              <Icons.CheckCircle /> Withdrawal submitted successfully
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              withdrawal.isSubmitting ||
              !withdrawal.amount ||
              parseFloat(withdrawal.amount) < 10 ||
              parseFloat(withdrawal.amount) > earnings.availableBalance
            }
          >
            {withdrawal.isSubmitting ? "Processing..." : "Request Withdrawal"}
          </button>

          <p className="hint">
            Withdrawals are processed within 1-3 business days. Minimum
            withdrawal: 10 ETB. You can only withdraw from your available balance.
          </p>
        </form>
      </div>

      <div className="payments-by-booking">
        <div className="card">
          <h3>Payments by Booking</h3>
          <p className="hint">
            Earnings from sessions. After you mark a session as completed, the admin will verify
            attendance and release the payment to your available balance. Payments are released within
            24-48 hours after session completion.
          </p>
          {bookingsWithPayments.isLoading ? (
            <div className="loading">Loading...</div>
          ) : bookingsWithPayments.data.length === 0 ? (
            <div className="no-transactions">
              No payment records for your bookings yet.
            </div>
          ) : (
            <div className="booking-payments-list">
              {bookingsWithPayments.data.map((bp) => {
                const statusMap = {
                  0: "Pending",
                  1: "Initiated",
                  2: "Completed",
                  3: "Failed",
                  4: "Refunded",
                  5: "Partially Refunded",
                };
                const statusText =
                  typeof bp.status === "number"
                    ? statusMap[bp.status] ?? "Unknown"
                    : bp.status ?? "Unknown";
                return (
                  <div key={bp.bookingId} className="booking-payment-item">
                    <div className="bp-main">
                      <span className="bp-booking">
                        Booking #{bp.bookingId}
                      </span>
                      <span className="bp-student">{bp.studentName}</span>
                      <span
                        className={`bp-status ${statusText
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {statusText}
                      </span>
                    </div>
                    <div className="bp-amounts">
                      <span>Session: {formatCurrency(bp.amount)}</span>
                      <span>You get: {formatCurrency(bp.tutorAmount)}</span>
                      {bp.isReleased && (
                        <span className="bp-released">Released</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="transactions">
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h3 style={{ margin: 0 }}>Transaction History</h3>
            <div className="transaction-filters">
              <select
                className="form-control"
                value={transactions.filter}
                onChange={(e) =>
                  setTransactions((prev) => ({
                    ...prev,
                    filter: e.target.value,
                    isLoading: true,
                  }))
                }
                disabled={transactions.isLoading}
              >
                <option value="all">All Transactions</option>
                <option value="earnings">Earnings</option>
                <option value="withdrawals">Withdrawals</option>
              </select>
            </div>
          </div>

          {transactions.isLoading ? (
            <div className="loading">Loading transactions...</div>
          ) : transactions.data.length === 0 ? (
            <div className="no-transactions">No transactions found</div>
          ) : (
            <div className="transaction-list">
              {transactions.data.map((transaction) => {
                const statusInfo = {
                  completed: { text: "Completed", class: "completed" },
                  pending: { text: "Pending", class: "pending" },
                  failed: { text: "Failed", class: "failed" },
                  refunded: { text: "Refunded", class: "refunded" },
                  initiated: { text: "Processing", class: "initiated" },
                };

                const status = statusInfo[transaction.status] || {
                  text: transaction.status,
                  class: "pending",
                };

                return (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-icon">
                      {transaction.type === "credit" ? (
                        <Icons.ArrowUp />
                      ) : (
                        <Icons.ArrowDown />
                      )}
                    </div>
                    <div className="transaction-details">
                      <div className="transaction-header">
                        <span className="description">
                          {transaction.description}
                        </span>
                        <span className={`amount ${transaction.type}`}>
                          {transaction.type === "credit" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      <div className="transaction-footer">
                        <span className="date">
                          {formatDate(transaction.createdAt)}
                        </span>
                        <span className={`status ${status.class}`}>
                          {status.text}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorPayments;
