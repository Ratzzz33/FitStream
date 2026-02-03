FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/aicoach ./apps/aicoach
RUN npm install --workspace=apps/aicoach
WORKDIR /app/apps/aicoach
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
