# qr-generator
A Node JS QR Code Generator designed to generate QR codes in bulk

## Installation

- Verify Docker Installation
- Build the Docker Image
- Build the Docker Container

### Installing Docker

You may use the my install docker script found [here](https://github.com/JoshKoiro/linux-server-setup/blob/main/installScripts/installScripts.md)
```
/bin/bash -c "$(curl -fsSL https://raw.Githubusercontent.com/JoshKoiro/linux-server-setup/main/installScripts/docker.sh)"
```
### Build Docker Image
clone this respository and build the dockerfile using `docker build .` or `docker compose build`

### Build the Docker Container
Once the image is built, use the docker-compose.yml file using `docker compose up -d`

The application can be accessed by default at port 8080
