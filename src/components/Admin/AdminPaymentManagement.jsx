import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";
import { getAuthToken } from "../../utils/auth";
import "../../styles/AdminPaymentManagement.css";

const AdminPaymentManagement = () => {
  const [activeTab, setActiveTab] = useState("transactions");
  const [transactions, setTransactions] = useState([]);
  const [escrowPayments, setEscrowPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [refundModal, setRefundModal] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPayouts: 0,
    netProfit: 0,
    pendingWithdrawals: 0,
    commissionEarned: 0,
    pendingCommission: 0,
  });

  const fetchEscrowPayments = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/payment/admin/escrow-payments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch escrow payments");
      const data = await response.json();
      setEscrowPayments(data);
    } catch (err) {
      console.error("Error fetching escrow payments:", err);
      setError("Failed to load escrow payments");
    }
  };

  const fetchDashboardData = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      setLoading(true);
      setError("");

      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const transactionsResponse = await fetch(
        `${API_BASE_URL}/api/payment/admin/transactions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      console.log(
        "4. Got transactions response, status:",
        transactionsResponse.status
      );

      if (!transactionsResponse.ok) {
        const errorText = await transactionsResponse.text();
        throw new Error(
          `Failed to fetch transactions: ${transactionsResponse.status} ${errorText}`
        );
      }

      const transactionsData = await transactionsResponse.json();

      let balanceData = { availableBalance: 0, pendingBalance: 0 };
      try {
        const balanceResponse = await fetch(
          `${API_BASE_URL}/api/payment/admin/wallet/balance`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          }
        );

        if (balanceResponse.ok) {
          balanceData = await balanceResponse.json();
          balanceData = {
            availableBalance:
              balanceData.AvailableBalance ?? balanceData.availableBalance ?? 0,
            pendingBalance:
              balanceData.PendingBalance ?? balanceData.pendingBalance ?? 0,
          };
        }
      } catch (_) {}
const statusMap = {
        0: "Pending",
        1: "Initiated",
        2: "Completed",
        3: "Failed",
        4: "Refunded",
        5: "PartiallyRefunded",
      };
      const getStatus = (tx) => {
        const s = tx.Status ?? tx.status;
        if (typeof s === "number") return statusMap[s] ?? "Pending";
        return (s || "Pending").toString();
      };

      const completedTransactions = Array.isArray(transactionsData)
        ? transactionsData.filter((tx) => getStatus(tx) === "Completed")
        : [];

      const totalRevenue = completedTransactions.reduce(
        (sum, tx) => sum + (tx.Amount || tx.amount || 0),
        0
      );

      const totalPayouts = completedTransactions.reduce(
        (sum, tx) => sum + (tx.TutorAmount || tx.tutorAmount || 0),
        0
      );

      const totalCommission = completedTransactions.reduce(
        (sum, tx) =>
          sum +
          (tx.CommissionAmount || tx.commissionAmount || tx.commission || 0),
        0
      );

      setStats({
        totalRevenue,
        totalPayouts,
        netProfit: totalCommission,
        pendingWithdrawals: balanceData.pendingBalance || 0,
        commissionEarned: totalCommission,
        pendingCommission: 0,
      });

      const formattedTransactions = Array.isArray(transactionsData)
        ? transactionsData.map((tx) => ({
            id: tx.PaymentId ?? tx.paymentId ?? tx.id ?? "N/A",
            transactionId: tx.TransactionId ?? tx.transactionId ?? "",
            date:
              tx.CreatedAt || tx.createdAt
                ? new Date(tx.CreatedAt || tx.createdAt).toLocaleDateString()
                : "N/A",
            student: tx.StudentName || tx.studentName || "Unknown Student",
            tutor: tx.TutorName || tx.tutorName || "Unknown Tutor",
            amount: tx.Amount ?? tx.amount ?? 0,
            commission:
              tx.CommissionAmount ?? tx.commissionAmount ?? tx.commission ?? 0,
            tutorAmount: tx.TutorAmount ?? tx.tutorAmount ?? 0,
            status: getStatus(tx),
            type: "Payment",
          }))
        : [];

      setTransactions(formattedTransactions);

      const escrowResponse = await fetch(
        `${API_BASE_URL}/api/payment/admin/escrow-payments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (escrowResponse.ok) {
        const escrowData = await escrowResponse.json();
console.log('Escrow data from API:', escrowData);
console.log('Escrow payments count:', escrowData?.length || 0);
        setEscrowPayments(escrowData);
      }
    } catch (err) {
      console.error("Error in fetchDashboardData:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
      });

      if (err.name === "AbortError") {
        setError(
          "Request timed out. Please check your connection and try again."
        );
      } else {
        setError(err.message || "Failed to load dashboard data");
      }
    } finally {
      console.log(
        "9. Final cleanup - clearing timeout and setting loading to false"
      );
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleProcessRefund = async (transactionId, amount, reason) => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/payment/refund/${encodeURIComponent(
          transactionId
        )}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ Amount: amount, Reason: reason }),
        }
      );
      const result = await response.json();
      if (result.Success) {
        setRefundModal(null);
        await fetchDashboardData();
      } else {
        setError(result.Message || "Refund failed");
      }
    } catch (err) {
      setError("Failed to process refund");
    }
  };

  const handleReleaseEscrow = async (bookingId) => {
    try {
      setError("");
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/payment/release-escrow/${bookingId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json().catch(() => ({}));
      const msg = data.Message ?? data.message ?? "";

      if (!response.ok) {
        setError(
          msg ||
            "Failed to release. Session must be ended and tutor must have marked attendance."
        );
        return;
      }

      await Promise.all([fetchDashboardData(), fetchEscrowPayments()]);
    } catch (err) {
      setError(err.message || "Failed to release escrow payment");
    }
  };
  const filteredTransactions = transactions.filter((tx) => {
    const matchesStatus =
      statusFilter === "all" ||
      tx.status.toLowerCase() === statusFilter.toLowerCase();

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      tx.id.toString().toLowerCase().includes(searchLower) ||
      tx.student.toLowerCase().includes(searchLower) ||
      tx.tutor.toLowerCase().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  const statuses = [
    "all",
    ...new Set(transactions.map((tx) => tx.status.toLowerCase())),
  ];

  // Update renderTabContent
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading payment data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-message">
          <p>{error}</p>
          <button className="retry-button" onClick={fetchDashboardData}>
            Retry
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case "transactions":
        return (
          <div className="transactions-container">
            <div className="filters-container">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <span className="search-icon">🔍</span>
              </div>

              <div className="status-filter">
                <label htmlFor="status-filter">Status:</label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="status-select"
                >
                  <option value="all">All Statuses</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="results-count">
                Showing {filteredTransactions.length} of {transactions.length}{" "}
                transactions
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Student → Tutor</th>
                    <th>Amount</th>
                    <th>Commission</th>
                    <th>Tutor Gets</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className={`transaction-row status-${tx.status.toLowerCase()}`}
                      >
                        <td>#{tx.id}</td>
                        <td>{tx.date}</td>
                        <td>
                          <div className="user-pair">
                            <span className="student">{tx.student}</span>
                            <span className="arrow">→</span>
                            <span className="tutor">{tx.tutor}</span>
                          </div>
                        </td>
                        <td>ETB {tx.amount.toFixed(2)}</td>
                        <td>ETB {tx.commission.toFixed(2)} (15%)</td>
                        <td>ETB {tx.tutorAmount.toFixed(2)}</td>
                        <td>
                          <span
                            className={`status-badge ${tx.status
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td>
                          {tx.status === "Completed" && tx.transactionId && (
                            <button
                              className="refund-button"
                              onClick={() =>
                                setRefundModal({
                                  transactionId: tx.transactionId,
                                  amount: tx.amount.toString(),
                                  maxAmount: tx.amount,
                                })
                              }
                            >
                              Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="no-results">
                        No transactions found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length > 0 && (
              <div className="table-footer">
                <div className="table-summary">
                  <span>
                    Total Amount: ETB
                    {filteredTransactions
                      .reduce((sum, tx) => sum + tx.amount, 0)
                      .toFixed(2)}
                  </span>
                  <span>
                    Total Commission: ETB
                    {filteredTransactions
                      .reduce((sum, tx) => sum + tx.commission, 0)
                      .toFixed(2)}
                  </span>
                  <span>
                    Total Payout: ETB
                    {filteredTransactions
                      .reduce((sum, tx) => sum + tx.tutorAmount, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        );

      case "escrow":
        return (
          <div className="escrow-container">
          
            {escrowPayments.length === 0 ? (
              <p>
                No payments in escrow. </p>
            ) : (
              escrowPayments.map((payment) => {
                // Backend EscrowPaymentDto uses PascalCase
                const bookingId = payment.BookingId ?? payment.bookingId;
                const studentName = payment.StudentName ?? payment.studentName;
                const tutorName = payment.TutorName ?? payment.tutorName;
                const amount = payment.Amount ?? payment.amount ?? 0;
                const commissionAmount =
                  payment.CommissionAmount ??
                  payment.commissionAmount ??
                  payment.commission ??
                  0;
                const tutorAmount =
                  payment.TutorAmount ??
                  payment.tutorAmount ??
                  amount - commissionAmount;
                const status = payment.Status ?? payment.status ?? "";
                return (
                  <div key={bookingId} className="escrow-card">
                    <div className="escrow-details">
                      <h4>Booking #{bookingId}</h4>
                      <p>Student: {studentName}</p>
                      <p>Tutor: {tutorName}</p>
                      <p>Amount: ETB {amount.toFixed(2)}</p>
                      <p>Commission: ETB {commissionAmount.toFixed(2)}</p>
                      <p>Tutor Gets: ETB {tutorAmount.toFixed(2)}</p>
                      <p>
                        Status:{" "}
                        <span
                          className={`status-badge ${status
                            ?.toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {status}
                        </span>
                      </p>
                    </div>
                    {status === "Pending Release" && (
                      <button
                        onClick={() => handleReleaseEscrow(bookingId)}
                        className="release-button"
                      >
                        Release Payment
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        );

      default:
        return <div>Select a tab to view data</div>;
    }
  };

  return (
    <div className="admin-payment-container">
      <h2>Payment Management</h2>

      {/* Stats Overview - 15% commission on completed payments */}
      <div className="stats-grid">
        <div className="stat-card">
              <h4>Total Revenue</h4>
              <p>ETB {stats.totalRevenue.toFixed(2)}</p>
        </div>
        <div className="stat-card">
              <h4>Commission (15%)</h4>
              <p>ETB {stats.commissionEarned.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h4>In Escrow</h4>
          <p>{escrowPayments.length} payment(s)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "transactions" ? "active" : ""}`}
          onClick={() => setActiveTab("transactions")}
        >
          All Transactions
        </button>
        <button
          className={`tab ${activeTab === "escrow" ? "active" : ""}`}
          onClick={() => setActiveTab("escrow")}
        >
          Escrow
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">{renderTabContent()}</div>

      {/* Refund Modal */}
      {refundModal && (
        <RefundModal
          transactionId={refundModal.transactionId}
          amount={refundModal.amount}
          maxAmount={refundModal.maxAmount}
          onConfirm={(amount, reason) =>
            handleProcessRefund(refundModal.transactionId, amount, reason)
          }
          onCancel={() => setRefundModal(null)}
        />
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError("")}>Dismiss</button>
        </div>
      )}
    </div>
  );
};

const RefundModal = ({
  transactionId,
  amount: initialAmount,
  maxAmount,
  onConfirm,
  onCancel,
}) => {
  const [amount, setAmount] = useState(initialAmount || "");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 0.01 || amt > 50000) {
      setLocalError("Amount must be between 0.01 and 50,000");
      return;
    }
    if (amt > maxAmount) {
      setLocalError(`Amount cannot exceed ${maxAmount.toFixed(2)}`);
      return;
    }
    if (!reason || reason.trim().length < 10) {
      setLocalError("Reason must be at least 10 characters");
      return;
    }
    if (reason.length > 500) {
      setLocalError("Reason must be at most 500 characters");
      return;
    }
    setSubmitting(true);
    onConfirm(amt, reason.trim());
    setSubmitting(false);
  };

  return (
    
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content refund-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Process Refund</h3>
        <p className="modal-hint">Transaction: {transactionId}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amount (max: ETB {maxAmount?.toFixed(2)})</label>
            <input
              type="number"
              min="0.01"
              max={maxAmount}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Reason (10-500 characters)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={10}
              maxLength={500}
              rows={3}
              placeholder="Enter refund reason..."
              required
            />
          </div>
          {localError && <p className="error-text">{localError}</p>}
          <div className="modal-actions">
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? "Processing..." : "Process Refund"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPaymentManagement;
