import os, sys, re, html, json, base64, urllib.parse
sys.stdout.reconfigure(encoding="utf-8")
BASE = os.path.dirname(os.path.abspath(__file__))
DL = os.path.join(BASE, "downloads")
raw = open(os.path.join(DL, "bing_5-10-in-cm.html"), encoding="utf-8", errors="replace").read()
t = re.search(r"<title>(.*?)</title>", raw, re.S)
print("TITLE:", html.unescape(t.group(1)) if t else None)
for w in ["captcha", "challenge", "verify you are", "unusual traffic"]:
    if w in raw.lower():
        print("  page contains:", w)
def decode(h):
    h = html.unescape(h)
    if "bing.com/ck/a" in h:
        q = urllib.parse.parse_qs(urllib.parse.urlparse(h).query)
        u = q.get("u", [""])[0]
        if u.startswith("a1"):
            s = u[2:]
            s += "=" * (-len(s) % 4)
            try:
                return base64.urlsafe_b64decode(s).decode("utf-8", "replace")
            except Exception:
                return h
    return h
blocks = re.findall(r'<li class="b_algo"(.*?)</li>\s*(?=<li|</ol>)', raw, re.S)
print("b_algo blocks:", len(blocks))
res = []
for b in blocks:
    m = re.search(r"<h2[^>]*>\s*<a[^>]*href=\"([^\"]+)\"[^>]*>(.*?)</a>", b, re.S)
    c = re.search(r"<cite[^>]*>(.*?)</cite>", b, re.S)
    if m:
        res.append({"title": re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", m.group(2)))).strip(),
                    "url": decode(m.group(1)),
                    "cite": re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", c.group(1)))).strip() if c else None})
for i, r in enumerate(res, 1):
    print(i, "|", r["title"], "|", r["url"], "|", r["cite"])
# any answer box / calculator before results
for pat in ["177.8", "177,8", "b_ans", "rcalc", "unit converter"]:
    print("  contains", pat, ":", pat in raw)
json.dump(res, open(os.path.join(BASE, "bing_results.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

j = json.load(open(os.path.join(DL, "bsky_thread_full.json"), encoding="utf-8"))
def show(node, label):
    p = node.get("post", {})
    rec = p.get("record", {})
    print(label, "|", p.get("author", {}).get("handle"), "|", rec.get("createdAt"), "|", p.get("uri"))
    print("   ", rec.get("text"))
th = j.get("thread", {})
chain = []
n = th
while n:
    chain.append(n)
    n = n.get("parent")
for k, n in enumerate(reversed(chain)):
    show(n, "T%d" % k)
