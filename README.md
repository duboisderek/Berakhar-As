# User Account Reset System

## 🎯 Project Overview

A complete user management application with account reset functionality, featuring:
- User registration with email validation
- Secure login/logout with bcrypt password hashing
- Account testing dashboard
- Reset all users functionality
- Clean, modern UI with animations

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express
- **Database**: SQLite3
- **Authentication**: bcrypt for password hashing
- **UI**: Lucide React icons, responsive design

## 🔧 Installation & Setup

```bash
# Install dependencies
npm install

# Start both frontend and backend
npm run dev:full

# Or run separately:
# Backend only
npm run server

# Frontend only  
npm run dev
```

## 🏗️ Project Structure

```
├── src/
│   └── components/
│       └── UserManagement.tsx    # Main UI component
├── server/
│   ├── index.js                  # Express server
│   └── users.db                  # SQLite database (auto-created)
└── package.json
```

## 🔐 Authentication System

### Security Features:
- **bcrypt Password Hashing**: 12 salt rounds for maximum security
- **Email Validation**: Proper email format validation
- **Alphanumeric Passwords**: Simple 6-20 character passwords (no special chars)
- **SQLite Database**: Lightweight, file-based database
- **Input Validation**: Server-side validation for all inputs

### Password Requirements:
- 6-20 characters
- Alphanumeric only (a-z, A-Z, 0-9)
- No special characters required

## 🎯 Core Features

### 1. **User Registration**
- Email format validation
- Password strength checking
- Duplicate email prevention
- Instant feedback on form submission

### 2. **User Login**
- Secure bcrypt password verification
- Session management
- Login timestamp tracking
- Automatic form validation

### 3. **User Dashboard**
- View all registered users
- Real-time user statistics
- Individual user deletion
- Current user highlighting

### 4. **Reset Functionality**
- **Reset All Users**: Complete database cleanup
- **Individual User Deletion**: Remove specific users
- **Confirmation Dialogs**: Prevent accidental deletions
- **Automatic Logout**: When current user is deleted

## 🎨 UI Features

- **Responsive Design**: Works on all screen sizes
- **Smooth Animations**: Framer Motion for polished interactions
- **Tab Navigation**: Easy switching between functions
- **Real-time Feedback**: Instant success/error messages
- **Password Visibility Toggle**: Show/hide password fields
- **Loading States**: Visual feedback during operations
- **Modern Icons**: Lucide React icon library

## 🔌 API Endpoints

### User Management
- `GET /api/users` - Get all users
- `POST /api/register` - Create new account
- `POST /api/login` - User login
- `DELETE /api/users/reset` - Reset all users
- `DELETE /api/users/:id` - Delete specific user
- `GET /api/health` - Server health check

## 🗄️ Database Schema

```bash
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);
```

## 🚀 Getting Started

1. **Clone and Install**:
   ```bash
   git clone <repository>
   cd user-account-reset-system
   npm install
   ```

2. **Start the Application**:
   ```bash
   npm run dev:full
   ```

3. **Access the App**:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

4. **Test the Features**:
   - Create accounts with email@domain.com format
   - Use alphanumeric passwords (6-20 chars)
   - Login and test the dashboard
   - Try the reset functionality

## 🧪 Testing the System

### Sample Test Accounts:
```
Email: test@example.com
Password: test123

Email: admin@company.com  
Password: admin456

Email: user@domain.org
Password: mypass789
```

## 🔧 Development Notes

- **Database Location**: `server/users.db` (auto-created)
- **CORS Enabled**: Frontend can communicate with backend
- **Error Handling**: Comprehensive error messages
- **Validation**: Both client and server-side validation
- **Security**: Passwords are never stored in plain text

## 📝 License

MIT License - Feel free to use and modify as needed.