FROM node:20-alpine

# Munkakönyvtár beállítása a konténeren belül
WORKDIR /app

# Függőségek másolása
COPY package*.json ./

# Csomagok telepítése (csak éles függőségek)
RUN npm ci --only=production

# A backend forráskód másolása
COPY . .

# Port megnyitása
EXPOSE 3000

# Indítási parancs
CMD ["npm", "start"]
