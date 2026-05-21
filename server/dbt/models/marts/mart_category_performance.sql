with orders as (
    select * from {{ ref('stg_orders') }}
),

products as (
    select * from {{ ref('stg_products') }}
)

select
    p.category,
    sum(case when o.payment_status = 'completed' then o.quantity else 0 end) as units_sold,
    sum(case when o.payment_status = 'completed' then o.total_amount else 0 end) as sales
from orders o
join products p on o.product_id = p.product_id
group by 1
order by sales desc
