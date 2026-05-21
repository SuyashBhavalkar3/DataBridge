import random
import datetime
from sqlalchemy.orm import sessionmaker

# Import from local database module
from database import engine, Base
from models import Customer, Product, Order

def seed_products(session):
    products_list = [
        {"product_id": "PROD-001", "product_name": "Wireless Noise-Canceling Headphones", "category": "Electronics", "supplier_id": "SUP-101"},
        {"product_id": "PROD-002", "product_name": "Ergonomic Office Chair", "category": "Furniture", "supplier_id": "SUP-102"},
        {"product_id": "PROD-003", "product_name": "Stainless Steel Water Bottle", "category": "Home & Kitchen", "supplier_id": "SUP-103"},
        {"product_id": "PROD-004", "product_name": "Running Shoes", "category": "Apparel", "supplier_id": "SUP-104"},
        {"product_id": "PROD-005", "product_name": "Mechanical Keyboard", "category": "Electronics", "supplier_id": "SUP-101"},
        {"product_id": "PROD-006", "product_name": "Organic Cotton T-Shirt", "category": "Apparel", "supplier_id": "SUP-104"},
        {"product_id": "PROD-007", "product_name": "Smart Fitness Tracker", "category": "Electronics", "supplier_id": "SUP-105"},
        {"product_id": "PROD-008", "product_name": "Ceramic Coffee Mug", "category": "Home & Kitchen", "supplier_id": "SUP-103"},
        {"product_id": "PROD-009", "product_name": "Yoga Mat", "category": "Fitness", "supplier_id": "SUP-105"},
        {"product_id": "PROD-010", "product_name": "LED Desk Lamp", "category": "Home & Kitchen", "supplier_id": "SUP-102"}
    ]
    
    existing = session.query(Product).count()
    if existing > 0:
        print("Products already seeded.")
        return [p.product_id for p in session.query(Product).all()]
        
    products = [Product(**p) for p in products_list]
    session.add_all(products)
    session.commit()
    print(f"Seeded {len(products)} products.")
    return [p.product_id for p in products]

def seed_customers(session):
    countries = ["United States", "India", "Canada", "Germany", "United Kingdom", "Australia"]
    existing = session.query(Customer).count()
    if existing > 0:
        print("Customers already seeded.")
        return [c.customer_id for c in session.query(Customer).all()]

    customers = []
    for i in range(1, 51):
        cust_id = f"CUST-{1000 + i}"
        signup = datetime.date.today() - datetime.timedelta(days=random.randint(30, 365))
        cust = Customer(
            customer_id=cust_id,
            signup_date=signup,
            country=random.choice(countries),
            age=random.randint(18, 70)
        )
        customers.append(cust)
        
    session.add_all(customers)
    session.commit()
    print(f"Seeded {len(customers)} customers.")
    return [c.customer_id for c in customers]

def seed_orders(session, product_ids, customer_ids, num_days=30):
    print("Generating order history...")
    session.query(Order).delete()
    session.commit()
    
    orders = []
    order_counter = 1
    start_date = datetime.datetime.now() - datetime.timedelta(days=num_days)
    
    prices = {
        "PROD-001": 199.99,
        "PROD-002": 249.99,
        "PROD-003": 24.99,
        "PROD-004": 89.99,
        "PROD-005": 129.99,
        "PROD-006": 19.99,
        "PROD-007": 79.99,
        "PROD-008": 14.99,
        "PROD-009": 39.99,
        "PROD-010": 34.99
    }
    
    for day in range(num_days + 1):
        current_date = start_date + datetime.timedelta(days=day)
        num_orders = random.randint(5, 15)
        
        for _ in range(num_orders):
            order_id = f"ORD-{10000 + order_counter}"
            product_id = random.choice(product_ids)
            customer_id = random.choice(customer_ids)
            
            order_time = current_date.replace(
                hour=random.randint(0, 23),
                minute=random.randint(0, 59),
                second=random.randint(0, 59)
            )
            
            quantity = random.randint(1, 4)
            unit_price = prices[product_id]
            payment_status = random.choice(["completed", "completed", "completed", "pending", "failed"])
            
            # Planting validation test issues (5% of data combined)
            rand_val = random.random()
            if rand_val < 0.02:
                quantity = -1 * random.randint(1, 5) # Negative qty
            elif rand_val < 0.04:
                unit_price = None # Null unit price
            elif rand_val < 0.05:
                customer_id = None # Orphan order
                
            order = Order(
                order_id=order_id,
                customer_id=customer_id,
                product_id=product_id,
                order_date=order_time,
                quantity=quantity,
                unit_price=unit_price,
                payment_status=payment_status
            )
            orders.append(order)
            order_counter += 1
            
    session.add_all(orders)
    session.commit()
    print(f"Generated {len(orders)} total orders across {num_days} days.")

if __name__ == "__main__":
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        prod_ids = seed_products(session)
        cust_ids = seed_customers(session)
        seed_orders(session, prod_ids, cust_ids)
        print("Local database seeding finished successfully!")
    except Exception as e:
        session.rollback()
        print(f"Error seeding database: {e}")
    finally:
        session.close()
