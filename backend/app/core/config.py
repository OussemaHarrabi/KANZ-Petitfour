import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-anon-key")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "your-service-key")

JWT_SECRET = os.getenv("JWT_SECRET", "your-jwt-secret")
JWT_ALGORITHM = "HS256"

# Use SQLite by default for easy local development (no credentials needed)
# Set DATABASE_URL env var to use PostgreSQL/Supabase in production
DATABASE_URL = os.getenv(
    "DATABASE_URL", "sqlite:///./kanz.db"
)

class UserRole:
    INVESTOR = "investor"
    CMF_INSPECTOR = "cmf_inspector"


ALLOWED_ORIGINS = ["*"]
PROJECT_NAME = "KANZ - AI Trading Assistant"

BASE_DIR = Path(__file__).resolve().parents[3]
DATASET_DIR = BASE_DIR / "cahier-de-charges-code_lab2.0-main"
ML_MODELS_DIR = BASE_DIR / "ml" / "models"
