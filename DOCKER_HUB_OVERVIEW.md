# Email Signature Generator

邮件签名生成器。支持填写个人、公司和联系方式，实时预览邮件签名效果，并复制或下载最终 HTML。

V3.0 支持 Docker 部署。上传图片会由服务端同步到又拍云云存储，导出的签名 HTML 使用云端图片 URL，避免 base64 图片过长导致邮箱签名字数超限。

## 功能

- 实时预览邮件签名效果
- 复制最终 HTML
- 下载最终 HTML
- 上传图片自动同步到又拍云云存储
- 导出的 HTML 使用云端图片地址
- 支持腾讯企业邮箱等邮箱签名场景
- 支持 Docker 和 Docker Compose 部署

## 镜像

```text
dengchuanfu/email-signature:3.0.0
dengchuanfu/email-signature:latest
```

## 环境变量

```env
UPYUN_BUCKET=your-bucket
UPYUN_OPERATOR=your-operator
UPYUN_PASSWORD=your-operator-password
UPYUN_PUBLIC_BASE_URL=https://img.example.com
UPYUN_UPLOAD_HOST=https://v0.api.upyun.com
PORT=3000
MAX_UPLOAD_BYTES=8388608
```

`UPYUN_BUCKET`：又拍云云存储服务名称。

`UPYUN_OPERATOR`：又拍云操作员名称，需要有上传权限。

`UPYUN_PASSWORD`：又拍云操作员密码，也可以改用 `UPYUN_PASSWORD_MD5`。

`UPYUN_PUBLIC_BASE_URL`：图片最终对外访问域名，建议使用 HTTPS。

`UPYUN_UPLOAD_HOST`：又拍云上传接口地址，默认 `https://v0.api.upyun.com`。

`PORT`：容器内服务端口，默认 `3000`。

`MAX_UPLOAD_BYTES`：单张图片最大上传大小，默认 `8388608`，即 8 MB。

## Docker 部署

1. 创建 `.env` 文件。

```bash
cp .env.example .env
```

Windows PowerShell 可使用：

```powershell
Copy-Item .env.example .env
```

2. 按实际又拍云配置修改 `.env`。

3. 启动容器。

```bash
docker run -d \
  --name email-signature \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  dengchuanfu/email-signature:3.0.0
```

4. 打开页面。

```text
http://localhost:3000
```

## Docker Compose 部署

创建 `docker-compose.yml`：

```yaml
services:
  email-signature:
    image: dengchuanfu/email-signature:3.0.0
    env_file:
      - .env
    ports:
      - "3000:3000"
    restart: unless-stopped
```

启动：

```bash
docker compose up -d
```

查看日志：

```bash
docker compose logs -f
```

停止：

```bash
docker compose down
```

## 健康检查

容器提供健康检查接口：

```text
GET /healthz
```

正常返回：

```json
{"status":"ok"}
```

## 注意事项

- `.env` 包含又拍云操作员密码，请勿提交到 Git 仓库。
- 正式使用建议配置 HTTPS 图片域名，否则部分邮箱客户端可能拦截图片。
- 修改 `.env` 后需要重启容器。
- 不要直接双击打开 `index.html`，否则没有后端上传接口，图片无法上传到又拍云。
