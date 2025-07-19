import { useState } from 'react';
import ProductsPage from '../pages/products';

const memberProfile = {
  name: 'Member Budi',
  username: 'budi123',
  image: 'https://randomuser.me/api/portraits/men/32.jpg',
  email: 'budi@example.com',
  phone: '08123456789',
  address: 'Jl. Merdeka No. 123',
  birthDate: '1990-05-15',
  gender: 'male',
  joinDate: '2022-01-10',
};

const menuItems = [
  { key: 'package', label: 'Package', icon: '📦' },
  { key: 'transaction', label: 'Transaction', icon: '💳' },
  { key: 'profile', label: 'Profile', icon: '👤' },
];

function MemberDashboard() {
  const [selectedMenu, setSelectedMenu] = useState('package');
  const [editProfile, setEditProfile] = useState({ ...memberProfile });
  const [imagePreview, setImagePreview] = useState(memberProfile.image);

  const handleMenuClick = (key) => {
    setSelectedMenu(key);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setEditProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setEditProfile(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    alert('Profile updated! (dummy action)');
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
            <img
              src={memberProfile.image}
              alt={memberProfile.name}
              className="h-12 w-12 rounded-full object-cover border-2 border-blue-400"
              width={48}
              height={48}
            />
            <div>
              <div className="text-lg font-semibold">{memberProfile.name}</div>
              <div className="text-xs text-blue-200">@{memberProfile.username}</div>
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
          onClick={() => alert('Logout berhasil!')}
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
              <ProductsPage id="member-packages" />
            </div>
          )}

          {/* Transaction Menu */}
          {selectedMenu === 'transaction' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Transaction History</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-xl">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">#</th>
                      <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Package</th>
                      <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Amount</th>
                      <th className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Dummy data, replace with real data as needed */}
                    <tr>
                      <td className="px-6 py-4 border-b">1</td>
                      <td className="px-6 py-4 border-b">2024-06-01</td>
                      <td className="px-6 py-4 border-b">Gold Package</td>
                      <td className="px-6 py-4 border-b">Rp 500.000</td>
                      <td className="px-6 py-4 border-b text-green-600 font-semibold">Paid</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 border-b">2</td>
                      <td className="px-6 py-4 border-b">2024-05-01</td>
                      <td className="px-6 py-4 border-b">Silver Package</td>
                      <td className="px-6 py-4 border-b">Rp 300.000</td>
                      <td className="px-6 py-4 border-b text-green-600 font-semibold">Paid</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 border-b">3</td>
                      <td className="px-6 py-4 border-b">2024-04-01</td>
                      <td className="px-6 py-4 border-b">Bronze Package</td>
                      <td className="px-6 py-4 border-b">Rp 150.000</td>
                      <td className="px-6 py-4 border-b text-red-600 font-semibold">Unpaid</td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
                          src={imagePreview}
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
                        <p className="text-gray-800">{editProfile.joinDate}</p>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={editProfile.email}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                          type="text"
                          name="phone"
                          value={editProfile.phone}
                          onChange={handleProfileChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          name="birthDate"
                          value={editProfile.birthDate}
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
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
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
    </div>
  );
}

export default MemberDashboard;