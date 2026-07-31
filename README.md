#Recruit Local monorepo

## Docker build prerequisites

Copy `.env.example` to `.env` at the repo root and fill it in before building. Compose
reads it to supply the frontend's `NEXT_PUBLIC_*` build args; `docker compose build`
fails with a named-variable error if the two Sanity values are missing.

These are build-time only. Runtime config still comes from `apps/backend/.env` and
`apps/frontend/.env` via `env_file`, and those files are deliberately excluded from the
Docker build context — `next build` copies any `.env` it finds into the standalone
output, which previously baked `NEXTAUTH_SECRET` into the frontend image and the Mongo
connection string into the backend image.

## Local DOC/DOCX thumbnail testing (macOS)

The backend thumbnail queue shells out to LibreOffice to render thumbnails for office
files. **The Docker image does not bundle LibreOffice** — it added ~467MB and was
dropped. In a container, DOC/DOCX uploads fall back to the generated placeholder card
(see the `catch` around `renderOfficeThumbnail` in
`apps/backend/src/queue/thumbnailCreateQueue.ts`); PDF and image thumbnails are
unaffected. Real office thumbnails therefore only render where a `soffice` binary is on
the host, which is what the steps below set up for local development.

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
