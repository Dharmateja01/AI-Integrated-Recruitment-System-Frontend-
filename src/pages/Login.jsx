import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, LogIn, Mail, Lock, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast'; // Professional notifications


const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'applicant'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const endpoint = isRegister ? 'register' : 'login';
    const toastId = toast.loading(isRegister ? "Creating account..." : "Signing in...");

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/${endpoint}`, formData);
      
      if (isRegister) {
        toast.success("Account created! Please sign in.", { id: toastId });
        setIsRegister(false);
      } else {
        // 1. Save user info to Context and LocalStorage
        login(response.data); 

        toast.success(`Welcome back, ${response.data.full_name || 'User'}!`, { id: toastId });

        // 2. REDIRECT BASED ON ROLE
        if (response.data.role === 'recruiter') {
          navigate('/recruiter');
        } else {
          navigate('/applicant');
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Something went wrong";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">
            {isRegister ? 'Join Us' : 'Welcome Back'}
          </h2>
          <p className="text-slate-400 mt-2 text-sm">
            {isRegister ? 'Create your recruiter or applicant account' : 'Sign in to access your dashboard'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Full Name"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-blue-500 transition-all"
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-blue-500 transition-all"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-blue-500 transition-all"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          {isRegister && (
            <div className="flex gap-4 p-1 bg-slate-900 rounded-lg border border-slate-700">
              <button
                type="button"
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${formData.role === 'applicant' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                onClick={() => setFormData({ ...formData, role: 'applicant' })}
              >
                Applicant
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${formData.role === 'recruiter' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                onClick={() => setFormData({ ...formData, role: 'recruiter' })}
              >
                Recruiter
              </button>
            </div>
          )}

          <button 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl mt-4 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18}/> : (isRegister ? <UserPlus size={18}/> : <LogIn size={18}/>)}
            {isLoading ? 'Please Wait...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <button
          onClick={() => {
            setIsRegister(!isRegister);
            toast.dismiss(); // Clean up toasts when switching modes
          }}
          className="w-full text-slate-400 mt-6 text-sm hover:text-blue-400 transition-colors"
        >
          {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register Now"}
        </button>
      </div>
    </div>
  );
};

export default Login;






// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { UserPlus, LogIn, Mail, Lock, User, Loader2 } from 'lucide-react';
// import toast from 'react-hot-toast'; // Professional notifications


// const Login = () => {
//   const [isRegister, setIsRegister] = useState(false);
//   const [isLoading, setIsLoading] = useState(false); // Added loading state
//   const { login } = useAuth();
//   const navigate = useNavigate();
  
//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//     full_name: '',
//     role: 'applicant'
//   });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     const endpoint = isRegister ? 'register' : 'login';
//     const toastId = toast.loading(isRegister ? "Creating account..." : "Signing in...");

//     try {
//       const response = await axios.post(`${process.env.REACT_APP_API_URL}/${endpoint}`, formData);
      
//       if (isRegister) {
//         toast.success("Account created! Please sign in.", { id: toastId });
//         setIsRegister(false);
//       } else {
//         // 1. Save user info to Context and LocalStorage
//         login(response.data); 

//         toast.success(`Welcome back, ${response.data.full_name || 'User'}!`, { id: toastId });

//         // 2. REDIRECT BASED ON ROLE
//         if (response.data.role === 'recruiter') {
//           navigate('/recruiter');
//         } else {
//           navigate('/applicant');
//         }
//       }
//     } catch (err) {
//       const errorMsg = err.response?.data?.detail || "Something went wrong";
//       toast.error(errorMsg, { id: toastId });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
//       <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
//         <div className="text-center mb-8">
//           <h2 className="text-3xl font-bold text-white">
//             {isRegister ? 'Join Us' : 'Welcome Back'}
//           </h2>
//           <p className="text-slate-400 mt-2 text-sm">
//             {isRegister ? 'Create your recruiter or applicant account' : 'Sign in to access your dashboard'}
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           {isRegister && (
//             <div className="relative">
//               <User className="absolute left-3 top-3 text-slate-500" size={18} />
//               <input
//                 type="text"
//                 placeholder="Full Name"
//                 className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-blue-500 transition-all"
//                 onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
//                 required
//               />
//             </div>
//           )}

//           <div className="relative">
//             <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
//             <input
//               type="email"
//               placeholder="Email Address"
//               className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-blue-500 transition-all"
//               onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//               required
//             />
//           </div>

//           <div className="relative">
//             <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
//             <input
//               type="password"
//               placeholder="Password"
//               className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:outline-none focus:border-blue-500 transition-all"
//               onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//               required
//             />
//           </div>

//           {isRegister && (
//             <div className="flex gap-4 p-1 bg-slate-900 rounded-lg border border-slate-700">
//               <button
//                 type="button"
//                 className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${formData.role === 'applicant' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
//                 onClick={() => setFormData({ ...formData, role: 'applicant' })}
//               >
//                 Applicant
//               </button>
//               <button
//                 type="button"
//                 className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${formData.role === 'recruiter' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
//                 onClick={() => setFormData({ ...formData, role: 'recruiter' })}
//               >
//                 Recruiter
//               </button>
//             </div>
//           )}

//           <button 
//             disabled={isLoading}
//             className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl mt-4 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
//           >
//             {isLoading ? <Loader2 className="animate-spin" size={18}/> : (isRegister ? <UserPlus size={18}/> : <LogIn size={18}/>)}
//             {isLoading ? 'Please Wait...' : (isRegister ? 'Create Account' : 'Sign In')}
//           </button>
//         </form>

//         <button
//           onClick={() => {
//             setIsRegister(!isRegister);
//             toast.dismiss(); // Clean up toasts when switching modes
//           }}
//           className="w-full text-slate-400 mt-6 text-sm hover:text-blue-400 transition-colors"
//         >
//           {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register Now"}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Login;