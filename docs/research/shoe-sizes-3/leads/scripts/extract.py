"""Print sizing snippets from saved downloads.
Usage: python -I extract.py <file> [maxsnips] [extra-regex]
HTML: strips tags, prints sentences matching sizing words.
Reddit JSON: prints the post and every comment (author hidden), trimmed.
"""
import html, json, os, re, sys

KEY = re.compile(r"(true to size|\btts\b|runs? (small|large|big|long|short|narrow|wide)|"
                 r"half[- ]size|size (up|down)|go (up|down)|sized? (up|down)|"
                 r"foot length|\bcm\b|centimet|inches|\bmondopoint|fits? (small|large|big)|"
                 r"compared to|than (nike|adidas)|same size)", re.I)


def text_of(raw):
    raw = re.sub(r"(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", raw)
    raw = re.sub(r"(?i)<br\s*/?>|</(p|div|li|tr|h\d|td|th)>", "\n", raw)
    raw = re.sub(r"(?s)<[^>]+>", " ", raw)
    raw = html.unescape(raw)
    raw = re.sub(r"[ \t\r\f\v]+", " ", raw)
    return re.sub(r"\n\s*\n+", "\n", raw)


def walk(node, out, depth=0):
    if isinstance(node, dict):
        d = node.get("data", {})
        if node.get("kind") == "t1":
            out.append((depth, d.get("score"), d.get("body", "")))
            rep = d.get("replies")
            if rep:
                walk(rep, out, depth + 1)
        elif node.get("kind") == "t3":
            out.append((0, d.get("score"), "POST: " + d.get("title", "") + " || " + d.get("selftext", "")))
        elif node.get("kind") == "Listing":
            for c in d.get("children", []):
                walk(c, out, depth)
    elif isinstance(node, list):
        for x in node:
            walk(x, out, depth)


def main():
    p = sys.argv[1]
    mx = int(sys.argv[2]) if len(sys.argv) > 2 else 60
    extra = re.compile(sys.argv[3], re.I) if len(sys.argv) > 3 else None
    raw = open(p, encoding="utf-8", errors="replace").read()
    if p.endswith(".json"):
        try:
            data = json.loads(raw)
        except Exception as e:
            print("NOT JSON", e, raw[:300]); return
        out = []
        walk(data, out)
        for i, (dep, sc, body) in enumerate(out[:mx]):
            b = re.sub(r"\s+", " ", body)[:500]
            print(f"[{i} d{dep} s{sc}] {b}")
        print("TOTAL comments+post:", len(out))
        return
    t = text_of(raw)
    lines = [l.strip() for l in t.split("\n") if l.strip()]
    n = 0
    for i, l in enumerate(lines):
        if KEY.search(l) or (extra and extra.search(l)):
            print(f"[{i}] {l[:400]}")
            n += 1
            if n >= mx:
                break
    print("lines:", len(lines), "matches shown:", n)


if __name__ == "__main__":
    main()
