from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import requests
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from sqlalchemy.exc import SQLAlchemyError

# FastAPI Setup
app = FastAPI()

origins = [
    "http://localhost:3000",  # Replace with your React app's URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SQLAlchemy setup
DATABASE_URL = "sqlite:///./drumming_posture.db"
engine = create_engine(DATABASE_URL)  # Removed connect_args for production
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models for Database
class DrummingData(Base):
    __tablename__ = "drumming_data"
    id = Column(Integer, primary_key=True, index=True)
    session_date = Column(DateTime, default=datetime.datetime.utcnow)
    duration_minutes = Column(Integer)
    tempo_bpm = Column(Integer)
    notes = Column(String, nullable=True)

class PostureData(Base):
    __tablename__ = "posture_data"
    id = Column(Integer, primary_key=True, index=True)
    posture_score = Column(Float)
    feedback = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models for request/response validation
class DrummingDataIn(BaseModel):
    session_date: datetime.datetime
    duration_minutes: int
    tempo_bpm: int
    notes: Optional[str] = None

class DrummingDataOut(DrummingDataIn): # Separate model for output
    id: int

class PostureDataIn(BaseModel):
    posture_score: float
    feedback: str
    timestamp: datetime.datetime

class PostureDataOut(PostureDataIn): # Separate model for output
    id: int

# Posture API Integration (replace with actual posture API endpoint)
POSTURE_API_URL = "YOUR_POSTURE_API_ENDPOINT"  # Replace with actual URL

def get_posture_data(image_url: str):
    """Fetches posture data from an external API."""
    try:
        response = requests.post(POSTURE_API_URL, json={"image_url": image_url})  # Adjust as needed
        response.raise_for_status()
        return PostureDataIn(**response.json())
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error connecting to posture API: {e}")
    except KeyError:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Posture API response malformed.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")

# Dependency for getting the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# API Endpoints

@app.post("/drumming_data/", response_model=DrummingDataOut, status_code=status.HTTP_201_CREATED)
async def create_drumming_data(drumming_data: DrummingDataIn, db: Session = Depends(get_db)):
    """Stores drumming session data."""
    db_drumming_data = DrummingData(**drumming_data.dict())
    try:
        db.add(db_drumming_data)
        db.commit()
        db.refresh(db_drumming_data)
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {str(e)}")
    return db_drumming_data

@app.get("/drumming_data/", response_model=List[DrummingDataOut])
async def read_drumming_data(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """Retrieves stored drumming session data with pagination."""
    drumming_data = db.query(DrummingData).offset(skip).limit(limit).all()
    return drumming_data

@app.post("/posture_check/", response_model=PostureDataOut, status_code=status.HTTP_201_CREATED)
async def check_posture(image_url: str, db: Session = Depends(get_db)):
    """Checks posture and stores data."""
    posture_data = get_posture_data(image_url)
    if not posture_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image or posture API error.")
    
    # Add posture feedback based on the score from PoseNet
    feedback = "Good posture" if posture_data.posture_score >= 5 else "Poor posture"
    posture_data.feedback = feedback  # Update feedback to be returned

    db_posture_data = PostureData(**posture_data.dict())
    try:
        db.add(db_posture_data)
        db.commit()
        db.refresh(db_posture_data)
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {str(e)}")
    return db_posture_data

@app.get("/posture_data/", response_model=List[PostureDataOut])
async def read_posture_data(user_id: str = None, skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """Retrieves stored posture data with pagination and optional user_id filtering."""
    query = db.query(PostureData).offset(skip).limit(limit)
    if user_id:
        query = query.filter(PostureData.user_id == user_id)  # Filter by user_id if provided
    posture_data = query.all()
    return posture_data

# Dummy Posture API for testing
@app.post("/dummy_posture_api/", response_model=PostureDataOut)
async def dummy_posture_api(image_url: str):
    """Dummy posture API for testing."""
    import random
    score = random.uniform(0, 10)
    feedback = "Good posture" if score > 5 else "Poor posture"
    return PostureDataOut(posture_score=score, feedback=feedback, timestamp=datetime.datetime.now(), id=random.randint(1, 100))