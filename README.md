#Recruit Local monorepo

## Docker build prerequisites

Two real env files, each in the app it configures:

| File | Used for |
| --- | --- |
| `apps/backend/.env` | Backend runtime (`env_file`) |
| `apps/frontend/.env` | Frontend runtime (`env_file`) **and** the frontend's `NEXT_PUBLIC_*` build args |

There is no root `.env`. `apps/frontend/.env` is the only source for the build args, and
Compose is pointed at it with `--env-file`:

```sh
docker compose --env-file apps/frontend/.env -f docker-compose.yml up -d --build
```

The `pnpm docker-compose:prod:*` scripts already pass that flag, so prefer them. Compose
interpolates `${...}` only from the project env file — it cannot read a service's
`env_file:` for that, because interpolation happens before the YAML is parsed. Omit the
flag and Compose aborts on the guarded Sanity variables rather than building with empty
values. Run it from the repo root; `--env-file` is resolved relative to the current
directory.

`apps/frontend/.env` holds both public and secret keys. Only the
`NEXT_PUBLIC_*` keys named in the `args:` block cross into the build, and those are
inlined into the client bundle and public by definition. The file itself never enters the
build context (`.dockerignore` excludes `**/.env`) because `next build` copies any `.env`
it finds into the standalone output, which previously baked `NEXTAUTH_SECRET` into the
frontend image and the Mongo connection string into the backend image.

Two gotchas:

- **`NEXT_PUBLIC_*` changes need a rebuild.** They are compiled into the bundle, so
  `up -d` alone reuses the old image. Re-run `pnpm docker-compose:prod:build`.
- **`NEXT_PUBLIC_BASE_API_URL` in that file is the dev value** (`localhost:9027`), used by
  `pnpm frontend:dev`. The container build ignores it and derives the URL from
  `PUBLIC_URL` instead. Set `PUBLIC_URL` to the public origin when deploying.

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
