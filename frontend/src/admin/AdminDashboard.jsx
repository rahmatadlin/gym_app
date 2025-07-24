import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../components/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContainer.jsx';

const menuItems = [
  { key: 'package', label: 'Package', icon: '📦' },
  { key: 'member', label: 'Member', icon: '👥' },
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

function AdminDashboard() {
  const [selectedMenu, setSelectedMenu] = useState('package');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [members, setMembers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'member',
    phone_number: '',
    date_of_birth: '',
    address: '',
    user_image: null
  });
  const [packageFormData, setPackageFormData] = useState({
    package_name: '',
    description: '',
    price: '',
    package_status: 'active',
    duration: 30,
    is_coaching_flag: false,
    package_image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [packageImagePreview, setPackageImagePreview] = useState(null);
  const itemsPerPage = 10;
  const { logout, token } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  // Fetch members from API
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      showError('Failed to fetch members: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch packages from API
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
      setPackages(data);
    } catch (error) {
      showError('Failed to fetch packages: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMenu === 'member') {
      fetchMembers();
    } else if (selectedMenu === 'package') {
      fetchPackages();
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
    setSortConfig({ key: 'created_at', direction: 'asc' });
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        showError('Please select a valid image file (JPG, PNG, GIF, WebP)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Image size must be less than 5MB');
        return;
      }
      
      setFormData({...formData, user_image: file});
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.username || !formData.password) {
      showError('Name, username, and password are required!');
      return;
    }
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('username', formData.username);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('role', formData.role);
      formDataToSend.append('phone_number', formData.phone_number);
      formDataToSend.append('date_of_birth', formData.date_of_birth);
      formDataToSend.append('address', formData.address);
      if (formData.user_image) {
        formDataToSend.append('user_image', formData.user_image);
      }
      
      const response = await fetch('http://localhost:3000/api/users/register', {
        method: 'POST',
        body: formDataToSend
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create member');
      showSuccess('Member created successfully!');
      closeCreateModal();
      await fetchMembers();
      setCurrentPage(1);
    } catch (error) {
      showError('Failed to create member: ' + error.message);
    }
  };

  const handleEditMember = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('username', formData.username);
      formDataToSend.append('role', formData.role);
      formDataToSend.append('phone_number', formData.phone_number);
      formDataToSend.append('date_of_birth', formData.date_of_birth);
      formDataToSend.append('address', formData.address);
      
      // Only add password if it's not empty
      if (formData.password && formData.password.trim() !== '') {
        formDataToSend.append('password', formData.password);
      }
      
      // Only add image if a new one is selected
      if (formData.user_image && formData.user_image instanceof File) {
        formDataToSend.append('user_image', formData.user_image);
      }
      
      const response = await fetch(`http://localhost:3000/api/users/${editingMemberId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update member');
      showSuccess('Member updated successfully!');
      closeEditModal();
      
      // Fetch members and maintain current position
      await fetchMembers();
      
      // Reset to first page to maintain consistent view
      setCurrentPage(1);
      
      setEditingMemberId(null);
    } catch (error) {
      showError('Failed to update member: ' + error.message);
    }
  };

  const handleDeleteMember = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/users/${selectedMember.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to delete member');
      showSuccess('Member deleted successfully!');
      setShowDeleteModal(false);
      setSelectedMember(null);
      await fetchMembers();
      setCurrentPage(1);
    } catch (error) {
      showError('Failed to delete member: ' + error.message);
    }
  };

  const openCreateModal = () => {
    // Get today's date in YYYY-MM-DD format for the date input
    const today = new Date().toISOString().split('T')[0];
    
    setFormData({ 
      name: '', 
      username: '', 
      password: '', 
      role: 'member', 
      phone_number: '', 
      date_of_birth: today, 
      address: '', 
      user_image: null 
    });
    setImagePreview(null);
    setShowCreateModal(true);
  };

  const openEditModal = (member) => {
    setSelectedMember(member);
    setEditingMemberId(member.id);
    
    // Format date for input field (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
      if (!dateString) {
        // If no date, use today's date as default
        return new Date().toISOString().split('T')[0];
      }
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    };
    
    setFormData({
      name: member.name || '',
      username: member.username || '',
      password: '',
      role: member.role || 'member',
      phone_number: member.phone_number || '',
      date_of_birth: formatDateForInput(member.date_of_birth),
      address: member.address || '',
      user_image: null
    });
    
    // Set image preview if member has an image
    if (member.user_image) {
      // Convert relative path to full URL
      const imageUrl = `http://localhost:3000${member.user_image}`;
      setImagePreview(imageUrl);
    } else {
      setImagePreview(null);
    }
    
    setShowEditModal(true);
  };

  // Function to remove image
  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, user_image: null }));
    setImagePreview(null);
  };

  // Function to remove package image
  const handleRemovePackageImage = () => {
    setPackageFormData(prev => ({ ...prev, package_image: null }));
    setPackageImagePreview(null);
  };

  // Function to clear create modal state
  const closeCreateModal = () => {
    setShowCreateModal(false);
    if (selectedMenu === 'member') {
      const today = new Date().toISOString().split('T')[0];
      setFormData({ name: '', username: '', password: '', role: 'member', phone_number: '', date_of_birth: today, address: '', user_image: null });
      setImagePreview(null);
    } else if (selectedMenu === 'package') {
      setPackageFormData({ package_name: '', description: '', price: '', package_status: 'active', duration: 30, is_coaching_flag: false, package_image: null });
      setPackageImagePreview(null);
    }
  };

  // Function to clear edit modal state
  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedMember(null);
    setSelectedPackage(null);
    setEditingMemberId(null);
    setEditingPackageId(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({ name: '', username: '', password: '', role: 'member', phone_number: '', date_of_birth: today, address: '', user_image: null });
    setPackageFormData({ package_name: '', description: '', price: '', package_status: 'active', duration: 30, is_coaching_flag: false, package_image: null });
    setImagePreview(null);
    setPackageImagePreview(null);
  };

  const openDeleteModal = (member) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  // Package CRUD functions
  const handlePackageImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        showError('Please select a valid image file (JPG, PNG, GIF, WebP)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Image size must be less than 5MB');
        return;
      }
      
      setPackageFormData({...packageFormData, package_image: file});
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPackageImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!packageFormData.package_name || !packageFormData.price) {
      showError('Package name and price are required!');
      return;
    }
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('package_name', packageFormData.package_name);
      formDataToSend.append('description', packageFormData.description);
      formDataToSend.append('price', packageFormData.price);
      formDataToSend.append('package_status', packageFormData.package_status);
      formDataToSend.append('duration', packageFormData.duration);
      formDataToSend.append('is_coaching_flag', packageFormData.is_coaching_flag);
      if (packageFormData.package_image) {
        formDataToSend.append('package_image', packageFormData.package_image);
      }
      
      const response = await fetch('http://localhost:3000/api/packages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create package');
      showSuccess('Package created successfully!');
      closeCreateModal();
      await fetchPackages();
      setCurrentPage(1);
    } catch (error) {
      showError('Failed to create package: ' + error.message);
    }
  };

  const handleEditPackage = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('package_name', packageFormData.package_name);
      formDataToSend.append('description', packageFormData.description);
      formDataToSend.append('price', packageFormData.price);
      formDataToSend.append('package_status', packageFormData.package_status);
      formDataToSend.append('duration', packageFormData.duration);
      formDataToSend.append('is_coaching_flag', packageFormData.is_coaching_flag);
      
      // Only add image if a new one is selected
      if (packageFormData.package_image && packageFormData.package_image instanceof File) {
        formDataToSend.append('package_image', packageFormData.package_image);
      }
      
      const response = await fetch(`http://localhost:3000/api/packages/${editingPackageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update package');
      showSuccess('Package updated successfully!');
      closeEditModal();
      
      // Fetch packages and maintain current position
      await fetchPackages();
      
      // Reset to first page to maintain consistent view
      setCurrentPage(1);
      
      setEditingPackageId(null);
    } catch (error) {
      showError('Failed to update package: ' + error.message);
    }
  };

  const handleDeletePackage = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/packages/${selectedPackage.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to delete package');
      showSuccess('Package deleted successfully!');
      setShowDeleteModal(false);
      setSelectedPackage(null);
      await fetchPackages();
      setCurrentPage(1);
    } catch (error) {
      showError('Failed to delete package: ' + error.message);
    }
  };

  const openCreatePackageModal = () => {
    setPackageFormData({ package_name: '', description: '', price: '', package_status: 'active', duration: 30, is_coaching_flag: false, package_image: null });
    setPackageImagePreview(null);
    setShowCreateModal(true);
  };

  const openEditPackageModal = (packageItem) => {
    setSelectedPackage(packageItem);
    setEditingPackageId(packageItem.id);
    
    setPackageFormData({
      package_name: packageItem.package_name || '',
      description: packageItem.description || '',
      price: packageItem.price || '',
      package_status: packageItem.package_status || 'active',
      duration: packageItem.duration || 30,
      is_coaching_flag: packageItem.is_coaching_flag || false,
      package_image: null
    });
    
    // Set image preview if package has an image
    if (packageItem.package_image) {
      // Convert URL path to full URL
      // package_image is now stored as "/uploads/packages/filename.jpg"
      // so we need to construct URL as "http://localhost:3000/uploads/packages/filename.jpg"
      const imageUrl = `http://localhost:3000${packageItem.package_image}`;
      setPackageImagePreview(imageUrl);
    } else {
      setPackageImagePreview(null);
    }
    
    setShowEditModal(true);
  };

  const openDeletePackageModal = (packageItem) => {
    setSelectedPackage(packageItem);
    setShowDeleteModal(true);
  };

  const filteredData = useMemo(() => {
    let data = selectedMenu === 'package' ? [...packages] : [...members];
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(item => 
        Object.values(item).some(
          val => String(val).toLowerCase().includes(term)
        )
      );
    }
    
    // Filter by role (only for members)
    if (selectedMenu === 'member' && roleFilter !== 'all') {
      data = data.filter(item => item.role === roleFilter);
    }
    
    // Sort data
    if (sortConfig.key) {
      data.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        // Handle date sorting
        if (sortConfig.key === 'created_at' || sortConfig.key === 'updated_at') {
          aVal = new Date(aVal || 0);
          bVal = new Date(bVal || 0);
        }
        
        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return data;
  }, [selectedMenu, searchTerm, sortConfig, members, roleFilter, packages]);

  // Pagination logic
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
      <aside className="w-64 bg-gradient-to-b from-blue-800 to-blue-900 text-white flex flex-col py-8 px-4 justify-between">
        <div>
          <div className="flex flex-col items-center mb-10">
            <img
              src="/public/images/montana-logo.jpg"
              className="h-16 w-16 rounded-full object-cover border-2 border-yellow-400 mb-2"
              alt="Montana Fitness Logo"
              width={64}
              height={64}
            />
            <div className="text-2xl font-bold tracking-wide text-center">Montana Fitness</div>
            <div className="text-sm text-blue-200">Admin Panel</div>
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
        <button
          className="flex items-center gap-3 py-3 px-4 rounded-lg text-left transition-all font-medium hover:bg-blue-700/50 mt-8"
          onClick={() => handleMenuClick('logout')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M18 12H9m0 0l3-3m-3 3l3 3" />
          </svg>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedMenu === 'package' ? 'Daftar Package' : 'List Member'}
            </h2>
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                {selectedMenu === 'member' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Filter by Role:</span>
                    <select
                      value={roleFilter}
                      onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="all">All Roles</option>
                      <option value="member">Member</option>
                      <option value="coach">Coach</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}
              </div>
              {selectedMenu === 'package' && (
                <button 
                  onClick={openCreatePackageModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Package
                </button>
              )}
              {selectedMenu === 'member' && (
                <button 
                  onClick={openCreateModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Member
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {selectedMenu === 'package' ? (
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('id')}
                    >
                      No {getSortIndicator('id')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('package_name')}
                    >
                      Package Name {getSortIndicator('package_name')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('price')}
                    >
                      Price {getSortIndicator('price')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('is_coaching_flag')}
                    >
                      Coaching {getSortIndicator('is_coaching_flag')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('package_status')}
                    >
                      Status {getSortIndicator('package_status')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('duration')}
                    >
                      Duration {getSortIndicator('duration')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      Created At {getSortIndicator('created_at')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('updated_at')}
                    >
                      Updated At {getSortIndicator('updated_at')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      Nama Member {getSortIndicator('name')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('username')}
                    >
                      Username {getSortIndicator('username')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('role')}
                    >
                      Role {getSortIndicator('role')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('phone_number')}
                    >
                      Phone Number {getSortIndicator('phone_number')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      Created At {getSortIndicator('created_at')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('updated_at')}
                    >
                      Updated At {getSortIndicator('updated_at')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                )}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={selectedMenu === 'package' ? 9 : 8} className="px-6 py-4 text-center text-sm text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      {selectedMenu === 'package' ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="font-medium">{item.package_name}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.is_coaching_flag ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.package_status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.package_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.duration} days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.updated_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => openEditPackageModal(item)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                                title="Edit Package"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => openDeletePackageModal(item)}
                                className="p-1 rounded-md transition-colors text-red-600 hover:text-red-900 hover:bg-red-50"
                                title="Delete Package"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              {item.user_image ? (
                                <img 
                                  src={`http://localhost:3000${item.user_image}`}
                                  alt={item.name}
                                  className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                />
                              ) : (
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                  {item.name?.charAt(0) || '?'}
                                </div>
                              )}
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">{item.name || '-'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            @{item.username || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.role === 'admin' 
                                ? 'bg-red-100 text-red-800'
                                : item.role === 'coach'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.role || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.phone_number || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(item.updated_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => openEditModal(item)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                                title="Edit Member"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => openDeleteModal(item)}
                                disabled={item.role === 'admin'}
                                className={`p-1 rounded-md transition-colors ${
                                  item.role === 'admin' 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                                }`}
                                title={item.role === 'admin' ? 'Admin users cannot be deleted' : 'Delete Member'}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={selectedMenu === 'package' ? 9 : 8} className="px-6 py-4 text-center text-sm text-gray-500">
                      No data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

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

      {/* Create Member Modal */}
      {showCreateModal && selectedMenu === 'member' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeCreateModal}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Create New Member</h3>
            <form onSubmit={handleCreateMember}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="member">Member</option>
                    <option value="coach">Coach</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {imagePreview && (
                    <div className="mt-2 relative">
                      <div className="w-32 h-32 rounded-md overflow-hidden border border-gray-300">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-10 -right-8 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMenu === 'member' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeEditModal}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Edit Member</h3>
            <form onSubmit={handleEditMember}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="member">Member</option>
                    <option value="coach">Coach</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {imagePreview && (
                    <div className="mt-2 relative">
                      <div className="w-32 h-32 rounded-md overflow-hidden border border-gray-300">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-10 -right-8 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowDeleteModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">
              {selectedMenu === 'package' ? 'Delete Package' : 'Delete Member'}
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>
                {selectedMenu === 'package' ? selectedPackage?.package_name : selectedMember?.name}
              </strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={selectedMenu === 'package' ? handleDeletePackage : handleDeleteMember}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Package Modal */}
      {showCreateModal && selectedMenu === 'package' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeCreateModal}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Create Package</h3>
            <form onSubmit={handleCreatePackage}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                  <input
                    type="text"
                    required
                    value={packageFormData.package_name}
                    onChange={(e) => setPackageFormData({...packageFormData, package_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={packageFormData.price}
                    onChange={(e) => setPackageFormData({...packageFormData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={packageFormData.package_status}
                    onChange={(e) => setPackageFormData({...packageFormData, package_status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={packageFormData.duration}
                    onChange={(e) => setPackageFormData({...packageFormData, duration: parseInt(e.target.value, 10)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coaching Flag</label>
                  <select
                    value={packageFormData.is_coaching_flag}
                    onChange={(e) => setPackageFormData({...packageFormData, is_coaching_flag: e.target.value === 'true'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={false}>No</option>
                    <option value={true}>Yes</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={packageFormData.description}
                    onChange={(e) => setPackageFormData({...packageFormData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePackageImageChange}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {packageImagePreview && (
                    <div className="mt-2 relative">
                      <div className="w-32 h-32 rounded-md overflow-hidden border border-gray-300">
                        <img src={packageImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePackageImage}
                        className="absolute -top-10 -right-8 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Package Modal */}
      {showEditModal && selectedMenu === 'package' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeEditModal}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Edit Package</h3>
            <form onSubmit={handleEditPackage}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                  <input
                    type="text"
                    required
                    value={packageFormData.package_name}
                    onChange={(e) => setPackageFormData({...packageFormData, package_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={packageFormData.price}
                    onChange={(e) => setPackageFormData({...packageFormData, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={packageFormData.package_status}
                    onChange={(e) => setPackageFormData({...packageFormData, package_status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={packageFormData.duration}
                    onChange={(e) => setPackageFormData({...packageFormData, duration: parseInt(e.target.value, 10)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coaching Flag</label>
                  <select
                    value={packageFormData.is_coaching_flag}
                    onChange={(e) => setPackageFormData({...packageFormData, is_coaching_flag: e.target.value === 'true'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={false}>No</option>
                    <option value={true}>Yes</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={packageFormData.description}
                    onChange={(e) => setPackageFormData({...packageFormData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePackageImageChange}
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {packageImagePreview && (
                    <div className="mt-2 relative">
                      <div className="w-32 h-32 rounded-md overflow-hidden border border-gray-300">
                        <img src={packageImagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePackageImage}
                        className="absolute -top-10 -right-8 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;