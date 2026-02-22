import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Search, LogOut, Users, Mail, Info, X, FileText, Plus, Briefcase, Link as LinkIcon, Tags, Loader2, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

// --- THE ENGINE ---
const getBaseTags = (text) => {
  if (!text || text === 'NULL' || text.trim() === '') return [];
  if (text.includes(',')) {
    return text.split(',').map(s => s.trim().charAt(0).toUpperCase() + s.trim().slice(1)).filter(s => s.length > 0);
  }
  const lower = text.toLowerCase();
  let tags = [];
  if (lower.includes('full stack') || lower.includes('full-stack') || lower.includes('fullstack')) tags.push('Full Stack');
  if (lower.includes('python')) tags.push('Python');
  if (lower.includes('javascript') || lower.includes(' js ') || lower.includes('javascript-based')) tags.push('JavaScript');
  if (lower.includes('react')) tags.push('React');
  if (lower.includes('vector')) tags.push('Vector DB');
  if (lower.includes('database') || lower.includes('sql')) tags.push('Database');
  if (lower.includes('experience') || lower.includes('years') || lower.includes('seniority')) tags.push('Experience');
  if (tags.length === 0) {
    const clean = text.replace(/[^a-zA-Z\s]/g, '').toLowerCase();
    const ignore = [
      'the','and','with','for','that','this','lack','lacks','significant',
      'required','explicit','proficiency','based','foundational','development',
      'have','has','are','not','but','from','they','their','of','in','to','a',
      'most','strong','demonstration','understanding','proficient','knowledge',
      'working','skills','using','good','very','some','any','about','more'
    ];
    const words = clean.split(/\s+/).filter(w => w.length > 4 && !ignore.includes(w));
    if(words.length > 0) tags.push(words[0].charAt(0).toUpperCase() + words[0].slice(1));
  }
  return [...new Set(tags)];
};

const Recruiter = () => {
  const { user, logout } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]); // For role filtering
  const [filters, setFilters] = useState({ status: 'All', role: 'All' });
  const [q, setQ] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobForm, setJobForm] = useState({ role_name: '', jd_link: '', keywords: '' });

  const fetchData = async () => {
    try {
      const [candRes, jobsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL}/candidates/`),
        axios.get(`${process.env.REACT_APP_API_URL}/jobs`)
      ]);
      setCandidates(candRes.data);
      setActiveJobs(jobsRes.data);
    } catch (err) {
      toast.error("Data synchronization failed");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      if (filters.status !== 'All' && c.status !== filters.status) return false;
      if (filters.role !== 'All' && c.role !== filters.role) return false;
      const displayName = c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim();
      if (q && !(displayName.toLowerCase().includes(q.toLowerCase()) || (c.email || '').toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [candidates, filters, q]);

  const onUpdateStatus = async (id, newStatus) => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_URL}/candidates/${id}/status`, { status: newStatus });
      setCandidates(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      toast.success(`Candidate marked as ${newStatus}`);
    } catch (err) {
      toast.error("Database update failed");
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setJobLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/jobs`, jobForm);
      toast.success("Job Posted Successfully!");
      setIsAddJobOpen(false);
      setJobForm({ role_name: '', jd_link: '', keywords: '' });
      fetchData(); // Refresh jobs list
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to post job");
    } finally {
      setJobLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="text-blue-500" /> Recruiter Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsAddJobOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20"
          >
            <Plus size={18}/> Post Job
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input 
              value={q} onChange={e => setQ(e.target.value)} 
              placeholder="Search name or email" 
              className="pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm w-64 outline-none focus:border-blue-500 transition-all" 
            />
          </div>
          <button onClick={logout} className="p-2 bg-slate-800 hover:bg-red-900/20 text-red-400 rounded-lg border border-slate-700 transition-all">
            <LogOut size={18}/>
          </button>
        </div>
      </header>

      {/* Role Filter & Status Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
          {["All", "Pending", "Shortlisted", "Rejected"].map(status => (
            <button 
              key={status}
              onClick={() => setFilters({...filters, status})}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                filters.status === status ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
           <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Filter by Job Role</div>
           <div className="relative">
             <select 
               value={filters.role}
               onChange={(e) => setFilters({...filters, role: e.target.value})}
               className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-300 outline-none focus:border-blue-500 appearance-none pr-10 cursor-pointer min-w-[200px]"
             >
               <option value="All">All Roles</option>
               {activeJobs.map(job => (
                 <option key={job.id} value={job.role_name}>{job.role_name}</option>
               ))}
             </select>
             <ChevronDown className="absolute right-3 top-2.5 text-slate-500 pointer-events-none" size={16}/>
           </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
           <span className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">Applicant Manifest</span>
          <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">
            {filtered.length} Matching Applications
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-700/50">
              <th className="p-4">Candidate</th>
              <th className="p-4">Applied Role</th>
              <th className="p-4">AI Fit</th>
              <th className="p-4">Key Skills</th>
              <th className="p-4">Weaknesses</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {filtered.map((c) => {
              const displayName = c.name || (c.first_name ? `${c.first_name} ${c.last_name}` : 'Unknown Candidate');
              const fitScore = c.fit_score ?? c.overall_fit ?? c.score ?? 0;
              const rawStrengths = getBaseTags(c.skills || c.strengths);
              const rawWeaknesses = getBaseTags(c.weaknesses || c.weekness);
              let strengthTags = rawStrengths.slice(0, 2);
              let weaknessTags = rawWeaknesses.filter(tag => !strengthTags.includes(tag)).slice(0, 2);

              return (
                <tr key={c.id} className="hover:bg-slate-700/20 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-sm">{displayName}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 group-hover:text-blue-400 transition-colors">
                      <Mail size={10}/> {c.email || 'No email'}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="text-[11px] font-bold text-slate-300">{c.role || "Full Stack AI"}</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-tighter">Verified Role</div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${fitScore >= 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {fitScore}/5
                      </span>
                      <div className="h-1 w-10 bg-slate-900 rounded-full overflow-hidden">
                        <div className={`h-full ${fitScore >= 4 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${(fitScore / 5) * 100}%` }} />
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {strengthTags.length > 0 ? strengthTags.map((tag, i) => (
                        <span key={i} className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {tag === 'Experience' ? '+Experienced' : `+${tag}`}
                        </span>
                      )) : <span className="text-[9px] text-slate-600 italic">No match</span>}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {weaknessTags.length > 0 ? weaknessTags.map((tag, i) => (
                        <span key={i} className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-500/20">
                          {tag === 'Experience' ? '-Low Exp.' : `-No ${tag}`}
                        </span>
                      )) : <span className="text-[9px] text-slate-600 italic">None</span>}
                    </div>
                  </td>

                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                      c.status === 'Shortlisted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                      c.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-400/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {c.status || 'Pending'}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <select 
                        value={c.status || 'Pending'} 
                        onChange={(e) => onUpdateStatus(c.id, e.target.value)}
                        className="bg-slate-900 text-[11px] font-bold text-slate-300 border border-slate-600 rounded p-1.5 outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Shortlisted">Shortlist</option>
                        <option value="Rejected">Reject</option>
                      </select>
                      <button onClick={() => setSelectedCandidate(c)} className="p-1.5 bg-blue-600/10 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-all">
                        <Info size={16}/>
                      </button>
                      <a href={c.resume_link} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-700 text-slate-200 text-[11px] font-bold rounded hover:bg-slate-600 flex items-center gap-1 border border-slate-600">
                        <FileText size={12}/> Resume
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* POST JOB MODAL */}
      {isAddJobOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] backdrop-blur-md">
          <form onSubmit={handlePostJob} className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <button type="button" onClick={() => setIsAddJobOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24}/></button>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Briefcase className="text-blue-500"/> Post New Role</h2>
            <p className="text-xs text-slate-500 mb-8 font-medium">Add this job listing to the dynamic Applicant Portal.</p>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Job Designation</label>
                <input required className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 px-4 text-sm outline-none focus:border-blue-500"
                       placeholder="e.g. AI Automation Engineer" value={jobForm.role_name} 
                       onChange={e => setJobForm({...jobForm, role_name: e.target.value})}/>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Direct JD Link (Google Drive)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3.5 text-slate-600" size={16}/>
                  <input required className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                         placeholder="https://drive.google.com/..." value={jobForm.jd_link} 
                         onChange={e => setJobForm({...jobForm, jd_link: e.target.value})}/>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Keywords for UI Display</label>
                <div className="relative">
                  <Tags className="absolute left-3 top-3.5 text-slate-600" size={16}/>
                  <input className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                         placeholder="React, Python, n8n" value={jobForm.keywords} 
                         onChange={e => setJobForm({...jobForm, keywords: e.target.value})}/>
                </div>
              </div>
              <button type="submit" disabled={jobLoading} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
                {jobLoading ? <Loader2 className="animate-spin" size={18}/> : "Publish Job Role"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CANDIDATE INFO MODAL */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <div>
                <h3 className="text-xl font-bold">{selectedCandidate.name || `${selectedCandidate.first_name || ''} ${selectedCandidate.last_name || ''}`}</h3>
                <p className="text-sm text-blue-400">AI Deep Analysis • {selectedCandidate.role || 'General'}</p>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400"><X size={20}/></button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <section>
                <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Hiring Justification</h4>
                <div className="text-sm text-slate-300 leading-relaxed bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 italic">
                  "{selectedCandidate.justification || 'No justification analysis available.'}"
                </div>
              </section>
              <section>
                <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">Key Skills</h4>
                <div className="text-sm text-slate-400 leading-relaxed bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                  {selectedCandidate.skills || selectedCandidate.strengths || 'No skills recorded.'}
                </div>
              </section>
              <section>
                <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">Weaknesses Assessment</h4>
                <div className="text-sm text-slate-400 leading-relaxed bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                  {selectedCandidate.weaknesses || selectedCandidate.weekness || 'No weaknesses recorded.'}
                </div>
              </section>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                    <div className="text-[8px] font-black uppercase tracking-tighter text-amber-500">Risk Factor</div>
                    <div className="text-xs text-slate-400">{selectedCandidate.risk_factor || 'Not assessed.'}</div>
                 </div>
                 <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                    <div className="text-[8px] font-black uppercase tracking-tighter text-emerald-400">Reward Factor</div>
                    <div className="text-xs text-slate-400">{selectedCandidate.reward_factor || 'Not assessed.'}</div>
                 </div>
                 {/* RE-INSERTED: SOFT SKILLS AND JOB STABILITY */}
                 <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                    <div className="text-[8px] font-black uppercase tracking-tighter text-blue-400">Soft Skills</div>
                    <div className="text-xs text-slate-400">{selectedCandidate.soft_skills || 'N/A'}</div>
                 </div>
                 <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                    <div className="text-[8px] font-black uppercase tracking-tighter text-purple-400">Job Stability Score</div>
                    <div className="text-xs text-slate-400">{selectedCandidate.job_stability_score || '0'}/10</div>
                 </div>
              </div>

              <div className="pt-4 border-t border-slate-700/50">
                <a href={selectedCandidate.resume_link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-slate-700 text-blue-400 text-xs font-bold rounded-xl border border-blue-500/20 transition-all">
                   <FileText size={14}/> View Full Candidate Resume
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recruiter;








// import React, { useMemo, useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import { 
//   Search, LogOut, Users, Mail, Info, X, FileText, Plus, Briefcase, Link as LinkIcon, Tags, Loader2, ChevronDown
// } from 'lucide-react';
// import toast from 'react-hot-toast';

// // --- THE ENGINE ---
// const getBaseTags = (text) => {
//   if (!text || text === 'NULL' || text.trim() === '') return [];
//   if (text.includes(',')) {
//     return text.split(',').map(s => s.trim().charAt(0).toUpperCase() + s.trim().slice(1)).filter(s => s.length > 0);
//   }
//   const lower = text.toLowerCase();
//   let tags = [];
//   if (lower.includes('full stack') || lower.includes('full-stack') || lower.includes('fullstack')) tags.push('Full Stack');
//   if (lower.includes('python')) tags.push('Python');
//   if (lower.includes('javascript') || lower.includes(' js ') || lower.includes('javascript-based')) tags.push('JavaScript');
//   if (lower.includes('react')) tags.push('React');
//   if (lower.includes('vector')) tags.push('Vector DB');
//   if (lower.includes('database') || lower.includes('sql')) tags.push('Database');
//   if (lower.includes('experience') || lower.includes('years') || lower.includes('seniority')) tags.push('Experience');
//   if (tags.length === 0) {
//     const clean = text.replace(/[^a-zA-Z\s]/g, '').toLowerCase();
//     const ignore = [
//       'the','and','with','for','that','this','lack','lacks','significant',
//       'required','explicit','proficiency','based','foundational','development',
//       'have','has','are','not','but','from','they','their','of','in','to','a',
//       'most','strong','demonstration','understanding','proficient','knowledge',
//       'working','skills','using','good','very','some','any','about','more'
//     ];
//     const words = clean.split(/\s+/).filter(w => w.length > 4 && !ignore.includes(w));
//     if(words.length > 0) tags.push(words[0].charAt(0).toUpperCase() + words[0].slice(1));
//   }
//   return [...new Set(tags)];
// };

// const Recruiter = () => {
//   const { user, logout } = useAuth();
//   const [candidates, setCandidates] = useState([]);
//   const [activeJobs, setActiveJobs] = useState([]); // For role filtering
//   const [filters, setFilters] = useState({ status: 'All', role: 'All' });
//   const [q, setQ] = useState('');
//   const [selectedCandidate, setSelectedCandidate] = useState(null);
//   const [isAddJobOpen, setIsAddJobOpen] = useState(false);
//   const [jobLoading, setJobLoading] = useState(false);
//   const [jobForm, setJobForm] = useState({ role_name: '', jd_link: '', keywords: '' });

//   const fetchData = async () => {
//     try {
//       const [candRes, jobsRes] = await Promise.all([
//         axios.get("http://localhost:8000/candidates/"),
//         axios.get("http://localhost:8000/jobs")
//       ]);
//       setCandidates(candRes.data);
//       setActiveJobs(jobsRes.data);
//     } catch (err) {
//       toast.error("Data synchronization failed");
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const filtered = useMemo(() => {
//     return candidates.filter(c => {
//       if (filters.status !== 'All' && c.status !== filters.status) return false;
//       if (filters.role !== 'All' && c.role !== filters.role) return false;
//       const displayName = c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim();
//       if (q && !(displayName.toLowerCase().includes(q.toLowerCase()) || (c.email || '').toLowerCase().includes(q.toLowerCase()))) return false;
//       return true;
//     });
//   }, [candidates, filters, q]);

//   const onUpdateStatus = async (id, newStatus) => {
//     try {
//       await axios.patch(`http://localhost:8000/candidates/${id}/status`, { status: newStatus });
//       setCandidates(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
//       toast.success(`Candidate marked as ${newStatus}`);
//     } catch (err) {
//       toast.error("Database update failed");
//     }
//   };

//   const handlePostJob = async (e) => {
//     e.preventDefault();
//     setJobLoading(true);
//     try {
//       await axios.post("http://localhost:8000/jobs", jobForm);
//       toast.success("Job Posted Successfully!");
//       setIsAddJobOpen(false);
//       setJobForm({ role_name: '', jd_link: '', keywords: '' });
//       fetchData(); // Refresh jobs list
//     } catch (err) {
//       toast.error(err.response?.data?.detail || "Failed to post job");
//     } finally {
//       setJobLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
//       {/* Header */}
//       <header className="flex justify-between items-center mb-8">
//         <h1 className="text-2xl font-bold flex items-center gap-2">
//           <Users className="text-blue-500" /> Recruiter Dashboard
//         </h1>
//         <div className="flex items-center gap-4">
//           <button 
//             onClick={() => setIsAddJobOpen(true)}
//             className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20"
//           >
//             <Plus size={18}/> Post Job
//           </button>
//           <div className="relative">
//             <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
//             <input 
//               value={q} onChange={e => setQ(e.target.value)} 
//               placeholder="Search name or email" 
//               className="pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm w-64 outline-none focus:border-blue-500 transition-all" 
//             />
//           </div>
//           <button onClick={logout} className="p-2 bg-slate-800 hover:bg-red-900/20 text-red-400 rounded-lg border border-slate-700 transition-all">
//             <LogOut size={18}/>
//           </button>
//         </div>
//       </header>

//       {/* Role Filter & Status Tabs */}
//       <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
//         <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
//           {["All", "Pending", "Shortlisted", "Rejected"].map(status => (
//             <button 
//               key={status}
//               onClick={() => setFilters({...filters, status})}
//               className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
//                 filters.status === status ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
//               }`}
//             >
//               {status}
//             </button>
//           ))}
//         </div>

//         <div className="flex items-center gap-3">
//            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block">Filter by Job Role</div>
//            <div className="relative">
//              <select 
//                value={filters.role}
//                onChange={(e) => setFilters({...filters, role: e.target.value})}
//                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-300 outline-none focus:border-blue-500 appearance-none pr-10 cursor-pointer min-w-[200px]"
//              >
//                <option value="All">All Roles</option>
//                {activeJobs.map(job => (
//                  <option key={job.id} value={job.role_name}>{job.role_name}</option>
//                ))}
//              </select>
//              <ChevronDown className="absolute right-3 top-2.5 text-slate-500 pointer-events-none" size={16}/>
//            </div>
//         </div>
//       </div>

//       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
//         <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//            <span className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">Applicant Manifest</span>
//           <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">
//             {filtered.length} Matching Applications
//           </div>
//         </div>

//         <table className="w-full text-left">
//           <thead>
//             <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-700/50">
//               <th className="p-4">Candidate</th>
//               <th className="p-4">Applied Role</th>
//               <th className="p-4">AI Fit</th>
//               <th className="p-4">Key Skills</th>
//               <th className="p-4">Weaknesses</th>
//               <th className="p-4">Status</th>
//               <th className="p-4 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-700/30">
//             {filtered.map((c) => {
//               const displayName = c.name || (c.first_name ? `${c.first_name} ${c.last_name}` : 'Unknown Candidate');
//               const fitScore = c.fit_score ?? c.overall_fit ?? c.score ?? 0;
//               const rawStrengths = getBaseTags(c.skills || c.strengths);
//               const rawWeaknesses = getBaseTags(c.weaknesses || c.weekness);
//               let strengthTags = rawStrengths.slice(0, 2);
//               let weaknessTags = rawWeaknesses.filter(tag => !strengthTags.includes(tag)).slice(0, 2);

//               return (
//                 <tr key={c.id} className="hover:bg-slate-700/20 transition-colors group">
//                   <td className="p-4">
//                     <div className="font-bold text-sm">{displayName}</div>
//                     <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 group-hover:text-blue-400 transition-colors">
//                       <Mail size={10}/> {c.email || 'No email'}
//                     </div>
//                   </td>

//                   <td className="p-4">
//                     <div className="text-[11px] font-bold text-slate-300">{c.role || "Full Stack AI"}</div>
//                     <div className="text-[9px] text-slate-500 uppercase tracking-tighter">Verified Role</div>
//                   </td>
                  
//                   <td className="p-4">
//                     <div className="flex items-center gap-2">
//                       <span className={`text-sm font-black ${fitScore >= 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
//                         {fitScore}/5
//                       </span>
//                       <div className="h-1 w-10 bg-slate-900 rounded-full overflow-hidden">
//                         <div className={`h-full ${fitScore >= 4 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${(fitScore / 5) * 100}%` }} />
//                       </div>
//                     </div>
//                   </td>

//                   <td className="p-4">
//                     <div className="flex flex-wrap gap-1.5">
//                       {strengthTags.length > 0 ? strengthTags.map((tag, i) => (
//                         <span key={i} className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20">
//                           {tag === 'Experience' ? '+Experienced' : `+${tag}`}
//                         </span>
//                       )) : <span className="text-[9px] text-slate-600 italic">No match</span>}
//                     </div>
//                   </td>

//                   <td className="p-4">
//                     <div className="flex flex-wrap gap-1.5">
//                       {weaknessTags.length > 0 ? weaknessTags.map((tag, i) => (
//                         <span key={i} className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-500/20">
//                           {tag === 'Experience' ? '-Low Exp.' : `-No ${tag}`}
//                         </span>
//                       )) : <span className="text-[9px] text-slate-600 italic">None</span>}
//                     </div>
//                   </td>

//                   <td className="p-4">
//                     <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
//                       c.status === 'Shortlisted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
//                       c.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-400/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
//                     }`}>
//                       {c.status || 'Pending'}
//                     </span>
//                   </td>

//                   <td className="p-4">
//                     <div className="flex items-center justify-center gap-2">
//                       <select 
//                         value={c.status || 'Pending'} 
//                         onChange={(e) => onUpdateStatus(c.id, e.target.value)}
//                         className="bg-slate-900 text-[11px] font-bold text-slate-300 border border-slate-600 rounded p-1.5 outline-none focus:border-blue-500 cursor-pointer"
//                       >
//                         <option value="Pending">Pending</option>
//                         <option value="Shortlisted">Shortlist</option>
//                         <option value="Rejected">Reject</option>
//                       </select>
//                       <button onClick={() => setSelectedCandidate(c)} className="p-1.5 bg-blue-600/10 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-all">
//                         <Info size={16}/>
//                       </button>
//                       <a href={c.resume_link} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-700 text-slate-200 text-[11px] font-bold rounded hover:bg-slate-600 flex items-center gap-1 border border-slate-600">
//                         <FileText size={12}/> Resume
//                       </a>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* POST JOB MODAL */}
//       {isAddJobOpen && (
//         <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] backdrop-blur-md">
//           <form onSubmit={handlePostJob} className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
//             <button type="button" onClick={() => setIsAddJobOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24}/></button>
//             <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Briefcase className="text-blue-500"/> Post New Role</h2>
//             <p className="text-xs text-slate-500 mb-8 font-medium">Add this job listing to the dynamic Applicant Portal.</p>
            
//             <div className="space-y-5">
//               <div className="space-y-2">
//                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Job Designation</label>
//                 <input required className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 px-4 text-sm outline-none focus:border-blue-500"
//                        placeholder="e.g. AI Automation Engineer" value={jobForm.role_name} 
//                        onChange={e => setJobForm({...jobForm, role_name: e.target.value})}/>
//               </div>
//               <div className="space-y-2">
//                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Direct JD Link (Google Drive)</label>
//                 <div className="relative">
//                   <LinkIcon className="absolute left-3 top-3.5 text-slate-600" size={16}/>
//                   <input required className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
//                          placeholder="https://drive.google.com/..." value={jobForm.jd_link} 
//                          onChange={e => setJobForm({...jobForm, jd_link: e.target.value})}/>
//                 </div>
//               </div>
//               <div className="space-y-2">
//                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Keywords for UI Display</label>
//                 <div className="relative">
//                   <Tags className="absolute left-3 top-3.5 text-slate-600" size={16}/>
//                   <input className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
//                          placeholder="React, Python, n8n" value={jobForm.keywords} 
//                          onChange={e => setJobForm({...jobForm, keywords: e.target.value})}/>
//                 </div>
//               </div>
//               <button type="submit" disabled={jobLoading} className="w-full bg-blue-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
//                 {jobLoading ? <Loader2 className="animate-spin" size={18}/> : "Publish Job Role"}
//               </button>
//             </div>
//           </form>
//         </div>
//       )}

//       {/* CANDIDATE INFO MODAL */}
//       {selectedCandidate && (
//         <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
//           <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
//             <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//               <div>
//                 <h3 className="text-xl font-bold">{selectedCandidate.name || `${selectedCandidate.first_name || ''} ${selectedCandidate.last_name || ''}`}</h3>
//                 <p className="text-sm text-blue-400">AI Deep Analysis • {selectedCandidate.role || 'General'}</p>
//               </div>
//               <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400"><X size={20}/></button>
//             </div>
            
//             <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
//               <section>
//                 <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Hiring Justification</h4>
//                 <div className="text-sm text-slate-300 leading-relaxed bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 italic">
//                   "{selectedCandidate.justification || 'No justification analysis available.'}"
//                 </div>
//               </section>
//               <section>
//                 <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">Key Skills</h4>
//                 <div className="text-sm text-slate-400 leading-relaxed bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
//                   {selectedCandidate.skills || selectedCandidate.strengths || 'No skills recorded.'}
//                 </div>
//               </section>
//               <section>
//                 <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">Weaknesses Assessment</h4>
//                 <div className="text-sm text-slate-400 leading-relaxed bg-red-500/5 p-4 rounded-xl border border-red-500/10">
//                   {selectedCandidate.weaknesses || selectedCandidate.weekness || 'No weaknesses recorded.'}
//                 </div>
//               </section>
              
//               <div className="grid grid-cols-2 gap-4">
//                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
//                     <div className="text-[8px] font-black uppercase tracking-tighter text-amber-500">Risk Factor</div>
//                     <div className="text-xs text-slate-400">{selectedCandidate.risk_factor || 'Not assessed.'}</div>
//                  </div>
//                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
//                     <div className="text-[8px] font-black uppercase tracking-tighter text-emerald-400">Reward Factor</div>
//                     <div className="text-xs text-slate-400">{selectedCandidate.reward_factor || 'Not assessed.'}</div>
//                  </div>
//                  {/* RE-INSERTED: SOFT SKILLS AND JOB STABILITY */}
//                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
//                     <div className="text-[8px] font-black uppercase tracking-tighter text-blue-400">Soft Skills</div>
//                     <div className="text-xs text-slate-400">{selectedCandidate.soft_skills || 'N/A'}</div>
//                  </div>
//                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
//                     <div className="text-[8px] font-black uppercase tracking-tighter text-purple-400">Job Stability Score</div>
//                     <div className="text-xs text-slate-400">{selectedCandidate.job_stability_score || '0'}/10</div>
//                  </div>
//               </div>

//               <div className="pt-4 border-t border-slate-700/50">
//                 <a href={selectedCandidate.resume_link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-slate-700 text-blue-400 text-xs font-bold rounded-xl border border-blue-500/20 transition-all">
//                    <FileText size={14}/> View Full Candidate Resume
//                 </a>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Recruiter;










// import React, { useMemo, useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import { 
//   Search, LogOut, Users, Mail, Info, X, FileText
// } from 'lucide-react';
// import toast from 'react-hot-toast';

// // --- THE ENGINE ---
// const getBaseTags = (text) => {
//   if (!text || text === 'NULL' || text.trim() === '') return [];
  
//   // If the DB sends a clean comma-separated list for skills (e.g., "Python, React, SQL")
//   if (text.includes(',')) {
//     return text.split(',').map(s => s.trim().charAt(0).toUpperCase() + s.trim().slice(1)).filter(s => s.length > 0);
//   }

//   const lower = text.toLowerCase();
//   let tags = [];

//   if (lower.includes('full stack') || lower.includes('full-stack') || lower.includes('fullstack')) tags.push('Full Stack');
//   if (lower.includes('python')) tags.push('Python');
//   if (lower.includes('javascript') || lower.includes(' js ') || lower.includes('javascript-based')) tags.push('JavaScript');
//   if (lower.includes('react')) tags.push('React');
//   if (lower.includes('vector')) tags.push('Vector DB');
//   if (lower.includes('database') || lower.includes('sql')) tags.push('Database');
  
//   if (lower.includes('experience') || lower.includes('years') || lower.includes('seniority')) tags.push('Experience');

//   if (tags.length === 0) {
//     const clean = text.replace(/[^a-zA-Z\s]/g, '').toLowerCase();
//     const ignore = [
//       'the','and','with','for','that','this','lack','lacks','significant',
//       'required','explicit','proficiency','based','foundational','development',
//       'have','has','are','not','but','from','they','their','of','in','to','a',
//       'most','strong','demonstration','understanding','proficient','knowledge',
//       'working','skills','using','good','very','some','any','about','more'
//     ];
//     const words = clean.split(/\s+/).filter(w => w.length > 4 && !ignore.includes(w));
//     if(words.length > 0) tags.push(words[0].charAt(0).toUpperCase() + words[0].slice(1));
//   }
//   return [...new Set(tags)];
// };

// const Recruiter = () => {
//   const { user, logout } = useAuth();
//   const [candidates, setCandidates] = useState([]);
//   const [filters, setFilters] = useState({ status: 'All' });
//   const [q, setQ] = useState('');
//   const [selectedCandidate, setSelectedCandidate] = useState(null);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         const res = await axios.get("http://localhost:8000/candidates/");
//         setCandidates(res.data);
//       } catch (err) {
//         toast.error("Database connection failed");
//       }
//     };
//     fetchCandidates();
//   }, []);

//   const filtered = useMemo(() => {
//     return candidates.filter(c => {
//       if (filters.status !== 'All' && c.status !== filters.status) return false;
//       const displayName = c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim();
//       if (q && !(displayName.toLowerCase().includes(q.toLowerCase()) || (c.email || '').toLowerCase().includes(q.toLowerCase()))) return false;
//       return true;
//     });
//   }, [candidates, filters, q]);

// const onUpdateStatus = async (id, newStatus) => {
//   try {
//     // This matches your backend: /candidates/{c_id}/status
//     await axios.patch(`http://localhost:8000/candidates/${id}/status`, {
//       status: newStatus // Your backend uses .get('status')
//     });

//     // Update the UI state
//     setCandidates(prev => prev.map(p => 
//       p.id === id ? { ...p, status: newStatus } : p
//     ));

//     toast.success(`Candidate marked as ${newStatus}`);
//   } catch (err) {
//     toast.error("Database update failed");
//   }
// };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
//       {/* Header */}
//       <header className="flex justify-between items-center mb-8">
//         <h1 className="text-2xl font-bold flex items-center gap-2">
//           <Users className="text-blue-500" /> Recruiter Dashboard
//         </h1>
//         <div className="flex items-center gap-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
//             <input 
//               value={q} onChange={e => setQ(e.target.value)} 
//               placeholder="Search name or email" 
//               className="pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm w-64 outline-none focus:border-blue-500 transition-all" 
//             />
//           </div>
//           <button onClick={logout} className="p-2 bg-slate-800 hover:bg-red-900/20 text-red-400 rounded-lg border border-slate-700 transition-all">
//             <LogOut size={18}/>
//           </button>
//         </div>
//       </header>

//       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
//         <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//           <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-700">
//             {["All", "Pending", "Shortlisted", "Rejected"].map(status => (
//               <button 
//                 key={status}
//                 onClick={() => setFilters({...filters, status})}
//                 className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
//                   filters.status === status ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
//                 }`}
//               >
//                 {status}
//               </button>
//             ))}
//           </div>
//           <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">
//             {filtered.length} Candidates
//           </div>
//         </div>

//         <table className="w-full text-left">
//           <thead>
//             <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-700/50">
//               <th className="p-4">Candidate</th>
//               <th className="p-4">Date</th>
//               <th className="p-4">AI Fit</th>
//               <th className="p-4">Key Skills</th>
//               <th className="p-4">Weaknesses</th>
//               <th className="p-4">Status</th>
//               <th className="p-4 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-700/30">
//             {filtered.map((c) => {
//               const displayName = c.name || (c.first_name ? `${c.first_name} ${c.last_name}` : 'Unknown Candidate');
//               const fitScore = c.fit_score ?? c.overall_fit ?? c.score ?? 0;
//               const shortDate = c.upload_date ? new Date(c.upload_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A';

//               const rawStrengths = getBaseTags(c.skills || c.strengths);
//               const rawWeaknesses = getBaseTags(c.weaknesses || c.weekness);

//               let strengthTags = rawStrengths.slice(0, 2);
//               let weaknessTags = rawWeaknesses.filter(tag => !strengthTags.includes(tag));

//               if (weaknessTags.length === 0 && rawWeaknesses.length > 0) weaknessTags = ['Needs Details'];
//               if (strengthTags.length === 0) strengthTags = ['N/A'];
//               if (weaknessTags.length === 0) weaknessTags = ['N/A'];
              
//               weaknessTags = weaknessTags.slice(0, 2);

//               return (
//                 <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
//                   <td className="p-4">
//                     <div className="font-bold text-sm">{displayName}</div>
//                     <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
//                       <Mail size={10}/> {c.email || 'No email'}
//                     </div>
//                   </td>

//                   <td className="p-4 text-[10px] text-slate-500 font-medium">{shortDate}</td>
                  
//                   <td className="p-4">
//                     <div className="flex items-center gap-2">
//                       <span className={`text-sm font-black ${fitScore >= 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
//                         {fitScore}/5
//                       </span>
//                       <div className="h-1 w-10 bg-slate-900 rounded-full overflow-hidden">
//                         <div className={`h-full ${fitScore >= 4 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${(fitScore / 5) * 100}%` }} />
//                       </div>
//                     </div>
//                   </td>

//                   <td className="p-4">
//                     <div className="flex flex-wrap gap-1.5">
//                       {strengthTags.map((tag, i) => (
//                         <span key={i} className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20">
//                           {tag === 'Experience' ? '+Experienced' : `+${tag}`}
//                         </span>
//                       ))}
//                     </div>
//                   </td>

//                   <td className="p-4">
//                     <div className="flex flex-wrap gap-1.5">
//                       {weaknessTags.map((tag, i) => {
//                         let formattedText = `-Needs ${tag}`;
//                         if (tag === 'Experience') formattedText = '-Low Exp.';
//                         if (tag === 'Vector DB' || tag === 'Database') formattedText = `-No ${tag}`;
//                         if (tag === 'N/A' || tag === 'Needs Details') formattedText = `-${tag}`;
//                         return (
//                           <span key={i} className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-500/20">
//                             {formattedText}
//                           </span>
//                         );
//                       })}
//                     </div>
//                   </td>

//                   <td className="p-4">
//                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
//                       c.status === 'Shortlisted' ? 'bg-emerald-500/20 text-emerald-400' : 
//                       c.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
//                     }`}>
//                       {c.status || 'Pending'}
//                     </span>
//                   </td>

//                   <td className="p-4">
//                     <div className="flex items-center justify-center gap-2">
//                       <select 
//                         value={c.status || 'Pending'} 
//                         onChange={(e) => onUpdateStatus(c.id, e.target.value)}
//                         className="bg-slate-900 text-[11px] font-bold text-slate-300 border border-slate-600 rounded p-1.5 outline-none focus:border-blue-500 cursor-pointer"
//                       >
//                         <option value="Pending">Pending</option>
//                         <option value="Shortlisted">Shortlist</option>
//                         <option value="Rejected">Reject</option>
//                       </select>
//                       <button onClick={() => setSelectedCandidate(c)} className="p-1.5 bg-blue-600/10 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-all" title="AI Details">
//                         <Info size={16}/>
//                       </button>
//                       <a href={c.resume_link} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-700 text-slate-200 text-[11px] font-bold rounded hover:bg-slate-600 flex items-center gap-1 border border-slate-600">
//                         <FileText size={12}/> Resume
//                       </a>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {selectedCandidate && (
//         <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
//           <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
//             <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//               <div>
//                 <h3 className="text-xl font-bold">
//                   {selectedCandidate.name || `${selectedCandidate.first_name || ''} ${selectedCandidate.last_name || ''}`}
//                 </h3>
//                 <p className="text-sm text-blue-400">AI Deep Analysis</p>
//               </div>
//               <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-all"><X size={20}/></button>
//             </div>
            
//             <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
//               <section>
//                 <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Hiring Justification</h4>
//                 <div className="text-sm text-slate-300 leading-relaxed bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 italic">
//                   "{selectedCandidate.justification || 'No justification analysis available.'}"
//                 </div>
//               </section>

//               <section>
//                 <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">Key Skills</h4>
//                 <div className="text-sm text-slate-400 leading-relaxed bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
//                   {selectedCandidate.skills || selectedCandidate.strengths || 'No skills recorded.'}
//                 </div>
//               </section>

//               <section>
//                 <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">Weaknesses Assessment</h4>
//                 <div className="text-sm text-slate-400 leading-relaxed bg-red-500/5 p-4 rounded-xl border border-red-500/10">
//                   {selectedCandidate.weaknesses || selectedCandidate.weekness || 'No weaknesses recorded.'}
//                 </div>
//               </section>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <section>
//                   <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2">Risk Factor</h4>
//                   <div className="text-sm text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
//                     {selectedCandidate.risk_factor || 'Not assessed.'}
//                   </div>
//                 </section>
//                 <section>
//                   <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">Reward Factor</h4>
//                   <div className="text-sm text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
//                     {selectedCandidate.reward_factor || 'Not assessed.'}
//                   </div>
//                 </section>
//                 <section>
//                   <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Soft Skills</h4>
//                   <div className="text-sm text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
//                     {selectedCandidate.soft_skills || 'N/A'}
//                   </div>
//                 </section>
//                 <section>
//                   <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2">Job Stability Score</h4>
//                   <div className="text-sm text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
//                     {selectedCandidate.job_stability_score || '0'}/10
//                   </div>
//                 </section>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Recruiter;

// import React, { useMemo, useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import { 
//   Search, LogOut, Users, Mail, Info, X, FileText
// } from 'lucide-react';
// import toast from 'react-hot-toast';

// // --- THE ENGINE ---
// const getBaseTags = (text) => {
//   if (!text || text === 'NULL' || text.trim() === '') return [];
  
//   // If the DB sends a clean comma-separated list for skills (e.g., "Python, React, SQL")
//   if (text.includes(',')) {
//     return text.split(',').map(s => s.trim().charAt(0).toUpperCase() + s.trim().slice(1)).filter(s => s.length > 0);
//   }

//   const lower = text.toLowerCase();
//   let tags = [];

//   if (lower.includes('full stack') || lower.includes('full-stack') || lower.includes('fullstack')) tags.push('Full Stack');
//   if (lower.includes('python')) tags.push('Python');
//   if (lower.includes('javascript') || lower.includes(' js ') || lower.includes('javascript-based')) tags.push('JavaScript');
//   if (lower.includes('react')) tags.push('React');
//   if (lower.includes('vector')) tags.push('Vector DB');
//   if (lower.includes('database') || lower.includes('sql')) tags.push('Database');
  
//   if (lower.includes('experience') || lower.includes('years') || lower.includes('seniority')) tags.push('Experience');

//   if (tags.length === 0) {
//     const clean = text.replace(/[^a-zA-Z\s]/g, '').toLowerCase();
//     const ignore = [
//       'the','and','with','for','that','this','lack','lacks','significant',
//       'required','explicit','proficiency','based','foundational','development',
//       'have','has','are','not','but','from','they','their','of','in','to','a',
//       'most','strong','demonstration','understanding','proficient','knowledge',
//       'working','skills','using','good','very','some','any','about','more'
//     ];
//     const words = clean.split(/\s+/).filter(w => w.length > 4 && !ignore.includes(w));
//     if(words.length > 0) tags.push(words[0].charAt(0).toUpperCase() + words[0].slice(1));
//   }
//   return [...new Set(tags)];
// };

// const Recruiter = () => {
//   const { user, logout } = useAuth();
//   const [candidates, setCandidates] = useState([]);
//   const [filters, setFilters] = useState({ status: 'All' });
//   const [q, setQ] = useState('');
//   const [selectedCandidate, setSelectedCandidate] = useState(null);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         const res = await axios.get("http://localhost:8000/candidates/");
//         setCandidates(res.data);
//       } catch (err) {
//         toast.error("Database connection failed");
//       }
//     };
//     fetchCandidates();
//   }, []);

//   const filtered = useMemo(() => {
//     return candidates.filter(c => {
//       if (filters.status !== 'All' && c.status !== filters.status) return false;
//       const displayName = c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim();
//       if (q && !(displayName.toLowerCase().includes(q.toLowerCase()) || (c.email || '').toLowerCase().includes(q.toLowerCase()))) return false;
//       return true;
//     });
//   }, [candidates, filters, q]);

//   const onUpdateStatus = (id, status) => {
//     setCandidates(prev => prev.map(p => p.id === id ? { ...p, status } : p));
//     toast.success(`Candidate marked as ${status}`);
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
//       {/* Header */}
//       <header className="flex justify-between items-center mb-8">
//         <h1 className="text-2xl font-bold flex items-center gap-2">
//           <Users className="text-blue-500" /> Recruiter Dashboard
//         </h1>
//         <div className="flex items-center gap-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
//             <input 
//               value={q} onChange={e => setQ(e.target.value)} 
//               placeholder="Search name or email" 
//               className="pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm w-64 outline-none focus:border-blue-500 transition-all" 
//             />
//           </div>
//           <button onClick={logout} className="p-2 bg-slate-800 hover:bg-red-900/20 text-red-400 rounded-lg border border-slate-700 transition-all">
//             <LogOut size={18}/>
//           </button>
//         </div>
//       </header>

//       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
//         <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//           <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-700">
//             {["All", "Pending", "Shortlisted", "Rejected"].map(status => (
//               <button 
//                 key={status}
//                 onClick={() => setFilters({...filters, status})}
//                 className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
//                   filters.status === status ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
//                 }`}
//               >
//                 {status}
//               </button>
//             ))}
//           </div>
//           <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">
//             {filtered.length} Candidates
//           </div>
//         </div>

//         <table className="w-full text-left">
//           <thead>
//             <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-700/50">
//               <th className="p-4">Candidate</th>
//               <th className="p-4">Date</th>
//               <th className="p-4">AI Fit</th>
//               <th className="p-4">Key Skills</th>
//               <th className="p-4">Weaknesses</th>
//               <th className="p-4">Status</th>
//               <th className="p-4 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-700/30">
//             {filtered.map((c) => {
//               const displayName = c.name || (c.first_name ? `${c.first_name} ${c.last_name}` : 'Unknown Candidate');
//               const fitScore = c.fit_score ?? c.overall_fit ?? c.score ?? 0;
//               const shortDate = c.upload_date ? new Date(c.upload_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A';

//               const rawStrengths = getBaseTags(c.skills || c.strengths);
//               const rawWeaknesses = getBaseTags(c.weaknesses || c.weekness);

//               let strengthTags = rawStrengths.slice(0, 2);
//               let weaknessTags = rawWeaknesses.filter(tag => !strengthTags.includes(tag));

//               if (weaknessTags.length === 0 && rawWeaknesses.length > 0) weaknessTags = ['Needs Details'];
//               if (strengthTags.length === 0) strengthTags = ['N/A'];
//               if (weaknessTags.length === 0) weaknessTags = ['N/A'];
              
//               weaknessTags = weaknessTags.slice(0, 2);

//               return (
//                 <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
//                   <td className="p-4">
//                     <div className="font-bold text-sm">{displayName}</div>
//                     <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
//                       <Mail size={10}/> {c.email || 'No email'}
//                     </div>
//                   </td>

//                   <td className="p-4 text-[10px] text-slate-500 font-medium">{shortDate}</td>
                  
//                   <td className="p-4">
//                     <div className="flex items-center gap-2">
//                       <span className={`text-sm font-black ${fitScore >= 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
//                         {fitScore}/5
//                       </span>
//                       <div className="h-1 w-10 bg-slate-900 rounded-full overflow-hidden">
//                         <div className={`h-full ${fitScore >= 4 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${(fitScore / 5) * 100}%` }} />
//                       </div>
//                     </div>
//                   </td>

//                   <td className="p-4">
//                     <div className="flex flex-wrap gap-1.5">
//                       {strengthTags.map((tag, i) => (
//                         <span key={i} className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20">
//                           {tag === 'Experience' ? '+Experienced' : `+${tag}`}
//                         </span>
//                       ))}
//                     </div>
//                   </td>

//                   <td className="p-4">
//                     <div className="flex flex-wrap gap-1.5">
//                       {weaknessTags.map((tag, i) => {
//                         let formattedText = `-Needs ${tag}`;
//                         if (tag === 'Experience') formattedText = '-Low Exp.';
//                         if (tag === 'Vector DB' || tag === 'Database') formattedText = `-No ${tag}`;
//                         if (tag === 'N/A' || tag === 'Needs Details') formattedText = `-${tag}`;
//                         return (
//                           <span key={i} className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-500/20">
//                             {formattedText}
//                           </span>
//                         );
//                       })}
//                     </div>
//                   </td>

//                   <td className="p-4">
//                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
//                       c.status === 'Shortlisted' ? 'bg-emerald-500/20 text-emerald-400' : 
//                       c.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
//                     }`}>
//                       {c.status || 'Pending'}
//                     </span>
//                   </td>

//                   <td className="p-4">
//                     <div className="flex items-center justify-center gap-2">
//                       <select 
//                         value={c.status || 'Pending'} 
//                         onChange={(e) => onUpdateStatus(c.id, e.target.value)}
//                         className="bg-slate-900 text-[11px] font-bold text-slate-300 border border-slate-600 rounded p-1.5 outline-none focus:border-blue-500 cursor-pointer"
//                       >
//                         <option value="Pending">Pending</option>
//                         <option value="Shortlisted">Shortlist</option>
//                         <option value="Rejected">Reject</option>
//                       </select>
//                       <button onClick={() => setSelectedCandidate(c)} className="p-1.5 bg-blue-600/10 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-all" title="AI Details">
//                         <Info size={16}/>
//                       </button>
//                       <a href={c.resume_link} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-700 text-slate-200 text-[11px] font-bold rounded hover:bg-slate-600 flex items-center gap-1 border border-slate-600">
//                         <FileText size={12}/> Resume
//                       </a>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {selectedCandidate && (
//         <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
//           <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
//             <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//               <div>
//                 <h3 className="text-xl font-bold">
//                   {selectedCandidate.name || `${selectedCandidate.first_name || ''} ${selectedCandidate.last_name || ''}`}
//                 </h3>
//                 <p className="text-sm text-blue-400">AI Deep Analysis</p>
//               </div>
//               <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-all"><X size={20}/></button>
//             </div>
            
//             <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
//               <section>
//                 <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">Key Skills</h4>
//                 <div className="text-sm text-slate-400 leading-relaxed bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
//                   {selectedCandidate.skills || selectedCandidate.strengths || 'No skills recorded.'}
//                 </div>
//               </section>

//               <section>
//                 <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">Weaknesses Assessment</h4>
//                 <div className="text-sm text-slate-400 leading-relaxed bg-red-500/5 p-4 rounded-xl border border-red-500/10">
//                   {selectedCandidate.weaknesses || selectedCandidate.weekness || 'No weaknesses recorded.'}
//                 </div>
//               </section>

//               {/* NEW ADDITIONS: Risk, Reward, Soft Skills, Job Stability */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <section>
//                   <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2">Risk Factor</h4>
//                   <div className="text-sm text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
//                     {selectedCandidate.risk_factor || 'Not assessed.'}
//                   </div>
//                 </section>
//                 <section>
//                   <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">Reward Factor</h4>
//                   <div className="text-sm text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
//                     {selectedCandidate.reward_factor || 'Not assessed.'}
//                   </div>
//                 </section>
//                 <section>
//                   <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Soft Skills</h4>
//                   <div className="text-sm text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
//                     {selectedCandidate.soft_skills || 'N/A'}
//                   </div>
//                 </section>
//                 <section>
//                   <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2">Job Stability Score</h4>
//                   <div className="text-sm text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
//                     {selectedCandidate.job_stability_score || '0'}/10
//                   </div>
//                 </section>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Recruiter;
// import React, { useMemo, useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import { 
//   Search, LogOut, Users, Mail, Info, X, FileText
// } from 'lucide-react';
// import toast from 'react-hot-toast';

// // --- THE ENGINE ---
// const getBaseTags = (text) => {
//   if (!text || text === 'NULL' || text.trim() === '') return [];
  
//   // If the DB sends a clean comma-separated list for skills (e.g., "Python, React, SQL")
//   if (text.includes(',')) {
//     return text.split(',').map(s => s.trim().charAt(0).toUpperCase() + s.trim().slice(1)).filter(s => s.length > 0);
//   }

//   const lower = text.toLowerCase();
//   let tags = [];

//   if (lower.includes('full stack') || lower.includes('full-stack') || lower.includes('fullstack')) tags.push('Full Stack');
//   if (lower.includes('python')) tags.push('Python');
//   if (lower.includes('javascript') || lower.includes(' js ') || lower.includes('javascript-based')) tags.push('JavaScript');
//   if (lower.includes('react')) tags.push('React');
//   if (lower.includes('vector')) tags.push('Vector DB');
//   if (lower.includes('database') || lower.includes('sql')) tags.push('Database');
  
//   if (lower.includes('experience') || lower.includes('years') || lower.includes('seniority')) tags.push('Experience');

//   if (tags.length === 0) {
//     const clean = text.replace(/[^a-zA-Z\s]/g, '').toLowerCase();
//     const ignore = [
//       'the','and','with','for','that','this','lack','lacks','significant',
//       'required','explicit','proficiency','based','foundational','development',
//       'have','has','are','not','but','from','they','their','of','in','to','a',
//       'most','strong','demonstration','understanding','proficient','knowledge',
//       'working','skills','using','good','very','some','any','about','more'
//     ];
//     const words = clean.split(/\s+/).filter(w => w.length > 4 && !ignore.includes(w));
//     if(words.length > 0) tags.push(words[0].charAt(0).toUpperCase() + words[0].slice(1));
//   }
//   return [...new Set(tags)];
// };

// const Recruiter = () => {
//   const { user, logout } = useAuth();
//   const [candidates, setCandidates] = useState([]);
//   const [filters, setFilters] = useState({ status: 'All' });
//   const [q, setQ] = useState('');
//   const [selectedCandidate, setSelectedCandidate] = useState(null);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         const res = await axios.get("http://localhost:8000/candidates/");
//         setCandidates(res.data);
//       } catch (err) {
//         toast.error("Database connection failed");
//       }
//     };
//     fetchCandidates();
//   }, []);

//   const filtered = useMemo(() => {
//     return candidates.filter(c => {
//       if (filters.status !== 'All' && c.status !== filters.status) return false;
//       const displayName = c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim();
//       if (q && !(displayName.toLowerCase().includes(q.toLowerCase()) || (c.email || '').toLowerCase().includes(q.toLowerCase()))) return false;
//       return true;
//     });
//   }, [candidates, filters, q]);

//   const onUpdateStatus = (id, status) => {
//     setCandidates(prev => prev.map(p => p.id === id ? { ...p, status } : p));
//     toast.success(`Candidate marked as ${status}`);
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
//       {/* Header */}
//       <header className="flex justify-between items-center mb-8">
//         <h1 className="text-2xl font-bold flex items-center gap-2">
//           <Users className="text-blue-500" /> Recruiter Dashboard
//         </h1>
//         <div className="flex items-center gap-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
//             <input 
//               value={q} onChange={e => setQ(e.target.value)} 
//               placeholder="Search name or email" 
//               className="pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm w-64 outline-none focus:border-blue-500 transition-all" 
//             />
//           </div>
//           <button onClick={logout} className="p-2 bg-slate-800 hover:bg-red-900/20 text-red-400 rounded-lg border border-slate-700 transition-all">
//             <LogOut size={18}/>
//           </button>
//         </div>
//       </header>

//       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
//         <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//           <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-700">
//             {["All", "Pending", "Shortlisted", "Rejected"].map(status => (
//               <button 
//                 key={status}
//                 onClick={() => setFilters({...filters, status})}
//                 className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
//                   filters.status === status ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
//                 }`}
//               >
//                 {status}
//               </button>
//             ))}
//           </div>
//           <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">
//             {filtered.length} Candidates
//           </div>
//         </div>

//         <table className="w-full text-left">
//           <thead>
//             <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-700/50">
//               <th className="p-4">Candidate</th>
//               <th className="p-4">Date</th>
//               <th className="p-4">AI Fit</th>
//               <th className="p-4">Key Skills</th> {/* Renamed from Strengths */}
//               <th className="p-4">Weaknesses</th>
//               <th className="p-4">Status</th>
//               <th className="p-4 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-700/30">
//             {filtered.map((c) => {
//               const displayName = c.name || (c.first_name ? `${c.first_name} ${c.last_name}` : 'Unknown Candidate');
//               const fitScore = c.fit_score ?? c.overall_fit ?? c.score ?? 0;
//               const shortDate = c.upload_date ? new Date(c.upload_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A';

//               // --- THE NEW MAPPING ---
//               // Pulling from c.skills! (with fallback to c.strengths just in case)
//               const rawStrengths = getBaseTags(c.skills || c.strengths);
//               const rawWeaknesses = getBaseTags(c.weaknesses || c.weekness);

//               let strengthTags = rawStrengths.slice(0, 2);
//               let weaknessTags = rawWeaknesses.filter(tag => !strengthTags.includes(tag));

//               if (weaknessTags.length === 0 && rawWeaknesses.length > 0) weaknessTags = ['Needs Details'];
//               if (strengthTags.length === 0) strengthTags = ['N/A'];
//               if (weaknessTags.length === 0) weaknessTags = ['N/A'];
              
//               weaknessTags = weaknessTags.slice(0, 2);

//               return (
//                 <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
//                   <td className="p-4">
//                     <div className="font-bold text-sm">{displayName}</div>
//                     <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
//                       <Mail size={10}/> {c.email || 'No email'}
//                     </div>
//                   </td>

//                   <td className="p-4">
//                     <span className="text-[10px] text-slate-500 font-medium bg-slate-900/50 px-2 py-1 rounded">
//                       {shortDate}
//                     </span>
//                   </td>
                  
//                   <td className="p-4">
//                     <div className="flex items-center gap-2">
//                       <span className={`text-sm font-black ${fitScore >= 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
//                         {fitScore}/5
//                       </span>
//                       <div className="h-1 w-10 bg-slate-900 rounded-full overflow-hidden">
//                         <div className={`h-full ${fitScore >= 4 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${(fitScore / 5) * 100}%` }} />
//                       </div>
//                     </div>
//                   </td>

//                   {/* FORMATTING SKILLS */}
//                   <td className="p-4">
//                     <div className="flex flex-wrap gap-1.5">
//                       {strengthTags.map((tag, i) => (
//                         <span key={i} className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20">
//                           {tag === 'Experience' ? '+Experienced' : `+${tag}`}
//                         </span>
//                       ))}
//                     </div>
//                   </td>

//                   {/* FORMATTING WEAKNESSES */}
//                   <td className="p-4">
//                     <div className="flex flex-wrap gap-1.5">
//                       {weaknessTags.map((tag, i) => {
//                         let formattedText = `-Needs ${tag}`;
//                         if (tag === 'Experience') formattedText = '-Low Exp.';
//                         if (tag === 'Vector DB' || tag === 'Database') formattedText = `-No ${tag}`;
//                         if (tag === 'N/A' || tag === 'Needs Details') formattedText = `-${tag}`;
                        
//                         return (
//                           <span key={i} className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-500/20">
//                             {formattedText}
//                           </span>
//                         );
//                       })}
//                     </div>
//                   </td>

//                   <td className="p-4">
//                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
//                       c.status === 'Shortlisted' ? 'bg-emerald-500/20 text-emerald-400' : 
//                       c.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
//                     }`}>
//                       {c.status || 'Pending'}
//                     </span>
//                   </td>

//                   <td className="p-4">
//                     <div className="flex items-center justify-center gap-2">
//                       <select 
//                         value={c.status || 'Pending'} 
//                         onChange={(e) => onUpdateStatus(c.id, e.target.value)}
//                         className="bg-slate-900 text-[11px] font-bold text-slate-300 border border-slate-600 rounded p-1.5 outline-none focus:border-blue-500 cursor-pointer"
//                       >
//                         <option value="Pending">Pending</option>
//                         <option value="Shortlisted">Shortlist</option>
//                         <option value="Rejected">Reject</option>
//                       </select>

//                       <button onClick={() => setSelectedCandidate(c)} className="p-1.5 bg-blue-600/10 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-all" title="AI Details">
//                         <Info size={16}/>
//                       </button>

//                       {c.resume_link ? (
//                         <a 
//                           href={c.resume_link} 
//                           target="_blank" 
//                           rel="noreferrer" 
//                           className="px-3 py-1.5 bg-slate-700 text-slate-200 text-[11px] font-bold rounded hover:bg-slate-600 transition-all flex items-center gap-1 border border-slate-600"
//                         >
//                           <FileText size={12}/> Resume
//                         </a>
//                       ) : (
//                         <button 
//                           onClick={() => toast.error("No resume link provided for this candidate.")}
//                           className="px-3 py-1.5 bg-slate-800 text-slate-500 text-[11px] font-bold rounded cursor-not-allowed flex items-center gap-1 border border-slate-700/50"
//                         >
//                           <FileText size={12}/> N/A
//                         </button>
//                       )}
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {selectedCandidate && (
//         <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
//           <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
//             <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//               <div>
//                 <h3 className="text-xl font-bold">
//                   {selectedCandidate.name || `${selectedCandidate.first_name || ''} ${selectedCandidate.last_name || ''}`}
//                 </h3>
//                 <p className="text-sm text-blue-400">AI Deep Analysis</p>
//               </div>
//               <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-all"><X size={20}/></button>
//             </div>
            
//             <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
//               <section>
//                 <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">
//                   Key Skills
//                 </h4>
//                 <div className="text-sm text-slate-400 leading-relaxed bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
//                   {/* Pulls directly from DB skills column now */}
//                   {selectedCandidate.skills || selectedCandidate.strengths || 'No skills recorded.'}
//                 </div>
//               </section>
//               <section>
//                 <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">
//                   Weaknesses Assessment
//                 </h4>
//                 <div className="text-sm text-slate-400 leading-relaxed bg-red-500/5 p-4 rounded-xl border border-red-500/10">
//                   {selectedCandidate.weaknesses || selectedCandidate.weekness || 'No weaknesses recorded.'}
//                 </div>
//               </section>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Recruiter;
// import React, { useMemo, useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import { 
//   Search, LogOut, Users, Mail, Info, X, FileText
// } from 'lucide-react';
// import toast from 'react-hot-toast';

// // --- THE "NEVER GIVE UP" EXTRACTOR ---
// // Context-Aware: Changes the badge text based on whether it's a strength or weakness
// const extractTags = (text, isWeakness = false) => {
//   if (!text || text === 'NULL' || text.trim() === '') return ['N/A'];
  
//   const lower = text.toLowerCase();
//   let tags = [];

//   // 1. CONTEXT-AWARE KEYWORDS 
//   if (lower.includes('full stack') || lower.includes('full-stack') || lower.includes('fullstack')) {
//     tags.push(isWeakness ? 'Needs Full Stack' : 'Full Stack');
//   }
//   if (lower.includes('python')) {
//     tags.push(isWeakness ? 'Needs Python' : 'Python');
//   }
//   if (lower.includes('javascript') || lower.includes(' js ') || lower.includes('javascript-based')) {
//     tags.push(isWeakness ? 'Needs JS' : 'JavaScript');
//   }
//   if (lower.includes('react')) {
//     tags.push(isWeakness ? 'Needs React' : 'React');
//   }
  
//   // Database context
//   if (lower.includes('vector')) {
//     tags.push(isWeakness ? 'No Vector DB' : 'Vector DB');
//   } else if (lower.includes('database') || lower.includes('sql')) {
//     tags.push(isWeakness ? 'Weak SQL' : 'Databases');
//   }

//   // HR context
//   if (lower.includes('experience') || lower.includes('seniority') || lower.includes('years')) {
//     tags.push(isWeakness ? 'Low Exp.' : 'Experienced');
//   }
//   if (lower.includes('demonstration') || lower.includes('understanding')) {
//     tags.push(isWeakness ? 'Needs Clarity' : 'Strong Grasp');
//   }

//   // Remove duplicates and limit to 2 tags max
//   tags = [...new Set(tags)].slice(0, 2);

//   // 2. ULTRA-STRICT FALLBACK (Ignores all the fluff words if no keywords match)
//   if (tags.length === 0) {
//     const cleanText = text.replace(/[^a-zA-Z\s]/g, '').toLowerCase();
//     const badWords = [
//       'the','and','with','for','that','this','lack','lacks','significant',
//       'required','explicit','proficiency','based','foundational','development',
//       'have','has','are','not','but','from','they','their','of','in','to','a',
//       'most','strong','demonstration','understanding','proficient','knowledge',
//       'working','skills','using','good','very','some','any','about','more'
//     ];
    
//     const words = cleanText.split(/\s+/).filter(w => w.length > 4 && !badWords.includes(w));
//     const formatTag = (word) => word.charAt(0).toUpperCase() + word.slice(1);
//     tags = [...new Set(words)].slice(0, 2).map(formatTag);
//   }

//   return tags.length > 0 ? tags : ['Review'];
// };

// const Recruiter = () => {
//   const { user, logout } = useAuth();
//   const [candidates, setCandidates] = useState([]);
//   const [filters, setFilters] = useState({ status: 'All' });
//   const [q, setQ] = useState('');
//   const [selectedCandidate, setSelectedCandidate] = useState(null);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         const res = await axios.get("http://localhost:8000/candidates/");
//         setCandidates(res.data);
//       } catch (err) {
//         toast.error("Database connection failed");
//       }
//     };
//     fetchCandidates();
//   }, []);

//   const filtered = useMemo(() => {
//     return candidates.filter(c => {
//       if (filters.status !== 'All' && c.status !== filters.status) return false;
      
//       const displayName = c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim();
//       const email = c.email || '';
      
//       if (q && !(displayName.toLowerCase().includes(q.toLowerCase()) || email.toLowerCase().includes(q.toLowerCase()))) return false;
//       return true;
//     });
//   }, [candidates, filters, q]);

//   const onUpdateStatus = (id, status) => {
//     setCandidates(prev => prev.map(p => p.id === id ? { ...p, status } : p));
//     toast.success(`Candidate marked as ${status}`);
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
//       {/* Header */}
//       <header className="flex justify-between items-center mb-8">
//         <h1 className="text-2xl font-bold flex items-center gap-2">
//           <Users className="text-blue-500" /> Recruiter Dashboard
//         </h1>
//         <div className="flex items-center gap-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
//             <input 
//               value={q} onChange={e => setQ(e.target.value)} 
//               placeholder="Search name or email" 
//               className="pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm w-64 outline-none focus:border-blue-500 transition-all" 
//             />
//           </div>
//           <button onClick={logout} className="p-2 bg-slate-800 hover:bg-red-900/20 text-red-400 rounded-lg border border-slate-700 transition-all">
//             <LogOut size={18}/>
//           </button>
//         </div>
//       </header>

//       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
        
//         {/* FILTERS */}
//         <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//           <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-700">
//             {["All", "Pending", "Shortlisted", "Rejected"].map(status => (
//               <button 
//                 key={status}
//                 onClick={() => setFilters({...filters, status})}
//                 className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
//                   filters.status === status 
//                     ? 'bg-blue-600 text-white shadow-lg' 
//                     : 'text-slate-400 hover:text-white'
//                 }`}
//               >
//                 {status}
//               </button>
//             ))}
//           </div>
//           <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">
//             {filtered.length} Candidates
//           </div>
//         </div>

//         <table className="w-full text-left">
//           <thead>
//             <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-700/50">
//               <th className="p-4">Candidate</th>
//               <th className="p-4">Date</th>
//               <th className="p-4">AI Fit</th>
//               <th className="p-4">Strengths</th>
//               <th className="p-4">Weaknesses</th>
//               <th className="p-4">Status</th>
//               <th className="p-4 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-700/30">
//             {filtered.map((c) => {
//               const displayName = c.name || (c.first_name ? `${c.first_name} ${c.last_name}` : 'Unknown Candidate');
//               const fitScore = c.fit_score ?? c.overall_fit ?? c.score ?? 0;
              
//               // Extracting tags dynamically from your exact DB columns
//               // NOTE: Passing false for strengths, and true for weaknesses!
//               const strengthTags = extractTags(c.strengths, false);
//               const weaknessTags = extractTags(c.weaknesses || c.weekness || c.weakness, true);

//               const shortDate = c.upload_date ? new Date(c.upload_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A';

//               return (
//                 <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
                  
//                   {/* CANDIDATE */}
//                   <td className="p-4">
//                     <div className="font-bold text-sm">{displayName}</div>
//                     <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
//                       <Mail size={10}/> {c.email || 'No email'}
//                     </div>
//                   </td>

//                   {/* DATE */}
//                   <td className="p-4">
//                     <span className="text-[10px] text-slate-500 font-medium bg-slate-900/50 px-2 py-1 rounded">
//                       {shortDate}
//                     </span>
//                   </td>
                  
//                   {/* AI FIT SCORE */}
//                   <td className="p-4">
//                     <div className="flex items-center gap-2">
//                       <span className={`text-sm font-black ${fitScore >= 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
//                         {fitScore}/5
//                       </span>
//                       <div className="h-1 w-10 bg-slate-900 rounded-full overflow-hidden">
//                         <div className={`h-full ${fitScore >= 4 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${(fitScore / 5) * 100}%` }} />
//                       </div>
//                     </div>
//                   </td>

//                   {/* STRENGTHS */}
//                   <td className="p-4">
//                     <div className="flex flex-wrap gap-1.5">
//                       {strengthTags.map((tag, i) => (
//                         <span key={i} className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20">
//                           +{tag}
//                         </span>
//                       ))}
//                     </div>
//                   </td>

//                   {/* WEAKNESSES */}
//                   <td className="p-4">
//                     <div className="flex flex-wrap gap-1.5">
//                       {weaknessTags.map((tag, i) => (
//                         <span key={i} className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-500/20">
//                           -{tag}
//                         </span>
//                       ))}
//                     </div>
//                   </td>

//                   {/* STATUS */}
//                   <td className="p-4">
//                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
//                       c.status === 'Shortlisted' ? 'bg-emerald-500/20 text-emerald-400' : 
//                       c.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
//                     }`}>
//                       {c.status || 'Pending'}
//                     </span>
//                   </td>

//                   {/* ACTIONS */}
//                   <td className="p-4">
//                     <div className="flex items-center justify-center gap-2">
//                       <select 
//                         value={c.status || 'Pending'} 
//                         onChange={(e) => onUpdateStatus(c.id, e.target.value)}
//                         className="bg-slate-900 text-[11px] font-bold text-slate-300 border border-slate-600 rounded p-1.5 outline-none focus:border-blue-500 cursor-pointer"
//                       >
//                         <option value="Pending">Pending</option>
//                         <option value="Shortlisted">Shortlist</option>
//                         <option value="Rejected">Reject</option>
//                       </select>

//                       <button onClick={() => setSelectedCandidate(c)} className="p-1.5 bg-blue-600/10 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-all" title="AI Details">
//                         <Info size={16}/>
//                       </button>

//                       {c.resume_link ? (
//                         <a 
//                           href={c.resume_link} 
//                           target="_blank" 
//                           rel="noreferrer" 
//                           className="px-3 py-1.5 bg-slate-700 text-slate-200 text-[11px] font-bold rounded hover:bg-slate-600 transition-all flex items-center gap-1 border border-slate-600"
//                         >
//                           <FileText size={12}/> Resume
//                         </a>
//                       ) : (
//                         <button 
//                           onClick={() => toast.error("No resume link provided for this candidate.")}
//                           className="px-3 py-1.5 bg-slate-800 text-slate-500 text-[11px] font-bold rounded cursor-not-allowed flex items-center gap-1 border border-slate-700/50"
//                         >
//                           <FileText size={12}/> N/A
//                         </button>
//                       )}
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* DETAILS POP-UP MODAL */}
//       {selectedCandidate && (
//         <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
//           <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
//             <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//               <div>
//                 <h3 className="text-xl font-bold">
//                   {selectedCandidate.name || `${selectedCandidate.first_name || ''} ${selectedCandidate.last_name || ''}`}
//                 </h3>
//                 <p className="text-sm text-blue-400">AI Deep Analysis</p>
//               </div>
//               <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-all"><X size={20}/></button>
//             </div>
            
//             <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
//               <section>
//                 <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">
//                   Full Strengths Assessment
//                 </h4>
//                 <div className="text-sm text-slate-400 leading-relaxed bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
//                   {selectedCandidate.strengths || 'No strengths recorded.'}
//                 </div>
//               </section>
//               <section>
//                 <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">
//                   Full Weaknesses Assessment
//                 </h4>
//                 <div className="text-sm text-slate-400 leading-relaxed bg-red-500/5 p-4 rounded-xl border border-red-500/10">
//                   {selectedCandidate.weaknesses || selectedCandidate.weekness || 'No weaknesses recorded.'}
//                 </div>
//               </section>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Recruiter;
// import React, { useMemo, useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import { 
//   Search, LogOut, Users, Mail, Info, X, FileText
// } from 'lucide-react';
// import toast from 'react-hot-toast';

// // --- SMART DICTIONARY EXTRACTOR ---
// // Maps messy AI sentences perfectly to clean UI Badges
// const extractTags = (text) => {
//   if (!text || text === 'NULL' || text.trim() === '') return ['N/A'];
  
//   const lower = text.toLowerCase();
//   let tags = [];

//   // 1. DICTIONARY (Add any specific skills your company looks for here!)
//   const dict = {
//     'full stack': 'Full Stack',
//     'full-stack': 'Full Stack',
//     'python': 'Python',
//     'javascript': 'JavaScript',
//     ' js ': 'JavaScript',
//     'react': 'React',
//     'node': 'Node.js',
//     'vector': 'Vector DB',
//     'sql': 'SQL',
//     'database': 'Database',
//     'aws': 'AWS',
//     'cloud': 'Cloud',
//     'api': 'APIs',
//     'machine learning': 'ML',
//     ' ml ': 'ML',
//     'seniority': 'Seniority',
//     'leadership': 'Leadership',
//     'communication': 'Soft Skills'
//   };

//   // Check the AI text against our clean dictionary
//   for (const [key, label] of Object.entries(dict)) {
//     if (lower.includes(key)) tags.push(label);
//   }

//   // 2. Generic Experience Check (If it missed tech skills, but mentions experience)
//   if (tags.length < 2 && (lower.includes('experience') || lower.includes('years') || lower.includes('exp'))) {
//     tags.push('Experience');
//   }

//   // Remove duplicate tags just in case
//   tags = [...new Set(tags)];

//   // 3. ULTRA-STRICT FALLBACK (If the dictionary finds absolutely nothing)
//   if (tags.length === 0) {
//     const cleanText = text.replace(/[^a-zA-Z\s]/g, '').toLowerCase();
    
//     // The "Ignore" List - Stops weird words like "-Most" or "-Strong" from showing up
//     const badWords = [
//       'the','and','with','for','that','this','lack','lacks','significant',
//       'required','explicit','proficiency','based','foundational','development',
//       'have','has','are','not','but','from','they','their','of','in','to','a',
//       'most','strong','demonstration','understanding','proficient','knowledge',
//       'working','skills','using','good','very','some','any','about','more'
//     ];
    
//     const words = cleanText.split(/\s+/).filter(w => w.length > 4 && !badWords.includes(w));
//     const formatTag = (word) => word.charAt(0).toUpperCase() + word.slice(1);
//     tags = [...new Set(words)].map(formatTag);
//   }

//   // Return exactly 1 or 2 tags. If it completely failed, return "Review"
//   return tags.slice(0, 2).length > 0 ? tags.slice(0, 2) : ['Review'];
// };

// const Recruiter = () => {
//   const { user, logout } = useAuth();
//   const [candidates, setCandidates] = useState([]);
//   const [filters, setFilters] = useState({ status: 'All' });
//   const [q, setQ] = useState('');
//   const [selectedCandidate, setSelectedCandidate] = useState(null);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         const res = await axios.get("http://localhost:8000/candidates/");
//         setCandidates(res.data);
//       } catch (err) {
//         toast.error("Database connection failed");
//       }
//     };
//     fetchCandidates();
//   }, []);

//   const filtered = useMemo(() => {
//     return candidates.filter(c => {
//       if (filters.status !== 'All' && c.status !== filters.status) return false;
      
//       const displayName = c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim();
//       const email = c.email || '';
      
//       if (q && !(displayName.toLowerCase().includes(q.toLowerCase()) || email.toLowerCase().includes(q.toLowerCase()))) return false;
//       return true;
//     });
//   }, [candidates, filters, q]);

//   const onUpdateStatus = (id, status) => {
//     setCandidates(prev => prev.map(p => p.id === id ? { ...p, status } : p));
//     toast.success(`Candidate marked as ${status}`);
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
//       {/* Header */}
//       <header className="flex justify-between items-center mb-8">
//         <h1 className="text-2xl font-bold flex items-center gap-2">
//           <Users className="text-blue-500" /> Recruiter Dashboard
//         </h1>
//         <div className="flex items-center gap-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
//             <input 
//               value={q} onChange={e => setQ(e.target.value)} 
//               placeholder="Search name or email" 
//               className="pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm w-64 outline-none focus:border-blue-500 transition-all" 
//             />
//           </div>
//           <button onClick={logout} className="p-2 bg-slate-800 hover:bg-red-900/20 text-red-400 rounded-lg border border-slate-700 transition-all">
//             <LogOut size={18}/>
//           </button>
//         </div>
//       </header>

//       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
        
//         {/* FILTERS */}
//         <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//           <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-700">
//             {["All", "Pending", "Shortlisted", "Rejected"].map(status => (
//               <button 
//                 key={status}
//                 onClick={() => setFilters({...filters, status})}
//                 className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
//                   filters.status === status 
//                     ? 'bg-blue-600 text-white shadow-lg' 
//                     : 'text-slate-400 hover:text-white'
//                 }`}
//               >
//                 {status}
//               </button>
//             ))}
//           </div>
//           <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">
//             {filtered.length} Candidates
//           </div>
//         </div>

//         <table className="w-full text-left">
//           <thead>
//             <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-700/50">
//               <th className="p-4">Candidate</th>
//               <th className="p-4">Date</th>
//               <th className="p-4">AI Fit</th>
//               <th className="p-4">Strengths</th>
//               <th className="p-4">Weaknesses</th>
//               <th className="p-4">Status</th>
//               <th className="p-4 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-700/30">
//             {filtered.map((c) => {
//               const displayName = c.name || (c.first_name ? `${c.first_name} ${c.last_name}` : 'Unknown Candidate');
//               const fitScore = c.fit_score ?? c.overall_fit ?? c.score ?? 0;
              
//               // Extracting tags dynamically from your exact DB columns
//               const strengthTags = extractTags(c.strengths);
//               const weaknessTags = extractTags(c.weaknesses || c.weekness || c.weakness);

//               const shortDate = c.upload_date ? new Date(c.upload_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A';

//               return (
//                 <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
                  
//                   {/* CANDIDATE */}
//                   <td className="p-4">
//                     <div className="font-bold text-sm">{displayName}</div>
//                     <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
//                       <Mail size={10}/> {c.email || 'No email'}
//                     </div>
//                   </td>

//                   {/* DATE */}
//                   <td className="p-4">
//                     <span className="text-[10px] text-slate-500 font-medium bg-slate-900/50 px-2 py-1 rounded">
//                       {shortDate}
//                     </span>
//                   </td>
                  
//                   {/* AI FIT SCORE */}
//                   <td className="p-4">
//                     <div className="flex items-center gap-2">
//                       <span className={`text-sm font-black ${fitScore >= 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
//                         {fitScore}/5
//                       </span>
//                       <div className="h-1 w-10 bg-slate-900 rounded-full overflow-hidden">
//                         <div className={`h-full ${fitScore >= 4 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${(fitScore / 5) * 100}%` }} />
//                       </div>
//                     </div>
//                   </td>

//                   {/* STRENGTHS */}
//                   <td className="p-4">
//                     <div className="flex flex-wrap gap-1.5">
//                       {strengthTags.map((tag, i) => (
//                         <span key={i} className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20">
//                           +{tag}
//                         </span>
//                       ))}
//                     </div>
//                   </td>

//                   {/* WEAKNESSES */}
//                   <td className="p-4">
//                     <div className="flex flex-wrap gap-1.5">
//                       {weaknessTags.map((tag, i) => (
//                         <span key={i} className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-500/20">
//                           -{tag}
//                         </span>
//                       ))}
//                     </div>
//                   </td>

//                   {/* STATUS */}
//                   <td className="p-4">
//                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
//                       c.status === 'Shortlisted' ? 'bg-emerald-500/20 text-emerald-400' : 
//                       c.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
//                     }`}>
//                       {c.status || 'Pending'}
//                     </span>
//                   </td>

//                   {/* ACTIONS */}
//                   <td className="p-4">
//                     <div className="flex items-center justify-center gap-2">
//                       <select 
//                         value={c.status || 'Pending'} 
//                         onChange={(e) => onUpdateStatus(c.id, e.target.value)}
//                         className="bg-slate-900 text-[11px] font-bold text-slate-300 border border-slate-600 rounded p-1.5 outline-none focus:border-blue-500 cursor-pointer"
//                       >
//                         <option value="Pending">Pending</option>
//                         <option value="Shortlisted">Shortlist</option>
//                         <option value="Rejected">Reject</option>
//                       </select>

//                       <button onClick={() => setSelectedCandidate(c)} className="p-1.5 bg-blue-600/10 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-all" title="AI Details">
//                         <Info size={16}/>
//                       </button>

//                       {c.resume_link ? (
//                         <a 
//                           href={c.resume_link} 
//                           target="_blank" 
//                           rel="noreferrer" 
//                           className="px-3 py-1.5 bg-slate-700 text-slate-200 text-[11px] font-bold rounded hover:bg-slate-600 transition-all flex items-center gap-1 border border-slate-600"
//                         >
//                           <FileText size={12}/> Resume
//                         </a>
//                       ) : (
//                         <button 
//                           onClick={() => toast.error("No resume link provided for this candidate.")}
//                           className="px-3 py-1.5 bg-slate-800 text-slate-500 text-[11px] font-bold rounded cursor-not-allowed flex items-center gap-1 border border-slate-700/50"
//                         >
//                           <FileText size={12}/> N/A
//                         </button>
//                       )}
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* DETAILS POP-UP MODAL */}
//       {selectedCandidate && (
//         <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
//           <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
//             <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//               <div>
//                 <h3 className="text-xl font-bold">
//                   {selectedCandidate.name || `${selectedCandidate.first_name || ''} ${selectedCandidate.last_name || ''}`}
//                 </h3>
//                 <p className="text-sm text-blue-400">AI Deep Analysis</p>
//               </div>
//               <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-all"><X size={20}/></button>
//             </div>
            
//             <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
//               <section>
//                 <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">
//                   Full Strengths Assessment
//                 </h4>
//                 <div className="text-sm text-slate-400 leading-relaxed bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
//                   {selectedCandidate.strengths || 'No strengths recorded.'}
//                 </div>
//               </section>
//               <section>
//                 <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">
//                   Full Weaknesses Assessment
//                 </h4>
//                 <div className="text-sm text-slate-400 leading-relaxed bg-red-500/5 p-4 rounded-xl border border-red-500/10">
//                   {selectedCandidate.weaknesses || selectedCandidate.weekness || 'No weaknesses recorded.'}
//                 </div>
//               </section>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Recruiter;
// import React, { useMemo, useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import { 
//   Search, LogOut, Users, Mail, Info, X, FileText
// } from 'lucide-react';
// import toast from 'react-hot-toast';

// // --- HYBRID KEYWORD EXTRACTOR ---
// // Scans for specific tech/HR concepts first, then falls back to safe words
// const extractTags = (text, isWeakness = false) => {
//   if (!text || text === 'NULL' || text.trim() === '') return ['N/A'];
  
//   const lower = text.toLowerCase();
//   let tags = [];

//   // 1. SMART KEYWORDS (Scans for exact concepts in your DB)
//   if (lower.includes('full stack') || lower.includes('full-stack') || lower.includes('fullstack')) tags.push('Full Stack');
//   if (lower.includes('python')) tags.push('Python');
//   if (lower.includes('javascript') || lower.includes(' js ') || lower.includes('javascript-based')) tags.push('JavaScript');
//   if (lower.includes('react')) tags.push('React');
  
//   // Database checks
//   if (lower.includes('vector database') || lower.includes('vector')) {
//     tags.push(isWeakness ? 'Needs Vector DB' : 'Vector DB');
//   } else if (lower.includes('database') || lower.includes('sql')) {
//     tags.push(isWeakness ? 'Weak DB Skills' : 'Database');
//   }

//   // HR & Experience checks
//   if (lower.includes('experience') || lower.includes('seniority') || lower.includes('years')) {
//     tags.push(isWeakness ? 'Low Exp.' : 'Experienced');
//   }
//   if (lower.includes('demonstration') || lower.includes('understanding')) {
//     tags.push(isWeakness ? 'Needs Clarity' : 'Strong Grasp');
//   }

//   // Remove duplicates and limit to 2 tags
//   tags = [...new Set(tags)].slice(0, 2);

//   // 2. STRICT FALLBACK (If the AI writes something unexpected, skip the bad words)
//   if (tags.length === 0) {
//     const cleanText = text.replace(/[^a-zA-Z\s]/g, '').toLowerCase();
//     const badWords = [
//       'the', 'and', 'with', 'for', 'that', 'this', 'lack', 'lacks', 
//       'significant', 'required', 'explicit', 'proficiency', 'based', 
//       'years', 'experience', 'foundational', 'development', 'have', 'has',
//       'are', 'not', 'but', 'from', 'they', 'their', 'of', 'in', 'to', 'a',
//       'most', 'strong', 'demonstration', 'understanding', 'proficient'
//     ];
    
//     // Only grab words longer than 4 letters that aren't in the bad word list
//     const words = cleanText.split(/\s+/).filter(w => w.length > 4 && !badWords.includes(w));
//     const formatTag = (word) => word.charAt(0).toUpperCase() + word.slice(1);
//     tags = [...new Set(words)].slice(0, 2).map(formatTag);
//   }

//   return tags.length > 0 ? tags : ['Review'];
// };

// const Recruiter = () => {
//   const { user, logout } = useAuth();
//   const [candidates, setCandidates] = useState([]);
//   const [filters, setFilters] = useState({ status: 'All' });
//   const [q, setQ] = useState('');
//   const [selectedCandidate, setSelectedCandidate] = useState(null);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         const res = await axios.get("http://localhost:8000/candidates/");
//         setCandidates(res.data);
//       } catch (err) {
//         toast.error("Database connection failed");
//       }
//     };
//     fetchCandidates();
//   }, []);

//   const filtered = useMemo(() => {
//     return candidates.filter(c => {
//       if (filters.status !== 'All' && c.status !== filters.status) return false;
      
//       const displayName = c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim();
//       const email = c.email || '';
      
//       if (q && !(displayName.toLowerCase().includes(q.toLowerCase()) || email.toLowerCase().includes(q.toLowerCase()))) return false;
//       return true;
//     });
//   }, [candidates, filters, q]);

//   const onUpdateStatus = (id, status) => {
//     setCandidates(prev => prev.map(p => p.id === id ? { ...p, status } : p));
//     toast.success(`Candidate marked as ${status}`);
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
//       {/* Header */}
//       <header className="flex justify-between items-center mb-8">
//         <h1 className="text-2xl font-bold flex items-center gap-2">
//           <Users className="text-blue-500" /> Recruiter Dashboard
//         </h1>
//         <div className="flex items-center gap-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
//             <input 
//               value={q} onChange={e => setQ(e.target.value)} 
//               placeholder="Search name or email" 
//               className="pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm w-64 outline-none focus:border-blue-500 transition-all" 
//             />
//           </div>
//           <button onClick={logout} className="p-2 bg-slate-800 hover:bg-red-900/20 text-red-400 rounded-lg border border-slate-700 transition-all">
//             <LogOut size={18}/>
//           </button>
//         </div>
//       </header>

//       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
        
//         {/* FILTERS */}
//         <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//           <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-700">
//             {["All", "Pending", "Shortlisted", "Rejected"].map(status => (
//               <button 
//                 key={status}
//                 onClick={() => setFilters({...filters, status})}
//                 className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
//                   filters.status === status 
//                     ? 'bg-blue-600 text-white shadow-lg' 
//                     : 'text-slate-400 hover:text-white'
//                 }`}
//               >
//                 {status}
//               </button>
//             ))}
//           </div>
//           <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">
//             {filtered.length} Candidates
//           </div>
//         </div>

//         <table className="w-full text-left">
//           <thead>
//             <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-700/50">
//               <th className="p-4">Candidate</th>
//               <th className="p-4">Date</th>
//               <th className="p-4">AI Fit</th>
//               <th className="p-4">Strengths</th>
//               <th className="p-4">Weaknesses</th>
//               <th className="p-4">Status</th>
//               <th className="p-4 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-700/30">
//             {filtered.map((c) => {
//               const displayName = c.name || (c.first_name ? `${c.first_name} ${c.last_name}` : 'Unknown Candidate');
//               const fitScore = c.fit_score ?? c.overall_fit ?? c.score ?? 0;
              
//               // Extracting tags dynamically from your exact DB columns (Passing true for weaknesses!)
//               const strengthTags = extractTags(c.strengths, false);
//               const weaknessTags = extractTags(c.weaknesses || c.weekness || c.weakness, true);

//               // Date Formatting (Shrunk to just MM-DD or short format)
//               const shortDate = c.upload_date ? new Date(c.upload_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A';

//               return (
//                 <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
                  
//                   {/* CANDIDATE */}
//                   <td className="p-4">
//                     <div className="font-bold text-sm">{displayName}</div>
//                     <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
//                       <Mail size={10}/> {c.email || 'No email'}
//                     </div>
//                   </td>

//                   {/* DATE */}
//                   <td className="p-4">
//                     <span className="text-[10px] text-slate-500 font-medium bg-slate-900/50 px-2 py-1 rounded">
//                       {shortDate}
//                     </span>
//                   </td>
                  
//                   {/* AI FIT SCORE */}
//                   <td className="p-4">
//                     <div className="flex items-center gap-2">
//                       <span className={`text-sm font-black ${fitScore >= 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
//                         {fitScore}/5
//                       </span>
//                       <div className="h-1 w-10 bg-slate-900 rounded-full overflow-hidden">
//                         <div className={`h-full ${fitScore >= 4 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${(fitScore / 5) * 100}%` }} />
//                       </div>
//                     </div>
//                   </td>

//                   {/* STRENGTHS */}
//                   <td className="p-4">
//                     <div className="flex flex-wrap gap-1.5">
//                       {strengthTags.map((tag, i) => (
//                         <span key={i} className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20">
//                           +{tag}
//                         </span>
//                       ))}
//                     </div>
//                   </td>

//                   {/* WEAKNESSES */}
//                   <td className="p-4">
//                     <div className="flex flex-wrap gap-1.5">
//                       {weaknessTags.map((tag, i) => (
//                         <span key={i} className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-500/20">
//                           -{tag}
//                         </span>
//                       ))}
//                     </div>
//                   </td>

//                   {/* STATUS */}
//                   <td className="p-4">
//                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
//                       c.status === 'Shortlisted' ? 'bg-emerald-500/20 text-emerald-400' : 
//                       c.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
//                     }`}>
//                       {c.status || 'Pending'}
//                     </span>
//                   </td>

//                   {/* ACTIONS */}
//                   <td className="p-4">
//                     <div className="flex items-center justify-center gap-2">
//                       <select 
//                         value={c.status || 'Pending'} 
//                         onChange={(e) => onUpdateStatus(c.id, e.target.value)}
//                         className="bg-slate-900 text-[11px] font-bold text-slate-300 border border-slate-600 rounded p-1.5 outline-none focus:border-blue-500 cursor-pointer"
//                       >
//                         <option value="Pending">Pending</option>
//                         <option value="Shortlisted">Shortlist</option>
//                         <option value="Rejected">Reject</option>
//                       </select>

//                       <button onClick={() => setSelectedCandidate(c)} className="p-1.5 bg-blue-600/10 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-all" title="AI Details">
//                         <Info size={16}/>
//                       </button>

//                       {c.resume_link ? (
//                         <a 
//                           href={c.resume_link} 
//                           target="_blank" 
//                           rel="noreferrer" 
//                           className="px-3 py-1.5 bg-slate-700 text-slate-200 text-[11px] font-bold rounded hover:bg-slate-600 transition-all flex items-center gap-1 border border-slate-600"
//                         >
//                           <FileText size={12}/> Resume
//                         </a>
//                       ) : (
//                         <button 
//                           onClick={() => toast.error("No resume link provided for this candidate.")}
//                           className="px-3 py-1.5 bg-slate-800 text-slate-500 text-[11px] font-bold rounded cursor-not-allowed flex items-center gap-1 border border-slate-700/50"
//                         >
//                           <FileText size={12}/> N/A
//                         </button>
//                       )}
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* DETAILS POP-UP MODAL */}
//       {selectedCandidate && (
//         <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
//           <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
//             <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//               <div>
//                 <h3 className="text-xl font-bold">
//                   {selectedCandidate.name || `${selectedCandidate.first_name || ''} ${selectedCandidate.last_name || ''}`}
//                 </h3>
//                 <p className="text-sm text-blue-400">AI Deep Analysis</p>
//               </div>
//               <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-all"><X size={20}/></button>
//             </div>
            
//             <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
//               <section>
//                 <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">
//                   Full Strengths Assessment
//                 </h4>
//                 <div className="text-sm text-slate-400 leading-relaxed bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
//                   {selectedCandidate.strengths || 'No strengths recorded.'}
//                 </div>
//               </section>
//               <section>
//                 <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">
//                   Full Weaknesses Assessment
//                 </h4>
//                 <div className="text-sm text-slate-400 leading-relaxed bg-red-500/5 p-4 rounded-xl border border-red-500/10">
//                   {selectedCandidate.weaknesses || selectedCandidate.weekness || 'No weaknesses recorded.'}
//                 </div>
//               </section>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Recruiter;
// import React, { useMemo, useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import { 
//   Search, LogOut, Users, Mail, Calendar, Info, X, FileText
// } from 'lucide-react';
// import toast from 'react-hot-toast';

// const Recruiter = () => {
//   const { user, logout } = useAuth();
//   const [candidates, setCandidates] = useState([]);
//   const [filters, setFilters] = useState({ status: 'All' });
//   const [q, setQ] = useState('');
//   const [selectedCandidate, setSelectedCandidate] = useState(null);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         const res = await axios.get("http://localhost:8000/candidates/");
//         setCandidates(res.data);
//       } catch (err) {
//         toast.error("Database connection failed");
//       }
//     };
//     fetchCandidates();
//   }, []);

//   const filtered = useMemo(() => {
//     return candidates.filter(c => {
//       if (filters.status !== 'All' && c.status !== filters.status) return false;
      
//       // Handle search with flexible name checking
//       const displayName = c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim();
//       const email = c.email || '';
      
//       if (q && !(displayName.toLowerCase().includes(q.toLowerCase()) || email.toLowerCase().includes(q.toLowerCase()))) return false;
//       return true;
//     });
//   }, [candidates, filters, q]);

//   const onUpdateStatus = (id, status) => {
//     setCandidates(prev => prev.map(p => p.id === id ? { ...p, status } : p));
//     toast.success(`Candidate marked as ${status}`);
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
//       {/* Header */}
//       <header className="flex justify-between items-center mb-8">
//         <h1 className="text-2xl font-bold flex items-center gap-2">
//           <Users className="text-blue-500" /> Recruiter Dashboard
//         </h1>
//         <div className="flex items-center gap-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
//             <input 
//               value={q} onChange={e => setQ(e.target.value)} 
//               placeholder="Search name or email" 
//               className="pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm w-64 outline-none focus:border-blue-500 transition-all" 
//             />
//           </div>
//           <button onClick={logout} className="p-2 bg-slate-800 hover:bg-red-900/20 text-red-400 rounded-lg border border-slate-700 transition-all">
//             <LogOut size={18}/>
//           </button>
//         </div>
//       </header>

//       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
        
//         {/* PILL BUTTON FILTERS */}
//         <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//           <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-700">
//             {["All", "Pending", "Shortlisted", "Rejected"].map(status => (
//               <button 
//                 key={status}
//                 onClick={() => setFilters({...filters, status})}
//                 className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
//                   filters.status === status 
//                     ? 'bg-blue-600 text-white shadow-lg' 
//                     : 'text-slate-400 hover:text-white'
//                 }`}
//               >
//                 {status}
//               </button>
//             ))}
//           </div>
//           <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">
//             {filtered.length} Candidates
//           </div>
//         </div>

//         <table className="w-full text-left">
//           <thead>
//             <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-700/50">
//               <th className="p-4">Candidate</th>
//               <th className="p-4">Uploaded</th> {/* MOVED TO 2ND COLUMN */}
//               <th className="p-4">AI Fit (1-5)</th>
//               <th className="p-4">Analysis</th>
//               <th className="p-4">Status</th>
//               <th className="p-4 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-700/30">
//             {filtered.map((c) => {
//               // Extracting data safely to match your backend
//               const displayName = c.name || (c.first_name ? `${c.first_name} ${c.last_name}` : 'Unknown Candidate');
//               const fitScore = c.fit_score ?? c.overall_fit ?? c.score ?? 0; // Checks multiple possible backend keys
//               const posPoint = c.positive_point ?? c.positive ?? '-';
//               const negPoint = c.negative_point ?? c.negative ?? '-';

//               return (
//                 <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
                  
//                   {/* CANDIDATE */}
//                   <td className="p-4">
//                     <div className="font-bold text-sm">{displayName}</div>
//                     <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
//                       <Mail size={10}/> {c.email || 'No email'}
//                     </div>
//                   </td>

//                   {/* UPLOADED DATE (Moved here) */}
//                   <td className="p-4 text-xs text-slate-400">
//                     <div className="flex items-center gap-1">
//                       <Calendar size={12}/> {c.upload_date || c.created_at || 'N/A'}
//                     </div>
//                   </td>
                  
//                   {/* AI FIT SCORE */}
//                   <td className="p-4">
//                     <div className="flex items-center gap-2">
//                       <span className={`text-sm font-black ${fitScore >= 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
//                         {fitScore}/5
//                       </span>
//                       <div className="h-1 w-12 bg-slate-900 rounded-full overflow-hidden">
//                         <div className={`h-full ${fitScore >= 4 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${(fitScore / 5) * 100}%` }} />
//                       </div>
//                     </div>
//                   </td>

//                   {/* ANALYSIS */}
//                   <td className="p-4">
//                     <div className="flex flex-wrap gap-2">
//                       {posPoint !== '-' && (
//                         <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20 lowercase">
//                           +{posPoint}
//                         </span>
//                       )}
//                       {negPoint !== '-' && (
//                         <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-500/20 lowercase">
//                           -{negPoint}
//                         </span>
//                       )}
//                       {posPoint === '-' && negPoint === '-' && (
//                          <span className="text-xs text-slate-600 italic">Processing...</span>
//                       )}
//                     </div>
//                   </td>

//                   {/* STATUS */}
//                   <td className="p-4">
//                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
//                       c.status === 'Shortlisted' ? 'bg-emerald-500/20 text-emerald-400' : 
//                       c.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
//                     }`}>
//                       {c.status || 'Pending'}
//                     </span>
//                   </td>

//                   {/* ACTIONS */}
//                   <td className="p-4">
//                     <div className="flex items-center justify-center gap-2">
                      
//                       {/* Dropdown Action */}
//                       <select 
//                         value={c.status || 'Pending'} 
//                         onChange={(e) => onUpdateStatus(c.id, e.target.value)}
//                         className="bg-slate-900 text-[11px] font-bold text-slate-300 border border-slate-600 rounded p-1.5 outline-none focus:border-blue-500 cursor-pointer"
//                       >
//                         <option value="Pending">Pending</option>
//                         <option value="Shortlisted">Shortlist</option>
//                         <option value="Rejected">Reject</option>
//                       </select>

//                       {/* Details Modal Trigger */}
//                       <button onClick={() => setSelectedCandidate(c)} className="p-1.5 bg-blue-600/10 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-all" title="AI Details">
//                         <Info size={16}/>
//                       </button>
// {/* FIXED: Explicit Resume Button */}
//                       {c.resume_link ? (
//                         <a 
//                           href={c.resume_link} 
//                           target="_blank" 
//                           rel="noreferrer" 
//                           className="px-3 py-1.5 bg-slate-700 text-slate-200 text-[11px] font-bold rounded hover:bg-slate-600 transition-all flex items-center gap-1 border border-slate-600"
//                         >
//                           <FileText size={12}/> Resume
//                         </a>
//                       ) : (
//                         <button 
//                           onClick={() => toast.error("No resume link provided for this candidate.")}
//                           className="px-3 py-1.5 bg-slate-800 text-slate-500 text-[11px] font-bold rounded cursor-not-allowed flex items-center gap-1 border border-slate-700/50"
//                         >
//                           <FileText size={12}/> N/A
//                         </button>
//                       )}
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* DETAILS POP-UP MODAL */}
//       {selectedCandidate && (
//         <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
//           <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
//             <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//               <div>
//                 <h3 className="text-xl font-bold">
//                   {selectedCandidate.name || `${selectedCandidate.first_name || ''} ${selectedCandidate.last_name || ''}`}
//                 </h3>
//                 <p className="text-sm text-blue-400">AI Deep Analysis</p>
//               </div>
//               <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-all"><X size={20}/></button>
//             </div>
            
//             <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
//               <section>
//                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Justification</h4>
//                 <p className="text-sm leading-relaxed text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-700 italic">
//                   "{selectedCandidate.justification || 'No justification provided by AI.'}"
//                 </p>
//               </section>

//               <div className="grid md:grid-cols-2 gap-6">
//                 <section>
//                   <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">
//                     Reward Factors
//                   </h4>
//                   <div className="text-sm text-slate-400 leading-relaxed bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
//                     {selectedCandidate.reward_factors || 'No significant rewards identified.'}
//                   </div>
//                 </section>
//                 <section>
//                   <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-2">
//                     Risk Factors
//                   </h4>
//                   <div className="text-sm text-slate-400 leading-relaxed bg-red-500/5 p-4 rounded-xl border border-red-500/10">
//                     {selectedCandidate.risk_factors || 'No critical risks found.'}
//                   </div>
//                 </section>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Recruiter;
// import React, { useMemo, useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import { 
//   Search, LogOut, Users, ExternalLink, Mail, Calendar, Info, X
// } from 'lucide-react';
// import toast from 'react-hot-toast';

// const Recruiter = () => {
//   const { user, logout } = useAuth();
//   const [candidates, setCandidates] = useState([]);
//   const [filters, setFilters] = useState({ status: 'All' });
//   const [q, setQ] = useState('');
//   const [selectedCandidate, setSelectedCandidate] = useState(null);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         const res = await axios.get("http://localhost:8000/candidates/");
//         setCandidates(res.data);
//       } catch (err) {
//         toast.error("Database connection failed");
//       }
//     };
//     fetchCandidates();
//   }, []);

//   const filtered = useMemo(() => {
//     return candidates.filter(c => {
//       if (filters.status !== 'All' && c.status !== filters.status) return false;
//       if (q && !(c.name.toLowerCase().includes(q.toLowerCase()) || c.email.toLowerCase().includes(q.toLowerCase()))) return false;
//       return true;
//     });
//   }, [candidates, filters, q]);

//   const onUpdateStatus = (id, status) => {
//     setCandidates(prev => prev.map(p => p.id === id ? { ...p, status } : p));
//     toast.success(`Candidate marked as ${status}`);
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
//       {/* Header */}
//       <header className="flex justify-between items-center mb-8">
//         <h1 className="text-2xl font-bold flex items-center gap-2">
//           <Users className="text-blue-500" /> Recruiter Dashboard
//         </h1>
//         <div className="flex items-center gap-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
//             <input 
//               value={q} onChange={e => setQ(e.target.value)} 
//               placeholder="Search name or email" 
//               className="pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm w-64 outline-none focus:border-blue-500 transition-all" 
//             />
//           </div>
//           <button onClick={logout} className="p-2 bg-slate-800 hover:bg-red-900/20 text-red-400 rounded-lg border border-slate-700 transition-all">
//             <LogOut size={18}/>
//           </button>
//         </div>
//       </header>

//       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
        
//         {/* REVERTED: PILL BUTTON FILTERS */}
//         <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//           <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-700">
//             {["All", "Pending", "Shortlisted", "Rejected"].map(status => (
//               <button 
//                 key={status}
//                 onClick={() => setFilters({...filters, status})}
//                 className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
//                   filters.status === status 
//                     ? 'bg-blue-600 text-white shadow-lg' 
//                     : 'text-slate-400 hover:text-white'
//                 }`}
//               >
//                 {status}
//               </button>
//             ))}
//           </div>
//           <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">
//             {filtered.length} Candidates
//           </div>
//         </div>

//         <table className="w-full text-left">
//           <thead>
//             <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-700/50">
//               <th className="p-4">Candidate</th>
//               <th className="p-4">AI Fit (1-5)</th>
//               <th className="p-4">Analysis</th>
//               <th className="p-4">Uploaded</th>
//               <th className="p-4">Status</th>
//               <th className="p-4 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-700/30">
//             {filtered.map((c) => (
//               <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
//                 <td className="p-4">
//                   <div className="font-bold text-sm">{c.name}</div>
//                   <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
//                     <Mail size={10}/> {c.email}
//                   </div>
//                 </td>
                
//                 <td className="p-4">
//                   <div className="flex items-center gap-2">
//                     <span className={`text-sm font-black ${c.fit_score >= 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
//                       {c.fit_score}/5
//                     </span>
//                     <div className="h-1 w-12 bg-slate-900 rounded-full overflow-hidden">
//                       <div className={`h-full ${c.fit_score >= 4 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${(c.fit_score / 5) * 100}%` }} />
//                     </div>
//                   </div>
//                 </td>

//                 <td className="p-4">
//                   <div className="flex flex-wrap gap-2">
//                     <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20 lowercase">
//                       {c.positive_point || 'Skillful'}
//                     </span>
//                     <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-500/20 lowercase">
//                       {c.negative_point || 'Experience'}
//                     </span>
//                   </div>
//                 </td>

//                 <td className="p-4 text-xs text-slate-400">
//                   <div className="flex items-center gap-1"><Calendar size={12}/> {c.upload_date}</div>
//                 </td>

//                 <td className="p-4">
//                   <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
//                     c.status === 'Shortlisted' ? 'bg-emerald-500/20 text-emerald-400' : 
//                     c.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
//                   }`}>
//                     {c.status || 'Pending'}
//                   </span>
//                 </td>

//                 <td className="p-4">
//                   <div className="flex items-center justify-center gap-2">
                    
//                     {/* NEW: DROPDOWN FOR ACTIONS */}
//                     <select 
//                       value={c.status || 'Pending'} 
//                       onChange={(e) => onUpdateStatus(c.id, e.target.value)}
//                       className="bg-slate-900 text-[11px] font-bold text-slate-300 border border-slate-600 rounded p-1.5 outline-none focus:border-blue-500 cursor-pointer"
//                     >
//                       <option value="Pending">Pending</option>
//                       <option value="Shortlisted">Shortlist</option>
//                       <option value="Rejected">Reject</option>
//                     </select>

//                     <button onClick={() => setSelectedCandidate(c)} className="p-1.5 bg-blue-600/10 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-all" title="AI Details">
//                       <Info size={16}/>
//                     </button>
//                     <a href={c.resume_url} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-all" title="View Resume">
//                       <ExternalLink size={16}/>
//                     </a>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* DETAILS POP-UP MODAL */}
//       {selectedCandidate && (
//         <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
//           <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
//             <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//               <div>
//                 <h3 className="text-xl font-bold">{selectedCandidate.name}</h3>
//                 <p className="text-sm text-blue-400">AI Deep Analysis</p>
//               </div>
//               <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 transition-all"><X size={20}/></button>
//             </div>
            
//             <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
//               <section>
//                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Justification</h4>
//                 <p className="text-sm leading-relaxed text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-700 italic">
//                   "{selectedCandidate.justification || 'No justification provided by AI.'}"
//                 </p>
//               </section>

//               <div className="grid md:grid-cols-2 gap-6">
//                 <section>
//                   <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-1">
//                     Reward Factors
//                   </h4>
//                   <div className="text-sm text-slate-400 leading-relaxed bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
//                     {selectedCandidate.reward_factors || 'No significant rewards identified.'}
//                   </div>
//                 </section>
//                 <section>
//                   <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1">
//                     Risk Factors
//                   </h4>
//                   <div className="text-sm text-slate-400 leading-relaxed bg-red-500/5 p-4 rounded-xl border border-red-500/10">
//                     {selectedCandidate.risk_factors || 'No critical risks found.'}
//                   </div>
//                 </section>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Recruiter;
// import React, { useMemo, useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import { 
//   Search, LogOut, Users, CheckCircle, XCircle, 
//   ExternalLink, BarChart3, Mail, Calendar, Info, X
// } from 'lucide-react';
// import toast from 'react-hot-toast';

// const Recruiter = () => {
//   const { user, logout } = useAuth();
//   const [candidates, setCandidates] = useState([]);
//   const [filters, setFilters] = useState({ status: 'All' });
//   const [q, setQ] = useState('');
//   const [selectedCandidate, setSelectedCandidate] = useState(null); // For Detail Pop-up

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         const res = await axios.get("http://localhost:8000/candidates/");
//         setCandidates(res.data);
//       } catch (err) {
//         toast.error("Database connection failed");
//       }
//     };
//     fetchCandidates();
//   }, []);

//   const filtered = useMemo(() => {
//     return candidates.filter(c => {
//       if (filters.status !== 'All' && c.status !== filters.status) return false;
//       if (q && !(c.name.toLowerCase().includes(q.toLowerCase()) || c.email.toLowerCase().includes(q.toLowerCase()))) return false;
//       return true;
//     });
//   }, [candidates, filters, q]);

//   const onUpdateStatus = (id, status) => {
//     setCandidates(prev => prev.map(p => p.id === id ? { ...p, status } : p));
//     toast.success(`Marked as ${status}`);
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
//       {/* Header */}
//       <header className="flex justify-between items-center mb-8">
//         <h1 className="text-2xl font-bold flex items-center gap-2">
//           <Users className="text-blue-500" /> Recruiter Dashboard
//         </h1>
//         <div className="flex items-center gap-4">
//           <input 
//             value={q} onChange={e => setQ(e.target.value)} 
//             placeholder="Search name or email" 
//             className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm w-64 outline-none focus:border-blue-500" 
//           />
//           <button onClick={logout} className="p-2 bg-slate-800 hover:bg-red-900/20 text-red-400 rounded-lg border border-slate-700"><LogOut size={18}/></button>
//         </div>
//       </header>

//       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
//         <div className="p-4 border-b border-slate-700 flex justify-between items-center">
//           <select 
//             className="bg-slate-700 text-sm p-2 rounded outline-none"
//             value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}
//           >
//             <option>All</option><option>Pending</option><option>Shortlisted</option><option>Rejected</option>
//           </select>
//           <div className="text-xs text-slate-400 uppercase tracking-widest">{filtered.length} Candidates</div>
//         </div>

//         <table className="w-full text-left">
//           <thead>
//             <tr className="text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-700/50">
//               <th className="p-4">Candidate</th>
//               <th className="p-4">AI Fit (1-5)</th>
//               <th className="p-4">Analysis</th>
//               <th className="p-4">Uploaded</th>
//               <th className="p-4">Status</th>
//               <th className="p-4 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-700/30">
//             {filtered.map((c) => (
//               <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
//                 <td className="p-4">
//                   <div className="font-bold text-sm">{c.name}</div>
//                   <div className="text-[11px] text-slate-500 flex items-center gap-1"><Mail size={10}/> {c.email}</div>
//                 </td>
                
//                 <td className="p-4">
//                   <div className="flex items-center gap-2">
//                     <span className={`text-sm font-black ${c.fit_score >= 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
//                       {c.fit_score}/5
//                     </span>
//                     <div className="h-1 w-12 bg-slate-900 rounded-full overflow-hidden">
//                       <div className={`h-full ${c.fit_score >= 4 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${(c.fit_score / 5) * 100}%` }} />
//                     </div>
//                   </div>
//                 </td>

//                 <td className="p-4">
//                   <div className="flex flex-wrap gap-2">
//                     <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-500/20 lowercase">
//                       {c.positive_point || 'Skillful'}
//                     </span>
//                     <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-500/20 lowercase">
//                       {c.negative_point || 'Experience'}
//                     </span>
//                   </div>
//                 </td>

//                 <td className="p-4 text-xs text-slate-400">
//                   <div className="flex items-center gap-1"><Calendar size={12}/> {c.upload_date}</div>
//                 </td>

//                 <td className="p-4">
//                   <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
//                     c.status === 'Shortlisted' ? 'bg-emerald-500/20 text-emerald-400' : 
//                     c.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
//                   }`}>
//                     {c.status || 'Pending'}
//                   </span>
//                 </td>

//                 <td className="p-4">
//                   <div className="flex items-center justify-center gap-2">
//                     <button onClick={() => onUpdateStatus(c.id, 'Shortlisted')} className="p-1.5 bg-emerald-600/10 text-emerald-500 rounded hover:bg-emerald-600 hover:text-white transition-all"><CheckCircle size={16}/></button>
//                     <button onClick={() => onUpdateStatus(c.id, 'Rejected')} className="p-1.5 bg-red-600/10 text-red-500 rounded hover:bg-red-600 hover:text-white transition-all"><XCircle size={16}/></button>
//                     <button onClick={() => setSelectedCandidate(c)} className="p-1.5 bg-blue-600/10 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-all" title="View Details"><Info size={16}/></button>
//                     <a href={c.resume_url} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-all"><ExternalLink size={16}/></a>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* DETAILS MODAL POP-UP */}
//       {selectedCandidate && (
//         <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
//           <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
//             <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
//               <div>
//                 <h3 className="text-xl font-bold">{selectedCandidate.name}</h3>
//                 <p className="text-sm text-blue-400">AI Deep Analysis</p>
//               </div>
//               <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400"><X size={20}/></button>
//             </div>
            
//             <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
//               <section>
//                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Justification</h4>
//                 <p className="text-sm leading-relaxed text-slate-300 bg-slate-900/50 p-4 rounded-xl border border-slate-700 italic">
//                   "{selectedCandidate.justification || 'No justification provided by AI.'}"
//                 </p>
//               </section>

//               <div className="grid md:grid-cols-2 gap-6">
//                 <section>
//                   <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-1">
//                     <CheckCircle size={14}/> Reward Factors
//                   </h4>
//                   <div className="text-sm text-slate-400 leading-relaxed bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
//                     {selectedCandidate.reward_factors || 'No significant rewards identified.'}
//                   </div>
//                 </section>
//                 <section>
//                   <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1">
//                     <XCircle size={14}/> Risk Factors
//                   </h4>
//                   <div className="text-sm text-slate-400 leading-relaxed bg-red-500/5 p-4 rounded-xl border border-red-500/10">
//                     {selectedCandidate.risk_factors || 'No critical risks found.'}
//                   </div>
//                 </section>
//               </div>
//             </div>
//             <div className="p-4 bg-slate-900/50 border-t border-slate-700 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
//               AI Assessment Complete • Version 2.0
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Recruiter;
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext';
// import { 
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
// } from 'recharts';
// import { 
//   Search, Filter, LogOut, CheckCircle, XCircle, User, 
//   ExternalLink, TrendingUp, AlertCircle 
// } from 'lucide-react';
// import toast from 'react-hot-toast';

// const Recruiter = () => {
//   const { user, logout } = useAuth();
//   const [candidates, setCandidates] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterStatus, setFilterStatus] = useState("All");

//   useEffect(() => {
//     fetchCandidates();
//   }, []);

//   const fetchCandidates = async () => {
//     try {
//       const response = await axios.get("http://localhost:8000/candidates/");
//       setCandidates(response.data);
//     } catch (err) {
//       toast.error("Failed to load candidates");
//     }
//   };

//   const handleStatusUpdate = async (id, newStatus) => {
//     try {
//       await axios.put(`http://localhost:8000/candidates/${id}/status`, { status: newStatus });
//       toast.success(`Candidate ${newStatus}`);
//       fetchCandidates(); // Refresh list
//     } catch (err) {
//       toast.error("Update failed");
//     }
//   };

//   // Filter Logic
//   const filteredCandidates = candidates.filter(c => {
//     const matchesSearch = `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesFilter = filterStatus === "All" || c.status === filterStatus;
//     return matchesSearch && matchesFilter;
//   });

//   const chartData = [
//     { name: 'High Fit', count: candidates.filter(c => c.overall_fit > 70).length, color: '#10b981' },
//     { name: 'Mid Fit', count: candidates.filter(c => c.overall_fit >= 40 && c.overall_fit <= 70).length, color: '#f59e0b' },
//     { name: 'Low Fit', count: candidates.filter(c => c.overall_fit < 40).length, color: '#ef4444' },
//   ];

//   return (
//     <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
//       {/* Header Area */}
//       <header className="flex justify-between items-center mb-10 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
//         <div>
//           <h1 className="text-2xl font-black tracking-tight text-white uppercase">Recruiter <span className="text-blue-500">Command</span></h1>
//           <p className="text-slate-400 text-sm">Reviewing {candidates.length} AI-analyzed applications</p>
//         </div>
//         <div className="flex items-center gap-6">
//           <div className="text-right">
//              <p className="text-sm font-bold text-white">{user?.full_name}</p>
//              <p className="text-xs text-slate-500 italic">Chief Recruiter</p>
//           </div>
//           <button onClick={logout} className="p-3 bg-slate-700 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-slate-600">
//             <LogOut size={20}/>
//           </button>
//         </div>
//       </header>

//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
//         {/* Sidebar Analytics */}
//         <div className="space-y-6">
//           <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
//             <h3 className="text-sm font-black text-slate-500 uppercase mb-4 flex items-center gap-2">
//               <TrendingUp size={16}/> Talent Distribution
//             </h3>
//             <div className="h-48">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={chartData}>
//                   <XAxis dataKey="name" hide />
//                   <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#0f172a', border: 'none'}} />
//                   <Bar dataKey="count" radius={[4, 4, 4, 4]}>
//                     {chartData.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={entry.color} />
//                     ))}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//             <div className="mt-4 space-y-2">
//               {chartData.map(item => (
//                 <div key={item.name} className="flex justify-between text-xs">
//                   <span className="text-slate-400">{item.name}</span>
//                   <span className="font-bold" style={{color: item.color}}>{item.count}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Main Content Area */}
//         <div className="lg:col-span-3 space-y-6">
          
//           {/* Controls */}
//           <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
//             <div className="relative w-full md:w-96">
//               <Search className="absolute left-3 top-3 text-slate-500" size={18} />
//               <input 
//                 type="text" 
//                 placeholder="Search candidates..." 
//                 className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>
//             <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
//               {["All", "Shortlisted", "Rejected", "Pending"].map(status => (
//                 <button 
//                   key={status}
//                   onClick={() => setFilterStatus(status)}
//                   className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === status ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
//                 >
//                   {status}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Table Container */}
//           <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
//             <table className="w-full text-left">
//               <thead>
//                 <tr className="bg-slate-900/50 text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-700">
//                   <th className="p-5 font-black">Candidate</th>
//                   <th className="p-5 font-black">AI Fit Score</th>
//                   <th className="p-5 font-black">Tone Analysis</th>
//                   <th className="p-5 font-black text-center">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-700/50">
//                 {filteredCandidates.map((c) => (
//                   <tr key={c.id} className="hover:bg-slate-700/20 transition-all group">
//                     <td className="p-5">
//                       <div className="flex items-center gap-3">
//                         <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
//                           {c.first_name[0]}{c.last_name[0]}
//                         </div>
//                         <div>
//                           <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{c.first_name} {c.last_name}</div>
//                           <div className="text-xs text-slate-500">{c.email}</div>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="p-5">
//                       <div className="flex items-center gap-3">
//                         <div className="flex-1 h-1.5 w-16 bg-slate-700 rounded-full overflow-hidden">
//                           <div 
//                             className={`h-full rounded-full ${c.overall_fit > 70 ? 'bg-emerald-500' : c.overall_fit > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
//                             style={{width: `${c.overall_fit}%`}}
//                           />
//                         </div>
//                         <span className={`text-sm font-black ${c.overall_fit > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
//                           {c.overall_fit}%
//                         </span>
//                       </div>
//                     </td>
//                     <td className="p-5">
//                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300 capitalize bg-slate-900/50 px-3 py-1 rounded-full border border-slate-700 w-fit">
//                          <AlertCircle size={12} className="text-blue-400"/> {c.tone_label || 'Neutral'}
//                        </span>
//                     </td>
//                     <td className="p-5">
//                       <div className="flex justify-center gap-2">
//                         <button 
//                           onClick={() => handleStatusUpdate(c.id, 'Shortlisted')}
//                           className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
//                           title="Shortlist"
//                         >
//                           <CheckCircle size={18}/>
//                         </button>
//                         <button 
//                           onClick={() => handleStatusUpdate(c.id, 'Rejected')}
//                           className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
//                           title="Reject"
//                         >
//                           <XCircle size={18}/>
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             {filteredCandidates.length === 0 && (
//               <div className="p-20 text-center flex flex-col items-center gap-4">
//                 <User size={48} className="text-slate-700 animate-pulse"/>
//                 <p className="text-slate-500 font-medium italic">No candidates found in this category.</p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Recruiter;
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
// import { useAuth } from '../context/AuthContext'; // 1. Import useAuth

// const Recruiter = () => {
//   const { user, logout } = useAuth(); // 2. Consume logout and user from context
//   const [candidates, setCandidates] = useState([]);

//   useEffect(() => {
//     const fetchCandidates = async () => {
//       try {
//         const response = await axios.get("http://localhost:8000/candidates/");
//         setCandidates(response.data);
//       } catch (err) {
//         console.error("Error fetching candidates:", err);
//       }
//     };
//     fetchCandidates();
//   }, []);

//   const chartData = [
//     { name: 'High Fit (>70)', count: candidates.filter(c => c.overall_fit > 70).length },
//     { name: 'Mid Fit (40-70)', count: candidates.filter(c => c.overall_fit >= 40 && c.overall_fit <= 70).length },
//     { name: 'Low Fit (<40)', count: candidates.filter(c => c.overall_fit < 40).length },
//   ];

//   return (
//     <div className="min-h-screen bg-slate-900 text-white p-8">
//       {/* Header Section */}
//       <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
//         <h1 className="text-2xl font-bold text-blue-400">Recruiter Dashboard</h1>
//         <div className="flex items-center gap-4">
//           {/* 3. Changed user.name to user.full_name to match your DB/Login response */}
//           <span className="text-slate-400">Logged in as: <strong>{user?.full_name || user?.name}</strong></span>
//           <button 
//             onClick={logout} // 4. Changed from onLogout to logout from context
//             className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm transition font-bold shadow-lg shadow-red-900/20"
//           >
//             Logout
//           </button>
//         </div>
//       </div>

//       {/* Analytics Chart */}
//       <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-8 h-64 shadow-xl">
//         <h3 className="text-slate-400 text-sm mb-4 font-bold uppercase tracking-wider">Candidate Fit Distribution</h3>
//         <ResponsiveContainer width="100%" height="100%">
//           <BarChart data={chartData}>
//             <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
//             <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
//             <Tooltip 
//               cursor={{fill: 'rgba(255,255,255,0.05)'}} 
//               contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px'}} 
//             />
//             <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60} />
//           </BarChart>
//         </ResponsiveContainer>
//       </div>

//       {/* Candidate Table */}
//       <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
//         <div className="p-6 border-b border-slate-700 bg-slate-800/50">
//           <h3 className="font-bold text-lg">Total Candidates Processed: {candidates.length}</h3>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full text-left border-collapse">
//             <thead>
//               <tr className="bg-slate-900/50 text-slate-500 text-xs uppercase tracking-widest">
//                 <th className="p-4 font-semibold">Name</th>
//                 <th className="p-4 font-semibold">Email</th>
//                 <th className="p-4 font-semibold">Fit Score</th>
//                 <th className="p-4 font-semibold">Tone</th>
//                 <th className="p-4 font-semibold text-center">Status</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-700">
//               {candidates.map((c) => (
//                 <tr key={c.id} className="hover:bg-slate-700/30 transition-colors group">
//                   <td className="p-4 font-medium">{c.first_name} {c.last_name}</td>
//                   <td className="p-4 text-slate-400">{c.email}</td>
//                   <td className="p-4">
//                     <div className="flex items-center gap-2">
//                       <div className="w-16 bg-slate-700 h-1.5 rounded-full overflow-hidden">
//                         <div 
//                           className={`h-full rounded-full ${c.overall_fit > 70 ? 'bg-green-500' : 'bg-yellow-500'}`}
//                           style={{width: `${c.overall_fit}%`}}
//                         ></div>
//                       </div>
//                       <span className={`font-bold ${c.overall_fit > 70 ? 'text-green-400' : 'text-yellow-400'}`}>
//                         {c.overall_fit}%
//                       </span>
//                     </div>
//                   </td>
//                   <td className="p-4 italic text-slate-300 capitalize">{c.tone_label}</td>
//                   <td className="p-4 text-center">
//                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
//                       c.status === 'Shortlisted' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
//                       c.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
//                       'bg-blue-500/10 text-blue-400 border border-blue-500/20'
//                     }`}>
//                       {c.status || 'Pending'}
//                     </span>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           {candidates.length === 0 && (
//             <div className="p-10 text-center text-slate-500 italic">
//               No candidates found in the database.
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Recruiter;// THIS LINE IS CRITICAL

// import React, { useEffect, useState } from 'react';
// import { api } from '../services/api';
// import { 
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
// } from 'recharts';
// import { AlertTriangle, Filter, Download } from 'lucide-react';

// const Recruiter = () => {
//   const [candidates, setCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     const data = await api.getCandidates();
//     setCandidates(data);
//     setLoading(false);
//   };

//   const avgFit = candidates.length > 0 ? (candidates.reduce((acc, c) => acc + c.overall_fit, 0) / candidates.length).toFixed(1) : 0;
  
//   const toneData = [
//     { name: 'Professional', value: candidates.filter(c => c.tone_label === 'Professional').length },
//     { name: 'Casual', value: candidates.filter(c => c.tone_label === 'Casual').length },
//     { name: 'Neutral', value: candidates.filter(c => c.tone_label === 'Neutral').length },
//   ];

//   const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6'];

//   return (
//     <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10">
//       <header className="flex justify-between items-center mb-10">
//         <div>
//           <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Recruitment OS</h1>
//           <p className="text-slate-400">Live Database Overview</p>
//         </div>
//         <button onClick={loadData} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg border border-slate-700">Refresh Data</button>
//       </header>

//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
//           <p className="text-slate-400 text-sm">Total Candidates</p>
//           <h2 className="text-3xl font-bold text-white">{candidates.length}</h2>
//         </div>
//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
//           <p className="text-slate-400 text-sm">Avg Fit Score</p>
//           <h2 className="text-3xl font-bold text-green-400">{avgFit}%</h2>
//         </div>
//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
//            <p className="text-slate-400 text-sm">High Risk Detected</p>
//            <h2 className="text-3xl font-bold text-red-400">{candidates.filter(c => c.risk_factor !== 'None' && c.risk_factor !== null).length}</h2>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
//           <h3 className="text-lg font-bold mb-4">Fit Score Analysis</h3>
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={candidates}>
//                 <XAxis dataKey="first_name" stroke="#64748b" />
//                 <YAxis stroke="#64748b" />
//                 <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none'}} />
//                 <Bar dataKey="overall_fit" fill="#6366f1" radius={[4, 4, 0, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
//           <h3 className="text-lg font-bold mb-4">Tone Distribution</h3>
//           <div className="h-64 flex justify-center">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie data={toneData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
//                   {toneData.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                   ))}
//                 </Pie>
//                 <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none'}} />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>

//       <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
//         <div className="p-6 border-b border-slate-700 flex justify-between">
//           <h3 className="text-lg font-bold">Candidate Database</h3>
//           <div className="flex gap-2">
//             <button className="p-2 hover:bg-slate-700 rounded"><Filter size={18}/></button>
//             <button className="p-2 hover:bg-slate-700 rounded"><Download size={18}/></button>
//           </div>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full text-left">
//             <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase">
//               <tr>
//                 <th className="p-4">Name</th>
//                 <th className="p-4">Overall Fit</th>
//                 <th className="p-4">Risk Factor</th>
//                 <th className="p-4">Tone</th>
//                 <th className="p-4">Justification</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-700">
//               {loading ? <tr><td className="p-4">Loading...</td></tr> : candidates.map((c) => (
//                 <tr key={c.id} className="hover:bg-slate-700/50 transition-colors">
//                   <td className="p-4 font-medium text-white">{c.first_name} {c.last_name}</td>
//                   <td className="p-4">
//                     <span className={`px-2 py-1 rounded text-xs font-bold ${c.overall_fit > 80 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
//                       {c.overall_fit}%
//                     </span>
//                   </td>
//                   <td className="p-4">
//                     {c.risk_factor && c.risk_factor !== 'None' ? (
//                       <span className="flex items-center gap-1 text-red-400 text-xs font-bold bg-red-400/10 px-2 py-1 rounded w-fit">
//                         <AlertTriangle size={12} /> {c.risk_factor}
//                       </span>
//                     ) : <span className="text-slate-500 text-xs">Safe</span>}
//                   </td>
//                   <td className="p-4 text-slate-300 text-sm capitalize">{c.tone_label}</td>
//                   <td className="p-4 text-slate-400 text-sm truncate max-w-xs">{c.justification}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Recruiter;

// import React, { useEffect, useState } from 'react';
// import { api } from '../services/api';
// import { 
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
// } from 'recharts';
// import { AlertTriangle, Filter, Download } from 'lucide-react';

// const Recruiter = () => {
//   const [candidates, setCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     const data = await api.getCandidates();
//     setCandidates(data);
//     setLoading(false);
//   };

//   const avgFit = candidates.length > 0 ? (candidates.reduce((acc, c) => acc + c.overall_fit, 0) / candidates.length).toFixed(1) : 0;
  
//   const toneData = [
//     { name: 'Professional', value: candidates.filter(c => c.tone_label === 'Professional').length },
//     { name: 'Casual', value: candidates.filter(c => c.tone_label === 'Casual').length },
//     { name: 'Neutral', value: candidates.filter(c => c.tone_label === 'Neutral').length },
//   ];

//   const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6'];

//   return (
//     <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10">
//       <header className="flex justify-between items-center mb-10">
//         <div>
//           <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Recruitment OS</h1>
//           <p className="text-slate-400">Live Database Overview</p>
//         </div>
//         <button onClick={loadData} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg border border-slate-700">Refresh Data</button>
//       </header>

//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
//           <p className="text-slate-400 text-sm">Total Candidates</p>
//           <h2 className="text-3xl font-bold text-white">{candidates.length}</h2>
//         </div>
//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
//           <p className="text-slate-400 text-sm">Avg Fit Score</p>
//           <h2 className="text-3xl font-bold text-green-400">{avgFit}%</h2>
//         </div>
//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
//            <p className="text-slate-400 text-sm">High Risk Detected</p>
//            <h2 className="text-3xl font-bold text-red-400">{candidates.filter(c => c.risk_factor !== 'None' && c.risk_factor !== null).length}</h2>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
//           <h3 className="text-lg font-bold mb-4">Fit Score Analysis</h3>
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={candidates}>
//                 <XAxis dataKey="first_name" stroke="#64748b" />
//                 <YAxis stroke="#64748b" />
//                 <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none'}} />
//                 <Bar dataKey="overall_fit" fill="#6366f1" radius={[4, 4, 0, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
//           <h3 className="text-lg font-bold mb-4">Tone Distribution</h3>
//           <div className="h-64 flex justify-center">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie data={toneData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
//                   {toneData.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                   ))}
//                 </Pie>
//                 <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none'}} />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>

//       <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
//         <div className="p-6 border-b border-slate-700 flex justify-between">
//           <h3 className="text-lg font-bold">Candidate Database</h3>
//           <div className="flex gap-2">
//             <button className="p-2 hover:bg-slate-700 rounded"><Filter size={18}/></button>
//             <button className="p-2 hover:bg-slate-700 rounded"><Download size={18}/></button>
//           </div>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full text-left">
//             <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase">
//               <tr>
//                 <th className="p-4">Name</th>
//                 <th className="p-4">Overall Fit</th>
//                 <th className="p-4">Risk Factor</th>
//                 <th className="p-4">Tone</th>
//                 <th className="p-4">Justification</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-700">
//               {loading ? <tr><td className="p-4">Loading...</td></tr> : candidates.map((c) => (
//                 <tr key={c.id} className="hover:bg-slate-700/50 transition-colors">
//                   <td className="p-4 font-medium text-white">{c.first_name} {c.last_name}</td>
//                   <td className="p-4">
//                     <span className={`px-2 py-1 rounded text-xs font-bold ${c.overall_fit > 80 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
//                       {c.overall_fit}%
//                     </span>
//                   </td>
//                   <td className="p-4">
//                     {c.risk_factor && c.risk_factor !== 'None' ? (
//                       <span className="flex items-center gap-1 text-red-400 text-xs font-bold bg-red-400/10 px-2 py-1 rounded w-fit">
//                         <AlertTriangle size={12} /> {c.risk_factor}
//                       </span>
//                     ) : <span className="text-slate-500 text-xs">Safe</span>}
//                   </td>
//                   <td className="p-4 text-slate-300 text-sm capitalize">{c.tone_label}</td>
//                   <td className="p-4 text-slate-400 text-sm truncate max-w-xs">{c.justification}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Recruiter;


// import React, { useEffect, useState } from 'react';
// import { api } from '../services/api';
// import { Download, RefreshCw, Filter } from 'lucide-react';

// const Recruiter = () => {
//   const [candidates, setCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     setLoading(true);
//     try {
//       const data = await api.getCandidates();
//       console.log("FRESH DATA LOADED:", data); // Check Console (F12)
//       setCandidates(data);
//     } catch (error) {
//       console.error("Failed to load", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatText = (text) => {
//     if (!text) return "-";
//     if (text.length > 50) return text.substring(0, 50) + "...";
//     return text;
//   };

//   return (
//     <div className="min-h-screen bg-slate-900 text-white p-4">
      
//       {/* --- VISUAL PROOF BAR (If you don't see this, the code didn't update) --- */}
//       <div className="bg-red-600 text-white font-bold text-center p-2 mb-4 animate-pulse rounded">
//         ⚠️ DEBUG MODE: IF YOU SEE THIS, THE CODE UPDATED! SCROLL TABLE RIGHT ➡️
//       </div>

//       <header className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-2xl font-bold text-blue-400">Master Database View</h1>
//           <p className="text-slate-400 text-sm">Showing {candidates.length} Rows</p>
//         </div>
//         <button onClick={loadData} className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded text-sm font-bold">
//           <RefreshCw size={16} /> Refresh
//         </button>
//       </header>

//       {/* --- SCROLLABLE CONTAINER --- */}
//       <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800 shadow-2xl">
        
//         {/* Horizontal Scroll Area */}
//         <div className="overflow-x-auto overflow-y-auto max-h-[80vh] w-full border-4 border-yellow-500">
          
//           {/* WIDE TABLE (3000px) */}
//           <table className="min-w-[3000px] w-full text-left border-collapse text-sm">
//             <thead className="bg-slate-950 text-slate-300 uppercase text-xs sticky top-0 z-10">
//               <tr>
//                 <th className="p-3 border min-w-[50px] sticky left-0 bg-slate-900 z-20">ID</th>
//                 <th className="p-3 border min-w-[150px] sticky left-[50px] bg-slate-900 z-20">First Name</th>
//                 <th className="p-3 border min-w-[150px]">Last Name</th>
//                 <th className="p-3 border min-w-[200px]">Email</th>
//                 <th className="p-3 border min-w-[100px] text-center">Fit %</th>
//                 <th className="p-3 border min-w-[100px] text-center">Stability</th>
//                 <th className="p-3 border min-w-[300px] bg-red-900/20">Risk Factor</th>
//                 <th className="p-3 border min-w-[300px] bg-green-900/20">Reward Factor</th>
//                 <th className="p-3 border min-w-[250px]">Strengths</th>
//                 <th className="p-3 border min-w-[250px]">Weaknesses</th>
//                 <th className="p-3 border min-w-[150px]">Tone</th>
//                 <th className="p-3 border min-w-[100px]">Grammar</th>
//                 <th className="p-3 border min-w-[300px]">Justification</th>
//                 <th className="p-3 border min-w-[200px]">Soft Skills</th>
//                 <th className="p-3 border min-w-[150px]">Entities</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-700">
//               {candidates.map((c) => (
//                 <tr key={c.id} className="hover:bg-slate-700/50">
//                   <td className="p-3 border border-slate-700 sticky left-0 bg-slate-800">{c.id}</td>
//                   <td className="p-3 border border-slate-700 sticky left-[50px] bg-slate-800 font-bold text-white">{c.first_name}</td>
//                   <td className="p-3 border border-slate-700">{c.last_name}</td>
//                   <td className="p-3 border border-slate-700 text-blue-400">{c.email}</td>
//                   <td className="p-3 border border-slate-700 text-center font-bold">{c.overall_fit}%</td>
//                   <td className="p-3 border border-slate-700 text-center">{c.job_stability_score}</td>
//                   <td className="p-3 border border-slate-700 text-red-300" title={c.risk_factor}>{formatText(c.risk_factor)}</td>
//                   <td className="p-3 border border-slate-700 text-green-300" title={c.reward_factor}>{formatText(c.reward_factor)}</td>
//                   <td className="p-3 border border-slate-700 text-slate-400">{formatText(c.strengths)}</td>
//                   <td className="p-3 border border-slate-700 text-slate-400">{formatText(c.weaknesses)}</td>
//                   <td className="p-3 border border-slate-700">{c.tone_label}</td>
//                   <td className="p-3 border border-slate-700">{c.grammar_mistakes}</td>
//                   <td className="p-3 border border-slate-700 italic">{formatText(c.justification)}</td>
//                   <td className="p-3 border border-slate-700">{formatText(c.soft_skills)}</td>
//                   <td className="p-3 border border-slate-700">{formatText(c.entities)}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Recruiter;
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
/////////////////////////////////////////////////
// import React, { useEffect, useState } from 'react';
// import { api } from '../services/api';
// import { 
//   BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
// } from 'recharts';
// import { AlertTriangle, Search, Filter, Download } from 'lucide-react';

// const Recruiter = () => {
//   const [candidates, setCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     const data = await api.getCandidates();
//     setCandidates(data);
//     setLoading(false);
//   };

//   const avgFit = candidates.length > 0 ? (candidates.reduce((acc, c) => acc + c.overall_fit, 0) / candidates.length).toFixed(1) : 0;
  
//   // Prepare Data for Tone Chart
//   const toneData = [
//     { name: 'Professional', value: candidates.filter(c => c.tone_label === 'professional').length },
//     { name: 'Casual', value: candidates.filter(c => c.tone_label === 'casual').length },
//     { name: 'Neutral', value: candidates.filter(c => c.tone_label === 'neutral').length },
//   ];

//   const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6'];

//   return (
//     <div className="min-h-screen bg-slate-900 text-white p-6 md:p-10">
//       <header className="flex justify-between items-center mb-10">
//         <div>
//           <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Recruitment OS</h1>
//           <p className="text-slate-400">Live Database Overview</p>
//         </div>
//         <button onClick={loadData} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg border border-slate-700">Refresh Data</button>
//       </header>

//       {/* KPI Section */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
//           <p className="text-slate-400 text-sm">Total Candidates</p>
//           <h2 className="text-3xl font-bold text-white">{candidates.length}</h2>
//         </div>
//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
//           <p className="text-slate-400 text-sm">Avg Fit Score</p>
//           <h2 className="text-3xl font-bold text-green-400">{avgFit}%</h2>
//         </div>
//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
//            <p className="text-slate-400 text-sm">High Risk Detected</p>
//            <h2 className="text-3xl font-bold text-red-400">{candidates.filter(c => c.risk_factor !== 'None' && c.risk_factor !== null).length}</h2>
//         </div>
//       </div>

//       {/* Charts Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
//           <h3 className="text-lg font-bold mb-4">Fit Score Analysis</h3>
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={candidates}>
//                 <XAxis dataKey="first_name" stroke="#64748b" />
//                 <YAxis stroke="#64748b" />
//                 <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none'}} />
//                 <Bar dataKey="overall_fit" fill="#6366f1" radius={[4, 4, 0, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
//           <h3 className="text-lg font-bold mb-4">Tone Distribution</h3>
//           <div className="h-64 flex justify-center">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie data={toneData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
//                   {toneData.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                   ))}
//                 </Pie>
//                 <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none'}} />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>

//       {/* Database Table */}
//       <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
//         <div className="p-6 border-b border-slate-700 flex justify-between">
//           <h3 className="text-lg font-bold">Candidate Database</h3>
//           <div className="flex gap-2">
//             <button className="p-2 hover:bg-slate-700 rounded"><Filter size={18}/></button>
//             <button className="p-2 hover:bg-slate-700 rounded"><Download size={18}/></button>
//           </div>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full text-left">
//             <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase">
//               <tr>
//                 <th className="p-4">Name</th>
//                 <th className="p-4">Overall Fit</th>
//                 <th className="p-4">Risk Factor</th>
//                 <th className="p-4">Tone</th>
//                 <th className="p-4">Justification</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-700">
//               {loading ? <tr><td className="p-4">Loading...</td></tr> : candidates.map((c) => (
//                 <tr key={c.id} className="hover:bg-slate-700/50 transition-colors">
//                   <td className="p-4 font-medium text-white">{c.first_name} {c.last_name}</td>
//                   <td className="p-4">
//                     <span className={`px-2 py-1 rounded text-xs font-bold ${c.overall_fit > 80 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
//                       {c.overall_fit}%
//                     </span>
//                   </td>
//                   <td className="p-4">
//                     {c.risk_factor && c.risk_factor !== 'None' ? (
//                       <span className="flex items-center gap-1 text-red-400 text-xs font-bold bg-red-400/10 px-2 py-1 rounded w-fit">
//                         <AlertTriangle size={12} /> {c.risk_factor}
//                       </span>
//                     ) : <span className="text-slate-500 text-xs">Safe</span>}
//                   </td>
//                   <td className="p-4 text-slate-300 text-sm capitalize">{c.tone_label}</td>
//                   <td className="p-4 text-slate-400 text-sm truncate max-w-xs">{c.justification}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Recruiter;