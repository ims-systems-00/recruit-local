#Interface NRM monorepo

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
