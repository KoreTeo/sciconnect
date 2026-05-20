import csv
import io
from collections.abc import Iterable
from typing import Any

from fastapi.responses import Response, StreamingResponse


def csv_streaming_response(
    headers: list[str],
    rows: Iterable[list[Any]],
    filename: str,
) -> StreamingResponse:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


def csv_text_response(
    headers: list[str],
    rows: Iterable[list[Any]],
) -> Response:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)
    return Response(content=output.getvalue(), media_type="text/csv")
