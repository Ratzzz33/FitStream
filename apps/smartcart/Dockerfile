FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/smartcart ./apps/smartcart
RUN npm install --workspace=apps/smartcart
WORKDIR /app/apps/smartcart
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
