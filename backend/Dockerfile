FROM python:3.12-slim

WORKDIR /srv/backend/app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /srv/backend/requirements.txt
RUN pip install --no-cache-dir -r /srv/backend/requirements.txt

ENV PYTHONPATH=/srv/backend/app

COPY ./app /srv/backend/app
COPY ./scripts /srv/backend/scripts
COPY ./alembic /srv/backend/alembic
COPY ./alembic.ini /srv/backend/alembic.ini
COPY ./docker-entrypoint.sh /srv/backend/docker-entrypoint.sh
RUN chmod +x /srv/backend/docker-entrypoint.sh

EXPOSE 8000
CMD ["/srv/backend/docker-entrypoint.sh"]
