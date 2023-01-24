FROM node:lts as builder
WORKDIR /usr/app
COPY package.json package-lock.json ./
COPY packages packages
RUN npm ci
RUN npm run build

FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /usr/app
COPY packages/server/package.json ./
RUN npm install
COPY packages/server/config config
COPY --from=builder /usr/app/packages/server/public/ public/
COPY --from=builder /usr/app/packages/server/dist dist/
COPY --from=builder /usr/app/packages/school-server/public/ public/
COPY --from=builder /usr/app/packages/school-server/dist/ dist/
ENTRYPOINT [ "node", "dist/index.js" ]
