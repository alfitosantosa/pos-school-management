# pull repository
git pull

# Hapus image lama
docker rmi ${COMPOSE_PROJECT_NAME}-web:latest

# Build ulang dengan optimasi
docker compose --env-file .env.production build  --no-cache

# Jalankan
docker compose up -d

# Hapus semua yang tidak terpakai
docker system prune -af --volumes

# Khusus cleanup build cache
docker builder prune -af

# Cleanup containerd
ctr -n moby images prune

# Cek ukuran image
docker images

# Cek disk usage docker
docker system df -v

# Cek ukuran containerd
du -sh /var/lib/containerd/io.containerd.snapshotter.v1.overlayfs