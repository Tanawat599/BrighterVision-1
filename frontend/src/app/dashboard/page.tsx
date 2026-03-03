"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    MapPin,
    Camera,
    Mic,
    ShieldAlert,
    Activity,
    RefreshCw,
    Eye,
    Navigation,
} from "lucide-react";
import Link from "next/link";

interface Location {
    latitude: number;
    longitude: number;
}

export default function Dashboard() {
    const [location, setLocation] = useState<Location | null>(null);
    const [sosActive, setSosActive] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string>("");
    const [apiLogs, setApiLogs] = useState<{ time: string; message: string }[]>(
        [],
    );

    const addLog = (message: string) => {
        setApiLogs((prev) =>
            [{ time: new Date().toLocaleTimeString(), message }, ...prev].slice(
                0,
                50,
            ),
        );
    };

    const fetchDashboardStatus = async () => {
        try {
            const response = await fetch(
                "http://localhost:8000/api/dashboard/status",
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Log the payload to the browser console (and server depending on where it runs, mostly client here)
            console.log("Dashboard API Data Rcvd:", data);
            addLog(`GET /dashboard/status: ${JSON.stringify(data)}`);

            setLocation({
                latitude: data.latitude,
                longitude: data.longitude,
            });
            setSosActive(data.sos_status);
            setLastUpdated(new Date().toLocaleTimeString());
            setError(null);
        } catch (e) {
            console.error("Failed to fetch dashboard status:", e);
            setError("Failed to connect to hardware server");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStatus();
        const intervalId = setInterval(fetchDashboardStatus, 3000);
        return () => clearInterval(intervalId);
    }, []);

    const sendCommandToHat = async (command: string) => {
        try {
            const res = await fetch(
                "http://localhost:8000/api/hardware/hat/command",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ command }),
                },
            );

            const reqData = await res.json();
            console.log("Hardware Command response:", reqData);
            addLog(`POST /hardware/hat/command: ${JSON.stringify(reqData)}`);

            alert(`Command sent: ${command}`);
        } catch (e) {
            alert("Failed to send command");
        }
    };

    return (
        <div
            className={`min-h-screen transition-colors duration-700 ${sosActive ? "bg-red-950 text-red-50" : "bg-[#f4f7fb] text-slate-900"} p-4 md:p-8 font-sans`}
        >
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex-shrink-0">
                            <img
                                src="/logo.svg"
                                alt="BrighterVision Logo"
                                className="w-12 h-12 object-contain"
                            />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent truncate">
                                tanawat chuthaphiromporn
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full">
                                    ข้อมูลส่วนตัว (Personal Info)
                                </span>
                                <p className="text-xs text-slate-500 font-medium hidden sm:block">
                                    IoT Assistive Dashboard
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                        <Link
                            href="/profile"
                            className="flex items-center gap-3 bg-[#f4f7fb] p-2 pr-4 rounded-full border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer group"
                        >
                            <img
                                src="/patient.jpg"
                                alt="Patient"
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform"
                            />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-700 leading-tight group-hover:text-blue-600 transition-colors">
                                    Age: 67
                                </span>
                                <span className="text-[10px] text-slate-500 leading-tight">
                                    Blood: A | Male
                                </span>
                            </div>
                        </Link>

                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2 text-xs font-medium bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                                {isLoading ? (
                                    <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin" />
                                ) : error ? (
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                ) : (
                                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                                )}
                                <span
                                    className={
                                        error
                                            ? "text-rose-500"
                                            : "text-slate-600"
                                    }
                                >
                                    {error
                                        ? "Offline"
                                        : `Synced: ${lastUpdated}`}
                                </span>
                            </div>
                            <button
                                onClick={() =>
                                    (window.location.href = "/login")
                                }
                                className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-wider"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </header>

                {/* Banners */}
                <AnimatePresence>
                    {error && !sosActive && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center gap-3 overflow-hidden"
                        >
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </motion.div>
                    )}

                    {sosActive && (
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-red-600 text-white p-6 rounded-3xl shadow-2xl shadow-red-600/50 flex flex-col md:flex-row items-center gap-6 justify-between border-4 border-red-500"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-red-500 p-4 rounded-full animate-pulse">
                                    <ShieldAlert className="w-10 h-10" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-widest mb-1">
                                        Emergency SOS
                                    </h2>
                                    <p className="text-red-100 font-medium text-lg">
                                        Smart Cane panic button triggered at{" "}
                                        {lastUpdated}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSosActive(false)}
                                className="bg-white text-red-600 hover:bg-red-50 px-8 py-4 rounded-xl font-bold transition-colors w-full md:w-auto shadow-lg text-lg uppercase tracking-wide"
                            >
                                Acknowledge Alert
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tracking Section */}
                    <div
                        className={`lg:col-span-2 rounded-3xl p-6 md:p-8 flex flex-col ${sosActive ? "bg-red-900 border border-red-800" : "bg-white shadow-sm border border-slate-200"}`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <MapPin
                                    className={
                                        sosActive
                                            ? "text-red-400"
                                            : "text-blue-500"
                                    }
                                />
                                Live Location Tracking
                            </h2>
                            {location && (
                                <div className="flex items-center gap-3">
                                    <div className="text-sm font-mono bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600">
                                        {location.latitude.toFixed(6)},{" "}
                                        {location.longitude.toFixed(6)}
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm cursor-pointer ${
                                            sosActive
                                                ? "bg-red-800 text-white hover:bg-red-700"
                                                : "bg-blue-600 text-white hover:bg-blue-700"
                                        }`}
                                    >
                                        <Navigation className="w-4 h-4" />
                                        Navigate
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 bg-[#f4f7fb] rounded-2xl min-h-[400px] border border-slate-200 flex items-center justify-center overflow-hidden relative">
                            {location ? (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude},${location.longitude}`}
                                ></iframe>
                            ) : (
                                <div className="flex flex-col items-center text-slate-400 gap-3">
                                    <MapPin className="w-12 h-12 opacity-50" />
                                    <p className="font-medium">
                                        Waiting for GPS fix...
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls Section */}
                    <div className="space-y-6">
                        {/* Smart Hat Controls */}
                        <div
                            className={`rounded-3xl p-6 border ${sosActive ? "bg-red-900 border-red-800" : "bg-white shadow-sm border-slate-200"}`}
                        >
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                                    <Camera className="w-5 h-5" />
                                </div>
                                Smart Hat Remote
                            </h2>
                            <div className="space-y-3">
                                <Link
                                    href="/dashboard/capture"
                                    className={`w-full py-4 px-4 rounded-xl flex items-center justify-center gap-3 font-semibold transition-all active:scale-[0.98] ${
                                        sosActive
                                            ? "bg-red-800 hover:bg-red-700 text-white border border-red-700"
                                            : "bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-700"
                                    }`}
                                >
                                    <Camera className="w-5 h-5" />
                                    Open Camera Feed
                                </Link>
                                <button
                                    onClick={() =>
                                        sendCommandToHat("RECORD_AUDIO")
                                    }
                                    className={`w-full py-4 px-4 rounded-xl flex items-center justify-center gap-3 font-semibold transition-all active:scale-[0.98] ${
                                        sosActive
                                            ? "bg-red-800 hover:bg-red-700 text-white border border-red-700"
                                            : "bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-700"
                                    }`}
                                >
                                    <Mic className="w-5 h-5" />
                                    Request Audio Feed
                                </button>
                            </div>
                        </div>

                        {/* Hardware Status */}
                        <div
                            className={`rounded-3xl p-6 border ${sosActive ? "bg-red-900 border-red-800" : "bg-white shadow-sm border-slate-200"}`}
                        >
                            <h2 className="text-lg font-bold mb-4">
                                Device Status
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                        Smart Cane
                                    </span>
                                    <span className="text-xs font-mono bg-[#f4f7fb] px-2 py-1 rounded text-slate-500">
                                        Connected
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                        Smart Hat
                                    </span>
                                    <span className="text-xs font-mono bg-[#f4f7fb] px-2 py-1 rounded text-slate-500">
                                        Connected
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                    <span>Battery Levels</span>
                                    <span className="font-semibold text-emerald-600">
                                        Optimal
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* API Logs */}
                        <div
                            className={`rounded-3xl p-6 border ${sosActive ? "bg-red-900 border-red-800" : "bg-white shadow-sm border-slate-200"}`}
                        >
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-slate-500" />
                                API Activity Logs
                            </h2>
                            <div className="space-y-2 h-48 flex flex-col-reverse overflow-y-auto bg-[#f4f7fb] p-4 rounded-xl border border-slate-200 text-xs font-mono">
                                {apiLogs.length === 0 ? (
                                    <div className="text-slate-400 text-center py-4">
                                        No logs yet...
                                    </div>
                                ) : (
                                    apiLogs.map((log, i) => (
                                        <div
                                            key={i}
                                            className="flex gap-3 border-b border-slate-200 pb-1 mt-1"
                                        >
                                            <span className="text-slate-400 shrink-0">
                                                [{log.time}]
                                            </span>
                                            <span className="text-emerald-600 break-all">
                                                {log.message}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
