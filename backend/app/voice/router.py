# backend/app/voice/router.py
import os
import tempfile
import subprocess
import logging
from typing import Optional

import boto3
import requests
from fastapi import APIRouter, HTTPException, UploadFile, File, Query

log = logging.getLogger("clinic-os.voice")
router = APIRouter()

# ---------- ENV ----------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
AWS_REGION = os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION", "us-west-2")
AUDIO_BUCKET_NAME = os.getenv("AUDIO_BUCKET_NAME", "medmitra-audio-bucket")

# ---------- AWS S3 ----------
s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

def presign_s3(key: str, expires: int = 3600) -> Optional[str]:
    try:
        return s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": AUDIO_BUCKET_NAME, "Key": key},
            ExpiresIn=expires,
        )
    except Exception as e:
        log.exception("presign failed: %s", e)
        return None


# =========================================================
# 1) TRANSCRIBE (Whisper: /v1/audio/transcriptions)
# =========================================================
@router.post("/transcribe-audio")
async def transcribe_audio(file: UploadFile = File(...), lang: Optional[str] = Query(None)):
    """
    POST /api/transcribe-audio  (mounted with prefix in main.py)
    Form: file=<audio/wav>, optional ?lang=hi|en|bn|...
    """
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="Missing OPENAI_API_KEY")
    log.info("STT: received %s (%s), lang=%s", file.filename, file.content_type, lang)

    # persist to a temp file
    suffix = os.path.splitext(file.filename or "")[1].lower() or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        url = "https://api.openai.com/v1/audio/transcriptions"
        headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}

        with open(tmp_path, "rb") as fh:
            files = {
                "file": (os.path.basename(tmp_path), fh, file.content_type or "audio/wav"),
                "model": (None, "whisper-1"),
                "temperature": (None, "0"),
            }
            if lang:
                files["language"] = (None, lang)

            resp = requests.post(url, headers=headers, files=files, timeout=60)

        if resp.status_code != 200:
            log.error("Whisper error %s: %s", resp.status_code, resp.text[:500])
            raise HTTPException(status_code=500, detail=f"Whisper API error: {resp.text}")

        data = resp.json()
        text = (data.get("text") or "").strip()
        log.info("STT: %d chars", len(text))
        return {"transcript": text}

    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass


# =========================================================
# 2) AUDIO UPLOAD (optional archival)
# =========================================================
@router.post("/audio-upload")
async def upload_audio_chunk(
    session_id: str = Query(..., min_length=8),
    audio: UploadFile = File(...),
    seq: Optional[int] = Query(None),
):
    """
    POST /api/audio-upload?session_id=...&seq=N
    Stores chunk at audio/<session_id>/seg_N.wav or <session_id>.wav (no seq).
    """
    try:
        data = await audio.read()
        key = f"audio/{session_id}/seg_{int(seq):04d}.wav" if seq is not None else f"{session_id}.wav"
        s3_client.put_object(
            Bucket=AUDIO_BUCKET_NAME,
            Key=key,
            Body=data,
            ContentType="audio/wav",
            ACL="private",
        )
        url = presign_s3(key)
        log.info("AUDIO: saved %s", key)
        return {"audio_url": url}
    except Exception as e:
        log.exception("audio upload failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Error saving audio: {e}")


# =========================================================
# 3) (Optional) STITCH: concat seg_* into one WAV
# =========================================================
@router.post("/audio-stitch")
def stitch_session_audio(session_id: str = Query(..., min_length=8)):
    """
    POST /api/audio-stitch?session_id=...
    Concatenate s3://<bucket>/audio/<session_id>/seg_*.wav into <session_id>.wav
    Requires ffmpeg.
    """
    resp = s3_client.list_objects_v2(Bucket=AUDIO_BUCKET_NAME, Prefix=f"audio/{session_id}/seg_")
    parts = sorted([o["Key"] for o in resp.get("Contents", [])]) if resp.get("Contents") else []
    if not parts:
        raise HTTPException(status_code=404, detail="No segments found for this session")

    with tempfile.TemporaryDirectory() as td:
        list_txt = os.path.join(td, "concat.txt")
        local_files = []
        for k in parts:
            local = os.path.join(td, os.path.basename(k))
            body = s3_client.get_object(Bucket=AUDIO_BUCKET_NAME, Key=k)["Body"].read()
            with open(local, "wb") as f:
                f.write(body)
            local_files.append(local)
        with open(list_txt, "w") as f:
            for p in local_files:
                f.write(f"file '{p}'\n")

        out_path = os.path.join(td, f"{session_id}.wav")
        try:
            subprocess.check_call(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", list_txt, "-c", "copy", out_path])
        except FileNotFoundError:
            raise HTTPException(status_code=500, detail="ffmpeg not found on server")

        with open(out_path, "rb") as fh:
            final_key = f"{session_id}.wav"
            s3_client.put_object(
                Bucket=AUDIO_BUCKET_NAME,
                Key=final_key,
                Body=fh.read(),
                ContentType="audio/wav",
                ACL="private",
            )

    log.info("AUDIO: stitched %d segments -> %s", len(parts), final_key)
    return {"audio_url": presign_s3(final_key), "segments": len(parts)}
