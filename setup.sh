# 

# Hapus image lama
docker rmi smkfajarsentosa-web:latest

# Build ulang dengan optimasi
docker compose build --no-cache

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