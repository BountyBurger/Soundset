import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Use environment variables or defaults
    DBMS_PATH = os.environ.get('DBMS_PATH')
    DB_REPO_PATH = os.environ.get('DB_REPO_PATH')
    YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY')
    TOKEN_LIFESPAN = int(os.environ.get('TOKEN_LIFESPAN'))
    
    # Ensure db_repo exists
    if DB_REPO_PATH and not os.path.exists(DB_REPO_PATH):
        os.makedirs(DB_REPO_PATH)
