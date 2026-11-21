# 🍟 ChipStock

**ChipStock** is a lightweight, mobile-first inventory management and billing (POS) web application designed for a hostel-based chips and snacks business.

Built from the ground up for **Google Chrome on Android**, it empowers hostel snack entrepreneurs to punch orders in seconds with one hand, maintain live stock counts, record customer dues/unpaid bills, and print or share receipts.

---

## 🌟 Key Features

### 📱 1. Mobile-First & Touch-Friendly (Android Chrome Optimized)
- **One-Handed Navigation**: Fixed bottom navigation bar (`Home`, `Inventory`, `Sell`, `History`) keeps essential actions easily reachable on 360px–440px screens.
- **Zomato-Style 2-Column Sell Grid**: Clean, colorful snack cards with 1-tap `+ ADD` and responsive quantity steppers directly on the card.
- **Sticky Cart & Bottom Sheet Checkout**: Seamless sticky cart pill showing live totals (`3 packets • ₹60 | View Cart →`), sliding up into a bottom sheet for fast checkout.
- **Progressive Web App (PWA)**: Installable to your Android home screen with a standalone app window, splash icon, and offline safety protections.
- **Safe Area & Double-Click Protection**: Anti-rubberbanding, minimum 44px touch targets, and disabled submission buttons during active transactions prevent duplicate billing.

### 📦 2. Inventory Management
- **Color-Coded Varieties**: Assign custom snack colors (Lays Yellow, Kurkure Orange, Mad Angles Red, Cream & Onion Green, Masala Blue, etc.).
- **Smart Stock Operations**:
  - **Add Stock**: Increment pieces (e.g., adding 10 packets to 5 makes 15).
  - **Stock Correction**: Manual quantity replacement requiring an explicit reason (recorded in stock movement logs for transparency).
- **Stock Movement Ledger**: Full audit trail tracking `STOCK_IN`, `SALE`, and `ADJUSTMENT` events with timestamps.
- **Configurable Low-Stock Threshold**: Visual alerts when packets drop below your custom limit.
- **Historical Protection**: Products with recorded sales cannot be accidentally deleted—they are deactivated instead so past bills remain intact.

### ⚡ 3. Fast Billing & Sale Transactions
- **Atomic Stock Deductions**: Deducts stock safely at checkout using atomic conditional updates, preventing negative stock or race conditions.
- **Unpaid Sales Tracking**: Mark bills as `PAID` or `UNPAID` with one click. Stock is safely deducted in both cases, keeping inventory accurate while tracking hostel room credit.
- **Historical Pricing Snapshot**: Every bill permanently snapshots the product name, unit price, color, and line totals as they were at the moment of sale.
- **Printable Receipts**: Clean thermal/receipt printer and mobile-friendly print view formatted for quick sharing or record-keeping.

### 📊 4. Live Dashboard & Reporting
- Real-time calculations directly from MongoDB (no mock or placeholder stats):
  - **Today's Collected Revenue** (₹)
  - **Pending Dues** (₹ from unpaid hostel credits)
  - **Total Pieces in Inventory**
  - **Active Snack Varieties**
  - **Low-Stock Warnings & 1-Tap Restock**
- **CSV Data Exports**: One-click download of full Inventory CSV and Bill History CSV.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, Lucide React |
| **Backend API** | Node.js, Express, Mongoose, Serverless-HTTP |
| **Database** | MongoDB Atlas (Free Tier / M0+) |
| **Deployment** | Netlify (Static SPA + Netlify Serverless Functions) |
| **PWA** | Web Manifest, Service Worker (offline protection) |

---

## 📂 Project Structure

```text
bijness/
├── client/                     # React + Vite Frontend
│   ├── public/
│   │   ├── manifest.webmanifest# PWA manifest
│   │   ├── sw.js               # Service Worker (Network-only for API)
│   │   └── chip-icon.svg       # Vector App Icon
│   ├── src/
│   │   ├── components/         # Navbar, BottomNav, Sidebar, OfflineBanner
│   │   ├── context/            # AuthContext, CartContext, InventoryContext, ToastContext
│   │   ├── pages/              # Dashboard, Inventory, Sell, History, Settings, Login
│   │   ├── api.js              # Centralized fetch client
│   │   ├── App.jsx             # Main layout & routing
│   │   ├── index.css           # Tailwind & thermal print styles
│   │   └── main.jsx            # React root
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js          # Dev proxy to local Express server
├── server/                     # Node.js + Express API
│   ├── controllers/            # Auth, Products, Bills, Dashboard, Settings
│   ├── middleware/             # Auth check (JWT & HttpOnly cookies)
│   ├── models/                 # Product, Bill, StockMovement, Settings
│   ├── routes/                 # Express API routes (/api/*)
│   ├── app.js                  # Express application setup
│   ├── db.js                   # Mongoose connection with serverless pooling
│   └── server.js               # Standalone local entrypoint (Port 5000)
├── netlify/
│   └── functions/
│       └── api.js              # Serverless handler for Netlify Functions
├── tests/
│   └── test-app.js             # Automated unit & logic tests
├── netlify.toml                # Netlify build & redirect routing
├── .env.example                # Sample environment configuration
└── package.json                # Root scripts & dependencies
```

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- Node.js v18 or later
- npm v9 or later
- A free MongoDB Atlas cluster (or local MongoDB)

### 2. Install Dependencies
```bash
# In the root project directory:
npm install

# In the client directory:
cd client && npm install && cd ..
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
PORT=5000
NODE_ENV=development

# Replace with your MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=chipstock

# Admin Password Bcrypt Hash
# Default password if left empty: "chipstock123"
ADMIN_PASSWORD_HASH=$2b$10$g.nqOpZOgmkh44h8g7Ipi.q4lIk/C33JKZGbTHAefZ/L/tDBj7Ieq

# JWT Session Secret
SESSION_SECRET=your_super_secret_session_jwt_key_here
```

### 4. Generate a Custom Admin Password Hash
To create a bcrypt hash for any custom admin password:
```bash
npm run hash-password "yourSecretPassword"
```
Copy the resulting `$2b$10$...` hash into your `.env` as `ADMIN_PASSWORD_HASH`.

### 5. Run the Application
Run both backend API and Vite frontend concurrently:
```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## ☁️ Deployment on Netlify

ChipStock is configured to deploy directly to Netlify without requiring a separate paid backend server:

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial ChipStock release"
   git branch -M main
   git remote add origin https://github.com/<your-username>/chipstock.git
   git push -u origin main
   ```

2. **Connect to Netlify**:
   - Go to [Netlify](https://app.netlify.com/) and click **Add new site > Import an existing project**.
   - Select your GitHub repository.
   - Netlify will automatically detect `netlify.toml`:
     - **Build command**: `npm run build`
     - **Publish directory**: `client/dist`
     - **Functions directory**: `netlify/functions`

3. **Set Netlify Environment Variables**:
   In **Site configuration > Environment variables**, add:
   - `MONGODB_URI`: Your MongoDB Atlas URI.
   - `DATABASE_NAME`: `chipstock`
   - `ADMIN_PASSWORD_HASH`: Your bcrypt password hash (from `npm run hash-password`).
   - `SESSION_SECRET`: A long random string.
   - `NODE_ENV`: `production`

4. **Deploy**:
   Click **Deploy site**. Both your frontend and serverless Express API will be live on the same domain!

---

## 🔒 Security Best Practices
- **HttpOnly Cookies**: Session tokens are stored in secure HttpOnly cookies, shielding them from XSS.
- **Authorization Header Fallback**: PWA standalone mode and mobile webviews can seamlessly authenticate via Authorization tokens if cookies are partitioned.
- **Login Rate Limiting**: Built-in rate limiting throttles brute force attempts.
- **Strict Server Validation**: Client prices and totals are never trusted. All arithmetic, discounts, and inventory deductions are computed authoritatively on the server.
- **No Stale Ghost Sales**: The PWA service worker explicitly forbids caching `/api/*` responses, preventing stale inventory or unconfirmed transactions.

---

## 🧪 Testing

Run the automated test suite:
```bash
npm test
```
Verifies bcrypt password hashing, token validation, price snapshots, quantity boundary validations, and stock addition vs. correction logic.

---

## 📄 License
ISC License. Built with ❤️ for hostel entrepreneurs.
