from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models import user, login_log, scan_history, breach_alert
from routers import auth, analyze, breach, history, admin

# Create all DB tables
user.Base.metadata.create_all(bind=engine)
login_log.Base.metadata.create_all(bind=engine)
scan_history.Base.metadata.create_all(bind=engine)
breach_alert.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title       = "SecurePass API",
    description = "Password Strength Analyzer & Breach Checker",
    version     = "2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["http://localhost:3000"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(analyze.router)
app.include_router(breach.router)
app.include_router(history.router)
app.include_router(admin.router)


@app.get("/")
def home():
    return {
        "status":  "✅ SecurePass API is running",
        "version": "2.0.0 — FastAPI",
        "docs":    "http://localhost:8000/docs",
    }


@app.get("/api/health")
def health():
    from database import SessionLocal
    from models.user import User
    from models.scan_history import ScanHistory
    from models.login_log import LoginLog
    from models.breach_alert import BreachAlert
    db = SessionLocal()
    try:
        return {
            "api":      "✅ Running",
            "database": "✅ Connected",
            "counts": {
                "users":         db.query(User).count(),
                "scans":         db.query(ScanHistory).count(),
                "login_logs":    db.query(LoginLog).count(),
                "breach_alerts": db.query(BreachAlert).count(),
            }
        }
    except Exception as e:
        return {"api": "✅ Running", "database": f"❌ {str(e)}"}
    finally:
        db.close()
