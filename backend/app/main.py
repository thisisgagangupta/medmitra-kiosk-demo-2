# import os
# import logging
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from dotenv import load_dotenv

# load_dotenv()

# logging.basicConfig(level=logging.INFO)
# log = logging.getLogger("clinic-os")

# app = FastAPI(title="Clinic OS Backend", version="0.1.0")

# origins = list(filter(None, [
#     os.getenv("FRONTEND_URL", "").strip(),
#     *(os.getenv("CORS_EXTRA", "").split(",")),
#     "http://localhost:5173", "http://127.0.0.1:5173",
#     "http://localhost:8080", "http://127.0.0.1:8080",
# ]))

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[o for o in origins if o],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
#     expose_headers=["*"],
#     max_age=86400,
# )

# @app.get("/healthz")
# def healthz():
#     return {"status": "ok"}

# # Routers
# try:
#     from app.kiosk.walkins import router as walkins_router
#     app.include_router(walkins_router, prefix="/api")
#     log.info("Mounted: /api/kiosk/*")
# except Exception as e:
#     log.exception("Failed to mount kiosk router: %s", e)

# try:
#     from app.kiosk.identify import router as kiosk_identify_router
#     app.include_router(kiosk_identify_router, prefix="/api")
#     log.info("Mounted kiosk identify routes at /api")
# except Exception as e:
#     log.warning("Kiosk identify router not mounted: %s", e)

# # backend/app/main.py  (add inside the Routers section)
# try:
#     from app.appointments.router import router as appt_router
#     app.include_router(appt_router, prefix="/api")
#     log.info("Mounted appointments router at /api")
# except Exception as e:
#     log.exception("Failed to mount appointments router: %s", e)

# try:
#     from app.voice.router import router as voice_router
#     app.include_router(voice_router, prefix="/api")  # <= IMPORTANT
#     log.info("Mounted voice routes at /api (transcribe-audio, audio-upload, audio-stitch)")
# except Exception as e:
#     log.exception("Failed to mount voice router: %s", e)

# try:
#     from app.kiosk.session import router as kiosk_session_router
#     app.include_router(kiosk_session_router, prefix="/api")
#     log.info("Mounted kiosk session routes at /api")
# except Exception as e:
#     log.exception("Failed to mount kiosk session router: %s", e)

# try:
#     from app.billing.razorpay_router import router as rzp_router
#     app.include_router(rzp_router, prefix="/api")
#     log.info("Mounted razorpay billing routes at /api")
# except Exception as e:
#     log.exception("Failed to mount razorpay router: %s", e)

# try:
#     # NEW: attach/merge kiosk payload into an appointment row
#     from app.appointments.kiosk_attach import router as appt_kiosk_router
#     app.include_router(appt_kiosk_router, prefix="/api")
#     log.info("Mounted kiosk appointment attach routes at /api")
# except Exception as e:
#     log.exception("Failed to mount kiosk appointment attach router: %s", e)

# # after other try/except router mounts
# try:
#     from app.appointments.availability import router as availability_router
#     app.include_router(availability_router, prefix="/api")
#     log.info("Mounted appointments availability at /api")
# except Exception as e:
#     log.exception("Failed to mount availability router: %s", e)

# try:
#     from app.appointments.book import router as appt_book_router
#     app.include_router(appt_book_router, prefix="/api")
#     log.info("Mounted appointments booking at /api")
# except Exception as e:
#     log.exception("Failed to mount booking router: %s", e)

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))


# @app.on_event("startup")
# def _log_routes():
#     for r in app.router.routes:
#         m = ",".join(sorted(getattr(r, "methods", [])))
#         log.info(f"ROUTE {m:<12} {getattr(r,'path','')}")








import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("clinic-os")

app = FastAPI(title="Clinic OS Backend", version="0.1.0")

# -------------------------
# CORS (demo-friendly)
# -------------------------
# Accept FRONTEND_URL and CORS_EXTRA=comma,separated,list from env.
raw_origins = list(filter(None, [
    os.getenv("FRONTEND_URL", "").strip(),
    *(o.strip() for o in os.getenv("CORS_EXTRA", "").split(",") if o.strip()),
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:8080", "http://127.0.0.1:8080",
]))

# If no explicit origins provided (typical demo), allow anything without credentials.
# NOTE: FastAPI does not allow allow_origins=["*"] when allow_credentials=True.
if raw_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=raw_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=86400,
    )
    log.info("CORS strict: %s", raw_origins)
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[],
        allow_origin_regex=r".*",
        allow_credentials=False,  # required for wildcard
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=86400,
    )
    log.warning("CORS permissive (demo mode): allow_origin_regex='.*', credentials=FALSE")

# -------------------------
# Health & root
# -------------------------
@app.get("/")
def root():
    return {"name": "Clinic OS Backend", "version": "0.1.0", "status": "ok"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

# -------------------------
# Routers
# -------------------------
def _mount(router_import_path: str, prefix: str, human: str):
    try:
        module_path, obj_name = router_import_path.rsplit(":", 1)
        module = __import__(module_path, fromlist=[obj_name])
        router = getattr(module, obj_name)
        app.include_router(router, prefix=prefix)
        log.info("Mounted %s at %s/*", human, prefix)
    except Exception as e:
        log.exception("Failed to mount %s: %s", human, e)

# kiosk
_mount("app.kiosk.walkins:router", "/api", "kiosk walkins")
_mount("app.kiosk.identify:router", "/api", "kiosk identify")
_mount("app.kiosk.session:router", "/api", "kiosk session")

# appointments
_mount("app.appointments.router:router", "/api", "appointments core")
_mount("app.appointments.availability:router", "/api", "appointments availability")
_mount("app.appointments.book:router", "/api", "appointments booking")
_mount("app.appointments.kiosk_attach:router", "/api", "appointments kiosk attach")

# voice + billing
_mount("app.voice.router:router", "/api", "voice")
_mount("app.billing.razorpay_router:router", "/api", "razorpay billing")

# -------------------------
# On startup: list routes
# -------------------------
@app.on_event("startup")
def _log_routes():
    for r in app.router.routes:
        methods = ",".join(sorted(getattr(r, "methods", [])))
        path = getattr(r, "path", "")
        log.info("ROUTE %-12s %s", methods, path)

# -------------------------
# Entrypoint
# -------------------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "5000"))  # default 5000 for demo hosts
    uvicorn.run(app, host="0.0.0.0", port=port)
