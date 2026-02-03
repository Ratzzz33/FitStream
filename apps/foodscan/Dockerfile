FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/foodscan ./apps/foodscan
RUN npm install --workspace=apps/foodscan
WORKDIR /app/apps/foodscan
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
