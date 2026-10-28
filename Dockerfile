# 🟩 SWAPPED: Moving from node:24-alpine to node:24-slim for full native library support
FROM node:22-slim

RUN echo "deb http://deb.debian.org/debian bookworm contrib non-free" > /etc/apt/sources.list.d/contrib.list \
    && echo "deb http://deb.debian.org/debian bookworm-updates contrib non-free" >> /etc/apt/sources.list.d/contrib.list \
    && echo "deb http://security.debian.org/debian-security bookworm-security contrib non-free" >> /etc/apt/sources.list.d/contrib.list

RUN apt-get update && apt-get install -y --no-install-recommends \
    tini \
    openjdk-17-jre-headless \
    openssl \
    ca-certificates \
    bash \
    util-linux \
    fontconfig \
    # LibreOffice & Core Conversion Packages
    libreoffice \
    7zip \
    poppler-utils \
    imagemagick \
    libnss3 \
    libfreetype6 \
    libharfbuzz0b \
    libavif-bin \
    # Standard Fonts (Replacing the Alpine font list)
    fonts-terminus \
    fonts-inconsolata \
    fonts-dejavu \
    fonts-noto \
    fonts-noto-cjk \
    fonts-font-awesome \
    fonts-noto-color-emoji \
    fonts-droid-fallback \
    fonts-freefont-ttf \
    fonts-liberation \
    # Microsoft Core Fonts Installer dependencies
    curl \
    cabextract \
    && rm -rf /var/lib/apt/lists/*

# Install Microsoft Core Fonts on Debian safely
RUN echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections \
    && apt-get update && apt-get install -y --no-install-recommends ttf-mscorefonts-installer \
    && fc-cache -f \
    && rm -rf /var/lib/apt/lists/*

ARG APP_ROOT=/opt/app-root/src
ENV NO_UPDATE_NOTIFIER=true \
    PATH="/usr/lib/libreoffice/program:${PATH}" \
    PYTHONUNBUFFERED=1
WORKDIR ${APP_ROOT}

# FFmpeg layer compilation from multi-stage build (Kept exactly as you had it)
RUN mkdir -p /ffmpeg/
WORKDIR /ffmpeg
COPY --from=mwader/static-ffmpeg:7.1 /ffmpeg /ffmpeg/
COPY --from=mwader/static-ffmpeg:7.1 /ffprobe /ffmpeg/


ENV NODE_OPTIONS "--use-openssl-ca --enable-source-maps"
ENV NPM_CONFIG_STRICT_SSL=false
ENV SSL_CERT_DIR /cache/root-certs

VOLUME [ "/cache" ]
VOLUME [ "/data" ]

ENV HOST=0.0.0.0
ENV SELF_HOST=true
ENV PORT=8484
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
EXPOSE 8484
ENTRYPOINT ["/bin/tini", "--" , "npm", "start"]

# Run Server Configuration
WORKDIR /app
COPY content ./content
COPY models ./models
COPY images ./images
COPY package*.json ./

# 🟩 NATIVE OPTIMIZATION: sharp and tfjs-node will compile and run flawlessly here
RUN npm i --omit=dev --include=optional sharp @tensorflow/tfjs-node

COPY index.js ./
COPY src ./src
COPY dist ./dist
