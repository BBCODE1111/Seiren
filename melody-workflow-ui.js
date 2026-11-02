// Presentation and playback navigation. The original controllers own music and edits.
export function mountMelodyWorkflow(lab) {
 const $=id=>document.getElementById(id),host=$('melodyWorkspace');
 const steps=document.createElement('div');steps.className='melody-steps';
 steps.innerHTML='<strong>旋律 → 和弦</strong><span id="melodyStep" role="status"></span><span class="workflow-route">① 加入旋律　② 核對拍點　③ 配和弦　④ 試聽／匯出</span>';
 host.querySelector('.seiren-topbar').prepend(steps);
 const text={generate:'產生和弦', 'ml-new':'畫旋律','ml-demo':'旋律範例','ml-audio':'錄音範例','ml-confirm':'確認旋律，開始配和弦','ml-basic':'重新配和弦','ml-fit':'完整旋律','ml-set-downbeat':'設為第 1 拍',saveProject:'儲存專案',dockMidi:'匯出 MIDI'};
 for(const [id,label]of Object.entries(text))$(id).textContent=label;
 $('ml-file').closest('label').firstChild.textContent='匯入旋律';
 host.querySelector('.seiren-empty h2').textContent='先放進你的旋律';
 host.querySelector('.seiren-empty p').textContent='匯入 MIDI 或清楚的單聲部錄音，也可以直接畫音符。';
 const ideas=host.querySelector('.seiren-ideas');document.querySelector('.quick-entry').append(ideas);
 const score=host.querySelector('.score');host.querySelector('.seiren-editor').before(score);
 const scoreTools=document.createElement('div');scoreTools.className='melody-score-tools';
 scoreTools.innerHTML='<strong>和弦譜</strong><span>左右滑動 · 點和弦可編輯／鎖定</span><button id="followPlayback" type="button" aria-pressed="true">跟隨播放</button>';
 score.prepend(scoreTools);
 const versions=document.createElement('details');versions.className='harmony-versions';
 versions.innerHTML='<summary>比較和弦版本</summary><div><label>最近六個版本<select id="harmonyVersions" aria-label="和弦版本"></select></label><button id="recallHarmony" type="button" disabled>套用並比較</button><button id="workflowUndo" type="button">還原上一步</button></div><p id="harmonyChanges"></p>';
 host.querySelector('.seiren-editor').prepend(versions);$('workflowUndo').onclick=()=>$('undo').click();
 const audition=document.createElement('div');audition.className='melody-audition';
 audition.append($('ml-listen').closest('label'));
 const solo=document.createElement('button');solo.id='melodySolo';solo.type='button';solo.textContent='只聽旋律';solo.setAttribute('aria-pressed','false');
 solo.onclick=()=>{lab.solo=!lab.solo;solo.setAttribute('aria-pressed',String(lab.solo));solo.textContent=lab.solo?'恢復和弦伴奏':'只聽旋律';if(lab.solo)lab.setMuted(false);lab.onMix(false);if($('play').getAttribute('aria-pressed')!=='true')$('play').click();};
 audition.append(solo,$('ml-source-help'));host.querySelector('.roll-tools').after(audition);
 const sync=()=>{
  const busy=lab.busy,review=lab.reviewRequired,ready=lab.active;
  $('melodyStep').textContent=busy?'正在分析旋律…':review?'請核對旋律、速度與第 1 拍，再確認':ready?'旋律已就緒 · 生成只改和弦':'匯入、畫旋律，或試用範例';
  $('generate').disabled=busy||review||lab.kind==='manual'&&!ready;
  solo.disabled=busy||!ready;audition.hidden=!ready;
  for(const b of host.querySelectorAll('[data-compare-style]'))b.disabled=busy||review;
  for(const id of ['loadPreset','nextSong','recallHarmony'])$(id).disabled=busy||review||(id==='recallHarmony'&&!$('harmonyVersions').value);
 };
 host.addEventListener('melodystate',sync);
 new MutationObserver(sync).observe($('grid'),{childList:true});sync();
 let follow=true;
 const button=$('followPlayback'),grid=$('grid');
 const move=()=>{
  if(!follow||$('play').getAttribute('aria-pressed')!=='true'||$('position').textContent.startsWith('SCALE'))return;
  const beat=Number($('position').dataset.beat),beats=lab.active?lab.meter.numerator*4/lab.meter.denominator:4;
  if(!Number.isFinite(beat))return;
  const bar=grid.querySelector('[data-index="'+(beat<0?-1:Math.floor(beat/beats))+'"]');
  if(bar){const r=bar.getBoundingClientRect(),g=grid.getBoundingClientRect();if(r.left<g.left||r.right>g.right)grid.scrollLeft+=r.left-g.left;}
  lab.roll.setPlayhead(beat);
 };
 const setFollow=value=>{follow=value;lab.roll.followPlayback=value;button.setAttribute('aria-pressed',String(value));button.textContent=value?'跟隨播放':'回到播放';if(value)move();};
 button.onclick=()=>setFollow(!follow);
 for(const el of [grid,lab.roll.scroll]){
  for(const event of ['pointerdown','wheel','touchstart'])el.addEventListener(event,()=>{if($('play').getAttribute('aria-pressed')==='true')setFollow(false);},{passive:true});
  el.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key))setFollow(false);});
 }
 new MutationObserver(move).observe($('position'),{attributes:true,attributeFilter:['data-beat']});
 new MutationObserver(()=>{if($('play').getAttribute('aria-pressed')==='true')setFollow(true);}).observe($('play'),{attributes:true,attributeFilter:['aria-pressed']});
}
