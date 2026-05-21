import datetime
from sqlalchemy import Column, String, Integer, Numeric, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Customer(Base):
    __tablename__ = 'source_customers'

    customer_id = Column(String(50), primary_key=True)
    signup_date = Column(Date, nullable=False)
    country = Column(String(50), nullable=False)
    age = Column(Integer, nullable=True)

    orders = relationship("Order", back_populates="customer")

    def __repr__(self):
        return f"<Customer(id={self.customer_id}, country={self.country})>"


class Product(Base):
    __tablename__ = 'source_products'

    product_id = Column(String(50), primary_key=True)
    product_name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    supplier_id = Column(String(50), nullable=True)

    orders = relationship("Order", back_populates="product")

    def __repr__(self):
        return f"<Product(id={self.product_id}, name={self.product_name})>"


class Order(Base):
    __tablename__ = 'source_orders'

    order_id = Column(String(50), primary_key=True)
    customer_id = Column(String(50), ForeignKey('source_customers.customer_id'), nullable=True)
    product_id = Column(String(50), ForeignKey('source_products.product_id'), nullable=True)
    order_date = Column(DateTime, default=datetime.datetime.utcnow)
    quantity = Column(Integer, nullable=True)
    unit_price = Column(Numeric(10, 2), nullable=True)
    payment_status = Column(String(20), nullable=False)

    customer = relationship("Customer", back_populates="orders")
    product = relationship("Product", back_populates="orders")

    def __repr__(self):
        return f"<Order(id={self.order_id}, qty={self.quantity}, price={self.unit_price})>"
