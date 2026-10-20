#!/bin/sh
# usage: fetch.sh name url  -> downloads/name.html, logs status to fetchlog.tsv
D="$(dirname "$0")/../downloads"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
code=$(curl -s -L --max-time 30 -A "$UA" -H "Accept-Language: en-US,en;q=0.9" -H "Accept: text/html,application/xhtml+xml" -o "$D/$1.html" -w "%{http_code} %{size_download} %{url_effective}" "$2")
printf "%s\t%s\t%s\t%s\n" "$(date +%F)" "$1" "$2" "$code" >> "$(dirname "$0")/../fetchlog.tsv"
echo "$1 $code"
