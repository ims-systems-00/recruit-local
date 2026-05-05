#Recruit Local monorepo

## Local DOC/DOCX thumbnail testing (macOS)

The backend thumbnail queue uses LibreOffice to generate thumbnails for office files.

1. Install LibreOffice:

```sh
brew install --cask libreoffice
```

2. Set the LibreOffice binary path (recommended on macOS):

```sh
export LIBREOFFICE_BIN="/Applications/LibreOffice.app/Contents/MacOS/soffice"
```

3. Verify it works:

```sh
"$LIBREOFFICE_BIN" --headless --version
```

If the command above prints a version, DOC/DOCX thumbnail generation is ready for local testing.

- for arm processors run

```
docker build \
--build-arg NODE_ENV=production \
-t inrm-backend:latest \
-f apps/backend/Dockerfile \
.
```

- for x86 processors run

```sh
docker build \
--platform=linux/amd64 \
--build-arg NODE_ENV=production \
-t inrm-backend:latest \
-f apps/backend/Dockerfile \
.
```

```sh
aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin 774305577345.dkr.ecr.eu-west-2.amazonaws.com
docker tag inrm-backend:latest 774305577345.dkr.ecr.eu-west-2.amazonaws.com/interface-nrm:latest
docker push 774305577345.dkr.ecr.eu-west-2.amazonaws.com/interface-nrm:latest
```

```json
{
  "AWSEBDockerrunVersion": "1",
  "Image": {
    "Name": "774305577345.dkr.ecr.eu-west-2.amazonaws.com/interface-nrm",
    "Update": "true"
  },
  "Ports": [
    {
      "ContainerPort": 9027
    }
  ]
}
```

```sh
aws cloudfront create-invalidation \
  --distribution-id E16D43XS2EULWY \
  --paths "/*"
```
