#!/usr/bin/env bash
# 一键打包脚本：生成可上传到游戏网站的 ZIP 静态包
set -e

cd "$(dirname "$0")"

PKG_NAME="Collection.zip"
ENTRIES=(index.html app.js style.css assets)

# 校验入口文件
for f in "${ENTRIES[@]}"; do
  if [ ! -e "$f" ]; then
    echo "[ERROR] 缺少入口资源: $f"
    exit 1
  fi
done

# 清理旧包
rm -f "$PKG_NAME"

# 打包，排除系统/开发文件
zip -rq "$PKG_NAME" "${ENTRIES[@]}" \
  -x "*.DS_Store" "__MACOSX*" "*/.git/*"

SIZE=$(du -h "$PKG_NAME" | cut -f1)
COUNT=$(unzip -l "$PKG_NAME" | tail -1 | awk '{print $2}')

echo "[OK] 打包完成: $PKG_NAME ($SIZE, $COUNT 个文件)"
echo "[路径] $(pwd)/$PKG_NAME"
echo ""
echo "本地预览（可选）:"
echo "  python3 -m http.server 8000"
echo ""
echo "按任意键关闭窗口..."
read -n 1 -s
