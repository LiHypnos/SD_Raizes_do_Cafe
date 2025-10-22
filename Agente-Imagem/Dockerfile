# Dockerfile do Agente de Imagem
FROM node:20

# Diretório de trabalho
WORKDIR /app

# Copia arquivos do projeto
COPY . .

# Instala Python, venv, pip e bibliotecas de sistema necessárias
RUN apt-get update && apt-get install -y \
    python3 python3-venv python3-pip \
    libgl1 libglib2.0-0 && \
    python3 -m venv /opt/venv

# Ajusta PATH para usar o venv
ENV PATH="/opt/venv/bin:$PATH"

# Instala todas as dependências Python de uma vez
RUN pip install --no-cache-dir numpy opencv-python pillow matplotlib scikit-image

# Instala dependências Node (express, multer, axios)
RUN npm install

# Expõe porta
EXPOSE 5001

# Comando de inicialização
CMD ["node", "index.js"]
