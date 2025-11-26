# Dockerfile do Agente LLM
FROM node:20

WORKDIR /app

COPY . .

# Instala dependências Node
RUN npm install

# Expõe porta
EXPOSE 5002

# Comando de inicialização
CMD ["node", "index.js"]
