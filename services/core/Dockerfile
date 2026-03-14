# ===== 构建阶段 =====
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY .npmrc ./

RUN echo "registry = http://host.docker.internal:4873/" >> .npmrc

RUN cat .npmrc
RUN ip addr

# 只复制 lock 文件和 workspace 配置
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# 只复制当前服务和它依赖的共享包
COPY services/core ./services/core
COPY packages ./packages
COPY tsconfig.json ./tsconfig.json

# 安装依赖（只安装当前服务 + 依赖的共享包）
RUN pnpm install --frozen-lockfile

# 构建当前服务 + 所有依赖的共享包
RUN pnpm --filter "@services/core..." build

# 生成生产运行目录
RUN pnpm deploy --filter "@services/core" --prod /prod/core


# ===== 运行阶段 =====
FROM node:20-alpine
WORKDIR /app

# 设置时区（重要）
ENV TZ=Asia/Shanghai

# 只复制生产运行目录
COPY --from=builder /prod/core .

# 运行服务
CMD ["node", "dist/index.js"]