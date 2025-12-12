
import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, FileText, Upload, Filter, Search, Bell, Settings as SettingsIcon, LogOut, Send, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Agreement, AgreementStatus, DashboardStats, AppSettings } from './types';
import { StatsCard } from './components/StatsCard';
import { Uploader } from './components/Uploader';
import { AgreementDetail } from './components/AgreementDetail';
import { Auth } from './components/Auth';
import { useAuth } from './context/AuthContext';
import { Settings } from './components/Settings';
import { checkAndSendNotifications } from './services/notificationService';
import { getAgreements, deleteAgreement, deleteAllAgreements } from './services/databaseService';

// Mock Initial Data with Raw Content for realistic preview
const INITIAL_AGREEMENTS: Agreement[] = [];

// Initial Settings
const INITIAL_SETTINGS: AppSettings = {
  waInstanceId: '6933D785D49F9',
  waAccessToken: '6904d11095c1d',
  waApiUrl: 'https://flyencart.in/api/send',
  adminEmail: 'legal@skynet.com',
  adminPhone: '919876543210',
  enableAutoNotify: false
};

export default function App() {
  const { session, loading, signOut } = useAuth();
  const [agreements, setAgreements] = useState<Agreement[]>(INITIAL_AGREEMENTS);

  useEffect(() => {
    if (session) {
      getAgreements().then(data => {
        if (data && data.length > 0) {
          // Transform Supabase data to Agreement type if needed, or just set it
          // Assuming data matches Agreement interface roughly
          setAgreements(data as unknown as Agreement[]);
        } else {
          setAgreements([]);
        }
      });
    }
  }, [session]);
  const [view, setView] = useState<'dashboard' | 'detail' | 'settings' | 'grouped'>('dashboard');
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [notificationStatus, setNotificationStatus] = useState<{ loading: boolean, message: string | null }>({ loading: false, message: null });


  const stats: DashboardStats = useMemo(() => {
    return {
      total: agreements.length,
      active: agreements.filter(a => a.status === AgreementStatus.ACTIVE).length,
      expiring: agreements.filter(a => a.status === AgreementStatus.EXPIRING_SOON).length,
      expired: agreements.filter(a => a.status === AgreementStatus.EXPIRED).length,
      pending: agreements.filter(a => a.status === AgreementStatus.PENDING_APPROVAL).length,
    };
  }, [agreements]);

  // Chart Data
  const chartData = [
    { name: 'Active', value: stats.active, color: '#4f46e5' },
    { name: 'Expiring', value: stats.expiring, color: '#eab308' },
    { name: 'Expired', value: stats.expired, color: '#ef4444' },
    { name: 'Pending', value: stats.pending, color: '#a855f7' },
  ];

  // Filtered List
  const filteredAgreements = useMemo(() => {
    return agreements.filter(item => {
      const matchesSearch =
        item.partyB.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesFilter;
    });
  }, [agreements, searchQuery, statusFilter]);

  const handleUpload = (newAgreement: Agreement) => {
    setAgreements(prev => [newAgreement, ...prev]);
    setShowUploader(false);
  };

  const handleAgreementUpdate = (updated: Agreement) => {
    setAgreements(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const handleSendNotifications = async () => {
    setNotificationStatus({ loading: true, message: "Initiating notification sequence..." });
    try {
      const result = await checkAndSendNotifications(agreements, settings);

      if (result.sent > 0) {
        setNotificationStatus({
          loading: false,
          message: `Success! Sent ${result.sent} notifications. (${result.errors} errors)`
        });
      } else if (result.errors > 0) {
        setNotificationStatus({
          loading: false,
          message: `Failed to send notifications. Check API Settings.`
        });
      } else {
        setNotificationStatus({ loading: false, message: "No agreements need notification." });
      }

      // Clear message after 5s
      setTimeout(() => setNotificationStatus({ loading: false, message: null }), 5000);

    } catch (e) {
      setNotificationStatus({ loading: false, message: "Critical Error sending notifications." });
    }
  };

  const handleReset = async () => {
    const { error } = await deleteAllAgreements();
    if (error) {
      alert('Failed to reset database: ' + error.message);
    } else {
      setAgreements([]);
      alert('Database reset successfully. All agreements have been removed.');
    }
  };

  const statusBadgeColor = (status: AgreementStatus) => {
    switch (status) {
      case AgreementStatus.ACTIVE: return 'bg-green-100 text-green-700';
      case AgreementStatus.EXPIRING_SOON: return 'bg-yellow-100 text-yellow-700';
      case AgreementStatus.EXPIRED: return 'bg-red-100 text-red-700';
      case AgreementStatus.PENDING_APPROVAL: return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading...</div>;
  }



  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 flex items-center text-white font-bold text-xl tracking-tight">
          <FileText className="mr-2 text-indigo-400" /> Skynet
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button
            onClick={() => { setView('dashboard'); setSelectedAgreementId(null); }}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-all ${view === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={18} className="mr-3" /> Dashboard
          </button>
          <button
            onClick={() => { setView('settings'); setSelectedAgreementId(null); }}
            className={`flex items-center w-full px-4 py-3 rounded-lg transition-all ${view === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800'}`}
          >
            <SettingsIcon size={18} className="mr-3" /> Settings
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => signOut()}
            className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-slate-800 text-red-400 text-sm font-medium transition-all"
          >
            <LogOut size={16} className="mr-2" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8">

        {/* Top Bar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {view === 'dashboard' ? 'Skynet Agreements' : view === 'settings' ? 'System Configuration' : 'Agreement Details'}
            </h1>
            <p className="text-slate-500 text-sm">Welcome back, Admin</p>
          </div>

          <div className="flex items-center gap-4">
            {notificationStatus.message && (
              <div className={`text-sm font-medium px-4 py-2 rounded-full flex items-center ${notificationStatus.loading ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {notificationStatus.loading && <Bell className="w-4 h-4 mr-2 animate-bounce" />}
                {notificationStatus.message}
              </div>
            )}

            {view === 'dashboard' && (
              <>
                <button
                  onClick={handleSendNotifications}
                  disabled={notificationStatus.loading}
                  className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-all flex items-center"
                >
                  <Send size={16} className="mr-2 text-indigo-500" /> Notify Parties
                </button>
                <button
                  onClick={() => setShowUploader(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center"
                >
                  <Upload size={18} className="mr-2" /> Upload New
                </button>
              </>
            )}
          </div>
        </header>

        {view === 'dashboard' ? (
          <div className="space-y-8 animate-fade-in">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatsCard title="Total Agreements" value={stats.total} icon={FileText} color="blue" />
              <StatsCard title="Active" value={stats.active} icon={Filter} color="indigo" />
              <StatsCard title="Expiring Soon" value={stats.expiring} icon={Bell} color="yellow" trend="Action Needed" />
              <StatsCard title="Pending Approval" value={stats.pending} icon={CheckCircle} color="indigo" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Table Section */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
                  <h2 className="font-bold text-lg text-slate-800">All Agreements</h2>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search parties, location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="border border-slate-200 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="All">All Status</option>
                      <option value={AgreementStatus.ACTIVE}>Active</option>
                      <option value={AgreementStatus.EXPIRING_SOON}>Expiring</option>
                      <option value={AgreementStatus.EXPIRED}>Expired</option>
                      <option value={AgreementStatus.PENDING_APPROVAL}>Pending</option>
                    </select>
                  </div>
                </div>

                {/* Grouping Toggle */}
                <div className="px-6 py-2 bg-slate-50 border-b border-slate-100 flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={view === 'grouped'}
                      onChange={(e) => setView(e.target.checked ? 'grouped' : 'dashboard')}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    <span className="ms-3 text-sm font-medium text-gray-900">Group by Type</span>
                  </label>
                </div>

                <div className="overflow-x-auto flex-1">
                  {view === 'grouped' ? (
                    <div className="p-6 space-y-8">
                      {Object.entries(filteredAgreements.reduce((acc, agreement) => {
                        const type = agreement.type || 'Uncategorized';
                        if (!acc[type]) acc[type] = [];
                        acc[type].push(agreement);
                        return acc;
                      }, {} as Record<string, Agreement[]>)).map(([type, groupAgreements]) => (
                        <div key={type} className="border border-slate-200 rounded-xl overflow-hidden">
                          <div className="bg-slate-100 px-6 py-3 font-bold text-slate-700 border-b border-slate-200 flex justify-between items-center">
                            <span>{type}</span>
                            <span className="text-xs bg-white px-2 py-1 rounded border border-slate-300">{groupAgreements.length}</span>
                          </div>
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                              <tr>
                                <th className="px-6 py-4">Counterparty</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Expiry Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                              {groupAgreements.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 font-medium text-slate-800">{item.partyB}</td>
                                  <td className="px-6 py-4 text-slate-600">{item.location}</td>
                                  <td className="px-6 py-4 text-slate-600 font-mono">{item.expiryDate}</td>
                                  <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadgeColor(item.status)}`}>
                                      {item.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <button
                                      onClick={() => { setSelectedAgreementId(item.id); setView('detail'); }}
                                      className="text-indigo-600 hover:text-indigo-800 font-medium text-xs border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-50 mr-2"
                                    >
                                      Manage
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Are you sure you want to delete this agreement?')) {
                                          const { error } = await deleteAgreement(item.id);
                                          if (error) {
                                            alert('Failed to delete agreement');
                                          } else {
                                            setAgreements(prev => prev.filter(a => a.id !== item.id));
                                          }
                                        }
                                      }}
                                      className="text-red-600 hover:text-red-800 font-medium text-xs border border-red-200 px-3 py-1 rounded hover:bg-red-50"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                          <th className="px-6 py-4">Counterparty</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Location</th>
                          <th className="px-6 py-4">Expiry Date</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredAgreements.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-800">{item.partyB}</td>
                            <td className="px-6 py-4 text-slate-600">{item.type}</td>
                            <td className="px-6 py-4 text-slate-600">{item.location}</td>
                            <td className="px-6 py-4 text-slate-600 font-mono">{item.expiryDate}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadgeColor(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => { setSelectedAgreementId(item.id); setView('detail'); }}
                                className="text-indigo-600 hover:text-indigo-800 font-medium text-xs border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-50 mr-2"
                              >
                                Manage
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Are you sure you want to delete this agreement?')) {
                                    const { error } = await deleteAgreement(item.id);
                                    if (error) {
                                      alert('Failed to delete agreement');
                                    } else {
                                      setAgreements(prev => prev.filter(a => a.id !== item.id));
                                    }
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 font-medium text-xs border border-red-200 px-3 py-1 rounded hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredAgreements.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                              No agreements found matching your search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Analytics Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="font-bold text-lg text-slate-800 mb-6">Expiry Overview</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#64748b' }} />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <h4 className="text-yellow-800 font-semibold text-sm mb-1 flex items-center">
                    <Bell size={14} className="mr-2" />
                    Priority Alert
                  </h4>
                  <p className="text-yellow-700 text-xs">
                    {stats.expiring} agreements are expiring within the next 60 days. Review them to avoid service interruption or penalties.
                  </p>
                  <button
                    onClick={handleSendNotifications}
                    className="mt-3 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1.5 rounded font-medium transition-colors w-full"
                  >
                    Send WhatsApp Reminders
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : view === 'settings' ? (
          <Settings settings={settings} onSave={setSettings} onReset={handleReset} />
        ) : (
          selectedAgreementId && (
            <AgreementDetail
              agreement={agreements.find(a => a.id === selectedAgreementId)!}
              onBack={() => { setView('dashboard'); setSelectedAgreementId(null); }}
              onUpdate={handleAgreementUpdate}
            />
          )
        )}
      </main>

      {/* Upload Modal */}
      {showUploader && (
        <Uploader onUploadComplete={handleUpload} onCancel={() => setShowUploader(false)} />
      )}
    </div>
  );
}
