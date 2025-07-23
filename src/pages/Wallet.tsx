import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import {
  Wallet as WalletIcon,
  Plus,
  Minus,
  CreditCard,
  Building,
  Smartphone,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "bet" | "win";
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  description: string;
}

export default function Wallet() {
  const { user, updateBalance } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("credit_card");
  const [withdrawMethod, setWithdrawMethod] = useState("bank_transfer");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.getWalletHistory();
      setTransactions(response.data);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);

    if (amount <= 0 || amount > 10000) {
      if (window.showNotification) {
        window.showNotification(
          "Please enter a valid amount (max $10,000)",
          "error"
        );
      }
      return;
    }

    try {
      setProcessing(true);
      const response = await api.deposit(amount, depositMethod);

      updateBalance(response.data.newBalance);
      setTransactions((prev) => [response.data.transaction, ...prev]);
      setShowDepositModal(false);
      setDepositAmount("");

      if (window.showNotification) {
        window.showNotification(`Deposit of $${amount} successful!`, "success");
      }
    } catch (error: any) {
      if (window.showNotification) {
        window.showNotification(
          error.response?.data?.error || "Deposit failed",
          "error"
        );
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);

    if (amount <= 0) {
      if (window.showNotification) {
        window.showNotification("Please enter a valid amount", "error");
      }
      return;
    }

    if (amount > (user?.balance || 0)) {
      if (window.showNotification) {
        window.showNotification("Insufficient balance", "error");
      }
      return;
    }

    try {
      setProcessing(true);
      const response = await api.withdraw(amount, withdrawMethod);

      updateBalance(response.data.newBalance);
      setTransactions((prev) => [response.data.transaction, ...prev]);
      setShowWithdrawModal(false);
      setWithdrawAmount("");

      if (window.showNotification) {
        window.showNotification(
          `Withdrawal of $${amount} initiated!`,
          "success"
        );
      }
    } catch (error: any) {
      if (window.showNotification) {
        window.showNotification(
          error.response?.data?.error || "Withdrawal failed",
          "error"
        );
      }
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case "withdrawal":
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case "bet":
        return <Minus className="w-4 h-4 text-red-500" />;
      case "win":
        return <Plus className="w-4 h-4 text-green-500" />;
      default:
        return <WalletIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  // const getStatusIcon = (status: string) => {
  //   switch (status) {
  //     case 'completed':
  //       return <CheckCircle className="w-4 h-4 text-green-500" />
  //     case 'pending':
  //       return <Clock className="w-4 h-4 text-yellow-500" />
  //     case 'failed':
  //       return <XCircle className="w-4 h-4 text-red-500" />
  //     default:
  //       return <Clock className="w-4 h-4 text-gray-500" />
  //   }
  // }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="badge-success">Completed</span>;
      case "pending":
        return <span className="badge-warning">Pending</span>;
      case "failed":
        return <span className="badge-danger">Failed</span>;
      default:
        return <span className="badge-warning">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "credit_card":
        return <CreditCard className="w-4 h-4" />;
      case "bank_transfer":
        return <Building className="w-4 h-4" />;
      case "mobile_money":
        return <Smartphone className="w-4 h-4" />;
      default:
        return <WalletIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-600 mt-2">
          Manage your betting funds and transaction history
        </p>
      </div>

      {/* Balance Card */}
      <div className="card p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <WalletIcon className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-sm font-medium text-gray-600 mb-2">
          Available Balance
        </h2>
        <div className="text-4xl font-bold text-gray-900 mb-6">
          ${user?.balance?.toFixed(2) || "0.00"}
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setShowDepositModal(true)}
            className="btn-primary px-6 py-3 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Deposit</span>
          </button>

          <button
            onClick={() => setShowWithdrawModal(true)}
            className="btn-secondary px-6 py-3 flex items-center space-x-2"
          >
            <Minus className="w-4 h-4" />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Transaction History
          </h2>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <WalletIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getTransactionIcon(transaction.type)}
                      {getMethodIcon(transaction.method)}
                    </div>

                    <div>
                      <div className="font-medium text-gray-900">
                        {transaction.description}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(transaction.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div
                        className={`font-bold ${
                          transaction.type === "deposit" ||
                          transaction.type === "win"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "deposit" ||
                        transaction.type === "win"
                          ? "+"
                          : "-"}
                        ${transaction.amount.toFixed(2)}
                      </div>
                    </div>

                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Deposit Funds
            </h3>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="input w-full"
                  placeholder="Enter amount"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  Minimum: $1, Maximum: $10,000
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value)}
                  className="input w-full"
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={processing}
                  className="btn-primary flex-1 py-2"
                >
                  {processing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                  ) : (
                    "Deposit"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="btn-secondary flex-1 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Withdraw Funds
            </h3>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  min="1"
                  max={user?.balance || 0}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="input w-full"
                  placeholder="Enter amount"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  Available: ${user?.balance?.toFixed(2) || "0.00"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Method
                </label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  className="input w-full"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-sm text-yellow-800">
                  <strong>Note:</strong> Withdrawals may take 1-3 business days
                  to process.
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={processing}
                  className="btn-primary flex-1 py-2"
                >
                  {processing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                  ) : (
                    "Withdraw"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="btn-secondary flex-1 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
