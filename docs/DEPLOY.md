# Deploying Benchfinity

The frontend ships now. The backend (QQQ/Java API), Postgres, and MinIO are
future additions and are disabled placeholders everywhere below.

## 1. Pull the image from GHCR

The repo and its image are private, so authenticate first:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u <github-user> --password-stdin
docker pull ghcr.io/benchfinity/workbench:develop
```

Tags: `:develop` (rolling develop build), `:<version>` (release on main),
plus per-commit `-SNAPSHOT` tags.

## 2. Run locally with docker compose

```bash
cp .env.example .env          # only needed for the full stack
docker compose up             # frontend only -> http://localhost:8080
docker compose --profile full up   # + backend + postgres + minio (future)
```

The default profile builds/pulls only the frontend. `--profile full` adds the
placeholder backend (port 8081), Postgres, and MinIO (9000 API / 9001 console).

## 3. Install the Helm chart

```bash
helm install benchfinity deploy/helm/benchfinity --namespace benchfinity --create-namespace
```

Key values:

| Value                               | Purpose                                   |
| ----------------------------------- | ----------------------------------------- |
| `frontend.image.tag`                | Image tag to deploy (default `develop`)   |
| `frontend.autoscaling.enabled`      | Enable the HPA                            |
| `ingress.enabled` / `ingress.hosts` | Expose via Ingress                        |
| `backend.enabled`                   | Turn on the future backend (off)          |
| `backend.database.*`                | Connection to a cluster-provided Postgres |
| `backend.objectStore.*`             | Optional MinIO/S3                         |
| `imagePullSecrets`                  | Required for the private GHCR image       |

Postgres and MinIO are not bundled; point `backend.database` / `objectStore` at
cluster-provided services.

The image is private. Create a pull secret and reference it:

```bash
kubectl -n benchfinity create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io --docker-username=<user> --docker-password=<token>
helm install benchfinity deploy/helm/benchfinity -n benchfinity \
  --set imagePullSecrets[0].name=ghcr-pull
```

## 4. Argo CD

Apply the example Application (edit repo/destination first):

```bash
kubectl apply -f deploy/argocd/application.yaml
```

It syncs `deploy/helm/benchfinity` at `develop` into the `benchfinity`
namespace with automated prune + self-heal. See the file header for the Image
Updater annotation that tracks the `:develop` tag, and the private-registry
note.

## 5. Published chart

CI packages and pushes the chart to GHCR as an OCI artifact on develop/main:

```bash
helm pull oci://ghcr.io/benchfinity/charts/benchfinity
# or install directly:
helm install benchfinity oci://ghcr.io/benchfinity/charts/benchfinity --version <version>
```
