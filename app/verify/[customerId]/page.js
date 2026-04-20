"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  ArrowLeft,
  RefreshCw,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LIVENESS_TASKS = [
  {
    id: "look_left",
    label: "Head Left",
    instruction: "Slowly turn your head to the LEFT",
    check: (landmarks) => {
      if (!landmarks) return false;
      const nose = landmarks.getNose()[3];
      const leftJaw = landmarks.getJawOutline()[0];
      const rightJaw = landmarks.getJawOutline()[16];
      const leftDist = nose.x - leftJaw.x;
      const rightDist = rightJaw.x - nose.x;
      // Nose moves significantly towards the left jaw relative to right jaw
      return leftDist / rightDist < 0.65;
    },
  },
  {
    id: "look_right",
    label: "Head Right",
    instruction: "Slowly turn your head to the RIGHT",
    check: (landmarks) => {
      if (!landmarks) return false;
      const nose = landmarks.getNose()[3];
      const leftJaw = landmarks.getJawOutline()[0];
      const rightJaw = landmarks.getJawOutline()[16];
      const leftDist = nose.x - leftJaw.x;
      const rightDist = rightJaw.x - nose.x;
      // Nose moves significantly towards the right jaw relative to left jaw
      return rightDist / leftDist < 0.65;
    },
  },
  {
    id: "smile",
    label: "Smile",
    instruction: "Show a natural smile",
    check: (landmarks) => {
      if (!landmarks) return false;
      const mouth = landmarks.getMouth();
      const jaw = landmarks.getJawOutline();
      const mouthWidth = mouth[6].x - mouth[0].x;
      const faceWidth = jaw[16].x - jaw[0].x;
      return mouthWidth / faceWidth > 0.44;
    },
  },
  {
    id: "open_mouth",
    label: "Final Check",
    instruction: "Open your mouth slightly",
    check: (landmarks) => {
      if (!landmarks) return false;
      const mouth = landmarks.getMouth();
      const leftEye = landmarks.getLeftEye();
      const gap = mouth[18].y - mouth[14].y;
      const faceHeight = mouth[18].y - leftEye[0].y;
      return gap / faceHeight > 0.14;
    },
  },
];

export default function VerifyPage() {
  const { customerId } = useParams();
  const router = useRouter();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const livenessIntervalRef = useRef(null);

  const [isClient, setIsClient] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [livenessStep, setLivenessStep] = useState(0);
  const [livenessPassed, setLivenessPassed] = useState(false);
  const [liveDescriptor, setLiveDescriptor] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Preparing Camera...");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("camera");
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    console.log("🚀 Page mounted with customerId:", customerId);
    if (!customerId) return;
    setMounted(true);
    fetchCustomer();
    loadFaceAPI();
    return () => stopCamera();
  }, [customerId]);

  // Auto-start camera when mounted
  useEffect(() => {
    console.log("🔍 Auto-start camera check:", { mounted, step, cameraActive });
    if (mounted && step === "camera" && cameraActive === false) {
      console.log("✅ Triggering startCamera()");
      startCamera();
    }
  }, [mounted, step]);

  // Auto-start liveness detection when camera is active and ready

  useEffect(() => {
    const checkVideoReady = () => {
      if (
        cameraActive &&
        modelsLoaded &&
        videoRef.current &&
        videoRef.current.readyState === 4 &&
        !isVerifying &&
        !livenessPassed
      ) {
        runLiveness();
      } else {
        setTimeout(checkVideoReady, 300);
      }
    };

    checkVideoReady();
  }, [cameraActive, modelsLoaded]);
  //   useEffect(() => {
  //     console.log("🔍 Liveness autostart check:", {
  //       cameraActive,
  //       modelsLoaded,
  //       isVerifying,
  //       livenessPassed,
  //       videoReady: !!videoRef.current?.srcObject,
  //     });
  //     if (
  //       cameraActive &&
  //       modelsLoaded &&
  //       !isVerifying &&
  //       !livenessPassed &&
  //       videoRef.current?.srcObject
  //     ) {
  //       console.log("✅ All conditions met - starting liveness in 500ms");
  //       // Delay slightly to ensure video is ready
  //       const timer = setTimeout(() => {
  //         console.log("⏱️  Timeout fired - calling runLiveness()");
  //         runLiveness();
  //       }, 500);
  //       return () => clearTimeout(timer);
  //     }
  //   }, [cameraActive, modelsLoaded, isVerifying, livenessPassed]);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      const data = await res.json();
      if (res.ok) setCustomer(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadFaceAPI = async () => {
    // if (typeof window === "undefined" || window.faceapi) {
    //   console.log("face-api already loaded or server side");
    //   return;
    // }
    if (typeof window === "undefined") return;
    console.log("face-api already loaded or server side");
    if (window.faceapi) {
      setModelsLoaded(true);
      return;
    }
    console.log("📦 Loading face-api script...");
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
    script.async = true;

    script.onload = async () => {
      console.log("📦 face-api.js script loaded");
      const URL = "https://justadudewhohacks.github.io/face-api.js/models";
      try {
        // Load only essential models for speed
        console.log("🔄 Loading face detection models...");
        await Promise.all([
          window.faceapi.nets.tinyFaceDetector.loadFromUri(URL),
          window.faceapi.nets.faceLandmark68Net.loadFromUri(URL),
          window.faceapi.nets.faceRecognitionNet.loadFromUri(URL),
        ]);

        console.log("✅ Identity Protocols Loaded");
        setModelsLoaded(true);
      } catch (e) {
        console.warn("Models failed", e);
        setModelsLoaded(true);
      }
    };

    script.onerror = () => {
      console.error("❌ Failed to load face-api script");
    };

    document.body.appendChild(script);
  };

  const startCamera = async () => {
    console.log("📹 Starting camera...");
    setStep("camera");
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      console.log("✅ Camera permission granted, stream active");
      streamRef.current = stream;
      //   if (videoRef.current) videoRef.current.srcObject = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("❌ Camera error:", err);
      toast.error("Camera Access Denied");
      setStep("info");
    }
  };

  useEffect(() => {
    let retryTimer;
    const attachStream = async () => {
      if (step === "camera" && streamRef.current && videoRef.current) {
        try {
          console.log("🎥 Attaching stream to video element...");
          videoRef.current.srcObject = streamRef.current;
          await videoRef.current.play();
          console.log("▶️  Video playing");
        } catch (err) {
          console.log("⏱️  Retrying stream attachment in 300ms");
          retryTimer = setTimeout(attachStream, 300);
        }
      }
    };
    attachStream();
    return () => clearTimeout(retryTimer);
  }, [step]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (livenessIntervalRef.current) clearInterval(livenessIntervalRef.current);
  };

  if (!isClient) return null;

  const runLiveness = () => {
    console.log(
      "🎬 runLiveness called - videoRef:",
      !!videoRef.current,
      "faceapi:",
      !!window.faceapi,
    );
    if (!videoRef.current || !window.faceapi) {
      console.error("❌ runLiveness failed - missing videoRef or faceapi");
      toast.error("Camera Not Prepared");
      return;
    }
    console.log("✅ Starting isVerifying - setting to true");
    setIsVerifying(true);
    let currentStepNum = 0;
    let stepCompleted = false;

    livenessIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !window.faceapi || livenessPassed) {
        console.log(
          "📍 Interval check - skipping (video/api missing or already passed)",
        );
        return;
      }

      try {
        const detection = await window.faceapi
          .detectSingleFace(
            videoRef.current,
            new window.faceapi.TinyFaceDetectorOptions({ inputSize: 160 }),
          )
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          setStatusMessage("POSITION FACE IN CENTER");
          console.log("⚠️  No face detected");
          return;
        }

        console.log(
          `👤 Face detected - Step ${currentStepNum}:`,
          LIVENESS_TASKS[currentStepNum]?.id,
        );
        setStatusMessage("");
        const task = LIVENESS_TASKS[currentStepNum];

        if (task && task.check(detection.landmarks) && !stepCompleted) {
          console.log(`✔️  Task passed: ${task.label}`);
          stepCompleted = true;
          currentStepNum++;
          setLivenessStep(currentStepNum);
          console.log(`📊 Updated livenessStep to ${currentStepNum}`);
          toast.success(`${task.label} Verified`, { autoClose: 400 });

          if (currentStepNum < LIVENESS_TASKS.length) {
            stepCompleted = false;
            console.log(
              `➡️  Moving to next step: ${LIVENESS_TASKS[currentStepNum]?.id}`,
            );
          } else {
            console.log("🎉 All liveness tasks completed!");
            clearInterval(livenessIntervalRef.current);
            setLiveDescriptor(detection.descriptor);
            setLivenessPassed(true);
            setIsVerifying(false);
            toast.success("✦ Biometric Liveness Secured");
          }
        } else {
          console.log(
            `❌ Step check failed - task exists: ${!!task}, check passed: ${task?.check(detection.landmarks) || false}, already completed: ${stepCompleted}`,
          );
        }
      } catch (err) {
        console.error("🔴 Liveness detection error:", err);
      }
    }, 300);
  };

  const captureAndFinalize = async (descriptor) => {
    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setStatusMessage("Analyzing Frame...");

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const b64 = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(b64);

    setStep("results");
    stopCamera();

    console.log("📤 Sending face verification to backend...");
    
    try {
      // Call backend API for server-side face verification
      const verificationResponse = await fetch("/api/verification/verify-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId,
          capturedImage: b64,
        }),
      });

      const verificationResult = await verificationResponse.json();
      console.log("📥 Backend verification response:", verificationResult);

      if (!verificationResponse.ok) {
        const errorMsg = verificationResult.msg || verificationResult.detail || "Verification failed";
        console.error("❌ Verification API error:", errorMsg);
        toast.error(errorMsg);
        setCustomer((prev) => ({
          ...prev,
          currentScore: 0,
          isMatch: false,
        }));
        setLoading(false);
        return;
      }

      // Check if face verification passed
      const { isVerified, score, distance } = verificationResult.data;
      console.log(`🎯 Verification Result - Verified: ${isVerified}, Score: ${score}%, Distance: ${distance}`);

      if (isVerified) {
        console.log("✅ Face matched! User verified.");
        setCustomer((prev) => ({
          ...prev,
          currentScore: score,
          isMatch: true,
        }));
        toast.success("✓ Face Verified Successfully!");
      } else {
        console.log("❌ Face does not match the reference image.");
        setCustomer((prev) => ({
          ...prev,
          currentScore: score,
          isMatch: false,
        }));
        toast.error("Face does not match. Please try again.");
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("🔴 Face verification error:", err);
      toast.error("Error verifying face. Please try again.");
      setCustomer((prev) => ({
        ...prev,
        currentScore: 0,
        isMatch: false,
      }));
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  const handleSync = async () => {
    // Only proceed if face verification passed
    if (!customer?.isMatch) {
      toast.error("Face verification failed. Please try again.");
      console.log("❌ handleSync called but face verification failed");
      setStep("camera");
      setLivenessPassed(false);
      setLivenessStep(0);
      setStatusMessage("Preparing Camera...");
      return;
    }

    setLoading(true);
    try {
      console.log("✅ Face verified - proceeding to login");
      toast.success(`Face Match Verified!`);
      setStep("success");
      // Redirect to login page after short delay
      setTimeout(() => {
        console.log("🔄 Redirecting to login...");
        router.push("/login");
      }, 2200);
    } catch (err) {
      console.error("❌ Error in handleSync:", err);
      toast.error("Error processing verification");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F9F7FF] text-gray-900 flex flex-col font-sans">
      <ToastContainer position="top-center" theme="light" />

      <header className="px-6 py-5 flex items-center justify-between border-b border-[#2d0060]/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <button
          onClick={() => router.back()}
          className="p-2.5 rounded-xl bg-white border border-gray-200"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <div className="text-center">
          <p className="text-[8px] font-black text-[#2d0060] uppercase tracking-[0.4em]">
            Biometric Protocol
          </p>
          <h1 className="text-xs font-bold uppercase tracking-widest text-gray-900">
            {customer?.name || "Initializing..."}
          </h1>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#2d0060]/10 flex items-center justify-center">
          <Fingerprint size={20} className="text-[#2d0060]" />
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-md border border-[#2d0060]/10 p-8">
                  <h2 className="text-3xl font-black tracking-tighter mb-6 leading-tight">
                    Identity <br />{" "}
                    <span className="text-[#2d0060]">Verification.</span>
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        Target ID
                      </p>
                      <p className="text-xs font-bold text-gray-900 uppercase">
                        {customer?.loan}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#2d0060]/30 bg-gray-100">
                        {customer?.agentId?.image ? (
                          <img
                            src={customer.agentId.image}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                            A
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-[#2d0060] uppercase tracking-widest">
                          Assigned Specialist
                        </p>
                        <p className="text-xs font-bold text-gray-900 uppercase">
                          {customer?.agentId?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex gap-4">
                  <ShieldAlert
                    size={18}
                    className="text-amber-600 shrink-0 mt-0.5"
                  />
                  <p className="text-[10px] leading-relaxed text-amber-800/70 font-medium italic">
                    Secure liveness check required. Please follow the on-screen
                    head movement instructions carefully.
                  </p>
                </div>
              </div>
              <button
                onClick={startCamera}
                className="w-full py-5 rounded-2xl bg-[#2d0060] text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg"
              >
                Initiate Secure Scan
              </button>
            </motion.div>
          )}

          {step === "camera" && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center"
            >
              <div className="relative w-full aspect-square max-w-[310px] mt-10">
                <div
                  className={`absolute inset-0 rounded-2xl border-2 transition-all duration-700 ${
                    isVerifying
                      ? "border-[#2d0060] shadow-[0_0_50px_rgba(45,0,96,0.2)]"
                      : "border-gray-200"
                  }`}
                />
                <div className="absolute inset-3 rounded-2xl overflow-hidden bg-black shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {isVerifying && (
                    <div className="absolute inset-0 border-[#2d0060]/20 border-[20px] rounded-2xl pointer-events-none opacity-50">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2d0060]/5 to-transparent h-1/2 w-full animate-scan" />
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-12 text-center w-full min-h-[80px]">
                <p className="text-[9px] font-black text-[#2d0060] uppercase tracking-[0.4em] mb-3">
                  Live Instruction
                </p>
                <AnimatePresence mode="wait">
                  <motion.h3
                    key={livenessStep}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm font-black text-gray-900 uppercase"
                  >
                    {isVerifying
                      ? LIVENESS_TASKS[livenessStep]?.instruction
                      : statusMessage}
                  </motion.h3>
                </AnimatePresence>
              </div>
              <div className="mt-6 flex gap-3">
                {LIVENESS_TASKS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${i < livenessStep ? "w-10 bg-[#2d0060]" : i === livenessStep && isVerifying ? "w-10 bg-[#2d0060]/30 animate-pulse" : "w-2 bg-gray-200"}`}
                  />
                ))}
              </div>
              {livenessPassed && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full mt-10"
                >
                  <button
                    onClick={() => captureAndFinalize(liveDescriptor)}
                    className="w-full py-5 rounded-2xl bg-[#2d0060] text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg active:scale-95"
                  >
                    <Camera size={18} />
                    Capture Identity Frame
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === "results" && (
            <motion.div
              key="results"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex-1 flex flex-col justify-center"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-[#2d0060]/10 p-10 text-center">
                <div
                  className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-8 bg-gradient-to-br shadow-inner ${customer?.isMatch ? "from-[#2d0060]/10 to-[#2d0060]/5 text-[#2d0060]" : "from-red-50 to-red-100 text-red-600"}`}
                >
                  {customer?.isMatch ? (
                    <ShieldCheck size={48} />
                  ) : (
                    <ShieldAlert size={48} />
                  )}
                </div>
                <h2 className="text-2xl font-black mb-1 leading-none tracking-tighter">
                  {customer?.isMatch ? "AUTHENTICATED." : "UNAUTHORIZED."}
                </h2>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-10">
                  Confidence Range: {customer?.currentScore || 0}%
                </p>
                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="space-y-3">
                    <div className="aspect-square rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shadow-sm">
                      <img
                        src={capturedImage}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-[8px] font-black text-gray-600 uppercase">
                      Live Probe
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="aspect-square rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shadow-sm">
                      <img
                        src={customer?.agentId?.image}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-[8px] font-black text-gray-600 uppercase">
                      Record
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handleSync}
                    disabled={loading}
                    className="w-full py-5 rounded-2xl bg-[#2d0060] text-white font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      "Transmit to Cloud HQ"
                    )}
                  </button>
                  <button
                    onClick={() => setStep("info")}
                    className="w-full py-3 text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]"
                  >
                    Retry Protocol
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-24 h-24 bg-[#2d0060] rounded-full flex items-center justify-center mb-10 shadow-lg">
                <CheckCircle2 size={48} color="white" strokeWidth={3} />
              </div>
              <h2 className="text-3xl font-black mb-3 text-gray-900 uppercase">
                Sync Confirmed
              </h2>
              <p className="text-gray-500 font-bold text-[9px] uppercase tracking-[0.4em]">
                Biometric Record Secured Instantly
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
