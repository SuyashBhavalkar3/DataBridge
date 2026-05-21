with source as (
    select * from {{ source('ecom_raw', 'source_products') }}
),

renamed as (
    select
        product_id,
        product_name,
        category,
        supplier_id
    from source
)

select * from renamed
