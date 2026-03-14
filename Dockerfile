FROM node:20-alpine 

WORKDIR /app

COPY package*.json ./

ENV HUSKY=0   
RUN npm pkg delete scripts.prepare          

RUN npm ci --omit=dev      

COPY . .

EXPOSE 3000

CMD ["node", "dist/server.js"]