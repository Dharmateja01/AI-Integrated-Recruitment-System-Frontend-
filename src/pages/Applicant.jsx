import React, { useRef, useState, useEffect } from 'react'; 
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, Clock, LogOut, X, Loader2, CheckCircle2, 
  TrendingUp, AlertCircle, Briefcase, Info, ExternalLink 
} from 'lucide-react'; 
import toast from 'react-hot-toast';

// --- PIZZA TRACKER COMPONENT ---
const StatusTracker = ({ currentStatus }) => {
  const stages = ["Pending", "Shortlisted", "Final Decision"];
  const normalizedStatus = currentStatus === "Rejected" ? "Final Decision" : currentStatus;
  const currentIndex = stages.indexOf(normalizedStatus);

  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto py-10 px-4">
      {stages.map((stage, index) => (
        <React.Fragment key={stage}>
          <div className="flex flex-col items-center relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 
              ${index <= currentIndex ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
              {index < currentIndex ? <CheckCircle2 size={20} /> : index + 1}
            </div>
            <span className={`text-[10px] mt-3 font-bold uppercase tracking-wider ${index <= currentIndex ? 'text-blue-400' : 'text-slate-500'}`}>
              {stage === "Final Decision" && currentStatus === "Rejected" ? "Rejected" : stage}
            </span>
          </div>
          {index < stages.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-6 ${index < currentIndex ? 'bg-blue-600' : 'bg-slate-700'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const Applicant = () => {
  const { user, logout } = useAuth();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [history, setHistory] = useState(null);
  const [applyingFor, setApplyingFor] = useState(null);
  const [viewingJD, setViewingJD] = useState(null); 
  const [agreed, setAgreed] = useState({ terms: false, privacy: false });
  const [jobListings, setJobListings] = useState([]); // Dynamic state

  // --- NEW: FETCH DYNAMIC JOBS FROM DATABASE ---
  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/jobs`);
      // Map database string "Python, React" back to array for your UI tags
      const formattedJobs = res.data.map(job => ({
        ...job,
        role: job.role_name, // Map for your applyingFor.role logic
        skills: job.keywords ? job.keywords.split(',').map(s => s.trim()) : [],
        details: job.jd_link // Reference for the drive link
      }));
      setJobListings(formattedJobs);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/my-application/${user.email}`);
      setHistory(res.data);
    } catch (err) {
      console.error("History fetch failed:", err);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchHistory();
      fetchJobs(); // Fetch live jobs on load
    }
  }, [user.email]);

  const handleConfirmSubmit = async () => {
    if (!selectedFile || !applyingFor) return;
    const toastId = toast.loading("Processing Application...");
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('email', user?.email);
    formData.append('name', user?.name);
    formData.append('role', applyingFor.role);

    try {
      // NOTE: process.env.REACT_APP_N8N_URL should be added to your .env
      await axios.post(import.meta.env.VITE_N8N_URL, formData);
      toast.success("Application Sent!", { id: toastId });
      setSelectedFile(null);
      setApplyingFor(null);
      setAgreed({ terms: false, privacy: false });
      setTimeout(() => fetchHistory(), 2000);
    } catch (err) {
      toast.error("Upload failed", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans relative">
      
      {/* --- PROFESSIONAL JD MODAL --- */}
      {viewingJD && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
            <button onClick={() => setViewingJD(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
              <X size={24}/>
            </button>

            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-3 text-white tracking-tight">{viewingJD.role}</h2>
              <div className="flex flex-wrap gap-2">
                 {viewingJD.skills.map(s => (
                   <span key={s} className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                     {s}
                   </span>
                 ))}
              </div>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed mb-8">Role Requirements: {viewingJD.keywords}</p>

            {/* PDF ATTACHMENT SECTION (Google Drive Link) */}
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-red-500/20 p-2 rounded-lg">
                  <FileText size={20} className="text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200 uppercase tracking-tighter">Official_JD_{viewingJD.role.replace(/\s+/g, '_')}.pdf</p>
                  <p className="text-[10px] text-slate-500">Secure Cloud Document</p>
                </div>
              </div>
              <a href={viewingJD.jd_link} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-xs font-black uppercase tracking-widest flex items-center gap-1">
                Download <ExternalLink size={14} />
              </a>
            </div>

            {/* LEGAL COMPULSORY CHECKBOXES */}
            <div className="space-y-4 mb-10">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={agreed.terms} onChange={() => setAgreed({...agreed, terms: !agreed.terms})} className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500" />
                <span className="text-[11px] text-slate-400 leading-tight group-hover:text-slate-300 transition-colors">
                  I confirm that all information provided in my resume and application is accurate and truthful.
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={agreed.privacy} onChange={() => setAgreed({...agreed, privacy: !agreed.privacy})} className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500" />
                <span className="text-[11px] text-slate-400 leading-tight group-hover:text-slate-300 transition-colors">
                  I consent to the AI-driven processing of my data for recruitment purposes as per the company's privacy policy.
                </span>
              </label>
            </div>

            <button 
              disabled={!agreed.terms || !agreed.privacy}
              onClick={() => { setApplyingFor(viewingJD); setViewingJD(null); }} 
              className="w-full bg-blue-600 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            >
              Apply for this Position
            </button>
          </div>
        </div>
      )}

      <header className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-2xl font-bold text-blue-400 tracking-tight">Applicant Portal</h1>
           <p className="text-slate-500 text-xs">Manage your applications and AI insights</p>
        </div>
        <button onClick={logout} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 hover:bg-red-900/10 transition-all">
          <LogOut size={18}/> Logout
        </button>
      </header>

      <div className="bg-slate-800/50 border border-slate-700 rounded-3xl mb-8 p-4 shadow-2xl backdrop-blur-sm">
        <h3 className="text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-4">Live Status Tracker</h3>
        <StatusTracker currentStatus={history?.status || "Pending"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {applyingFor ? (
            <div className="bg-blue-600/10 border border-blue-500/30 p-6 rounded-3xl shadow-xl animate-in slide-in-from-left-4 duration-500">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold leading-tight">Applying for:<br/><span className="text-blue-400">{applyingFor.role}</span></h2>
                <button onClick={() => setApplyingFor(null)}><X size={20} className="text-slate-500" /></button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={(e) => setSelectedFile(e.target.files[0])} />
              {selectedFile ? (
                <div className="space-y-4">
                   <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-700">
                      <span className="text-xs truncate max-w-[120px]">{selectedFile.name}</span>
                      <button onClick={() => setSelectedFile(null)}><X size={16} className="text-red-400" /></button>
                   </div>
                   <button onClick={handleConfirmSubmit} disabled={isUploading} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-sm hover:bg-blue-500 flex items-center justify-center gap-2">
                     {isUploading ? <Loader2 className="animate-spin" size={18} /> : "Submit to AI Engine"}
                   </button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current.click()} className="w-full bg-slate-100 text-slate-900 py-4 rounded-2xl font-black text-sm hover:bg-white transition-all">
                  Upload Resume (PDF)
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 h-fit">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Open Opportunities</h3>
              <div className="space-y-4">
                {jobListings.length > 0 ? jobListings.map((job) => (
                  <div key={job.id} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-700/50 hover:border-blue-500/40 transition-all">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-sm">{job.role}</h4>
                      <button onClick={() => setViewingJD(job)} className="text-slate-500 hover:text-blue-400 transition-colors">
                        <Info size={18} />
                      </button>
                    </div>
                    <button onClick={() => setApplyingFor(job)} className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1">
                      Apply Now <ExternalLink size={12} />
                    </button>
                  </div>
                )) : (
                  <p className="text-xs text-slate-500 italic">Fetching available roles...</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-8">
          {history && history.status !== "Pending" && (
            <div className={`p-8 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-700 ${
              history.status === 'Shortlisted' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
            }`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">AI Match Score</p>
                  <h3 className="text-3xl font-bold">{history.fit_score}% Match</h3>
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  history.status === 'Shortlisted' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {history.status === 'Shortlisted' ? <TrendingUp size={28} /> : <AlertCircle size={28} />}
                </div>
              </div>

              {history.status === 'Shortlisted' ? (
                <div className="space-y-4">
                  <p className="text-emerald-400 font-bold flex items-center gap-2">🌟 Why the AI Shortlisted You:</p>
                  <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700 text-slate-300 text-sm leading-relaxed">
                    {history.positives || "Your resume demonstrates perfect alignment with our core requirements."}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-red-400 font-bold flex items-center gap-2">🚩 Key Gaps Identified:</p>
                  <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700 text-slate-300 text-sm leading-relaxed">
                    {history.negatives || "Our AI suggests focusing on more hands-on project experience in this specific role."}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl overflow-hidden">
            <h3 className="text-lg font-bold mb-8 flex items-center gap-2 text-slate-300">
              <Clock size={20} className="text-blue-500" /> Active Applications
            </h3>
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
                  <th className="pb-4">Applied On</th>
                  <th className="pb-4">Target Role</th>
                  <th className="pb-4 text-right">Live Status</th>
                </tr>
              </thead>
              <tbody>
                {history ? (
                  <tr className="border-b border-slate-700/40 hover:bg-slate-700/10 transition-colors">
                    <td className="py-6 text-sm text-slate-400">
                      {new Date(history.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-6 font-bold text-sm">{history.role || "AI Developer"}</td>
                    <td className="py-6 text-right">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                        history.status === 'Shortlisted' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 
                        history.status === 'Rejected' ? 'bg-red-400/10 text-red-400 border-red-400/20' : 
                        'bg-blue-400/10 text-blue-400 border-blue-400/20'
                      }`}>
                        {history.status}
                      </span>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan="3" className="py-20 text-center text-slate-500 text-sm">No applications found. Choose a role to get started.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Applicant;









// import React, { useRef, useState, useEffect } from 'react'; 
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import { 
//   FileText, Clock, LogOut, X, Loader2, CheckCircle2, 
//   TrendingUp, AlertCircle, Briefcase, Info, ExternalLink 
// } from 'lucide-react'; 
// import toast from 'react-hot-toast';

// // --- PIZZA TRACKER COMPONENT ---
// const StatusTracker = ({ currentStatus }) => {
//   const stages = ["Pending", "Shortlisted", "Final Decision"];
//   const normalizedStatus = currentStatus === "Rejected" ? "Final Decision" : currentStatus;
//   const currentIndex = stages.indexOf(normalizedStatus);

//   return (
//     <div className="flex items-center justify-between w-full max-w-2xl mx-auto py-10 px-4">
//       {stages.map((stage, index) => (
//         <React.Fragment key={stage}>
//           <div className="flex flex-col items-center relative z-10">
//             <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 
//               ${index <= currentIndex ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
//               {index < currentIndex ? <CheckCircle2 size={20} /> : index + 1}
//             </div>
//             <span className={`text-[10px] mt-3 font-bold uppercase tracking-wider ${index <= currentIndex ? 'text-blue-400' : 'text-slate-500'}`}>
//               {stage === "Final Decision" && currentStatus === "Rejected" ? "Rejected" : stage}
//             </span>
//           </div>
//           {index < stages.length - 1 && (
//             <div className={`flex-1 h-0.5 mx-2 mb-6 ${index < currentIndex ? 'bg-blue-600' : 'bg-slate-700'}`} />
//           )}
//         </React.Fragment>
//       ))}
//     </div>
//   );
// };

// const Applicant = () => {
//   const { user, logout } = useAuth();
//   const fileInputRef = useRef(null);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [history, setHistory] = useState(null);
//   const [applyingFor, setApplyingFor] = useState(null);
//   const [viewingJD, setViewingJD] = useState(null); 
//   const [agreed, setAgreed] = useState({ terms: false, privacy: false });
//   const [jobListings, setJobListings] = useState([]); // Dynamic state

//   // --- NEW: FETCH DYNAMIC JOBS FROM DATABASE ---
//   const fetchJobs = async () => {
//     try {
//       const res = await axios.get(`${process.env.REACT_APP_API_URL}/jobs`);
//       // Map database string "Python, React" back to array for your UI tags
//       const formattedJobs = res.data.map(job => ({
//         ...job,
//         role: job.role_name, // Map for your applyingFor.role logic
//         skills: job.keywords ? job.keywords.split(',').map(s => s.trim()) : [],
//         details: job.jd_link // Reference for the drive link
//       }));
//       setJobListings(formattedJobs);
//     } catch (err) {
//       console.error("Failed to fetch jobs:", err);
//     }
//   };

//   const fetchHistory = async () => {
//     try {
//       const res = await axios.get(`${process.env.REACT_APP_API_URL}/my-application/${user.email}`);
//       setHistory(res.data);
//     } catch (err) {
//       console.error("History fetch failed:", err);
//     }
//   };

//   useEffect(() => {
//     if (user?.email) {
//       fetchHistory();
//       fetchJobs(); // Fetch live jobs on load
//     }
//   }, [user.email]);

//   const handleConfirmSubmit = async () => {
//     if (!selectedFile || !applyingFor) return;
//     const toastId = toast.loading("Processing Application...");
//     setIsUploading(true);
    
//     const formData = new FormData();
//     formData.append('file', selectedFile);
//     formData.append('email', user?.email);
//     formData.append('name', user?.name);
//     formData.append('role', applyingFor.role);

//     try {
//       // NOTE: process.env.REACT_APP_N8N_URL should be added to your .env
//       await axios.post(process.env.REACT_APP_N8N_URL, formData);
//       toast.success("Application Sent!", { id: toastId });
//       setSelectedFile(null);
//       setApplyingFor(null);
//       setAgreed({ terms: false, privacy: false });
//       setTimeout(() => fetchHistory(), 2000);
//     } catch (err) {
//       toast.error("Upload failed", { id: toastId });
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans relative">
      
//       {/* --- PROFESSIONAL JD MODAL --- */}
//       {viewingJD && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
//           <div className="bg-slate-800 border border-slate-700 w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
//             <button onClick={() => setViewingJD(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
//               <X size={24}/>
//             </button>

//             <div className="mb-6">
//               <h2 className="text-3xl font-bold mb-3 text-white tracking-tight">{viewingJD.role}</h2>
//               <div className="flex flex-wrap gap-2">
//                  {viewingJD.skills.map(s => (
//                    <span key={s} className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
//                      {s}
//                    </span>
//                  ))}
//               </div>
//             </div>

//             <p className="text-slate-400 text-sm leading-relaxed mb-8">Role Requirements: {viewingJD.keywords}</p>

//             {/* PDF ATTACHMENT SECTION (Google Drive Link) */}
//             <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 mb-8 flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="bg-red-500/20 p-2 rounded-lg">
//                   <FileText size={20} className="text-red-400" />
//                 </div>
//                 <div>
//                   <p className="text-xs font-bold text-slate-200 uppercase tracking-tighter">Official_JD_{viewingJD.role.replace(/\s+/g, '_')}.pdf</p>
//                   <p className="text-[10px] text-slate-500">Secure Cloud Document</p>
//                 </div>
//               </div>
//               <a href={viewingJD.jd_link} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-xs font-black uppercase tracking-widest flex items-center gap-1">
//                 Download <ExternalLink size={14} />
//               </a>
//             </div>

//             {/* LEGAL COMPULSORY CHECKBOXES */}
//             <div className="space-y-4 mb-10">
//               <label className="flex items-start gap-3 cursor-pointer group">
//                 <input type="checkbox" checked={agreed.terms} onChange={() => setAgreed({...agreed, terms: !agreed.terms})} className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500" />
//                 <span className="text-[11px] text-slate-400 leading-tight group-hover:text-slate-300 transition-colors">
//                   I confirm that all information provided in my resume and application is accurate and truthful.
//                 </span>
//               </label>
//               <label className="flex items-start gap-3 cursor-pointer group">
//                 <input type="checkbox" checked={agreed.privacy} onChange={() => setAgreed({...agreed, privacy: !agreed.privacy})} className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500" />
//                 <span className="text-[11px] text-slate-400 leading-tight group-hover:text-slate-300 transition-colors">
//                   I consent to the AI-driven processing of my data for recruitment purposes as per the company's privacy policy.
//                 </span>
//               </label>
//             </div>

//             <button 
//               disabled={!agreed.terms || !agreed.privacy}
//               onClick={() => { setApplyingFor(viewingJD); setViewingJD(null); }} 
//               className="w-full bg-blue-600 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
//             >
//               Apply for this Position
//             </button>
//           </div>
//         </div>
//       )}

//       <header className="flex justify-between items-center mb-8">
//         <div>
//            <h1 className="text-2xl font-bold text-blue-400 tracking-tight">Applicant Portal</h1>
//            <p className="text-slate-500 text-xs">Manage your applications and AI insights</p>
//         </div>
//         <button onClick={logout} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 hover:bg-red-900/10 transition-all">
//           <LogOut size={18}/> Logout
//         </button>
//       </header>

//       <div className="bg-slate-800/50 border border-slate-700 rounded-3xl mb-8 p-4 shadow-2xl backdrop-blur-sm">
//         <h3 className="text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-4">Live Status Tracker</h3>
//         <StatusTracker currentStatus={history?.status || "Pending"} />
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         <div className="lg:col-span-1 space-y-6">
//           {applyingFor ? (
//             <div className="bg-blue-600/10 border border-blue-500/30 p-6 rounded-3xl shadow-xl animate-in slide-in-from-left-4 duration-500">
//               <div className="flex justify-between items-start mb-4">
//                 <h2 className="text-xl font-bold leading-tight">Applying for:<br/><span className="text-blue-400">{applyingFor.role}</span></h2>
//                 <button onClick={() => setApplyingFor(null)}><X size={20} className="text-slate-500" /></button>
//               </div>
//               <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={(e) => setSelectedFile(e.target.files[0])} />
//               {selectedFile ? (
//                 <div className="space-y-4">
//                    <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-700">
//                       <span className="text-xs truncate max-w-[120px]">{selectedFile.name}</span>
//                       <button onClick={() => setSelectedFile(null)}><X size={16} className="text-red-400" /></button>
//                    </div>
//                    <button onClick={handleConfirmSubmit} disabled={isUploading} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-sm hover:bg-blue-500 flex items-center justify-center gap-2">
//                      {isUploading ? <Loader2 className="animate-spin" size={18} /> : "Submit to AI Engine"}
//                    </button>
//                 </div>
//               ) : (
//                 <button onClick={() => fileInputRef.current.click()} className="w-full bg-slate-100 text-slate-900 py-4 rounded-2xl font-black text-sm hover:bg-white transition-all">
//                   Upload Resume (PDF)
//                 </button>
//               )}
//             </div>
//           ) : (
//             <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 h-fit">
//               <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Open Opportunities</h3>
//               <div className="space-y-4">
//                 {jobListings.length > 0 ? jobListings.map((job) => (
//                   <div key={job.id} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-700/50 hover:border-blue-500/40 transition-all">
//                     <div className="flex justify-between items-center mb-2">
//                       <h4 className="font-bold text-sm">{job.role}</h4>
//                       <button onClick={() => setViewingJD(job)} className="text-slate-500 hover:text-blue-400 transition-colors">
//                         <Info size={18} />
//                       </button>
//                     </div>
//                     <button onClick={() => setApplyingFor(job)} className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1">
//                       Apply Now <ExternalLink size={12} />
//                     </button>
//                   </div>
//                 )) : (
//                   <p className="text-xs text-slate-500 italic">Fetching available roles...</p>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="lg:col-span-2 space-y-8">
//           {history && history.status !== "Pending" && (
//             <div className={`p-8 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-700 ${
//               history.status === 'Shortlisted' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
//             }`}>
//               <div className="flex items-center justify-between mb-8">
//                 <div>
//                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">AI Match Score</p>
//                   <h3 className="text-3xl font-bold">{history.fit_score}% Match</h3>
//                 </div>
//                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
//                   history.status === 'Shortlisted' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
//                 }`}>
//                   {history.status === 'Shortlisted' ? <TrendingUp size={28} /> : <AlertCircle size={28} />}
//                 </div>
//               </div>

//               {history.status === 'Shortlisted' ? (
//                 <div className="space-y-4">
//                   <p className="text-emerald-400 font-bold flex items-center gap-2">🌟 Why the AI Shortlisted You:</p>
//                   <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700 text-slate-300 text-sm leading-relaxed">
//                     {history.positives || "Your resume demonstrates perfect alignment with our core requirements."}
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <p className="text-red-400 font-bold flex items-center gap-2">🚩 Key Gaps Identified:</p>
//                   <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700 text-slate-300 text-sm leading-relaxed">
//                     {history.negatives || "Our AI suggests focusing on more hands-on project experience in this specific role."}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl overflow-hidden">
//             <h3 className="text-lg font-bold mb-8 flex items-center gap-2 text-slate-300">
//               <Clock size={20} className="text-blue-500" /> Active Applications
//             </h3>
//             <table className="w-full text-left">
//               <thead>
//                 <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
//                   <th className="pb-4">Applied On</th>
//                   <th className="pb-4">Target Role</th>
//                   <th className="pb-4 text-right">Live Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {history ? (
//                   <tr className="border-b border-slate-700/40 hover:bg-slate-700/10 transition-colors">
//                     <td className="py-6 text-sm text-slate-400">
//                       {new Date(history.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
//                     </td>
//                     <td className="py-6 font-bold text-sm">{history.role || "AI Developer"}</td>
//                     <td className="py-6 text-right">
//                       <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
//                         history.status === 'Shortlisted' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 
//                         history.status === 'Rejected' ? 'bg-red-400/10 text-red-400 border-red-400/20' : 
//                         'bg-blue-400/10 text-blue-400 border-blue-400/20'
//                       }`}>
//                         {history.status}
//                       </span>
//                     </td>
//                   </tr>
//                 ) : (
//                   <tr>
//                     <td colSpan="3" className="py-20 text-center text-slate-500 text-sm">No applications found. Choose a role to get started.</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Applicant;








// import React, { useRef, useState, useEffect } from 'react'; 
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import { 
//   FileText, Clock, LogOut, X, Loader2, CheckCircle2, 
//   TrendingUp, AlertCircle, Briefcase, Info, ExternalLink 
// } from 'lucide-react'; 
// import toast from 'react-hot-toast';

// // --- PIZZA TRACKER COMPONENT ---
// const StatusTracker = ({ currentStatus }) => {
//   const stages = ["Pending", "Shortlisted", "Final Decision"];
//   const normalizedStatus = currentStatus === "Rejected" ? "Final Decision" : currentStatus;
//   const currentIndex = stages.indexOf(normalizedStatus);

//   return (
//     <div className="flex items-center justify-between w-full max-w-2xl mx-auto py-10 px-4">
//       {stages.map((stage, index) => (
//         <React.Fragment key={stage}>
//           <div className="flex flex-col items-center relative z-10">
//             <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 
//               ${index <= currentIndex ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
//               {index < currentIndex ? <CheckCircle2 size={20} /> : index + 1}
//             </div>
//             <span className={`text-[10px] mt-3 font-bold uppercase tracking-wider ${index <= currentIndex ? 'text-blue-400' : 'text-slate-500'}`}>
//               {stage === "Final Decision" && currentStatus === "Rejected" ? "Rejected" : stage}
//             </span>
//           </div>
//           {index < stages.length - 1 && (
//             <div className={`flex-1 h-0.5 mx-2 mb-6 ${index < currentIndex ? 'bg-blue-600' : 'bg-slate-700'}`} />
//           )}
//         </React.Fragment>
//       ))}
//     </div>
//   );
// };

// const Applicant = () => {
//   const { user, logout } = useAuth();
//   const fileInputRef = useRef(null);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [history, setHistory] = useState(null);
//   const [applyingFor, setApplyingFor] = useState(null);
//   const [viewingJD, setViewingJD] = useState(null); 
//   const [agreed, setAgreed] = useState({ terms: false, privacy: false });
//   const [jobListings, setJobListings] = useState([]); // Dynamic state

//   // --- NEW: FETCH DYNAMIC JOBS FROM DATABASE ---
//   const fetchJobs = async () => {
//     try {
//       const res = await axios.get("http://localhost:8000/jobs");
//       // Map database string "Python, React" back to array for your UI tags
//       const formattedJobs = res.data.map(job => ({
//         ...job,
//         role: job.role_name, // Map for your applyingFor.role logic
//         skills: job.keywords ? job.keywords.split(',').map(s => s.trim()) : [],
//         details: job.jd_link // Reference for the drive link
//       }));
//       setJobListings(formattedJobs);
//     } catch (err) {
//       console.error("Failed to fetch jobs:", err);
//     }
//   };

//   const fetchHistory = async () => {
//     try {
//       const res = await axios.get(`http://localhost:8000/my-application/${user.email}`);
//       setHistory(res.data);
//     } catch (err) {
//       console.error("History fetch failed:", err);
//     }
//   };

//   useEffect(() => {
//     if (user?.email) {
//       fetchHistory();
//       fetchJobs(); // Fetch live jobs on load
//     }
//   }, [user.email]);

//   const handleConfirmSubmit = async () => {
//     if (!selectedFile || !applyingFor) return;
//     const toastId = toast.loading("Processing Application...");
//     setIsUploading(true);
    
//     const formData = new FormData();
//     formData.append('file', selectedFile);
//     formData.append('email', user?.email);
//     formData.append('name', user?.name);
//     formData.append('role', applyingFor.role);

//     try {
//       await axios.post("http://localhost:5678/webhook-test/resume-upload", formData);
//       toast.success("Application Sent!", { id: toastId });
//       setSelectedFile(null);
//       setApplyingFor(null);
//       setAgreed({ terms: false, privacy: false });
//       setTimeout(() => fetchHistory(), 2000);
//     } catch (err) {
//       toast.error("Upload failed", { id: toastId });
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans relative">
      
//       {/* --- PROFESSIONAL JD MODAL --- */}
//       {viewingJD && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
//           <div className="bg-slate-800 border border-slate-700 w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
//             <button onClick={() => setViewingJD(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
//               <X size={24}/>
//             </button>

//             <div className="mb-6">
//               <h2 className="text-3xl font-bold mb-3 text-white tracking-tight">{viewingJD.role}</h2>
//               <div className="flex flex-wrap gap-2">
//                  {viewingJD.skills.map(s => (
//                    <span key={s} className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
//                      {s}
//                    </span>
//                  ))}
//               </div>
//             </div>

//             <p className="text-slate-400 text-sm leading-relaxed mb-8">Role Requirements: {viewingJD.keywords}</p>

//             {/* PDF ATTACHMENT SECTION (Google Drive Link) */}
//             <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 mb-8 flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="bg-red-500/20 p-2 rounded-lg">
//                   <FileText size={20} className="text-red-400" />
//                 </div>
//                 <div>
//                   <p className="text-xs font-bold text-slate-200 uppercase tracking-tighter">Official_JD_{viewingJD.role.replace(/\s+/g, '_')}.pdf</p>
//                   <p className="text-[10px] text-slate-500">Secure Cloud Document</p>
//                 </div>
//               </div>
//               <a href={viewingJD.jd_link} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-xs font-black uppercase tracking-widest flex items-center gap-1">
//                 Download <ExternalLink size={14} />
//               </a>
//             </div>

//             {/* LEGAL COMPULSORY CHECKBOXES */}
//             <div className="space-y-4 mb-10">
//               <label className="flex items-start gap-3 cursor-pointer group">
//                 <input type="checkbox" checked={agreed.terms} onChange={() => setAgreed({...agreed, terms: !agreed.terms})} className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500" />
//                 <span className="text-[11px] text-slate-400 leading-tight group-hover:text-slate-300 transition-colors">
//                   I confirm that all information provided in my resume and application is accurate and truthful.
//                 </span>
//               </label>
//               <label className="flex items-start gap-3 cursor-pointer group">
//                 <input type="checkbox" checked={agreed.privacy} onChange={() => setAgreed({...agreed, privacy: !agreed.privacy})} className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500" />
//                 <span className="text-[11px] text-slate-400 leading-tight group-hover:text-slate-300 transition-colors">
//                   I consent to the AI-driven processing of my data for recruitment purposes as per the company's privacy policy.
//                 </span>
//               </label>
//             </div>

//             <button 
//               disabled={!agreed.terms || !agreed.privacy}
//               onClick={() => { setApplyingFor(viewingJD); setViewingJD(null); }} 
//               className="w-full bg-blue-600 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
//             >
//               Apply for this Position
//             </button>
//           </div>
//         </div>
//       )}

//       <header className="flex justify-between items-center mb-8">
//         <div>
//            <h1 className="text-2xl font-bold text-blue-400 tracking-tight">Applicant Portal</h1>
//            <p className="text-slate-500 text-xs">Manage your applications and AI insights</p>
//         </div>
//         <button onClick={logout} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 hover:bg-red-900/10 transition-all">
//           <LogOut size={18}/> Logout
//         </button>
//       </header>

//       <div className="bg-slate-800/50 border border-slate-700 rounded-3xl mb-8 p-4 shadow-2xl backdrop-blur-sm">
//         <h3 className="text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-4">Live Status Tracker</h3>
//         <StatusTracker currentStatus={history?.status || "Pending"} />
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         <div className="lg:col-span-1 space-y-6">
//           {applyingFor ? (
//             <div className="bg-blue-600/10 border border-blue-500/30 p-6 rounded-3xl shadow-xl animate-in slide-in-from-left-4 duration-500">
//               <div className="flex justify-between items-start mb-4">
//                 <h2 className="text-xl font-bold leading-tight">Applying for:<br/><span className="text-blue-400">{applyingFor.role}</span></h2>
//                 <button onClick={() => setApplyingFor(null)}><X size={20} className="text-slate-500" /></button>
//               </div>
//               <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={(e) => setSelectedFile(e.target.files[0])} />
//               {selectedFile ? (
//                 <div className="space-y-4">
//                    <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-700">
//                       <span className="text-xs truncate max-w-[120px]">{selectedFile.name}</span>
//                       <button onClick={() => setSelectedFile(null)}><X size={16} className="text-red-400" /></button>
//                    </div>
//                    <button onClick={handleConfirmSubmit} disabled={isUploading} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-sm hover:bg-blue-500 flex items-center justify-center gap-2">
//                      {isUploading ? <Loader2 className="animate-spin" size={18} /> : "Submit to AI Engine"}
//                    </button>
//                 </div>
//               ) : (
//                 <button onClick={() => fileInputRef.current.click()} className="w-full bg-slate-100 text-slate-900 py-4 rounded-2xl font-black text-sm hover:bg-white transition-all">
//                   Upload Resume (PDF)
//                 </button>
//               )}
//             </div>
//           ) : (
//             <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 h-fit">
//               <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Open Opportunities</h3>
//               <div className="space-y-4">
//                 {jobListings.length > 0 ? jobListings.map((job) => (
//                   <div key={job.id} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-700/50 hover:border-blue-500/40 transition-all">
//                     <div className="flex justify-between items-center mb-2">
//                       <h4 className="font-bold text-sm">{job.role}</h4>
//                       <button onClick={() => setViewingJD(job)} className="text-slate-500 hover:text-blue-400 transition-colors">
//                         <Info size={18} />
//                       </button>
//                     </div>
//                     <button onClick={() => setApplyingFor(job)} className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1">
//                       Apply Now <ExternalLink size={12} />
//                     </button>
//                   </div>
//                 )) : (
//                   <p className="text-xs text-slate-500 italic">Fetching available roles...</p>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="lg:col-span-2 space-y-8">
//           {history && history.status !== "Pending" && (
//             <div className={`p-8 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-700 ${
//               history.status === 'Shortlisted' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
//             }`}>
//               <div className="flex items-center justify-between mb-8">
//                 <div>
//                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">AI Match Score</p>
//                   <h3 className="text-3xl font-bold">{history.fit_score}% Match</h3>
//                 </div>
//                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
//                   history.status === 'Shortlisted' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
//                 }`}>
//                   {history.status === 'Shortlisted' ? <TrendingUp size={28} /> : <AlertCircle size={28} />}
//                 </div>
//               </div>

//               {history.status === 'Shortlisted' ? (
//                 <div className="space-y-4">
//                   <p className="text-emerald-400 font-bold flex items-center gap-2">🌟 Why the AI Shortlisted You:</p>
//                   <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700 text-slate-300 text-sm leading-relaxed">
//                     {history.positives || "Your resume demonstrates perfect alignment with our core requirements."}
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <p className="text-red-400 font-bold flex items-center gap-2">🚩 Key Gaps Identified:</p>
//                   <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700 text-slate-300 text-sm leading-relaxed">
//                     {history.negatives || "Our AI suggests focusing on more hands-on project experience in this specific role."}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl overflow-hidden">
//             <h3 className="text-lg font-bold mb-8 flex items-center gap-2 text-slate-300">
//               <Clock size={20} className="text-blue-500" /> Active Applications
//             </h3>
//             <table className="w-full text-left">
//               <thead>
//                 <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
//                   <th className="pb-4">Applied On</th>
//                   <th className="pb-4">Target Role</th>
//                   <th className="pb-4 text-right">Live Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {history ? (
//                   <tr className="border-b border-slate-700/40 hover:bg-slate-700/10 transition-colors">
//                     <td className="py-6 text-sm text-slate-400">
//                       {new Date(history.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
//                     </td>
//                     <td className="py-6 font-bold text-sm">{history.role || "AI Developer"}</td>
//                     <td className="py-6 text-right">
//                       <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
//                         history.status === 'Shortlisted' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 
//                         history.status === 'Rejected' ? 'bg-red-400/10 text-red-400 border-red-400/20' : 
//                         'bg-blue-400/10 text-blue-400 border-blue-400/20'
//                       }`}>
//                         {history.status}
//                       </span>
//                     </td>
//                   </tr>
//                 ) : (
//                   <tr>
//                     <td colSpan="3" className="py-20 text-center text-slate-500 text-sm">No applications found. Choose a role to get started.</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Applicant;


// import React, { useRef, useState, useEffect } from 'react'; 
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import { 
//   FileText, Clock, LogOut, X, Loader2, CheckCircle2, 
//   TrendingUp, AlertCircle, Briefcase, Info, ExternalLink 
// } from 'lucide-react'; 
// import toast from 'react-hot-toast';

// // --- PIZZA TRACKER COMPONENT ---
// const StatusTracker = ({ currentStatus }) => {
//   const stages = ["Pending", "Shortlisted", "Final Decision"];
//   const normalizedStatus = currentStatus === "Rejected" ? "Final Decision" : currentStatus;
//   const currentIndex = stages.indexOf(normalizedStatus);

//   return (
//     <div className="flex items-center justify-between w-full max-w-2xl mx-auto py-10 px-4">
//       {stages.map((stage, index) => (
//         <React.Fragment key={stage}>
//           <div className="flex flex-col items-center relative z-10">
//             <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 
//               ${index <= currentIndex ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
//               {index < currentIndex ? <CheckCircle2 size={20} /> : index + 1}
//             </div>
//             <span className={`text-[10px] mt-3 font-bold uppercase tracking-wider ${index <= currentIndex ? 'text-blue-400' : 'text-slate-500'}`}>
//               {stage === "Final Decision" && currentStatus === "Rejected" ? "Rejected" : stage}
//             </span>
//           </div>
//           {index < stages.length - 1 && (
//             <div className={`flex-1 h-0.5 mx-2 mb-6 ${index < currentIndex ? 'bg-blue-600' : 'bg-slate-700'}`} />
//           )}
//         </React.Fragment>
//       ))}
//     </div>
//   );
// };

// const Applicant = () => {
//   const { user, logout } = useAuth();
//   const fileInputRef = useRef(null);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [history, setHistory] = useState(null);
//   const [applyingFor, setApplyingFor] = useState(null);
//   const [viewingJD, setViewingJD] = useState(null); 
//   const [agreed, setAgreed] = useState({ terms: false, privacy: false });

//   const jobListings = [
//     { 
//       role: "Full Stack AI Developer", 
//       skills: ["React", "FastAPI", "Python", "MySQL", "n8n"],
//       details: "You will be responsible for building end-to-end AI recruitment tools. This includes creating React dashboards, FastAPI endpoints, and automating data extraction with n8n." 
//     },
//     { 
//       role: "AI Automation Engineer", 
//       skills: ["Python", "LangChain", "n8n", "OpenAI"],
//       details: "Design and implement autonomous agentic workflows. You will optimize business processes by integrating LLMs into existing company pipelines." 
//     },
//     { 
//       role: "Database Architect", 
//       skills: ["MySQL", "PostgreSQL", "Database Design", "ORM"],
//       details: "Focus on high-performance schema design and data integrity for AI training sets. Ensure seamless integration between Python backends and relational databases." 
//     }
//   ];

//   const fetchHistory = async () => {
//     try {
//       const res = await axios.get(`http://localhost:8000/my-application/${user.email}`);
//       setHistory(res.data);
//     } catch (err) {
//       console.error("History fetch failed:", err);
//     }
//   };

//   useEffect(() => {
//     if (user?.email) fetchHistory();
//   }, [user.email]);

//   const handleConfirmSubmit = async () => {
//     if (!selectedFile || !applyingFor) return;
//     const toastId = toast.loading("Processing Application...");
//     setIsUploading(true);
    
//     const formData = new FormData();
//     formData.append('file', selectedFile);
//     formData.append('email', user?.email);
//     formData.append('name', user?.name);
//     formData.append('role', applyingFor.role);

//     try {
//       await axios.post("http://localhost:5678/webhook-test/resume-upload", formData);
//       toast.success("Application Sent!", { id: toastId });
//       setSelectedFile(null);
//       setApplyingFor(null);
//       setAgreed({ terms: false, privacy: false });
//       setTimeout(() => fetchHistory(), 2000);
//     } catch (err) {
//       toast.error("Upload failed", { id: toastId });
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans relative">
      
//       {/* --- PROFESSIONAL JD MODAL --- */}
//       {viewingJD && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
//           <div className="bg-slate-800 border border-slate-700 w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
//             <button onClick={() => setViewingJD(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
//               <X size={24}/>
//             </button>

//             <div className="mb-6">
//               <h2 className="text-3xl font-bold mb-3 text-white tracking-tight">{viewingJD.role}</h2>
//               <div className="flex flex-wrap gap-2">
//                  {viewingJD.skills.map(s => (
//                    <span key={s} className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
//                      {s}
//                    </span>
//                  ))}
//               </div>
//             </div>

//             <p className="text-slate-400 text-sm leading-relaxed mb-8">{viewingJD.details}</p>

//             {/* PDF ATTACHMENT SECTION */}
//             <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 mb-8 flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <div className="bg-red-500/20 p-2 rounded-lg">
//                   <FileText size={20} className="text-red-400" />
//                 </div>
//                 <div>
//                   <p className="text-xs font-bold text-slate-200 uppercase tracking-tighter">Official_JD_{viewingJD.role.replace(/\s+/g, '_')}.pdf</p>
//                   <p className="text-[10px] text-slate-500">2.4 MB • PDF Document</p>
//                 </div>
//               </div>
//               <a href="#" className="text-blue-400 hover:text-blue-300 text-xs font-black uppercase tracking-widest flex items-center gap-1">
//                 Download <ExternalLink size={14} />
//               </a>
//             </div>

//             {/* LEGAL COMPULSORY CHECKBOXES */}
//             <div className="space-y-4 mb-10">
//               <label className="flex items-start gap-3 cursor-pointer group">
//                 <input type="checkbox" checked={agreed.terms} onChange={() => setAgreed({...agreed, terms: !agreed.terms})} className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500" />
//                 <span className="text-[11px] text-slate-400 leading-tight group-hover:text-slate-300 transition-colors">
//                   I confirm that all information provided in my resume and application is accurate and truthful.
//                 </span>
//               </label>
//               <label className="flex items-start gap-3 cursor-pointer group">
//                 <input type="checkbox" checked={agreed.privacy} onChange={() => setAgreed({...agreed, privacy: !agreed.privacy})} className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500" />
//                 <span className="text-[11px] text-slate-400 leading-tight group-hover:text-slate-300 transition-colors">
//                   I consent to the AI-driven processing of my data for recruitment purposes as per the company's privacy policy.
//                 </span>
//               </label>
//             </div>

//             <button 
//               disabled={!agreed.terms || !agreed.privacy}
//               onClick={() => { setApplyingFor(viewingJD); setViewingJD(null); }} 
//               className="w-full bg-blue-600 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
//             >
//               Apply for this Position
//             </button>
//           </div>
//         </div>
//       )}

//       <header className="flex justify-between items-center mb-8">
//         <div>
//            <h1 className="text-2xl font-bold text-blue-400 tracking-tight">Applicant Portal</h1>
//            <p className="text-slate-500 text-xs">Manage your applications and AI insights</p>
//         </div>
//         <button onClick={logout} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 hover:bg-red-900/10 transition-all">
//           <LogOut size={18}/> Logout
//         </button>
//       </header>

//       <div className="bg-slate-800/50 border border-slate-700 rounded-3xl mb-8 p-4 shadow-2xl backdrop-blur-sm">
//         <h3 className="text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-4">Live Status Tracker</h3>
//         <StatusTracker currentStatus={history?.status || "Pending"} />
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         <div className="lg:col-span-1 space-y-6">
//           {applyingFor ? (
//             <div className="bg-blue-600/10 border border-blue-500/30 p-6 rounded-3xl shadow-xl animate-in slide-in-from-left-4 duration-500">
//               <div className="flex justify-between items-start mb-4">
//                 <h2 className="text-xl font-bold leading-tight">Applying for:<br/><span className="text-blue-400">{applyingFor.role}</span></h2>
//                 <button onClick={() => setApplyingFor(null)}><X size={20} className="text-slate-500" /></button>
//               </div>
//               <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={(e) => setSelectedFile(e.target.files[0])} />
//               {selectedFile ? (
//                 <div className="space-y-4">
//                    <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-700">
//                       <span className="text-xs truncate max-w-[120px]">{selectedFile.name}</span>
//                       <button onClick={() => setSelectedFile(null)}><X size={16} className="text-red-400" /></button>
//                    </div>
//                    <button onClick={handleConfirmSubmit} disabled={isUploading} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-sm hover:bg-blue-500 flex items-center justify-center gap-2">
//                      {isUploading ? <Loader2 className="animate-spin" size={18} /> : "Submit to AI Engine"}
//                    </button>
//                 </div>
//               ) : (
//                 <button onClick={() => fileInputRef.current.click()} className="w-full bg-slate-100 text-slate-900 py-4 rounded-2xl font-black text-sm hover:bg-white transition-all">
//                   Upload Resume (PDF)
//                 </button>
//               )}
//             </div>
//           ) : (
//             <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 h-fit">
//               <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Open Opportunities</h3>
//               <div className="space-y-4">
//                 {jobListings.map((job) => (
//                   <div key={job.role} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-700/50 hover:border-blue-500/40 transition-all">
//                     <div className="flex justify-between items-center mb-2">
//                       <h4 className="font-bold text-sm">{job.role}</h4>
//                       <button onClick={() => setViewingJD(job)} className="text-slate-500 hover:text-blue-400 transition-colors">
//                         <Info size={18} />
//                       </button>
//                     </div>
//                     <button onClick={() => setApplyingFor(job)} className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1">
//                       Apply Now <ExternalLink size={12} />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="lg:col-span-2 space-y-8">
//           {history && history.status !== "Pending" && (
//             <div className={`p-8 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-700 ${
//               history.status === 'Shortlisted' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
//             }`}>
//               <div className="flex items-center justify-between mb-8">
//                 <div>
//                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">AI Match Score</p>
//                   <h3 className="text-3xl font-bold">{history.fit_score}% Match</h3>
//                 </div>
//                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
//                   history.status === 'Shortlisted' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
//                 }`}>
//                   {history.status === 'Shortlisted' ? <TrendingUp size={28} /> : <AlertCircle size={28} />}
//                 </div>
//               </div>

//               {history.status === 'Shortlisted' ? (
//                 <div className="space-y-4">
//                   <p className="text-emerald-400 font-bold flex items-center gap-2">🌟 Why the AI Shortlisted You:</p>
//                   <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700 text-slate-300 text-sm leading-relaxed">
//                     {history.positives || "Your resume demonstrates perfect alignment with our core requirements."}
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <p className="text-red-400 font-bold flex items-center gap-2">🚩 Key Gaps Identified:</p>
//                   <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700 text-slate-300 text-sm leading-relaxed">
//                     {history.negatives || "Our AI suggests focusing on more hands-on project experience in this specific role."}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl overflow-hidden">
//             <h3 className="text-lg font-bold mb-8 flex items-center gap-2 text-slate-300">
//               <Clock size={20} className="text-blue-500" /> Active Applications
//             </h3>
//             <table className="w-full text-left">
//               <thead>
//                 <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
//                   <th className="pb-4">Applied On</th>
//                   <th className="pb-4">Target Role</th>
//                   <th className="pb-4 text-right">Live Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {history ? (
//                   <tr className="border-b border-slate-700/40 hover:bg-slate-700/10 transition-colors">
//                     <td className="py-6 text-sm text-slate-400">
//                       {new Date(history.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
//                     </td>
//                     <td className="py-6 font-bold text-sm">{history.role || "AI Developer"}</td>
//                     <td className="py-6 text-right">
//                       <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
//                         history.status === 'Shortlisted' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 
//                         history.status === 'Rejected' ? 'bg-red-400/10 text-red-400 border-red-400/20' : 
//                         'bg-blue-400/10 text-blue-400 border-blue-400/20'
//                       }`}>
//                         {history.status}
//                       </span>
//                     </td>
//                   </tr>
//                 ) : (
//                   <tr>
//                     <td colSpan="3" className="py-20 text-center text-slate-500 text-sm">No applications found. Choose a role to get started.</td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Applicant;
// import React, { useRef, useState, useEffect } from 'react'; 
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import { FileText, Clock, LogOut, X, Loader2, CheckCircle2 } from 'lucide-react'; 
// import toast from 'react-hot-toast';

// // --- PIZZA TRACKER COMPONENT ---
// const StatusTracker = ({ currentStatus }) => {
//   const stages = ["Pending", "Shortlisted", "Final Decision"];
//   // Map "Rejected" to the final stage visually
//   const normalizedStatus = currentStatus === "Rejected" ? "Final Decision" : currentStatus;
//   const currentIndex = stages.indexOf(normalizedStatus);

//   return (
//     <div className="flex items-center justify-between w-full max-w-2xl mx-auto py-10 px-4">
//       {stages.map((stage, index) => (
//         <React.Fragment key={stage}>
//           <div className="flex flex-col items-center relative z-10">
//             <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 
//               ${index <= currentIndex ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
//               {index < currentIndex ? <CheckCircle2 size={20} /> : index + 1}
//             </div>
//             <span className={`text-[10px] mt-3 font-bold uppercase tracking-wider ${index <= currentIndex ? 'text-blue-400' : 'text-slate-500'}`}>
//               {stage === "Final Decision" && currentStatus === "Rejected" ? "Rejected" : stage}
//             </span>
//           </div>
//           {index < stages.length - 1 && (
//             <div className={`flex-1 h-0.5 mx-2 mb-6 ${index < currentIndex ? 'bg-blue-600' : 'bg-slate-700'}`} />
//           )}
//         </React.Fragment>
//       ))}
//     </div>
//   );
// };

// const Applicant = () => {
//   const { user, logout } = useAuth();
//   const fileInputRef = useRef(null);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [history, setHistory] = useState(null);

//   const jobDescription = {
//     role: "Full Stack AI Developer",
//     skills: ["React", "FastAPI", "Python", "MySQL", "n8n"],
//     details: "Developing end-to-end automation systems with LLM integration."
//   };

//   const fetchHistory = async () => {
//     try {
//       // Hits the endpoint we just added in main.py
//       const res = await axios.get(`http://localhost:8000/my-application/${user.email}`);
//       setHistory(res.data);
//     } catch (err) {
//       console.error("History fetch failed:", err);
//     }
//   };

//   useEffect(() => {
//     if (user?.email) fetchHistory();
//   }, [user.email]);

//   const handleConfirmSubmit = async () => {
//     if (!selectedFile) return;
//     const toastId = toast.loading("Uploading Application...");
//     setIsUploading(true);
    
//     const formData = new FormData();
//     formData.append('file', selectedFile);
//     formData.append('email', user?.email);
//     formData.append('name', user?.name);

//     try {
//       await axios.post("http://localhost:5678/webhook-test/resume-upload", formData);
//       toast.success("Application Sent!", { id: toastId });
//       setSelectedFile(null);
//       setTimeout(() => fetchHistory(), 2000); // Wait for DB sync
//     } catch (err) {
//       toast.error("Upload failed", { id: toastId });
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
//       <header className="flex justify-between items-center mb-8">
//         <h1 className="text-2xl font-bold text-blue-400 tracking-tight">Applicant Portal</h1>
//         <button onClick={logout} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 hover:bg-red-900/10 transition-all">
//           <LogOut size={18}/> Logout
//         </button>
//       </header>

//       {/* TRACKER BOX */}
//       <div className="bg-slate-800/50 border border-slate-700 rounded-3xl mb-8 p-4 shadow-2xl backdrop-blur-sm">
//         <h3 className="text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-4">Live Status Tracker</h3>
//         <StatusTracker currentStatus={history?.status || "Pending"} />
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* SIDEBAR: JOB INFO & UPLOAD */}
//         <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl h-fit">
//           <div className="mb-6">
//             <h2 className="text-xl font-bold mb-1">{jobDescription.role}</h2>
//             <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">Active Listing</p>
//           </div>
          
//           <div className="flex flex-wrap gap-2 mb-8">
//             {jobDescription.skills.map(s => (
//               <span key={s} className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg text-[10px] font-bold border border-blue-500/20">{s}</span>
//             ))}
//           </div>

//           <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={(e) => setSelectedFile(e.target.files[0])} />

//           {selectedFile ? (
//             <div className="space-y-4">
//                <div className="flex items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-700">
//                   <span className="text-xs truncate max-w-[150px]">{selectedFile.name}</span>
//                   <button onClick={() => setSelectedFile(null)}><X size={16} className="text-red-400" /></button>
//                </div>
//                <button onClick={handleConfirmSubmit} disabled={isUploading} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-sm hover:bg-blue-500 transition-all shadow-lg flex items-center justify-center gap-2">
//                  {isUploading ? <Loader2 className="animate-spin" size={18} /> : "Submit Application"}
//                </button>
//             </div>
//           ) : (
//             <button onClick={() => fileInputRef.current.click()} className="w-full bg-slate-700 py-4 rounded-2xl font-black text-sm hover:bg-slate-600 transition-all border border-slate-600">
//               Upload Resume
//             </button>
//           )}
//         </div>

//         {/* MAIN: HISTORY TABLE */}
//         <div className="lg:col-span-2 bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
//           <h3 className="text-lg font-bold mb-8 flex items-center gap-2 text-slate-300">
//             <Clock size={20} className="text-blue-500" /> Application History
//           </h3>
//           <table className="w-full text-left">
//             <thead>
//               <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
//                 <th className="pb-4">Date Applied</th>
//                 <th className="pb-4">Position</th>
//                 <th className="pb-4 text-right">Outcome</th>
//               </tr>
//             </thead>
//             <tbody>
//               {history ? (
//                 <tr className="border-b border-slate-700/40 group">
//                   <td className="py-6 text-sm text-slate-400">
//                     {new Date(history.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
//                   </td>
//                   <td className="py-6 font-bold text-sm">Full Stack AI Developer</td>
//                   <td className="py-6 text-right">
//                     <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider ${
//                       history.status === 'Shortlisted' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 
//                       history.status === 'Rejected' ? 'bg-red-400/10 text-red-400 border border-red-400/20' : 
//                       'bg-blue-400/10 text-blue-400 border border-blue-400/20'
//                     }`}>
//                       {history.status}
//                     </span>
//                   </td>
//                 </tr>
//               ) : (
//                 <tr>
//                   <td colSpan="3" className="py-20 text-center text-slate-500 italic text-sm">No records found in database.</td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Applicant;
// import React, { useRef, useState, useEffect } from 'react'; 
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import { FileText, Clock, LogOut, X, Loader2 } from 'lucide-react'; 
// import toast from 'react-hot-toast'; // Professional notifications

// const Applicant = () => {
//   const { user, logout } = useAuth();
//   const fileInputRef = useRef(null);
  
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [history, setHistory] = useState([]); // Real application history

//   const jobDescription = {
//     role: "Full Stack AI Developer",
//     skills: ["React", "FastAPI", "Python", "MySQL", "n8n"],
//     details: "Developing end-to-end automation systems with LLM integration."
//   };

//   // LOGIC: Fetch history from your MySQL backend
//   const fetchHistory = async () => {
//     try {
//       const response = await axios.get(`http://localhost:8000/applications/${user.email}`);
//       setHistory(response.data);
//     } catch (err) {
//       console.error("Fetch error:", err);
//     }
//   };

//   useEffect(() => {
//     if (user?.email) fetchHistory();
//   }, [user.email]);

//   // N8N WEBHOOK LOGIC
//   const handleConfirmSubmit = async () => {
//     if (!selectedFile) return;

//     const toastId = toast.loading("Triggering AI Workflow...");
//     setIsUploading(true);
    
//     const formData = new FormData();
//     formData.append('file', selectedFile);
//     formData.append('email', user?.email);
//     formData.append('name', user?.name);

//     try {
//       await axios.post(
//         "http://localhost:5678/webhook-test/resume-upload", 
//         formData, 
//         { headers: { 'Content-Type': 'multipart/form-data' } }
//       );
      
//       toast.success("Application sent to n8n!", { id: toastId });
//       setSelectedFile(null);
//       fetchHistory(); // Refresh table automatically
//     } catch (err) {
//       toast.error("Workflow failed. Check if n8n is active.", { id: toastId });
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
//       <header className="flex justify-between items-center mb-12">
//         <h1 className="text-2xl font-bold text-blue-400">Welcome, {user.name}</h1>
//         <button onClick={logout} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg hover:bg-red-900/20 transition-all">
//           <LogOut size={18}/> Logout
//         </button>
//       </header>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-fit">
//           <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText size={20}/> Active Job: {jobDescription.role}</h2>
//           <p className="text-slate-400 text-sm mb-4">{jobDescription.details}</p>
//           <div className="flex flex-wrap gap-2">
//             {jobDescription.skills.map(skill => (
//               <span key={skill} className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs border border-blue-500/30">{skill}</span>
//             ))}
//           </div>

//           <input 
//             type="file" 
//             ref={fileInputRef} 
//             className="hidden" 
//             accept=".pdf" 
//             onChange={(e) => setSelectedFile(e.target.files[0])} 
//           />

//           {selectedFile ? (
//             <div className="mt-8 space-y-3">
//               <div className="flex items-center justify-between bg-blue-900/20 border border-blue-500/30 p-3 rounded-xl">
//                 <div className="flex items-center gap-2 truncate">
//                   <FileText size={18} className="text-blue-400 shrink-0" />
//                   <span className="text-sm truncate">{selectedFile.name}</span>
//                 </div>
//                 <button 
//                   onClick={() => {setSelectedFile(null); fileInputRef.current.value = "";}} 
//                   className="text-slate-400 hover:text-red-400 transition-colors"
//                 >
//                   <X size={18} />
//                 </button>
//               </div>
//               <button 
//                 onClick={handleConfirmSubmit}
//                 disabled={isUploading}
//                 className="w-full bg-green-600 py-3 rounded-xl font-bold hover:bg-green-500 transition-all shadow-lg flex items-center justify-center gap-2"
//               >
//                 {isUploading ? <Loader2 className="animate-spin" size={18} /> : null}
//                 {isUploading ? "Uploading..." : "Confirm & Submit"}
//               </button>
//             </div>
//           ) : (
//             <button 
//               onClick={() => fileInputRef.current.click()} 
//               className="w-full mt-8 bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg"
//             >
//               Upload Resume
//             </button>
//           )}
//         </div>

//         <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700">
//           <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Clock size={20}/> Application History</h3>
//           <table className="w-full text-left">
//             <thead>
//               <tr className="text-slate-500 text-xs uppercase border-b border-slate-700">
//                 <th className="pb-3">Upload Date</th>
//                 <th className="pb-3">Resume</th>
//                 <th className="pb-3 text-right">Status</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-700">
//               {history.length > 0 ? history.map((app, index) => (
//                 <tr key={index} className="hover:bg-slate-700/30 transition-colors">
//                   <td className="py-4 text-sm text-slate-400">{app.upload_date}</td>
//                   <td className="py-4 text-blue-400 font-medium">{app.filename}</td>
//                   <td className="py-4 text-right">
//                     <span className={`px-3 py-1 rounded-full text-xs font-bold ${
//                       app.status === 'Shortlisted' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
//                     }`}>
//                       {app.status || 'Pending'}
//                     </span>
//                   </td>
//                 </tr>
//               )) : (
//                 <tr>
//                   <td colSpan="3" className="py-10 text-center text-slate-500 italic">No applications found.</td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Applicant;
// import React, { useRef, useState } from 'react'; 
// import axios from 'axios'; // Added axios import
// import { useAuth } from '../context/AuthContext';
// import { FileText, Clock, CheckCircle, LogOut, X, Loader2 } from 'lucide-react'; 

// const Applicant = () => {
//   const { user, logout } = useAuth();
//   const fileInputRef = useRef(null);
  
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [isUploading, setIsUploading] = useState(false); // Track n8n status

//   const jobDescription = {
//     role: "Full Stack AI Developer",
//     skills: ["React", "FastAPI", "Python", "MySQL", "n8n"],
//     details: "Developing end-to-end automation systems with LLM integration."
//   };

//   // N8N WEBHOOK LOGIC
//   const handleConfirmSubmit = async () => {
//     if (!selectedFile) return;

//     setIsUploading(true);
//     const formData = new FormData();
//     formData.append('file', selectedFile);
//     formData.append('email', user?.email);
//     formData.append('name', user?.name);

//     try {
//       await axios.post(
//         "http://localhost:5678/webhook-test/resume-upload", 
//         formData, 
//         { headers: { 'Content-Type': 'multipart/form-data' } }
//       );
//       alert("Application sent to n8n workflow!");
//       setSelectedFile(null); // Clear selection on success
//     } catch (err) {
//       console.error("n8n Error:", err);
//       alert("Failed to reach n8n. Make sure it's running locally.");
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
//       <header className="flex justify-between items-center mb-12">
//         <h1 className="text-2xl font-bold text-blue-400">Welcome, {user.name}</h1>
//         <button onClick={logout} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg hover:bg-red-900/20 transition-all">
//           <LogOut size={18}/> Logout
//         </button>
//       </header>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
//           <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText size={20}/> Active Job: {jobDescription.role}</h2>
//           <p className="text-slate-400 text-sm mb-4">{jobDescription.details}</p>
//           <div className="flex flex-wrap gap-2">
//             {jobDescription.skills.map(skill => (
//               <span key={skill} className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs border border-blue-500/30">{skill}</span>
//             ))}
//           </div>

//           <input 
//             type="file" 
//             ref={fileInputRef} 
//             className="hidden" 
//             accept=".pdf" 
//             onChange={(e) => setSelectedFile(e.target.files[0])} 
//           />

//           {selectedFile ? (
//             <div className="mt-8 space-y-3">
//               <div className="flex items-center justify-between bg-blue-900/20 border border-blue-500/30 p-3 rounded-xl">
//                 <div className="flex items-center gap-2 truncate">
//                   <FileText size={18} className="text-blue-400 shrink-0" />
//                   <span className="text-sm truncate">{selectedFile.name}</span>
//                 </div>
//                 <button 
//                   onClick={() => {setSelectedFile(null); fileInputRef.current.value = "";}} 
//                   className="text-slate-400 hover:text-red-400 transition-colors"
//                 >
//                   <X size={18} />
//                 </button>
//               </div>
//               {/* TRIGGER N8N WEBHOOK */}
//               <button 
//                 onClick={handleConfirmSubmit}
//                 disabled={isUploading}
//                 className="w-full bg-green-600 py-3 rounded-xl font-bold hover:bg-green-500 transition-all shadow-lg flex items-center justify-center gap-2"
//               >
//                 {isUploading ? <Loader2 className="animate-spin" size={18} /> : null}
//                 {isUploading ? "Processing..." : "Confirm & Submit"}
//               </button>
//             </div>
//           ) : (
//             <button 
//               onClick={() => fileInputRef.current.click()} 
//               className="w-full mt-8 bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg"
//             >
//               Upload Resume
//             </button>
//           )}
//         </div>

//         <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700">
//           <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Clock size={20}/> Application History</h3>
//           <table className="w-full text-left">
//             <thead>
//               <tr className="text-slate-500 text-xs uppercase border-b border-slate-700">
//                 <th className="pb-3">Upload Date</th>
//                 <th className="pb-3">Resume</th>
//                 <th className="pb-3 text-right">Status</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-700">
//               <tr>
//                 <td className="py-4">Feb 18, 2026</td>
//                 <td className="py-4 text-blue-400 cursor-pointer hover:underline">resume_final.pdf</td>
//                 <td className="py-4 text-right">
//                   <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold">Pending Review</span>
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Applicant;
// import React, { useRef, useState } from 'react'; // Added useState
// import { useAuth } from '../context/AuthContext';
// import { FileText, Clock, CheckCircle, LogOut, X } from 'lucide-react'; // Added X

// const Applicant = () => {
//   const { user, logout } = useAuth();
//   const fileInputRef = useRef(null);
  
//   // Logic: State to track selected file before upload
//   const [selectedFile, setSelectedFile] = useState(null);

//   const jobDescription = {
//     role: "Full Stack AI Developer",
//     skills: ["React", "FastAPI", "Python", "MySQL", "n8n"],
//     details: "Developing end-to-end automation systems with LLM integration."
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
//       <header className="flex justify-between items-center mb-12">
//         <h1 className="text-2xl font-bold text-blue-400">Welcome, {user.name}</h1>
//         <button onClick={logout} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg hover:bg-red-900/20 transition-all">
//           <LogOut size={18}/> Logout
//         </button>
//       </header>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Job Details Section */}
//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
//           <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText size={20}/> Active Job: {jobDescription.role}</h2>
//           <p className="text-slate-400 text-sm mb-4">{jobDescription.details}</p>
//           <div className="flex flex-wrap gap-2">
//             {jobDescription.skills.map(skill => (
//               <span key={skill} className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs border border-blue-500/30">{skill}</span>
//             ))}
//           </div>

//           <input 
//             type="file" 
//             ref={fileInputRef} 
//             className="hidden" 
//             accept=".pdf" 
//             onChange={(e) => setSelectedFile(e.target.files[0])} // Logic: Set file
//           />

//           {/* Logic: Show file info with Cancel (X) if selected, otherwise show Upload button */}
//           {selectedFile ? (
//             <div className="mt-8 space-y-3">
//               <div className="flex items-center justify-between bg-blue-900/20 border border-blue-500/30 p-3 rounded-xl">
//                 <div className="flex items-center gap-2 truncate">
//                   <FileText size={18} className="text-blue-400 shrink-0" />
//                   <span className="text-sm truncate">{selectedFile.name}</span>
//                 </div>
//                 <button 
//                   onClick={() => {setSelectedFile(null); fileInputRef.current.value = "";}} 
//                   className="text-slate-400 hover:text-red-400 transition-colors"
//                 >
//                   <X size={18} />
//                 </button>
//               </div>
//               <button className="w-full bg-green-600 py-3 rounded-xl font-bold hover:bg-green-500 transition-all shadow-lg">
//                 Confirm & Submit
//               </button>
//             </div>
//           ) : (
//             <button 
//               onClick={() => fileInputRef.current.click()} 
//               className="w-full mt-8 bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg"
//             >
//               Upload Resume
//             </button>
//           )}
//         </div>

//         {/* Status Table */}
//         <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700">
//           <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Clock size={20}/> Application History</h3>
//           <table className="w-full text-left">
//             <thead>
//               <tr className="text-slate-500 text-xs uppercase border-b border-slate-700">
//                 <th className="pb-3">Upload Date</th>
//                 <th className="pb-3">Resume</th>
//                 <th className="pb-3 text-right">Status</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-700">
//               <tr>
//                 <td className="py-4">Feb 18, 2026</td>
//                 <td className="py-4 text-blue-400 cursor-pointer hover:underline">resume_final.pdf</td>
//                 <td className="py-4 text-right">
//                   <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold">Pending Review</span>
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Applicant;
// import React, { useRef } from 'react'; // Added useRef here
// import { useAuth } from '../context/AuthContext';
// import { FileText, Clock, CheckCircle, LogOut } from 'lucide-react';

// const Applicant = () => {
//   const { user, logout } = useAuth();
//   const fileInputRef = useRef(null); // Added this line

//   // Mock data for Job Description - In a real app, fetch this from /jobs endpoint
//   const jobDescription = {
//     role: "Full Stack AI Developer",
//     skills: ["React", "FastAPI", "Python", "MySQL", "n8n"],
//     details: "Developing end-to-end automation systems with LLM integration."
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
//       <header className="flex justify-between items-center mb-12">
//         <h1 className="text-2xl font-bold text-blue-400">Welcome, {user.name}</h1>
//         <button onClick={logout} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg hover:bg-red-900/20 transition-all">
//           <LogOut size={18}/> Logout
//         </button>
//       </header>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Job Details Section */}
//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
//           <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText size={20}/> Active Job: {jobDescription.role}</h2>
//           <p className="text-slate-400 text-sm mb-4">{jobDescription.details}</p>
//           <div className="flex flex-wrap gap-2">
//             {jobDescription.skills.map(skill => (
//               <span key={skill} className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs border border-blue-500/30">{skill}</span>
//             ))}
//           </div>

//           {/* HIDDEN INPUT ADDED HERE */}
//           <input 
//             type="file" 
//             ref={fileInputRef} 
//             className="hidden" 
//             accept=".pdf" 
//             onChange={(e) => console.log(e.target.files[0])} 
//           />

//           <button 
//             onClick={() => fileInputRef.current.click()} // LINKED HERE
//             className="w-full mt-8 bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg"
//           >
//             Upload Resume
//           </button>
//         </div>

//         {/* Status Table */}
//         <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700">
//           <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Clock size={20}/> Application History</h3>
//           <table className="w-full text-left">
//             <thead>
//               <tr className="text-slate-500 text-xs uppercase border-b border-slate-700">
//                 <th className="pb-3">Upload Date</th>
//                 <th className="pb-3">Resume</th>
//                 <th className="pb-3 text-right">Status</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-700">
//               <tr>
//                 <td className="py-4">Feb 18, 2026</td>
//                 <td className="py-4 text-blue-400 cursor-pointer hover:underline">resume_final.pdf</td>
//                 <td className="py-4 text-right">
//                   <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold">Pending Review</span>
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Applicant;

// import React, { useRef, useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import { FileText, Clock, LogOut, Loader2, ExternalLink } from 'lucide-react';

// const Applicant = () => {
//   const { user, logout } = useAuth();
//   const fileInputRef = useRef(null);
//   const [apps, setApps] = useState([]); // State for the application history
//   const [isUploading, setIsUploading] = useState(false);

//   // LOGIC: Fetch applications for this specific user
//   const fetchApplications = async () => {
//     try {
//       const res = await axios.get(`http://localhost:8000/my-applications/${user.email}`);
//       setApps(res.data);
//     } catch (err) {
//       console.error("Error fetching applications:", err);
//     }
//   };

//   // Fetch on initial load
//   useEffect(() => {
//     if (user?.email) fetchApplications();
//   }, [user.email]);

//   // LOGIC: Handle upload and refresh table
//   const handleFileChange = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     setIsUploading(true);
//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('email', user.email);

//     try {
//       await axios.post("http://localhost:8000/upload-resume", formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
//       // REFRESH DATA IMMEDIATELY
//       fetchApplications(); 
//     } catch (err) {
//       alert("Upload failed. Check your backend server.");
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   const jobDescription = {
//     role: "Full Stack AI Developer",
//     skills: ["React", "FastAPI", "Python", "MySQL", "n8n"],
//     details: "Developing end-to-end automation systems with LLM integration."
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
//       <header className="flex justify-between items-center mb-12">
//         <h1 className="text-2xl font-bold text-blue-400">Welcome, {user.name}</h1>
//         <button onClick={logout} className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg hover:bg-red-900/20 transition-all text-slate-300">
//           <LogOut size={18}/> Logout
//         </button>
//       </header>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Upload Section */}
//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-fit">
//           <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText size={20}/> Upload Resume</h2>
//           <p className="text-slate-400 text-sm mb-4">Supported formats: PDF, DOCX. Max 5MB.</p>
          
//           <div className="flex flex-wrap gap-2 mb-6">
//             {jobDescription.skills.map(skill => (
//               <span key={skill} className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs border border-blue-500/30">{skill}</span>
//             ))}
//           </div>

//           <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />

//           <button 
//             onClick={() => fileInputRef.current.click()} 
//             disabled={isUploading}
//             className="w-full bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg flex items-center justify-center gap-2"
//           >
//             {isUploading ? <Loader2 className="animate-spin" size={18}/> : <FileText size={18}/>}
//             {isUploading ? "Uploading..." : "Select & Apply"}
//           </button>
//         </div>

//         {/* History Section (The Logic you wanted) */}
//         <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700">
//           <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Clock size={20}/> My Applications</h3>
          
//           <div className="space-y-4">
//             {apps.length === 0 && <div className="text-slate-500 italic py-10 text-center">No applications yet — upload to get started.</div>}
            
//             {apps.map((a) => (
//               <div key={a.id} className="flex items-center justify-between bg-slate-700/50 border border-slate-600 rounded-xl p-4 transition-hover hover:bg-slate-700">
//                 <div>
//                   <div className="font-bold text-slate-200">{a.resumeName || a.filename}</div>
//                   <div className="text-xs text-slate-400 mt-1">{a.uploadDate} • {jobDescription.role}</div>
//                   {a.resumeLink && (
//                     <a href={a.resumeLink} target="_blank" rel="noreferrer" className="text-blue-400 text-xs flex items-center gap-1 mt-2 hover:underline">
//                       View Resume <ExternalLink size={12}/>
//                     </a>
//                   )}
//                 </div>
                
//                 <div className="text-right">
//                   <span className={`${badgeColor(a.status)} px-3 py-1 rounded-full text-xs font-bold`}>
//                     {a.status}
//                   </span>
//                   <div className="text-xs text-slate-400 mt-2">
//                     Fit Score: <span className="text-blue-400 font-bold">{a.fit}%</span>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Helper for status colors
// function badgeColor(status) {
//   if (status === 'Shortlisted') return 'bg-amber-500 text-slate-900';
//   if (status === 'Reviewed') return 'bg-emerald-600 text-white';
//   return 'bg-slate-600 text-slate-300';
// }

// export default Applicant;

// import React, { useState } from 'react';
// import { api } from '../services/api';
// import { Upload, FileText, CheckCircle, Loader } from 'lucide-react';

// const Applicant = () => {
//   const [file, setFile] = useState(null);
//   const [status, setStatus] = useState('idle');

//   const handleUpload = async () => {
//     if (!file) return;
//     setStatus('uploading');
//     try {
//       await api.uploadResume(file, "Candidate Name", "email@example.com"); 
//       setStatus('success');
//     } catch (err) {
//       console.error(err);
//       setStatus('error');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
//       <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center">
//         <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
//           <FileText size={32} />
//         </div>
//         <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Resume</h2>
//         <p className="text-slate-500 mb-8">AI Will analyze your Fit Score instantly.</p>

//         <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 mb-6 hover:border-blue-500 hover:bg-blue-50 transition-all relative">
//           <input 
//             type="file" 
//             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
//             onChange={(e) => setFile(e.target.files[0])}
//             accept=".pdf,.docx" 
//           />
//           {file ? (
//             <p className="text-blue-600 font-medium">{file.name}</p>
//           ) : (
//             <div className="text-slate-400">
//               <Upload className="mx-auto mb-2" />
//               <p>Click or Drag file here</p>
//             </div>
//           )}
//         </div>

//         <button 
//           onClick={handleUpload}
//           disabled={!file || status === 'uploading' || status === 'success'}
//           className={`w-full py-3 rounded-xl font-bold text-white transition-all ${status === 'success' ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}
//         >
//           {status === 'uploading' ? <span className="flex items-center justify-center gap-2"><Loader className="animate-spin"/> Analyzing...</span> : status === 'success' ? <span className="flex items-center justify-center gap-2"><CheckCircle/> Upload Complete</span> : 'Submit Application'}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Applicant;
// import React, { useState } from 'react';
// import { api } from '../services/api';
// import { Upload, FileText, CheckCircle, Loader } from 'lucide-react';

// const Applicant = () => {
//   const [file, setFile] = useState(null);
//   const [status, setStatus] = useState('idle');

//   const handleUpload = async () => {
//     if (!file) return;
//     setStatus('uploading');
//     try {
//       // Sends file to n8n
//       await api.uploadResume(file, "Candidate Name", "email@example.com"); 
//       setStatus('success');
//     } catch (err) {
//       console.error(err);
//       setStatus('error');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
//       <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center">
//         <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
//           <FileText size={32} />
//         </div>
//         <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Resume</h2>
//         <p className="text-slate-500 mb-8">AI Will analyze your Fit Score instantly.</p>

//         {/* Upload Zone */}
//         <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 mb-6 hover:border-blue-500 hover:bg-blue-50 transition-all relative">
//           <input 
//             type="file" 
//             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
//             onChange={(e) => setFile(e.target.files[0])}
//             accept=".pdf,.docx" 
//           />
//           {file ? (
//             <p className="text-blue-600 font-medium">{file.name}</p>
//           ) : (
//             <div className="text-slate-400">
//               <Upload className="mx-auto mb-2" />
//               <p>Click or Drag file here</p>
//             </div>
//           )}
//         </div>

//         <button 
//           onClick={handleUpload}
//           disabled={!file || status === 'uploading' || status === 'success'}
//           className={`w-full py-3 rounded-xl font-bold text-white transition-all ${status === 'success' ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'}`}
//         >
//           {status === 'uploading' ? <span className="flex items-center justify-center gap-2"><Loader className="animate-spin"/> Analyzing...</span> : status === 'success' ? <span className="flex items-center justify-center gap-2"><CheckCircle/> Upload Complete</span> : 'Submit Application'}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Applicant;