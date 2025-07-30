import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../components/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContainer.jsx';
import CoachScheduleManager from '../components/CoachScheduleManager.jsx';
import BookingList from '../components/BookingList.jsx';

const menuItems = [
  { key: 'transaction', label: 'Transaction', icon: '💳' },
  { key: 'booking', label: 'Bookings', icon: '📋' },
  { key: 'schedule', label: 'Schedule', icon: '📅' },
  { key: 'profile', label: 'Profile', icon: '👤' },
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit' };
  
  const dateStr = date.toLocaleDateString('id-ID', dateOptions);
  const timeStr = date.toLocaleTimeString('id-ID', timeOptions);
  
  return `${dateStr} - ${timeStr}`;
};

function CoachDashboard() {
  const [selectedMenu, setSelectedMenu] = useState('transaction');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editProfile, setEditProfile] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sessions, setSessions] = useState({});
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const itemsPerPage = 10;
  const { logout, token, user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  // Fetch transactions assigned to this coach
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/transactions/coach/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      showError('Failed to fetch transactions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings assigned to this coach
  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/bookings/coach/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      setBookings(data.data || []);
    } catch (error) {
      showError('Failed to fetch bookings: ' + error.message);
    } finally {
      setBookingsLoading(false);
    }
  };

  // Initialize profile data
  useEffect(() => {
    if (user) {
      setEditProfile({
        name: user.name || '',
        username: user.username || '',
        phone_number: user.phone_number || '',
        date_of_birth: user.date_of_birth ? new Date(user.date_of_birth).toISOString().split('T')[0] : '',
        gender: user.gender || '',
        address: user.address || ''
      });
      setImagePreview(user.user_image ? `http://localhost:3000${user.user_image}` : null);
    }
  }, [user]);

  // Fetch data based on selected menu
  useEffect(() => {
    if (selectedMenu === 'transaction') {
      fetchTransactions();
    } else if (selectedMenu === 'booking') {
      fetchBookings();
    }
  }, [selectedMenu]);

  const handleMenuClick = (key) => {
    if (key === 'logout') {
      logout();
      showSuccess('Logout successful! See you next time!');
      navigate('/login');
      return;
    }
    setSelectedMenu(key);
    setSearchTerm('');
    setSortConfig({ key: null, direction: 'asc' });
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setEditProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', editProfile.name);
      formData.append('username', editProfile.username);
      formData.append('phone_number', editProfile.phone_number);
      formData.append('date_of_birth', editProfile.date_of_birth);
      formData.append('gender', editProfile.gender);
      formData.append('address', editProfile.address);
      
      if (profileImage) {
        formData.append('user_image', profileImage);
      }

      const response = await fetch(`http://localhost:3000/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      showSuccess('Profile updated successfully!');
      setProfileImage(null);
      
      // Refresh user data to get updated information
      await refreshUser();
    } catch (error) {
      showError('Failed to update profile: ' + error.message);
    }
  };

  const openTransactionModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
    // Initialize sessions from transaction data or create default
    const initialSessions = transaction.sessions || {};
    const defaultSessions = {};
    for (let i = 1; i <= 12; i++) {
      defaultSessions[i] = initialSessions[i] || false;
    }
    setSessions(defaultSessions);
  };

  const handleSessionChange = (sessionNumber) => {
    // Prevent unchecking sessions that are already checked
    if (sessions[sessionNumber]) {
      return;
    }

    // Check if previous sessions are checked (ensure order)
    for (let i = 1; i < sessionNumber; i++) {
      if (!sessions[i]) {
        // Show error message
        showError(`Session ${i} must be completed before Session ${sessionNumber}`);
        return;
      }
    }

    // Allow checking the session
    setSessions(prev => ({
      ...prev,
      [sessionNumber]: true
    }));
  };

  const handleSessionsUpdate = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/transactions/${selectedTransaction.id}/sessions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessions })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update sessions');
      }

      showSuccess('Sessions updated successfully!');
      // Update the selected transaction with new sessions data
      const updatedTransaction = await response.json();
      setSelectedTransaction(updatedTransaction);
      fetchTransactions(); // Refresh the transactions list
      
      // Close the modal after successful update
      setShowTransactionModal(false);
    } catch (error) {
      showError('Failed to update sessions: ' + error.message);
    }
  };

  const filteredData = useMemo(() => {
    let data = [...transactions];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(item =>
        Object.values(item).some(
          val => String(val).toLowerCase().includes(term)
        )
      );
    }
    if (sortConfig.key) {
      data.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return data;
  }, [searchTerm, sortConfig, transactions]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-blue-800 to-blue-900 text-white flex flex-col py-8 px-4 justify-between transition-all duration-300`}>
        <div>
          <div className="flex flex-col items-center mb-10">
            <img
              src="/public/images/montana-logo.jpg"
              className="h-16 w-16 rounded-full object-cover border-2 border-yellow-400 mb-2"
              alt="Montana Fitness Logo"
              width={64}
              height={64}
            />
            {!sidebarCollapsed && (
              <>
                <div className="text-2xl font-bold tracking-wide text-center">Montana Fitness Center</div>
                <div className="text-sm text-blue-200">Coach Panel</div>
              </>
            )}
          </div>
          {/* Dummy Coach Profile */}
          <div className="flex items-center gap-3 mb-8 px-2">
            {user?.user_image ? (
              <img
                src={`http://localhost:3000${user.user_image}`}
                alt={user.name}
                className="h-12 w-12 rounded-full object-cover border-2 border-blue-400"
                width={48}
                height={48}
              />
            ) : (
              <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold border-2 border-blue-400">
                {user?.name?.charAt(0) || 'C'}
              </div>
            )}
            {!sidebarCollapsed && (
              <div>
                <div className="text-lg font-semibold">{user?.name || 'Coach User'}</div>
                <div className="text-xs text-blue-200">@{user?.username || 'coach'}</div>
              </div>
            )}
          </div>
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <button
                key={item.key}
                className={`flex items-center gap-3 py-3 px-4 rounded-lg text-left transition-all font-medium ${
                  selectedMenu === item.key 
                    ? 'bg-blue-700 shadow-md' 
                    : 'hover:bg-blue-700/50'
                }`}
                onClick={() => handleMenuClick(item.key)}
                title={sidebarCollapsed ? item.label : ''}
              >
                <span className="text-lg">{item.icon}</span>
                {!sidebarCollapsed && item.label}
              </button>
            ))}
          </nav>
        </div>
        <div>
          <button
            className="flex items-center gap-3 py-3 px-4 rounded-lg text-left transition-all font-medium hover:bg-blue-700/50 mb-4 w-full"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d={sidebarCollapsed ? "M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" : "M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"} />
            </svg>
            {!sidebarCollapsed && 'Toggle Sidebar'}
          </button>
          <button
            className="flex items-center gap-3 py-3 px-4 rounded-lg text-left transition-all font-medium hover:bg-blue-700/50 w-full"
            onClick={() => handleMenuClick('logout')}
            title={sidebarCollapsed ? 'Logout' : ''}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 12H9m0 0l3-3m-3 3l3 3" />
            </svg>
            {!sidebarCollapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 p-8 transition-all duration-300 ${sidebarCollapsed ? 'ml-0' : ''}`}>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedMenu === 'transaction' ? 'Daftar Transaction' : 'Profile Settings'}
            </h2>
          </div>

          {/* Transaction Menu */}
          {selectedMenu === 'transaction' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('transaction_no')}
                    >
                      Transaction No {getSortIndicator('transaction_no')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('member.name')}
                    >
                      Member {getSortIndicator('member.name')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('package.package_name')}
                    >
                      Package {getSortIndicator('package.package_name')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('transaction_status')}
                    >
                      Status {getSortIndicator('transaction_status')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('start_date')}
                    >
                      Start Date {getSortIndicator('start_date')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('end_date')}
                    >
                      End Date {getSortIndicator('end_date')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      Created At {getSortIndicator('created_at')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : currentItems.length > 0 ? (
                    currentItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            {item.transaction_no}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            {item.member?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            {item.package?.package_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.transaction_status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : item.transaction_status === 'processed'
                              ? 'bg-blue-100 text-blue-800'
                              : item.transaction_status === 'waiting_for_payment'
                              ? 'bg-yellow-100 text-yellow-800'
                              : item.transaction_status === 'expired'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.transaction_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.start_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.end_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => openTransactionModal(item)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                              title="View Transaction Details"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                        No data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Booking Menu */}
          {selectedMenu === 'booking' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">My Bookings</h2>
              {bookingsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading bookings...</p>
                </div>
              ) : (
                <BookingList 
                  coachId={user?.id} 
                  showActions={true}
                  isCoach={true}
                />
              )}
            </div>
          )}

          {/* Schedule Menu */}
          {selectedMenu === 'schedule' && (
            <div className="p-8">
              <CoachScheduleManager coachId={user?.id} />
            </div>
          )}

          {/* Profile Menu */}
          {selectedMenu === 'profile' && (
            <div className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column - Profile Picture */}
                <div className="w-full md:w-1/3">
                  <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex flex-col items-center">
                      <div className="relative mb-4">
                        <img
                          src={imagePreview || 'https://randomuser.me/api/portraits/men/32.jpg'}
                          alt="Profile"
                          className="h-40 w-40 rounded-full object-cover border-4 border-white shadow-md"
                        />
                        <label 
                          htmlFor="profileImage"
                          className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition"
                          title="Change photo"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                          </svg>
                          <input
                            id="profileImage"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800">{editProfile.name}</h3>
                      <p className="text-gray-600">@{editProfile.username}</p>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Coach Since</h4>
                        <p className="text-gray-800">{formatDate(user?.created_at)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Coach Status</h4>
                        <p className="text-green-600 font-medium">Active</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Profile Form */}
                <div className="w-full md:w-2/3">
                  <form onSubmit={handleProfileSubmit} className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={editProfile.name}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                          type="text"
                          name="username"
                          value={editProfile.username}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                          type="text"
                          name="phone_number"
                          value={editProfile.phone_number}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          name="date_of_birth"
                          value={editProfile.date_of_birth}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select
                          name="gender"
                          value={editProfile.gender}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea
                          name="address"
                          value={editProfile.address}
                          onChange={handleProfileChange}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredData.length)}
              </span>{' '}
              of <span className="font-medium">{filteredData.length}</span> results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-md border ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Transaction Modal */}
      {showTransactionModal && selectedTransaction && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowTransactionModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Transaction Details</h3>
            
            {/* Transaction No - Full Width */}
            <div className="mb-4">
              <p className="text-sm text-gray-700 font-bold">Transaction No</p>
              <p className="text-gray-900 font-mono text-sm">{selectedTransaction.transaction_no}</p>
            </div>
            
            {/* Other Fields - 2x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-700 font-bold">Member</p>
                <p className="text-gray-900">{selectedTransaction.member?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700 font-bold">Package</p>
                <p className="text-gray-900">{selectedTransaction.package?.package_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700 font-bold">Amount</p>
                <p className="text-gray-900">{formatCurrency(selectedTransaction.package?.price)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700 font-bold">Status</p>
                <p className={`font-semibold ${
                  selectedTransaction.transaction_status === 'active' ? 'text-green-600' :
                  selectedTransaction.transaction_status === 'processed' ? 'text-blue-600' :
                  selectedTransaction.transaction_status === 'waiting_for_payment' ? 'text-yellow-600' :
                  selectedTransaction.transaction_status === 'expired' ? 'text-red-600' :
                  selectedTransaction.transaction_status === 'canceled' ? 'text-gray-600' : 'text-gray-600'
                }`}>
                  {selectedTransaction.transaction_status}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700 font-bold">Start Date</p>
                <p className="text-gray-900">{formatDate(selectedTransaction.start_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700 font-bold">End Date</p>
                <p className="text-gray-900">{formatDate(selectedTransaction.end_date)}</p>
              </div>
            </div>

            {/* Sessions Section */}
            {selectedTransaction.transaction_status === 'active' && (
              <div className="mb-4">
                <p className="text-sm text-gray-700 font-bold mb-3">Sessions</p>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(sessionNumber => {
                    const isChecked = sessions[sessionNumber] || false;
                    const canCheck = !isChecked && (sessionNumber === 1 || sessions[sessionNumber - 1]);
                    const isDisabled = isChecked || !canCheck;
                    
                    return (
                      <div key={sessionNumber} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`session-${sessionNumber}`}
                          checked={isChecked}
                          onChange={() => handleSessionChange(sessionNumber)}
                          disabled={isDisabled}
                          className={`h-4 w-4 focus:ring-blue-500 border-gray-300 rounded ${
                            isChecked 
                              ? 'text-green-600 bg-green-600 border-green-600' 
                              : isDisabled 
                                ? 'text-gray-400 bg-gray-100 border-gray-300 cursor-not-allowed'
                                : 'text-blue-600 border-gray-300'
                          }`}
                        />
                        <label 
                          htmlFor={`session-${sessionNumber}`} 
                          className={`text-sm ${
                            isChecked 
                              ? 'text-green-700 font-medium' 
                              : isDisabled 
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-700'
                          }`}
                        >
                          Session {sessionNumber}
                        </label>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <p>• Sessions must be completed in order (1, 2, 3, etc.)</p>
                  <p>• Completed sessions cannot be unchecked</p>
                </div>
              </div>
            )}
                        
            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              {selectedTransaction.transaction_status === 'active' && (
                <button
                  onClick={handleSessionsUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Sessions
                </button>
              )}
              <button
                onClick={() => setShowTransactionModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoachDashboard; 