FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/fridgetracker ./apps/fridgetracker
RUN npm install --workspace=apps/fridgetracker
WORKDIR /app/apps/fridgetracker
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
