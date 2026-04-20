// "use client";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Search, MapPin, User, LogOut, Navigation,
//   CheckCircle2, AlertCircle, Fingerprint, Activity
// } from "lucide-react";

// export default function LoanSearchPage() {
//   const router = useRouter();
//   const [mounted, setMounted] = useState(false);
//   const [loanNumber, setLoanNumber] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const [loggedInAgent, setLoggedInAgent] = useState(null);
//   const [currentCustomer, setCurrentCustomer] = useState(null);

//   useEffect(() => {
//     setMounted(true);
//     try {
//       const savedAgent = localStorage.getItem("agent");
//       const savedCustomer = localStorage.getItem("customer");
//       if (savedAgent && savedAgent !== "undefined") setLoggedInAgent(JSON.parse(savedAgent));
//       if (savedCustomer && savedCustomer !== "undefined") setCurrentCustomer(JSON.parse(savedCustomer));
//     } catch (err) {
//       localStorage.removeItem("agent");
//       localStorage.removeItem("customer");
//     }
//   }, []);

//   const handleLogout = () => {
//     localStorage.removeItem("agent");
//     localStorage.removeItem("customer");
//     window.location.reload();
//   };

//   const startVerification = () => {
//     if (currentCustomer?._id || currentCustomer?.id) {
//       window.location.href = `/verify/${currentCustomer._id || currentCustomer.id}`;
//     }
//   };

//   const openNavigation = () => {
//     if (currentCustomer?.address) {
//       window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentCustomer.address)}`, '_blank');
//     }
//   };

//   const handleLocateAccount = async () => {
//     if (!loanNumber.trim()) {
//       setError("Please enter a valid loan number");
//       return;
//     }
//     setLoading(true);
//     setError("");
//     try {
//       const res = await fetch(`/api/customers/search?loan=${loanNumber}`);
//       const data = await res.json();
//       if (data.data) {
//         setLoggedInAgent(data.data.agentId);
//         setCurrentCustomer(data.data);
//         localStorage.setItem("agent", JSON.stringify(data.data.agentId));
//         localStorage.setItem("customer", JSON.stringify(data.data));
//       } else {
//         setError(data?.msg || "Loan account not found.");
//       }
//     } catch (err) {
//       setError("Connection failed. Try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Global Style for Century Gothic
//   const gothicStack = { fontFamily: '"Century Gothic", AppleGothic, sans-serif' };

//   if (!mounted) return null;

//   // --- DASHBOARD VIEW (AFTER SEARCH) ---
//   if (loggedInAgent && currentCustomer) {
//     return (
//       <div style={gothicStack} className="min-h-screen bg-[#FDFBFF] text-[#2D0060] flex flex-col">
//         {/* Header - Matching Screenshot Style */}
//         <header className="px-6 py-6 bg-[#2D0060] border-b top-0 sticky border-gray-100 flex justify-between items-center">
//           <div className="flex items-center gap-3">
//             <div className="p-2 bg-[#fff]/5 rounded-full">
//               <User size={20} className="text-[#fff]" />
//             </div>
//             <div>
//               <p className="text-[10px] font-bold uppercase tracking-widest text-gray-100">Logged in as Agent</p>
//               <h1 className="text-2xl font-black text-white tracking-tight">{loggedInAgent.name}</h1>
//             </div>
//           </div>
//           <button onClick={handleLogout} className="p-3 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">
//             <LogOut size={20} />
//           </button>
//         </header>

//         <main className="flex-1 p-6 space-y-6 max-w-xl mx-auto w-full">
//           {/* Customer Card */}
//           <div className="bg-[#F8F6FF] rounded-[2rem] border border-[#2D0060]/10 overflow-hidden shadow-sm">
//             <div className="p-6 flex justify-between items-start">
//               <div>
//                 <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mb-1">Assigned Customer</p>
//                 <h2 className="text-3xl font-black tracking-tight text-gray-900">{currentCustomer.name}</h2>
//               </div>
//               <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
//                 ACTIVE
//               </div>
//             </div>

//             <div className="px-6 pb-6 space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="p-4 bg-white rounded-2xl border border-gray-50">
//                   <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Loan Account</p>
//                   <p className="text-sm font-black text-[#2D0060]">{currentCustomer.loan}</p>
//                 </div>
//                 <div className="p-4 bg-white rounded-2xl border border-gray-50">
//                   <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
//                   <div className="flex items-center gap-1.5 mt-0.5">
//                     <CheckCircle2 size={14} className="text-emerald-600" />
//                     <span className="text-xs font-black text-emerald-600 uppercase">Verified</span>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-50 items-start">
//                 <MapPin size={20} className="text-gray-400 shrink-0 mt-0.5" />
//                 <div>
//                   <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Collection Address</p>
//                   <p className="text-xs font-semibold leading-relaxed text-gray-600">{currentCustomer.address}</p>
//                 </div>
//               </div>

//               <div className="space-y-3 pt-4">
//                 <button
//                   onClick={() => router.push('/agent/journey')}
//                   className="w-full py-5 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
//                 >
//                   <Activity size={18} />
//                   Track My Journey
//                 </button>

//                 <button
//                   onClick={openNavigation}
//                   className="w-full py-5 rounded-2xl bg-white border-2 border-[#2D0060] text-[#2D0060] font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
//                 >
//                   <Navigation size={18} />
//                   Navigate to Location
//                 </button>
//               </div>
//             </div>
//           </div>

//           <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] px-8 leading-relaxed">
//             Ensure you are at the customer's location before starting the biometric verification.
//           </p>
//         </main>
//       </div>
//     );
//   }

//   // --- SEARCH VIEW ---
//   return (
//     <div style={gothicStack} className="min-h-screen bg-[#2D0060] text-white flex flex-col justify-center p-6">
//       <div className="max-w-sm mx-auto w-full space-y-10">
//         <div className="text-center space-y-4">
//           <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-sm border border-white/10">
//             <Search size={36} className="text-white" />
//           </div>
//           <div className="space-y-1">
//             <h1 className="text-3xl font-black uppercase tracking-tighter italic">Account <span className="text-purple-300 not-italic">Locator</span></h1>
//             <p className="text-[10px] font-bold text-purple-200/50 uppercase tracking-[0.4em]">Agent Verification System</p>
//           </div>
//         </div>

//         <div className="space-y-6">
//           <div className="space-y-2">
//             <label className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-200/60 ml-1">Loan Number</label>
//             <input
//               type="text"
//               value={loanNumber}
//               onChange={(e) => { setLoanNumber(e.target.value); setError(""); }}
//               onKeyDown={(e) => e.key === 'Enter' && handleLocateAccount()}
//               placeholder="e.g. LN-MH-1003"
//               className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-5 focus:border-white focus:outline-none text-lg font-bold transition-all placeholder:text-white/20 shadow-inner"
//             />
//           </div>

//           {error && (
//             <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 animate-bounce">
//               <AlertCircle size={18} className="text-red-400" />
//               <p className="text-xs font-bold uppercase tracking-widest text-red-200">{error}</p>
//             </div>
//           )}

//           <button
//             onClick={handleLocateAccount}
//             disabled={loading}
//             className="w-full py-5 rounded-2xl bg-white text-[#2D0060] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
//           >
//             {loading ? "Searching Database..." : "Locate Account"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, User, LogOut, Navigation, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";

export default function LoanSearchPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loanNumber, setLoanNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auth state
  const [loggedInAgent, setLoggedInAgent] = useState(null);
  const [currentCustomer, setCurrentCustomer] = useState(null);

  useEffect(() => {
    try {
      const savedAgent = localStorage.getItem("agent");
      const savedCustomer = localStorage.getItem("customer");
      if (savedAgent && savedAgent !== "undefined") setLoggedInAgent(JSON.parse(savedAgent));
      if (savedCustomer && savedCustomer !== "undefined") setCurrentCustomer(JSON.parse(savedCustomer));
    } catch (err) {
      localStorage.removeItem("agent");
      localStorage.removeItem("customer");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("agent");
    localStorage.removeItem("customer");
    window.location.reload();
  };

  const startVerification = () => {
    if (currentCustomer?._id || currentCustomer?.id) {
      window.location.href = `/verify/${currentCustomer._id || currentCustomer.id}`;
    }
  };

  const openNavigation = () => {
    if (currentCustomer?.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentCustomer.address)}`, '_blank');
    }
  };

  const handleLocateAccount = async () => {
    if (!loanNumber.trim()) {
      setError("Please enter a loan number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Search for customer by loan number
      const res = await fetch(`/api/customers/search?loan=${loanNumber}`);

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data = await res.json();

      if (data.data) {
        const customer = data.data;
        const agent = customer.agentId;

        if (agent) {
          try {
            localStorage.setItem("agent", JSON.stringify(agent));
            localStorage.setItem("customer", JSON.stringify(customer));
          } catch (storageErr) {
            console.error("Storage fail", storageErr);
          }

          setLoggedInAgent(agent);
          setCurrentCustomer(customer);
        } else {
          setError("No agent assigned to this loan account.");
        }
      } else {
        setError(data?.msg || "Loan account not found. Please check and try again.");
      }
    } catch (err) {
      setError("Failed to locate account. " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLocateAccount();
    }
  };

  if (loggedInAgent && currentCustomer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9F7FF] to-[#F0E9FF] text-gray-900 flex flex-col font-sans" suppressHydrationWarning>
        <header className="px-6 py-5 border-b border-[#2d0060]/10 bg-white shadow-sm relative">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-70">
                Logged in as Agent
              </p>
              <h1 className="text-xl font-black tracking-tight mt-0.5 flex items-center gap-2">
                <User size={18} className="text-[#2d0060]" />
                {loggedInAgent.name}
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
              suppressHydrationWarning
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-[#2d0060]/5 p-6 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Assigned Customer</p>
                  <h2 className="text-2xl font-black tracking-tight text-gray-900">{currentCustomer.name}</h2>
                </div>
                <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                  ACTIVE
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Loan Account</p>
                  <p className="text-sm font-black text-[#2d0060]">{currentCustomer.loan}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Status</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {currentCustomer.verifiedAgentImage ? (
                      <span className="text-xs font-bold text-emerald-600">✅ VERIFIED</span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600">⏳ PENDING</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 items-start">
                <MapPin size={20} className="text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Collection Address</p>
                  <p className="text-xs font-semibold leading-relaxed text-gray-700">{currentCustomer.address || "No address provided"}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {!currentCustomer.verifiedAgentImage && (
                  <button
                    onClick={startVerification}
                    className="w-full py-5 rounded-2xl bg-[#2d0060] text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-3 active:scale-[0.98]"
                    suppressHydrationWarning
                  >
                    <User size={18} />
                    Start Verification
                  </button>
                )}

                <button
                  onClick={() => router.push('/agent/journey')}
                  className="w-full py-5 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-3 active:scale-[0.98]"
                  suppressHydrationWarning
                >
                  <MapPin size={18} />
                  Track My Journey
                </button>

                <button
                  onClick={openNavigation}
                  className="w-full py-5 rounded-2xl bg-white border-2 border-[#2d0060] text-[#2d0060] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.98]"
                  suppressHydrationWarning
                >
                  <Navigation size={18} />
                  Navigate to Location
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest px-8 leading-relaxed">
            Ensure you are at the customer's location before starting the biometric verification.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F7FF] to-[#F0E9FF] text-gray-900 flex flex-col font-sans" suppressHydrationWarning>
      <header className="px-6 py-6 border-b border-[#2d0060]/10 bg-white shadow-sm">
        <div className="text-center">
          <p className="text-[8px] font-black text-[#2d0060] uppercase tracking-[0.4em]">
            Agent Verification System
          </p>
          <h1 className="text-lg md:text-2xl font-black uppercase tracking-widest text-gray-900 mt-1">
            Account Locator
          </h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start md:justify-center p-5 md:p-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#2d0060]/10 p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-[#2d0060]/10 rounded-full flex items-center justify-center mx-auto">
                <Search size={32} className="text-[#2d0060]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tighter leading-tight">
                Locate <br />
                <span className="text-[#2d0060]">Account</span>
              </h2>
              <p className="text-xs text-gray-500 font-semibold tracking-wide mt-3">
                Enter the customer's loan account number to proceed
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-gray-700 uppercase tracking-widest block">
                Loan Account Number
              </label>
              <input
                type="text"
                value={loanNumber}
                onChange={(e) => {
                  setLoanNumber(e.target.value);
                  setError("");
                }}
                onKeyPress={handleKeyPress}
                placeholder="Enter loan number..."
                className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-[#2d0060] focus:outline-none text-base font-semibold transition-colors"
                suppressHydrationWarning
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex gap-3">
                <span className="text-red-600 mt-0.5">⚠️</span>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <button
              onClick={handleLocateAccount}
              disabled={loading}
              className="w-full py-5 rounded-xl bg-[#2d0060] text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-[0.98]"
              suppressHydrationWarning
            >
              {loading ? "Locating..." : "Locate Account"}
            </button>

            <button
              onClick={() => {
                const testAgent = { name: "Test Mobile Agent", id: "000" };
                const testCust = { name: "Sample Customer", loan: "DEMO-123" };
                setLoggedInAgent(testAgent);
                setCurrentCustomer(testCust);
              }}
              className="w-full py-2 text-[8px] text-gray-400 uppercase tracking-widest border-t border-gray-100 mt-4"
              suppressHydrationWarning
            >
              Skip to Dashboard (Debug)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
