"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, ShieldCheck, Fingerprint, UserCheck, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const [identifier, setIdentifier] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);
    const [matchedContext, setMatchedContext] = useState(null); // { agent, customerId }
    
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        const agentId = localStorage.getItem("agentId");
        if (agentId) router.push("/");
    }, [router]);

    const handleLookup = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier }),
            });
            const data = await res.json();
            
            if (res.ok) {
                setMatchedContext({
                    agent: data.data,
                    customerId: data.matchedCustomerId
                });
            } else {
                setError(data.msg || "Identity not found");
            }
        } catch (err) {
            setError("Network failure");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (!matchedContext) return;
        
        // Save session info
        localStorage.setItem("agentId", matchedContext.agent._id);
        localStorage.setItem("agentName", matchedContext.agent.name);
        
        // Direct jump to verification as requested
        if (matchedContext.customerId) {
            router.push(`/verify/${matchedContext.customerId}`);
        } else {
            router.push("/");
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#F9F7FF] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-[#2d0060]/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-100px] right-[-100px] w-80 h-80 bg-[#2d0060]/10 blur-[120px] rounded-full" />

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <motion.div className="inline-flex items-center justify-center w-16 h-16 bg-[#2d0060] rounded-2xl shadow-lg mb-6">
                        <ShieldCheck size={32} color="white" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-1">
                        Bargad <span className="text-[#2d0060]">Shield</span>
                    </h1>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Biometric Identity Gateway</p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-[#2d0060]/5 p-8 backdrop-blur-md">
                    <AnimatePresence mode="wait">
                        {!matchedContext ? (
                            <motion.form key="lookup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleLookup} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#2d0060] uppercase tracking-[0.2em] px-1">
                                        Account Lookup
                                    </label>
                                    <div className="relative">
                                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                        <input
                                            type="text"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold outline-none focus:ring-4 focus:ring-[#2d0060]/5 transition-all"
                                            placeholder="Enter Loan Number"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 text-[10px] font-bold p-3 rounded-xl text-center border border-red-100 uppercase tracking-wider">
                                        {error}
                                    </div>
                                )}

                                <button type="submit" disabled={loading} className="w-full bg-[#2d0060] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                    {loading ? <RefreshCw className="animate-spin" size={18} /> : <><span>Locate Account</span> <ArrowRight size={16} /></>}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.div key="match" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-center">
                                <p className="text-[10px] font-black text-[#2d0060] uppercase tracking-[0.2em]">Agent Identity Found</p>
                                
                                <div className="flex flex-col items-center">
                                    <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-[#2d0060]/10 shadow-lg mb-4">
                                        {matchedContext.agent.image ? (
                                            <img src={matchedContext.agent.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-3xl font-black text-gray-300">
                                                {matchedContext.agent.name?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900 leading-tight">{matchedContext.agent.name}</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Authorized Specialist</p>
                                </div>

                                <div className="py-4 px-6 bg-[#2d0060]/5 rounded-2xl border border-[#2d0060]/10">
                                    <p className="text-[10px] font-bold text-[#2d0060] uppercase mb-1">Target Account</p>
                                    <p className="font-bold text-gray-900">Loan: {identifier.toUpperCase()}</p>
                                </div>

                                <div className="space-y-3">
                                    <button onClick={handleConfirm} className="w-full bg-[#2d0060] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                                        <LogIn size={18} />
                                        Start Verification
                                    </button>
                                    <button onClick={() => setMatchedContext(null)} className="w-full py-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">
                                        Use Different ID
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

function RefreshCw({ className, size }) {
    return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
}