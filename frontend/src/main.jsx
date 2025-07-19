import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ErrorPage from './pages/404.jsx'
import ProductsPage from './pages/products.jsx';
import HomePage from './pages/homepages.jsx'
import AdminDashboard from './admin/AdminDashboard.jsx';
import CoachDashboard from './coach/CoachDashboard.jsx';
import MemberDashboard from './member/MemberDashboard.jsx';
import LoginPage from './pages/loginPage.jsx'
import RegisterPage from './pages/registerPage.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage /> ,
    errorElement: <ErrorPage />
  },
  {
    path: "/products",
    element: <ProductsPage />
  },
  {
    path: "/admin",
    element: <AdminDashboard />
  },
  {
    path: "/coach",
    element: <CoachDashboard />
  },
  {
    path: "/member",
    element: <MemberDashboard />
  },
  {
    path: "/login",
    element:<LoginPage />
  },
  {
    path: "/register",
    element: <RegisterPage />
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

