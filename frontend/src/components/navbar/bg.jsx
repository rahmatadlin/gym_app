import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const Gallery = (props) => {
  const images = [
    {
      src: "/public/images/gym-1.jpg",
      alt: "Modern gym facility with various workout equipment"
    },
    {
      src: "https://plus.unsplash.com/premium_photo-1682435545493-db423e4ace01",
      alt: "Person doing squats with barbell"
    },
    {
      src: "https://images.unsplash.com/photo-1745851211804-409acbb4b597",
      alt: "Group fitness class in progress"
    },
    {
      src: "https://img.freepik.com/free-photo/man-working-out-gym_23-2148197777.jpg",
      alt: "Man intensely working out at the gym"
    },
    {
      src: "https://img.freepik.com/free-photo/people-doing-indoor-cycling_23-2149270239.jpg",
      alt: "Group of people doing indoor cycling class"
    }
  ];

  const thumbnailImages = [
    {
      src: "/public/images/gym-2.jpg",
      alt: "Person lifting dumbbells during workout"
    },
    {
      src: "https://img.freepik.com/free-photo/young-muscular-woman-practicing-gym_155003-35525.jpg",
      alt: "Young muscular woman practicing at the gym"
    },
    {
      src: "https://img.freepik.com/free-photo/close-up-hand-holding-kettlebell_23-2149307701.jpg",
      alt: "Close-up of hand holding a kettlebell"
    },
    {
      src: "https://plus.unsplash.com/premium_photo-1663134075608-9f24cd28b260?q=80&w=1459&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      alt: "Woman exercising with dumbbells"
    },
    {
      src: "https://img.freepik.com/free-photo/young-fit-man-stretching-gym_7502-9068.jpg",
      alt: "Young man stretching at the gym"
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section id={props.id} className="w-full mx-auto px-0 pt-0">
      {/* Featured Image Carousel */}
      <div className="relative w-full h-[500px] md:h-[700px] overflow-hidden">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <img
              className="w-full h-full object-cover"
              src={image.src}
              alt={image.alt}
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
        
        {/* Dots indicator */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? 'bg-white w-6' : 'bg-white/50'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
      {/* Thumbnail Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
          {/* Kiri: Judul */}
          <div className="md:w-1/3 w-full flex justify-center md:justify-start mb-4 md:mb-0">
            <h3
              className="text-5xl font-bold text-gray-800 dark:text-black md:text-left text-center italic drop-shadow-lg"
              style={{ fontFamily: "'Dancing Script', cursive" }}
            >
              Our Training Facilities
            </h3>
          </div>

          {/* Kanan: Grid Gambar */}
          <div className="md:w-2/3 w-full">
            {/* First Row - 3 images */}
            <div className="flex justify-center mb-4">
              <div className="grid grid-cols-3 gap-4 w-full max-w-auto">
                {thumbnailImages.slice(0, 3).map((image, index) => (
                  <div 
                    key={index}
                    className="rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 group"
                  >
                    <img
                      className="w-full h-40 md:h-48 object-cover group-hover:brightness-110 transition-all duration-300"
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Second Row - 2 centered images */}
            <div className="flex justify-center">
              <div className="grid grid-cols-2 gap-4 w-full max-w-auto">
                {thumbnailImages.slice(3, 5).map((image, index) => (
                  <div 
                    key={index + 3}
                    className="rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 group"
                  >
                    <img
                      className="w-full h-40 md:h-48 object-cover group-hover:brightness-110 transition-all duration-300"
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

Gallery.propTypes = {
  id: PropTypes.string,
};

export default Gallery;