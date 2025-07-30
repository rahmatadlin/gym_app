import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContainer.jsx';
import BookingForm from '../components/BookingForm.jsx';
import BookingList from '../components/BookingList.jsx';

const menuItems = [
  { key: 'package', label: 'Package', icon: '🏋' },
  { key: 'transaction', label: 'Transaction', icon: '💳' },
  { key: 'booking', label: 'Bookings', icon: '📅' },
  { key: 'profile', label: 'Profile', icon: '👤' },
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  }) + ' - ' + date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

function MemberDashboard() {
  const [selectedMenu, setSelectedMenu] = useState('package');
  const [packages, setPackages] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [editProfile, setEditProfile] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [editTransactionData, setEditTransactionData] = useState({
    coach_id: '',
    transfer_receipt_image: null
  });
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewTransactionData, setViewTransactionData] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [transactionToCancel, setTransactionToCancel] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedTransactionForBooking, setSelectedTransactionForBooking] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { logout, token, user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  // Fetch complete user profile
  const fetchUserProfile = async () => {
    try {
      await refreshUser();
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  // Fetch packages
  const fetchPackages = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/packages', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch packages');
      const data = await response.json();
      setPackages(data.filter(pkg => pkg.package_status === 'active'));
    } catch (error) {
      showError('Failed to fetch packages: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/transactions/member/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
      setFilteredTransactions(data);
    } catch (error) {
      showError('Failed to fetch transactions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search transactions
  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => 
        transaction.transaction_status === statusFilter
      );
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.transaction_no.toLowerCase().includes(searchLower) ||
        transaction.package?.package_name.toLowerCase().includes(searchLower) ||
        transaction.coach?.name.toLowerCase().includes(searchLower)
      );
    }

    setFilteredTransactions(filtered);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Fetch coaches
  const fetchCoaches = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/transactions/coaches', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch coaches');
      const data = await response.json();
      setCoaches(data);
    } catch (error) {
      showError('Failed to fetch coaches: ' + error.message);
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

  // Fetch complete user profile on mount
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  // Fetch data based on selected menu
  useEffect(() => {
    if (selectedMenu === 'package') {
      fetchPackages();
    } else if (selectedMenu === 'transaction') {
      fetchTransactions();
      fetchCoaches();
    }
  }, [selectedMenu]);

  // Filter transactions when search or filter changes
  useEffect(() => {
    filterTransactions();
  }, [searchTerm, statusFilter, transactions]);

  const handleMenuClick = (key) => {
    setSelectedMenu(key);
  };

  const handlePackageClick = (packageItem) => {
    setSelectedPackage(packageItem);
    setShowPackageModal(true);
  };

  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setEditTransactionData({
      coach_id: transaction.coach_id || '',
      transfer_receipt_image: null
    });
    setReceiptPreview(transaction.transfer_receipt_image ? `http://localhost:3000${transaction.transfer_receipt_image}` : null);
    setShowEditModal(true);
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/transactions/member/${transactionId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel transaction');
      }

      showSuccess('Transaction cancelled successfully!');
      setShowCancelModal(false);
      setTransactionToCancel(null);
      fetchTransactions();
    } catch (error) {
      showError('Failed to cancel transaction: ' + error.message);
    }
  };

  const openCancelModal = (transaction) => {
    setTransactionToCancel(transaction);
    setShowCancelModal(true);
  };

  const checkCoachTransactionCount = async (coachId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/transactions/coach/${coachId}/count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check coach transaction count');
      }

      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error('Error checking coach transaction count:', error);
      return 0;
    }
  };

  const handleCoachSelection = async (coachId) => {
    if (!coachId) {
      setEditTransactionData(prev => ({ ...prev, coach_id: '' }));
      return;
    }

    const transactionCount = await checkCoachTransactionCount(coachId);
    
    if (transactionCount >= 5) {
      showError('This coach has reached the maximum limit of 5 transactions. Please select another coach.');
      setEditTransactionData(prev => ({ ...prev, coach_id: '' }));
      return;
    }

    setEditTransactionData(prev => ({ ...prev, coach_id: coachId }));
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditTransactionData(prev => ({ ...prev, transfer_receipt_image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditTransactionSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that transfer receipt is uploaded
    if (!editTransactionData.transfer_receipt_image) {
      showError('Transfer receipt is required. Please upload your payment receipt.');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('coach_id', editTransactionData.coach_id);
      
      if (editTransactionData.transfer_receipt_image) {
        formData.append('transfer_receipt_image', editTransactionData.transfer_receipt_image);
      }

      const response = await fetch(`http://localhost:3000/api/transactions/member/${selectedTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update transaction');
      }

      showSuccess('Transaction updated successfully!');
      setShowEditModal(false);
      setSelectedTransaction(null);
      setEditTransactionData({ coach_id: '', transfer_receipt_image: null });
      setReceiptPreview(null);
      fetchTransactions();
    } catch (error) {
      showError('Failed to update transaction: ' + error.message);
    }
  };

  const handleViewTransaction = async (transaction) => {
    try {
      const response = await fetch(`http://localhost:3000/api/transactions/${transaction.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transaction details');
      }

      const data = await response.json();
      setViewTransactionData(data);
      setShowViewModal(true);
    } catch (error) {
      showError('Failed to fetch transaction details: ' + error.message);
    }
  };

  const handleConfirmPackage = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/transactions/member/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          package_id: selectedPackage.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create transaction');
      }

      showSuccess('Package added to transactions successfully!');
      setShowPackageModal(false);
      setSelectedPackage(null);
      
      // Refresh transactions if on transaction page
      if (selectedMenu === 'transaction') {
        fetchTransactions();
      }
    } catch (error) {
      showError('Failed to add package: ' + error.message);
    }
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

  const handleLogout = () => {
    logout();
    showSuccess('Logout successful! See you next time!');
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'processed':
        return 'text-blue-600';
      case 'waiting_for_payment':
        return 'text-yellow-600';
      case 'expired':
        return 'text-red-600';
      case 'canceled':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const calculateSessionProgress = (sessions) => {
    if (!sessions) return { completed: 0, total: 12, percentage: 0 };
    
    const completed = Object.values(sessions).filter(session => session === true).length;
    const total = 12;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-blue-800 to-blue-900 text-white flex flex-col py-8 px-4 justify-between transition-all duration-300`}>
        <div>
          {/* Logo Montana */}
          <div className="flex flex-col items-center mb-8">
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
                <div className="text-sm text-blue-200">Member Panel</div>
              </>
            )}
          </div>
          {/* Member Profile */}
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
                {user?.name?.charAt(0) || 'M'}
              </div>
            )}
            {!sidebarCollapsed && (
              <div>
                <div className="text-lg font-semibold">{user?.name || 'Member'}</div>
                <div className="text-xs text-blue-200">@{user?.username || 'member'}</div>
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
        {/* Logout Button */}
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
            onClick={handleLogout}
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
        <div className="bg-white rounded-xl shadow-lg overflow-hidden min-h-[400px]">
          {/* Package Menu */}
          {selectedMenu === 'package' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Packages</h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading packages...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {packages.map((packageItem) => (
                    <div key={packageItem.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-6">
                        {packageItem.package_image ? (
                          <img
                            src={`http://localhost:3000${packageItem.package_image}`}
                            alt={packageItem.package_name}
                            className="w-full h-48 object-cover rounded-lg mb-4"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                            <span className="text-gray-500">No Image</span>
                          </div>
                        )}
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{packageItem.package_name}</h3>
                        <p className="text-gray-600 mb-4">{packageItem.description}</p>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-2xl font-bold text-blue-600">{formatCurrency(packageItem.price)}</span>
                          <span className="text-sm text-gray-500">{packageItem.duration} days</span>
                        </div>
                        <button
                          onClick={() => handlePackageClick(packageItem)}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Select Package
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Transaction Menu */}
          {selectedMenu === 'transaction' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Transaction History</h2>
              
              {/* Search and Filter Section */}
              <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Transactions
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by transaction no, package name, or coach name..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={handleStatusFilterChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="waiting_for_payment">Waiting for Payment</option>
                      <option value="processed">Processed</option>
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </div>
                </div>

                {/* Results Count */}
                <div className="mt-4 text-sm text-gray-600">
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading transactions...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-xl">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Transaction No</th>
                        <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Package</th>
                        <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Amount</th>
                        <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Start Date</th>
                        <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">End Date</th>
                        <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="px-6 py-4 border-b font-mono text-sm">{transaction.transaction_no}</td>
                            <td className="px-6 py-4 border-b">{transaction.package?.package_name}</td>
                            <td className="px-6 py-4 border-b">{formatCurrency(transaction.package?.price)}</td>
                            <td className="px-6 py-4 border-b">{formatDate(transaction.start_date)}</td>
                            <td className="px-6 py-4 border-b">{formatDate(transaction.end_date)}</td>
                            <td className="px-6 py-4 border-b">
                              <span className={`font-semibold ${getStatusColor(transaction.transaction_status)}`}>
                                {transaction.transaction_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 border-b">
                              {transaction.transaction_status === 'waiting_for_payment' ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleEditTransaction(transaction)}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                                    title="Edit Transaction"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => openCancelModal(transaction)}
                                    className="p-1 rounded-md transition-colors text-red-600 hover:text-red-900 hover:bg-red-50"
                                    title="Cancel Transaction"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleViewTransaction(transaction)}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                                    title="View Transaction"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.639 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.639 0-8.573-3.007-9.963-7.178z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  </button>
                                  {transaction.package?.is_coaching_flag && transaction.transaction_status === 'active' && (
                                    <button
                                      onClick={() => {
                                        setSelectedTransactionForBooking(transaction);
                                        setShowBookingForm(true);
                                      }}
                                      className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50 transition-colors"
                                      title="Book Session"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                            {searchTerm || statusFilter !== 'all' ? 'No transactions match your search criteria' : 'No transactions found'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Booking Menu */}
          {selectedMenu === 'booking' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">My Bookings</h2>
              <BookingList memberId={user?.id} showActions={false} />
            </div>
          )}

          {/* Profile Menu */}
          {selectedMenu === 'profile' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Settings</h2>
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
                        <h4 className="text-sm font-medium text-gray-500">Member Since</h4>
                        <p className="text-gray-800">{formatDate(user?.created_at)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Membership Status</h4>
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
        </div>
      </main>

      {/* Package Confirmation Modal */}
      {showPackageModal && selectedPackage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowPackageModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Confirm Package Selection</h3>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Tambahkan Package Ini Ke Transactions ?
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800">{selectedPackage.package_name}</h4>
                <p className="text-gray-600 text-sm mt-1">{selectedPackage.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(selectedPackage.price)}</span>
                  <span className="text-sm text-gray-500">{selectedPackage.duration} days</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPackageModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                No
              </button>
              <button
                onClick={handleConfirmPackage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditModal && selectedTransaction && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Edit Transaction</h3>
            <form onSubmit={handleEditTransactionSubmit} className="space-y-4">
              {selectedTransaction.package.is_coaching_flag && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coach</label>
                  <select
                    name="coach_id"
                    value={editTransactionData.coach_id}
                    onChange={(e) => handleCoachSelection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Coach</option>
                    {coaches.map(coach => (
                      <option key={coach.id} value={coach.id}>{coach.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transfer Receipt <span className="text-red-500">*</span>
                </label>
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium">Bank Transfer Information:</p>
                  <p className="text-sm text-blue-700">Bank ABC (123456789)</p>
                  <p className="text-xs text-blue-600 mt-1">Please upload your transfer receipt after payment</p>
                </div>
                <input
                  type="file"
                  onChange={handleReceiptChange}
                  required
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {receiptPreview && (
                  <div className="mt-2">
                    <img src={receiptPreview} alt="Transfer Receipt" className="max-w-full h-auto rounded-md" />
                  </div>
                )}
                {!editTransactionData.transfer_receipt_image && (
                  <p className="text-xs text-red-500 mt-1">Transfer receipt is required to complete your transaction</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Transaction Modal */}
      {showViewModal && viewTransactionData && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowViewModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Transaction Details</h3>
            
            {/* Transaction No - Full Width */}
            <div className="mb-4">
              <p className="text-sm text-gray-700 font-bold">Transaction No</p>
              <p className="text-gray-900 font-mono text-sm">{viewTransactionData.transaction_no}</p>
            </div>
            
            {/* Other Fields - 2x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-700 font-bold">Package</p>
                <p className="text-gray-900">{viewTransactionData.package?.package_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700 font-bold">Amount</p>
                <p className="text-gray-900">{formatCurrency(viewTransactionData.package?.price)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700 font-bold">Start Date</p>
                <p className="text-gray-900">{formatDate(viewTransactionData.start_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700 font-bold">End Date</p>
                <p className="text-gray-900">{formatDate(viewTransactionData.end_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700 font-bold">Status</p>
                <p className={`font-semibold ${getStatusColor(viewTransactionData.transaction_status)}`}>
                  {viewTransactionData.transaction_status}
                </p>
              </div>
              {viewTransactionData.package?.is_coaching_flag && viewTransactionData.coach && (
                <div>
                  <p className="text-sm text-gray-700 font-bold">Assigned Coach</p>
                  <p className="text-gray-900">{viewTransactionData.coach?.name}</p>
                </div>
              )}
            </div>

            {/* Session Progress Section */}
            {viewTransactionData.package?.is_coaching_flag && (
              <div className="mb-4">
                <p className="text-sm text-gray-700 font-bold mb-3">Session Progress</p>
                {(() => {
                  const progress = calculateSessionProgress(viewTransactionData.sessions);
                  return (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Sessions Completed
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          {progress.completed}/{progress.total}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${progress.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {progress.percentage}% Complete
                        </span>
                        <span className="text-xs text-gray-500">
                          {progress.total - progress.completed} sessions remaining
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* Transfer Receipt Image - Full Width */}
            {viewTransactionData.transfer_receipt_image && (
              <div className="mb-4">
                <p className="text-sm text-gray-700 font-bold mb-2">Transfer Receipt</p>
                <img 
                  src={`http://localhost:3000${viewTransactionData.transfer_receipt_image}`} 
                  alt="Transfer Receipt" 
                  className="max-w-full h-auto rounded-md border border-gray-200 max-h-64 object-contain" 
                />
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Transaction Modal */}
      {showCancelModal && transactionToCancel && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCancelModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Confirm Cancellation</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this transaction? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                No
              </button>
              <button
                onClick={() => handleDeleteTransaction(transactionToCancel.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {showBookingForm && selectedTransactionForBooking && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowBookingForm(false);
            setSelectedTransactionForBooking(null);
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Book a Session</h3>
              <button
                onClick={() => {
                  setShowBookingForm(false);
                  setSelectedTransactionForBooking(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <BookingForm
              transactionId={selectedTransactionForBooking.id}
              memberId={user?.id}
              coachId={selectedTransactionForBooking.coach_id}
              coachName={selectedTransactionForBooking.coach?.name || 'Unknown Coach'}
              onBookingComplete={() => {
                setShowBookingForm(false);
                setSelectedTransactionForBooking(null);
                fetchTransactions();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberDashboard;