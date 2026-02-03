FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/cookbot ./apps/cookbot
RUN npm install --workspace=apps/cookbot
WORKDIR /app/apps/cookbot
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
