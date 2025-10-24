import os
import logging
import boto3
from botocore.exceptions import ClientError

log = logging.getLogger("cognito")

AWS_REGION     = os.getenv("AWS_REGION", "us-west-2")
USER_POOL_ID   = os.getenv("COGNITO_USER_POOL_ID")
CLIENT_ID      = os.getenv("COGNITO_CLIENT_ID")
REQUIRED_GROUP = os.getenv("REQUIRED_GROUP", "Patients")

if not USER_POOL_ID or not CLIENT_ID:
    raise RuntimeError("COGNITO_USER_POOL_ID / COGNITO_CLIENT_ID are required")

cognito = boto3.client("cognito-idp", region_name=AWS_REGION)

def list_user_by_phone(e164: str):
    try:
        resp = cognito.list_users(
            UserPoolId=USER_POOL_ID,
            Filter=f'phone_number = "{e164}"',
            Limit=1,
        )
        users = resp.get("Users", [])
        return users[0] if users else None
    except ClientError as e:
        log.warning("list_users failed: %s", e)
        return None

def admin_create_user(username: str, attributes: list[dict]):
    return cognito.admin_create_user(
        UserPoolId=USER_POOL_ID,
        Username=username,
        UserAttributes=attributes,
        MessageAction="SUPPRESS",
    )

def admin_get_user(username: str):
    return cognito.admin_get_user(UserPoolId=USER_POOL_ID, Username=username)

def ensure_group(username: str, group: str = None):
    group = group or REQUIRED_GROUP
    groups = cognito.admin_list_groups_for_user(UserPoolId=USER_POOL_ID, Username=username)
    if group not in [g["GroupName"] for g in groups.get("Groups", [])]:
        cognito.admin_add_user_to_group(UserPoolId=USER_POOL_ID, Username=username, GroupName=group)
