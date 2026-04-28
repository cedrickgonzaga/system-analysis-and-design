# FindFix

# UI / Wireframe - Figma
- https://www.figma.com/design/KeeeR7IcdlTSvkEX2uNEVs/FindFix-UI?m=auto&t=zk8UF29KH5gbxmEv-1

# Diagrams - Miro
- Data Flow
  (https://miro.com/app/board/uXjVGxka0Wk=/?share_link_id=637470120284)
- Program Flow
  (https://miro.com/app/board/uXjVG65ipbE=/?share_link_id=32051574451)
- Entity Relationship
  (https://miro.com/app/board/uXjVGxrU5FE=/?share_link_id=25562273423)
- Use Case
  (https://miro.com/app/board/uXjVGvJeKlE=/?share_link_id=504057002406)

# System Paper
- https://docs.google.com/document/d/1xS10uBYwXbsj8SFSDnIIctAVsrThlrCxb-3RGrS5gpQ/edit?tab=t.0

---

# 🚀 Getting Started with FindFix

Welcome to **FindFix**, a comprehensive Facility Issue Reporting and Lost & Found Management System! This guide will walk you through setting up the project locally, configuring the database, and running both the frontend and backend.

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- **Python 3.x** (for the FastAPI backend)
- **Node.js & npm** (optional, but helpful for running a local server like `live-server`)
- A **Supabase** account (Free tier is perfect!)

## 🗄️ Database Setup (Supabase)

FindFix uses Supabase for authentication, database storage, and image hosting.

1. **Create a Project:** Go to [Supabase](https://supabase.com/dashboard) and create a new project.
2. **Create the Tables:** Open the **SQL Editor** in Supabase and run the following queries to set up your tables:

   ```sql
   -- Users Profile Table
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     auth_id UUID UNIQUE NOT NULL,
     full_name TEXT NOT NULL,
     school_email TEXT NOT NULL,
     role TEXT DEFAULT 'standard',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
   );

   -- Issue Tickets Table
   CREATE TABLE issue_tickets (
     id SERIAL PRIMARY KEY,
     reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
     category TEXT NOT NULL,
     issue_name TEXT NOT NULL,
     location TEXT NOT NULL,
     description TEXT,
     image_url TEXT,
     status TEXT DEFAULT 'Pending',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
   );

   -- Found Items Table
   CREATE TABLE found_items (
     id SERIAL PRIMARY KEY,
     poster_id UUID REFERENCES users(id) ON DELETE CASCADE,
     item_name TEXT NOT NULL,
     description TEXT,
     image_url TEXT,
     category TEXT NOT NULL,
     location TEXT NOT NULL,
     status TEXT DEFAULT 'pending',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
   );

   -- Claims Table
   CREATE TABLE claims (
     id SERIAL PRIMARY KEY,
     item_id INTEGER REFERENCES found_items(id) ON DELETE CASCADE,
     claimant_id UUID REFERENCES users(id) ON DELETE CASCADE,
     proof_image_url TEXT,
     status TEXT DEFAULT 'pending',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
   );
   ```

3. **Storage Bucket:**
   - Go to **Storage** in your Supabase dashboard.
   - Create a new bucket named exactly `images`.
   - Mark the bucket as **Public**.

4. **Get Your API Keys:**
   - Go to **Project Settings** (the gear icon) ⚙️ -> **API**.
   - Note down your `Project URL`, `anon` (public) key, and `service_role` (secret) key.

## ⚙️ Backend Setup (FastAPI)

1. **Navigate to the backend folder:**
   ```bash
   cd back-end
   ```

2. **Create a Virtual Environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables:**
   Create a `.env` file inside the `back-end` folder and add your Supabase credentials:
   ```env
   SUPABASE_URL="https://your-project-id.supabase.co"
   SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_KEY="your-service-role-key"
   ```

5. **Run the Server:**
   ```bash
   uvicorn main:app --reload
   ```
   *The backend will now be running on `http://localhost:8000`.* 🎉

## 🎨 Frontend Setup

The frontend is built with pure HTML, CSS, and JavaScript.

1. **Connect Frontend to Supabase:**
   Open `front-end/js/supabase.js` and update the constants with your Supabase URL and Anon Key:
   ```javascript
   const SUPABASE_URL = "https://your-project-id.supabase.co";
   const SUPABASE_ANON_KEY = "your-anon-key";
   ```

2. **Run a Local Server:**
   To ensure CORS and relative paths work correctly, do not just double-click the HTML files. Serve them using a local server.
   
   If you have VS Code, install the **Live Server** extension, right-click `front-end/landing-login-register-page/index.html`, and select "Open with Live Server".
   
   Alternatively, via terminal:
   ```bash
   cd front-end
   npx serve .  # Or npx live-server .
   ```

## 👑 Managing Admins

By default, anyone who registers via the `register.html` page becomes a **`standard`** user. 

To create an Admin account:
1. Register a new account normally through the app UI.
2. Go to your **Supabase Dashboard** -> **Table Editor** -> **`users`** table.
3. Double-click the `role` cell for the user you just created.
4. Change it from `standard` to one of the following exact strings:
   - `it_admin`
   - `facility_admin`
   - `security`
5. Press **Enter** to save. When that user logs in, they will automatically be routed to their respective admin dashboard! 🛡️

## 🧹 Resetting Data (Testing)

If you've created a lot of test tickets or items and want to wipe the slate clean, you can safely run these commands in the Supabase **SQL Editor**:

```sql
-- Wipe all test data but keep user accounts
DELETE FROM claims;
DELETE FROM issue_tickets;
DELETE FROM found_items;
```