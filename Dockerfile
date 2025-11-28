FROM python:3.11-slim

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000

CMD ["python", "server.py"]

# Build from parent dir with:
# docker build -f Dockerfile :v1 .
