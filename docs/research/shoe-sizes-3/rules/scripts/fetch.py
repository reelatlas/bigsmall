"""Download pages to the downloads folder and print the sizing sentences found in them.

usage: python -I fetch.py NAME URL [NAME URL ...]
Writes downloads/NAME.html (or .pdf/.json by content type) and appends a line per
page to scripts/../fetchlog.tsv: name, url, status, bytes, verdict.
"""
import html
import io
import json
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = Path(__file__).resolve().parent.parent
DL = ROOT / "downloads"
LOG = ROOT / "fetchlog.tsv"
UA = "Mozilla/5.0 (compatible; bigsmall-research-script/1.0; size-guide reading)"
KEYS = re.compile(
    r"(measur|foot length|length of (your|the) foot|heel to|longest toe|true to size|"
    r"runs? (small|large|big|narrow|wide)|size up|size down|half size|between sizes|"
    r"in between|thumb|allowance|insole|inner sole|footbed length|wiggle|mondopoint|"
    r"recommend|we suggest|fit guide|order (a|one) size)",
    re.I,
)
BOT = re.compile(r"(captcha|are you a robot|access denied|verify you are human|"
                 r"pardon our interruption|request unsuccessful|incapsula|perimeterx|"
                 r"px-captcha|akamai|cf-chl|just a moment)", re.I)


def text_of(raw: str) -> str:
    raw = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", raw)
    raw = re.sub(r"(?s)<br\s*/?>|</(p|li|div|h\d|tr|td|th)>", "\n", raw)
    raw = re.sub(r"(?s)<[^>]+>", " ", raw)
    raw = html.unescape(raw)
    raw = re.sub(r"[ \t\r\f\v]+", " ", raw)
    return re.sub(r"\n\s*\n+", "\n", raw)


def sentences(txt: str):
    out = []
    for part in re.split(r"(?<=[.!?])\s+|\n", txt):
        p = part.strip()
        if 12 < len(p) < 600 and KEYS.search(p) and p not in out:
            out.append(p)
    return out


def main(args):
    pairs = list(zip(args[0::2], args[1::2]))
    for name, url in pairs:
        req = urllib.request.Request(url, headers={"User-Agent": UA,
                                                   "Accept": "text/html,application/xhtml+xml,application/pdf,application/json;q=0.9,*/*;q=0.8",
                                                   "Accept-Language": "en-US,en;q=0.8"})
        status, body, ctype = None, b"", ""
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                status, body, ctype = r.status, r.read(), r.headers.get("Content-Type", "")
        except urllib.error.HTTPError as e:
            status, body = e.code, e.read() if hasattr(e, "read") else b""
        except Exception as e:  # noqa: BLE001
            status = f"ERR {type(e).__name__}: {e}"
        ext = ".pdf" if "pdf" in ctype else ".json" if "json" in ctype else ".html"
        path = DL / f"{name}{ext}"
        if body:
            path.write_bytes(body)
        raw = body.decode("utf-8", "replace") if ext != ".pdf" else ""
        txt = text_of(raw) if raw else ""
        sents = sentences(txt) if txt else []
        bot = bool(BOT.search(raw[:20000])) and len(sents) < 2
        verdict = ("refused" if (not isinstance(status, int) or status >= 400 or bot)
                   else ("words-found" if sents else "no-words"))
        with LOG.open("a", encoding="utf-8") as f:
            f.write(f"{name}\t{url}\t{status}\t{len(body)}\t{verdict}\n")
        print(f"=== {name} {status} {len(body)}B {verdict} {url}")
        for s in sents[:40]:
            print("  -", s[:400])


if __name__ == "__main__":
    main(sys.argv[1:])
