# PharmaCare System - Setup Guide

## ✅ All Errors Fixed!

This guide will help you set up and run the PharmaCare System.

## 🚀 Quick Start

### Prerequisites
- .NET 8.0 SDK
- Node.js 18+ and npm
- SQL Server (LocalDB or Express)
- Visual Studio 2022 or VS Code

### Step 1: Backend Setup

1. **Open the backend project** in Visual Studio or VS Code
2. **Update connection string** in `appsettings.json`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=YOUR_SERVER_NAME;Database=PharmaCareDB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true;"
   }
   ```
   Replace `YOUR_SERVER_NAME` with your SQL Server instance name (e.g., `DESKTOP-VEG8GMM` or `(localdb)\\MSSQLLocalDB`)

3. **Run the backend**:
   - In Visual Studio: Press **F5** or click Run
   - The API will start on `http://localhost:5050`
   - Swagger UI will be available at `http://localhost:5050/swagger`

4. **Database will be created automatically** when you first run the application (using `EnsureCreated()`)

### Step 2: Frontend Setup

1. **Navigate to frontend folder**:
   ```bash
   cd pharmacare-frontend
   ```

2. **Create `.env` file** in `pharmacare-frontend` folder:
   ```env
   VITE_API_URL=http://localhost:5050/api
   VITE_APP_NAME=PharmaCare
   ```

3. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

4. **Start the frontend**:
   ```bash
   npm start
   ```
   The app will run on `http://localhost:3000`

### Step 3: Test the Application

1. **Open browser** and go to `http://localhost:3000`
2. **Register a new account** or **login** if you have one
3. **You should see the dashboard** (no more blank page!)

## 🔧 What Was Fixed

### ✅ Dashboard Components
- Fixed empty `AdminDashboard`, `PatientDashboard`, and `PharmacistDashboard` components
- Added proper layout and content to all dashboard pages
- Fixed `StatsCard`, `LowStockAlert`, `ExpiringMedicines`, and `RecentActivity` components

### ✅ Port Configuration
- Fixed port mismatch between frontend and backend
- Frontend now correctly connects to `http://localhost:5050`
- Updated CORS settings to allow all necessary origins

### ✅ Authentication Flow
- Fixed API response handling in `AuthContext`
- Corrected data access for nested API responses
- Login and registration now properly store user data

### ✅ Database Setup
- Added automatic database creation on startup
- Database will be created if it doesn't exist

### ✅ Configuration Files
- Created `.gitignore` for backend project
- Updated `vite.config.js` with correct proxy settings
- Added HTTPS profile to `launchSettings.json`

## 📝 Important Notes

- **Backend runs on**: `http://localhost:5050`
- **Frontend runs on**: `http://localhost:3000`
- **Database**: Automatically created on first run
- **CORS**: Configured to allow frontend connections

## 🐛 Troubleshooting

### Blank Page After Login/Register
✅ **FIXED!** The dashboard components were empty. They now have proper content.

### Cannot Connect to API
- Make sure backend is running on `http://localhost:5050`
- Check that `.env` file exists with correct `VITE_API_URL`
- Verify CORS settings in `Program.cs`

### Database Errors
- Check your SQL Server connection string in `appsettings.json`
- Make sure SQL Server is running
- Database will be created automatically on first run

### Port Already in Use
- Change the port in `launchSettings.json` (backend)
- Change the port in `vite.config.js` (frontend)
- Update `.env` file with new backend URL

## 📚 Next Steps

1. Create an admin user (you may need to add this manually to the database)
2. Add some test medicines
3. Create test prescriptions
4. Test the full workflow

## 🎉 You're All Set!

The application should now work correctly. Login and registration will redirect to the appropriate dashboard based on user role.

