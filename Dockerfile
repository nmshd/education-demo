FROM node:lts as builder
WORKDIR /usr/app
COPY package.json package-lock.json ./
COPY packages packages
RUN npm ci
RUN npm run build

FROM node:lts-alpine
ENV NODE_ENV=production

# demo
WORKDIR /usr/app/demo
COPY packages/server/package.json ./
COPY packages/server/config config
RUN npm install

COPY --from=builder /usr/app/packages/server/public/ public/
COPY --from=builder /usr/app/packages/server/dist dist/

# school
WORKDIR /usr/app/school
COPY packages/school-server/package.json ./
COPY packages/school-server/config config
COPY packages/school-server/attachment attachment
RUN npm install

COPY --from=builder /usr/app/packages/school-server/public/ public/
COPY --from=builder /usr/app/packages/school-server/dist/ dist/

ENTRYPOINT [ "node", "dist/index.js" ]
