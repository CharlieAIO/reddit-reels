# Using a specific platform and slim version of Node.js
FROM --platform=linux/amd64 node:21-slim

# Install necessary packages for setting up Google Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Set up Google Chrome repository
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list

# Update apt sources
RUN apt-get update

# Explicitly check that the Google Chrome package is available
RUN apt-cache search google-chrome-stable


# Install Google Chrome and necessary fonts
RUN apt-get install -y \
    google-chrome-stable \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Define environment variables
ENV USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
ENV PUPPETEER_SKIP_DOWNLOAD true


# Setting up the non-privileged user
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser /app

USER pptruser
WORKDIR /app
COPY --chown=pptruser:pptruser package.json package-lock.json ./
RUN npm install
COPY --chown=pptruser:pptruser . .

EXPOSE 8080

CMD ["node", "src/api/server.js"]
