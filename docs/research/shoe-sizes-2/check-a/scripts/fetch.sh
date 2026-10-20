#!/bin/bash
# usage: fetch.sh <pages.txt> <downloads dir> ; fetches each page once, in parallel, with a generic browser UA (nothing personal)
L="$1"; D="$2"
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
while IFS='|' read -r name url; do
  [ -z "$name" ] && continue
  ( r=$(curl -sS -L --compressed --max-time 60 -A "$UA" \
      -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
      -H 'Accept-Language: en;q=0.9' \
      -D "$D/$name.headers.txt" -o "$D/$name.html" \
      -w '%{http_code} %{size_download} %{url_effective}' "$url" 2>&1)
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $name $r" >> "$D/fetch-log.txt" ) &
done < "$L"
wait
