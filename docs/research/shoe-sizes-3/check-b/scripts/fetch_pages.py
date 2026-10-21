"""Checker B: download every distinct page once, with a plain research User-Agent.

Usage: python -I fetch_pages.py <urls.tsv> <downloads_dir> <log_csv> [pause_seconds]
Skips a page already saved with status 200 (so a second run resumes).
No cookies, no personal data, no form posts; a refused page is logged, never retried around.
"""
import csv
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

urls_tsv, down_dir, log_csv = sys.argv[1], sys.argv[2], sys.argv[3]
pause = float(sys.argv[4]) if len(sys.argv) > 4 else 1.2

UA = "bigsmall-research-script/1.0 (checker; shoe-size fact check)"
HEADERS = {
    "User-Agent": UA,
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en",
}


def fname(url):
    path = re.sub(r"^https?://(www\.)?runrepeat\.com/?", "", url).strip("/")
    path = path.replace("/", "__") or "home"
    path = re.sub(r"[^A-Za-z0-9_.-]", "_", path)
    return path + ".html"


urls = []
with open(urls_tsv, encoding="utf-8") as f:
    for line in f:
        line = line.rstrip("\n")
        if line:
            u, ids = line.split("\t")
            urls.append((u, ids))

done = {}
if os.path.exists(log_csv):
    with open(log_csv, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            if r["status"] == "200":
                done[r["url"]] = r

new_file = not os.path.exists(log_csv)
logf = open(log_csv, "a", newline="", encoding="utf-8")
w = csv.writer(logf)
if new_file:
    w.writerow(["url", "row_ids", "file", "status", "bytes", "final_url", "content_type", "fetched_utc", "error"])

for i, (u, ids) in enumerate(urls):
    fn = fname(u)
    if u in done and os.path.exists(os.path.join(down_dir, fn)):
        continue
    status, nbytes, final, ctype, err = "", 0, "", "", ""
    for attempt in range(2):
        try:
            req = urllib.request.Request(u, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=40) as resp:
                body = resp.read()
                status = str(resp.status)
                final = resp.geturl()
                ctype = resp.headers.get("Content-Type", "")
            with open(os.path.join(down_dir, fn), "wb") as out:
                out.write(body)
            nbytes = len(body)
            err = ""
            break
        except urllib.error.HTTPError as e:
            status = str(e.code)
            err = f"HTTPError {e.code} {e.reason}"
            try:
                body = e.read()
                with open(os.path.join(down_dir, fn + f".error{e.code}.html"), "wb") as out:
                    out.write(body)
            except Exception:
                pass
            if e.code in (403, 404, 410, 451):
                break
        except Exception as e:  # network error
            status = "error"
            err = f"{type(e).__name__}: {e}"
        time.sleep(pause * 3)
    w.writerow([u, ids, fn, status, nbytes, final, ctype, datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), err])
    logf.flush()
    print(i + 1, status, nbytes, u, flush=True)
    time.sleep(pause)

logf.close()
print("done")
