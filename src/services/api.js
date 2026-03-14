import axios from 'axios';

// POINTS TO YOUR N8N WEBHOOK
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_URL; 

// POINTS TO YOUR FASTAPI
const FASTAPI_URL = import.meta.env.VITE_API_URL;

export const api = {
  // 1. Applicant uploads resume -> Sends to n8n
  uploadResume: async (file, name, email) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('candidate_name', name); 
    formData.append('email', email);
    
    // Direct POST to n8n
    const response = await axios.post(N8N_WEBHOOK_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // 2. Recruiter fetches data -> Reads from FastAPI (MySQL)
  getCandidates: async () => {
    try {
      const response = await axios.get(`${FASTAPI_URL}/candidates/`);
      return response.data;
    } catch (error) {
      console.error("Database connection failed:", error);
      return []; 
    }
  }
};





// import axios from 'axios';

// // POINTS TO YOUR N8N WEBHOOK
// const N8N_WEBHOOK_URL = process.env.REACT_APP_N8N_URL; 

// // POINTS TO YOUR FASTAPI
// const FASTAPI_URL = process.env.REACT_APP_API_URL;

// export const api = {
//   // 1. Applicant uploads resume -> Sends to n8n
//   uploadResume: async (file, name, email) => {
//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('candidate_name', name); 
//     formData.append('email', email);
    
//     // Direct POST to n8n
//     const response = await axios.post(N8N_WEBHOOK_URL, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' }
//     });
//     return response.data;
//   },

//   // 2. Recruiter fetches data -> Reads from FastAPI (MySQL)
//   getCandidates: async () => {
//     try {
//       const response = await axios.get(`${FASTAPI_URL}/candidates/`);
//       return response.data;
//     } catch (error) {
//       console.error("Database connection failed:", error);
//       return []; 
//     }
//   }
// };



// import axios from 'axios';

// // POINTS TO YOUR N8N WEBHOOK
// const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/resume-upload'; 

// // POINTS TO YOUR FASTAPI
// const FASTAPI_URL = 'http://localhost:8000';

// export const api = {
//   // 1. Applicant uploads resume -> Sends to n8n
//   uploadResume: async (file, name, email) => {
//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('candidate_name', name); 
//     formData.append('email', email);
    
//     // Direct POST to n8n
//     const response = await axios.post(N8N_WEBHOOK_URL, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' }
//     });
//     return response.data;
//   },

//   // 2. Recruiter fetches data -> Reads from FastAPI (MySQL)
//   getCandidates: async () => {
//     try {
//       const response = await axios.get(`${FASTAPI_URL}/candidates/`);
//       return response.data;
//     } catch (error) {
//       console.error("Database connection failed:", error);
//       return []; 
//     }
//   }
// };
// import axios from 'axios';

// // POINTS TO YOUR N8N WEBHOOK (Check your n8n for exact URL)
// const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/resume-upload'; 

// // POINTS TO YOUR FASTAPI (For reading DB)
// const FASTAPI_URL = 'http://localhost:8000';

// export const api = {
//   // 1. Applicant uploads resume -> Sends to n8n
//   uploadResume: async (file, name, email) => {
//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('candidate_name', name); // Matches n8n field
//     formData.append('email', email);
    
//     // Direct POST to n8n
//     const response = await axios.post(N8N_WEBHOOK_URL, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' }
//     });
//     return response.data;
//   },

//   // 2. Recruiter fetches data -> Reads from FastAPI (MySQL)
//   getCandidates: async () => {
//     try {
//       const response = await axios.get(`${FASTAPI_URL}/candidates/`);
//       return response.data;
//     } catch (error) {
//       console.error("Database connection failed:", error);
//       return []; // Return empty array if DB is offline
//     }
//   }
// };