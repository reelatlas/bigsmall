import struct, sys, os, glob
root = sys.argv[1]
for brand in sorted(os.listdir(root)):
    d = os.path.join(root, brand)
    out = []
    for p in sorted(glob.glob(os.path.join(d, '*.png'))):
        with open(p, 'rb') as f:
            head = f.read(24)
        w, h = struct.unpack('>II', head[16:24])
        out.append('%s %dx%d' % (os.path.basename(p).replace('screenshot-', 's').replace('.png', ''), w, h))
    print(brand, '|', ', '.join(out))
