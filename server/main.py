# DataBridge API Gateway main entrypoint
import os
import datetime
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, Date

# Import our database modules
from database import get_db, engine
from models import Order, Product, Customer

load_dotenv_success = False
try:
    from dotenv import load_dotenv
    load_dotenv()
    load_dotenv_success = True
except ImportError:
    pass

API_KEY = os.getenv("API_KEY", "databridge_secret_key_123")

app = FastAPI(
    title="DataBridge API Gateway",
    description="FastAPI gateway managing pipeline triggers and querying e-commerce analytics.",
    version="1.0"
)

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory variable to track manual runs for demo fallback
simulated_runs = []

# Dependency to check API Key
async def verify_api_key(x_api_key: str = Header(..., alias="X-API-Key")):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API Key")
    return x_api_key

@app.get("/health")
def get_health(db: Session = Depends(get_db)):
    try:
        # Check DB connection
        db.execute(func.now())
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
        
    last_run = "Never"
    if len(simulated_runs) > 0:
        last_run = simulated_runs[-1]["triggered_at"].strftime("%Y-%m-%d %H:%M:%S")

    return {
        "status": "healthy",
        "database": db_status,
        "last_run_timestamp": last_run,
        "environment": "development"
    }

@app.post("/pipeline/trigger")
def trigger_pipeline(api_key: str = Depends(verify_api_key)):
    # Simulating the DAG trigger
    run_id = f"manual_run_{int(datetime.datetime.utcnow().timestamp())}"
    new_run = {
        "run_id": run_id,
        "status": "running",
        "triggered_at": datetime.datetime.utcnow(),
        "finished_at": None,
        "steps": [
            {"name": "extract_raw_data", "status": "completed"},
            {"name": "validate_raw_data", "status": "completed"},
            {"name": "trigger_dbt_run", "status": "running"},
            {"name": "run_dbt_tests", "status": "pending"}
        ]
    }
    simulated_runs.append(new_run)
    return {"message": "Pipeline triggered successfully", "run_id": run_id, "status": "running"}

@app.get("/pipeline/status")
def get_pipeline_status(api_key: str = Depends(verify_api_key)):
    if not simulated_runs:
        return {
            "status": "success",
            "run_id": "scheduled_daily_run_latest",
            "triggered_at": (datetime.datetime.utcnow() - datetime.timedelta(hours=6)).strftime("%Y-%m-%d %H:%M:%S"),
            "finished_at": (datetime.datetime.utcnow() - datetime.timedelta(hours=5, minutes=45)).strftime("%Y-%m-%d %H:%M:%S"),
            "details": "Latest scheduled run completed successfully."
        }
    
    # Update the status of the latest run for demo purposes
    latest = simulated_runs[-1]
    elapsed = (datetime.datetime.utcnow() - latest["triggered_at"]).total_seconds()
    
    if latest["status"] == "running":
        if elapsed > 15: # After 15 seconds, complete it
            latest["status"] = "success"
            latest["finished_at"] = datetime.datetime.utcnow()
            for step in latest["steps"]:
                step["status"] = "completed"
        elif elapsed > 8:
            latest["steps"][2]["status"] = "completed"
            latest["steps"][3]["status"] = "running"
            
    return {
        "status": latest["status"],
        "run_id": latest["run_id"],
        "triggered_at": latest["triggered_at"].strftime("%Y-%m-%d %H:%M:%S"),
        "finished_at": latest["finished_at"].strftime("%Y-%m-%d %H:%M:%S") if latest["finished_at"] else "N/A",
        "steps": latest["steps"]
    }

@app.get("/data/latest")
def get_latest_data(db: Session = Depends(get_db), api_key: str = Depends(verify_api_key)):
    # Fetch summary stats for dashboard
    total_sales = db.query(func.sum(Order.quantity * Order.unit_price)).filter(Order.payment_status == 'completed').scalar() or 0
    total_orders = db.query(Order).count()
    successful_orders = db.query(Order).filter(Order.payment_status == 'completed').count()
    failed_orders = db.query(Order).filter(Order.payment_status == 'failed').count()
    total_customers = db.query(Customer).count()
    total_products = db.query(Product).count()
    
    # Category distribution
    cat_stats = db.query(
        Product.category,
        func.sum(Order.quantity).label("units_sold"),
        func.sum(Order.quantity * Order.unit_price).label("sales")
    ).join(Order, Order.product_id == Product.product_id)\
     .filter(Order.payment_status == 'completed')\
     .group_by(Product.category)\
     .all()
     
    categories = [{"category": row[0], "units_sold": int(row[1] or 0), "sales": float(row[2] or 0)} for row in cat_stats]
    
    # Recent orders
    recent = db.query(Order).order_by(desc(Order.order_date)).limit(10).all()
    recent_orders = [
        {
            "order_id": o.order_id,
            "product_name": o.product.product_name if o.product else "N/A",
            "quantity": o.quantity,
            "total_price": float((o.quantity or 0) * (o.unit_price or 0)),
            "payment_status": o.payment_status,
            "order_date": o.order_date.strftime("%Y-%m-%d %H:%M:%S")
        }
        for o in recent
    ]

    return {
        "summary": {
            "total_sales": float(total_sales),
            "total_orders": total_orders,
            "successful_orders": successful_orders,
            "failed_orders": failed_orders,
            "total_customers": total_customers,
            "total_products": total_products
        },
        "category_performance": categories,
        "recent_orders": recent_orders
    }

@app.get("/data/summary")
def get_data_summary(date: str = Query(..., description="Date format YYYY-MM-DD"), db: Session = Depends(get_db), api_key: str = Depends(verify_api_key)):
    try:
        query_date = datetime.datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
    # Stats for specific day
    day_sales = db.query(func.sum(Order.quantity * Order.unit_price)).filter(
        func.cast(Order.order_date, Date) == query_date,
        Order.payment_status == 'completed'
    ).scalar() or 0
    
    day_orders = db.query(Order).filter(func.cast(Order.order_date, Date) == query_date).count()
    day_success = db.query(Order).filter(
        func.cast(Order.order_date, Date) == query_date,
        Order.payment_status == 'completed'
    ).count()
    
    # Category sales for that day
    cat_sales = db.query(
        Product.category,
        func.sum(Order.quantity * Order.unit_price).label("sales")
    ).join(Order, Order.product_id == Product.product_id)\
     .filter(func.cast(Order.order_date, Date) == query_date, Order.payment_status == 'completed')\
     .group_by(Product.category)\
     .all()
     
    categories = [{"category": row[0], "sales": float(row[1] or 0)} for row in cat_sales]
    
    return {
        "date": date,
        "total_sales": float(day_sales),
        "total_orders": day_orders,
        "successful_orders": day_success,
        "category_sales": categories
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
