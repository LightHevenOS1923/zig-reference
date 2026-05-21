#!/usr/bin/env python3
"""
نشر الموقع المرجعي لـ Zig 0.16.0 على GitHub Pages
يتطلب: GitHub Personal Access Token (classic) مع صلاحية repo

كيفية الحصول على التوكن:
1. افتح https://github.com/settings/tokens
2. اضغط Generate New Token (classic)
3. اختر صلاحية repo (كاملة)
4. انسخ التوكن والصقه أدناه
"""

import os, sys, json, base64, webbrowser

GITHUB_USER = "LightHevenOS1923"
REPO_NAME = "zig-reference"
HTML_PATH = "/home/qurankarim/Zig_0.16_Arabic_Reference.html"
PDF_PATH = "/home/qurankarim/Zig_0.16_Arabic_Reference.pdf"
ODT_PATH = "/home/qurankarim/Zig_0.16_Arabic_Reference.odt"
SITEMAP_PATH = "/home/qurankarim/zig-reference/sitemap.xml"
ROBOTS_PATH = "/home/qurankarim/zig-reference/robots.txt"

try:
    import urllib.request, urllib.error
except ImportError:
    print("❌ Python urllib غير متوفر.")
    sys.exit(1)

def api_call(method, path, data=None, token=None):
    url = f"https://api.github.com{path}"
    headers = {
        "User-Agent": "ZigRefDeploy/1.0",
        "Accept": "application/vnd.github.v3+json",
    }
    if token:
        headers["Authorization"] = f"token {token}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"  HTTP {e.code}: {err[:200]}")
        return None

def file_to_base64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

def main():
    print("=" * 60)
    print("  نشر المرجع العربي Zig 0.16.0 على GitHub Pages")
    print("=" * 60)

    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("\n🔑 لم أجد التوكن في المتغيرات البيئية.")
        print("   1. افتح: https://github.com/settings/tokens")
        print("   2. أنشئ Token (classic) بصلاحية repo")
        print("   3. الصق التوكن هنا:")
        token = input("   > ").strip()
        if not token:
            print("❌ لا يوجد توكن. تعليمات النشر أدناه.")
            show_instructions()
            return

    print(f"\n✓ استخدام الحساب: {GITHUB_USER}")
    print(f"✓ المستودع: {REPO_NAME}")

    # Verify token
    user = api_call("GET", "/user", token=token)
    if not user:
        print("❌ التوكن غير صالح. جرب مرة أخرى.")
        return
    print(f"✓ تم التحقق: {user.get('login')}")

    # Create repo
    print("\nإنشاء المستودع ...")
    repo_data = {
        "name": REPO_NAME,
        "description": "Zig 0.16.0 Bilingual Reference - English/Arabic - مرجع Zig ثنائي اللغة",
        "homepage": f"https://{GITHUB_USER}.github.io/{REPO_NAME}/",
        "auto_init": True,
        "private": False,
    }
    repo = api_call("POST", "/user/repos", data=repo_data, token=token)
    if repo is None:
        repo = api_call("GET", f"/repos/{GITHUB_USER}/{REPO_NAME}", token=token)
        print("المستودع موجود بالفعل، سيتم تحديث الملفات.")
    else:
        print(f"✓ تم إنشاء المستودع: {repo.get('html_url')}")

    # Delete any existing gh-pages branch if it exists
    # Get default branch
    if repo:
        default_branch = repo.get("default_branch", "main")
    else:
        default_branch = "main"

    # Create/update files
    files = [
        ("index.html", HTML_PATH),
        ("zig-reference.pdf", PDF_PATH),
        ("zig-reference.odt", ODT_PATH),
        ("sitemap.xml", SITEMAP_PATH),
        ("robots.txt", ROBOTS_PATH),
    ]

    # Get latest commit SHA on the default branch
    ref = api_call("GET", f"/repos/{GITHUB_USER}/{REPO_NAME}/git/refs/heads/{default_branch}", token=token)
    if ref:
        latest_sha = ref["object"]["sha"]
    else:
        latest_sha = None

    # If repo was just created, there's nothing to get the tree from
    if latest_sha:
        tree_url = f"/repos/{GITHUB_USER}/{REPO_NAME}/git/trees/{latest_sha}"
        tree_data = api_call("GET", tree_url, token=token)
        existing = [t["path"] for t in tree_data.get("tree", [])] if tree_data else []
    else:
        existing = []

    print("رفع الملفات ...")
    blobs = []
    for path_in_repo, local_path in files:
        if os.path.exists(local_path):
            content = file_to_base64(local_path)
            blob = api_call("POST", f"/repos/{GITHUB_USER}/{REPO_NAME}/git/blobs",
                           data={"content": content, "encoding": "base64"}, token=token)
            if blob:
                blobs.append({"path": path_in_repo, "mode": "100644", "type": "blob", "sha": blob["sha"]})
                print(f"  ✓ {path_in_repo}")
            else:
                print(f"  ✗ {path_in_repo} (فشل)")
        else:
            print(f"  - {path_in_repo} (الملف غير موجود)")

    if not blobs:
        print("❌ لم يتم رفع أي ملفات.")
        return

    # Create tree
    tree = api_call("POST", f"/repos/{GITHUB_USER}/{REPO_NAME}/git/trees",
                   data={"base_tree": latest_sha, "tree": blobs} if latest_sha else {"tree": blobs},
                   token=token)
    if not tree:
        print("❌ فشل إنشاء tree.")
        return

    # Create commit
    commit_data = {
        "message": "Zig 0.16.0 Bilingual Reference - 354 sections\n\nنشر المرجع الكامل لـ Zig 0.16.0 بالعربية والإنجليزية",
        "tree": tree["sha"],
    }
    if latest_sha:
        commit_data["parents"] = [latest_sha]

    commit = api_call("POST", f"/repos/{GITHUB_USER}/{REPO_NAME}/git/commits",
                     data=commit_data, token=token)
    if not commit:
        print("❌ فشل إنشاء commit.")
        return

    # Update reference
    ref_result = api_call("PATCH", f"/repos/{GITHUB_USER}/{REPO_NAME}/git/refs/heads/{default_branch}",
                         data={"sha": commit["sha"], "force": True}, token=token)
    if not ref_result:
        print("❌ فشل تحديث المرجع.")
        return

    # Enable GitHub Pages
    print("\nتفعيل GitHub Pages ...")
    pages = api_call("POST", f"/repos/{GITHUB_USER}/{REPO_NAME}/pages",
                    data={"source": {"branch": default_branch, "path": "/"}},
                    token=token)
    if pages:
        print(f"✓ تم تفعيل Pages: {pages.get('html_url', 'https://{GITHUB_USER}.github.io/{REPO_NAME}/')}")
    else:
        print("ملاحظة: قد يكون Pages مفعّلاً بالفعل.")

    site_url = f"https://{GITHUB_USER}.github.io/{REPO_NAME}/"
    print(f"\n{'='*60}")
    print(f"  ✓✓✓ تم النشر بنجاح! ✓✓✓")
    print(f"  الموقع: {site_url}")
    print(f"{'='*60}")
    print(f"\n📌 لإرسال الموقع إلى Google:")
    print(f"   1. افتح https://search.google.com/search-console")
    print(f"   2. أضف الموقع: {site_url}")
    print(f"   3. اتبع تعليمات التحقق")
    print(f"\n📌 انتظر 1-2 أسبوع حتى يظهر في نتائج البحث.")
    print(f"📌 شارك الرابط في منتديات Zig ووسائل التواصل.")

def show_instructions():
    print("\n" + "=" * 60)
    print("  تعليمات النشر اليدوي على GitHub Pages")
    print("=" * 60)
    print("""
الطريقة 1: استخدام GitHub Desktop (الأسهل)
  1. افتح https://github.com/LightHevenOS1923/zig-reference/new
  2. أنشئ مستودعاً جديداً بالاسم zig-reference
  3. اسحب ملفات المجلد /home/qurankarim/zig-reference/ إلى صفحة الرفع
  4. اضغط Commit changes
  5. اذهب إلى Settings > Pages واختر main branch

الطريقة 2: استخدام سطر الأوامر
  cd /home/qurankarim/zig-reference
  git init
  git add -A
  git commit -m "نشر المرجع"
  git remote add origin https://github.com/LightHevenOS1923/zig-reference.git
  git push -u origin main

الطريقة 3: استخدام gh CLI
  sudo apt install gh
  gh auth login
  gh repo create zig-reference --public --source=/home/qurankarim/zig-reference --push-remote
  gh repo deploy-key add
    """)

if __name__ == "__main__":
    main()
