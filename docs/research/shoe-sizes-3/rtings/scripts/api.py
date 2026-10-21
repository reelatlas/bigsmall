"""POST to RTINGS' public table-tool endpoint the way the table page does: /api/v2/safe/<name>
with {"variables": {...}}, no cookies, no credentials, nothing personal.
Usage: python -I api.py <name> <variables.json or inline JSON> <outfile>
"""
import json, os, sys, urllib.request

name, var_arg, out = sys.argv[1], sys.argv[2], sys.argv[3]
variables = json.load(open(var_arg, encoding="utf-8")) if os.path.exists(var_arg) else json.loads(var_arg)
body = json.dumps({"variables": variables}).encode()
req = urllib.request.Request(
    f"https://www.rtings.com/api/v2/safe/{name}",
    data=body,
    method="POST",
    headers={
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
        "Referer": "https://www.rtings.com/running-shoes/tools/table",
        "Origin": "https://www.rtings.com",
    },
)
with urllib.request.urlopen(req, timeout=60) as r:
    data = r.read()
    print(name, r.status, len(data))
open(out, "wb").write(data)
