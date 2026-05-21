"use client";

import { useState, useEffect, useRef } from "react";

// Inline SVG Icons for clean rendering without external library dependency
const DatabaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg>
);
const TerminalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
);
const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);
const RefreshIcon = ({ className = "" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
);

export default function Home() {
  const [apiStatus, setApiStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [healthData, setHealthData] = useState<any>(null);
  const [latestData, setLatestData] = useState<any>(null);
  const [pipelineStatus, setPipelineStatus] = useState<any>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [apiKey, setApiKey] = useState("databridge_secret_key_123");
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:8000");
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Interval ref for status polling
  const pollingInterval = useRef<any>(null);

  const fetchHealth = async (baseUrl = apiBaseUrl) => {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
        setApiStatus("connected");
      } else {
        setApiStatus("error");
      }
    } catch (err) {
      setApiStatus("error");
    }
  };

  const fetchLatestData = async (baseUrl = apiBaseUrl, key = apiKey) => {
    try {
      const res = await fetch(`${baseUrl}/data/latest`, {
        headers: { "X-API-Key": key }
      });
      if (res.ok) {
        const data = await res.json();
        setLatestData(data);
      }
    } catch (err) {
      console.error("Error fetching metrics:", err);
    }
  };

  const fetchPipelineStatus = async (baseUrl = apiBaseUrl, key = apiKey) => {
    try {
      const res = await fetch(`${baseUrl}/pipeline/status`, {
        headers: { "X-API-Key": key }
      });
      if (res.ok) {
        const data = await res.json();
        setPipelineStatus(data);
        
        // Stop polling if the pipeline is no longer running
        if (data.status !== "running" && pollingInterval.current) {
          clearInterval(pollingInterval.current);
          pollingInterval.current = null;
          setIsTriggering(false);
          // Refresh the analytics data after success
          fetchLatestData(baseUrl, key);
          fetchHealth(baseUrl);
        }
      }
    } catch (err) {
      console.error("Error checking pipeline status:", err);
    }
  };

  const triggerPipeline = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch(`${apiBaseUrl}/pipeline/trigger`, {
        method: "POST",
        headers: { 
          "X-API-Key": apiKey,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const result = await res.json();
        // Immediately fetch the run status
        fetchPipelineStatus();
        
        // Start polling pipeline status every 2 seconds
        if (pollingInterval.current) clearInterval(pollingInterval.current);
        pollingInterval.current = setInterval(() => {
          fetchPipelineStatus();
        }, 2000);
      } else {
        setIsTriggering(false);
        alert("Failed to trigger pipeline. Verify API Key.");
      }
    } catch (err) {
      setIsTriggering(false);
      alert("Error reaching backend gateway.");
    }
  };

  // Initial load
  useEffect(() => {
    fetchHealth();
    fetchLatestData();
    fetchPipelineStatus();

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, []);

  const handleSettingsUpdate = () => {
    setApiStatus("connecting");
    fetchHealth(apiBaseUrl);
    fetchLatestData(apiBaseUrl, apiKey);
    fetchPipelineStatus(apiBaseUrl, apiKey);
    setShowKeyInput(false);
  };

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6 selection:bg-indigo-500 selection:text-white">
      {/* Background gradients for premium feel */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-sky-500/10 rounded-full filter blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Navigation Bar */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 animate-pulse"></span>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                DataBridge Control Center
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Automated batch ETL monitoring & analytics delivery</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* API Connection Pill */}
            <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs border ${
              apiStatus === "connected" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
              apiStatus === "connecting" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
              "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}>
              <span className={`h-2.5 w-2.5 rounded-full ${
                apiStatus === "connected" ? "bg-emerald-500 animate-pulse" :
                apiStatus === "connecting" ? "bg-amber-500 animate-pulse" :
                "bg-rose-500"
              }`}></span>
              <span>API Gateway: {apiStatus.toUpperCase()}</span>
            </div>

            {/* DB Health Pill */}
            {healthData && (
              <div className="flex items-center gap-2 rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs text-zinc-300">
                <DatabaseIcon />
                <span>DB: {healthData.database === "connected" ? "CONNECTED" : "FAILED"}</span>
              </div>
            )}

            {/* Settings Toggle */}
            <button 
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition px-3 py-1 text-xs flex items-center gap-1.5"
            >
              <span>⚙ Settings</span>
            </button>
          </div>
        </header>

        {/* Credentials Editor Drawer */}
        {showKeyInput && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 backdrop-blur-md max-w-xl animate-in fade-in-50 duration-200">
            <h3 className="text-sm font-semibold text-zinc-200 mb-3">Connection Configurations</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">FastAPI Gateway URL</label>
                <input 
                  type="text" 
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">X-API-Key Header</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSettingsUpdate}
                  className="bg-indigo-600 hover:bg-indigo-500 transition text-white px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Save & Reconnect
                </button>
                <button 
                  onClick={() => setShowKeyInput(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 transition text-zinc-300 px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Error Callout */}
        {apiStatus === "error" && (
          <div className="bg-rose-950/20 border border-rose-900/50 rounded-2xl p-4 flex items-start gap-3 text-rose-200">
            <AlertIcon />
            <div>
              <h4 className="font-semibold text-sm">Cannot reach the FastAPI server!</h4>
              <p className="text-xs text-rose-300/80 mt-0.5">
                Make sure the backend is running at <code className="bg-rose-900/30 px-1 py-0.5 rounded text-white">{apiBaseUrl}</code>. Run <code className="bg-rose-900/30 px-1.5 py-0.5 rounded text-white">python main.py</code> inside the <code className="text-white">server/</code> directory.
              </p>
            </div>
          </div>
        )}

        {/* Row 1: KPI Statistics */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Sales */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/30 transition duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-xl group-hover:bg-indigo-500/10 transition"></div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Total Sales (Completed)</p>
            <h2 className="text-3xl font-extrabold mt-2 tracking-tight text-white">
              {latestData ? formatCurrency(latestData.summary.total_sales) : "$0"}
            </h2>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="font-bold">✓ Live Sync</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-500">Local Postgres</span>
            </div>
          </div>

          {/* Card 2: Transactions Success Rate */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-sky-500/30 transition duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full filter blur-xl group-hover:bg-sky-500/10 transition"></div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Transaction Success Rate</p>
            <h2 className="text-3xl font-extrabold mt-2 tracking-tight text-white">
              {latestData && latestData.summary.total_orders > 0
                ? `${Math.round((latestData.summary.successful_orders / latestData.summary.total_orders) * 100)}%`
                : "0%"
              }
            </h2>
            <div className="mt-4 text-xs text-zinc-400 flex justify-between">
              <span>Success: {latestData?.summary.successful_orders || 0}</span>
              <span className="text-zinc-600">|</span>
              <span className="text-rose-400">Failed: {latestData?.summary.failed_orders || 0}</span>
            </div>
          </div>

          {/* Card 3: Total Customers */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-zinc-700 transition duration-300">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Registered Customers</p>
            <h2 className="text-3xl font-extrabold mt-2 tracking-tight text-white">
              {latestData ? latestData.summary.total_customers : "0"}
            </h2>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
              <span>Targeting Supabase Schema</span>
            </div>
          </div>

          {/* Card 4: Product Catalog Size */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-zinc-700 transition duration-300">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Product Catalog</p>
            <h2 className="text-3xl font-extrabold mt-2 tracking-tight text-white">
              {latestData ? latestData.summary.total_products : "0"}
            </h2>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
              <span>Seeded with 10 main categories</span>
            </div>
          </div>
        </section>

        {/* Row 2: Pipeline Operations & Category Performance */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Column 1: Pipeline Control (7 cols) */}
          <div className="lg:col-span-7 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <ActivityIcon />
                  <h2 className="font-semibold text-lg text-white">Pipeline Execution Controller</h2>
                </div>
                <div className="text-xs text-zinc-400">
                  Last Sync: {healthData ? healthData.last_run_timestamp : "Never"}
                </div>
              </div>

              {/* Status Header */}
              {pipelineStatus && (
                <div className="mb-6 rounded-xl bg-zinc-950 p-4 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500">LATEST DAG STATUS</p>
                    <h3 className={`text-base font-bold mt-0.5 capitalize flex items-center gap-2 ${
                      pipelineStatus.status === "success" ? "text-emerald-400" :
                      pipelineStatus.status === "running" ? "text-indigo-400" :
                      "text-rose-400"
                    }`}>
                      {pipelineStatus.status === "running" && (
                        <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping"></span>
                      )}
                      {pipelineStatus.status}
                    </h3>
                  </div>
                  <div className="text-right text-xs">
                    <p className="text-zinc-500">RUN ID</p>
                    <p className="font-mono text-zinc-300 mt-0.5">{pipelineStatus.run_id}</p>
                  </div>
                </div>
              )}

              {/* Steps progression */}
              {pipelineStatus && pipelineStatus.steps && (
                <div className="space-y-4 mb-6">
                  {pipelineStatus.steps.map((step: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center border text-xs font-bold ${
                          step.status === "completed" ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" :
                          step.status === "running" ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400 animate-pulse" :
                          "bg-zinc-950 border-zinc-800 text-zinc-600"
                        }`}>
                          {step.status === "completed" ? <CheckIcon /> : index + 1}
                        </div>
                        <span className={`font-mono text-xs ${
                          step.status === "completed" ? "text-zinc-300" :
                          step.status === "running" ? "text-white font-bold" :
                          "text-zinc-600"
                        }`}>{step.name}</span>
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        step.status === "completed" ? "text-emerald-500" :
                        step.status === "running" ? "text-indigo-400 animate-pulse" :
                        "text-zinc-600"
                      }`}>{step.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-800/40 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={triggerPipeline}
                disabled={isTriggering || apiStatus !== "connected"}
                className={`w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 transition font-semibold text-white text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 ${
                  (isTriggering || apiStatus !== "connected") ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <RefreshIcon className={isTriggering ? "animate-spin" : ""} />
                <span>{isTriggering ? "Syncing Pipeline..." : "Manual Run ETL"}</span>
              </button>
              <p className="text-xs text-zinc-500 text-center sm:text-left">
                Manual trigger replicates daily scheduler run. Pulls new orders from PostgreSQL and aggregates tables.
              </p>
            </div>
          </div>

          {/* Column 2: Category Distribution (5 cols) */}
          <div className="lg:col-span-5 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="font-semibold text-lg text-white mb-4">Category Sales Distribution</h2>
            <p className="text-xs text-zinc-400 mb-6">Aggregated performance from gold serving tables</p>

            {latestData && latestData.category_performance ? (
              <div className="space-y-5">
                {latestData.category_performance.map((cat: any, index: number) => {
                  // Calculate percentage width for visual representation
                  const maxSales = Math.max(...latestData.category_performance.map((c: any) => c.sales));
                  const percentage = maxSales > 0 ? (cat.sales / maxSales) * 100 : 0;
                  
                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-zinc-300">{cat.category}</span>
                        <div className="space-x-2">
                          <span className="text-zinc-500">({cat.units_sold} units)</span>
                          <span className="text-white font-bold">{formatCurrency(cat.sales)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800/50">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-sky-400 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-500">
                No category metrics loaded.
              </div>
            )}
          </div>
        </section>

        {/* Row 3: Transaction List */}
        <section className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <TerminalIcon />
              <h2 className="font-semibold text-lg text-white">Recent Transactions</h2>
            </div>
            <span className="text-xs bg-zinc-800 px-2.5 py-1 rounded text-zinc-400">Showing latest 10 rows</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase font-mono border-b border-zinc-850">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Total Price</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {latestData && latestData.recent_orders && latestData.recent_orders.length > 0 ? (
                  latestData.recent_orders.map((o: any, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-900/20 transition">
                      <td className="py-3.5 px-4 font-mono text-zinc-400 text-xs">{o.order_id}</td>
                      <td className="py-3.5 px-4 font-medium text-white">{o.product_name}</td>
                      <td className="py-3.5 px-4">{o.quantity}</td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-100">{formatCurrency(o.total_price)}</td>
                      <td className="py-3.5 px-4 text-xs text-zinc-500">{o.order_date}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                          o.payment_status === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                          o.payment_status === "pending" ? "bg-amber-500/10 text-amber-400" :
                          "bg-rose-500/10 text-rose-400"
                        }`}>
                          {o.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-zinc-500">
                      No order transactions currently loaded. Please run seed script or trigger pipeline.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
