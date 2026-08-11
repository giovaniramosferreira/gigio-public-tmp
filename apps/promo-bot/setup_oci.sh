#!/bin/bash

# Script de Setup para Promo Bot na Oracle Cloud (Ubuntu)
# Uso: chmod +x setup_oci.sh && ./setup_oci.sh

echo "🚀 Iniciando Setup do Servidor Promo Bot..."

# 1. Atualizar sistema
echo "📦 Atualizando pacotes..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Instalar Docker e Docker Compose
echo "🐳 Instalando Docker..."
sudo apt-get install -y docker.io docker-compose-plugin docker-buildx-plugin

# 3. Configurar permissões de usuário (para rodar sem sudo)
echo "👤 Adicionando usuário atual ao grupo docker..."
sudo usermod -aG docker $USER
echo "⚠️ Nota: Você precisará deslogar e logar novamente para o comando 'docker' funcionar sem 'sudo'."
# Ativa no shell atual
newgrp docker << END
  echo "Grupo docker ativado para esta sessão."
END

# 4. Configurar Firewall (iptables) da Oracle
# A Oracle vem com regras restritivas por padrão no iptables.
echo "🔥 Configurando Firewall (iptables) para liberar porta 8000..."

# Verifica se iptables-persistent está instalado
sudo apt-get install -y iptables-persistent netfilter-persistent

# Adiciona regra para liberar porta 8000 TCP (se não existir)
if ! sudo iptables -C INPUT -p tcp --dport 8000 -j ACCEPT 2>/dev/null; then
    # Insere na posição 6 (geralmente antes do REJECT final)
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8000 -j ACCEPT
    echo "✅ Regra adicionada ao iptables."
else
    echo "ℹ️ Regra já existe."
fi

# Salva regras
sudo netfilter-persistent save

# 5. Criar diretório do projeto
mkdir -p ~/promo-bot/data
mkdir -p ~/promo-bot/logs
mkdir -p ~/promo-bot/src

echo "✅ Setup concluído!"
echo ""
echo "PRÓXIMOS PASSOS:"
echo "1. Copie os arquivos do seu PC para cá (veja o guia DEPLOY_OCI.md)"
echo "2. Entre na pasta: cd ~/promo-bot"
echo "3. Crie o .env: nano .env"
echo "4. Rode: docker compose up -d --build"
echo ""
