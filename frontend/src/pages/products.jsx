import PropTypes from 'prop-types';

const ProductsPage = (props) => {
  return (
    <section id={props.id} className="flex flex-col md:flex-row justify-center items-center gap-12 px-8 py-16">
      {/* Product 1 - Left */}
      <div className="w-full sm:w-[28rem] bg-white border border-gray-200 rounded-2xl shadow-xl dark:bg-gray-800 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
        <a href="#" className="group block">
          <img 
            className="rounded-t-2xl w-full h-72 object-cover group-hover:opacity-90 transition-opacity duration-300"
            src="https://img.freepik.com/free-photo/full-shot-woman-helping-man-gym_23-2149734734.jpg"
            alt="Personal trainer session" 
          />
        </a>
        <div className="p-8">
          <div className="flex justify-between items-start mb-4">
            <a href="#">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                Personal Trainer
              </h3>
            </a>
            <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full dark:bg-blue-200 dark:text-blue-800">
              POPULAR
            </span>
          </div>
          <p className="mb-6 text-lg text-gray-600 dark:text-gray-300">
            Get exclusive 1-on-1 training with our certified trainers for maximum results and achieve your fitness goals faster.
          </p>
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-start">
              <span className="text-base text-gray-400 line-through mb-1">Rp1.599.000</span>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                Rp1.299.000
                <span className="text-base font-normal text-gray-500 dark:text-gray-400">/bulan</span>
              </span>
            </div>
            <a
              href="#"
              className="inline-flex items-center px-4 py-2.5 text-base font-medium text-center text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300 shadow-lg"
            >
              Join Now
              <svg
                className="w-4 h-4 ml-2"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 5h12m0 0L9 1m4 4L9 9"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Product 2 - Right */}
      <div className="w-full sm:w-[28rem] bg-white border border-gray-200 rounded-2xl shadow-xl dark:bg-gray-800 dark:border-gray-700 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
        <a href="#" className="group block">
          <img 
            className="rounded-t-2xl w-full h-72 object-cover group-hover:opacity-90 transition-opacity duration-300"
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
            alt="Group fitness class" 
          />
        </a>
        <div className="p-8">
          <div className="flex justify-between items-start mb-4">
            <a href="#">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                Group Fitness Class
              </h3>
            </a>
            <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full dark:bg-green-200 dark:text-green-800">
              NEW
            </span>
          </div>
          <p className="mb-6 text-lg text-gray-600 dark:text-gray-300">
            Energetic group workouts with experienced instructors and a supportive community to keep you motivated.
          </p>
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-start">
              <span className="text-base text-gray-400 line-through mb-1">Rp999.000</span>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                Rp799.000
                <span className="text-base font-normal text-gray-500 dark:text-gray-400">/bulan</span>
              </span>
            </div>
            <a
              href="#"
              className="inline-flex items-center px-4 py-2.5 text-base font-medium text-center text-white bg-gradient-to-r from-green-500 to-green-600 rounded-xl hover:from-green-600 hover:to-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 transition-all duration-300 shadow-lg"
            >
              Join Now
              <svg
                className="w-4 h-4 ml-2"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 5h12m0 0L9 1m4 4L9 9"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

ProductsPage.propTypes = {
  id: PropTypes.string,
};

export default ProductsPage;