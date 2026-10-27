import json,sys
NAMES='C Db D Eb E F Gb G Ab A Bb B'.split()
nm=lambda p:NAMES[p%12]+str(p//12-1)
HARSH={1:'m2',11:'M7',13:'m9',6:'TT'}
def analyze(run,verbose=False):
    mel=run['notes'];acc=run['accompaniment'];issues=[];
    for a in acc:
        for m in mel:
            ov=min(a['end'],m['end'])-max(a['start'],m['start'])
            if ov<=0.12: continue
            d=abs(m['pitch']-a['pitch']);ic=d%12
            lab=None
            if d in(1,2) : lab='2nd-close'      # within a whole step, same register
            if d in(1,13,11,23): lab=HARSH.get(d%12 if d<12 else d-12, None) or ('m9' if d==13 else 'M7')
            if d==1 or d==13: lab='m2/m9'
            elif d==11 or d==23: lab='M7'
            elif d==6 or d==18: lab='TT'
            elif d==2: lab='M2-close'
            if a['pitch']>m['pitch'] and a.get('role')!='bass': lab=(lab+'+' if lab else '')+'above-melody'
            if lab: issues.append(dict(acc=nm(a['pitch']),mel=nm(m['pitch']),t=round(max(a['start'],m['start']),2),ov=round(ov,2),chord=a.get('chord'),kind=lab))
    # rhythm: accompaniment onset off 16th grid
    off=[a for a in acc if abs(a['start']*4-round(a['start']*4))>0.05]
    return issues,off
if __name__=='__main__':
    d=json.load(open(sys.argv[1]))
    for r in d['runs']:
        iss,off=analyze(r)
        chords=' | '.join(' '.join(c['symbol']+(':'+str(c['beats']) if c['beats']!=r['barBeats'] else '') for c in b['chords']) for b in r['bars'])
        print(f"== {r['label']} pattern={r['pattern']} | {chords}")
        print('  acc notes',len(r['accompaniment']),'clashes',len(iss),'offgrid',len(off))
        for i in iss[:12]: print('   ',i)
        if '-v' in sys.argv:
            for a in sorted(r['accompaniment'],key=lambda a:a['start']): print('    A',nm(a['pitch']),round(a['start'],2),round(a['end'],2),a.get('role'),a.get('chord'))
