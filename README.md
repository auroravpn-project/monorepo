# Auroravpn-Monorepo

### Table of Contents

- [Features](#Features)
- [Installation](#Installation)
- [Quickstart](#Quickstart)
- [Run in Docker](#Run-in-Docker)

### Features

-  微服务架构
- Consul 服务发现
-  Consul 配置中心
- 依赖注入和 IOC 控制反转
- 输入验证和错误处理
- JWT 身份认证
- 数据库集成 (MySQL/Redis)
- WebSocket 双向实时通信
- BullMq 队列任务

### Installation

克隆项目

```bash
git clone https://github.com/CYHollis/monorepo.git
cd monorepo
```

安装依赖

```bash
pnpm install
```

### Quickstart

在运行项目之前，请确保你的系统已安装并开启

- **Node.js** >= 20.0.0
- **pnpm** = 10.15.0
- **Redis** >= 6.0
- **Mysql** >= 9.0
- **Verdaccio** >= 6.0.0
- **Consul** >= 1.2.0

临时测试项目

```bash
# 打包服务依赖的共享包
pnpm build
# 运行服务
pnpm dev --filter @services/core
pnpm dev --filter @services/user
```

清除缓存 & 打包

```bash
pnpm clean
pnpm build
```

### Run in Docker

打包成 `Docker Image`

```bash
./scripts/build.sh -s <服务名> -t <镜像名>
./scripts/build.sh -s core -t core-service
./scripts/build.sh -s user -t user-service
```

`Docker Compose` 

```yaml
services:
  mysql:
    image: mysql:9.6
    container_name: mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: 124638feq.
    volumes:
      - mysql_data:/var/lib/mysql
      - ./scripts:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"
    healthcheck:
      test: [ "CMD", "mysqladmin", "ping", "-h", "localhost" ]
      interval: 5s
      timeout: 3s
      retries: 5
      start_period: 10s

  redis:
    image: redis:8.2
    container_name: redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: [ "CMD", "redis-cli", "ping" ]
      interval: 5s
      timeout: 3s
      retries: 5

  consul:
    image: consul:1.15
    container_name: consul
    restart: always
    command: >
      agent -server -bootstrap-expect=1 -ui -client=0.0.0.0 -data-dir=/consul/data
    ports:
      - "8500:8500"
      - "8600:8600/udp"
    volumes:
      - consul_data:/consul/data
    healthcheck:
      test: [ "CMD", "consul", "info" ]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s

  wireguard-exporter:
    image: wireguard-exporter:latest
    container_name: wireguard-exporter
    restart: unless-stopped
    network_mode: host
    cap_add:
      - NET_ADMIN
    volumes:
      - ./config/wg0.conf:/etc/wireguard/wg0.conf
    healthcheck:
      test: [ "CMD", "node", "-e", "require('http').get('http://localhost:3174/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))" ]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 10s

  user-service:
    image: user-service:latest
    container_name: user-service
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - CONSUL_HTTP_ADDR=consul
    depends_on:
      mysql: 
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: [ "CMD", "node", "-e", "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))" ]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 20s

  core-service:
    image: core-service:latest
    container_name: core-service
    restart: unless-stopped
    extra_hosts:
      - "local:host-gateway"
    ports:
      - "3002:3002"
    environment:
      - CONSUL_HTTP_ADDR=consul
    depends_on:
      mysql: 
        condition: service_healthy
      redis:
        condition: service_healthy
      wireguard-exporter:
        condition: service_healthy
    healthcheck:
      test: [ "CMD", "node", "-e", "require('node:http').get('http://localhost:3002/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))" ]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 20s

  cli-gateway:
    image: nginx:latest
    container_name: cli-gateway
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./config/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      user-service:
        condition: service_healthy
      core-service:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes:
  mysql_data:
  redis_data:
  verdaccio_data:
  consul_data:
```