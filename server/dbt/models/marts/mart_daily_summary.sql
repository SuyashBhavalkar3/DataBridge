with orders as (
    select * from {{ ref('stg_orders') }}
)

select
    cast(order_date as date) as order_day,
    count(distinct order_id) as total_orders,
    sum(case when payment_status = 'completed' then 1 else 0 end) as successful_orders,
    sum(case when payment_status = 'failed' then 1 else 0 end) as failed_orders,
    sum(case when payment_status = 'completed' then quantity else 0 end) as units_sold,
    sum(case when payment_status = 'completed' then total_amount else 0 end) as total_revenue,
    avg(case when payment_status = 'completed' then total_amount else null end) as avg_order_value
from orders
group by 1
order by 1 desc
