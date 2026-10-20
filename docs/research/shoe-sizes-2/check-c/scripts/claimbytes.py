import csv, sys
with open(sys.argv[1], encoding='utf-8', newline='') as f:
    for x in csv.DictReader(f):
        if x['id'] in ('C78', 'C114'):
            print(x['id'], ascii(x['value']))
