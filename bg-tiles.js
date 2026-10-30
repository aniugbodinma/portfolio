(function(){
const mode='tiles';
const stage=document.querySelector('.stage');const hero=document.querySelector('.hero');hero.style.position='relative';
const P=['#5e8cf0','#efcb5e','#f095b1','#967cef','#c0e26e'];
let mx=-999,my=-999,W,H,dpr=Math.min(devicePixelRatio,2);
const layer=document.createElement('div');layer.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden';layer.className='bg-tiles';stage.prepend(layer);
let onMove=()=>{};
stage.addEventListener('mousemove',e=>{const r=stage.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;onMove(x,y,mx,my);mx=x;my=y;});
stage.addEventListener('mouseleave',()=>{mx=my=-999});
const tp=e=>{const t=e.touches[0];if(!t)return;const r=stage.getBoundingClientRect();mx=t.clientX-r.left;my=t.clientY-r.top;};stage.addEventListener('touchstart',tp,{passive:true});stage.addEventListener('touchmove',tp,{passive:true});stage.addEventListener('touchend',()=>{setTimeout(()=>{mx=my=-999},250)},{passive:true});
function cv(){const c=document.createElement('canvas');c.style.cssText='position:absolute;inset:0;width:100%;height:100%';layer.appendChild(c);const g=c.getContext('2d');const rs=()=>{W=stage.clientWidth;H=stage.clientHeight;c.width=W*dpr;c.height=H*dpr;g.setTransform(dpr,0,0,dpr,0,0)};rs();addEventListener('resize',rs);return g;}
if(mode==='words'){const words=['research','systems','fintech','empathy','prototype','clarity','growth','trust','craft','users'];let acc=0,i=0;
 onMove=(x,y,px,py)=>{if(px<-900)return;acc+=Math.hypot(x-px,y-py);if(acc<90)return;acc=0;const s=document.createElement('span');s.textContent=words[i++%words.length];
  s.style.cssText=`position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%) scale(.8);font:500 15px system-ui;color:${P[i%5]};opacity:0;transition:opacity .4s,transform 1.4s cubic-bezier(.25,1,.5,1);white-space:nowrap`;layer.appendChild(s);
  requestAnimationFrame(()=>{s.style.opacity=1;s.style.transform='translate(-50%,-140%) scale(1)'});setTimeout(()=>{s.style.opacity=0},900);setTimeout(()=>s.remove(),1500);};return;}
if(mode==='tiles'){layer.style.perspective='900px';const sz=innerWidth<=820?52:70;let tiles=[];const build=()=>{layer.querySelectorAll('i').forEach(t=>t.remove());tiles=[];W=stage.clientWidth;H=stage.clientHeight;
  for(let y=0;y<H;y+=sz)for(let x=0;x<W;x+=sz){const t=document.createElement('i');t.style.cssText=`position:absolute;left:${x+4}px;top:${y+4}px;width:${sz-8}px;height:${sz-8}px;border-radius:12px;background:rgba(0,0,0,.008);transition:transform .5s cubic-bezier(.25,1,.5,1),background .5s`;layer.appendChild(t);tiles.push([t,x+sz/2,y+sz/2]);}};build();addEventListener('resize',build);
 (function f(){for(const[t,x,y]of tiles){const dx=mx-x,dy=my-y,d=Math.hypot(dx,dy),k=Math.max(0,1-d/240);t.style.transform=k?`rotateX(${-dy/d*k*13}deg) rotateY(${dx/d*k*13}deg) scale(${1-k*.06})`:'none';t.style.background=k?`rgba(150,124,239,${.008+k*.045})`:'rgba(0,0,0,.008)';}requestAnimationFrame(f)})();return;}
if(mode==='mesh'){layer.style.filter='blur(70px)';const bl=P.map((c,i)=>{const b=document.createElement('div');b.style.cssText=`position:absolute;width:420px;height:420px;border-radius:50%;background:${c};opacity:.32;left:0;top:0`;layer.appendChild(b);return{b,i,x:0,y:0}});let t=0;
 (function f(){t+=.004;W=stage.clientWidth;H=stage.clientHeight;for(const o of bl){let tx=W/2+Math.sin(t*(1+o.i*.3)+o.i*2)*W*.35,ty=H/2+Math.cos(t*(1.2+o.i*.2)+o.i)*H*.3;if(mx>-900){tx+=(mx-tx)*.25;ty+=(my-ty)*.25;}o.x+=(tx-o.x)*.03;o.y+=(ty-o.y)*.03;o.b.style.transform=`translate(${o.x-210}px,${o.y-210}px)`;}requestAnimationFrame(f)})();return;}
const g=cv();
if(mode==='paint'){let pts=[];onMove=(x,y)=>pts.push({x,y,t:performance.now()});
 (function f(){const now=performance.now();pts=pts.filter(p=>now-p.t<1200);g.clearRect(0,0,W,H);g.lineCap=g.lineJoin='round';
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],age=(now-b.t)/1200;g.strokeStyle=P[Math.floor(b.t/400)%5];g.globalAlpha=(1-age)*.5;g.lineWidth=34*(1-age*.6);g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();}g.globalAlpha=1;requestAnimationFrame(f)})();return;}
if(mode==='warp'){let rings=[],acc=0;onMove=(x,y,px,py)=>{if(px<-900)return;acc+=Math.hypot(x-px,y-py);if(acc>40){acc=0;rings.push({x,y,r:0,c:P[rings.length%5]});}};
 (function f(){g.clearRect(0,0,W,H);rings=rings.filter(r=>r.r<260);for(const r of rings){r.r+=2.2;const a=1-r.r/260;g.strokeStyle=r.c;g.globalAlpha=a*.45;g.lineWidth=1.5;g.beginPath();g.arc(r.x,r.y,r.r,0,7);g.stroke();}g.globalAlpha=1;requestAnimationFrame(f)})();}
})();
