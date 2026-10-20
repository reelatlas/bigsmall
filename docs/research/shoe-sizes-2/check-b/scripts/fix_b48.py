import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common
res = json.load(open(common.RES, encoding='utf-8'))
r = dict(res['B48'])
r['note'] = r['note'].replace(
    "Confirmed: the file is chosen by the storefront's locale, not by detecting the visitor:",
    "Confirmed: the file is keyed to the page's locale code (the storefront's, read through the page's i18n locale hook; en-US on crocs.com):")
common.record([r])
common.log_source(dict(what='Crocs i18n module (590327) in 3y8l25oymy2hd.js', url='https://www.crocs.com/_next/static/immutable/chunks/3y8l25oymy2hd.js', file='check-b/downloads/crocs_js/3y8l25oymy2hd.js',
                       tool='script (already downloaded; read as text)', gave='the locale hook the region map is keyed on is the i18n library, so the key is the page locale; B48 note made precise'))
print(res['B48']['note'][:120], '->', json.load(open(common.RES, encoding='utf-8'))['B48']['note'][:160])
