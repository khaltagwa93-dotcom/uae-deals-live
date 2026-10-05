"use client";

import { useState, useEffect, useCallback } from "react";

interface Deal {
  title: string;
  link: string;
  snippet: string;
  source: string;
  date: string;
  emirate: string;
  store: string;
}

interface StoreGroup {
  key: string;
  nameAr: string;
  deals: Deal[];
}

interface EmirateGroup {
  key: string;
  nameAr: string;
  nameEn: string;
  stores: StoreGroup[];
}

export default function Home() {
  const [emirates, setEmirates] = useState<EmirateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("");
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);

  const fetchDeals = useCallback(async () => {
    try {
      const res = await fetch("/api/deals");
      const data = await res.json();
      if (data.success) {
        setEmirates(data.emirates || []);
        setUpdatedAt(data.updatedAt);
        setTotal(data.total || 0);
        setError("");
      } else {
        setError(data.error || "فشل التحميل");
      }
    } catch (e: any) {
      setError(e.message || "خطأ في الاتصال");
    } finally {
      setLoading(false);
      setCountdown(60);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
    const interval = setInterval(fetchDeals, 60_000);
    return () => clearInterval(interval);
  }, [fetchDeals]);

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => (c <= 1 ? 60 : c - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="min-h-screen text-slate-100">
      <header className="sticky top-0 z-30 border-b border-cyan-900/40 bg-slate-950/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-xl font-bold shadow-lg">
                🏷️
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                  عروض الإمارات اللحظية
                </h1>
                <p className="text-xs text-slate-400">UAE Live Deals · مرتبة حسب الإمارة والمتجر</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 rounded-full px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 live-dot" />
                <span className="text-emerald-300">مباشر</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300">تحديث بعد {countdown} ث</span>
              </div>
              <button
                onClick={() => {
                  setLoading(true);
                  fetchDeals();
                }}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm transition"
              >
                🔄 الآن
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
            <span>📦 {total} عرض</span>
            {updatedAt && (
              <span>🕒 آخر تحديث: {new Date(updatedAt).toLocaleTimeString("ar-AE")}</span>
            )}
            <span>مصادر: Google News · كارفور · لولو · نون · أمازون وغيرها</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-xl text-red-200 text-sm">
            ⚠️ {error}
          </div>
        )}

        {loading && emirates.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-slate-800/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : emirates.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            لا توجد عروض حالياً. حاول التحديث بعد قليل.
          </div>
        ) : (
          <div className="space-y-10">
            {emirates.map((em) => (
              <section key={em.key}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-cyan-400 to-emerald-400" />
                  <h2 className="text-xl font-bold text-white">
                    {em.nameAr}
                    <span className="text-slate-400 text-sm font-normal ms-2">({em.nameEn})</span>
                  </h2>
                </div>

                <div className="space-y-6">
                  {em.stores.map((store) => (
                    <div key={store.key}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/50 rounded-lg px-2.5 py-0.5">
                          🏪 {store.nameAr}
                        </span>
                        <span className="text-xs text-slate-500">{store.deals.length} عروض</span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {store.deals.map((deal, idx) => (
                          <a
                            key={idx}
                            href={deal.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="deal-card block bg-slate-900/70 border border-slate-700/80 rounded-xl p-4 hover:border-cyan-600/50"
                          >
                            <h3 className="font-semibold text-slate-100 text-sm leading-snug line-clamp-2 mb-2">
                              {deal.title}
                            </h3>
                            {deal.snippet && (
                              <p className="text-xs text-slate-400 line-clamp-2 mb-3">{deal.snippet}</p>
                            )}
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>{deal.source}</span>
                              <span>
                                {deal.date
                                  ? new Date(deal.date).toLocaleDateString("ar-AE", {
                                      day: "numeric",
                                      month: "short",
                                    })
                                  : ""}
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/80 py-5 text-center text-xs text-slate-500">
        عروض الإمارات اللحظية · تحديث تلقائي كل دقيقة · مرتبة حسب الإمارة ثم المتجر
      </footer>
    </div>
  );
}
