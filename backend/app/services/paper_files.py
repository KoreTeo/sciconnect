import os

from fastapi import HTTPException, UploadFile

from config import settings
from services.storage import save_upload_file, unique_upload_name

PAPER_UPLOAD_DIR = settings.UPLOAD_DIR
MAX_PAPER_PDF_BYTES = 25 * 1024 * 1024


async def save_paper_pdf(file: UploadFile) -> tuple[str, str]:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Только PDF файлы разрешены")

    unique_filename = unique_upload_name(prefix="paper", extension=".pdf")
    await save_upload_file(file, PAPER_UPLOAD_DIR, unique_filename, max_bytes=MAX_PAPER_PDF_BYTES)
    return f"/uploads/{unique_filename}", file.filename
