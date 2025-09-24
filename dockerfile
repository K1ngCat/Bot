# 1. Basis-Image festlegen
FROM node:18-slim

# 2. Arbeitsverzeichnis festlegen
WORKDIR /app

# 3. Paketdateien kopieren und Abhängigkeiten installieren
COPY package.json package-lock.json ./
RUN npm install --production

# 4. Rest des Codes kopieren
COPY . .

# 5. Den Bot starten
CMD ["node deploy-commands.js", "index.js"]