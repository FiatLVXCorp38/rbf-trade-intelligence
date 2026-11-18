const STORAGE_KEY = "rbf_trade_intelligence_v1";
const $ = id => document.getElementById(id);
let trades = loadTrades();
let toastTimer;

function loadTrades(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch{return []}}
function saveTrades(){localStorage.setItem(STORAGE_KEY,JSON.stringify(trades))}
function money(n){const v=Number(n)||0;return (v<0?"-":"")+"$"+Math.abs(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
function safe(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function dateNow(){return new Date().toLocaleDateString("en-CA")}
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400)}
function filteredTrades(){
 const from=$("fromDate").value,to=$("toDate").value,pair=$("pairFilter").value,strategy=$("strategyFilter").value,condition=$("conditionFilter").value,result=$("resultFilter").value,search=$("searchTrades").value.toLowerCase().trim();
 return trades.filter(t=>{
  if(from&&t.date<from)return false;if(to&&t.date>to)return false;
  if(pair&&t.pair!==pair)return false;if(strategy&&(t.strategy||"None / Manual")!==strategy)return false;
  if(condition&&(t.condition||"Unknown")!==condition)return false;if(result&&t.result!==result)return false;
  if(search&&!`${t.pair} ${t.strategy} ${t.notes} ${t.condition} ${t.timeframe}`.toLowerCase().includes(search))return false;
  return true;
 }).sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.createdAt||0)-(a.createdAt||0));
}
function closed(ts){return ts.filter(t=>t.result!=="Open")}
function stats(ts){
 const c=closed(ts),wins=c.filter(t=>t.result==="Win"),losses=c.filter(t=>t.result==="Loss"),even=c.filter(t=>t.result==="Breakeven"),open=ts.length-c.length;
 const pnl=c.reduce((s,t)=>s+(Number(t.pnl)||0),0),grossWin=wins.reduce((s,t)=>s+Math.max(0,Number(t.pnl)||0),0),grossLoss=Math.abs(losses.reduce((s,t)=>s+Math.min(0,Number(t.pnl)||0),0));
 const avgWin=wins.length?wins.reduce((s,t)=>s+(Number(t.pnl)||0),0)/wins.length:0,avgLoss=losses.length?losses.reduce((s,t)=>s+(Number(t.pnl)||0),0)/losses.length:0;
 return {total:ts.length,closed:c.length,wins:wins.length,losses:losses.length,even:even.length,open,pnl,grossWin,grossLoss,winRate:c.length?(wins.length/c.length*100):null,pf:grossLoss?grossWin/grossLoss:(grossWin>0?Infinity:null),avgWin,avgLoss};
}
function fillSelect(id,values,label){const el=$(id),old=el.value;el.innerHTML=`<option value="">${label}</option>`+values.map(v=>`<option value="${safe(v)}">${safe(v)}</option>`).join("");if(values.includes(old))el.value=old}
function refresh(){
 const ts=filteredTrades(),s=stats(ts);
 $("netPnl").textContent=money(s.pnl);$("netPnl").className="stat-value "+(s.pnl>0?"positive":s.pnl<0?"negative":"");
 $("pnlFoot").textContent=`${s.closed} closed trade${s.closed===1?"":"s"}`;
 $("grossProfit").textContent=money(s.grossWin);$("grossLoss").textContent=money(s.grossLoss);
 $("winRate").textContent=s.winRate===null?"—":s.winRate.toFixed(1)+"%";$("winFoot").textContent=`${s.wins} wins · ${s.losses} losses · ${s.even} breakeven`;
 $("totalTrades").textContent=s.total;$("closedFoot").textContent=`${s.closed} closed · ${s.open} open`;
 $("profitFactor").textContent=s.pf===null?"—":s.pf===Infinity?"∞":s.pf.toFixed(2);
 $("avgWin").textContent=money(s.avgWin);$("avgLoss").textContent=money(s.avgLoss);
 $("winsCount").textContent=s.wins;$("lossesCount").textContent=s.losses;$("evenCount").textContent=s.even;$("openCount").textContent=s.open;
 $("donutPct").textContent=s.winRate===null?"—":Math.round(s.winRate)+"%";
 const pct=s.winRate||0;$("donut").style.background=`conic-gradient(var(--green) ${pct*3.6}deg, var(--red) ${pct*3.6}deg ${(s.wins+s.losses)?(s.wins+s.losses)/(s.closed||1)*360:0}deg, #354556 0deg)`;
 renderStrategies(ts);renderTimeframes(ts);renderTrades(ts);renderInsight(ts);
}
function renderStrategies(ts){
 const map=new Map();
 ts.forEach(t=>{const name=(t.strategy||"").trim()||"None / Manual";if(!map.has(name))map.set(name,[]);map.get(name).push(t)});
 const rows=[...map.entries()].map(([name,list])=>({name,list,s:stats(list)})).sort((a,b)=>b.s.pnl-a.s.pnl);
 $("scorecardCount").textContent=`${rows.length} strateg${rows.length===1?"y":"ies"}`;
 $("strategyRows").innerHTML=rows.length?rows.map(r=>`<tr><td><div class="strategy-name">${safe(r.name)}</div></td><td>${r.s.total}</td><td>${r.s.wins}</td><td>${r.s.winRate===null?"—":r.s.winRate.toFixed(1)+"%"}</td><td class="${r.s.pnl>0?"positive-text":r.s.pnl<0?"negative-text":"neutral-text"}">${money(r.s.pnl)}</td><td>${money(r.s.closed?r.s.pnl/r.s.closed:0)}</td></tr>`).join(""):`<tr><td colspan="6" class="empty-cell">Add trades to build your strategy report.</td></tr>`;
}

function renderTimeframes(ts){
 const map=new Map();
 ts.forEach(t=>{const name=(t.timeframe||"").trim()||"Not recorded";if(!map.has(name))map.set(name,[]);map.get(name).push(t)});
 const rows=[...map.entries()].map(([name,list])=>({name,s:stats(list)})).sort((a,b)=>b.s.pnl-a.s.pnl);
 $("timeframeCount").textContent=`${rows.length} timeframe${rows.length===1?"":"s"}`;
 $("timeframeRows").innerHTML=rows.length?rows.map(r=>`<tr><td><strong>${safe(r.name)}</strong></td><td>${r.s.total}</td><td>${r.s.wins}</td><td>${r.s.winRate===null?"—":r.s.winRate.toFixed(1)+"%"}</td><td class="${r.s.pnl>0?"positive-text":r.s.pnl<0?"negative-text":"neutral-text"}">${money(r.s.pnl)}</td><td>${money(r.s.closed?r.s.pnl/r.s.closed:0)}</td></tr>`).join(""):`<tr><td colspan="6" class="empty-cell">Assign a timeframe to trades to build this report.</td></tr>`;
}

function renderTrades(ts){
 $("tradeRows").innerHTML=ts.length?ts.map(t=>`<tr>
 <td>${safe(t.date||"—")}</td><td><strong>${safe(t.pair)}</strong></td>
 <td><span class="dir-pill ${t.direction==="Long"?"dir-long":"dir-short"}">${safe(t.direction||"—")}</span></td>
 <td>${safe(t.strategy||"None / Manual")}</td><td>${safe(t.timeframe||"—")}</td>
 <td><span class="result-pill result-${(t.result||"open").toLowerCase()}">${safe(t.result||"Open")}</span></td>
 <td class="${Number(t.pnl)>0?"positive-text":Number(t.pnl)<0?"negative-text":"neutral-text"}">${t.result==="Open"?"—":money(t.pnl)}</td>
 <td><div class="row-actions"><button class="mini-btn" data-edit="${safe(t.id)}">Edit</button><button class="mini-btn" data-delete="${safe(t.id)}">×</button></div></td></tr>`).join(""):`<tr><td colspan="8" class="empty-cell">No trades match these filters.</td></tr>`;
 $("showingCount").textContent=`Showing ${ts.length} of ${trades.length} trades`;
}
function renderInsight(ts){
 const groups=new Map();ts.filter(t=>t.result!=="Open").forEach(t=>{const n=(t.strategy||"").trim()||"None / Manual";if(!groups.has(n))groups.set(n,[]);groups.get(n).push(t)});
 const scored=[...groups.entries()].map(([name,list])=>({name,s:stats(list)})).filter(x=>x.s.closed>=3).sort((a,b)=>b.s.pnl-a.s.pnl);
 let msg="As you record trades, RBF will surface your strongest strategy and key performance patterns here.";
 if(scored.length){const best=scored[0];msg=`Among strategies with at least 3 closed trades, ${best.name} currently leads by net P&L at ${money(best.s.pnl)} (${best.s.winRate.toFixed(1)}% win rate). Keep building the sample before drawing conclusions.`}
 else if(ts.length){msg="Keep recording trades. Strategy comparisons become more meaningful with a larger sample; RBF waits for at least 3 closed trades before naming a leading strategy."}
 $("insightBox").innerHTML=`<span class="insight-icon">i</span><p>${safe(msg)}</p>`;
}
function updateFilters(){fillSelect("pairFilter",[...new Set(trades.map(t=>t.pair).filter(Boolean))].sort(),"All pairs");fillSelect("strategyFilter",[...new Set(trades.map(t=>(t.strategy||"").trim()||"None / Manual"))].sort(),"All strategies")}
function openModal(t){
 $("tradeForm").reset();$("tradeId").value=t?.id||"";$("modalTitle").textContent=t?"Edit trade":"Add a trade";
 $("tradeDate").value=t?.date||dateNow();$("pair").value=t?.pair||"";$("direction").value=t?.direction||"Long";$("result").value=t?.result||"Win";
 $("strategy").value=t?.strategy||"";$("timeframe").value=t?.timeframe||"";$("condition").value=t?.condition||"";
 ["entry","exit","stop","target","size","pnl","notes"].forEach(k=>$(k).value=t?.[k]??"");
 $("pnl").placeholder=t?.result==="Open"?"Optional current unrealized P&L":"Enter actual realized gain/loss";
 $("tradeModal").hidden=false;document.body.style.overflow="hidden";$("pair").focus();
}
function closeModal(){$("tradeModal").hidden=true;document.body.style.overflow=""}
$("newTradeBtn").addEventListener("click",()=>openModal());$("closeModal").addEventListener("click",closeModal);$("cancelTrade").addEventListener("click",closeModal);
$("tradeModal").addEventListener("click",e=>{if(e.target===$("tradeModal"))closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("tradeModal").hidden)closeModal()});
$("tradeForm").addEventListener("submit",e=>{
 e.preventDefault();const id=$("tradeId").value||crypto.randomUUID?.()||String(Date.now());
 const idx=trades.findIndex(x=>x.id===id);
 const previous=idx>=0?trades[idx]:null;
 const t={...(previous||{}),id,date:$("tradeDate").value,pair:$("pair").value.trim().toUpperCase().replace(/\s/g,""),direction:$("direction").value,result:$("result").value,strategy:$("strategy").value.trim(),timeframe:$("timeframe").value,condition:$("condition").value,entry:$("entry").value,exit:$("exit").value,stop:$("stop").value,target:$("target").value,size:$("size").value,pnl:Number($("pnl").value)||0,notes:$("notes").value.trim(),createdAt:previous?.createdAt||Date.now(),updatedAt:Date.now()};
 if(!t.pair){toast("Enter a currency pair.");return}
 if(idx>=0)trades[idx]=t;else trades.push(t);
 saveTrades();closeModal();updateFilters();refresh();toast(idx>=0?"Trade updated.":"Trade saved.");
});
$("tradeRows").addEventListener("click",e=>{
 const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");
 if(edit){const t=trades.find(x=>x.id===edit.dataset.edit);if(t)openModal(t)}
 if(del){const t=trades.find(x=>x.id===del.dataset.delete);if(t&&confirm(`Delete the ${t.pair} trade from ${t.date}?`)){trades=trades.filter(x=>x.id!==t.id);saveTrades();updateFilters();refresh();toast("Trade deleted.")}}
});
["fromDate","toDate","pairFilter","strategyFilter","conditionFilter","resultFilter","searchTrades"].forEach(id=>$(id).addEventListener(id==="searchTrades"?"input":"change",refresh));
$("clearFilters").addEventListener("click",()=>{["fromDate","toDate","pairFilter","strategyFilter","conditionFilter","resultFilter","searchTrades"].forEach(id=>$(id).value="");refresh()});
$("weeklyAuditJump").addEventListener("click",()=>$("weeklyAudit").scrollIntoView({behavior:"smooth",block:"start"}));
$("clearAllTradesBtn").addEventListener("click",()=>{
 if(!trades.length){toast("The trade log is already empty.");return}
 const count=trades.length;
 const approved=confirm(`CLEAR ALL ${count} TRADES?\n\nThis permanently removes every trade record from this browser, including trades hidden by filters. This cannot be undone.\n\nExport your CSV first if you may need these records later.`);
 if(!approved)return;
 trades=[];saveTrades();updateFilters();refresh();renderAudit();
 toast(`${count} trade records cleared.`);
});
function csvCell(v){const s=String(v??"");return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
const columns=["date","pair","direction","strategy","timeframe","condition","entry","exit","stop","target","size","result","pnl","notes"];
$("exportBtn").addEventListener("click",()=>{
 if(!trades.length){toast("There are no trades to export.");return}
 const csv=[columns.join(","),...trades.map(t=>columns.map(c=>csvCell(t[c])).join(","))].join("\r\n");
 const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="RBF_trade_history.csv";a.click();URL.revokeObjectURL(url);toast("CSV export ready.");
});
function parseCSV(text){
 const rows=[];let row=[],field="",quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(quoted){if(c==='"'&&n==='"'){field+='"';i++}else if(c==='"')quoted=false;else field+=c}else if(c==='"')quoted=true;else if(c===","){row.push(field);field=""}else if(c==="\n"){row.push(field.replace(/\r$/,""));rows.push(row);row=[];field=""}else field+=c}
 if(field.length||row.length){row.push(field.replace(/\r$/,""));rows.push(row)}return rows.filter(r=>r.some(x=>x.trim()!==""));
}
function importOandaTransactions(rows, headers){
 const col=name=>headers.indexOf(name);
 const required=["TICKET","TRANSACTION DATE","TRANSACTION TYPE","DETAILS","INSTRUMENT","PRICE","UNITS","DIRECTION","PL"];
 const missing=required.filter(h=>col(h)<0);
 if(missing.length)throw Error("OANDA export is missing columns: "+missing.join(", "));
 const val=(r,name)=>{const i=col(name);return i<0?"":String(r[i]??"").trim()};
 const num=(r,name)=>{const x=Number(val(r,name).replace(/[$,]/g,""));return Number.isFinite(x)?x:0};
 const fillRows=rows.slice(1).filter(r=>val(r,"TRANSACTION TYPE")==="ORDER_FILL"&&val(r,"INSTRUMENT"));
 const queue=new Map(), created=[];
 const key=(pair,dir)=>pair+"|"+dir;
 const sorted=fillRows.sort((a,b)=>val(a,"TRANSACTION DATE").localeCompare(val(b,"TRANSACTION DATE")));
 let closeCount=0,openCount=0,unmatchedClose=0,duplicates=0;
 const existingTickets=new Set(trades.map(t=>t.sourceTicket).filter(Boolean));
 for(const r of sorted){
   const detail=val(r,"DETAILS"),pair=val(r,"INSTRUMENT").toUpperCase(),dir=val(r,"DIRECTION");
   const units=Math.abs(num(r,"UNITS")),price=num(r,"PRICE"),ticket=val(r,"TICKET");
   if(!pair||!units||!dir)continue;
   if(detail==="MARKET_ORDER"){
     const k=key(pair,dir);if(!queue.has(k))queue.set(k,[]);
     queue.get(k).push({pair,dir,units,remaining:units,price,date:val(r,"TRANSACTION DATE").slice(0,10),ticket});
     continue;
   }
   // OANDA close fills: stop-loss, take-profit, trailing stop, or explicit market close.
   const closeTypes=["STOP_LOSS_ORDER","TAKE_PROFIT_ORDER","TRAILING_STOP_LOSS_ORDER","MARKET_ORDER_TRADE_CLOSE"];
   if(!closeTypes.includes(detail))continue;
   if(existingTickets.has(ticket)){duplicates++;continue}
   const openDir=dir==="Sell"?"Buy":"Sell",k=key(pair,openDir),lots=queue.get(k)||[];
   let remaining=units,weightedEntry=0,matchedUnits=0,openedAt="",openingTickets=[];
   while(remaining>1e-8&&lots.length){
     const lot=lots[0],take=Math.min(remaining,lot.remaining);
     weightedEntry+=lot.price*take;matchedUnits+=take;remaining-=take;lot.remaining-=take;
     if(!openedAt||lot.date<openedAt)openedAt=lot.date;
     openingTickets.push(lot.ticket);
     if(lot.remaining<1e-8)lots.shift();
   }
   if(remaining>1e-8)unmatchedClose++;
   if(!matchedUnits)continue;
   const pl=num(r,"PL"),fees=num(r,"FINANCING")+num(r,"COMMISSION")+num(r,"CONVERSION FEE");
   const net=pl+fees;
   const result=net>0.0000001?"Win":net< -0.0000001?"Loss":"Breakeven";
   const closeDate=val(r,"TRANSACTION DATE").slice(0,10);
   const direction=openDir==="Buy"?"Long":"Short";
   const closeType=detail.replaceAll("_"," ").toLowerCase();
   created.push({
     id:(crypto.randomUUID?.()||("oanda-"+ticket)),sourceTicket:ticket,
     date:closeDate,pair,direction,strategy:"",timeframe:"",condition:"",
     entry:(weightedEntry/matchedUnits).toString(),exit:price.toString(),
     stop:"",target:"",size:matchedUnits.toString(),result,pnl:net,
     notes:`Imported from OANDA. Opened: ${openedAt||"date unavailable"}. Exit: ${closeType}. OANDA ticket: ${ticket}. Matched opening ticket(s): ${openingTickets.join("; ")}. PL ${pl.toFixed(4)}; financing ${num(r,"FINANCING").toFixed(4)}; commission ${num(r,"COMMISSION").toFixed(4)}; conversion fee ${num(r,"CONVERSION FEE").toFixed(4)}.`,
     createdAt:Date.now()+created.length
   });
   closeCount++;
 }
 // Retain unmatched opening fills as currently-open positions; no realized P&L is assigned.
 for(const lots of queue.values()){
   for(const lot of lots){
     if(lot.remaining>1e-8&&!existingTickets.has(lot.ticket)){
       created.push({id:crypto.randomUUID?.()||("oanda-open-"+lot.ticket),sourceTicket:lot.ticket,
        date:lot.date,pair:lot.pair,direction:lot.dir==="Buy"?"Long":"Short",
        strategy:"",timeframe:"",condition:"",entry:lot.price.toString(),exit:"",
        stop:"",target:"",size:lot.remaining.toString(),result:"Open",pnl:0,
        notes:`Imported from OANDA as an open position. Opening ticket: ${lot.ticket}.`,
        createdAt:Date.now()+created.length});
       openCount++;
     }
   }
 }
 trades.push(...created);
 return {created:created.length,closed:closeCount,open:openCount,unmatchedClose,duplicates};
}
$("importFile").addEventListener("change",async e=>{
 const file=e.target.files[0];if(!file)return;
 try{
  const rows=parseCSV(await file.text());if(rows.length<2)throw Error("CSV has no transaction rows.");
  const headers=rows[0].map(h=>h.trim().toUpperCase());
  const isOanda=["TICKET","TRANSACTION TYPE","DETAILS","INSTRUMENT","PL"].every(h=>headers.includes(h));
  if(isOanda){
    const report=importOandaTransactions(rows,headers);
    saveTrades();updateFilters();refresh();
    toast(`OANDA import: ${report.closed} closed, ${report.open} open trades.`);
    let msg=`Imported ${report.created} OANDA trade records.\n\nClosed trades: ${report.closed}\nOpen positions: ${report.open}`;
    if(report.unmatchedClose)msg+=`\nClosing fills without a fully matched opening quantity: ${report.unmatchedClose}`;
    if(report.duplicates)msg+=`\nDuplicate tickets skipped: ${report.duplicates}`;
    msg+="\n\nImported trades have no indicator/strategy label yet. You can edit each trade and assign one if you know which system generated it.";
    alert(msg);
    return;
  }
  const normalized=rows[0].map(h=>h.trim().toLowerCase().replace(/[\s_-]+/g,""));
  const aliases={date:["date","tradedate","opentime","time"],pair:["pair","symbol","instrument","currency"],direction:["direction","side","type"],strategy:["strategy","indicator","system"],timeframe:["timeframe","tf"],condition:["condition","marketcondition"],entry:["entry","entryprice","openprice"],exit:["exit","exitprice","closeprice"],stop:["stop","stoploss","sl"],target:["target","takeprofit","tp"],size:["size","lots","units","quantity"],result:["result","outcome","status"],pnl:["pnl","profit","netpnl","realizedpnl"],notes:["notes","comment","comments"]};
  const idx={};Object.entries(aliases).forEach(([k,arr])=>idx[k]=normalized.findIndex(h=>arr.includes(h)));
  if(idx.pair<0)throw Error("Could not find a pair/symbol column.");
  let added=0;rows.slice(1).forEach(r=>{
   const get=k=>idx[k]>=0?(r[idx[k]]||"").trim():"";
   const rawResult=get("result").toLowerCase(),rawPnl=Number(get("pnl").replace(/[$,]/g,""))||0;
   let result=["win","loss","breakeven","open"].includes(rawResult)?rawResult[0].toUpperCase()+rawResult.slice(1):(rawPnl>0?"Win":rawPnl<0?"Loss":"Breakeven");
   const rawDir=get("direction").toLowerCase();const direction=rawDir.includes("sell")||rawDir.includes("short")?"Short":"Long";
   const pair=get("pair").toUpperCase();if(!pair)return;
   trades.push({id:crypto.randomUUID?.()||String(Date.now()+added),date:get("date").slice(0,10)||dateNow(),pair,direction,strategy:get("strategy"),timeframe:get("timeframe"),condition:get("condition"),entry:get("entry"),exit:get("exit"),stop:get("stop"),target:get("target"),size:get("size"),result,pnl:result==="Open"?0:rawPnl,notes:get("notes"),createdAt:Date.now()+added});added++;
  });
  saveTrades();updateFilters();refresh();toast(`Imported ${added} trade${added===1?"":"s"}. Check imported rows for accuracy.`);
 }catch(err){alert("Import failed: "+err.message)}finally{e.target.value=""}
});
function isoDateLocal(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`}
function mondayOf(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x}
function addDays(d,n){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()+n);return x}
function prettyDate(s){const d=new Date(s+"T12:00:00");return d.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}
function weekTrades(start){const end=isoDateLocal(addDays(start,6)),from=isoDateLocal(start);return trades.filter(t=>t.date>=from&&t.date<=end)}
function auditGroupRows(ts){
 const groups=[];
 ["Strategy","Timeframe"].forEach(type=>{
  const map=new Map();ts.forEach(t=>{const raw=type==="Strategy"?t.strategy:t.timeframe;const name=(raw||"").trim()||(type==="Strategy"?"None / Manual":"Not recorded");if(!map.has(name))map.set(name,[]);map.get(name).push(t)});
  [...map.entries()].forEach(([name,list])=>{const s=stats(list);if(s.closed)groups.push({type,name,s})});
 });
 return groups.sort((a,b)=>b.s.pnl-a.s.pnl);
}
function renderAudit(){
 const input=$("auditWeekStart");if(!input.value){input.value=isoDateLocal(mondayOf(new Date()))}
 const selected=new Date(input.value+"T12:00:00");const start=mondayOf(selected),prev=addDays(start,-7),cur=weekTrades(start),old=weekTrades(prev),cs=stats(cur),ps=stats(old);
 const curEnd=isoDateLocal(addDays(start,6)),prevEnd=isoDateLocal(addDays(prev,6));
 $("currentWeekLabel").textContent=`${prettyDate(isoDateLocal(start))} – ${prettyDate(curEnd)}`;
 $("previousWeekLabel").textContent=`${prettyDate(isoDateLocal(prev))} – ${prettyDate(prevEnd)}`;
 const setPeriod=(prefix,s)=>{
  const pnl=$(prefix+"Pnl");pnl.textContent=money(s.pnl);pnl.className="audit-big-number "+(s.pnl>0?"positive-text":s.pnl<0?"negative-text":"");
  $(prefix+"Meta").textContent=`${s.closed} closed trade${s.closed===1?"":"s"} · ${s.open} open`;
  $(prefix+"WL").textContent=`${s.wins} / ${s.losses}`;
  $(prefix+"WinRate").textContent=s.winRate===null?"—":s.winRate.toFixed(1)+"%";
  $(prefix+"Gain").textContent=money(s.grossWin);$(prefix+"Loss").textContent=money(s.grossLoss);
 };
 setPeriod("auditCurrent",cs);setPeriod("auditPrevious",ps);
 const delta=cs.pnl-ps.pnl,deltaEl=$("auditPnlChange");deltaEl.textContent=`Net P&L: ${delta>=0?"+":""}${money(delta)}`;deltaEl.className=delta>0?"positive-text":delta<0?"negative-text":"";
 const tradeDelta=cs.closed-ps.closed;$("auditTradeChange").textContent=`Closed trades: ${tradeDelta>=0?"+":""}${tradeDelta}`;
 const wrDelta=(cs.winRate??0)-(ps.winRate??0);$("auditWinRateChange").textContent=`Win rate: ${cs.winRate===null||ps.winRate===null?"—":`${wrDelta>=0?"+":""}${wrDelta.toFixed(1)} pts`}`;
 let insight="No closed trades recorded for this audit week yet. Add your trades manually and the comparison will populate automatically.";
 if(cs.closed||ps.closed){
  const direction=delta>0?"improved":delta<0?"declined":"was unchanged";
  insight=`Net P&L ${direction} by ${money(Math.abs(delta))} compared with the previous week. This week recorded ${cs.wins} wins, ${cs.losses} losses, and ${cs.even} breakeven trades. `;
  if(cs.closed&&cs.winRate!==null)insight+=`Win rate: ${cs.winRate.toFixed(1)}%. `;
  const candidates=auditGroupRows(cur).filter(r=>r.s.closed>=2);
  if(candidates.length){const best=candidates[0];insight+=`Top current-week ${best.type.toLowerCase()} by net P&L: ${best.name} (${money(best.s.pnl)} across ${best.s.closed} closed trades). Treat small samples cautiously.`}
  else insight+="Record more trades in each strategy and timeframe before drawing conclusions about what is working.";
 }
 $("auditInsight").textContent=insight;
 const rows=auditGroupRows(cur);
 $("auditBreakdownRows").innerHTML=rows.length?rows.map(r=>`<tr><td>${r.type}</td><td><strong>${safe(r.name)}</strong></td><td>${r.s.closed}</td><td>${r.s.wins}</td><td>${r.s.winRate===null?"—":r.s.winRate.toFixed(1)+"%"}</td><td class="${r.s.pnl>0?"positive-text":r.s.pnl<0?"negative-text":"neutral-text"}">${money(r.s.pnl)}</td><td>${money(r.s.pnl/r.s.closed)}</td></tr>`).join(""):`<tr><td colspan="7" class="empty-cell">No closed trades in this audit week yet.</td></tr>`;
}
$("auditWeekStart").value=isoDateLocal(mondayOf(new Date()));
$("auditWeekStart").addEventListener("change",()=>{const d=new Date($("auditWeekStart").value+"T12:00:00");$("auditWeekStart").value=isoDateLocal(mondayOf(d));renderAudit()});
$("exportAuditBtn").addEventListener("click",()=>{
 const start=mondayOf(new Date($("auditWeekStart").value+"T12:00:00")),prev=addDays(start,-7),cur=weekTrades(start),old=weekTrades(prev);
 const rows=[["Period","Start","End","Closed trades","Wins","Losses","Breakeven","Win rate","Total gained","Total lost","Net P&L"],["Current week",isoDateLocal(start),isoDateLocal(addDays(start,6)),...(()=>{const s=stats(cur);return [s.closed,s.wins,s.losses,s.even,s.winRate??"",s.grossWin,s.grossLoss,s.pnl]})()],["Previous week",isoDateLocal(prev),isoDateLocal(addDays(prev,6)),...(()=>{const s=stats(old);return [s.closed,s.wins,s.losses,s.even,s.winRate??"",s.grossWin,s.grossLoss,s.pnl]})()],[],["Current week breakdown","Name","Closed trades","Wins","Win rate","Net P&L","Average per trade"]];
 auditGroupRows(cur).forEach(r=>rows.push([r.type,r.name,r.s.closed,r.s.wins,r.s.winRate??"",r.s.pnl,r.s.pnl/r.s.closed]));
 const csv=rows.map(r=>r.map(csvCell).join(",")).join("\r\n"),blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`RBF_weekly_audit_${isoDateLocal(start)}.csv`;a.click();URL.revokeObjectURL(url);toast("Weekly audit CSV exported.");
});
$("printAuditBtn").addEventListener("click",()=>window.print());

updateFilters();refresh();renderAudit();
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
