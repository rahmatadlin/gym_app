import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from './pages/login.jsx'
import RegisterPage from './pages/register.jsx'
import ErrorPage from './pages/404.jsx'
import ProductsPage from './pages/products.jsx';
import HomePage from './pages/homepages.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    // element: <div>Wellcome</div>,
    element: <HomePage /> ,
    errorElement: <ErrorPage />
  },
  {
    // path: "/homepage",
    // element: <HomePage />
  },
  {
    path: "/login",
    element:<LoginPage />
  },
  {
    path: "/register",
    element: <RegisterPage />
  },
  {
    path: "/products",
    element: <ProductsPage />
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

