import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContainer.jsx';

const menuItems = [
  { key: 'package', label: 'Package', icon: '📦' },
  { key: 'transaction', label: 'Transaction', icon: '💳' },
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
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

function MemberDashboard() {
  const [selectedMenu, setSelectedMenu] = useState('package');
  const [packages, setPackages] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [editProfile, setEditProfile] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  
  const { logout, token, user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

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
    } catch (error) {
      showError('Failed to fetch transactions: ' + error.message);
    } finally {
      setLoading(false);
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
    if (selectedMenu === 'package') {
      fetchPackages();
    } else if (selectedMenu === 'transaction') {
      fetchTransactions();
    }
  }, [selectedMenu]);

  const handleMenuClick = (key) => {
    setSelectedMenu(key);
  };

  const handlePackageClick = (packageItem) => {
    setSelectedPackage(packageItem);
    setShowPackageModal(true);
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
      case 'active': return 'text-green-600';
      case 'processed': return 'text-yellow-600';
      case 'expired': return 'text-red-600';
      case 'canceled': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-800 to-blue-900 text-white flex flex-col py-8 px-4 justify-between">
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
            <div className="text-2xl font-bold tracking-wide text-center">Montana Fitness</div>
            <div className="text-sm text-blue-200">Member Panel</div>
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
            <div>
              <div className="text-lg font-semibold">{user?.name || 'Member'}</div>
              <div className="text-xs text-blue-200">@{user?.username || 'member'}</div>
            </div>
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
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        {/* Logout Button */}
        <button
          className="flex items-center gap-3 py-3 px-4 rounded-lg text-left transition-all font-medium hover:bg-blue-700/50 mt-8"
          onClick={handleLogout}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 12H9m0 0l3-3m-3 3l3 3" />
          </svg>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
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
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length > 0 ? (
                        transactions.map((transaction) => (
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
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                            No transactions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
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
    </div>
  );
}

export default MemberDashboard;