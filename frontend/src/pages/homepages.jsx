import Footers from '../components/navbar/footer';
import Header from '../components/navbar/header';
import ProductsPage from './products';
import CustomControlsGallery from '../components/navbar/bg'

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className=''>

        <Header />
        {/* Main Content */}
        <CustomControlsGallery id="about" />
        <main className="flex-grow">
          {/* Hero Section */}
            <ProductsPage id="classes" />
        </main>
        <Footers id="contact" />
      </div>

    </div>
  );
};

export default HomePage;
