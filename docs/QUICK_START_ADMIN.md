# Admin Portal - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Apply Database Migration (2 minutes)

```bash
cd "/Users/keletsontseno/Downloads/EHR APP"
supabase db push
```

**What this does:**

- Creates practices table
- Creates system_settings table
- Creates audit_logs table
- Adds admin role support
- Inserts 3 default practices
- Sets up security policies

---

### Step 2: Register as Admin (1 minute)

1. Start app: `npm run dev`
2. Click "Create Account"
3. Fill form:
   - **Role:** Select **Admin** ⚡
   - Name, username, email, password
4. Click "Create Account"

---

### Step 3: Log In & Explore (1 minute)

1. Log in with admin credentials
2. See Admin Dashboard automatically
3. Try out the features:
   - 📊 **Dashboard** - View stats
   - 🏥 **Practices** - Add/edit practices
   - 👥 **Users** - Manage all users
   - ⚙️ **Settings** - Configure system

---

## ✨ What You Can Do

### Manage Practices

- Add new medical practices
- Edit practice details (name, address, phone)
- Activate/deactivate practices
- View user count per practice

### Manage Users

- View all users in the system
- Search by name/username
- Filter by role or practice
- Reset user passwords
- Delete users

### Configure Settings

- Change system name
- Toggle password requirements
- Set session timeout (5-120 min)
- Set max login attempts (3-10)
- Enable/disable audit logging

---

## 📝 Default Data

**3 Practices Created:**

1. City General Hospital (CGH001)
2. Family Wellness Clinic (FWC002)
3. Downtown Medical Center (DMC003)

**System Settings:**

- System Name: "MedCare EHR"
- Strong Passwords: ✅ Enabled
- Session Timeout: 30 minutes
- Max Login Attempts: 5
- Audit Logging: ✅ Enabled

---

## 🔒 Security

All admin actions are protected by Row Level Security (RLS):

- Only admins can add/edit/delete practices
- Only admins can manage users
- Only admins can change system settings
- All operations logged (when audit logging enabled)

---

## 💡 Tips

1. **Practice Codes** must be unique and uppercase (e.g., "ABC123")
2. **User emails** use format: `username@medcare.com` (for display)
3. **Password resets** send actual emails (requires Supabase email config)
4. **Settings changes** take effect immediately
5. **Doctors/Receptionists** can't access admin portal

---

## 🐛 Issues?

### Can't log in as admin?

Check database: `SELECT * FROM users WHERE role = 'admin';`

### Practices table empty?

Re-run migration or insert manually (see ADMIN_PORTAL_COMPLETE.md)

### Settings not loading?

Check: `SELECT * FROM system_settings;` should have 5 rows

---

## 📚 Full Documentation

See `ADMIN_PORTAL_COMPLETE.md` for:

- Complete feature list
- Database schema details
- Testing checklist
- Troubleshooting guide
- Future enhancements

---

**Ready to test!** 🎉

Don't forget: **Test everything before pushing to GitHub!**
