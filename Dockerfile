FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de dependência
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Build da aplicação (Vite)
RUN npm run build

# Expor a porta 3000
EXPOSE 3000

# Comando para iniciar o servidor configurado
CMD ["node", "server.js"]
