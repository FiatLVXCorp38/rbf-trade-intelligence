const PAIRS=[{symbol:"EUR/USD",api:"EUR/USD",digits:5},{symbol:"USD/JPY",api:"USD/JPY",digits:3},{symbol:"USD/CAD",api:"USD/CAD",digits:5}];
const TF=[["1day","1D"],["4h","4H"],["1h","1H"],["15min","15M"],["5min","5M"]];
const $=id=>document.getElementById(id);let data={};let key=localStorage.getItem("fc_twelve_key")||"";
$("apiKey").value=key;
function etParts(date=new Date()){return new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false,weekday:"short"}).formatToParts(date).reduce((a,p)=>(a[p.type]=p.value,a),{});}
function sessionState(){const p=etParts(),mins=+p.hour*60 + +p.minute,day=p.weekday;const wk=day==="Sat"||day==="Sun";return [{n:"TOKYO",range:"7:00 PM – 4:00 AM ET",open:!wk&&(mins>=19*60||mins<4*60)},{n:"LONDON",range:"3:00 AM – 12:00 PM ET",open:!wk&&mins>=180&&mins<720},{n:"NEW YORK",range:"8:00 AM – 5:00 PM ET",open:!wk&&mins>=480&&mins<1020}];}
function renderSessions(){const s=sessionState();$("sessions").innerHTML=s.map(x=>`<div class="session"><div><strong>${x.n}</strong><small>${x.range}</small></div><span class="state ${x.open?"open":"closed"}">${x.open?"● OPEN":"○ CLOSED"}</span></div>`).join("");$("marketSummary").textContent=s.filter(x=>x.open).map(x=>x.n).join(" + ")||"Major sessions closed";}
function fmt(n,d=5){return Number.isFinite(n)?n.toFixed(d):"—";}
function trend(candles){if(!candles||candles.length<55)return {name:"INSUFFICIENT DATA",cls:"neutral"};let c=candles.map(x=>+x.close).reverse(),ema=(arr,p)=>{let k=2/(p+1),v=arr.slice(0,p).reduce((a,b)=>a+b,0)/p;for(let i=p;i<arr.length;i++)v=arr[i]*k+v*(1-k);return v};let e20=ema(c,20),e50=ema(c,50),last=c.at(-1),prior=c.at(-6);let slope=last-prior;if(last>e20&&e20>e50&&slope>0)return{name:"BULLISH",cls:"bull"};if(last<e20&&e20<e50&&slope<0)return{name:"BEARISH",cls:"bear"};return{name:"MIXED / RANGE",cls:"neutral"};}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function normalizeBatchPayload(payload){
 const root=payload && payload.data && typeof payload.data==="object" ? payload.data : payload;
 const out={};
 for(const p of PAIRS){
   let item=root[p.api] || root[p.symbol] || root[p.api.replace("/","")] || null;
   if(item && item.response)item=item.response;
   if(item && item.status==="error")throw Error(`${p.symbol}: ${item.message||"API error"} (code ${item.code||"unknown"})`);
   if(item && Array.isArray(item.values)){out[p.symbol]=item.values;continue;}
   // Some response wrappers expose the series under a nested data property.
   if(item && item.data && Array.isArray(item.data.values)){out[p.symbol]=item.data.values;continue;}
   if(payload && payload.status==="error")throw Error(`${payload.message||"Twelve Data returned an error"} (code ${payload.code||"unknown"})`);
   throw Error(`${p.symbol}: batch response did not contain a values array. Check the Twelve Data response format.`);
 }
 return out;
}
async function fetchBatch(interval){
 const symbols=PAIRS.map(p=>p.api).join(",");
 const params=new URLSearchParams({symbol:symbols,interval,outputsize:"60",timezone:"America/New_York",apikey:key});
 const url=`https://api.twelvedata.com/time_series?${params.toString()}`;
 for(let attempt=0;attempt<3;attempt++){
   let r;
   try{r=await fetch(url);}catch(e){throw Error(`Network error: ${e.message||"request failed"}`);}
   let payload;
   try{payload=await r.json();}catch(e){throw Error(`Twelve Data returned an unreadable response (HTTP ${r.status}).`);}
   const rateLimited=r.status===429 || payload?.code===429 || /rate limit|credits per minute|api credits/i.test(payload?.message||"");
   if(rateLimited && attempt<2){
     $("connection").textContent=`RATE LIMIT · WAITING 62 SECONDS (${attempt+1}/2)`;
     await sleep(62000);
     continue;
   }
   if(!r.ok || payload?.status==="error"){
     throw Error(`Twelve Data error ${payload?.code||r.status}: ${payload?.message||r.statusText||"request failed"}`);
   }
   return normalizeBatchPayload(payload);
 }
 throw Error("Rate limit still active after two waits. Check your remaining per-minute and daily API credits in Twelve Data.");
}
function buildSetup(pair,frames){let h=frames["1h"],m=frames["15min"],f=frames["5min"];let th=trend(h),tm=trend(m),tf=trend(f);let aligned=th.cls===tm.cls&&["bull","bear"].includes(th.cls);if(!aligned)return {status:"NO TRADE",text:"1H and 15M are not aligned. Wait for directional agreement.",cls:"neutral"};let bull=th.cls==="bull",last=+f[0].close,atrRange=f.slice(0,14).reduce((s,x)=>s+(+x.high-+x.low),0)/14;let entry=last,stop=bull?last-atrRange*1.5:last+atrRange*1.5,target1=bull?last+atrRange*1.5:last-atrRange*1.5,target2=bull?last+atrRange*3:last-atrRange*3;return {status:`CONDITIONAL ${bull?"LONG":"SHORT"}`,cls:bull?"bull":"bear",text:"1H and 15M trend agree. Wait for a 5M pullback/reclaim (long) or rally/rejection (short); do not chase the current candle.",entry,stop,target1,target2,tf};}
function render(){let cards=[],levels=[],setups=[],warnings=[];for(let p of PAIRS){let d=data[p.symbol];if(!d)continue;let last=+d["5min"][0].close,day=d["1day"],prev=day[1]||day[0],hi=+prev.high,lo=+prev.low,mid=(hi+lo)/2;let tfs=TF.map(([id,label])=>{let t=trend(d[id]);return `<div class="tf"><b>${label}</b><small class="${t.cls}">${t.name==="BULLISH"?"▲ BULL":t.name==="BEARISH"?"▼ BEAR":"MIXED"}</small></div>`}).join("");let overall=trend(d["1h"]);cards.push(`<article class="pair-card"><div class="pair-top"><span class="pair-name">${p.symbol}</span><span class="badge ${overall.cls}">${overall.name}</span></div><div class="price">${fmt(last,p.digits)}</div><div class="change">Latest 5-minute close · ${d["5min"][0].datetime||""}</div><div class="tf-row">${tfs}</div></article>`);levels.push(`<tr><td><b>${p.symbol}</b></td><td>${fmt(hi,p.digits)}</td><td>${fmt(lo,p.digits)}</td><td>${fmt(mid,p.digits)}</td><td>${fmt(last,p.digits)}</td></tr>`);let s=buildSetup(p,d);setups.push(`<div class="setup"><div class="setup-head"><b>${p.symbol}</b><span class="badge ${s.cls}">${s.status}</span></div><p>${s.text}</p>${s.entry?`<div class="setup-grid"><div><small>REFERENCE ENTRY*</small><b>${fmt(s.entry,p.digits)}</b></div><div><small>STOP REFERENCE</small><b>${fmt(s.stop,p.digits)}</b></div><div><small>TARGET 1</small><b>${fmt(s.target1,p.digits)}</b></div><div><small>TARGET 2</small><b>${fmt(s.target2,p.digits)}</b></div><div><small>R:R TO T2</small><b>1:2</b></div><div><small>CONFIRMATION</small><b>5M trigger</b></div></div><p>*Illustrative volatility-based reference only. Confirm structure, spread and risk before entry.</p>`:""}</div>`);if(s.status==="NO TRADE")warnings.push(`<div class="warning-item"><b>${p.symbol}:</b> No directional alignment — stand aside.</div>`);else warnings.push(`<div class="warning-item"><b>${p.symbol}:</b> ${s.status} condition; wait for 5M confirmation.</div>`);}
$("pairs").innerHTML=cards.join("")||'<p class="empty">No market data loaded.</p>';$("levels").innerHTML=levels.join("")||'<tr><td colspan="5" class="empty">No market data loaded.</td></tr>';$("setups").innerHTML=setups.join("")||'<p class="empty">No trade plans available.</p>';$("warnings").innerHTML=warnings.join("")||'<p class="empty">Waiting for market data.</p>';}
async function refresh(){
 if(!key){$("connection").textContent="API KEY REQUIRED";$("connection").className="pill warn";return;}
 $("refresh").disabled=true;$("refresh").textContent="Loading…";$("connection").textContent="STARTING BATCH REQUESTS";$("connection").className="pill warn";
 let errors=[],fresh={};
 for(let i=0;i<TF.length;i++){
   const [interval,label]=TF[i];
   $("connection").textContent=`LOADING ${label} · ${i+1}/${TF.length}`;
   try{
     const batch=await fetchBatch(interval);
     for(const p of PAIRS){fresh[p.symbol] ||= {};fresh[p.symbol][interval]=batch[p.symbol];}
   }catch(e){errors.push(`${label}: ${e.message}`);}
 }
 for(const p of PAIRS){
   if(TF.every(([id])=>fresh[p.symbol]&&fresh[p.symbol][id]))data[p.symbol]=fresh[p.symbol];
 }
 render();
 const good=Object.keys(data).length;
 $("connection").textContent=good===3?"LIVE DATA CONNECTED":good?`PARTIAL DATA · ${good}/3 PAIRS`:"DATA ERROR";
 $("connection").className="pill "+(good===3?"good":"warn");
 $("updated").textContent=new Date().toLocaleString("en-US",{timeZone:"America/New_York",dateStyle:"medium",timeStyle:"short"})+" ET";
 if(errors.length)alert("Forex Command could not complete all batch requests. Each timeframe request includes all three pairs.\n\n"+errors.join("\n")+"\n\nIf the error is HTTP 429, check your Twelve Data credit allowance. The app cannot retrieve data after the provider's quota is exhausted.");
 $("refresh").disabled=false;$("refresh").textContent="↻ Refresh";
}
$("refresh").addEventListener("click",refresh);$("saveKey").addEventListener("click",()=>{key=$("apiKey").value.trim();if(key){localStorage.setItem("fc_twelve_key",key);$("keyStatus").textContent="KEY SAVED IN THIS BROWSER";$("keyStatus").className="pill good";refresh();}});$("forgetKey").addEventListener("click",()=>{localStorage.removeItem("fc_twelve_key");key="";$("apiKey").value="";$("keyStatus").textContent="API KEY REQUIRED";$("keyStatus").className="pill warn";$("connection").textContent="DATA NOT CONNECTED";$("connection").className="pill warn";});function tick(){$("clock").textContent=new Date().toLocaleTimeString("en-US",{timeZone:"America/New_York"})+" ET";renderSessions();}tick();setInterval(tick,1000);if(key){$("keyStatus").textContent="KEY SAVED IN THIS BROWSER";$("keyStatus").className="pill good";}
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
