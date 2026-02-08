import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-anon-key")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "your-service-key")

JWT_SECRET = os.getenv("JWT_SECRET", "your-jwt-secret")
JWT_ALGORITHM = "HS256"

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:password@localhost:5432/bvmt"
)

class UserRole:
    INVESTOR = "investor"
    CMF_INSPECTOR = "cmf_inspector"


ALLOWED_ORIGINS = ["*"]
PROJECT_NAME = "KANZ - AI Trading Assistant"

BASE_DIR = Path(__file__).resolve().parents[3]
DATASET_DIR = BASE_DIR / "cahier-de-charges-code_lab2.0-main"
ML_MODELS_DIR = BASE_DIR / "ml" / "models"
