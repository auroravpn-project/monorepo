# WireGuard Deployments

### Installation

```bash
dnf install wireguard-tools -y
```

### Configuration

```bash
cat <<EOF > /etc/wireguard/wg0.conf
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = OJLjhW6f7DzSLZxKOGolwJTI6ZVpeedi888BIF35G1w=

[Peer]
PublicKey = TzbHuqmaiAuLzw0c+c32om70UkaiGOrQ03Npo9pBjiM=
AllowedIPs = 10.0.0.2/32
EOF
```

### IP forwarding

```bash
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
```

### NAT settings

```bash
iptables -t nat -A POSTROUTING -o wg0 -j MASQUERADE
iptables -A FORWARD -i wg0 -j ACCEPT
iptables -A FORWARD -o wg0 -j ACCEPT
```

### Firewall rules

```bash
sudo firewall-cmd --permanent --add-port=51820/udp
sudo firewall-cmd --permanent --add-masquerade
sudo firewall-cmd --reload
```

### Launch

```bash
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
sudo wg show
```

