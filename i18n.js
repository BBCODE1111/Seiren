import {copy} from './i18n-catalog.js?v=glass-language-4';

const exact=new Map();
for(const row of copy)for(const alias of row)if(!exact.has(alias))exact.set(alias,row);
const chineseFragments=copy.flatMap(row=>row.filter(alias=>/[\u3400-\u9fff]/u.test(alias)&&alias.length>=6).map(alias=>[alias,row[1]])).sort((a,b)=>b[0].length-a[0].length);
const phrases=[
 ['保留音高變速：','Pitch-preserving tempo: '],['原音保留音高變速 · ','Preparing original audio · '],
 ['%。首次播放需短暫處理。','%. First playback needs a moment to prepare. '],['% · 可按 STOP 取消','% · Press Stop to cancel'],
 ['% · 檔案只留在瀏覽器','% · Your file stays in this browser'],['正在讀取 ','Reading '],
 ['原音保留音高變速支援 ','Pitch-preserving audio supports '],[' BPM；目前可使用 MIDI 旋律。',' BPM; MIDI melody is available at this tempo.'],
 [' · 調性建議 ',' · Suggested keys: '],[' · 分析建議 ',' · Analysis suggests: '],[' · 調性 ',' · Key: '],
 ['來源：檔名標記','Source: filename'],['來源：手動 / TAP 修正','Source: manual / tapped tempo'],['來源：手動修正','Source: manual'],['來源：音訊起音追蹤','Source: audio onset tracking'],['候選，請確認','Candidate; please confirm'],
 [' · 確認後變速保留小節數。',' · Tempo changes preserve bar count after confirmation.'],[' · 保留 ',' · Preserving '],[' 段速度變化',' tempo changes'],
 [' 拍 · 追蹤信心 ',' beats · Tracking confidence '],[' BPM · 一致性 ',' BPM · Consistency '],
 ['與旋律同步 · ','Synced with melody · '],['已切換到 ','Switched to '],['；旋律與拍點保持原樣。','; melody and timing are unchanged.'],
 [' · 已更新上方和弦，旋律保持原樣。',' · Harmony updated; melody unchanged.'],[' · 變體 ',' · Variation '],
 ['起點 · ','Starting point · '],['版本 ','Version '],['靈感起點 · ','Inspiration · '],
 ['試聽 · 旋律 ','Listening · Melody '],['% / 和聲 ','% / Harmony '],['試聽未完成：','Playback failed: '],
 ['專案設定無效：','Invalid project setting: '],['專案未能還原，原始內容已嘗試保留於復原備份：','Could not restore the project; attempted to keep the original in a recovery backup: '],
 [' · 旋律保護已啟用：不相容的和弦或延伸音會改配。',' · Melody protection is on: incompatible chords or extensions are adjusted.'],
 [' 組範例 · ',' ideas · '],['明亮／憂鬱／夢幻／張力交錯輪替。','Alternates bright, wistful, dreamy and tense ideas.'],['猛烈／陰鬱／詭異／莊嚴交錯輪替。','Alternates intense, dark, eerie and solemn ideas.'],
 ['可自由編輯；播放中按 INSPIRE 直接換組。','Edit freely; use Next idea to switch during playback.'],
 ['原創旋律','Original melody'],['自編旋律','Drawn melody'],['休止','Rest'],['大調','major'],['小調','minor'],
 ['信心高','High confidence'],['信心中','Medium confidence'],['信心低','Low confidence'],['紅點 = 根音','Red dots = roots']
];
const zhDynamic=[
 [/^(\d+) accompaniment notes · (\d+) adjusted · (\d+) omitted$/,(_,a,b,c)=>`${a} 個伴奏音符 · ${b} 個調整 · ${c} 個省略`],
 [/^READY · BAR (\d+)$/,(_,n)=>`就緒 · 第 ${n} 小節`],
 [/^LOADING PIANO$/,()=> '載入鋼琴中'],
 [/^FROM BAR (\d+) \/ (\d+)$/,(_,a,b)=>`從第 ${a} 小節／共 ${b} 小節`],
 [/^BAR (\d+)(.*)$/,(_,n,rest)=>`第 ${n} 小節${rest.replace(' · BEAT ',' · 第 ').replace(/ · 第 (\d+)$/, ' · 第 $1 拍').replace(' · PICKUP ',' · 弱起 ')}`],
 [/^COUNT-IN · (.+)$/,(_,n)=>`預備拍 · ${n}`],
 [/^(\d+) OCT$/,(_,n)=>`${n} 個八度`],
 [/^(.*) · (\d+) NOTES · (\d+) BARS(.*)$/,(_,name,n,b,rest)=>`${name} · ${n} 個音符 · ${b} 小節${rest.replace('BAR 0','第 0 小節').replace('beats','拍')}`],
 [/^(\d+) notes selected(.*)$/i,(_,n,rest)=>`已選取 ${n} 個音符${rest}`],
 [/^(.*?) · BEAT ([\d.-]+) · LENGTH ([\d.]+)$/,(_,name,beat,len)=>`${name} · 起始 ${beat} 拍 · 音長 ${len} 拍`],
 [/^(ORIGINAL|STYLE|COLOR|ii–V|TRITONE) · OPTIONS$/,(_,method)=>`${exact.get(method)?.[0]||method} · 選項`]
];
const enDynamic=[
 [/從第 (\d+) 小節開始/g,'Start from bar $1'],[/第 (\d+) 小節和弦/g,'Chords in bar $1'],
 [/旋律音符 (\d+) (.*?)，起始 ([\d.-]+) 拍，長度 ([\d.]+) 拍/g,'Melody note $1 $2, start $3 beats, duration $4 beats'],
 [/編輯第 (\d+) 音 (.*)/g,'Edit note $1 $2'],[/第 (\d+) 小節：/g,'Bar $1: '],[/ · 第 ([\d.]+) 拍/g,' · Beat $1'],
 [/第 (\d+–\d+) 格 · 上行練習/g,'Frets $1 · Ascending study'],
 [/速度 ([\d.]+) BPM/g,'Tempo $1 BPM'],[/每拍 ([\d.]+) 秒 · 4\/4 每小節 ([\d.]+) 秒。播放中可直接變速。/g,'$1 seconds per beat · $2 seconds per 4/4 bar. Tempo can change during playback.']
];

export function translate(text,language='zh-Hant'){
 const s=text.trim();if(!s)return text;
 const english=language==='en',row=exact.get(s);
 let out=row?row[english?1:0]:s;
 if(!row){
  // Existing pattern captions already carry two complete languages. Keep their stable codes.
  const pattern=s.match(/^((?:S-POP \d+|TEXTURE) · )(.+) \/ ([^/]*[\u3400-\u9fff][^/]*)$/u);
  if(pattern)out=pattern[1]+pattern[english?2:3];
  else if(english&&/[\u3400-\u9fff]/u.test(s)){
   for(const [zh,en]of chineseFragments)out=out.split(zh).join(en);
   for(const [zh,en]of phrases)out=out.split(zh).join(en);
   for(const [rx,replacement]of enDynamic)out=out.replace(rx,replacement);
  }else if(!english)for(const [rx,replacement]of zhDynamic)out=out.replace(rx,replacement);
  // Captions and example names contain independently translated semantic segments.
  out=out.split(/( · |・)/).map(part=>exact.get(part)?.[english?1:0]||part).join('');
 }
 return text.slice(0,text.indexOf(s))+out+text.slice(text.indexOf(s)+s.length);
}

export function mountLanguage(){
 let language='zh-Hant';try{if(localStorage.getItem('seiren-language')==='en')language='en';}catch{}
 const sources=new WeakMap(),attributes=new WeakMap();
 const ignored=el=>!el||el.closest('[data-no-i18n],script,style,textarea,code,#ml-track option');
 function textNode(node){
  if(ignored(node.parentElement))return;
  const current=node.nodeValue,old=sources.get(node),source=old&&current===old.rendered?old.source:current;
  let output=translate(source,language);
  if(node.parentElement.matches('#voicing option[value="close"]'))output=language==='en'?'CLOSE':'密集';
  // File/track names are user data, even when they happen to contain a UI phrase.
  if(node.parentElement.id==='ml-status'){
   const m=source.match(/^(.*?)( · \d+ NOTES · .*)$/);
   if(m)output=m[1]+translate(m[2],language).replace(/(\d+) NOTES · (\d+) BARS/,language==='en'?'$1 NOTES · $2 BARS':'$1 個音符 · $2 小節');
  }
  const option=node.parentElement;
  if(option.tagName==='OPTION'&&output!==current&&!option.hasAttribute('value'))option.value=option.textContent;
  sources.set(node,{source,rendered:output});if(current!==output)node.nodeValue=output;
 }
 function element(el){
  if(ignored(el))return;
  const saved=attributes.get(el)||{};
  for(const key of ['title','aria-label','placeholder','label'])if(el.hasAttribute(key)){
   const value=el.getAttribute(key),old=saved[key],source=old&&value===old.rendered?old.source:value;
   const output=translate(source,language);saved[key]={source,rendered:output};if(value!==output)el.setAttribute(key,output);
  }
  attributes.set(el,saved);
 }
 function visit(root){
  if(root.nodeType===3){textNode(root);return;}
  if(root.nodeType===1)element(root);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){if(node.nodeType===3)textNode(node);else element(node);}
 }
 const switcher=document.createElement('div');switcher.className='language-switch';switcher.dataset.noI18n='';switcher.setAttribute('role','group');
 for(const [code,label]of [['zh-Hant','中'],['en','EN']]){
  const button=document.createElement('button');button.type='button';button.textContent=label;button.lang=code;button.dataset.language=code;
  button.setAttribute('aria-label',code==='en'?'Switch to English':'切換繁體中文');button.onclick=()=>setLanguage(code);switcher.append(button);
 }
 document.querySelector('.seiren-header-actions').prepend(switcher);
 function setLanguage(next){
  language=next;document.documentElement.lang=language;
  document.title=language==='en'?'Seiren · The melody siren':'Seiren · 賽壬 旋律海妖';
  switcher.setAttribute('aria-label',language==='en'?'Interface language':'介面語言');
  for(const button of switcher.children)button.setAttribute('aria-pressed',String(button.dataset.language===language));
  try{localStorage.setItem('seiren-language',language);}catch{}
  visit(document.body);
 }
 // Only newly changed copy is visited during playback. Never re-render controls or the score.
 const observer=new MutationObserver(records=>{
  const roots=new Set();for(const r of records){if(r.type==='childList')for(const node of r.addedNodes)roots.add(node);else roots.add(r.target);}
  for(const node of roots)if(node.isConnected){if(node.nodeType===1&&records.some(r=>r.target===node&&r.type==='attributes'))element(node);else visit(node);}
 });
 setLanguage(language);
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder','label']});
 return {setLanguage,get language(){return language;},disconnect:()=>observer.disconnect()};
}
