from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator

default_args = {
    'owner': 'data_engineering',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'databridge_daily',
    default_args=default_args,
    description='Automated daily batch ETL monitoring pipeline using dbt and PostgreSQL',
    schedule_interval='@daily',
    start_date=datetime(2023, 1, 1),
    catchup=False,
) as dag:

    # 1. Seed raw data (representing extraction of today's operational data)
    seed_raw_data = BashOperator(
        task_id='seed_raw_data',
        bash_command='python /opt/airflow/server/generate_mock_data.py',
    )

    # 2. Run dbt transformation models (Silver/Gold Layers)
    dbt_run = BashOperator(
        task_id='dbt_run',
        bash_command='dbt run --project-dir /opt/airflow/dbt --profiles-dir /opt/airflow/dbt',
    )

    # 3. Run dbt quality tests (Data Validation Layer)
    dbt_test = BashOperator(
        task_id='dbt_test',
        bash_command='dbt test --project-dir /opt/airflow/dbt --profiles-dir /opt/airflow/dbt',
    )

    seed_raw_data >> dbt_run >> dbt_test
