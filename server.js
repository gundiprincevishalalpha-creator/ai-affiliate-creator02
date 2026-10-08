const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({limit:"1mb"}));
app.use(express.static(path.join(__dirname, "public")));

function clean(v=""){ return String(v).replace(/\s+/g," ").trim(); }
function absUrl(src, base){
  try { return new URL(src, base).href; } catch { return ""; }
}
function meta(html, name, attr="property"){
  const re = new RegExp(`<meta[^>]+${attr}=["']${name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}["'][^>]*>`, "i");
  const m = html.match(re); if(!m) return "";
  const c = m[0].match(/content=["']([^"']*)["']/i); return c ? clean(c[1]) : "";
}
function title(html){
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? clean(m[1].replace(/<[^>]+>/g,"")) : "";
}
function jsonLd(html){
  const out=[];
  const re=/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while((m=re.exec(html))){
    try{
      const x=JSON.parse(m[1]);
      const arr=Array.isArray(x)?x:(x["@graph"]||[x]);
      out.push(...arr);
    }catch{}
  }
  return out;
}
function pickProduct(nodes){
  return nodes.find(x => {
    const t = Array.isArray(x?.["@type"]) ? x["@type"] : [x?.["@type"]];
    return t.some(v => String(v).toLowerCase()==="product");
  }) || {};
}
function firstImage(html, base, product){
  const candidates=[];
  if(product.image){
    const a=Array.isArray(product.image)?product.image:[product.image];
    candidates.push(...a.map(x=>typeof x==="string"?x:x?.url).filter(Boolean));
  }
  candidates.push(meta(html,"og:image"), meta(html,"twitter:image","name"));
  const imgs=[...html.matchAll(/<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>/gi)];
  candidates.push(...imgs.map(m=>m[1]));
  return candidates.map(x=>absUrl(x,base)).find(Boolean) || "";
}
function productData(html, url){
  const p=pickProduct(jsonLd(html));
  const offers = Array.isArray(p.offers)?p.offers[0]:(p.offers||{});
  const image=firstImage(html,url,p);
  const name=clean(p.name)||meta(html,"og:title")||title(html);
  const description=clean(p.description)||meta(html,"og:description");
  const price=clean(offers.price)||clean(offers.lowPrice)||"";
  const currency=clean(offers.priceCurrency)||"";
  const brand=clean(p.brand?.name||p.brand)||"";
  const sku=clean(p.sku)||"";
  const rating=clean(p.aggregateRating?.ratingValue)||"";
  const reviewCount=clean(p.aggregateRating?.reviewCount)||"";
  return {
    name:name||"Not available", description:description||"Not available",
    price:price||"Not available", currency:currency||"",
    brand:brand||"Not available", sku:sku||"Not available",
    rating:rating||"Not available", reviewCount:reviewCount||"Not available",
    image:image||"", productUrl:url
  };
}
app.post("/api/analyze", async (req,res)=>{
  try{
    const url=String(req.body?.productUrl||"").trim();
    if(!/^https?:\/\//i.test(url)) return res.status(400).json({error:"Enter a valid product URL."});
    const r=await fetch(url,{redirect:"follow",headers:{
      "user-agent":"Mozilla/5.0 (compatible; AffiliateCreator/2.0)"
    }});
    if(!r.ok) throw new Error("Product page could not be read ("+r.status+").");
    const html=await r.text();
    res.json(productData(html,url));
  }catch(e){
    res.status(500).json({error:e.message||"Could not analyze this product."});
  }
});
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log("AI Affiliate Creator running on "+PORT));
