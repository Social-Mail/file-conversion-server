FROM node:24-alpine

RUN apk add --no-cache tini

RUN apk add --no-cache openjdk8-jre openssl

RUN apk add font-terminus font-inconsolata font-dejavu font-noto font-noto-cjk font-awesome font-noto-extra
RUN apk add font-noto-emoji

ARG APP_ROOT=/opt/app-root/src
ENV NO_UPDATE_NOTIFIER=true \
    PATH="/usr/lib/libreoffice/program:${PATH}" \
    PYTHONUNBUFFERED=1
WORKDIR ${APP_ROOT}

# Install LibreOffice & Common Fonts
RUN apk --no-cache add bash libreoffice util-linux \
    font-droid-nonlatin font-droid ttf-dejavu ttf-freefont ttf-liberation && \
    rm -rf /var/cache/apk/*

# Install Microsoft Core Fonts
RUN apk --no-cache add msttcorefonts-installer fontconfig && \
    update-ms-fonts && \
    fc-cache -f && \
    rm -rf /var/cache/apk/*

RUN apk add 7zip \
    poppler-utils \
    imagemagick \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

## Install Puppeteer
# RUN apk add --no-cache \
#       chromium \

# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# RUN addgroup -S pptruser && adduser -S -G pptruser pptruser \
#     && mkdir -p /home/pptruser/Downloads /app \
#     && chown -R pptruser:pptruser /home/pptruser \
#     && chown -R pptruser:pptruser /app

# RUN npm install puppeteer

RUN mkdir -p /ffmpeg/
WORKDIR /ffmpeg
# RUN wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz && \
#     tar xvf ./ffmpeg-release-amd64-static.tar.xz --strip-components 1

COPY --from=mwader/static-ffmpeg:7.1 /ffmpeg /ffmpeg/
COPY --from=mwader/static-ffmpeg:7.1 /ffprobe /ffmpeg/

ENV NODE_OPTIONS "--use-openssl-ca --enable-source-maps"
ENV SSL_CERT_DIR /cache/root-certs


# USER root

# RUN Server Now
WORKDIR /app
COPY package*.json ./
COPY content ./content
COPY index.js ./
COPY src ./src
COPY dist ./dist
ENV HOST=0.0.0.0
ENV SELF_HOST=true
ENV PORT=8484
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
EXPOSE 8484

RUN npm i --omit=dev --include=optional sharp

ENTRYPOINT ["npm", "start"]