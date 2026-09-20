# Bean Tradition - Artisanal Coffee Experience

A premium, full-stack coffee e-commerce application designed to provide a luxury brewing experience. This platform allows users to explore artisanal coffee beans, manage a cart, and complete secure checkouts with Razorpay integration, all backed by a Supabase/PostgreSQL database.

> **Also in this repository: the Event Ordering and Live Tracking system.**
> A separate, standalone app (React + Vite frontend in `frontend/`, Python FastAPI
> backend in `backend/`, Google Sheets datastore, Meta WhatsApp Cloud API) used to take
> coffee orders and give customers a live tracking link at events. It is independent of the
> e-commerce app above. See **[README-event.md](README-event.md)** and the guides in
> [`docs/`](docs/). Quickstart below.

## Run the Event Ordering system from a fresh clone

The event system's dependencies and secrets are git-ignored, so a fresh clone needs a
one-time setup. Requires **Python 3.12** (not 3.13/3.14) and Node 18+.

```bash
# Backend (from repo root)
py -3.12 -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env      # then fill in Google + secrets (see docs/)

# Frontend
cd frontend && npm install
cp .env.example .env                       # VITE_API_BASE_URL=http://localhost:8000
```

Run the two servers (separate terminals):

```bash
# Backend  ->  http://localhost:8000  (API docs at /docs in dev)
cd backend && .venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000

# Frontend ->  http://localhost:5173
cd frontend && npm run dev
```

The backend starts with an in-memory datastore until Google Sheets credentials are set in
`backend/.env`, so it runs with zero config for a first look. Full setup (Google Cloud,
Sheet, Meta WhatsApp, deployment) is in [`docs/`](docs/) and [README-event.md](README-event.md).

## 🌟 Features

- **Premium UI/UX**: Cinematic Hero sections, artisan covenant displays, and a seamless shopping experience.
- **Full-Stack Integration**: Real-time product management and order tracking via Supabase.
- **Secure Payments**: Integrated with Razorpay for seamless and secure transactions.
- **Admin Dashboard**: Manage orders, track sales, and oversee the product catalog.
- **User Profiles**: Track "Brew History" and manage personal details.
- **Responsive Design**: Optimized for both mobile and desktop users.

## 🛠 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Axios.
- **Backend**: Node.js, Express.
- **Database**: Supabase (PostgreSQL).
- **Authentication**: JWT based auth with Supabase user management.
- **Payments**: Razorpay API.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- Supabase Account
- Razorpay Account (for keys)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd bean-tradition
   ```

2. **Install Dependencies:**
   - Root (Frontend):
     ```bash
     npm install
     ```
   - Server (Backend):
     ```bash
     cd server
     npm install
     ```

3. **Environment Setup:**
   Create a `.env` file in the `server/` directory using the provided `.env.example` as a template.
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_secret
   RAZORPAY_KEY_ID=your_razorpay_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ```

4. **Run the Application:**
   - Start the Backend (from `server/`):
     ```bash
     npm run dev
     ```
   - Start the Frontend (from root `/`):
     ```bash
     npm run dev
     ```

## 📜 License

Created for **Bean Tradition**. All rights reserved 2026.
