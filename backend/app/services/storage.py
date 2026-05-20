import os
import uuid

from fastapi import HTTPException, UploadFile


def unique_upload_name(*, prefix: str, extension: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}{extension}"


async def save_upload_file(file: UploadFile, destination_dir: str, filename: str, max_bytes: int | None = None) -> int:
    os.makedirs(destination_dir, exist_ok=True)
    file_path = os.path.join(destination_dir, filename)
    try:
        size = 0
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if max_bytes is not None and size > max_bytes:
                    buffer.close()
                    os.remove(file_path)
                    raise HTTPException(status_code=400, detail=f"Файл слишком большой (макс. {max_bytes // (1024 * 1024)} МБ)")
                buffer.write(chunk)
        return size
    except HTTPException:
        raise
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"Ошибка сохранения: {exc}") from exc
