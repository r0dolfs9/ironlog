(function(root){
  'use strict';

  const DEFAULT_FINANCE_CATEGORIES = ['Food','Transport','Home','Health','Fun','Other'];

  function nRound(v){return Math.round((Number(v)||0)*10)/10}
  function moneyRound(v){return Math.round((Number(v)||0)*100)/100}
  function monthKey(date){
    const value = date || new Date().toISOString().slice(0,10);
    return String(value).slice(0,7);
  }
  function ensureSleep(db){
    if(!db.sleep)db.sleep={logs:[]};
    if(!Array.isArray(db.sleep.logs))db.sleep.logs=[];
    return db.sleep;
  }
  function ensureFinance(db){
    if(!db.finance)db.finance={monthlyBudgets:{},expenses:[],categories:[...DEFAULT_FINANCE_CATEGORIES]};
    if(!db.finance.monthlyBudgets)db.finance.monthlyBudgets={};
    if(!Array.isArray(db.finance.expenses))db.finance.expenses=[];
    if(!Array.isArray(db.finance.categories)||!db.finance.categories.length)db.finance.categories=[...DEFAULT_FINANCE_CATEGORIES];
    return db.finance;
  }
  function ensureAppShell(db){
    if(!db.app)db.app={activeDomain:'fitness',version:1};
    if(!db.app.activeDomain)db.app.activeDomain='fitness';
    if(!db.app.version)db.app.version=1;
    ensureSleep(db);
    ensureFinance(db);
    return db.app;
  }
  function sleepDurationMinutes(date,bedtime,wakeTime){
    if(!bedtime||!wakeTime)return 0;
    const base=date||new Date().toISOString().slice(0,10);
    const start=new Date(`${base}T${bedtime}`);
    let end=new Date(`${base}T${wakeTime}`);
    if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime()))return 0;
    if(end<=start)end=new Date(end.getTime()+86400000);
    return Math.round((end-start)/60000);
  }
  function saveSleepLog(db,patch,uidFactory){
    ensureSleep(db);
    const makeId=uidFactory||(()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6));
    const date=patch.date||new Date().toISOString().slice(0,10);
    const bedtime=patch.bedtime||'23:00';
    const wakeTime=patch.wakeTime||'07:00';
    const log={
      id:patch.id||makeId(),
      date,
      bedtime,
      wakeTime,
      durationMinutes:sleepDurationMinutes(date,bedtime,wakeTime),
      quality:Math.max(1,Math.min(5,Math.round(Number(patch.quality)||3))),
      notes:String(patch.notes||'').trim()
    };
    const idx=db.sleep.logs.findIndex(x=>x.id===log.id);
    if(idx>=0)db.sleep.logs[idx]=log;else db.sleep.logs.push(log);
    db.sleep.logs.sort((a,b)=>b.date.localeCompare(a.date));
    return log;
  }
  function deleteSleepLog(db,id){
    ensureSleep(db);
    db.sleep.logs=db.sleep.logs.filter(x=>x.id!==id);
  }
  function sleepWeeklySummary(db,end){
    ensureSleep(db);
    const endStr=end||new Date().toISOString().slice(0,10);
    const endDate=new Date(endStr);
    const startDate=new Date(endDate);startDate.setDate(endDate.getDate()-6);
    const start=startDate.toISOString().slice(0,10);
    const logs=db.sleep.logs.filter(x=>x.date>=start&&x.date<=endStr);
    const avgDurationMinutes=logs.length?Math.round(logs.reduce((a,x)=>a+(Number(x.durationMinutes)||0),0)/logs.length):0;
    const avgQuality=logs.length?nRound(logs.reduce((a,x)=>a+(Number(x.quality)||0),0)/logs.length):0;
    const bedMinutes=logs.map(x=>{
      const [h,m]=String(x.bedtime||'0:0').split(':').map(Number);
      const mins=(h||0)*60+(m||0);
      return mins<720?mins+1440:mins;
    });
    const consistencyMinutes=bedMinutes.length>1?Math.max(...bedMinutes)-Math.min(...bedMinutes):0;
    return {loggedDays:logs.length,avgDurationMinutes,avgQuality,consistencyMinutes,logs};
  }
  function setMonthlyBudget(db,month,amount){
    ensureFinance(db);
    db.finance.monthlyBudgets[monthKey(`${month}-01`)]=Math.max(0,moneyRound(amount));
  }
  function saveExpense(db,patch,uidFactory){
    ensureFinance(db);
    const makeId=uidFactory||(()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6));
    const exp={
      id:patch.id||makeId(),
      date:patch.date||new Date().toISOString().slice(0,10),
      category:patch.category||'Other',
      merchant:String(patch.merchant||'').trim(),
      note:String(patch.note||'').trim(),
      amount:moneyRound(patch.amount)
    };
    if(!db.finance.categories.includes(exp.category))db.finance.categories.push(exp.category);
    const idx=db.finance.expenses.findIndex(x=>x.id===exp.id);
    if(idx>=0)db.finance.expenses[idx]=exp;else db.finance.expenses.push(exp);
    db.finance.expenses.sort((a,b)=>b.date.localeCompare(a.date));
    return exp;
  }
  function deleteExpense(db,id){
    ensureFinance(db);
    db.finance.expenses=db.finance.expenses.filter(x=>x.id!==id);
  }
  function financeMonthSummary(db,month){
    ensureFinance(db);
    const key=monthKey(`${month||monthKey()}-01`);
    const items=db.finance.expenses.filter(x=>monthKey(x.date)===key);
    const total=moneyRound(items.reduce((a,x)=>a+(Number(x.amount)||0),0));
    const budget=moneyRound(db.finance.monthlyBudgets[key]||0);
    const byCategory={};
    items.forEach(x=>{byCategory[x.category]=moneyRound((byCategory[x.category]||0)+(Number(x.amount)||0))});
    return {month:key,budget,total,remaining:moneyRound(budget-total),byCategory,items};
  }

  const api={nRound,moneyRound,monthKey,ensureAppShell,ensureSleep,ensureFinance,sleepDurationMinutes,saveSleepLog,deleteSleepLog,sleepWeeklySummary,setMonthlyBudget,saveExpense,deleteExpense,financeMonthSummary};
  root.IronLogCore=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
