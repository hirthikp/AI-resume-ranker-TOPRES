# Supabase Setup Instructions

## Database Integration

Your app is now configured to use Supabase for persistent cloud storage instead of just localStorage.

### Setup Steps:

1. **Create a Supabase Project:**
   - Go to https://supabase.com
   - Create a new project
   - Get your project URL and anon key from Settings > API

2. **Configure Environment Variables:**
   - Copy `.env.example` to `.env`
   - Replace the placeholders with your actual Supabase credentials:
     ```
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key-here
     ```

3. **Create Database Tables:**
   Run these SQL commands in your Supabase SQL Editor (Settings > SQL Editor):

   ```sql
   -- Users table
   CREATE TABLE users (
     id TEXT PRIMARY KEY,
     username TEXT UNIQUE NOT NULL,
     password TEXT NOT NULL,
     role TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Insert default admin user (username: admin, password: admin123)
   INSERT INTO users (id, username, password, role)
   VALUES ('admin-0', 'admin', 'admin123', 'RECRUITER');

   -- Resumes table
   CREATE TABLE resumes (
     id TEXT PRIMARY KEY,
     candidate_id TEXT NOT NULL,
     candidate_name TEXT NOT NULL,
     content TEXT NOT NULL,
     file_data TEXT,
     file_name TEXT,
     upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     status TEXT DEFAULT 'Pending',
     analysis JSONB,
     shortlisted BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Job Descriptions table
   CREATE TABLE job_descriptions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id TEXT NOT NULL,
     title TEXT NOT NULL,
     content TEXT NOT NULL,
     is_active BOOLEAN DEFAULT TRUE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

   **Note:** A default admin account is created with:
   - Username: `admin`
   - Password: `admin123`
   - Role: RECRUITER

4. **Run the App:**
   ```bash
   npm run dev
   ```

### What Changed:

- ✅ **storage.ts** - Now uses Supabase exclusively for all data operations
- ✅ **Authentication** - User login/registration fully integrated with Supabase users table
- ✅ **App.tsx** - All data loading happens asynchronously from Supabase
- ✅ **Auto-sync** - Changes are automatically saved to Supabase with debouncing (500ms)
- ✅ **No localStorage** - All data is stored in Supabase cloud database

### Features:

- **Cloud-first storage** - All data is saved directly to Supabase
- **User authentication** - Secure user management with Supabase database
- **Multi-device sync** - Access your data from any device instantly
- **Real-time updates** - Changes are reflected immediately across all sessions
- **Automatic backups** - Data is safely stored in the cloud with Supabase's built-in redundancy

### Troubleshooting:

If you see "Failed to load data from database":
- Check your `.env` file has the correct credentials (should start with VITE_)
- Make sure you created the database tables using the SQL commands above
- Verify the default admin user was inserted (username: admin, password: admin123)
- Check the browser console for specific error messages
- Verify your Supabase project is active and the URL is correct

If login fails:
- Ensure you ran the INSERT query to create the default admin user
- Check that the users table exists in your Supabase database
- Try registering a new account to test if the database connection works

**Note:** The app now requires Supabase to be configured. Without proper Supabase credentials, you won't be able to log in or store data.
