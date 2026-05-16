# Expence rack - Expense Tracker & Budget Planner

A full-stack web application designed for personal finance management, featuring a beautifully designed dashboard, intuitive budget planning, and seamless transaction tracking.

## Tech Stack
- **Frontend**: React 18 (Vite), TailwindCSS v3, Recharts, Zustand, React Router v6
- **Backend**: Java 21, Spring Boot 3.2, Spring Security (JWT)
- **Database**: MongoDB Atlas (Spring Data MongoDB)

## Setup Instructions

### Prerequisites
- Java 21 & Maven 3.9+
- Node.js 18+ & npm 9+
- MongoDB local or Atlas connection string

### Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
3. The server will start on `http://localhost:8080`.

Backend environment variables:

```bash
MONGODB_URI=mongodb+srv://USER:PASSWORD@HOST/expense_tracker?appName=Portfolio
MONGODB_DATABASE=expense_tracker
JWT_SECRET=replace-with-a-long-secret
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://your-vercel-app.vercel.app
SEED_DEMO_DATA=false
```

### Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the application at `http://localhost:5173`.

Frontend environment variables:

```bash
VITE_API_BASE_URL=http://localhost:8080/api
```

For Vercel, set `VITE_API_BASE_URL` to your Render backend URL plus `/api`.

### Deployment

- **Render backend**: use `render.yaml` or create a Docker web service with root directory `backend`. Set the backend environment variables above in Render.
- **Vercel frontend**: create a Vercel project with root directory `frontend`, build command `npm run build`, and output directory `dist`.
- After Vercel deploys, add the Vercel URL to Render's `CORS_ALLOWED_ORIGINS`.

## Features
- **Authentication**: Secure JWT-based login and registration.
- **Dashboard**: High-level overview with available balance, expense statistics (Area Chart), and recent transactions.
- **Budget Planner**: Asymmetric bento grid dashboard featuring multiple chart types (Donut, Pie, Bar, Line) to analyze cash flow, bill summaries, and budget vs. actual expenses.
- **Transactions**: Full CRUD capabilities for income and expense tracking.
- **Wallet**: View associated payment methods and current balances.
- **Dynamic Animations**: Smooth mounting animations, counting numbers, and chart reveals.

## Screenshots

*(Placeholders for future screenshots)*
- Dashboard View
- Budget Planner View
- Transactions List
- Mobile Navigation
