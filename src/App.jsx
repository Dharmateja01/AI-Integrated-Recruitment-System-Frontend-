import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast'; // Import the Toaster component
import Login from './pages/Login';
import Applicant from './pages/Applicant';
import Recruiter from './pages/Recruiter';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      {/* The Toaster is placed here so it can show alerts over any page */}
      <Toaster 
        position="top-right"
        toastOptions={{
          // Professional dark theme styling for all toasts
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/applicant" element={
            <ProtectedRoute role="applicant"><Applicant /></ProtectedRoute>
          } />
          <Route path="/recruiter" element={
            <ProtectedRoute role="recruiter"><Recruiter /></ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import Login from './pages/Login';
// import Applicant from './pages/Applicant';
// import Recruiter from './pages/Recruiter';

// const ProtectedRoute = ({ children, role }) => {
//   const { user } = useAuth();
//   if (!user) return <Navigate to="/" />;
//   if (role && user.role !== role) return <Navigate to="/" />;
//   return children;
// };

// function App() {
//   return (
//     <AuthProvider>
//       <Router>
//         <Routes>
//           <Route path="/" element={<Login />} />
//           <Route path="/applicant" element={
//             <ProtectedRoute role="applicant"><Applicant /></ProtectedRoute>
//           } />
//           <Route path="/recruiter" element={
//             <ProtectedRoute role="recruiter"><Recruiter /></ProtectedRoute>
//           } />
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;


// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import Login from './pages/Login';
// import Applicant from './pages/Applicant';
// import Recruiter from './pages/Recruiter';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Login />} />
//         <Route path="/applicant" element={<Applicant />} />
//         <Route path="/recruiter" element={<Recruiter />} />
//         <Route path="*" element={<Navigate to="/" />} />
//       </Routes>
//     </Router>
//   );
// }
// export default App;

// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import Login from './pages/Login';
// import Applicant from './pages/Applicant';
// import MasterView from './pages/MasterView'; // Ensure this file exists in src/pages/

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Login />} />
//         <Route path="/applicant" element={<Applicant />} />
//         {/* Redirecting the recruiter route to our new MasterView page */}
//         <Route path="/recruiter" element={<MasterView />} /> 
//         <Route path="*" element={<Navigate to="/" />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import Login from './pages/Login';
// import Applicant from './pages/Applicant';
// import Recruiter from './pages/Recruiter';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Login />} />
//         <Route path="/applicant" element={<Applicant />} />
//         <Route path="/recruiter" element={<Recruiter />} />
//         <Route path="*" element={<Navigate to="/" />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;