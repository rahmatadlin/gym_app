import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const ProductsPage = (props) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/packages');
      if (!response.ok) {
        throw new Error('Failed to fetch packages');
      }
      const data = await response.json();
      // Filter only active packages
      const activePackages = data.filter(pkg => pkg.package_status === 'active');
      setPackages(activePackages);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching packages:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id={props.id} className="flex justify-center items-center px-8 py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading packages...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id={props.id} className="flex justify-center items-center px-8 py-16">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">Failed to load packages</p>
          <button 
            onClick={fetchPackages}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  if (packages.length === 0) {
    return (
      <section id={props.id} className="flex justify-center items-center px-8 py-16">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-600">No packages available at the moment</p>
        </div>
      </section>
    );
  }

  return (
    <section id={props.id} className="flex flex-col justify-center items-center gap-12 px-8 py-16">
      {/* Title */}
      <div className="text-center mb-8">
        <h3
          className="text-5xl font-bold text-gray-800 dark:text-black md:text-left text-center italic drop-shadow-lg"
          style={{ fontFamily: "'Dancing Script', cursive" }}
        >
          Our Packages
        </h3>
      </div>
      
      {/* Packages Grid */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-12">
        {packages.map((pkg) => (
          <div key={pkg.id} className="w-full sm:w-[28rem] bg-white border border-gray-200 rounded-2xl shadow-xl dark:bg-gray-800 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <a href="#" className="group block">
              <img 
                className="rounded-t-2xl w-full h-72 object-cover group-hover:opacity-90 transition-opacity duration-300"
                src={pkg.package_image ? `http://localhost:3000${pkg.package_image}` : "https://img.freepik.com/free-photo/full-shot-woman-helping-man-gym_23-2149734734.jpg"}
                alt={pkg.package_name}
                onError={(e) => {
                  e.target.src = "https://img.freepik.com/free-photo/full-shot-woman-helping-man-gym_23-2149734734.jpg";
                }}
              />
            </a>
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <a href="#">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {pkg.package_name}
                  </h3>
                </a>
                {pkg.is_coaching_flag ? (
                  <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full dark:bg-blue-200 dark:text-blue-800">
                    COACHING
                  </span>
                ) : (
                  <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full dark:bg-green-200 dark:text-green-800">
                    BASIC
                  </span>
                )}
              </div>
              <p className="mb-6 text-lg text-gray-600 dark:text-gray-300">
                {pkg.description || 'No description available'}
              </p>
              <div className="flex justify-between items-center">
                <div className="flex flex-col items-start">
                  <span className="text-base text-gray-400 line-through mb-1">
                    {formatCurrency(pkg.price * 1.2)}
                  </span>
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(pkg.price)}
                    <span className="text-base font-normal text-gray-500 dark:text-gray-400">/{pkg.duration} days</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

ProductsPage.propTypes = {
  id: PropTypes.string,
};

export default ProductsPage;