const ProductsPage = () => {
  return (
    // <div className="flex justify-center">
    //     <div className="w-full max-w-sm bg-gray-500 border border-gray-600 rounded-lg shadow">
    //         <a href="#">
    //             <img src="/public/images/gym-1.jpg"
    //                 alt="product"
    //                 className="p-8 rounded-t-lg"
    //             />
    //         </a>
    //         <div className="px-5 pb-5">
    //             <a href="">
    //                 <h5 className="text-xl fout-semibold tracking-tight text-white">
    //                     Membership
    //                 </h5>
    //                 <p className="text-m text-white">
    //                     Lorem ipsum dolor sit amet, consectetur adipisicing elit.
    //                     Atque commodi exercitationem animi eos libero perferendis.
    //                 </p>
    //             </a>
    //         </div>
    //         <div className="flex items-center justify-center">
    //             <span className="text-3xl font-bold text-white">
    //                 Rp 180.000/Month
    //             </span>
    //         </div>
    //     </div>
    // </div>


    <div className="flex justify-center">
      <div className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <a href="#">
          <img className="rounded-t-lg w-full h-auto"
            src="https://img.freepik.com/free-photo/full-shot-woman-helping-man-gym_23-2149734734.jpg?t=st=1736961415~exp=1736965015~hmac=26bbc0279f207a5613b0b58dd623cb6ee8d05c2661e07ec0e371fd97f7f0f71b&w=996"
            alt="Paket 1" />
        </a>
        <div className="p-5">
          <a href="#">
            <h5 className="mb-2 text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Personal trainer
            </h5>
          </a>
          <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
          Join our Personal Trainer Gym now!
          </p>
          <a
            href="#"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Join now
            <svg
              className="rtl:rotate-180 w-3.5 h-3.5 ms-2"
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

  )
}


export default ProductsPage;