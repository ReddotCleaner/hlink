# ====== 构建阶段：从本地源码编译（不再从 npm 拉取 hlink 包） ======
# 固定 Node 18：pnpm 7.2.1（packageManager 字段）在 Node 20+ 上下载包会报 ERR_INVALID_THIS
FROM node:18-alpine AS builder
RUN corepack enable
WORKDIR /repo

# 先拷依赖清单与 tsconfig，利用层缓存
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.node.json ./
COPY packages/core/package.json packages/core/
COPY packages/app/package.json packages/app/
COPY packages/cli/package.json packages/cli/
RUN pnpm install --no-frozen-lockfile

# 拷全部源码并构建 core / app / cli
COPY packages/ packages/
RUN pnpm build

# 将三个包打成 tarball（按各自 files 字段打包，确保含 lib/dist 且不带源码/测试）
RUN cd packages/core && npm pack \
 && cd /repo/packages/app  && npm pack \
 && cd /repo/packages/cli  && npm pack

# ====== 运行阶段 ======
FROM node:lts-alpine

LABEL maintainer="ReddotCleaner"

ENV DOCKER=true \
    PS1="\u@\h:\w \$ " \
    PUID=0 \
    PGID=0 \
    UMASK=022

RUN apk add --no-cache bash su-exec

# 从构建阶段拷三个 tarball，全局安装（npm 会把 core/app 用本地 tarball 解析，
# 不再走 npm 上的旧版，同时正常拉取 koa/lowdb/execa 等运行时依赖）
COPY --from=builder /repo/packages/core/hlink-core-*.tgz /tmp/
COPY --from=builder /repo/packages/app/hlink-app-*.tgz  /tmp/
COPY --from=builder /repo/packages/cli/hlink-*.tgz       /tmp/
RUN npm i -g /tmp/*.tgz && rm -f /tmp/*.tgz

COPY --chmod=755 entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]

EXPOSE 9090
