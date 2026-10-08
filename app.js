const $=id=>document.getElementById(id);
let data=null, aff="";
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function money(d){return d.price==="Not available"?"Price: Not available":`Price: ${d.currency?d.currency+" ":""}${d.price}`}
function makeCopy(){
 const name=data.name;
 return `🔥 ${name}\n\n${data.description!=="Not available"?data.description+"\n\n":""}${money(data)}\n\n✨ Why check it out?\n• Verified product information only\n• Real product image\n\n👉 Buy here: ${aff}\n\nAffiliate link: I may earn a commission if you purchase through this link, at no extra cost to you.\n\n#affiliate #deals #shopping #product`;
}
function drawPoster(){
 const c=$("poster"),x=c.getContext("2d"),W=c.width,H=c.height;
 x.fillStyle="#ffffff";x.fillRect(0,0,W,H);
 x.fillStyle="#111";x.font="800 58px Arial";x.fillText("DEAL PICK",70,105);
 x.fillStyle="#222";x.font="700 46px Arial";
 const words=data.name.split(" ");let line="",y=180;
 for(const w of words){let t=line?line+" "+w:w;if(x.measureText(t).width>900){x.fillText(line,70,y);y+=58;line=w}else line=t}
 if(line)x.fillText(line,70,y);
 y+=40;
 if(data.image){const im=new Image();im.crossOrigin="anonymous";im.onload=()=>{const s=Math.min(850/im.width,600/im.height),iw=im.width*s,ih=im.height*s;x.drawImage(im,(W-iw)/2,y,iw,ih);finish(y+ih+70)};im.onerror=()=>finish(y+80);im.src=data.image}else finish(y+80);
 function finish(yy){x.fillStyle="#111";x.font="700 42px Arial";x.fillText(money(data),70,yy);x.font="600 34px Arial";x.fillText("Tap to shop",70,yy+60);x.font="26px Arial";x.fillText("Affiliate link • verified facts",70,yy+105)}
}
$("analyze").onclick=async()=>{
 const u=$("productUrl").value.trim(); aff=$("affiliateUrl").value.trim();
 $("status").textContent="Analyzing product…";$("result").classList.add("hidden");
 try{const r=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productUrl:u})});const j=await r.json();if(!r.ok)throw Error(j.error);
 data=j;$("pname").textContent=data.name;$("pimage").src=data.image||"";$("desc").textContent=data.description;
 $("facts").textContent=`${money(data)} • Brand: ${data.brand} • Rating: ${data.rating}${data.reviewCount!=="Not available"?" ("+data.reviewCount+" reviews)":""}`;
 $("copy").value=makeCopy();$("result").classList.remove("hidden");drawPoster();$("status").textContent="Done.";window.scrollTo({top:$("result").offsetTop,behavior:"smooth"});
 }catch(e){$("status").textContent="Error: "+e.message}
};
$("posterDownload").onclick=()=>{const a=document.createElement("a");a.download="affiliate-poster.png";a.href=$("poster").toDataURL("image/png");a.click()};
$("copyBtn").onclick=()=>navigator.clipboard?.writeText($("copy").value);
$("makeReel").onclick=async()=>{
 const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext("2d");
 const stream=canvas.captureStream(30);const rec=new MediaRecorder(stream,{mimeType:"video/webm"});const chunks=[];rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
 rec.onstop=()=>{const url=URL.createObjectURL(new Blob(chunks,{type:"video/webm"}));$("preview").src=url;$("reelDownload").href=url;$("reelDownload").classList.remove("hidden")};
 const im=new Image();im.crossOrigin="anonymous";im.onload=()=>{rec.start();let start=performance.now();function frame(t){let sec=(t-start)/1000;ctx.fillStyle="#fff";ctx.fillRect(0,0,1080,1920);ctx.fillStyle="#111";ctx.font="800 70px Arial";ctx.fillText(sec<2?"DON'T MISS THIS":"SHOP NOW",70,150);const s=Math.min(900/im.width,1000/im.height);ctx.drawImage(im,(1080-im.width*s)/2,330,im.width*s,im.height*s);ctx.font="700 50px Arial";ctx.fillText(data.name.slice(0,28),70,1450);ctx.font="600 44px Arial";ctx.fillText(money(data),70,1530);ctx.font="34px Arial";ctx.fillText("Tap the affiliate link to shop",70,1620);if(sec<6)requestAnimationFrame(frame);else rec.stop()}requestAnimationFrame(frame)};im.src=data.image||""};
