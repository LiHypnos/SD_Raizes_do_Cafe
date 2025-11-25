#!/bin/bash

echo "🛑 Parando serviços antigos do Docker..."
docker-compose down

echo "🧹 Limpando portas presas (5000 e 5500)..."
# Mata qualquer coisa rodando nas portas 5000 e 5500 para evitar erro "Address already in use"
fuser -k 5000/tcp > /dev/null 2>&1
fuser -k 5500/tcp > /dev/null 2>&1

echo "------------------------------------------------"
echo "🚀 Iniciando o BACKEND (Gateway + Agentes)..."
echo "------------------------------------------------"
# O flag -d (detached) faz ele rodar em segundo plano
docker-compose up -d --build

echo "⏳ Aguardando 15 segundos para os servidores ligarem totalmente..."
sleep 15

echo "------------------------------------------------"
echo "🌐 Iniciando o FRONT END..."
echo "------------------------------------------------"
echo "O site estará disponível na porta 5500."
echo "⚠️  NÃO FECHE ESTE TERMINAL ENQUANTO ESTIVER USANDO!"
echo "Para parar tudo depois, aperte Ctrl+C"
echo "------------------------------------------------"

# Garante que estamos na raiz antes de entrar na pasta
cd "$(dirname "$0")/Front" || { echo "❌ Erro: Pasta 'Front' não encontrada!"; exit 1; }

# Inicia o servidor Python
python3 -m http.server 5500