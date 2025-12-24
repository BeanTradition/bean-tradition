# Bean Tradition - Artisanal Coffee Experience

A premium, full-stack coffee e-commerce application designed to provide a luxury brewing experience. This platform allows users to explore artisanal coffee beans, manage a cart, and complete secure checkouts with Razorpay integration, all backed by a Supabase/PostgreSQL database.

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
