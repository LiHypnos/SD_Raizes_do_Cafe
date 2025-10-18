# Dockerfile do API Gateway
FROM node:20

WORKDIR /app

COPY . .

# Instala dependências Node
RUN npm install

EXPOSE 5000

CMD ["node", "index.js"]
