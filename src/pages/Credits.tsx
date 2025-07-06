import React, { useState } from 'react';
import { CreditCard, Plus, Minus, RefreshCw, DollarSign, TrendingUp, Calendar, Filter, Download, X, Save, User, Building } from 'lucide-react';
import { useData } from '../hooks/useData';
import { useTheme } from '../contexts/ThemeContext';
import { StatCard } from '../components/UI/StatCard';
import toast from 'react-hot-toast';

interface AddCreditsFormData {
  officer_id: string;
  action: 'Renewal' | 'Top-up' | 'Refund' | 'Adjustment';
  credits: number;
  payment_mode: string;
  payment_reference: string;
  remarks: string;
}

export const Credits: React.FC = () => {
  const { transactions, officers, setTransactions, isLoading } = useData();
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AddCreditsFormData>({
    officer_id: '',
    action: 'Top-up',
    credits: 50,
    payment_mode: 'Department Budget',
    payment_reference: '',
    remarks: ''
  });

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.officer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.remarks.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || transaction.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const totalCreditsIssued = transactions
    .filter(t => t.action === 'Renewal' || t.action === 'Top-up')
    .reduce((sum, t) => sum + t.credits, 0);

  const totalCreditsUsed = transactions
    .filter(t => t.action === 'Deduction')
    .reduce((sum, t) => sum + Math.abs(t.credits), 0);

  const totalRevenue = totalCreditsUsed * 2; // Assuming ₹2 per credit

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'credits' ? parseInt(value) || 0 : value
    }));
  };

  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.officer_id || !formData.credits || formData.credits <= 0) {
        toast.error('Please select an officer and enter a valid credit amount');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const selectedOfficer = officers.find(o => o.id === formData.officer_id);
      if (!selectedOfficer) {
        toast.error('Selected officer not found');
        return;
      }

      const newTransaction = {
        id: Date.now().toString(),
        officer_id: formData.officer_id,
        officer_name: selectedOfficer.name,
        action: formData.action,
        credits: formData.action === 'Deduction' ? -formData.credits : formData.credits,
        payment_mode: formData.payment_mode,
        remarks: formData.remarks || `${formData.action} - ${formData.credits} credits`,
        timestamp: new Date().toLocaleString()
      };

      setTransactions(prev => [newTransaction, ...prev]);
      toast.success(`Credits ${formData.action.toLowerCase()} successful!`);
      setShowAddModal(false);
      setFormData({
        officer_id: '',
        action: 'Top-up',
        credits: 50,
        payment_mode: 'Department Budget',
        payment_reference: '',
        remarks: ''
      });
    } catch (error) {
      toast.error('Failed to process credit transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportReport = (format: 'csv' | 'pdf' | 'summary') => {
    try {
      const dataToExport = filteredTransactions.map(transaction => ({
        'Transaction ID': transaction.id,
        'Officer Name': transaction.officer_name,
        'Action': transaction.action,
        'Credits': transaction.credits,
        'Payment Mode': transaction.payment_mode,
        'Remarks': transaction.remarks,
        'Timestamp': transaction.timestamp
      }));

      if (format === 'csv') {
        const headers = Object.keys(dataToExport[0]);
        const csvContent = [
          headers.join(','),
          ...dataToExport.map(row => 
            headers.map(header => `"${row[header as keyof typeof row]}"`).join(',')
          )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `credit_transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        // Generate detailed PDF report
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Credit Transactions Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #00B7B8; padding-bottom: 20px; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
                .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #00B7B8; }
                .stat-value { font-size: 1.5em; font-weight: bold; color: #00B7B8; }
                .stat-label { color: #666; margin-top: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                th { background-color: #00B7B8; color: white; font-weight: bold; }
                .positive { color: #22c55e; font-weight: bold; }
                .negative { color: #ef4444; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>PickMe Intelligence - Credit Transactions Report</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <p>Total Records: ${dataToExport.length}</p>
              </div>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">${totalCreditsIssued.toLocaleString()}</div>
                  <div class="stat-label">Total Credits Issued</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${totalCreditsUsed.toLocaleString()}</div>
                  <div class="stat-label">Total Credits Used</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">₹${totalRevenue.toLocaleString()}</div>
                  <div class="stat-label">Revenue Generated</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${officers.filter(o => o.status === 'Active').length}</div>
                  <div class="stat-label">Active Officers</div>
                </div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>Officer</th>
                    <th>Action</th>
                    <th>Credits</th>
                    <th>Payment Mode</th>
                    <th>Remarks</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  ${dataToExport.map(transaction => `
                    <tr>
                      <td>${transaction['Officer Name']}</td>
                      <td>${transaction.Action}</td>
                      <td class="${transaction.Credits > 0 ? 'positive' : 'negative'}">${transaction.Credits > 0 ? '+' : ''}${transaction.Credits}</td>
                      <td>${transaction['Payment Mode']}</td>
                      <td>${transaction.Remarks}</td>
                      <td>${transaction.Timestamp}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </body>
            </html>
          `;
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.print();
        }
      } else if (format === 'summary') {
        // Generate summary report
        const officerStats = filteredTransactions.reduce((acc, transaction) => {
          if (!acc[transaction.officer_name]) {
            acc[transaction.officer_name] = { issued: 0, used: 0, transactions: 0 };
          }
          acc[transaction.officer_name].transactions++;
          if (transaction.credits > 0) {
            acc[transaction.officer_name].issued += transaction.credits;
          } else {
            acc[transaction.officer_name].used += Math.abs(transaction.credits);
          }
          return acc;
        }, {} as Record<string, { issued: number; used: number; transactions: number }>);

        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Credit Summary Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #00B7B8; padding-bottom: 20px; }
                .section { margin: 30px 0; }
                .section h2 { color: #00B7B8; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #f8f9fa; font-weight: bold; }
                .summary-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
                .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
                .summary-value { font-size: 2em; font-weight: bold; color: #00B7B8; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>PickMe Intelligence - Credit Summary Report</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
              </div>
              
              <div class="summary-stats">
                <div class="summary-card">
                  <div class="summary-value">${totalCreditsIssued.toLocaleString()}</div>
                  <div>Total Credits Issued</div>
                </div>
                <div class="summary-card">
                  <div class="summary-value">${totalCreditsUsed.toLocaleString()}</div>
                  <div>Total Credits Used</div>
                </div>
                <div class="summary-card">
                  <div class="summary-value">₹${totalRevenue.toLocaleString()}</div>
                  <div>Revenue Generated</div>
                </div>
                <div class="summary-card">
                  <div class="summary-value">${Math.round((totalCreditsUsed / totalCreditsIssued) * 100)}%</div>
                  <div>Utilization Rate</div>
                </div>
              </div>
              
              <div class="section">
                <h2>Officer Credit Summary</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Officer Name</th>
                      <th>Credits Issued</th>
                      <th>Credits Used</th>
                      <th>Net Balance</th>
                      <th>Total Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.entries(officerStats).map(([name, stats]) => `
                      <tr>
                        <td>${name}</td>
                        <td>${stats.issued}</td>
                        <td>${stats.used}</td>
                        <td>${stats.issued - stats.used}</td>
                        <td>${stats.transactions}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </body>
            </html>
          `;
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.print();
        }
      }

      toast.success(`Credit report exported as ${format.toUpperCase()}`);
      setShowExportModal(false);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Renewal':
        return <RefreshCw className="w-4 h-4 text-green-400" />;
      case 'Deduction':
        return <Minus className="w-4 h-4 text-red-400" />;
      case 'Top-up':
        return <Plus className="w-4 h-4 text-blue-400" />;
      case 'Refund':
        return <RefreshCw className="w-4 h-4 text-yellow-400" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Renewal':
      case 'Top-up':
        return 'text-green-400';
      case 'Deduction':
        return 'text-red-400';
      case 'Refund':
        return 'text-yellow-400';
      default:
        return isDark ? 'text-gray-400' : 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-cyber-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 min-h-screen ${isDark ? 'bg-crisp-black' : 'bg-soft-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Credits & Billing
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage credit transactions and billing operations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowExportModal(true)}
            className="bg-electric-blue/20 text-electric-blue px-4 py-2 rounded-lg hover:bg-electric-blue/30 transition-all duration-200 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-cyber-gradient text-white px-4 py-2 rounded-lg hover:shadow-cyber transition-all duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Credits</span>
          </button>
        </div>
      </div>

      {/* Stats Grid - Fixed Theme Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Total Credits Issued
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {totalCreditsIssued.toLocaleString()}
              </p>
              <p className="text-xs mt-1 text-green-400">
                +15% this month
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border-green-500/30 text-green-400">
              <Plus className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Credits Used
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {totalCreditsUsed.toLocaleString()}
              </p>
              <p className="text-xs mt-1 text-red-400">
                85% utilization
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border-red-500/30 text-red-400">
              <Minus className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Revenue Generated
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ₹{totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs mt-1 text-green-400">
                +22% from last month
              </p>
            </div>
            <div className="p-3 rounded-lg bg-cyber-teal/10 border-cyber-teal/30 text-cyber-teal">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 hover:shadow-cyber transition-all duration-300 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Active Officers
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {officers.filter(o => o.status === 'Active').length}
              </p>
              <p className="text-xs mt-1 text-green-400">
                91% retention rate
              </p>
            </div>
            <div className="p-3 rounded-lg bg-electric-blue/10 border-electric-blue/30 text-electric-blue">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Credit Distribution Chart */}
      <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Credit Distribution by Officer
          </h3>
          <Calendar className="w-5 h-5 text-cyber-teal" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {officers.slice(0, 6).map((officer) => (
            <div key={officer.id} className={`p-4 rounded-lg border ${
              isDark ? 'bg-crisp-black/50 border-cyber-teal/10' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {officer.name}
                </h4>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {officer.credits_remaining}/{officer.total_credits}
                </span>
              </div>
              <div className={`w-full rounded-full h-2 ${
                isDark ? 'bg-crisp-black' : 'bg-gray-200'
              }`}>
                <div 
                  className="bg-cyber-gradient h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(officer.credits_remaining / officer.total_credits) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Used: {officer.total_credits - officer.credits_remaining}
                </span>
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  {Math.round((officer.credits_remaining / officer.total_credits) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className={`border border-cyber-teal/20 rounded-lg p-4 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent ${
                isDark 
                  ? 'bg-crisp-black text-white placeholder-gray-500' 
                  : 'bg-white text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className={`px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
              isDark 
                ? 'bg-crisp-black text-white' 
                : 'bg-white text-gray-900'
            }`}
          >
            <option value="all">All Actions</option>
            <option value="Renewal">Renewal</option>
            <option value="Deduction">Deduction</option>
            <option value="Top-up">Top-up</option>
            <option value="Refund">Refund</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={`px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
              isDark 
                ? 'bg-crisp-black text-white' 
                : 'bg-white text-gray-900'
            }`}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className={`border border-cyber-teal/20 rounded-lg overflow-hidden ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`border-b border-cyber-teal/20 ${
              isDark ? 'bg-crisp-black/50' : 'bg-gray-50'
            }`}>
              <tr>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Officer
                </th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Action
                </th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Credits
                </th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Payment Mode
                </th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Remarks
                </th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr 
                  key={transaction.id} 
                  className={`border-b border-cyber-teal/10 transition-colors ${
                    isDark ? 'hover:bg-crisp-black/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {transaction.officer_name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getActionIcon(transaction.action)}
                      <span className={`text-sm font-medium ${getActionColor(transaction.action)}`}>
                        {transaction.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${
                      transaction.credits > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.credits > 0 ? '+' : ''}{transaction.credits}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {transaction.payment_mode}
                  </td>
                  <td className={`px-6 py-4 text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {transaction.remarks}
                  </td>
                  <td className={`px-6 py-4 text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {transaction.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Credits Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-2xl w-full rounded-lg p-6 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-muted-graphite border border-cyber-teal/20' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Add Credits Transaction
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className={`p-2 transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCredits} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Select Officer *
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <select
                      name="officer_id"
                      required
                      value={formData.officer_id}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                        isDark 
                          ? 'bg-crisp-black text-white' 
                          : 'bg-white text-gray-900'
                      }`}
                    >
                      <option value="">Choose an officer</option>
                      {officers.map(officer => (
                        <option key={officer.id} value={officer.id}>
                          {officer.name} - {officer.credits_remaining} credits
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Action Type *
                  </label>
                  <select
                    name="action"
                    required
                    value={formData.action}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                      isDark 
                        ? 'bg-crisp-black text-white' 
                        : 'bg-white text-gray-900'
                    }`}
                  >
                    <option value="Top-up">Top-up</option>
                    <option value="Renewal">Renewal</option>
                    <option value="Refund">Refund</option>
                    <option value="Adjustment">Adjustment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Credit Amount *
                  </label>
                  <input
                    type="number"
                    name="credits"
                    required
                    min="1"
                    value={formData.credits}
                    onChange={handleInputChange}
                    placeholder="50"
                    className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                      isDark 
                        ? 'bg-crisp-black text-white placeholder-gray-500' 
                        : 'bg-white text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Payment Mode
                  </label>
                  <select
                    name="payment_mode"
                    value={formData.payment_mode}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                      isDark 
                        ? 'bg-crisp-black text-white' 
                        : 'bg-white text-gray-900'
                    }`}
                  >
                    <option value="Department Budget">Department Budget</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Manual Adjustment">Manual Adjustment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Payment Reference
                </label>
                <input
                  type="text"
                  name="payment_reference"
                  value={formData.payment_reference}
                  onChange={handleInputChange}
                  placeholder="Transaction ID, Receipt Number, etc."
                  className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
                    isDark 
                      ? 'bg-crisp-black text-white placeholder-gray-500' 
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Additional notes about this transaction..."
                  rows={3}
                  className={`w-full px-4 py-3 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal resize-none ${
                    isDark 
                      ? 'bg-crisp-black text-white placeholder-gray-500' 
                      : 'bg-white text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-6 py-3 rounded-lg transition-colors ${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-cyber-gradient text-white rounded-lg hover:shadow-cyber transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Add Credits</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-lg p-6 ${
            isDark ? 'bg-muted-graphite border border-cyber-teal/20' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Export Credit Report
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className={`p-2 transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Choose the format to export {filteredTransactions.length} credit transaction records:
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleExportReport('csv')}
                  className={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${
                    isDark 
                      ? 'bg-crisp-black border-cyber-teal/20 hover:border-cyber-teal/40 text-white' 
                      : 'bg-gray-50 border-gray-200 hover:border-cyber-teal/40 text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Download className="w-5 h-5 text-cyber-teal" />
                    <div>
                      <p className="font-medium">CSV Export</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Raw transaction data for spreadsheet analysis
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleExportReport('pdf')}
                  className={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${
                    isDark 
                      ? 'bg-crisp-black border-cyber-teal/20 hover:border-cyber-teal/40 text-white' 
                      : 'bg-gray-50 border-gray-200 hover:border-cyber-teal/40 text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Download className="w-5 h-5 text-electric-blue" />
                    <div>
                      <p className="font-medium">Detailed PDF Report</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Complete transaction report with statistics
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleExportReport('summary')}
                  className={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${
                    isDark 
                      ? 'bg-crisp-black border-cyber-teal/20 hover:border-cyber-teal/40 text-white' 
                      : 'bg-gray-50 border-gray-200 hover:border-cyber-teal/40 text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Download className="w-5 h-5 text-neon-magenta" />
                    <div>
                      <p className="font-medium">Summary Report</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Executive summary with key metrics
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};