# Zealz - Expense Tracker & Budget Planner

A full-stack web application designed for personal finance management, featuring a beautifully designed dashboard, intuitive budget planning, and seamless transaction tracking.

## Tech Stack
- **Frontend**: React 18 (Vite), TailwindCSS v3, Recharts, Zustand, React Router v6
- **Backend**: Java 21, Spring Boot 3.2, Spring Security (JWT)
- **Database**: MongoDB Atlas (Spring Data MongoDB)

## Setup Instructions

### Prerequisites
- Java 21 & Maven 3.9+
- Node.js 18+ & npm 9+
- MongoDB instance running on `localhost:27017`

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
*(Note: A Database Seeder will automatically run on startup if the database is empty, injecting a demo user and sample data).*

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
