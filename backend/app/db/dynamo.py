import os
import boto3

AWS_REGION = os.getenv("AWS_REGION", "us-west-2")
DDB_TABLE_PATIENTS = os.getenv("DDB_TABLE_PATIENTS", "medmitra_patients")

ddb = boto3.resource("dynamodb", region_name=AWS_REGION)
patients_table = ddb.Table(DDB_TABLE_PATIENTS)


DDB_TABLE_APPOINTMENTS = (
    os.getenv("DDB_TABLE_APPOINTMENTS") 
    or "medmitra-appointments"   # <- default to the Lambda writer table
)

DYNAMODB_ENDPOINT = (os.getenv("DYNAMODB_LOCAL_URL") or "").strip() or None

def _ddb():
    kw = {"region_name": AWS_REGION}
    if DYNAMODB_ENDPOINT:
        kw["endpoint_url"] = DYNAMODB_ENDPOINT
    return boto3.resource("dynamodb", **kw)

def appointments_table():
    return _ddb().Table(DDB_TABLE_APPOINTMENTS)