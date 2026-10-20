# Parse HOKA's pasted inch rows (a whole-inch line, then its fraction on the next line)
# and compare each inch value, converted exactly (25.4 mm), with the cm or mm row of the
# same table's cm toggle. A reader of a source file: run with python -I.
import re
import sys
from fractions import Fraction

text = open(sys.argv[1], encoding='utf-8').read()
sections = {s.split('\n', 1)[0].strip(): s for s in re.split(r'^## ', text, flags=re.M)}
LABELS = ['Foot Length (IN)', 'Regular Width Length (IN)', 'D Width Length (IN)',
          'Wide Width Length (IN)', 'X-Wide Width Length (IN)', 'US\t']


def sec(prefix):
    for k, v in sections.items():
        if k.startswith(prefix):
            return v
    raise SystemExit('no section ' + prefix)


def inch_row(s, label):
    i = s.index('\n' + label) + 1 + len(label)
    j = min([k for k in (s.find('\n' + nl, i) for nl in LABELS) if k != -1] + [len(s)])
    vals = []
    for t in [t.strip() for t in re.split(r'[\t\n]', s[i:j]) if t.strip()]:
        m = re.fullmatch(r'(\d+)"', t)
        if m:
            vals.append(Fraction(int(m.group(1))))
            continue
        m = re.fullmatch(r'(\d+)/(\d+)', t)
        if m:
            vals[-1] += Fraction(int(m.group(1)), int(m.group(2)))
            continue
        raise SystemExit('unexpected token %r' % t)
    return vals


def num_row(s, label):
    line = [l for l in s.split('\n') if l.startswith(label + '\t')][0]
    return [x.strip() for x in line.split('\t')[1:] if x.strip()]


def label_of(v):
    w = int(v)
    f = v - w
    return '%d %s' % (w, f) if f else '%d' % w


def compare(prefix, in_label, cm_label, unit):
    s_in, s_cm = sec(prefix + ', in'), sec(prefix + ', cm')
    ins = inch_row(s_in, in_label)
    cms = [float(x) for x in num_row(s_cm, cm_label)]
    us = num_row(s_in, 'US')
    scale = 25.4 if unit == 'mm' else 2.54
    diffs = [float(v) * scale - c for v, c in zip(ins, cms)]
    print('%s | %s: %d inch values, %d %s values, %d US columns' %
          (prefix, in_label, len(ins), len(cms), unit, len(us)))
    print('   inch minus %s, per column: %s' % (unit, ' '.join('%+.1f' % d for d in diffs)))
    print('   min %+.2f max %+.2f' % (min(diffs), max(diffs)))
    return ins, cms, us


w_in, w_cm, w_us = compare('Women, Footwear, Regular', 'Foot Length (IN)', 'Foot Length (CM)', 'cm')
print('   women regular US %s: %s in = %.2f cm; cm row %s' %
      (w_us[6], label_of(w_in[6]), float(w_in[6]) * 2.54, w_cm[6]))
compare('Women, Footwear, Regular', 'Regular Width Length (IN)', 'Regular Width Length (MM)', 'mm')
compare('Women, Footwear, Wide', 'D Width Length (IN)', 'D Width Length (MM)', 'mm')
m_in, m_cm, m_us = compare('Men, Footwear, Regular', 'Foot Length (IN)', 'Foot Length (CM)', 'cm')
print('   men regular US %s: %s in = %.2f cm; cm row %s' %
      (m_us[10], label_of(m_in[10]), float(m_in[10]) * 2.54, m_cm[10]))
r_in, r_mm, r_us = compare('Men, Footwear, Regular', 'Regular Width Length (IN)', 'Regular Width Length (MM)', 'mm')
print('   men regular width US %s: %s in = %.2f mm; mm row %s' %
      (r_us[10], label_of(r_in[10]), float(r_in[10]) * 25.4, r_mm[10]))
compare('Men, Footwear, Wide', 'Wide Width Length (IN)', 'Wide Width Length (MM)', 'mm')
compare('Men, Footwear, Wide', 'X-Wide Width Length (IN)', 'X-Wide Width Length (MM)', 'mm')
a_in, a_cm, a_us = compare('All Gender, Footwear, Regular', 'Foot Length (IN)', 'Foot Length (CM)', 'cm')
print('   all-gender: first US column %s, first length %s in / %s cm; last US column %s has no length: %s' %
      (a_us[0], label_of(a_in[0]), a_cm[0], a_us[-1], len(a_in) < len(a_us)))
print('   all-gender lengths equal the men\'s regular lengths: in %s, cm %s' % (a_in == m_in, a_cm == m_cm))
compare('All Gender, Footwear, Regular', 'Regular Width Length (IN)', 'Regular Width Length (MM)', 'mm')
