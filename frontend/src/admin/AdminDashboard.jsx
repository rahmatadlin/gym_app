import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../components/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContainer.jsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const menuItems = [
  { key: 'package', label: 'Package', icon: '🏋' },
  { key: 'member', label: 'Member', icon: '👥' },
  { key: 'transaction', label: 'Transaction', icon: '💳' },
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
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('all');
  const [coachingFlagFilter, setCoachingFlagFilter] = useState('all');
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
  const { logout, token, user, refreshUser } = useAuth();
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

  // Fetch transactions from API
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/transactions', {
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

  useEffect(() => {
    if (selectedMenu === 'member') {
      fetchMembers();
    } else if (selectedMenu === 'package') {
      fetchPackages();
    } else if (selectedMenu === 'transaction') {
      fetchTransactions();
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
      
      // If the edited member is the current admin user, refresh the user data
      if (editingMemberId === user.id) {
        await refreshUser();
      }
      
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

  // Transaction functions
  const openTransactionModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleReviseTransaction = async (transactionId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transaction_status: 'canceled'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to revise transaction');
      }

      showSuccess('Transaction revised successfully!');
      setShowTransactionModal(false);
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (error) {
      showError('Failed to revise transaction: ' + error.message);
    }
  };

  const handleApproveTransaction = async (transactionId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transaction_status: 'active'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve transaction');
      }

      showSuccess('Transaction approved successfully!');
      setShowTransactionModal(false);
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (error) {
      showError('Failed to approve transaction: ' + error.message);
    }
  };

  // PDF Export function for transactions with pagination and signature - FIXED VERSION
  const exportTransactionsToPDF = async () => {
    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = 297; // A4 landscape width
      const pageHeight = 210; // A4 landscape height
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      
      // Rows per page (considering header and footer space)
      const rowsPerPage = 10;
      const totalPages = Math.ceil(filteredData.length / rowsPerPage);
      
      // Calculate total revenue
      const totalRevenue = filteredData.reduce((sum, item) => {
        const price = parseFloat(item.package?.price) || 0;
        return sum + price;
      }, 0);
      
      // Function to add header to each page
      const addHeader = async (pageNum) => {
        try {
          // Add actual logo
          const logoResponse = await fetch('/public/images/montana-logo.jpg');
          const logoBlob = await logoResponse.blob();
          const logoUrl = URL.createObjectURL(logoBlob);
          
          // Add logo to PDF (positioned at top-left)
          pdf.addImage(logoUrl, 'JPEG', 15, 15, 20, 20);
          
          // Company info (moved to the right of logo)
          pdf.setFontSize(18);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 64, 175); // Blue color
          pdf.text('Montana Fitness Center', 45, 22);
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(55, 65, 81); // Gray color
          pdf.text('Transaction Report', 45, 30);
          
          pdf.setFontSize(9);
          pdf.setTextColor(107, 114, 128); // Light gray
          pdf.text(`Generated on: ${new Date().toLocaleDateString('id-ID')}`, 45, 36);
          pdf.text(`Admin in charge: ${user?.name || 'Admin'}`, 45, 41);
          pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 30, 36);
          
          // Add line separator
          pdf.setDrawColor(209, 213, 219);
          pdf.setLineWidth(0.5);
          pdf.line(margin, 48, pageWidth - margin, 48);
        } catch {
          // Fallback to placeholder if logo fails to load
          pdf.setFillColor(251, 191, 36); // Yellow color for logo placeholder
          pdf.circle(30, 25, 8, 'F');
          
          // Company info
          pdf.setFontSize(18);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(30, 64, 175); // Blue color
          pdf.text('Montana Fitness Center', 45, 22);
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(55, 65, 81); // Gray color
          pdf.text('Transaction Report', 45, 30);
          
          pdf.setFontSize(9);
          pdf.setTextColor(107, 114, 128); // Light gray
          pdf.text(`Generated on: ${new Date().toLocaleDateString('id-ID')}`, 45, 36);
          pdf.text(`Admin in charge: ${user?.name || 'Admin'}`, 45, 41);
          pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 30, 36);
          
          // Add line separator
          pdf.setDrawColor(209, 213, 219);
          pdf.setLineWidth(0.5);
          pdf.line(margin, 48, pageWidth - margin, 48);
        }
      };
      
      // Function to add table header
      const addTableHeader = (startY) => {
        pdf.setFillColor(243, 244, 246); // Light gray background
        pdf.rect(margin, startY, contentWidth, 12, 'F');
        
        // Table header borders
        pdf.setDrawColor(209, 213, 219);
        pdf.setLineWidth(0.3);
        
        // FIXED: Better column width distribution for clean layout
        const colWidths = [8, 90, 55, 22, 24, 35, 33];// Total: 237mm (Package reduced from 80 to 60)
        let currentX = margin;
        
        // Draw header cells and text
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        
        const headers = ['No', 'Transaction No', 'Package', 'Amount', 'Status', 'Start Date', 'End Date'];
        
        headers.forEach((header, index) => {
          // Draw cell border
          pdf.rect(currentX, startY, colWidths[index], 12);
          
          // Add text (centered vertically)
          pdf.text(header, currentX + (colWidths[index] / 2), startY + 8, { align: 'center' });
          currentX += colWidths[index];
        });
        
        return startY + 12; // Return Y position after header
      };
      
      // Helper function to ensure text fits (no truncation, just return as is)
      const formatDisplayText = (text) => {
        return text || '-';
      };
      
      // Function to add table rows
      const addTableRows = (data, startY) => {
        const colWidths = [8, 90, 55, 22, 24, 35, 33]; // Same as header
        const rowHeight = 10;
        let currentY = startY;
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5); // Slightly smaller font for better fit
        
        data.forEach((item, index) => {
          let currentX = margin;
          
          // Alternate row colors
          if (index % 2 === 1) {
            pdf.setFillColor(249, 250, 251);
            pdf.rect(margin, currentY, contentWidth, rowHeight, 'F');
          }
          
          // Draw cell borders
          pdf.setDrawColor(209, 213, 219);
          pdf.setLineWidth(0.2);
          
          const rowData = [
            (filteredData.indexOf(item) + 1).toString(),
            item.transaction_no || '-',
            item.package?.package_name || '-',
            formatCurrency(parseFloat(item.package?.price) || 0),
            item.transaction_status || '-',
            formatDate(item.start_date),
            formatDate(item.end_date)
          ];
          
          rowData.forEach((cellData, cellIndex) => {
            // Draw cell border
            pdf.rect(currentX, currentY, colWidths[cellIndex], rowHeight);
            
            // FIXED: No truncation, just format text properly
            let displayText = formatDisplayText(cellData);
            
            // Add text with proper alignment
            let textAlign = 'left';
            let textX = currentX + 1.5; // Reduced padding for more space
            
            if (cellIndex === 0 || cellIndex === 4) { // No and Status - center
              textAlign = 'center';
              textX = currentX + (colWidths[cellIndex] / 2);
            } else if (cellIndex === 3) { // Amount - right align
              textAlign = 'right';
              textX = currentX + colWidths[cellIndex] - 1.5;
            }
            
            pdf.text(displayText, textX, currentY + 6.5, { align: textAlign });
            currentX += colWidths[cellIndex];
          });
          
          currentY += rowHeight;
        });
        
        return currentY;
      };
      
      // Function to add footer with summary and signature
      const addFooter = (pageNum, isLastPage = false) => {
        if (isLastPage) {
          // Summary section
          const summaryY = pageHeight - 50;
          
          // Summary box
          pdf.setFillColor(248, 250, 252);
          pdf.rect(pageWidth - margin - 80, summaryY, 80, 25, 'F');
          pdf.setDrawColor(209, 213, 219);
          pdf.rect(pageWidth - margin - 80, summaryY, 80, 25);
          
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text('SUMMARY', pageWidth - margin - 75, summaryY + 6);
          
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Total Transactions: ${filteredData.length}`, pageWidth - margin - 75, summaryY + 12);
          pdf.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, pageWidth - margin - 75, summaryY + 18);
          
          // Signature section
          const signatureY = pageHeight - 45;
          
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          pdf.text('Indonesia, ' + new Date().toLocaleDateString('id-ID'), margin, signatureY);
          pdf.text('Admin in Charge,', margin, signatureY + 8);
          
          // Signature line
          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(0.5);
          pdf.line(margin, signatureY + 25, margin + 60, signatureY + 25);
          
          pdf.setFont('helvetica', 'bold');
          pdf.text(user?.name || 'Admin Name', margin, signatureY + 30);
        }
        
        // Page footer
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(107, 114, 128);
        pdf.text(`Montana Fitness Center - Transaction Report`, margin, pageHeight - 8);
        pdf.text(`Generated on ${new Date().toLocaleDateString('id-ID')} at ${new Date().toLocaleTimeString('id-ID')}`, 
                pageWidth - margin - 50, pageHeight - 8);
      };
      
      // Generate pages
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        if (pageNum > 1) {
          pdf.addPage();
        }
        
        // Add header
        await addHeader(pageNum);
        
        // Add table header
        let currentY = addTableHeader(55);
        
        // Get data for current page
        const startIndex = (pageNum - 1) * rowsPerPage;
        const endIndex = Math.min(startIndex + rowsPerPage, filteredData.length);
        const pageData = filteredData.slice(startIndex, endIndex);
        
        // Add table rows
        currentY = addTableRows(pageData, currentY);
        
        // Add footer
        addFooter(pageNum, pageNum === totalPages);
      }
      
      // Save the PDF
      const fileName = `transactions_report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      showSuccess('Transaction report exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showError('Failed to export PDF: ' + error.message);
    }
  };

  const filteredData = useMemo(() => {
    let data = selectedMenu === 'package' ? [...packages] : selectedMenu === 'transaction' ? [...transactions] : [...members];
    
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
    
    // Filter by transaction status (only for transactions)
    if (selectedMenu === 'transaction' && transactionStatusFilter !== 'all') {
      data = data.filter(item => item.transaction_status === transactionStatusFilter);
    }
    
    // Filter by coaching flag (only for transactions)
    if (selectedMenu === 'transaction' && coachingFlagFilter !== 'all') {
      const isCoaching = coachingFlagFilter === 'true';
      
      data = data.filter(item => {
        // Check if the package exists and has coaching flag
        if (!item.package) return false;
        
        // Handle different data types (boolean, string, number)
        const coachingFlag = item.package.is_coaching_flag;
        if (typeof coachingFlag === 'boolean') {
          return coachingFlag === isCoaching;
        } else if (typeof coachingFlag === 'string') {
          return coachingFlag.toLowerCase() === (isCoaching ? 'true' : 'false');
        } else if (typeof coachingFlag === 'number') {
          return (coachingFlag === 1) === isCoaching;
        }
        return false;
      });
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
  }, [selectedMenu, searchTerm, sortConfig, members, roleFilter, packages, transactions, transactionStatusFilter, coachingFlagFilter]);

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
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-gradient-to-b from-blue-800 to-blue-900 text-white flex flex-col py-8 px-4 justify-between transition-all duration-300`}>
        <div>
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
                <div className="text-sm text-blue-200">Admin Panel</div>
              </>
            )}
          </div>
          {/* Admin Profile */}
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
                {user?.name?.charAt(0) || 'A'}
              </div>
            )}
            {!sidebarCollapsed && (
              <div>
                <div className="text-lg font-semibold">{user?.name || 'Admin User'}</div>
                <div className="text-xs text-blue-200">@{user?.username || 'admin'}</div>
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
              {selectedMenu === 'package' ? 'Daftar Package' : selectedMenu === 'transaction' ? 'Daftar Transaction' : 'List Member'}
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
                {selectedMenu === 'transaction' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
                    <select
                      value={transactionStatusFilter}
                      onChange={(e) => {
                        setTransactionStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="processed">Processed</option>
                      <option value="waiting_for_payment">Waiting for Payment</option>
                      <option value="expired">Expired</option>
                      <option value="canceled">Canceled</option>
                    </select>
                    <span className="text-sm font-medium text-gray-700">Filter by Coaching:</span>
                    <select
                      value={coachingFlagFilter}
                      onChange={(e) => {
                        setCoachingFlagFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="all">All Packages</option>
                      <option value="true">With Coaching</option>
                      <option value="false">Without Coaching</option>
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
              {selectedMenu === 'transaction' && (
                <button 
                  onClick={exportTransactionsToPDF}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF
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
                ) : selectedMenu === 'transaction' ? (
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
                                : item.package_status === 'processed'
                                ? 'bg-yellow-100 text-yellow-800'
                                : item.package_status === 'waiting_for_payment'
                                ? 'bg-blue-100 text-blue-800'
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
                      ) : selectedMenu === 'transaction' ? (
                        <>
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
                              {item.member.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              {item.package.package_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.transaction_status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : item.transaction_status === 'processed'
                                ? 'bg-yellow-100 text-yellow-800'
                                : item.transaction_status === 'waiting_for_payment'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
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
              {selectedTransaction.coach && (
                <div>
                  <p className="text-sm text-gray-700 font-bold">Assigned Coach</p>
                  <p className="text-gray-900">{selectedTransaction.coach?.name}</p>
                </div>
              )}
            </div>
            
            {/* Transfer Receipt Image - Full Width */}
            {selectedTransaction.transfer_receipt_image && (
              <div className="mb-4">
                <p className="text-sm text-gray-700 font-bold mb-2">Transfer Receipt</p>
                <img 
                  src={`http://localhost:3000${selectedTransaction.transfer_receipt_image}`} 
                  alt="Transfer Receipt" 
                  className="max-w-full h-auto rounded-md border border-gray-200 max-h-64 object-contain" 
                />
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              {selectedTransaction.transaction_status === 'processed' && (
                <>
                  <button
                    onClick={() => handleReviseTransaction(selectedTransaction.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Revise
                  </button>
                  <button
                    onClick={() => handleApproveTransaction(selectedTransaction.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                </>
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

export default AdminDashboard;