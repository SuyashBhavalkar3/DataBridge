with source as (
    select * from {{ source('ecom_raw', 'source_orders') }}
),

cleaned as (
    select
        order_id,
        customer_id,
        product_id,
        order_date,
        quantity,
        unit_price,
        -- Safely compute total amount
        coalesce(quantity, 0) * coalesce(unit_price, 0) as total_amount,
        payment_status
    from source
    -- Data quality filters (Silver layer cleansing)
    where quantity > 0 
      and unit_price is not null
      and customer_id is not null
)

select * from cleaned
