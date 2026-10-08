(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const toast = (message) => { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2800); };

  // Let each section's ornaments and content arrive gently as it enters view.
  const revealTargets = document.querySelectorAll('.section-heading,.scratch-card,.collage,.video-frame,.timeline,.venue-card,.ticket-form');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
    }), { threshold: 0.12 });
    revealTargets.forEach(target => revealObserver.observe(target));
  } else revealTargets.forEach(target => target.classList.add('is-visible'));

  // Background music is the supplied M4A audio file.
  const music=$('#music'),musicToggle=$('#musicToggle'),musicLevel=.2;let autoplayPending=false,loopFading=false,volumeFadeFrame=0;
  music.volume=musicLevel;music.playbackRate=.92;music.loop=true;
  function reflectMusicState(playing){musicToggle.classList.toggle('playing',playing);musicToggle.setAttribute('aria-pressed',String(playing));musicToggle.setAttribute('aria-label',playing?'Pause music':'Play music');}
  function fadeVolume(to,duration=900){cancelAnimationFrame(volumeFadeFrame);const from=music.volume,start=performance.now();function step(now){const t=Math.min(1,(now-start)/duration);music.volume=from+(to-from)*t;if(t<1)volumeFadeFrame=requestAnimationFrame(step);}volumeFadeFrame=requestAnimationFrame(step);}
  async function startMusic(){try{music.playbackRate=.92;music.volume=loopFading?0:musicLevel;await music.play();autoplayPending=false;reflectMusicState(true);if(loopFading)fadeVolume(musicLevel,1200);}catch{autoplayPending=true;}}
  function pauseMusic({notify=true}={}){autoplayPending=false;cancelAnimationFrame(volumeFadeFrame);music.pause();music.volume=musicLevel;loopFading=false;reflectMusicState(false);if(notify)toast('Music paused');}
  musicToggle.addEventListener('click',()=>{if(!$('#storyVideo').paused&&!$('#storyVideo').ended){toast('Background music will resume when the video ends');return;}music.paused?startMusic():pauseMusic();});
  document.addEventListener('pointerdown',event=>{if(autoplayPending&&!event.target.closest('#musicToggle'))startMusic();},{once:true});
  music.addEventListener('timeupdate',()=>{
    if(!Number.isFinite(music.duration))return;
    const remaining=music.duration-music.currentTime;
    if(!loopFading&&remaining<=1.8){loopFading=true;fadeVolume(0,Math.max(250,remaining*1000));}
    if(loopFading&&music.currentTime<.6){fadeVolume(musicLevel,1200);loopFading=false;}
  });
  music.addEventListener('error',()=>toast('The background music could not be loaded'));
  // Try audible autoplay; if the browser blocks it, start on the first user interaction.
  startMusic();
  music.addEventListener('error', () => toast('The background music could not be loaded'));

  // Soft drifting light. Resizes without allocating a full-resolution backing store on mobile.
  const ambience = $('#ambience'), ctx = ambience.getContext('2d'); let particles = [], w = 0, h = 0, dpr = 1;
  function resizeAmbience(){ dpr = Math.min(devicePixelRatio || 1, 1.5); w = innerWidth; h = innerHeight; ambience.width = w*dpr; ambience.height = h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); particles = Array.from({length:Math.min(45,Math.round(w/9))},()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*2+0.5,vx:(Math.random()-.5)*.2,vy:Math.random()*.22+.06,a:Math.random()*.3+.1,c:['209,226,235','241,205,211','255,255,255'][Math.floor(Math.random()*3)]})); }
  function animateAmbience(){ ctx.clearRect(0,0,w,h); particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.y>h+8){p.y=-8;p.x=Math.random()*w;}if(p.x<-8)p.x=w+8;if(p.x>w+8)p.x=-8;ctx.beginPath();ctx.fillStyle=`rgba(${p.c},${p.a})`;ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}); requestAnimationFrame(animateAmbience); }
  resizeAmbience(); animateAmbience(); addEventListener('resize',resizeAmbience,{passive:true});

  // Nine photos rotate independently; every face is seeded with a different image.
  const gallery=Array.from({length:9},(_,i)=>`assets/images/gallery-${i+1}-hd.jpg`);
  const galleryFaces=[...document.querySelectorAll('.flip-tile .tile-face img')];
  const galleryDeck=Array.from({length:gallery.length},(_,i)=>i).sort(()=>Math.random()-.5);
  function setPhoto(img,index){const path=gallery[index];img.dataset.galleryIndex=String(index);img.src=path;img.parentElement.style.setProperty('--photo-backdrop',`url("${path}")`);}
  galleryFaces.forEach((img,index)=>img.addEventListener('error',()=>{img.removeAttribute('src');img.parentElement.style.setProperty('--photo-backdrop','linear-gradient(135deg,#263b46,#412a35)');},{once:true}));
  galleryFaces.forEach((img,index)=>setPhoto(img,galleryDeck[index]));
  document.querySelectorAll('.flip-tile').forEach((tile,index)=>{
    const front=$('.tile-front img',tile),back=$('.tile-back img',tile);let flipping=false;
    function nextDistinct(hiddenFace){const used=new Set(galleryFaces.filter(img=>img!==hiddenFace).map(img=>Number(img.dataset.galleryIndex)));let options=gallery.map((_,i)=>i).filter(i=>!used.has(i));if(options.length>1)options=options.filter(i=>i!==Number(hiddenFace.dataset.galleryIndex));return options[Math.floor(Math.random()*options.length)]??(index%gallery.length);}
    function flip(){if(flipping)return;flipping=true;const wasFlipped=tile.classList.contains('flipped'),hiddenFace=wasFlipped?back:front;tile.classList.toggle('flipped');setTimeout(()=>{setPhoto(hiddenFace,nextDistinct(hiddenFace));flipping=false;},1650);}
    tile.addEventListener('click',flip);setTimeout(()=>{flip();setInterval(flip,5200+Math.random()*1400);},index*850+Math.random()*500);
  });
  const collage=$('.collage'), layouts=['layout-a','layout-b','layout-c','layout-d'];let lastLayout='layout-a';collage.classList.add(lastLayout);
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setInterval(()=>{const choices=layouts.filter(layout=>layout!==lastLayout);lastLayout=choices[Math.floor(Math.random()*choices.length)];collage.classList.remove(...layouts,'shuffle');collage.classList.add(lastLayout);void collage.offsetWidth;collage.classList.add('shuffle');setTimeout(()=>collage.classList.remove('shuffle'),1450);},11000);
  const portrait = $('.portrait-arch img'); portrait.addEventListener('error',()=>{portrait.removeAttribute('src');portrait.style.background='linear-gradient(145deg,#d9e9ed,#f6e3e5)';},{once:true});

  // Scratch-off gold: reveal at 35% cleared, then play a tiny hand-built confetti burst.
  const scratch = $('#scratchCanvas'), sctx = scratch.getContext('2d',{willReadFrequently:true}), scratchCard = $('.scratch-card'); let scratching=false,revealed=false,lastCheck=0;
  function drawGold(){const rect=scratch.getBoundingClientRect();if(!rect.width)return;const ratio=Math.min(devicePixelRatio||1,1.5);scratch.width=Math.round(rect.width*ratio);scratch.height=Math.round(rect.height*ratio);sctx.setTransform(ratio,0,0,ratio,0,0);const g=sctx.createLinearGradient(0,0,rect.width,rect.height);g.addColorStop(0,'#b18a43');g.addColorStop(.19,'#f6e6b8');g.addColorStop(.38,'#c19b53');g.addColorStop(.54,'#fff0c3');g.addColorStop(.73,'#ae8845');g.addColorStop(1,'#e8d29b');sctx.fillStyle=g;sctx.fillRect(0,0,rect.width,rect.height);for(let i=0;i<110;i++){sctx.fillStyle=`rgba(255,255,255,${Math.random()*.23})`;sctx.fillRect(Math.random()*rect.width,Math.random()*rect.height,Math.random()*2+.3,Math.random()*2+.3)}sctx.strokeStyle='#fff2c4aa';sctx.lineWidth=1;sctx.strokeRect(8,8,rect.width-16,rect.height-16);sctx.fillStyle='#fff8e5';sctx.font='600 11px Montserrat, sans-serif';sctx.textAlign='center';sctx.fillText('✧   A LITTLE SURPRISE   ✧',rect.width/2,rect.height/2-8);sctx.font='10px Montserrat, sans-serif';sctx.fillText('SCRATCH TO REVEAL',rect.width/2,rect.height/2+13);}
  function point(e){const r=scratch.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  function scratchAt(e){const p=point(e);sctx.globalCompositeOperation='destination-out';sctx.beginPath();sctx.arc(p.x,p.y,27,0,Math.PI*2);sctx.fill();sctx.globalCompositeOperation='source-over';const now=performance.now();if(now-lastCheck>350){lastCheck=now;const pixels=sctx.getImageData(0,0,scratch.width,scratch.height).data;let clear=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]<40)clear++;if(clear/(pixels.length/4)>.35)revealDate();}}
  function revealDate(){if(revealed)return;revealed=true;scratchCard.classList.add('revealed');$('#scratchHint').hidden=true;burstConfetti();chime();toast('The date is revealed — we can’t wait to celebrate with you!');}
  function burstConfetti(){const colors=['#d4b76f','#e8c2c8','#b6d2db','#fff4d8'];for(let i=0;i<90;i++){const el=document.createElement('i');el.style.cssText=`position:fixed;z-index:10;left:${Math.random()*100}vw;top:-12px;width:${4+Math.random()*5}px;height:${7+Math.random()*7}px;background:${colors[i%colors.length]};border-radius:2px;pointer-events:none;`;document.body.appendChild(el);const duration=1700+Math.random()*1800;el.animate([{transform:'translateY(0) rotate(0)',opacity:1},{transform:`translate(${(Math.random()-.5)*180}px,${innerHeight+40}px) rotate(${Math.random()*800}deg)`,opacity:.2}],{duration,easing:'cubic-bezier(.1,.65,.5,1)'}).onfinish=()=>el.remove();}}
  function chime(){try{const ac=new AudioContext(),now=ac.currentTime;[146.83,220,293.66,440].forEach((hz,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(.0001,now+i*.055);g.gain.exponentialRampToValueAtTime(.08,now+i*.055+.025);g.gain.exponentialRampToValueAtTime(.0001,now+i*.055+1.4);o.connect(g).connect(ac.destination);o.start(now+i*.055);o.stop(now+i*.055+1.45);});setTimeout(()=>ac.close(),1800);}catch{}}
  scratch.addEventListener('pointerdown',e=>{if(revealed)return;scratching=true;scratch.setPointerCapture(e.pointerId);scratchAt(e);});scratch.addEventListener('pointermove',e=>{if(scratching&&!revealed)scratchAt(e);});['pointerup','pointercancel','lostpointercapture'].forEach(name=>scratch.addEventListener(name,()=>scratching=false));drawGold();addEventListener('resize',()=>{if(!revealed)drawGold();},{passive:true});

  // Countdown to the first welcome at 10:00 AM India time.
  const eventAt=new Date('2026-11-15T10:00:00+05:30').getTime();function countdown(){let left=Math.max(0,eventAt-Date.now());const vals={days:Math.floor(left/86400000),hours:Math.floor(left%86400000/3600000),minutes:Math.floor(left%3600000/60000),seconds:Math.floor(left%60000/1000)};Object.entries(vals).forEach(([id,val])=>{$('#'+id).textContent=String(val).padStart(2,'0')});}countdown();setInterval(countdown,1000);

  let resumeMusicAfterVideo=false;
  function restoreMusicAfterVideo(){if(!resumeMusicAfterVideo)return;resumeMusicAfterVideo=false;startMusic();}
  $('#videoPlay').addEventListener('click',async()=>{const video=$('#storyVideo');try{await video.play();}catch{toast('The story video could not be played');}});
  $('#storyVideo').addEventListener('play',()=>{resumeMusicAfterVideo=!music.paused||autoplayPending;if(resumeMusicAfterVideo)pauseMusic({notify:false});$('#videoPlay').classList.add('hidden');});
  $('#storyVideo').addEventListener('pause',()=>{if(!$('#storyVideo').ended){$('#videoPlay').classList.remove('hidden');restoreMusicAfterVideo();}});
  $('#storyVideo').addEventListener('ended',()=>{$('#videoPlay').classList.remove('hidden');restoreMusicAfterVideo();});
  $('#storyVideo').addEventListener('error',()=>$('#videoPlay').classList.remove('hidden'));

  $('#copyAddress').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#address').textContent.trim());toast('The venue address has been copied');}catch{const area=document.createElement('textarea');area.value=$('#address').textContent.trim();document.body.append(area);area.select();try{document.execCommand('copy');toast('The venue address has been copied');}catch{toast('Please copy the address shown above');}area.remove();}});
  $('#ticketForm').addEventListener('submit',e=>{e.preventDefault();const name=$('#guestName').value.trim();if(!name)return;$('#ticketGuest').textContent=name;$('#ticketResult').hidden=false;toast(`A little golden invitation, made for ${name}`);$('#ticketResult').scrollIntoView({behavior:'smooth',block:'center'});});
  $('#saveTicket').addEventListener('click',()=>{const c=document.createElement('canvas'),x=c.getContext('2d');c.width=1200;c.height=720;const grad=x.createLinearGradient(0,0,1200,720);grad.addColorStop(0,'#f8e6b2');grad.addColorStop(.25,'#b39050');grad.addColorStop(.52,'#fff1c9');grad.addColorStop(.8,'#b39152');grad.addColorStop(1,'#f8e8bb');x.fillStyle=grad;x.fillRect(0,0,c.width,c.height);x.fillStyle='#fbf5e4';x.fillRect(28,28,1144,664);x.strokeStyle='#a8874b';x.lineWidth=2;x.strokeRect(48,48,1104,624);x.strokeStyle='#d7bf87';x.lineWidth=1;x.strokeRect(58,58,1084,604);x.textAlign='center';x.fillStyle='#9a7942';x.font='600 20px Montserrat, sans-serif';x.fillText('✧   WITH JOYFUL HEARTS   ✧',600,145);x.fillStyle='#665941';x.font='600 56px Georgia, serif';x.fillText($('#ticketGuest').textContent,600,285);x.font='italic 27px Georgia, serif';x.fillText('We would be delighted to celebrate with you.',600,355);x.fillStyle='#58666b';x.font='48px Georgia, serif';x.fillText('Sritama  &  Soumik',600,460);x.fillStyle='#8a7044';x.font='600 18px Montserrat, sans-serif';x.fillText('SUNDAY  ·  15 NOVEMBER 2026',600,515);x.font='18px Montserrat, sans-serif';x.fillText('Green & Glory Banquet Hall  ·  Contai',600,550);x.font='600 15px Montserrat, sans-serif';x.fillText('WE CAN’T WAIT TO CELEBRATE WITH YOU',600,615);const a=document.createElement('a');a.download='sritama-soumik-golden-invitation.png';a.href=c.toDataURL('image/png');a.click();toast('Your golden invitation is ready to save');});
})();
