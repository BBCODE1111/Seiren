// Test-only SMF controller reader; do not import in product code.
export function midiControls(bytes){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),ppq=view.getUint16(12),count=view.getUint16(10),controls=[];let pos=14;
 const vlq=()=>{let n=0,b;do{b=bytes[pos++];n=(n<<7)|(b&127);}while(b&128);return n;};
 for(let track=0;track<count;track++){
  const end=pos+8+view.getUint32(pos+4);pos+=8;let tick=0,running=0;
  while(pos<end){tick+=vlq();let status=bytes[pos++];if(status<128){pos--;status=running;}else if(status<240)running=status;
   if(status===255){pos++;const size=vlq();pos+=size;continue;}
   if(status===240||status===247){const size=vlq();pos+=size;continue;}
   const a=bytes[pos++],b=[12,13].includes(status>>4)?undefined:bytes[pos++];
   if(status>>4===11)controls.push({track,channel:status&15,tick,controller:a,value:b});
  }pos=end;
 }return {ppq,controls};
}
