"""Download pages listed in a jobs file (name<TAB>url per line) into downloads/,
flag bot-check / refusal pages, and log each attempt to downloads/../fetchlog.csv.
Usage: python -I fetch.py jobs.txt
"""
import csv, os, sys, time, urllib.request, urllib.error, re, html

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DL = os.path.join(BASE, "downloads")
LOG = os.path.join(BASE, "fetchlog.csv")
UA = "bigsmall-research-script/1.0 (size-chart reading; read-only)"
BOT = ["captcha", "verify you are human", "just a moment", "access denied",
       "px-captcha", "are you a robot", "cf-chl", "request unsuccessful",
       "blocked", "unusual traffic", "enable javascript and cookies"]


def fetch(name, url):
    req = urllib.request.Request(url, headers={"User-Agent": UA,
                                               "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
                                               "Accept-Language": "en-US,en;q=0.8"})
    status, body, err = "", b"", ""
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            status = r.status
            body = r.read()
    except urllib.error.HTTPError as e:
        status = e.code
        try:
            body = e.read()
        except Exception:
            body = b""
        err = str(e)
    except Exception as e:
        err = repr(e)
    ext = ".json" if url.endswith(".json") or "/.json" in url or ".json?" in url else ".html"
    path = os.path.join(DL, name + ext)
    with open(path, "wb") as f:
        f.write(body)
    text = body.decode("utf-8", "replace")
    low = text.lower()
    hits = [b for b in BOT if b in low[:20000]]
    m = re.search(r"<title[^>]*>(.*?)</title>", text, re.S | re.I)
    title = html.unescape(m.group(1).strip())[:100] if m else ""
    verdict = "ok" if status == 200 and len(body) > 2000 and not (hits and len(body) < 60000) else "refused-or-thin"
    new = not os.path.exists(LOG)
    with open(LOG, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["name", "url", "status", "bytes", "bot_markers", "title", "verdict", "error", "date"])
        w.writerow([name, url, status, len(body), "|".join(hits), title, verdict, err, "2026-10-21"])
    print(f"{name}\t{status}\t{len(body)}\t{verdict}\t{'|'.join(hits)}\t{title}")


if __name__ == "__main__":
    for line in open(sys.argv[1], encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        n, u = line.split("\t", 1)
        fetch(n, u)
        time.sleep(1.5)
