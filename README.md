# Gatherly

A full-stack calendar and availability management application that enables users to manage their schedules and availability within organizations.

## Technology Stack

### Frontend
- **React + Vite**: Modern React application bundled with Vite
- **Clerk**: Authentication and user management
- **FullCalendar**: Interactive calendar interface
- **React Router**: Client-side routing

### Backend
- **Node.js + Express**: Server-side API and business logic
- **MongoDB + Mongoose**: Database and ODM
- **Clerk Backend**: Authentication verification

## Features

- **User Authentication**: Secure login/signup via Clerk
- **Organization Management**: Switch between different organizations
- **Calendar Management**: Create, view, and manage events
- **Availability Settings**: Set and manage availability slots

## Project Structure

```
├── frontend/                # React frontend application
│   ├── public/              # Static assets
│   ├── src/                 # Source code
│   │   ├── Components/      # React components
│   │   ├── assets/          # Images and other assets
│   │   ├── styles/          # CSS styles
│   │   ├── App.jsx          # Main application component
│   │   └── main.jsx         # Entry point
│   ├── .env                 # Environment variables (not versioned)
│   └── package.json         # Dependencies and scripts
│
├── backend/                 # Node.js Express backend
│   ├── Controllers/         # API route handlers
│   ├── Models/              # Mongoose data models
│   ├── middleware/          # Custom middleware
│   ├── server.js            # Express server setup
│   ├── .env                 # Environment variables (not versioned)
│   └── package.json         # Dependencies and scripts
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB instance
- Clerk account for authentication

### Setup

1. **Clone the repository**
   ```
   git clone <repository-url>
   cd gatherly
   ```

2. **Backend Setup**
   ```
   cd backend
   npm install
   ```

   Create a `.env` file with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   CLERK_SECRET_KEY=your_clerk_secret_key
   PORT=8000
   ```

3. **Frontend Setup**
   ```
   cd frontend
   npm install
   ```

   Create a `.env` file with the following variables:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   ```

### Running the Application

1. **Start the backend server**
   ```
   cd backend
   npm run dev
   ```

2. **Start the frontend development server**
   ```
   cd frontend
   npm run dev
   ```

3. Access the application at `http://localhost:5173`
