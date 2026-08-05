#Recruit Local monorepo

## Docker build prerequisites

Two real env files, each in the app it configures:

| File | Used for |
| --- | --- |
| `apps/backend/.env` | Backend runtime (`env_file`) |
| `apps/frontend/.env` | Frontend runtime (`env_file`) and `NEXT_PUBLIC_*` at image build |

No compose `build.args` and no root `.env`. The frontend Dockerfile copies
`apps/frontend/.env` into the builder so `next build` can inline `NEXT_PUBLIC_*`, then
deletes it (and any `.env` under standalone) so secrets are not left in the runtime
image. Backend `.env` stays dockerignored. Runtime secrets still come from `env_file`.

```sh
docker compose up -d --build
```

Two gotchas:

- **`NEXT_PUBLIC_*` changes need a rebuild.** They are compiled into the bundle, so
  `up -d` alone reuses the old image. Re-run `pnpm docker-compose:prod:build`.
- **Docker vs local URLs.** Values come only from `apps/frontend/.env` /
  `apps/backend/.env`. For Docker/prod set `NEXT_PUBLIC_BASE_API_URL`, `NEXTAUTH_URL`,
  and `INTERNAL_API_URL` to the public / in-network hosts; for `pnpm frontend:dev`
  point `NEXT_PUBLIC_BASE_API_URL` at `http://localhost:9027/api`.

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
