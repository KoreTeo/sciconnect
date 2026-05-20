from fastapi import HTTPException


def error_payload(*, code: str, message: str) -> dict[str, str]:
    return {"code": code, "message": message}


def coded_http_exception(*, status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail=error_payload(code=code, message=message))

