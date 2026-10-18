(() => {
  const $ = (id) => document.getElementById(id);
  const STORE_KEY = "trackerVedaData_v1";
  const THEME_KEY = "trackerVedaTheme_v1";
  const views = ["dashboard","contacts","followups","calendar","tasks","reports","agents","settings"];
  let activeFollowFilter = "all";
  let calendarCursor = new Date();
  let selectedCalendarDate = dateKey(new Date());
  let toastTimer;

  function dateKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function parseDate(key) { const [y,m,d] = key.split("-").map(Number); return new Date(y,m-1,d,12); }
  function addDays(key, days) { const d=parseDate(key); d.setDate(d.getDate()+days); return dateKey(d); }
  function formatDate(key) {
    if(!key) return "—";
    return parseDate(key).toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"});
  }
  function sameDay(a,b){return a===b;}
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function loadData() {
    try {
      const data = JSON.parse(localStorage.getItem(STORE_KEY));
      if(data && Array.isArray(data.contacts) && Array.isArray(data.tasks)) return data;
    } catch(e) {}
    return {contacts:[],tasks:[]};
  }
  let data = loadData();
  function saveData(){localStorage.setItem(STORE_KEY,JSON.stringify(data));renderAll();window.dispatchEvent(new Event("tv-data-changed"));}
  function uid(){return "c"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
  function toast(message){
    const el=$("toast"); el.textContent=message; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),2400);
  }
  function allFollowups(contact){
    return [
      {id:contact.id+"-3",contactId:contact.id,name:contact.name,phone:contact.phone,date:addDays(contact.dateMet,3),days:3,done:!!contact.call3Done},
      {id:contact.id+"-7",contactId:contact.id,name:contact.name,phone:contact.phone,date:addDays(contact.dateMet,7),days:7,done:!!contact.call7Done}
    ];
  }
  function allCalls(){return data.contacts.flatMap(allFollowups);}
  function statusOf(call){
    if(call.done) return "completed";
    const today=dateKey(new Date());
    if(call.date<today) return "overdue";
    if(call.date===today) return "pending";
    return "upcoming";
  }
  function statusTag(call){
    const status=statusOf(call);
    const label={completed:"Completed",overdue:"Overdue",pending:"Due today",upcoming:"Upcoming"}[status];
    return `<span class="tag ${status}">${label}</span>`;
  }
  function typeTag(type){return `<span class="tag ${type==="Client"?"completed":type==="Prospect"?"upcoming":type==="Suspect"?"pending":"neutral"}">${escapeHtml(type)}</span>`;}
  function personCell(name){const initials=String(name||"?").trim().split(/\s+/).slice(0,2).map(s=>s[0]||"").join("").toUpperCase();return `<div class="person-cell"><span class="person-avatar">${escapeHtml(initials)}</span><span>${escapeHtml(name)}</span></div>`;}
  function agentName(id){return id ? String(id) : "Unassigned";}
  function noResults(message){return `<div class="no-results">${escapeHtml(message)}</div>`;}
  function contactById(id){return data.contacts.find(c=>c.id===id);}
  function renderTable(containerId, headers, rows, emptyMessage){
    const el=$(containerId); if(!rows.length){el.innerHTML=noResults(emptyMessage);return;}
    el.innerHTML=`<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
  }
  function contactRows(contacts,withActions=true){
    return contacts.map(c=>`<tr><td>${personCell(c.name)}</td><td>${typeTag(c.type)}</td><td>${escapeHtml(agentName(c.assignedTo))}</td><td>${formatDate(c.dateMet)}</td><td>${formatDate(addDays(c.dateMet,3))}</td><td>${formatDate(addDays(c.dateMet,7))}</td><td>${c.call3Done&&c.call7Done?'<span class="tag completed">All calls done</span>':'<span class="tag pending">In progress</span>'}</td>${withActions?`<td><button class="small-btn" data-edit="${c.id}">Edit</button> <button class="small-btn delete" data-delete="${c.id}">Delete</button></td>`:""}</tr>`).join("");
  }
  function followupRows(calls){
    return calls.map(call=>`<tr><td>${personCell(call.name)}</td><td>${call.days}-day call</td><td>${formatDate(call.date)}</td><td>${call.phone?escapeHtml(call.phone):"—"}</td><td>${statusTag(call)}</td><td>${call.done?`<button class="small-btn done" data-call="${call.id}">✓ Called</button>`:`<button class="small-btn" data-call="${call.id}">Mark called</button>`}</td></tr>`);
  }
  function renderDashboard(){
    const calls=allCalls(),today=dateKey(new Date());
    $("statContacts").textContent=data.contacts.length;
    $("statToday").textContent=calls.filter(c=>c.date===today&&!c.done).length;
    $("statPending").textContent=calls.filter(c=>!c.done).length;
    $("statCompleted").textContent=calls.filter(c=>c.done).length;
    const due=calls.filter(c=>c.date<=today&&!c.done).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6);
    renderTable("todayFollowups",["Person","Call","Due date","Status","Action"],followupRows(due).map(r=>r.replace(/<td>.*?<\/td>/s,(m)=>m)), "You're all caught up. Add a contact to schedule follow-ups.");
    // Dashboard table uses a compact column count, so build its rows specifically.
    if(due.length) $("todayFollowups").innerHTML=`<table><thead><tr><th>Person</th><th>Call</th><th>Due date</th><th>Status</th><th>Action</th></tr></thead><tbody>${due.map(c=>`<tr><td>${personCell(c.name)}</td><td>${c.days}-day</td><td>${formatDate(c.date)}</td><td>${statusTag(c)}</td><td><button class="small-btn ${c.done?"done":""}" data-call="${c.id}">${c.done?"✓ Called":"Mark called"}</button></td></tr>`).join("")}</tbody></table>`;
    $("recentContacts").innerHTML=data.contacts.length?`<table><thead><tr><th>Name</th><th>Type</th><th>Date met</th><th>Next follow-up</th><th>Progress</th></tr></thead><tbody>${[...data.contacts].sort((a,b)=>b.createdAt-a.createdAt).slice(0,5).map(c=>`<tr><td>${personCell(c.name)}</td><td>${typeTag(c.type)}</td><td>${formatDate(c.dateMet)}</td><td>${formatDate(addDays(c.dateMet,c.call3Done?7:3))}</td><td>${c.call3Done&&c.call7Done?'<span class="tag completed">Complete</span>':'<span class="tag pending">In progress</span>'}</td></tr>`).join("")}</tbody></table>`:noResults("No contacts yet. Use “Add contact” to get started.");
  }
  function renderContacts(){
    const q=($("contactSearch").value||"").trim().toLowerCase(),type=$("typeFilter").value;
    const list=data.contacts.filter(c=>(type==="all"||c.type===type)&&[c.name,c.phone,c.source,c.notes].some(v=>String(v||"").toLowerCase().includes(q))).sort((a,b)=>b.createdAt-a.createdAt);
    const rows=list.map(c=>`<tr><td>${personCell(c.name)}</td><td>${typeTag(c.type)}</td><td>${escapeHtml(agentName(c.assignedTo))}</td><td>${formatDate(c.dateMet)}</td><td>${formatDate(addDays(c.dateMet,3))}</td><td>${formatDate(addDays(c.dateMet,7))}</td><td>${c.call3Done&&c.call7Done?'<span class="tag completed">All calls done</span>':'<span class="tag pending">In progress</span>'}</td><td><button class="small-btn" data-edit="${c.id}">Edit</button> <button class="small-btn delete" data-delete="${c.id}">Delete</button></td></tr>`);
    renderTable("contactsTable",["Name","Type","Assigned agent","Date met","3-day call","7-day call","Progress","Actions"],rows,"No matching prospects found.");
  }
  function renderFollowups(){
    let calls=allCalls(),today=dateKey(new Date());
    if(activeFollowFilter==="today")calls=calls.filter(c=>c.date===today&&!c.done);
    if(activeFollowFilter==="upcoming")calls=calls.filter(c=>c.date>today&&!c.done);
    if(activeFollowFilter==="overdue")calls=calls.filter(c=>c.date<today&&!c.done);
    if(activeFollowFilter==="completed")calls=calls.filter(c=>c.done);
    if(activeFollowFilter==="all")calls=calls.filter(c=>!c.done);
    calls.sort((a,b)=>a.date.localeCompare(b.date));
    renderTable("followupsTable",["Person","Follow-up","Due date","Phone","Status","Action"],followupRows(calls),"No follow-ups in this view.");
    document.querySelectorAll("#followupFilters .pill").forEach(b=>b.classList.toggle("active",b.dataset.filter===activeFollowFilter));
  }
  function renderCalendar(){
    const year=calendarCursor.getFullYear(),month=calendarCursor.getMonth();
    $("calendarMonth").textContent=calendarCursor.toLocaleDateString(undefined,{month:"long",year:"numeric"});
    const first=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate(),today=dateKey(new Date()),calls=allCalls();
    let html="";
    for(let i=0;i<first;i++)html+='<div class="calendar-day empty"></div>';
    for(let day=1;day<=days;day++){
      const key=dateKey(new Date(year,month,day)),count=calls.filter(c=>c.date===key&&!c.done).length;
      html+=`<button class="calendar-day ${key===today?"today":""} ${key===selectedCalendarDate?"selected":""}" data-date="${key}"><span class="day-num">${day}</span>${count?`<span class="day-count"><i class="day-dot"></i>${count} call${count===1?"":"s"}</span>`:""}</button>`;
    }
    $("calendarGrid").innerHTML=html;
    $("selectedDateTitle").textContent=parseDate(selectedCalendarDate).toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"});
    const list=calls.filter(c=>c.date===selectedCalendarDate);
    $("calendarDayList").innerHTML=list.length?list.map(c=>`<div class="day-list-item">${personCell(c.name)}<span>${c.days}-day call</span>${statusTag(c)}<button class="small-btn ${c.done?"done":""}" data-call="${c.id}">${c.done?"✓ Called":"Mark called"}</button></div>`).join(""):noResults("No follow-ups scheduled for this date.");
  }
  function renderTasks(){
    $("taskList").innerHTML=data.tasks.length?data.tasks.map(t=>`<div class="task-item ${t.done?"done":""}"><input type="checkbox" data-task="${t.id}" ${t.done?"checked":""} aria-label="Mark task complete"/><span class="task-text">${escapeHtml(t.text)}</span><button class="small-btn delete" data-task-delete="${t.id}">Delete</button></div>`).join(""):noResults("No tasks yet. Add a task to build your checklist.");
  }
  function renderReports(){
    const calls=allCalls(),done=calls.filter(c=>c.done).length,pending=calls.length-done,rate=calls.length?Math.round(done/calls.length*100):0;
    $("reportContacts").textContent=data.contacts.length;$("reportCalls").textContent=done;$("reportPending").textContent=pending;$("reportRate").textContent=rate+"%";
    $("progressText").textContent=rate+"%";$("progressRing").style.setProperty("--progress",rate+"%");
    const types=["Prospect","Suspect","New List","Client"],counts=types.map(t=>({type:t,count:data.contacts.filter(c=>c.type===t).length})),max=Math.max(1,...counts.map(x=>x.count));
    $("typeReport").innerHTML=counts.map(x=>`<div class="bar-row"><span>${x.type}</span><div class="bar-track"><div class="bar-fill" style="width:${x.count/max*100}%"></div></div><b>${x.count}</b></div>`).join("");
  }
  function renderAll(){renderDashboard();renderContacts();renderFollowups();renderCalendar();renderTasks();renderReports();}
  function showView(view){
    if(!views.includes(view))return;
    document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+view));
    document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.viewLink===view));
    window.scrollTo({top:0,behavior:"smooth"});
    if(view==="contacts")renderContacts();if(view==="followups")renderFollowups();if(view==="calendar")renderCalendar();
  }
  function openDialog(contact=null){
    $("contactForm").reset();$("formError").textContent="";$("editId").value=contact?.id||"";
    $("dialogTitle").textContent=contact?"Edit contact":"Add contact / meeting";
    $("personName").value=contact?.name||"";$("personPhone").value=contact?.phone||"";$("personType").value=contact?.type||"Prospect";
    $("dateMet").value=contact?.dateMet||dateKey(new Date());$("personSource").value=contact?.source||"";$("personNotes").value=contact?.notes||"";$("personAssignee").value=contact?.assignedTo||"";
    updatePreview();$("contactDialog").showModal();
  }
  function updatePreview(){const key=$("dateMet").value||dateKey(new Date());$("date3Preview").textContent=formatDate(addDays(key,3));$("date7Preview").textContent=formatDate(addDays(key,7));}
  function markCall(id){
    const [contactId,daysText]=id.split("-").slice(0,2);const c=contactById(contactId);if(!c)return;
    const field=daysText==="3"?"call3Done":"call7Done";c[field]=!c[field];saveData();toast(c[field]?"Call marked as completed":"Call marked as pending");
  }
  function downloadCsv(){
    const rows=[["Name","Phone","Type","Date met","Source","Notes","3-day follow-up","3-day called","7-day follow-up","7-day called"]];
    data.contacts.forEach(c=>rows.push([c.name,c.phone,c.type,c.dateMet,c.source,c.notes,addDays(c.dateMet,3),c.call3Done?"Yes":"No",addDays(c.dateMet,7),c.call7Done?"Yes":"No"]));
    const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="tracker-veda-contacts.csv";a.click();URL.revokeObjectURL(url);toast("CSV export downloaded");
  }
  function setTheme(dark){document.body.classList.toggle("dark",dark);localStorage.setItem(THEME_KEY,dark?"dark":"light");}
  function toggleTheme(){setTheme(!document.body.classList.contains("dark"));}

  document.addEventListener("click",e=>{
    const viewBtn=e.target.closest("[data-view-link]");if(viewBtn){e.preventDefault();showView(viewBtn.dataset.viewLink);return;}
    if(e.target.closest("[data-open-add]")){openDialog();return;}
    const callBtn=e.target.closest("[data-call]");if(callBtn){markCall(callBtn.dataset.call);return;}
    const editBtn=e.target.closest("[data-edit]");if(editBtn){const c=contactById(editBtn.dataset.edit);if(c)openDialog(c);return;}
    const delBtn=e.target.closest("[data-delete]");if(delBtn){if(confirm("Delete this prospect and its follow-ups?")){data.contacts=data.contacts.filter(c=>c.id!==delBtn.dataset.delete);saveData();toast("Prospect deleted");}return;}
    const filter=e.target.closest("[data-filter]");if(filter){activeFollowFilter=filter.dataset.filter;renderFollowups();return;}
    const day=e.target.closest("[data-date]");if(day){selectedCalendarDate=day.dataset.date;renderCalendar();return;}
    const taskDel=e.target.closest("[data-task-delete]");if(taskDel){data.tasks=data.tasks.filter(t=>t.id!==taskDel.dataset.taskDelete);saveData();return;}
  });
  $("contactSearch").addEventListener("input",renderContacts);$("typeFilter").addEventListener("change",renderContacts);
  $("dateMet").addEventListener("change",updatePreview);
  $("closeDialog").addEventListener("click",()=>$("contactDialog").close());$("cancelDialog").addEventListener("click",()=>$("contactDialog").close());
  $("contactForm").addEventListener("submit",e=>{
    e.preventDefault();const name=$("personName").value.trim(),dateMet=$("dateMet").value;
    if(!name||!dateMet){$("formError").textContent="Please enter a name and date met.";return;}
    const assignedTo=$("personAssignee").value.trim();
    const id=$("editId").value;
    if(id){
      const c=contactById(id);if(c)Object.assign(c,{name,phone:$("personPhone").value.trim(),type:$("personType").value,dateMet,source:$("personSource").value.trim(),notes:$("personNotes").value.trim(),assignedTo});
      toast("Prospect updated");
    }else{
      data.contacts.push({id:uid(),name,phone:$("personPhone").value.trim(),type:$("personType").value,dateMet,source:$("personSource").value.trim(),notes:$("personNotes").value.trim(),assignedTo,call3Done:false,call7Done:false,createdAt:Date.now()});
      toast("Prospect saved with 3-day and 7-day reminders");
    }
    $("contactDialog").close();saveData();
  });
  $("taskForm").addEventListener("submit",e=>{e.preventDefault();const text=$("taskInput").value.trim();if(!text)return;data.tasks.unshift({id:uid(),text,done:false});$("taskInput").value="";saveData();toast("Task added");});
  $("taskList").addEventListener("change",e=>{const id=e.target.dataset.task;if(!id)return;const t=data.tasks.find(t=>t.id===id);if(t){t.done=e.target.checked;saveData();}});
  $("prevMonth").addEventListener("click",()=>{calendarCursor.setMonth(calendarCursor.getMonth()-1);renderCalendar();});
  $("nextMonth").addEventListener("click",()=>{calendarCursor.setMonth(calendarCursor.getMonth()+1);renderCalendar();});
  $("themeToggle").addEventListener("click",toggleTheme);$("settingsThemeToggle").addEventListener("click",toggleTheme);
  $("exportCsv").addEventListener("click",downloadCsv);
  function downloadJsonBackup(){const blob=new Blob([JSON.stringify({app:"TRACKER VEDA",version:1,exportedAt:new Date().toISOString(),data},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="tracker-veda-backup.json";a.click();URL.revokeObjectURL(url);toast("Backup downloaded");}
  $("exportBackup")?.addEventListener("click",downloadJsonBackup);
  $("importBackup")?.addEventListener("change",async e=>{const file=e.target.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text()),incoming=parsed.data||parsed;if(!Array.isArray(incoming.contacts)||!Array.isArray(incoming.tasks))throw new Error("This file is not a Tracker Veda backup.");if(!confirm("Restore this backup? Current local data will be replaced."))return;data={contacts:incoming.contacts,tasks:incoming.tasks};saveData();toast("Backup restored");}catch(err){alert(err.message||"Could not read backup file.");}finally{e.target.value="";}});
  $("enableNotifications")?.addEventListener("click",async()=>{if(!("Notification" in window)){toast("This browser does not support notifications");return;}const permission=await Notification.requestPermission();toast(permission==="granted"?"Browser reminders enabled":"Notification permission not granted");if(permission==="granted")checkDueNotifications();});
  const notified=new Set();
  function checkDueNotifications(){if(!("Notification" in window)||Notification.permission!=="granted")return;const today=dateKey(new Date());allCalls().filter(c=>!c.done&&c.date<=today).forEach(c=>{const key=c.id+":"+today;if(!notified.has(key)){notified.add(key);try{new Notification(c.date<today?"Overdue follow-up":"Follow-up due today",{body:`${c.name} · ${c.days}-day call`,tag:key});}catch(e){}}});}
  checkDueNotifications();setInterval(checkDueNotifications,60000);
  $("resetData").addEventListener("click",()=>{if(confirm("This removes all Tracker Veda prospects and tasks stored in this browser. Continue?")){data={contacts:[],tasks:[]};saveData();toast("Local data reset");}});
  $("profileButton").addEventListener("click",()=>showView("settings"));
  $("todayLabel").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"});
  setTheme(localStorage.getItem(THEME_KEY)==="dark");
  renderAll();
})();