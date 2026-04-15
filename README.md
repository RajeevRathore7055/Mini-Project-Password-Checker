# SecurePass — Password Strength Analyzer & Breach Checker

## Tech Stack
- **Frontend** : React 18 + Axios + React Router DOM
- **Backend**  : Python FastAPI + SQLAlchemy + Uvicorn
- **Database** : MySQL 8.0
- **ML Model** : Scikit-learn Logistic Regression
- **Breach**   : Have I Been Pwned API (k-anonymity)
- **Auth**     : JWT (python-jose) + bcrypt (passlib)

---

## Folder Structure

```
SecurePass/
├── backend/
│   ├── main.py              ← FastAPI entry point
│   ├── database.py          ← SQLAlchemy + DB connection
│   ├── config.py            ← Config constants
│   ├── requirements.txt     ← Python dependencies
│   ├── .env                 ← Environment variables
│   ├── models/              ← SQLAlchemy ORM models
│   │   ├── user.py
│   │   ├── login_log.py
│   │   └── scan_history.py
│   ├── routers/             ← FastAPI route handlers
│   │   ├── auth.py          ← /api/auth/register, /login
│   │   ├── analyze.py       ← /api/analyze
│   │   ├── breach.py        ← /api/breach/check
│   │   ├── history.py       ← /api/history
│   │   └── admin.py         ← /api/admin/*
│   ├── schemas/             ← Pydantic validation models
│   │   ├── auth_schema.py
│   │   ├── analyze_schema.py
│   │   └── admin_schema.py
│   ├── services/            ← Business logic
│   │   ├── password_service.py
│   │   └── breach_service.py
│   ├── ml/                  ← ML model
│   │   ├── strength_model.py
│   │   └── train_model.py
│   └── utils/
│       └── auth_utils.py    ← JWT + bcrypt helpers
├── frontend/
│   ├── public/index.html
│   └── src/
│       ├── App.js
│       ├── index.css
│       ├── context/AuthContext.js
│       ├── services/api.js
│       ├── components/Navbar.js
│       └── pages/
│           ├── Register.js
│           ├── Login.js
│           ├── Analyzer.js
│           ├── History.js
│           └── AdminDash.js
├── database/
│   ├── schema.sql
│   └── alter_roles.sql
├── start.bat
└── README.md
```

---

## Setup Instructions (Windows)

### Step 1 — MySQL Setup
```cmd
mysql -u root -p < database\schema.sql
mysql -u root -p < database\alter_roles.sql
```
Update `.env` with your MySQL password.

### Step 2 — Backend Setup
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python ml\train_model.py
uvicorn main:app --reload --port 8000
```
Backend: http://localhost:8000
API Docs: http://localhost:8000/docs

### Step 3 — Frontend Setup (new terminal)
```cmd
cd frontend
npm install
npm start
```
Frontend: http://localhost:3000

### One-Click Start
```
Double-click start.bat
```

---

## Default Accounts

| Name | Password | Role |
|------|----------|------|
| Super Admin | Admin@123 | superadmin |
| Admin | Admin@123 | admin |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | None | Register user |
| POST | /api/auth/login | None | Login |
| GET | /api/auth/me | JWT | Current user |
| POST | /api/analyze | Optional | Analyze password |
| POST | /api/breach/check | Optional | HIBP check |
| GET | /api/history | JWT | Scan history |
| DELETE | /api/history/:id | JWT | Delete scan |
| GET | /api/admin/stats | Admin | Dashboard stats |
| GET | /api/admin/users | Admin | All users |
| POST | /api/admin/users/add | Admin | Add user |
| DELETE | /api/admin/users/:id | Admin | Delete user |
| PUT | /api/admin/users/:id/ban | Admin | Ban/unban |
| PUT | /api/admin/users/:id/role | Admin | Change role |
| GET | /api/admin/users/:id/scans | Admin | User scans |
| GET | /api/admin/security | Admin | Security logs |
| GET | /api/health | None | Health check |

---

## Security
- Passwords stored with **bcrypt** — never plain text
- **JWT tokens** expire in 24 hours
- **k-Anonymity**: only 5-char SHA-1 prefix sent to HIBP
- **Rate limiting**: 5 login attempts/min/IP
- **CORS**: only localhost:3000 allowed
