FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/menuscan ./apps/menuscan
RUN npm install --workspace=apps/menuscan
WORKDIR /app/apps/menuscan
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
