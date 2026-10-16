/* architecture.js — System Architecture, Database Schema & Tech Stack matching bottom cards in Image 1 & Image 2. */
(function(global){
"use strict";
var U = global.U;

function render(){
  var el = U.$("#view");

  el.innerHTML =
    '<div class="page" style="max-width:1360px;">' +
      '<div class="page-head" style="text-align:center;margin-bottom:30px;">' +
        '<p class="eyebrow" style="justify-content:center;">System Architecture & Design Contract</p>' +
        '<h1 class="page-title">Architecture, Database Schema & Tech Stack</h1>' +
        '<p class="page-sub">Enterprise fintech engineering specification built for international scale and security.</p>' +
      '</div>' +

      /* 3 Bottom Cards (Image 1 & 2) */
      '<div style="display:grid;grid-template-columns:1.2fr 1fr 1.1fr;gap:22px;margin-bottom:34px;">' +

        /* CARD 1: BACKEND ARCHITECTURE */
        '<div class="card" style="border-radius:20px;padding:24px;background:#0d1629;color:#fff;border:1px solid rgba(255,255,255,0.1);">' +
          '<div style="font-size:16px;font-weight:800;color:#fff;margin-bottom:18px;display:flex;align-items:center;gap:8px;">' +
            '<span>🏗️</span> Backend Architecture' +
          '</div>' +

          '<div style="display:flex;flex-direction:column;gap:12px;">' +
            '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(56,189,248,0.3);border-radius:12px;padding:12px;">' +
              '<b style="color:#38bdf8;font-size:13px;display:block;">Client (Web / Mobile)</b>' +
              '<span style="font-size:12px;color:#cbd5e1;">React + TypeScript · Tailwind CSS · TanStack Query</span>' +
            '</div>' +
            '<div style="text-align:center;color:#60a5fa;font-size:16px;line-height:0.8;">↓</div>' +

            '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(129,140,248,0.3);border-radius:12px;padding:12px;">' +
              '<b style="color:#818cf8;font-size:13px;display:block;">API Layer (Node.js + Express)</b>' +
              '<span style="font-size:12px;color:#cbd5e1;">REST APIs · Validation (Zod) · Error Handling · Rate Limiting</span>' +
            '</div>' +
            '<div style="text-align:center;color:#818cf8;font-size:16px;line-height:0.8;">↓</div>' +

            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">' +
              '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(52,211,153,0.3);border-radius:12px;padding:12px;">' +
                '<b style="color:#34d399;font-size:12.5px;display:block;">Database (PostgreSQL)</b>' +
                '<span style="font-size:11.5px;color:#cbd5e1;">Users, Transactions, Logs, Migrations</span>' +
              '</div>' +
              '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(251,191,36,0.3);border-radius:12px;padding:12px;">' +
                '<b style="color:#fbbf24;font-size:12.5px;display:block;">External Services</b>' +
                '<span style="font-size:11.5px;color:#cbd5e1;">Managed Auth & RLS · Email · File Storage</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* CARD 2: DATABASE SCHEMA (SIMPLIFIED ERD) */
        '<div class="card" style="border-radius:20px;padding:24px;background:#0d1629;color:#fff;border:1px solid rgba(255,255,255,0.1);">' +
          '<div style="font-size:16px;font-weight:800;color:#fff;margin-bottom:18px;display:flex;align-items:center;gap:8px;">' +
            '<span>🗄️</span> Database Schema (Simplified)' +
          '</div>' +

          '<div style="display:grid;gap:10px;font-family:monospace;font-size:11.5px;">' +
            '<div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:10px;border-left:3px solid #38bdf8;">' +
              '<b style="color:#38bdf8;">users</b><br>' +
              '<span style="color:#94a3b8;">id (PK), name, email, password_hash, role, status, created_at, updated_at</span>' +
            '</div>' +

            '<div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:10px;border-left:3px solid #818cf8;">' +
              '<b style="color:#818cf8;">transactions</b><br>' +
              '<span style="color:#94a3b8;">id (PK), user_id (FK), type, amount, status, reference, created_at, updated_at</span>' +
            '</div>' +

            '<div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:10px;border-left:3px solid #34d399;">' +
              '<b style="color:#34d399;">roles</b><br>' +
              '<span style="color:#94a3b8;">id (PK), name, description</span>' +
            '</div>' +

            '<div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:10px;border-left:3px solid #fbbf24;">' +
              '<b style="color:#fbbf24;">audit_logs</b><br>' +
              '<span style="color:#94a3b8;">id (PK), user_id (FK), action, ip_address, created_at</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* CARD 3: TECH STACK & FEATURES */
        '<div class="card" style="border-radius:20px;padding:24px;background:#0d1629;color:#fff;border:1px solid rgba(255,255,255,0.1);">' +
          '<div style="font-size:16px;font-weight:800;color:#fff;margin-bottom:18px;display:flex;align-items:center;gap:8px;">' +
            '<span>⚡</span> Tech Stack & Key Features' +
          '</div>' +

          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;font-size:12px;">' +
            '<div>' +
              '<b style="color:#38bdf8;display:block;margin-bottom:4px;">Frontend:</b>' +
              '<span style="color:#cbd5e1;line-height:1.5;display:block;">• React 18 + TS<br>• Tailwind CSS<br>• TanStack Query<br>• shadcn/ui</span>' +
            '</div>' +
            '<div>' +
              '<b style="color:#34d399;display:block;margin-bottom:4px;">Backend:</b>' +
              '<span style="color:#cbd5e1;line-height:1.5;display:block;">• Node.js & Express<br>• PostgreSQL<br>• Managed Auth<br>• Rate Limiting</span>' +
            '</div>' +
          '</div>' +

          '<div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:10px;font-size:12px;color:#94a3b8;line-height:1.7;">' +
            '<span style="color:#4ade80;">✓ Secure Admin Panel</span><br>' +
            '<span style="color:#4ade80;">✓ Role-Based Access Control</span><br>' +
            '<span style="color:#4ade80;">✓ Real-Time Data & Full CRUD</span><br>' +
            '<span style="color:#4ade80;">✓ Audit Logs & Responsive Layout</span>' +
          '</div>' +
        '</div>' +

      '</div>' +

      /* BOTTOM QUOTE RIBBON (Image 2 & 3) */
      '<div style="background:linear-gradient(135deg,#0b1528,#1e3a8a);border-radius:24px;padding:32px 40px;color:#fff;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:24px;box-shadow:0 12px 36px rgba(0,0,0,0.2);">' +
        '<div style="max-width:700px;">' +
          '<div style="font-size:18px;font-weight:700;font-style:italic;line-height:1.4;color:#f8fafc;">' +
            '“The future of global finance is not just about moving money, it\'s about moving dreams — safely, smartly, and together.”' +
          '</div>' +
          '<div style="display:flex;gap:18px;margin-top:12px;font-size:13px;color:#38bdf8;font-weight:700;">' +
            '<span>🛡️ Safe</span> · <span>🤖 Smart</span> · <span>🌐 Global</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:12px;">' +
          '<a class="btn btn-primary" href="#/dashboard" style="padding:12px 24px;font-size:14px;">Open Dashboard</a>' +
          '<a class="btn btn-secondary" href="#/corridor-optimizer" style="background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.25);padding:12px 20px;">Launch Optimizer</a>' +
        '</div>' +
      '</div>' +

    '</div>';
}

global.ModArchitecture = { render: render, meta:{ title:"Architecture", nav:"Architecture", icon:"grid" } };
})(window);
