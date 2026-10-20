import sys, os, json, gzip, zlib, urllib.request, urllib.error, concurrent.futures, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
def get(name, url, lang='en-US,en;q=0.9', accept='text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': accept, 'Accept-Language': lang, 'Accept-Encoding': 'gzip, deflate'})
    out = {'name': name, 'url': url}
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            body = r.read(); status = r.status; hdrs = dict(r.headers); final = r.geturl()
    except urllib.error.HTTPError as e:
        body = e.read(); status = e.code; hdrs = dict(e.headers); final = url
    except Exception as e:
        out.update({'status': 'error', 'error': repr(e)}); return out
    enc = hdrs.get('Content-Encoding', hdrs.get('content-encoding', ''))
    try:
        if 'gzip' in enc: body = gzip.decompress(body)
        elif 'deflate' in enc: body = zlib.decompress(body)
    except Exception as e:
        out['decode_error'] = repr(e)
    with open(os.path.join(common.DL, name), 'wb') as f:
        f.write(body)
    out.update({'status': status, 'final': final, 'bytes': len(body), 'ctype': hdrs.get('Content-Type', hdrs.get('content-type', '')),
                'server': hdrs.get('Server', hdrs.get('server', '')), 'time': datetime.datetime.now().isoformat(timespec='seconds')})
    return out
if __name__ == '__main__':
    jobs = json.load(open(sys.argv[1], encoding='utf-8'))
    with concurrent.futures.ThreadPoolExecutor(6) as ex:
        results = list(ex.map(lambda j: get(*j), jobs))
    log = os.path.join(common.CB, 'scripts', 'fetch_log.json')
    prev = json.load(open(log, encoding='utf-8')) if os.path.exists(log) else []
    json.dump(prev + results, open(log, 'w', encoding='utf-8'), indent=1)
    for r in results: print(json.dumps(r))
