# EHR App - Localhost Setup Guide

This guide will help you run the Electronic Health Records (EHR) application on your local machine.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup (Supabase)](#database-setup-supabase)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)
- [Testing Credentials](#testing-credentials)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software
- **Node.js**: Version 18.x or higher (currently tested with v20.19.5)
- **npm**: Version 8.x or higher (currently tested with v10.8.2)
- **Git**: For version control (optional but recommended)

### Check Your Versions
```bash
node --version
npm --version
```

If you need to install or update Node.js, download it from [nodejs.org](https://nodejs.org/)

---

## Initial Setup

### 1. Navigate to Project Directory
```bash
cd "/Users/keletsontseno/Downloads/EHR APP"
```

### 2. Install Dependencies
The `node_modules` folder already exists, but if you need to reinstall or update dependencies:

```bash
npm install
```

This will install all required packages including:
- React 18.3.1
- Vite (build tool)
- Supabase Client
- Tailwind CSS
- TypeScript
- Lucide React (icons)

---

## Environment Configuration

### 1. Environment Variables

Your application uses environment variables to connect to Supabase. You already have a `.env` file configured.

**Current configuration:**
```env
VITE_SUPABASE_URL=https://rgkwmmjnjwsvxmbirerc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. If You Need to Change Credentials

If you want to use a different Supabase project:

1. Copy `.env.example` to create a new `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env`:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Get these values from your Supabase project:
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project
   - Go to Settings > API
   - Copy the Project URL and anon/public key

---

## Database Setup (Supabase)

### Database Migrations

Your project includes database migrations in the `supabase/migrations/` directory. These need to be applied to your Supabase database.

#### Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Link to your project:**
   ```bash
   supabase link --project-ref rgkwmmjnjwsvxmbirerc
   ```

3. **Apply migrations:**
   ```bash
   supabase db push
   ```

#### Option 2: Manual Migration via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Open and run each migration file in order from `supabase/migrations/`:
   - They are numbered, so run them in sequential order
   - Most recent important migration: `20250101000004_fix_complete_data_flow.sql`

### Database Schema Overview

The application uses the following main tables:
- `patients` - Patient demographic information
- `medical_histories` - Medical history, allergies, medications
- `next_of_kin` - Emergency contact information
- `consultations` - Doctor consultation notes
- `users` - Application users (doctors, receptionists, etc.)

---

## Running the Application

### 1. Development Server

Start the development server with hot-reload:

```bash
npm run dev
```

**Expected output:**
```
VITE v5.4.2  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

### 2. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

### 3. Default Port

- The application runs on port `5173` by default
- If this port is busy, Vite will automatically use the next available port (5174, 5175, etc.)

### 4. Custom Port (Optional)

To run on a specific port:

```bash
npm run dev -- --port 3000
```

---

## Testing Credentials

### Demo Users

If you've run the demo users SQL script (`create-demo-users.sql`), you can log in with:

**Doctor Account:**
- Email: Check your `users` table in Supabase
- Role: doctor

**Receptionist Account:**
- Email: Check your `users` table in Supabase
- Role: receptionist

### Creating New Users

Users must be created in Supabase Auth:
1. Go to Supabase Dashboard > Authentication > Users
2. Add a new user with email and password
3. The user will be automatically synced to your `users` table

---

## Other Available Commands

### Build for Production
```bash
npm run build
```
Creates an optimized production build in the `dist/` folder.

### Preview Production Build
```bash
npm run preview
```
Preview the production build locally before deployment.

### Lint Code
```bash
npm run lint
```
Check for code quality issues using ESLint.

---

## Troubleshooting

### Issue: "Cannot find module" errors
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 5173 already in use
**Solution:**
```bash
# Find and kill the process using the port
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### Issue: "Network Error" when logging in
**Possible causes:**
- Check your `.env` file has correct Supabase credentials
- Verify your Supabase project is active
- Check internet connection
- Verify Supabase URL is accessible

**Debug:**
```bash
# Check if .env variables are loaded
cat .env
```

### Issue: Database connection errors
**Solution:**
- Verify migrations have been applied to Supabase
- Check Row Level Security (RLS) policies in Supabase
- Ensure API keys are correct and not expired

### Issue: "Failed to fetch" errors
**Possible causes:**
- CORS issues with Supabase
- RLS policies blocking access
- Invalid authentication token

**Debug:**
1. Open Browser DevTools (F12)
2. Check Console tab for detailed errors
3. Check Network tab for failed requests

### Issue: White screen or blank page
**Solution:**
1. Check browser console for JavaScript errors
2. Clear browser cache and reload
3. Verify all dependencies are installed:
   ```bash
   npm install
   ```

### Issue: TypeScript errors
**Solution:**
```bash
# Check for type errors
npm run build

# If using VS Code, reload the window
# CMD/CTRL + Shift + P > "Reload Window"
```

---

## Project Structure

```
EHR APP/
├── src/
│   ├── components/         # React components
│   │   ├── auth/          # Authentication components
│   │   ├── dashboards/    # Dashboard views
│   │   ├── patient/       # Patient management
│   │   ├── consultation/  # Consultation forms
│   │   ├── ui/            # Reusable UI components
│   │   └── layout/        # Layout components
│   ├── contexts/          # React contexts (Auth, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Third-party configurations
│   ├── utils/             # Utility functions
│   ├── types.ts           # TypeScript type definitions
│   ├── App.tsx            # Main App component
│   └── main.tsx           # Application entry point
├── supabase/
│   └── migrations/        # Database migrations
├── public/                # Static assets
├── .env                   # Environment variables (don't commit!)
├── .env.example           # Example environment file
├── package.json           # Project dependencies
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

---

## Development Workflow

### Recommended Steps
1. Start the dev server: `npm run dev`
2. Make your code changes
3. Changes will auto-reload in the browser
4. Check console for errors
5. Test functionality in the browser
6. Run linter before committing: `npm run lint`

### Hot Module Replacement (HMR)
Vite provides instant HMR, so you'll see changes immediately without full page reloads.

---

## Additional Resources

- **Vite Documentation**: https://vitejs.dev/
- **React Documentation**: https://react.dev/
- **Supabase Documentation**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## Support

If you encounter issues not covered in this guide:

1. Check the browser console for error messages
2. Check the terminal where `npm run dev` is running
3. Review the database logs in Supabase Dashboard
4. Check that all migrations have been applied

---

## Quick Start (TL;DR)

```bash
# Navigate to project
cd "/Users/keletsontseno/Downloads/EHR APP"

# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

That's it! Your EHR application should now be running on localhost.
