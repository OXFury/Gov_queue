# 🏛️ Digital Queue Management System for Government Offices (Capstone Project)

An intelligent, full-stack digital queue management and wait-time prediction system designed for government offices (RTO counters, Passport Seva Kendras, Municipal Offices, Aadhaar Centers, etc.).

---

## 🌟 Key Features & Problem Solved

### Problem Solved
Traditional government offices suffer from chaotic physical wait queues, long unpredicted delays, lack of priority handling, and static counter assignments that lead to severe bottlenecks.

### Core Solutions Built
1. **Token Generation Service**: Self-service kiosk for citizens with priority categories (*Senior Citizen*, *Disabled Access*, *Urgent Case*, and *Normal*).
2. **Queue Engine (Fair Priority Interleaving)**: Weighted priority scheduling algorithm that serves priority tokens faster while enforcing a starvation-prevention ratio (e.g. 2 priority : 1 normal) so standard tickets never wait indefinitely.
3. **Wait-Time Prediction Engine**: Uses a **Rolling Simple Moving Average (SMA)** of the last $N=10$ completed service durations per service type & counter combined with queue depth tracking. (Extendable to ML models).
4. **Counter Allocation Optimizer**: Dynamic load rebalancing engine that detects bottleneck queues and suggests/applies 1-click counter reassignment for idle multi-service counters.
5. **Real-Time Display & Tracker Dashboard**: Socket.io live updates for public TV boards and citizen mobile tracking without page refreshes.
6. **Regional Admin Operations Panel**: Live KPIs, daily token volume, peak hour distributions, average wait times, and counter CRUD management.

---

## 🏗️ Tech Stack

- **Frontend**: React.js (Vite, Lucide Icons, Glassmorphic CSS Design System)
- **Backend**: Node.js + Express.js
- **Real-Time WebSockets**: Socket.io (Bi-directional live event broadcasting)
- **Database**: MongoDB (Mongoose ORM) with **zero-config fallback to `mongodb-memory-server`** if local MongoDB is not running!
- **Auth**: JSON Web Tokens (JWT) + bcryptjs (Roles: `admin`, `staff`, `citizen`)

---

## 📊 Entity-Relationship (ER) Diagram Description

### Entities & Relationships

```
 [ ServiceType ] 1 ------- N [ Token ] N ------- 1 [ Counter ]
       |                                                 |
       |                                                 |
       +------------------- N : M -----------------------+
                                                         |
 [ User (Staff/Admin) ] 1 ---------------------- 0..1 ---+
```

### Entity Details

1. **User (Staff / Admin / Citizen)**
   - `_id`: ObjectId
   - `name`: String
   - `email`: String (Unique)
   - `password`: String (Hashed bcrypt)
   - `role`: Enum (`'admin'`, `'staff'`, `'citizen'`)
   - `assignedCounter`: ObjectId -> Ref `Counter`

2. **ServiceType**
   - `_id`: ObjectId
   - `code`: String (e.g., `'PAS'`, `'LIC'`, `'TAX'`, `'REG'`)
   - `name`: String (e.g., `"Passport Services & Renewal"`)
   - `description`: String
   - `avgDurationMinutes`: Number (Default fallback e.g. 10)
   - `priorityRatio`: Number (e.g. 2 -> serve max 2 consecutive priority tokens before forcing 1 normal token)
   - `isActive`: Boolean

3. **Counter**
   - `_id`: ObjectId
   - `counterNumber`: Number (Unique e.g. 1, 2, 3)
   - `name`: String (e.g., `"Counter 1 - Passport & RTO Desk"`)
   - `supportedServices`: Array -> Ref `ServiceType`
   - `assignedStaff`: ObjectId -> Ref `User`
   - `status`: Enum (`'active'`, `'paused'`, `'closed'`)
   - `currentToken`: ObjectId -> Ref `Token`
   - `tokensServedToday`: Number
   - `consecutivePriorityServed`: Number (Tracked for Fair Priority ratio enforcement)

4. **Token**
   - `_id`: ObjectId
   - `tokenNumber`: String (e.g., `'PAS-106'`, `'LIC-104'`)
   - `serviceType`: ObjectId -> Ref `ServiceType`
   - `citizenName`: String
   - `citizenPhone`: String
   - `priorityType`: Enum (`'normal'`, `'senior'`, `'disabled'`, `'urgent'`)
   - `priorityScore`: Number (Normal = 1, Priority = 3)
   - `status`: Enum (`'waiting'`, `'serving'`, `'completed'`, `'cancelled'`, `'no_show'`)
   - `assignedCounter`: ObjectId -> Ref `Counter`
   - `servedBy`: ObjectId -> Ref `User`
   - `estimatedWaitMinutes`: Number
   - `actualWaitMinutes`: Number
   - `serviceDurationMinutes`: Number
   - `calledAt`: Date
   - `completedAt`: Date
   - `createdAt`: Date

---

## ⚡ Quick Start & Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm

### 1. Backend Setup & Run

```bash
cd backend
npm install
npm run seed     # (Optional: populates database with rich mock historical data)
npm start        # Starts Express server on http://localhost:5000
```
> **Note**: If you don't have MongoDB running locally, the server automatically boots an in-memory MongoDB instance (`mongodb-memory-server`) so it works out of the box with zero setup!

### 2. Frontend Setup & Run

In a new terminal window:

```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Credentials for Viva Evaluation

| Role | Email | Password | Access / Desk |
| :--- | :--- | :--- | :--- |
| **Regional Admin** | `admin@gov.in` | `admin123` | Full Analytics, Counter CRUD, Optimizer |
| **Counter Staff 1** | `staff1@gov.in` | `staff123` | Assigned to Counter 1 (Passport & RTO) |
| **Counter Staff 2** | `staff2@gov.in` | `staff2@gov.in` | Assigned to Counter 2 (Passport Express) |
| **Citizen / Guest** | `citizen@gov.in` | `citizen123` | Token Generation Kiosk & Live Tracker |

*(Tip: Click the **"Quick Demo Logins"** buttons inside the login modal for 1-click login during evaluation!)*

---

## 🎓 Viva Defense Explanation Guide

### 1. How does the Queue Engine prevent normal ticket starvation?
**Code Location**: `backend/services/queueEngine.js`
- **Explanation**: A pure priority queue causes starvation when senior/disabled citizens continuously arrive. Our engine implements **Weighted Priority Interleaving**. Each `ServiceType` configures a `priorityRatio` (e.g. 2). The counter tracks `consecutivePriorityServed`. Once 2 priority tokens are served back-to-back, the engine forces calling the oldest waiting normal ticket, ensuring fairness.

### 2. How is Wait-Time predicted dynamically?
**Code Location**: `backend/services/predictionService.js`
- **Explanation**: Rather than using static timers, the system computes a **Rolling Simple Moving Average (SMA)** over the last $N=10$ completed service durations for that service type & counter:
  $$\text{SMA\_Duration} = \frac{\sum_{i=1}^N \text{Duration}_i}{N}$$
  $$\text{Estimated Wait} = \frac{\text{Queue Position Ahead} \times \text{SMA\_Duration}}{\text{Active Counters Servicing Type}}$$
- **ML Extension Note**: Explain to external examiners that SMA can be upgraded to an XGBoost Regression or LSTM neural network by feeding feature vectors like time-of-day peak index, day of week, staff efficiency index, and document complexity level.

### 3. How does the Counter Allocation Optimizer work?
**Code Location**: `backend/services/counterOptimizer.js`
- **Explanation**: The optimizer monitors queue depth across service types. If a service queue exceeds 5 waiting citizens while another desk is idle/low-load, the optimizer identifies flexible multi-service counters and suggests/applies dynamic desk service reassignment.

---

## 📁 Directory Architecture

```
gov-queue-system/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection + MongoMemoryServer fallback
│   ├── models/
│   │   ├── User.js
│   │   ├── ServiceType.js
│   │   ├── Counter.js
│   │   └── Token.js
│   ├── services/
│   │   ├── queueEngine.js        # Fair Priority Interleaving Algorithm
│   │   ├── predictionService.js  # Wait-Time Simple Moving Average Engine
│   │   └── counterOptimizer.js   # Dynamic Counter Load Rebalancer
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── tokenController.js
│   │   ├── counterController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── tokenRoutes.js
│   │   ├── counterRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/
│   │   └── auth.js               # JWT Verification & Role Check
│   ├── sockets/
│   │   └── queueSocket.js        # Socket.io Real-time Event Broadcaster
│   ├── seed.js                   # Mock Data Seeder
│   └── server.js                 # Entry Point
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── services/
    │   │   ├── api.js
    │   │   └── socket.js
    │   ├── views/
    │   │   ├── CitizenKiosk.jsx      # Module 1 & 3
    │   │   ├── CitizenTracker.jsx    # Live Tracking
    │   │   ├── PublicDisplayBoard.jsx# Module 5 TV Board
    │   │   ├── StaffTerminal.jsx     # Module 2 & 4 Staff Desk
    │   │   └── AdminPanel.jsx        # Module 6 Analytics & Optimizer
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── LoginModal.jsx
    │   ├── App.jsx
    │   └── index.css             # Glassmorphism Design System
    ├── package.json
    └── vite.config.js
```
