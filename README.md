# Image Mobiles — Field Service & Technician Live Tracking System

Production-grade job dispatching, real-time GPS fleet tracking, and two-leg lab repair management ecosystem for Image Mobiles.

---

## Clean Architecture & Application Separation

To guarantee security, prevent admin code/credential leakage to public clients, and optimize cellular loading speeds, the applications are cleanly decoupled:

```
                                      ┌───────────────────────────┐
                                      │      FIREBASE BACKEND     │
                                      │   - Cloud Firestore (Live)│
                                      │   - Cloud Functions (SMS) │
                                      │   - Firebase Storage      │
                                      └─────────────┬─────────────┘
                                                    │
                   ┌────────────────────────────────┼────────────────────────────────┐
                   ▼                                ▼                                ▼
       🏢 ADMIN PORTAL                     📱 TECHNICIAN APP                🌐 CUSTOMER TRACKING
       (Angular 18 Enterprise)             (Flutter Mobile App)             (Angular Lightweight)
       Directory: admin-web/               Directory: mobile/               Directory: customer-web/
       Domain: admin.imagemobiles.in       Platforms: Android / iOS         Domain: track.imagemobiles.in
       • Staff authentication              • Daily job queue                • ZERO login / SMS link
       • Estimate approval guardrail       • 10-15s background GPS ping     • Live moving vehicle Leaflet map
       • Live multi-branch fleet map       • Mid-job extra parts charges    • Dynamic ETA countdown
       • Dispatches & revenue reports      • Two-leg lab repair flow        • Live bill with GST calculation
                                           • Mandatory photo proof          • Printable tax invoice
```

---

## Directory Overview

```
image/
├── admin-web/                   # Dedicated Angular Admin Portal
│   ├── src/app/dashboard/       # KPI cards, live fleet map, dispatches table, estimate approval
│   ├── src/app/services/        # AdminService (Reactive RxJS / Firestore ready)
│   ├── src/app/models/          # Admin & staff models
│   ├── package.json             # Runs on port 4200
│   └── angular.json
│
├── customer-web/                # Dedicated Public Customer Tracking App
│   ├── src/app/track/           # Frictionless mobile tracking route, ETA, driver card, invoice
│   ├── src/app/services/        # CustomerTrackingService (Public document query)
│   ├── src/app/models/          # Customer-facing safe models (zero internal staff data)
│   ├── package.json             # Runs on port 4300
│   └── angular.json
│
├── mobile/                      # Flutter Technician Mobile Application
│   ├── lib/models/              # Dart models (Job, Technician, Pricing, Locations)
│   ├── lib/screens/             # JobList, JobDetail, AddChargeDialog, StatusActions
│   ├── lib/services/            # JobService (State, 12s GPS broadcast, photo proofs)
│   ├── lib/widgets/             # StatusBadge, custom UI widgets
│   ├── lib/main.dart            # Flutter Material 3 entry point
│   └── pubspec.yaml
│
├── firebase/
│   ├── firestore.rules          # Strict security rules (Role-based & token-restricted queries)
│   └── seed-data.json           # Realistic demo datasets for Kochi branches
│
└── Technician-Tracking-Proposal-final.docx.pdf # Original Proposal Specification
```

---

## How to Run Each Application

### 1. Admin Web Portal (`admin-web/`)
```bash
cd admin-web
npm install
npm start
```
Runs at: **`http://localhost:4200`**

### 2. Customer Tracking Web App (`customer-web/`)
```bash
cd customer-web
npm install
npm start
```
Runs at: **`http://localhost:4300/track/IMG-7204-KL`**

### 3. Flutter Technician Mobile App (`mobile/`)
```bash
cd mobile
flutter pub get
flutter run
```
Runs on Android device, iOS simulator, or desktop browser.

---

## Security & Architecture Guardrails Implemented

1. **Strict Client Isolation:**
   - The customer app bundle contains **zero** admin components, internal role checks, or staff salary/revenue metrics.
2. **Estimate Approval Guardrail:**
   - Technician-created jobs pause at `pending_estimate`.
   - The Branch Manager must approve or edit the diagnostic estimate from the Admin Dashboard before fieldwork can begin.
3. **Two-Leg Shop-Repair Workflow:**
   - Leg 1: `Reschedule -> Shop` $\rightarrow$ Live transit tracking to Central Repair Lab.
   - Intermission: `In Shop` $\rightarrow$ Phone undergoing lab repair; GPS stream automatically pauses to protect battery.
   - Leg 2: `Out for Delivery` $\rightarrow$ Dispatches return delivery to customer with active tracking.
4. **Mandatory Photo Proof:**
   - The technician mobile app prevents closing any job until at least 1 completion proof photo is uploaded.
