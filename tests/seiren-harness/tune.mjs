import fs from 'fs';
const T=process.argv[2];const {chooseTempo,chooseDownbeat}=await import(T+'/transcription.js');const {tempoScore,trackBeats}=await import(T+'/audio-features.js');
const S=process.argv[3];
const truth=(set,sample)=>{const mp=Object.fromEntries(fs.readFileSync(`${S}/samples_${set}/map.txt`,'utf8').trim().split('\n').map(l=>l.split(' ')));const orig=mp[sample.replace('.wav','')];const m=orig.match(/_(\d{2,3})(?:_|Bpm)/);return {orig,bpm:/Female/.test(orig)?128:+m[1],db:set==='rec'?.43:0};};
let total=[0,0];
for(const [set,file] of [['nohint','dump_loops'],['rec','dump_rec']]){
 let ok=0,dbok=0;
 for(const r of JSON.parse(fs.readFileSync(`${S}/out/nohint/${file}.json`))){
  const t=truth(set,r.sample);const pick=chooseTempo(r.candFull,r.env.duration,r.env);
  const beats=trackBeats(r.env,pick.bpm).beats;const db=chooseDownbeat(r.audioNotes,pick.bpm,{loop:pick.loop||0,beats});
  const good=Math.abs(pick.bpm/t.bpm-1)<.03,bt=60/t.bpm,off=(db.downbeatTime-t.db)/bt,dgood=good&&Math.abs(off-Math.round(off/4)*4)<.15;
  ok+=good;dbok+=dgood;
  if(process.argv[4]==='-v')console.log(set.padEnd(6),t.orig.slice(0,40).padEnd(40),'true',t.bpm,'est',pick.bpm.toFixed(2).padStart(7),good?'OK ':'BAD','loop',(pick.loop||0).toFixed(2),'bar1',off.toFixed(2),dgood?'OK':'BAD',db.reason,'| cands',r.candFull.map(c=>c.bpm+':'+c.score.toFixed(2)).join(' '));
 }
 console.log(set,'tempo',ok,'/',13,' tempo+bar1',dbok,'/',13);total[0]+=ok;total[1]+=dbok;
}
console.log('TOTAL tempo',total[0],'/26  tempo+bar1',total[1],'/26');
