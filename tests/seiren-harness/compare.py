import json,glob,collections,statistics as st,os
from metrics import structural,chart_segments
def harsh(notes,run):
    acc=run['acc'];melT=sum(m['end']-m['start'] for m in notes) or 1;h=0;hs=0
    for m in notes:
        for a in acc:
            ov=min(a['end'],m['end'])-max(a['start'],m['start'])
            if ov<=0.1: continue
            d=a['pitch']-m['pitch']
            if (d%12==11) or abs(d)==1:
                h+=ov
                if structural(m): hs+=ov
    on=[a['start'] for a in acc];sw=sum(1 for x in on if 0.6<x%1<0.72)/max(1,len(on))
    return hs/melT,sw,len(acc)
def load(dirn):
    out=collections.defaultdict(list);bad=0;tot=0;persample={}
    for f in sorted(glob.glob(dirn+'/*.json')):
        d=json.load(open(f));rows=[]
        for r in d['runs']:
            hs,sw,n=harsh(d['notes'],r);out[r['label'].split('#')[0]].append((hs,sw,n));tot+=1;bad+=hs>0.05;rows.append(hs)
        persample[d['sample'][:40]]=(st.mean(rows),sum(x>0.05 for x in rows),d['pre']['bpm'])
    return out,bad,tot,persample
A,ba,ta,pa=load('../out/matrix');B,bb,tb,pb=load('../out/matrix_fixed')
print(f'runs with audible clash (>5% of melody time on structural notes): BEFORE {ba}/{ta} ({ba/ta:.0%})  AFTER {bb}/{tb} ({bb/tb:.0%})')
print(f'\n{"style":22s} clash% before→after   swung-offbeat% before→after   acc notes before→after')
rows=[]
for k in A:
    a=A[k];b=B.get(k,[])
    rows.append((st.mean(x[0] for x in a),k,st.mean(x[0] for x in b),st.mean(x[1] for x in a),st.mean(x[1] for x in b),st.mean(x[2] for x in a),st.mean(x[2] for x in b)))
for ha,k,hb,sa,sb,na,nb in sorted(rows,reverse=True)[:20]:
    print(f'{k:22s} {ha*100:5.1f} → {hb*100:4.1f}        {sa*100:5.1f} → {sb*100:4.1f}              {na:5.1f} → {nb:5.1f}')
print('\nper sample (mean clash%, #runs>5%, bpm):')
for s in pa: print(f'  {s:40s} {pa[s][0]*100:5.1f}% ({pa[s][1]:3d}) bpm {pa[s][2]}  →  {pb[s][0]*100:5.1f}% ({pb[s][1]:3d}) bpm {pb[s][2]}')
