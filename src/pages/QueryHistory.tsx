import React, { useState } from 'react';
import { Search, Filter, Download, Calendar, Clock, User, Database, CheckCircle, XCircle, AlertCircle, X, FileText, BarChart3 } from 'lucide-react';
import { StatusBadge } from '../components/UI/StatusBadge';
import { useData } from '../hooks/useData';
import { useTheme } from '../contexts/ThemeContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const QueryHistory: React.FC = () => {
  const { queries, isLoading } = useData();
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const filteredQueries = queries.filter(query => {
    const matchesSearch = query.officer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.input.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.source.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || query.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || query.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'Failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'Pending':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleExportCSV = () => {
    try {
      const dataToExport = filteredQueries.map(query => ({
        'Query ID': query.id,
        'Officer Name': query.officer_name,
        'Type': query.type,
        'Input': query.input,
        'Source': query.source,
        'Result Summary': query.result_summary,
        'Credits Used': query.credits_used,
        'Status': query.status,
        'Timestamp': query.timestamp
      }));

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
      a.download = `query_history_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Query history exported as CSV');
      setShowExportModal(false);
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const handleGenerateReport = (reportType: 'summary' | 'detailed' | 'analytics') => {
    try {
      const reportData = {
        generated_at: new Date().toLocaleString(),
        total_queries: filteredQueries.length,
        success_rate: Math.round((filteredQueries.filter(q => q.status === 'Success').length / filteredQueries.length) * 100),
        osint_queries: filteredQueries.filter(q => q.type === 'OSINT').length,
        pro_queries: filteredQueries.filter(q => q.type === 'PRO').length,
        total_credits_used: filteredQueries.reduce((sum, q) => sum + q.credits_used, 0),
        queries: filteredQueries
      };

      if (reportType === 'summary') {
        // Generate Summary Report
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Query History Summary Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #00B7B8; padding-bottom: 20px; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
                .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #00B7B8; }
                .stat-value { font-size: 2em; font-weight: bold; color: #00B7B8; }
                .stat-label { color: #666; margin-top: 5px; }
                .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>PickMe Intelligence - Query History Summary</h1>
                <p>Generated on: ${reportData.generated_at}</p>
              </div>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">${reportData.total_queries}</div>
                  <div class="stat-label">Total Queries</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${reportData.success_rate}%</div>
                  <div class="stat-label">Success Rate</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${reportData.osint_queries}</div>
                  <div class="stat-label">OSINT Queries</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${reportData.pro_queries}</div>
                  <div class="stat-label">PRO Queries</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${reportData.total_credits_used}</div>
                  <div class="stat-label">Credits Used</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">₹${reportData.total_credits_used * 2}</div>
                  <div class="stat-label">Revenue Generated</div>
                </div>
              </div>
              
              <div class="footer">
                <p>© 2025 PickMe Intelligence. All rights reserved.</p>
              </div>
            </body>
            </html>
          `;
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.print();
        }
      } else if (reportType === 'detailed') {
        // Generate Detailed Report
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Detailed Query History Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #00B7B8; padding-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                th { background-color: #00B7B8; color: white; font-weight: bold; }
                .status-success { color: #22c55e; font-weight: bold; }
                .status-failed { color: #ef4444; font-weight: bold; }
                .status-pending { color: #f59e0b; font-weight: bold; }
                .type-pro { background-color: #fdf2f8; }
                .type-osint { background-color: #f0fdfa; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>PickMe Intelligence - Detailed Query Report</h1>
                <p>Generated on: ${reportData.generated_at}</p>
                <p>Total Records: ${reportData.total_queries}</p>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>Officer</th>
                    <th>Type</th>
                    <th>Query</th>
                    <th>Source</th>
                    <th>Result</th>
                    <th>Credits</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData.queries.map(query => `
                    <tr class="type-${query.type.toLowerCase()}">
                      <td>${query.officer_name}</td>
                      <td><strong>${query.type}</strong></td>
                      <td>${query.input}</td>
                      <td>${query.source}</td>
                      <td>${query.result_summary}</td>
                      <td>${query.credits_used}</td>
                      <td class="status-${query.status.toLowerCase()}">${query.status}</td>
                      <td>${query.timestamp}</td>
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
      } else if (reportType === 'analytics') {
        // Generate Analytics Report
        const officerStats = filteredQueries.reduce((acc, query) => {
          if (!acc[query.officer_name]) {
            acc[query.officer_name] = { total: 0, success: 0, credits: 0 };
          }
          acc[query.officer_name].total++;
          if (query.status === 'Success') acc[query.officer_name].success++;
          acc[query.officer_name].credits += query.credits_used;
          return acc;
        }, {} as Record<string, { total: number; success: number; credits: number }>);

        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Query Analytics Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #00B7B8; padding-bottom: 20px; }
                .section { margin: 30px 0; }
                .section h2 { color: #00B7B8; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #f8f9fa; font-weight: bold; }
                .chart-placeholder { background: #f8f9fa; padding: 40px; text-align: center; border: 2px dashed #ddd; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>PickMe Intelligence - Analytics Report</h1>
                <p>Generated on: ${reportData.generated_at}</p>
              </div>
              
              <div class="section">
                <h2>Officer Performance Analysis</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Officer Name</th>
                      <th>Total Queries</th>
                      <th>Successful Queries</th>
                      <th>Success Rate</th>
                      <th>Credits Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.entries(officerStats).map(([name, stats]) => `
                      <tr>
                        <td>${name}</td>
                        <td>${stats.total}</td>
                        <td>${stats.success}</td>
                        <td>${Math.round((stats.success / stats.total) * 100)}%</td>
                        <td>${stats.credits}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              <div class="section">
                <h2>Query Type Distribution</h2>
                <div class="chart-placeholder">
                  <p><strong>OSINT Queries:</strong> ${reportData.osint_queries} (${Math.round((reportData.osint_queries / reportData.total_queries) * 100)}%)</p>
                  <p><strong>PRO Queries:</strong> ${reportData.pro_queries} (${Math.round((reportData.pro_queries / reportData.total_queries) * 100)}%)</p>
                </div>
              </div>
              
              <div class="section">
                <h2>Summary Metrics</h2>
                <table>
                  <tr><td><strong>Total Queries Processed</strong></td><td>${reportData.total_queries}</td></tr>
                  <tr><td><strong>Overall Success Rate</strong></td><td>${reportData.success_rate}%</td></tr>
                  <tr><td><strong>Total Credits Consumed</strong></td><td>${reportData.total_credits_used}</td></tr>
                  <tr><td><strong>Revenue Generated</strong></td><td>₹${reportData.total_credits_used * 2}</td></tr>
                  <tr><td><strong>Average Credits per Query</strong></td><td>${Math.round((reportData.total_credits_used / reportData.total_queries) * 100) / 100}</td></tr>
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

      toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated`);
      setShowReportModal(false);
    } catch (error) {
      toast.error('Failed to generate report');
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
            Query History
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Complete log of all OSINT and PRO queries
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowExportModal(true)}
            className="bg-electric-blue/20 text-electric-blue px-4 py-2 rounded-lg hover:bg-electric-blue/30 transition-all duration-200 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => setShowReportModal(true)}
            className="bg-cyber-gradient text-white px-4 py-2 rounded-lg hover:shadow-cyber transition-all duration-200 flex items-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Total Queries
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {queries.length}
              </p>
            </div>
            <Search className="w-8 h-8 text-cyber-teal" />
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Success Rate
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {Math.round((queries.filter(q => q.status === 'Success').length / queries.length) * 100)}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                PRO Queries
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {queries.filter(q => q.type === 'PRO').length}
              </p>
            </div>
            <Database className="w-8 h-8 text-neon-magenta" />
          </div>
        </div>

        <div className={`border border-cyber-teal/20 rounded-lg p-6 ${
          isDark ? 'bg-muted-graphite' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Credits Used
              </p>
              <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {queries.reduce((sum, q) => sum + q.credits_used, 0)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-electric-blue" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`border border-cyber-teal/20 rounded-lg p-4 ${
        isDark ? 'bg-muted-graphite' : 'bg-white'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search queries, officers, or sources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal focus:border-transparent ${
                isDark 
                  ? 'bg-crisp-black text-white placeholder-gray-500' 
                  : 'bg-white text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
              isDark 
                ? 'bg-crisp-black text-white' 
                : 'bg-white text-gray-900'
            }`}
          >
            <option value="all">All Types</option>
            <option value="OSINT">OSINT</option>
            <option value="PRO">PRO</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 border border-cyber-teal/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-teal ${
              isDark 
                ? 'bg-crisp-black text-white' 
                : 'bg-white text-gray-900'
            }`}
          >
            <option value="all">All Status</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
            <option value="Pending">Pending</option>
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

      {/* Query Table */}
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
                  Type
                </th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Query Input
                </th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Source
                </th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Result
                </th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Credits
                </th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Status
                </th>
                <th className={`px-6 py-4 text-left text-sm font-medium ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredQueries.map((query, index) => (
                <tr 
                  key={query.id} 
                  className={`border-b border-cyber-teal/10 transition-colors ${
                    isDark ? 'hover:bg-crisp-black/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-cyber-teal" />
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {query.officer_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                      query.type === 'PRO' 
                        ? 'bg-neon-magenta/20 text-neon-magenta' 
                        : 'bg-cyber-teal/20 text-cyber-teal'
                    }`}>
                      {query.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {query.input}
                  </td>
                  <td className={`px-6 py-4 text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {query.source}
                  </td>
                  <td className={`px-6 py-4 text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {query.result_summary}
                  </td>
                  <td className={`px-6 py-4 text-sm ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {query.credits_used}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(query.status)}
                      <StatusBadge status={query.status} size="sm" />
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {query.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Results */}
      {filteredQueries.length === 0 && (
        <div className="text-center py-12">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDark ? 'bg-muted-graphite' : 'bg-gray-100'
          }`}>
            <Search className={`w-8 h-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <h3 className={`text-lg font-medium mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            No Queries Found
          </h3>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Try adjusting your search criteria or filters.
          </p>
        </div>
      )}

      {/* Export CSV Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-lg p-6 ${
            isDark ? 'bg-muted-graphite border border-cyber-teal/20' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Export Query History
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
                Export {filteredQueries.length} query records to CSV format for analysis in spreadsheet applications.
              </p>

              <div className={`p-4 rounded-lg border ${
                isDark ? 'bg-crisp-black border-cyber-teal/20' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Export includes:
                </h4>
                <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <li>• Query ID and Officer details</li>
                  <li>• Query type, input, and source</li>
                  <li>• Results and credit usage</li>
                  <li>• Status and timestamps</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-electric-blue/20 text-electric-blue rounded-lg hover:bg-electric-blue/30 transition-all duration-200 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-lg p-6 ${
            isDark ? 'bg-muted-graphite border border-cyber-teal/20' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Generate Report
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className={`p-2 transition-colors ${
                  isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Choose the type of report to generate from {filteredQueries.length} query records:
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleGenerateReport('summary')}
                  className={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${
                    isDark 
                      ? 'bg-crisp-black border-cyber-teal/20 hover:border-cyber-teal/40 text-white' 
                      : 'bg-gray-50 border-gray-200 hover:border-cyber-teal/40 text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-cyber-teal" />
                    <div>
                      <p className="font-medium">Summary Report</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        High-level statistics and key metrics
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleGenerateReport('detailed')}
                  className={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${
                    isDark 
                      ? 'bg-crisp-black border-cyber-teal/20 hover:border-cyber-teal/40 text-white' 
                      : 'bg-gray-50 border-gray-200 hover:border-cyber-teal/40 text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Database className="w-5 h-5 text-electric-blue" />
                    <div>
                      <p className="font-medium">Detailed Report</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Complete query listing with all details
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleGenerateReport('analytics')}
                  className={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${
                    isDark 
                      ? 'bg-crisp-black border-cyber-teal/20 hover:border-cyber-teal/40 text-white' 
                      : 'bg-gray-50 border-gray-200 hover:border-cyber-teal/40 text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-5 h-5 text-neon-magenta" />
                    <div>
                      <p className="font-medium">Analytics Report</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Performance analysis and trends
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