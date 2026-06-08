"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// Dynamic import untuk menghindari SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function APIDocsPage() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch OpenAPI spec dari backend
    fetch("/api/docs")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load API documentation");
        return res.json();
      })
      .then((data) => {
        setSpec(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Memuat dokumentasi API...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            Gagal Memuat Dokumentasi
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                📚 Dokumentasi API
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                SMK Fajar Sentosa - Sistem Point of Sale
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="/"
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                ← Kembali ke Dashboard
              </a>
              <button
                onClick={() => {
                  const jsonStr = JSON.stringify(spec, null, 2);
                  const blob = new Blob([jsonStr], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "openapi-spec.json";
                  a.click();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                📥 Download Spec
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Info Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">🔐</div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Authentication</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Bearer Token JWT</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Gunakan token dari endpoint /api/auth untuk autentikasi
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">📡</div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Base URL</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">localhost:3000/api</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Endpoint development lokal
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">📋</div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Version</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">v1.0.0</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              API versi stabil terkini
            </p>
          </div>
        </div>

        {/* Swagger UI Container */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="swagger-container">
            {spec && <SwaggerUI spec={spec} />}
          </div>
        </div>
      </div>

      {/* Custom Swagger UI Styles */}
      <style jsx global>{`
        .swagger-container {
          padding: 20px;
        }

        .swagger-ui .topbar {
          display: none;
        }

        .swagger-ui .info {
          margin: 20px 0;
        }

        .swagger-ui .scheme-container {
          background: #fafafa;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }

        .swagger-ui .opblock {
          border-radius: 8px;
          margin-bottom: 15px;
          border: 1px solid #e2e8f0;
        }

        .swagger-ui .opblock-tag {
          border-bottom: 1px solid #e2e8f0;
          padding: 15px 20px;
          font-size: 18px;
          font-weight: 600;
        }

        .swagger-ui .opblock.opblock-get {
          border-color: #61affe;
          background: rgba(97, 175, 254, 0.05);
        }

        .swagger-ui .opblock.opblock-post {
          border-color: #49cc90;
          background: rgba(73, 204, 144, 0.05);
        }

        .swagger-ui .opblock.opblock-put {
          border-color: #fca130;
          background: rgba(252, 161, 48, 0.05);
        }

        .swagger-ui .opblock.opblock-delete {
          border-color: #f93e3e;
          background: rgba(249, 62, 62, 0.05);
        }

        .swagger-ui .btn.execute {
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 20px;
          font-weight: 500;
        }

        .swagger-ui .btn.execute:hover {
          background: #1d4ed8;
        }

        dark .swagger-ui {
          filter: invert(1) hue-rotate(180deg);
        }

        dark .swagger-ui img {
          filter: invert(1) hue-rotate(180deg);
        }
      `}</style>
    </div>
  );
}
