#!/bin/sh
# usage: fetch.sh NAME URL ; saves to downloads/NAME.html, logs status to scripts/fetchlog.tsv
D="$SCRATCHPAD/shoe-sizes-2/brands-b"
out="$D/downloads/$1.html"
code=$(curl -sS -L --max-time 30 -o "$out" -w '%{http_code}' \
  -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' \
  -H 'Accept: text/html,application/xhtml+xml' -H 'Accept-Language: en-US,en;q=0.9' "$2" 2>&1)
size=$(wc -c < "$out" 2>/dev/null)
printf '%s\t%s\t%s\t%s\t%s\n' "$(date -u +%FT%TZ)" "$1" "$2" "$code" "$size" >> "$D/scripts/fetchlog.tsv"
printf '%s %s %s\n' "$1" "$code" "$size"
