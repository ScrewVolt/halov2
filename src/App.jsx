import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/login"
import Patients from "./pages/patients"
import ProtectedRoute from "./components/protectedRoute"
import Layout from "./components/Layout"
import { AuthProvider } from "./authContext"

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 🔓 Public Route */}
          <Route path="/login" element={<Login />} />

          {/* 🔒 Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* 🏠 Redirect default `/` to `/patients` */}
            <Route index element={<Navigate to="/patients" replace />} />
            <Route path="patients" element={<Patients />} />
          </Route>

          {/* 🚨 Catch-all: redirect unknown routes to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
