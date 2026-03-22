const ASSETS={
  avatar:"assets/1001f723b829a10da2e47b0aae672ece_t4.mp4",
  background:"assets/Kyoukai no Kanata.gif",
  track:"assets/LyteSpeed feat. Punkinloveee - ILLUMINATI.mp3",
  cover:"assets/maxresdefault.jpg"
};

const PROFILE={
  username:"Olw",
  bio:"A good coder  •  I love technology",
  github:"https://github.com/olwmainclasses",
  telegram:"https://t.me/olwinf",
  discordTag:"im.olw"
};

const TAGS=["HvH <3","#Code","#M5Stack","#TeamPixel"];

const avatarImage=document.getElementById("avatarImage");
const avatarVideo=document.getElementById("avatarVideo");
const bgImage=document.getElementById("bgImage");
const username=document.getElementById("username");
const bio=document.getElementById("bio");
const githubLink=document.getElementById("githubLink");
const telegramLink=document.getElementById("telegramLink");
const discordCopy=document.getElementById("discordCopy");
const copiedTip=document.getElementById("copiedTip");

const intro=document.getElementById("intro");
const introBtn=document.getElementById("introBtn");
const app=document.getElementById("app");

const audio=document.getElementById("audio");
const playPause=document.getElementById("playPause");
const playIcon=document.getElementById("playIcon");
const progress=document.getElementById("progress");
const volume=document.getElementById("volume");
const volIcon=document.getElementById("volIcon");
const timeCurrent=document.getElementById("timeCurrent");
const timeTotal=document.getElementById("timeTotal");
const trackCover=document.getElementById("trackCover");
const trackTitle=document.getElementById("trackTitle");
const trackArtist=document.getElementById("trackArtist");

const tagsEl=document.getElementById("tags");

const panelEl=document.getElementById("panel");
const cardEl=document.querySelector(".card");
const playerCardEl=document.querySelector(".player-card");

const avatarSrc=encodeURI(ASSETS.avatar);
const avatarExt=(ASSETS.avatar.split("?")[0].split("#")[0].split(".").pop() || "").toLowerCase();
const isVideo=avatarExt==="mp4" || avatarExt==="webm" || avatarExt==="ogg";

if(isVideo){
  avatarVideo.src=avatarSrc;
  avatarVideo.style.display="block";
  avatarImage.style.display="none";
}else{
  avatarImage.src=avatarSrc;
  avatarImage.style.display="block";
  avatarVideo.style.display="none";
}

bgImage.src=encodeURI(ASSETS.background);

audio.src=encodeURI(ASSETS.track);

trackCover.src=encodeURI(ASSETS.cover);

function decodeFileNameFromPath(p){
  const raw=(p.split("/").pop() || "");
  try{return decodeURIComponent(raw)}catch(e){return raw}
}

function stripExt(n){
  const i=n.lastIndexOf(".");
  return i>=0 ? n.slice(0,i) : n;
}

function parseArtistTitle(name){
  const base=stripExt(name).trim();
  const parts=base.split(" - ");
  if(parts.length>=2){
    const artist=parts.shift().trim();
    const title=parts.join(" - ").trim();
    return {artist,title};
  }
  return {artist:"",title:base};
}

const meta=parseArtistTitle(decodeFileNameFromPath(ASSETS.track));
trackTitle.textContent=meta.title || "";
trackArtist.textContent=meta.artist || "";

function setCoverFromTags(picture){
  if(!picture || !picture.data) return false;
  const arr=new Uint8Array(picture.data);
  const type=picture.format || "image/jpeg";
  const blob=new Blob([arr],{type});
  trackCover.src=URL.createObjectURL(blob);
  return true;
}

function applyTextTags(tags){
  const t=(tags && (tags.title || tags.TIT2)) || "";
  const a=(tags && (tags.artist || tags.TPE1)) || "";
  if(t) trackTitle.textContent=String(t);
  if(a) trackArtist.textContent=String(a);
}

function tryReadWithJsMediaTags(){
  const lib=window.jsmediatags;
  if(!lib || !lib.read) return false;
  try{
    lib.read(audio.src,{
      onSuccess:(res)=>{
        const tags=(res && res.tags) || {};
        applyTextTags(tags);
        if(tags.picture) setCoverFromTags(tags.picture);
      },
      onError:()=>{}
    });
    return true;
  }catch(e){
    return false;
  }
}

function fmtTime(sec){
  if(!Number.isFinite(sec) || sec<0) return "0:00";
  const m=Math.floor(sec/60);
  const s=Math.floor(sec%60);
  return m+":"+String(s).padStart(2,"0");
}

function setPlayingUI(isPlaying){
  playIcon.className=isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";
}

function updateVolIcon(v){
  if(v<=0.001){
    volIcon.className="fa-solid fa-volume-xmark";
  }else if(v<0.5){
    volIcon.className="fa-solid fa-volume-low";
  }else{
    volIcon.className="fa-solid fa-volume-high";
  }
}

async function tryExtractMp3Cover(url){
  try{
    const res=await fetch(url);
    if(!res.ok) return null;
    const buf=await res.arrayBuffer();
    const bytes=new Uint8Array(buf);
    if(bytes.length<10) return null;
    if(String.fromCharCode(bytes[0],bytes[1],bytes[2])!=="ID3") return null;
    const ver=bytes[3];
    const size=((bytes[6]&0x7f)<<21)|((bytes[7]&0x7f)<<14)|((bytes[8]&0x7f)<<7)|(bytes[9]&0x7f);
    let off=10;
    const end=Math.min(bytes.length, 10+size);
    const readStr=(o,l)=>String.fromCharCode(...bytes.slice(o,o+l));
    const readU32=(o)=>(bytes[o]<<24)|(bytes[o+1]<<16)|(bytes[o+2]<<8)|bytes[o+3];
    const readU32SyncSafe=(o)=>((bytes[o]&0x7f)<<21)|((bytes[o+1]&0x7f)<<14)|((bytes[o+2]&0x7f)<<7)|(bytes[o+3]&0x7f);
    while(off+10<=end){
      const id=readStr(off,4);
      const frameSize=ver===4 ? readU32SyncSafe(off+4) : readU32(off+4);
      if(!id.trim() || frameSize<=0) break;
      const dataStart=off+10;
      const dataEnd=dataStart+frameSize;
      if(dataEnd>end) break;
      if(id==="APIC"){
        let p=dataStart;
        const enc=bytes[p];
        p+=1;
        let mimeEnd=p;
        while(mimeEnd<dataEnd && bytes[mimeEnd]!==0) mimeEnd++;
        const mime=readStr(p,mimeEnd-p) || "image/jpeg";
        p=mimeEnd+1;
        p+=1;
        if(enc===0 || enc===3){
          while(p<dataEnd && bytes[p]!==0) p++;
          p+=1;
        }else{
          while(p+1<dataEnd && !(bytes[p]===0 && bytes[p+1]===0)) p+=2;
          p+=2;
        }
        if(p>=dataEnd) return null;
        const img=bytes.slice(p,dataEnd);
        const blob=new Blob([img],{type:mime});
        return URL.createObjectURL(blob);
      }
      off=dataEnd;
    }
  }catch(e){
    return null;
  }
  return null;
}

if(!tryReadWithJsMediaTags()){
  tryExtractMp3Cover(audio.src).then((u)=>{if(u) trackCover.src=u});
}

audio.addEventListener("loadedmetadata",()=>{
  timeTotal.textContent=fmtTime(audio.duration);
});

audio.addEventListener("timeupdate",()=>{
  timeCurrent.textContent=fmtTime(audio.currentTime);
  if(Number.isFinite(audio.duration) && audio.duration>0){
    progress.value=String(Math.round((audio.currentTime/audio.duration)*1000));
  }else{
    progress.value="0";
  }
});

audio.addEventListener("play",()=>setPlayingUI(true));
audio.addEventListener("pause",()=>setPlayingUI(false));
audio.addEventListener("ended",()=>setPlayingUI(false));

playPause.addEventListener("click",async()=>{
  if(audio.paused){
    try{await audio.play()}catch(e){}
  }else{
    audio.pause();
  }
});

progress.addEventListener("input",()=>{
  if(!Number.isFinite(audio.duration) || audio.duration<=0) return;
  const v=Number(progress.value)/1000;
  audio.currentTime=v*audio.duration;
});

volume.addEventListener("input",()=>{
  const v=Math.max(0, Math.min(1, Number(volume.value)));
  audio.volume=v;
  updateVolIcon(v);
});

audio.volume=Number(volume.value);
updateVolIcon(audio.volume);

app.classList.add("is-blurred");

const introFullText=(introBtn.getAttribute("data-text") || "click me <3").trim();
let typeTimer=null;
let typeIndex=0;
let typeForward=true;

function typeTick(){
  if(intro.style.display==="none") return;
  if(typeForward){
    typeIndex=Math.min(introFullText.length, typeIndex+1);
    introBtn.textContent=introFullText.slice(0,typeIndex);
    if(typeIndex>=introFullText.length){
      typeForward=false;
      typeTimer=setTimeout(typeTick,750);
      return;
    }
  }else{
    typeIndex=Math.max(0, typeIndex-1);
    introBtn.textContent=introFullText.slice(0,typeIndex);
    if(typeIndex<=0){
      typeForward=true;
      typeTimer=setTimeout(typeTick,250);
      return;
    }
  }
  typeTimer=setTimeout(typeTick,70);
}

typeTick();

if(panelEl && cardEl && playerCardEl && window.matchMedia && window.matchMedia("(pointer:fine)").matches){
  cardEl.classList.add("parallax");
  const maxTilt=8;
  panelEl.addEventListener("mousemove",(e)=>{
    const r=panelEl.getBoundingClientRect();
    const px=(e.clientX - r.left) / r.width;
    const py=(e.clientY - r.top) / r.height;
    const mx=(px - 0.5) * 2;
    const my=(py - 0.5) * 2;
    const rx=(-my * maxTilt).toFixed(2) + "deg";
    const ry=(mx * maxTilt).toFixed(2) + "deg";
    cardEl.style.setProperty("--mx", mx.toFixed(3));
    cardEl.style.setProperty("--my", my.toFixed(3));
    panelEl.style.setProperty("--panel-rx", rx);
    panelEl.style.setProperty("--panel-ry", ry);
  });
  panelEl.addEventListener("mouseleave",()=>{
    cardEl.style.setProperty("--mx","0");
    cardEl.style.setProperty("--my","0");
    panelEl.style.setProperty("--panel-rx","0deg");
    panelEl.style.setProperty("--panel-ry","0deg");
  });
}

async function startExperience(){
  intro.style.display="none";
  app.classList.remove("is-blurred");
  try{await audio.play()}catch(e){}
}

introBtn.addEventListener("click",startExperience);
intro.addEventListener("click",(e)=>{if(e.target===intro) startExperience()});

username.textContent=PROFILE.username;
bio.textContent=PROFILE.bio;

if(tagsEl){
  tagsEl.innerHTML="";
  for(const t of TAGS){
    const s=document.createElement("span");
    s.className="tag";
    s.textContent=t;
    tagsEl.appendChild(s);
  }
}

githubLink.href=PROFILE.github;
telegramLink.href=PROFILE.telegram;

let tipTimer=null;

function showTipNear(el){
  const rect=el.getBoundingClientRect();
  const parentRect=el.parentElement.getBoundingClientRect();
  const x=(rect.left+rect.width/2)-parentRect.left;
  const y=rect.top-parentRect.top;
  copiedTip.style.left=x+"px";
  copiedTip.style.top=(y-6)+"px";
  copiedTip.classList.remove("show");
  void copiedTip.offsetWidth;
  copiedTip.classList.add("show");
  if(tipTimer) clearTimeout(tipTimer);
  tipTimer=setTimeout(()=>copiedTip.classList.remove("show"),1550);
}

async function copyToClipboard(text){
  try{
    if(navigator.clipboard && window.isSecureContext){
      await navigator.clipboard.writeText(text);
      return true;
    }
  }catch(e){}

  try{
    const ta=document.createElement("textarea");
    ta.value=text;
    ta.setAttribute("readonly","");
    ta.style.position="fixed";
    ta.style.left="-9999px";
    ta.style.top="-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok=document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }catch(e){
    return false;
  }
}

discordCopy.addEventListener("click",async()=>{
  const ok=await copyToClipboard(PROFILE.discordTag);
  if(ok) showTipNear(discordCopy);
});
