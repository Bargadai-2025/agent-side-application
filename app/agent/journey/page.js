// "use client";
// import { useState, useEffect, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { motion } from "framer-motion";
// import { MapPin, Navigation, Play, Square, ChevronLeft } from "lucide-react";

// export default function JourneyPage() {
//   const router = useRouter();
//   const [agent, setAgent] = useState(null);
//   const [isTracking, setIsTracking] = useState(false);
//   const [currentLocation, setCurrentLocation] = useState(null);
//   const [optimizedRoute, setOptimizedRoute] = useState([]);
//   const [mapLoaded, setMapLoaded] = useState(false);
//   const [customers, setCustomers] = useState([]);
//   const mapInstance = useRef(null);
//   const markerRef = useRef(null);
//   const officeMarkerRef = useRef(null);
//   const trackingInterval = useRef(null);
//   const customerMarkersRef = useRef([]);
//   const routeCacheRef = useRef([]);
//   const OFFICE = {
//     lat: 19.1133869510231,
//     lng: 72.91810580467191,
//     name: "Bargad HQ"
//   };

//   function haversine_distance(lat1, lng1, lat2, lng2) {
//     const R = 6371000;
//     const dLat = (lat2 - lat1) * Math.PI / 180;
//     const dLng = (lng2 - lng1) * Math.PI / 180;
//     const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
//       Math.sin(dLng / 2) * Math.sin(dLng / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c;
//   }

//   const fetchAgentData = async (agentId) => {
//     try {
//       const res = await fetch(`/api/agents/${agentId}`);
//       if (res.ok) {
//         const data = await res.json();
//         const agentFull = data.data;
//         setCustomers(agentFull.customers || []);
//         if (agentFull.journeyTracking?.isActive) {
//           setIsTracking(true);
//           startLocalTracking(agentId);
//         }
//         if (agentFull.journeyTracking?.optimizedRoute) {
//           setOptimizedRoute(agentFull.journeyTracking.optimizedRoute);
//         }
//       }
//     } catch (err) {
//       console.error("Failed to fetch agent data", err);
//     }
//   };

//   useEffect(() => {
//     const savedAgent = localStorage.getItem("agent");
//     if (!savedAgent) {
//       router.push("/");
//       return;
//     }
//     const agentData = JSON.parse(savedAgent);
//     setAgent(agentData);
//     fetchAgentData(agentData._id);

//     return () => {
//       if (trackingInterval.current) clearInterval(trackingInterval.current);
//     };
//   }, []);

//   useEffect(() => {
//     if (!window.mappls || mapInstance.current) return;

//     mapInstance.current = new window.mappls.Map("agent-map", {
//       center: [OFFICE.lat, OFFICE.lng],
//       zoom: 12,
//       zoomControl: true,
//       hybrid: true,
//     });

//     mapInstance.current.on("load", () => {
//       setMapLoaded(true);
//       const el = document.createElement('div');
//       el.innerHTML = `<div style="background:#ef4444;padding:4px 8px;border-radius:4px;color:white;font-weight:700;font-size:10px;white-space:nowrap;box-shadow:0 2px 5px rgba(0,0,0,0.3);">OFFICE</div>`;
//       officeMarkerRef.current = new window.mappls.Marker({
//         map: mapInstance.current,
//         position: { lat: OFFICE.lat, lng: OFFICE.lng },
//         html: el.innerHTML
//       });
//     });
//   }, []);

//   useEffect(() => {
//     if (mapLoaded && optimizedRoute.length > 0) {
//       const map = mapInstance.current;
//       const geojson = {
//         type: "Feature",
//         geometry: {
//           type: "LineString",
//           coordinates: optimizedRoute.map((p) => [p.lng, p.lat])
//         },
//       };

//       if (map.getSource("route")) {
//         map.getSource("route").setData(geojson);
//       } else {
//         map.addSource("route", { type: "geojson", data: geojson });
//         map.addLayer({
//           id: "route",
//           type: "line",
//           source: "route",
//           layout: { "line-join": "round", "line-cap": "round" },
//           paint: { "line-color": "#3b82f6", "line-width": 5 },
//         });
//       }

//       const points = [...optimizedRoute, { lat: OFFICE.lat, lng: OFFICE.lng }];
//       const lngs = points.map(p => p.lng);
//       const lats = points.map(p => p.lat);
//       map.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: 50 });
//     }
//   }, [mapLoaded, optimizedRoute]);

//   // add new line
//   useEffect(() => {
//     if (!mapLoaded || customers.length === 0) return;

//     const map = mapInstance.current;

//     // remove old markers
//     customerMarkersRef.current.forEach(marker => marker.remove());
//     customerMarkersRef.current = [];

//     customers.forEach((customer, index) => {
//       if (!customer.location) return;

//       const { lat, lng } = customer.location;

//       const el = document.createElement("div");
//       el.innerHTML = `
//       <div style="
//         background:#10b981;
//         color:white;
//         padding:4px 6px;
//         border-radius:6px;
//         font-size:10px;
//         font-weight:700;
//         box-shadow:0 2px 5px rgba(0,0,0,0.3);
//       ">
//         C${index + 1}
//       </div>
//     `;

//       const marker = new window.mappls.Marker({
//         map: map,
//         position: { lat, lng },
//         html: el.innerHTML
//       });

//       customerMarkersRef.current.push(marker);
//     });

//   }, [customers, mapLoaded]);

//   const updateMapMarker = (lat, lng) => {
//     if (!mapLoaded || !mapInstance.current) return;
//     if (markerRef.current) {
//       markerRef.current.setPosition({ lat, lng });
//     } else {
//       const el = document.createElement('div');
//       el.innerHTML = `
//         <div style="width:28px;height:28px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 15px rgba(59, 130, 246, 0.6);display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:bold;animation: pulse 2s infinite;">
//           A
//         </div>
//         <style>
//           @keyframes pulse {
//             0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
//             70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
//             100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
//           }
//         </style>
//       `;
//       markerRef.current = new window.mappls.Marker({
//         map: mapInstance.current,
//         position: { lat: lng, lng: lat }, // Note: Library might expect {lat, lng} or [lng, lat]
//         html: el.innerHTML
//       });
//       // Correcting the object property
//       markerRef.current.setPosition({ lat, lng });
//     }
//   };

//   const startJourney = async () => {
//     if (!navigator.geolocation) {
//       alert("Geolocation is not supported by your browser");
//       return;
//     }
//     try {
//       navigator.geolocation.getCurrentPosition(async (pos) => {
//         const { latitude, longitude } = pos.coords;
//         const distToOffice = haversine_distance(latitude, longitude, OFFICE.lat, OFFICE.lng);
//         if (distToOffice > 300) {
//           alert(`Error: You must be at the Office to start your journey. Current distance: ${(distToOffice / 1000).toFixed(2)} km`);
//           return;
//         }
//         setCurrentLocation({ lat: latitude, lng: longitude });
//         updateMapMarker(latitude, longitude);
//         const res = await fetch(`/api/agents/start-journey/${agent._id}`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ optimizedRoute: [] })
//         });
//         if (res.ok) {
//           setIsTracking(true);
//           startLocalTracking(agent._id);
//         }
//       }, (err) => {
//         alert("Please allow location access to start journey");
//       });
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const stopJourney = async () => {
//     try {
//       const res = await fetch(`/api/agents/stop-journey/${agent._id}`, {
//         method: "POST"
//       });
//       if (res.ok) {
//         setIsTracking(false);
//         if (trackingInterval.current) clearInterval(trackingInterval.current);
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const startLocalTracking = (agentId) => {
//     if (trackingInterval.current) clearInterval(trackingInterval.current);
//     trackCurrentLocation(agentId);
//     trackingInterval.current = setInterval(() => {
//       trackCurrentLocation(agentId);
//     }, 300000);
//   };

//   // const trackCurrentLocation = (agentId) => {
//   //   navigator.geolocation.getCurrentPosition(async (pos) => {
//   //     const { latitude, longitude } = pos.coords;
//   //     setCurrentLocation({ lat: latitude, lng: longitude });
//   //     updateMapMarker(latitude, longitude);
//   //     await fetch(`/api/agents/track-location/${agentId}`, {
//   //       method: "POST",
//   //       headers: { "Content-Type": "application/json" },
//   //       body: JSON.stringify({ lat: latitude, lng: longitude })
//   //     });
//   //   });
//   // };
//   const trackCurrentLocation = (agentId) => {
//     navigator.geolocation.getCurrentPosition(async (pos) => {
//       const { latitude, longitude } = pos.coords;

//       const newPoint = {
//         lat: latitude,
//         lng: longitude,
//         timestamp: new Date()
//       };

//       // Save to frontend cache
//       routeCacheRef.current.push(newPoint);

//       setCurrentLocation({ lat: latitude, lng: longitude });
//       updateMapMarker(latitude, longitude);

//       drawAgentRoute();

//       await fetch(`/api/agents/track-location/${agentId}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(newPoint)
//       });

//     });
//   };

//   const drawAgentRoute = () => {
//     if (!mapInstance.current || routeCacheRef.current.length < 2) return;

//     const map = mapInstance.current;

//     const geojson = {
//       type: "Feature",
//       geometry: {
//         type: "LineString",
//         coordinates: routeCacheRef.current.map(p => [p.lng, p.lat])
//       }
//     };

//     if (map.getSource("agent-route")) {
//       map.getSource("agent-route").setData(geojson);
//     } else {
//       map.addSource("agent-route", {
//         type: "geojson",
//         data: geojson
//       });

//       map.addLayer({
//         id: "agent-route",
//         type: "line",
//         source: "agent-route",
//         layout: {
//           "line-join": "round",
//           "line-cap": "round"
//         },
//         paint: {
//           "line-color": "#facc15",
//           "line-width": 5
//         }
//       });
//     }
//   };
//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
//       <header className="px-6 py-3 bg-[#2d0060] text-white shadow-lg flex items-center gap-4">
//         <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
//           <ChevronLeft size={24} />
//         </button>
//         <div>
//           <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-70">Journey Tracking</p>
//           <h3 className="text-base font-bold tracking-tight">{isTracking ? "Journey in Progress" : "Start Your Journey"}</h3>
//         </div>
//       </header>

//       <main className="flex-1 flex flex-col relative">
//         <div id="agent-map" className="flex-1 w-full h-full bg-gray-200" />
//         <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
//           <motion.div
//             initial={{ y: 100 }}
//             animate={{ y: 0 }}
//             className="bg-white rounded-3xl shadow-2xl p-4 border border-gray-100"
//           >
//             {currentLocation && (
//               <div className="flex items-center gap-4 mb-4 p-2 bg-emerald-50 rounded-2xl border border-emerald-100">
//                 <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
//                   <Navigation size={20} className="animate-pulse" />
//                 </div>
//                 <div>
//                   <p className="text-[10px] font-bold text-emerald-600 uppercase">Live Location</p>
//                   <p className="text-sm font-black text-gray-900">Active Tracking</p>
//                 </div>
//               </div>
//             )}
//             {!isTracking ? (
//               <button
//                 onClick={startJourney}
//                 className="w-full py-3 rounded-2xl bg-[#2d0060] text-white font-black text-sm uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
//               >
//                 <Play size={20} fill="currentColor" />
//                 Start Journey
//               </button>
//             ) : (
//               <button
//                 onClick={stopJourney}
//                 className="w-full py-5 rounded-2xl bg-red-600 text-white font-black text-sm uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
//               >
//                 <Square size={20} fill="currentColor" />
//                 Stop Journey
//               </button>
//             )}
//             <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">
//               {isTracking ? "Automatically syncing every 10 minutes" : "Ready to optimize your field route?"}
//             </p>
//           </motion.div>
//         </div>
//       </main>
//     </div>
//   );
// }

"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Play,
  Square,
  ChevronLeft,
  LocateFixed,
} from "lucide-react";

export default function JourneyPage() {
  const router = useRouter();
  const [agent, setAgent] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [nearbyCustomer, setNearbyCustomer] = useState(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [cashAmount, setCashAmount] = useState("");

  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const officeMarkerRef = useRef(null);
  const trackingInterval = useRef(null);
  const customerMarkersRef = useRef([]);
  const routeCacheRef = useRef([]);
  const visitedCustomersRef = useRef(new Set());
  const OFFICE = {
    lat: 19.1133869510231,
    lng: 72.91810580467191,
    name: "Bargad HQ",
  };
  // const OFFICE = {
  //   lat: 19.221205362778235,
  //   lng: 73.09295477236344,
  //   name: "Bargad HQ"
  // };
  // Logic remains identical to your provided code
  function haversine_distance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const fetchAgentData = async (agentId) => {
    try {
      const res = await fetch(`/api/agents/${agentId}`);
      if (res.ok) {
        const data = await res.json();
        const agentFull = data.data;
        setCustomers(agentFull.customers || []);
        if (agentFull.journeyTracking?.isActive) {
          setIsTracking(true);
          startLocalTracking(agentId);
        }

        if (agentFull.journeyTracking?.optimizedRoute?.length > 0) {
          setOptimizedRoute(
            agentFull.journeyTracking.optimizedRoute.map((p) => ({
              lat: p.lat,
              lng: p.lng,
            })),
          );
        }
      }
    } catch (err) {
      console.error("Failed to fetch agent data", err);
    }
  };

  useEffect(() => {
    const savedAgent = localStorage.getItem("agent");
    if (!savedAgent) {
      router.push("/");
      return;
    }
    const agentData = JSON.parse(savedAgent);
    setAgent(agentData);
    fetchAgentData(agentData._id);

    return () => {
      if (trackingInterval.current) clearInterval(trackingInterval.current);
    };
  }, []);

  useEffect(() => {
    if (!window.mappls || mapInstance.current) return;

    mapInstance.current = new window.mappls.Map("agent-map", {
      center: [OFFICE.lat, OFFICE.lng],
      zoom: 14, // Slightly tighter zoom for mobile
      zoomControl: false, // Cleaner UI, use gestures
      hybrid: true,
    });

    mapInstance.current.on("load", () => {
      setMapLoaded(true);
      const el = document.createElement("div");
      el.innerHTML = `<div style="background:#ef4444;padding:4px 10px;border-radius:20px;color:white;font-weight:800;font-size:10px;box-shadow:0 4px 10px rgba(0,0,0,0.2);border:2px solid white;">HQ</div>`;
      officeMarkerRef.current = new window.mappls.Marker({
        map: mapInstance.current,
        position: { lat: OFFICE.lat, lng: OFFICE.lng },
        html: el.innerHTML,
      });
    });
  }, []);

  // useEffect(() => {
  //   if (mapLoaded && optimizedRoute.length > 0) {
  //     const map = mapInstance.current;
  //     const geojson = {
  //       type: "Feature",
  //       geometry: {
  //         type: "LineString",
  //         coordinates: optimizedRoute.map((p) => [p.lng, p.lat])
  //       },
  //     };

  //     if (map.getSource("route")) {
  //       map.getSource("route").setData(geojson);
  //     } else {
  //       map.addSource("route", { type: "geojson", data: geojson });
  //       map.addLayer({
  //         id: "route",
  //         type: "line",
  //         source: "route",
  //         layout: { "line-join": "round", "line-cap": "round" },
  //         paint: { "line-color": "#3b82f6", "line-width": 6 },
  //       });
  //     }
  //   }
  // }, [mapLoaded, optimizedRoute]);
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current || optimizedRoute.length === 0)
      return;

    const map = mapInstance.current;

    const geojson = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: optimizedRoute.map((p) => [p.lng, p.lat]),
      },
    };

    const drawRoute = () => {
      if (map.getLayer("optimized-route")) {
        map.getSource("optimized-route").setData(geojson);
        return;
      }

      if (!map.getSource("optimized-route")) {
        map.addSource("optimized-route", {
          type: "geojson",
          data: geojson,
        });
      }

      map.addLayer({
        id: "optimized-route",
        type: "line",
        source: "optimized-route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#2563eb",
          "line-width": 6,
        },
      });

      const allPoints = [
        { lat: OFFICE.lat, lng: OFFICE.lng },
        ...optimizedRoute,
      ];

      const lngs = allPoints.map((p) => p.lng);
      const lats = allPoints.map((p) => p.lat);

      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 60 },
      );
    };

    if (map.isStyleLoaded()) {
      drawRoute();
    } else {
      map.once("styledata", drawRoute);
    }
  }, [mapLoaded, optimizedRoute]);

  useEffect(() => {
    if (!mapLoaded || customers.length === 0) return;
    const map = mapInstance.current;
    customerMarkersRef.current.forEach((marker) => marker.remove());
    customerMarkersRef.current = [];

    customers.forEach((customer, index) => {
      if (!customer.location) return;
      const { lat, lng } = customer.location;
      const el = document.createElement("div");
      el.innerHTML = `<div style="background:#10b981;color:white;padding:4px 8px;border-radius:20px;font-size:11px;font-weight:800;box-shadow:0 4px 10px rgba(0,0,0,0.2);border:2px solid white;">C${index + 1}</div>`;

      const marker = new window.mappls.Marker({
        map: map,
        position: { lat, lng },
        html: el.innerHTML,
      });
      customerMarkersRef.current.push(marker);
    });
  }, [customers, mapLoaded]);

  // const updateMapMarker = (lat, lng) => {
  //   if (!mapLoaded || !mapInstance.current) return;
  //   if (markerRef.current) {
  //     markerRef.current.setPosition({ lat, lng });
  //   } else {
  //     const el = document.createElement('div');
  //     el.innerHTML = `
  //       <div class="agent-marker">
  //         <div class="dot"></div>
  //         <div class="pulse"></div>
  //       </div>
  //       <style>
  //         .agent-marker { position: relative; width: 24px; height: 24px; }
  //         .dot { width: 100%; height: 100%; background: #3b82f6; border: 3px solid white; border-radius: 50%; position: relative; z-index: 2; box-shadow: 0 0 10px rgba(0,0,0,0.2); }
  //         .pulse { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #3b82f6; border-radius: 50%; animation: pulse-animation 2s infinite; z-index: 1; }
  //         @keyframes pulse-animation { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(3); opacity: 0; } }
  //       </style>
  //     `;
  //     markerRef.current = new window.mappls.Marker({
  //       map: mapInstance.current,
  //       position: { lat, lng },
  //       html: el.innerHTML
  //     });
  //   }
  // };

  const updateMapMarker = (lat, lng) => {
    if (!mapLoaded || !mapInstance.current) return;

    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng });
      return;
    }

    const agentImage = agent?.image || "/agent.png";

    const el = document.createElement("div");

    el.innerHTML = `
    <div style="
      width:44px;
      height:44px;
      border-radius:50%;
      border:3px solid white;
      box-shadow:0 4px 10px rgba(0,0,0,0.3);
      overflow:hidden;
      background:white;
      position:relative;
    ">
      <img 
        src="${agentImage}"
        style="
          width:100%;
          height:100%;
          object-fit:cover;
        "
      />
      <div style="
        position:absolute;
        bottom:-6px;
        left:50%;
        transform:translateX(-50%);
        width:12px;
        height:12px;
        background:#22c55e;
        border-radius:50%;
        border:2px solid white;
      "></div>
    </div>
  `;

    markerRef.current = new window.mappls.Marker({
      map: mapInstance.current,
      position: { lat, lng },
      html: el.innerHTML,
    });
  };

  const startJourney = async () => {
    if (!navigator.geolocation) {
      alert("Location services not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const distToOffice = haversine_distance(
        latitude,
        longitude,
        OFFICE.lat,
        OFFICE.lng,
      );
      if (distToOffice > 300) {
        alert(
          `Access Denied: You are ${(distToOffice / 1000).toFixed(2)} km away. Please reach the office.`,
        );
        return;
      }
      setCurrentLocation({ lat: latitude, lng: longitude });
      updateMapMarker(latitude, longitude);
      const res = await fetch(`/api/agents/start-journey/${agent._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optimizedRoute: [] }),
      });
      if (res.ok) {
        setIsTracking(true);
        startLocalTracking(agent._id);
      }
    });
  };

  // const stopJourney = async () => {

  //   if (!confirm("Are you sure you want to end your journey?")) return;
  //   try {
  //     const res = await fetch(`/api/agents/stop-journey/${agent._id}`, { method: "POST" });
  //     if (res.ok) {
  //       setIsTracking(false);
  //       if (trackingInterval.current) clearInterval(trackingInterval.current);
  //     }
  //   } catch (err) { console.error(err); }
  // };
  const stopJourney = async () => {
    if (currentLocation && mapInstance.current) {
      mapInstance.current.flyTo({
        center: [currentLocation.lng, currentLocation.lat],
        zoom: 15,
      });
    }

    if (!confirm("Are you sure you want to end your journey?")) return;

    try {
      const res = await fetch(`/api/agents/stop-journey/${agent._id}`, {
        method: "POST",
      });

      if (res.ok) {
        setIsTracking(false);
        if (trackingInterval.current) clearInterval(trackingInterval.current);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const startLocalTracking = (agentId) => {
    if (trackingInterval.current) clearInterval(trackingInterval.current);
    trackCurrentLocation(agentId);
    trackingInterval.current = setInterval(
      () => trackCurrentLocation(agentId),
      300000,
    );
  };

  // const trackCurrentLocation = (agentId) => {
  //   navigator.geolocation.getCurrentPosition(async (pos) => {
  //     const { latitude, longitude } = pos.coords;
  //     const newPoint = { lat: latitude, lng: longitude, timestamp: new Date() };
  //     routeCacheRef.current.push(newPoint);
  //     setCurrentLocation({ lat: latitude, lng: longitude });
  //     updateMapMarker(latitude, longitude);
  //     drawAgentRoute();
  //     await fetch(`/api/agents/track-location/${agentId}`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(newPoint)
  //     });
  //   });
  // };

  const checkCustomerReached = (lat, lng) => {
    let foundNearby = null;
    customers.forEach((customer, index) => {
      if (!customer.location) return;
      const distance = haversine_distance(
        lat,
        lng,
        customer.location.lat,
        customer.location.lng,
      );

      // Mark as reached on map (80m)
      if (distance < 80 && !visitedCustomersRef.current.has(customer._id)) {
        visitedCustomersRef.current.add(customer._id);
        updateCustomerMarker(index, true);
      }

      // Show collection button (10m)
      if (distance < 10 && customer.verificationStatus !== "verified") {
        foundNearby = customer;
      }
    });
    setNearbyCustomer(foundNearby);
  };

  const handleCollectCash = async () => {
    if (!nearbyCustomer || !cashAmount) return;
    setIsCollecting(true);
    try {
      const res = await fetch(
        `/api/customers/collect-cash/${nearbyCustomer._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: cashAmount,
            agentId: agent._id,
            agentName: agent.name,
          }),
        },
      );
      if (res.ok) {
        alert("Cash collected successfully!");
        setNearbyCustomer(null);
        setCashAmount("");
        fetchAgentData(agent._id); // Refresh customer statuses
      } else {
        alert("Failed to collect cash.");
      }
    } catch (err) {
      console.error(err);
      alert("Error collecting cash.");
    } finally {
      setIsCollecting(false);
    }
  };

  const updateCustomerMarker = (index, reached = false) => {
    const marker = customerMarkersRef.current[index];
    if (!marker) return;
    const customer = customers[index];
    const isVerified = customer?.verificationStatus === "verified" || reached;

    const el = document.createElement("div");
    el.innerHTML = `
      <div style="
        background:${isVerified ? "#22c55e" : "#10b981"};
        color:white;
        padding:4px 8px;
        border-radius:20px;
        font-size:11px;
        font-weight:800;
        display:flex;
        align-items:center;
        gap:4px;
        box-shadow:0 4px 10px rgba(0,0,0,0.2);
        border:2px solid white;
      ">
        ${isVerified ? "✓" : ""} C${index + 1}
      </div>
    `;
    marker.setHTML(el.innerHTML);
  };

  const trackCurrentLocation = (agentId) => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const newPoint = {
        lat: latitude,
        lng: longitude,
        timestamp: new Date(),
      };
      routeCacheRef.current.push(newPoint);
      setCurrentLocation({ lat: latitude, lng: longitude });
      updateMapMarker(latitude, longitude);
      checkCustomerReached(latitude, longitude);
      drawAgentRoute();
      await fetch(`/api/agents/track-location/${agentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPoint),
      });
    });
  };

  const drawAgentRoute = () => {
    if (!mapInstance.current || routeCacheRef.current.length < 2) return;
    const map = mapInstance.current;
    const geojson = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: routeCacheRef.current.map((p) => [p.lng, p.lat]),
      },
    };
    if (map.getSource("agent-route")) {
      map.getSource("agent-route").setData(geojson);
    } else {
      map.addSource("agent-route", { type: "geojson", data: geojson });
      map.addLayer({
        id: "agent-route",
        type: "line",
        source: "agent-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#facc15", "line-width": 5 },
      });
    }
  };

  const recenterMap = () => {
    if (currentLocation && mapInstance.current) {
      mapInstance.current.setCenter([currentLocation.lng, currentLocation.lat]);
      mapInstance.current.setZoom(16);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-100 flex flex-col font-sans overflow-hidden">
      {/* Header: Optimized for Mobile Status Bars */}
      <header className="px-5 pt-6 pb-6 bg-[#2d0060] text-white shadow-xl flex items-center gap-4 z-20">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white/10 active:bg-white/20 rounded-xl transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
            Journey Portal
          </p>
          <div className="text-xl md:text-2xl lg:text-3xl   font-black tracking-tight">
            {isTracking ? "Tracking Live" : "Start Your Journey"}
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
        {/* Full-bleed Map */}
        <div id="agent-map" className="absolute inset-0 w-full h-full z-0" />

        {/* Floating Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-3">
          <button
            onClick={recenterMap}
            className="p-4 bg-white rounded-2xl shadow-xl text-[#2d0060] active:scale-90 transition-transform border border-gray-100"
          >
            <LocateFixed size={24} />
          </button>
        </div>

        {/* Bottom Panel */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/95 backdrop-blur-md rounded-[32px] shadow-2xl p-5 border border-white/20"
          >
            <AnimatePresence mode="wait">
              {isTracking ? (
                <motion.div
                  key="tracking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between mb-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                        <Navigation size={24} className="animate-bounce" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-tighter">
                        GPS Active
                      </p>
                      <p className="text-sm font-black text-gray-800">
                        Recording Movement
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      Updates
                    </p>
                    <p className="text-xs font-black text-gray-600">Every 5m</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-5 text-center"
                >
                  <p className="text-sm font-bold text-gray-500">
                    You must be within 300m of HQ to start.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cash Collection Section */}
            <AnimatePresence>
              {nearbyCustomer && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 bg-emerald-50 rounded-2xl p-4 border border-emerald-100 overflow-hidden"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">
                        Customer Reached
                      </p>
                      <h4 className="text-sm font-black text-gray-900">
                        {nearbyCustomer.name}
                      </h4>
                    </div>
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                      <MapPin size={16} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Enter Amount"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="flex-1 bg-white border border-emerald-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={handleCollectCash}
                      disabled={isCollecting || !cashAmount}
                      className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all"
                    >
                      {isCollecting ? "Saving..." : "Collect"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3">
              {!isTracking ? (
                <button
                  onClick={startJourney}
                  className="flex-1 py-5 rounded-2xl bg-[#2d0060] text-white font-black text-sm uppercase tracking-widest shadow-[0_10px_20px_rgba(45,0,96,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <Play size={18} fill="currentColor" />
                  Start Journey
                </button>
              ) : (
                <button
                  onClick={stopJourney}
                  className="flex-1 py-5 rounded-2xl bg-red-500 text-white font-black text-sm uppercase tracking-widest shadow-[0_10px_20px_rgba(239,68,68,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <Square size={18} fill="currentColor" />
                  End Journey
                </button>
              )}
            </div>
          </motion.div>
          {/* Safe Area Spacer for modern iPhones */}
          <div className="h-4" />
        </div>
      </main>
    </div>
  );
}
