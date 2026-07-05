FROM python:3.9-slim

WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente, base de datos y archivos estáticos
COPY . .

# Exponer el puerto por defecto
EXPOSE 8080

# Iniciar la aplicación FastAPI vinculando al puerto asignado por Cloud Run ($PORT)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
