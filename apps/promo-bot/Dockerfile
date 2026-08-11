FROM public.ecr.aws/docker/library/python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema (inclui fontes para geração de imagens)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements primeiro para cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fonte
COPY src/ ./src/

# Criar diretórios
RUN mkdir -p /app/data /app/logs

# Comando padrão
# Expor porta web
EXPOSE 8000

# Comando padrão (Web Server + Scheduler)
CMD ["uvicorn", "src.web.app:app", "--host", "0.0.0.0", "--port", "8000"]
