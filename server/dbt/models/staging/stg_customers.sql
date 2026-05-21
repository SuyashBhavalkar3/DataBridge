with source as (
    select * from {{ source('ecom_raw', 'source_customers') }}
),

renamed as (
    select
        customer_id,
        signup_date,
        country,
        age
    from source
)

select * from renamed
