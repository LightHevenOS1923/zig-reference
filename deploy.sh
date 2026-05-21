#!/usr/bin/env bash
set -e

echo "=== نشر المرجع العربي Zig 0.16.0 ==="
echo ""

# Check gh
if ! command -v gh &>/dev/null; then
    echo "❌ GitHub CLI (gh) غير موجود."
    echo "   الرجاء تثبيته من: https://cli.github.com/"
    echo "   أو استخدم: sudo apt install gh  (على Ubuntu/Debian)"
    exit 1
fi

# Check auth
if ! gh auth status &>/dev/null; then
    echo "🔑 الرجاء تسجيل الدخول إلى GitHub:"
    gh auth login
fi

USER=$(gh api user --jq .login 2>/dev/null)
echo "✓ حساب GitHub: $USER"

REPO="zig-reference"
DIR="/home/qurankarim/zig-reference"

# Create repo if not exists
if ! gh repo view "$USER/$REPO" &>/dev/null; then
    echo "إنشاء المستودع $REPO ..."
    gh repo create "$REPO" --public --description "Zig 0.16.0 Bilingual Reference - English/Arabic - مرجع Zig ثنائي اللغة" --homepage "https://$USER.github.io/$REPO/"
fi

# Update files
echo "نسخ الملفات ..."
cp "$DIR/index.html" "$DIR/"
cp "$DIR/Zig_0.16_Arabic_Reference.pdf" "$DIR/"
cp "$DIR/Zig_0.16_Arabic_Reference.odt" "$DIR/"
cp "$DIR/sitemap.xml" "$DIR/"
cp "$DIR/robots.txt" "$DIR/"

# Git operations
cd "$DIR"
if [ ! -d .git ]; then
    git init
    git checkout -b main
fi
git add -A
git commit -m "Zig 0.16.0 Bilingual Reference - 354 sections - كامل"
git push -u origin main --force

# Enable GitHub Pages
echo "تفعيل GitHub Pages ..."
gh api "repos/$USER/$REPO/pages" --method POST \
    --field "source[branch]=main" \
    --field "source[path]=/" 2>/dev/null || \
gh api "repos/$USER/$REPO/pages" --method PUT \
    --field "source[branch]=main" \
    --field "source[path]=/" 2>/dev/null || true

echo ""
echo "✓✓✓ تم النشر بنجاح! ✓✓✓"
echo "   الموقع: https://$USER.github.io/$REPO/"
echo "   المستودع: https://github.com/$USER/$REPO"
echo ""
echo "📌 لإرسال الموقع إلى Google:"
echo "   1. اذهب إلى https://search.google.com/search-console"
echo "   2. أضف الموقع: https://$USER.github.io/$REPO/"
echo "   3. اتبع التعليمات للتحقق والفهرسة"
echo ""
echo "📌 لظهور الموقع عند البحث عن 'Zig 0.16.0':"
echo "   - انتظر 1-2 أسبوع حتى يفهرسه Google"
echo "   - شارك الرابط في منتديات Zig وفي وسائل التواصل"
