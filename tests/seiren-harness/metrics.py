import json,glob,sys,collections,statistics as st
NAMES='C Db D Eb E F Gb G Ab A Bb B'.split();nm=lambda p:NAMES[p%12]+str(p//12-1)
def structural(m): return (m['end']-m['start'])>=0.45 or abs(m['start']-round(m['start']))<0.08
def chart_segments(bars,bb):
    seg=[];t=0
    for b in bars:
        u=t
        for c in b['chords']: seg.append((u,u+c['beats'],c['symbol']));u+=c['beats']
        t+=bb
    return seg
def metrics(notes,run):
    acc=run['acc'];bb=run['barBeats'];segs=chart_segments(run['bars'],bb)
    melT=sum(m['end']-m['start'] for m in notes) or 1
    semi=0;close=0;above=0;struct_semi=0;events=[]
    for m in notes:
        sm=structural(m)
        for a in acc:
            ov=min(a['end'],m['end'])-max(a['start'],m['start'])
            if ov<=0.1: continue
            d=a['pitch']-m['pitch'];pc=(a['pitch']-m['pitch'])%12
            if pc in(1,11):
                semi+=ov
                if sm: struct_semi+=ov; events.append((round(max(a['start'],m['start']),2),nm(m['pitch']),nm(a['pitch']),a.get('chord'),a.get('role')))
            if abs(d)<=2 and a.get('role')!='bass': close+=ov
            if d>0 and a.get('role')!='bass': above+=ov
    on=[a['start'] for a in acc]
    offgrid=sum(1 for x in on if abs(x*4-round(x*4))>0.06)/max(1,len(on))
    # bleed: acc note of chord X sounding past its segment end into a different chord
    bleed=0
    for a in acc:
        for s0,s1,sym in segs:
            if s0-1e-6<=a['start']<s1-1e-6:
                if a['end']>s1+0.1 and a.get('chord')==sym:
                    nxt=[s for s in segs if s[0]>=s1-1e-6]
                    if nxt and nxt[0][2]!=sym: bleed+=1
                break
    frac=[c for b in run['bars'] for c in b['chords'] if abs(c['beats']-round(c['beats']))>1e-6]
    return dict(semi=semi/melT,struct_semi=struct_semi/melT,close=close/melT,above=above/melT,offgrid=offgrid,bleed=bleed,frac=len(frac),nacc=len(acc),events=events)
if __name__=='__main__':
    files=sorted(glob.glob(sys.argv[1]+'/*.json'))
    agg=collections.defaultdict(list);persample=[]
    for f in files:
        d=json.load(open(f))
        rows=[]
        for r in d['runs']:
            mt=metrics(d['notes'],r);st_=r['label'].split('#')[0];agg[st_].append(mt);rows.append((r['label'],mt))
        de=rows[0][1]
        persample.append((d['sample'][:44],d['pre']['bpm'],d['pre']['key'],len(d['notes']),de,st.mean(x[1]['struct_semi'] for x in rows),st.mean(x[1]['above'] for x in rows)))
    print('PER SAMPLE (default chart+ballad | mean over all styles)')
    for s,bpm,k,n,de,ms,ma in persample: print(f"{s:44s} bpm={bpm:6} key={NAMES[k['root']]}{'m' if k['mode']=='minor' else ''} notes={n:3d}  def: semi={de['struct_semi']:.2f} above={de['above']:.2f} | styles: semi={ms:.2f} above={ma:.2f}")
    print('\nPER STYLE (mean over samples×3 variations): struct semitone friction / close-voicing / above-melody / offgrid / bleed / fractional chords')
    for k,v in sorted(agg.items(),key=lambda kv:-st.mean(x['struct_semi'] for x in kv[1])):
        print(f"{k:22s} semi={st.mean(x['struct_semi'] for x in v):.3f} close={st.mean(x['close'] for x in v):.2f} above={st.mean(x['above'] for x in v):.2f} offgrid={st.mean(x['offgrid'] for x in v):.2f} bleed={st.mean(x['bleed'] for x in v):.1f} frac={st.mean(x['frac'] for x in v):.1f}")
