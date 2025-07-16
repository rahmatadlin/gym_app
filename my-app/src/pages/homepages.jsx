import Footers from '../components/navbar/footer';
import Header from '../components/navbar/header';
import ProductsPage from './products';
import CustomControlsGallery from '../components/navbar/bg'

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className=''>

        <Header />
        <CustomControlsGallery />
       

        {/* Main Content */}
        <main className="flex-grow  dark:bg-gray-800">
          {/* Hero Section */}
          <div
            className="bg-cover bg-center bg-no-repeat h-96 flex items-center justify-center text-center"
          >
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-yellow-500 mb-4">
                Welcome to Montana Fitness
              </h1>
              <p className="text-lg text-black">
                Transform your fitness journey with us.
              </p>
            </div>
          </div>

          <div>
            <ProductsPage />

          </div>

          <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {/* Items Grid */}

            </div>
          </div>
        </main>

        <Footers />
      </div>

    </div>
  );
};

export default HomePage;
