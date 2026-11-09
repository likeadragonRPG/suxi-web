# 網址確定後跑一次：python3 tools/make-sitemap.py https://網址/
# 會產生 sitemap.xml、補上 robots.txt 的 Sitemap 行，
# 並在每頁 <head> 加上 canonical 與 hreflang（中英互指）。
import re
import sys
from datetime import date
from pathlib import Path

root = Path(__file__).resolve().parent.parent
base = sys.argv[1].rstrip("/") + "/"
pages = ["", "services/", "about/", "contact/"]
today = date.today().isoformat()

def url(lang, page):
    return base + ("en/" if lang == "en" else "") + page

def alternates(page):
    return (
        f'<link rel="alternate" hreflang="zh-Hant-TW" href="{url("zh", page)}">\n'
        f'<link rel="alternate" hreflang="en" href="{url("en", page)}">\n'
        f'<link rel="alternate" hreflang="x-default" href="{url("zh", page)}">'
    )

# sitemap.xml
entries = []
for page in pages:
    for lang in ("zh", "en"):
        entries.append(
            f"  <url>\n    <loc>{url(lang, page)}</loc>\n    <lastmod>{today}</lastmod>\n"
            f'    <xhtml:link rel="alternate" hreflang="zh-Hant-TW" href="{url("zh", page)}"/>\n'
            f'    <xhtml:link rel="alternate" hreflang="en" href="{url("en", page)}"/>\n'
            f"  </url>"
        )
(root / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
    'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    + "\n".join(entries) + "\n</urlset>\n",
    encoding="utf-8",
)

# robots.txt
robots = root / "robots.txt"
text = re.sub(r"^# ?Sitemap:.*$|^Sitemap:.*$", f"Sitemap: {base}sitemap.xml", robots.read_text(encoding="utf-8"), flags=re.M)
robots.write_text(text, encoding="utf-8")

# 每頁 canonical + hreflang（重跑會先清掉舊的）
for page in pages:
    for lang in ("zh", "en"):
        f = root / ("en/" if lang == "en" else "") / page / "index.html"
        html = f.read_text(encoding="utf-8")
        html = re.sub(r'<link rel="(canonical|alternate)" [^>]*>\n', "", html)
        tags = f'<link rel="canonical" href="{url(lang, page)}">\n{alternates(page)}\n'
        html = html.replace('<link rel="stylesheet"', tags + '<link rel="stylesheet"', 1)
        # 結構化資料補上網址與 logo
        html = re.sub(r'"alternateName": "SUXI AI",\n(  "url": .*\n  "logo": .*\n)?',
                      f'"alternateName": "SUXI AI",\n  "url": "{base}",\n  "logo": "{base}assets/icon-512.png",\n', html)
        f.write_text(html, encoding="utf-8")

print("done:", base)
