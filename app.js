"use strict";
document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const STORAGE_KEY = "nexora-ai-v1";
  const defaultState = {
  favorites: [],
  note: "",
  notes: [],
  tasks: [],
  flashcards: [],
  theme: "dark",
  chat: []
};
  let state = loadState();
  let selectedCategory = "all", deferredInstall = null, activeFlash = 0, showAnswer = false, toastTimer;

  const tools = [
    {id:"chatgpt",name:"ChatGPT",icon:"✧",category:"chat",tag:"دستیار",description:"گفت‌وگو، نوشتن، ایده‌پردازی و کمک در یادگیری.",url:"https://chatgpt.com/",search:"چت متن نوشتن سوال پاسخ هوش مصنوعی"},
    {id:"gemini",name:"Google Gemini",icon:"✦",category:"chat",tag:"دستیار",description:"دستیار هوشمند گوگل برای تحقیق و کارهای روزمره.",url:"https://gemini.google.com/",search:"گوگل چت تحقیق"},
    {id:"copilot",name:"Microsoft Copilot",icon:"◈",category:"chat",tag:"دستیار",description:"کمک هوشمند برای پرسش‌ها، متن و کارهای بهره‌وری.",url:"https://copilot.microsoft.com/",search:"مایکروسافت چت"},
    {id:"firefly",name:"Adobe Firefly",icon:"▧",category:"image",tag:"تصویر",description:"ابزارهای خلاقانهٔ تولید و ویرایش تصویر.",url:"https://firefly.adobe.com/",search:"ادوبی عکس طراحی گرافیک"},
    {id:"canva",name:"Canva AI",icon:"◩",category:"image",tag:"طراحی",description:"ساخت طرح، پوستر و محتوای تصویری.",url:"https://www.canva.com/",search:"کنوا پوستر طراحی عکس"},
    {id:"runway",name:"Runway",icon:"▶",category:"video",tag:"ویدئو",description:"ابزارهای هوش مصنوعی برای ساخت و ویرایش ویدئو.",url:"https://runwayml.com/",search:"ویدیو فیلم تولید"},
    {id:"khan",name:"Khan Academy",icon:"⌂",category:"study",tag:"آموزش",description:"یادگیری و تمرین موضوعات درسی.",url:"https://www.khanacademy.org/",search:"درس آموزش ریاضی مدرسه"},
    {id:"github",name:"GitHub",icon:"⌘",category:"code",tag:"کدنویسی",description:"میزبانی کد، مدیریت نسخه و همکاری در پروژه‌ها.",url:"https://github.com/",search:"برنامه نویسی توسعه کد"},
    {id:"suno",name:"Suno",icon:"♫",category:"audio",tag:"موسیقی",description:"ساخت موسیقی با ابزارهای هوش مصنوعی.",url:"https://suno.com/",search:"آهنگ صدا موزیک"},
    {id:"zapier",name:"Zapier",icon:"⤳",category:"work",tag:"بهره‌وری",description:"اتصال برنامه‌ها و خودکارسازی کارهای تکراری.",url:"https://zapier.com/",search:"اتوماسیون کار مدیریت"},
    {id:"notion",name:"Notion",icon:"▤",category:"work",tag:"بهره‌وری",description:"یادداشت، مستندات و مدیریت پروژه.",url:"https://www.notion.so/",search:"یادداشت برنامه ریزی مدیریت"}
  ];
  const categoryNames = {all:"همه ابزارها",chat:"چت و دستیار",image:"تولید تصویر",video:"تولید ویدئو",study:"آموزش و درس",code:"برنامه‌نویسی",audio:"موسیقی و صدا",work:"کار و بهره‌وری"};

  function loadState() {
    try { return {...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")}; }
    catch { return {...defaultState}; }
  }
  function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { toast("ذخیره‌سازی مرورگر در دسترس نیست."); } }
  function normalize(v) { return String(v || "").toLocaleLowerCase("fa").replace(/[يى]/g,"ی").replace(/ك/g,"ک").replace(/\u200c/g," ").trim(); }
  function toast(msg) { const el=$("#toast"); if(!el) return; el.textContent=msg; el.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),2400); }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function toolCard(t) {
    const fav=state.favorites.includes(t.id);
    return `<article class="tool-card" data-tool-id="${t.id}" data-category="${t.category}">
      <div class="tool-top"><span class="tool-icon" aria-hidden="true">${t.icon}</span><button class="favorite-button ${fav?"is-favorite":""}" data-favorite="${t.id}" aria-label="${fav?"حذف از":"افزودن به"} علاقه‌مندی‌ها" aria-pressed="${fav}">${fav?"♥":"♡"}</button></div>
      <h3>${t.name}</h3><p>${t.description}</p><div class="tool-bottom"><span class="tool-tag">${t.tag}</span><a class="tool-open" href="${t.url}" target="_blank" rel="noopener noreferrer">باز کردن ابزار ↗</a></div></article>`;
  }
  function renderTools() {
    const query=normalize($("#searchInput").value);
    const filtered=tools.filter(t=>(selectedCategory==="all"||t.category===selectedCategory) && normalize([t.name,t.description,t.tag,t.search,categoryNames[t.category]].join(" ")).includes(query));
    $("#toolsGrid").innerHTML=filtered.map(toolCard).join("");
    $("#toolsCount").textContent=`${filtered.length} ابزار`;
    $("#emptyState").hidden=filtered.length!==0;
    $("#toolsGrid").hidden=filtered.length===0;
    $$(".category-chip").forEach(b=>{const on=b.dataset.category===selectedCategory;b.classList.toggle("selected",on);b.setAttribute("aria-pressed",String(on));});
    renderFavorites();
  }
  function renderFavorites() {
    const list=tools.filter(t=>state.favorites.includes(t.id));
    $("#favoritesGrid").innerHTML=list.map(toolCard).join("");
    $("#favoritesCount").textContent=`${list.length} مورد`;
    $("#favoritesEmpty").hidden=list.length>0;
    $("#favoritesGrid").hidden=list.length===0;
  }
  function renderTasks() {
    $("#taskList").innerHTML=state.tasks.map((t,i)=>`<li class="task-item ${t.done?"done":""}"><input type="checkbox" data-task-toggle="${i}" ${t.done?"checked":""} aria-label="تغییر وضعیت کار"><span>${escapeHtml(t.text)}</span><button type="button" data-task-delete="${i}" aria-label="حذف کار">×</button></li>`).join("");
  }
  function renderNotes() {
  const box = $("#notesList");

  if (!state.notes.length) {
    box.innerHTML = '<p class="muted">هنوز یادداشتی ثبت نشده است.</p>';
    return;
  }

  box.innerHTML = state.notes.map((note, index) => `
    <article class="note-item">
      <p>${escapeHtml(note)}</p>
      <button type="button" data-note-delete="${index}">حذف</button>
    </article>
  `).join("");
  }
  function renderCards() {
    const c=state.flashcards;
    if(!c.length){$("#flashcardViewer").innerHTML='<p class="muted">هنوز فلش‌کارتی نساخته‌ای.</p>';}
    else {activeFlash=((activeFlash%c.length)+c.length)%c.length;const card=c[activeFlash];$("#flashcardViewer").innerHTML=`<div class="muted">کارت ${activeFlash+1} از ${c.length}</div><strong>${showAnswer?"پاسخ":"سؤال"}</strong><p>${escapeHtml(showAnswer?card.answer:card.question)}</p>`;}
    $("#flipCard").disabled=!c.length;$("#nextCard").disabled=c.length<2;$("#deleteCard").disabled=!c.length;
    $("#flipCard").textContent=showAnswer?"نمایش سؤال":"نمایش پاسخ";
  }
  function renderChat() {
    const box=$("#chatMessages");
    const saved=state.chat.slice(-30);
    if (!saved.length) {
  box.innerHTML = `
    <div class="message assistant-message">
      <b>NEXORA</b>
      <p>سلام! من NEXORA هستم. آماده‌ام تا در انجام کارها کمکت کنم.</p>
    </div>
  `;
  return;
    }
    box.innerHTML=saved.map(m=>`<div class="message ${m.role==="user"?"user-message":"assistant-message"}"><b>${m.role==="user"?"شما":"NEXORA"}</b><p>${escapeHtml(m.content)}</p></div>`).join("");
    box.scrollTop=box.scrollHeight;
  }
 function renderHistory() {
  const box = $("#historyList");

  if (!state.chat.length) {
    box.innerHTML = '<p class="muted">هنوز گفت‌وگویی ذخیره نشده است.</p>';
    return;
  }

  box.innerHTML = `
    <div class="history-header">
      <strong>گفت‌وگوی فعلی</strong>
      <button class="button button-quiet" id="clearHistory" type="button">
        پاک‌کردن تاریخچه
      </button>
    </div>
    <div class="history-messages">
      ${state.chat.map(m => `
        <article class="message ${m.role === "user" ? "user-message" : "assistant-message"}">
          <b>${m.role === "user" ? "شما" : "NEXORA"}</b>
          <p>${escapeHtml(m.content)}</p>
        </article>
      `).join("")}
    </div>
  `;

  $("#clearHistory").addEventListener("click", () => {
    if (!confirm("تاریخچه گفتگو پاک شود؟")) return;
    state.chat = [];
    saveState();
    renderChat();
    renderHistory();
    toast("تاریخچه پاک شد.");
  });
 } function renderAll() {
  document.documentElement.classList.toggle("light-theme",state.theme==="light");
  $("#noteInput").value=state.note;
  renderTools();
  renderTasks();
  renderNotes();
  renderCards();
  renderChat();
  renderHistory();
  
  }
  function setPageLabel(hash) {
    const names = {
        home: "خانه",
        explore: "کشف ابزارها",
        favorites: "علاقه‌مندی‌ها",
        assistant: "دستیار هوشمند",
        imageLab: "تولید تصویر",
        textLab: "خلاصه‌سازی و ترجمه",
        codeLab: "دستیار برنامه‌نویسی",
        pdfLab: "تحلیل فایل PDF",
        voiceLab: "گفت‌وگوی صوتی",
        history: "تاریخچه گفتگوها",
        workspace: "فضای کار",
        settings: "تنظیمات"
    };

    const currentHash = hash || "#home";

    $("#pageLabel").textContent =
        names[currentHash.slice(1)] || "خانه";

    $$(".nav-item").forEach(a =>
        a.classList.toggle(
            "active",
            a.getAttribute("href") === currentHash
        )
    );
  
  }

  $("#searchInput").addEventListener("input",renderTools);
  $("#searchInput").addEventListener("keydown",e=>{if(e.key==="Escape"){e.target.value="";renderTools();e.target.blur();}});
  $("#clearSearch").addEventListener("click",()=>{$("#searchInput").value="";selectedCategory="all";renderTools();});
  $("#categoryRow").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(b){selectedCategory=b.dataset.category;renderTools();}});
  document.addEventListener("click",e=>{
    const fav=e.target.closest("[data-favorite]");
    if(fav){const id=fav.dataset.favorite;state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];saveState();renderTools();}
    const toggle=e.target.closest("[data-task-toggle]");
    if(toggle){state.tasks[+toggle.dataset.taskToggle].done=toggle.checked;saveState();renderTasks();}
    const del=e.target.closest("[data-task-delete]");
    if(del){state.tasks.splice(+del.dataset.taskDelete,1);saveState();renderTasks();}
    const noteDelete = e.target.closest("[data-note-delete]");
if (noteDelete) {
  state.notes.splice(Number(noteDelete.dataset.noteDelete), 1);
  saveState();
  renderNotes();
  toast("یادداشت حذف شد.");
}
  });
  $("#menuToggle").addEventListener("click",()=>{const open=$("#sidebar").classList.toggle("open");$("#menuToggle").setAttribute("aria-expanded",String(open));});
  $$(".nav-item").forEach(a=>a.addEventListener("click",()=>{$("#sidebar").classList.remove("open");$("#menuToggle").setAttribute("aria-expanded","false");setPageLabel(a.getAttribute("href"));}));
  document.addEventListener("click",e=>{if(innerWidth<=760 && !$("#sidebar").contains(e.target) && !$("#menuToggle").contains(e.target)){$("#sidebar").classList.remove("open");$("#menuToggle").setAttribute("aria-expanded","false");}});
  window.addEventListener("hashchange",()=>setPageLabel(location.hash));
  function updateThemeStatus() {
  const status = $("#themeStatus");
  if (status) {
    status.textContent = "پوسته فعلی: " + (state.theme === "light" ? "روشن" : "تاریک");
  }
}

$("#themeToggle").addEventListener("click",()=>{
  state.theme=state.theme==="light"?"dark":"light";
  saveState();
  renderAll();
  updateThemeStatus();
});

$("#settingsThemeToggle").addEventListener("click",()=>{
  state.theme=state.theme==="light"?"dark":"light";
  saveState();
  renderAll();
  updateThemeStatus();
});
  $("#saveNote").addEventListener("click",()=>{
  const note = $("#noteInput").value.trim();

  if (!note) {
    $("#noteStatus").textContent = "ابتدا یک یادداشت بنویس.";
    return;
  }

  state.notes.push(note);
  state.note = note;
  $("#noteInput").value = "";
  saveState();
  renderNotes();

  $("#noteStatus").textContent = "یادداشت ذخیره شد.";
  toast("یادداشت ذخیره شد.");
});
  $("#taskForm").addEventListener("submit",e=>{e.preventDefault();const text=$("#taskInput").value.trim();if(!text)return;state.tasks.push({text,done:false});$("#taskInput").value="";saveState();renderTasks();});
  $("#makePrompt").addEventListener("click",()=>{const subject=$("#promptSubject").value.trim();if(!subject){toast("اول موضوع تصویر را وارد کن.");$("#promptSubject").focus();return;}$("#promptOutput").value=`${subject}، سبک ${$("#promptStyle").value}، ترکیب‌بندی حرفه‌ای، نورپردازی دقیق، جزئیات بالا، کیفیت بالا، بدون نوشته و واترمارک`;$("#promptStatus").textContent="پرامپت ساخته شد؛ برای تولید تصویر آن را در یک ابزار تصویر وارد کن.";});
  $("#copyPrompt").addEventListener("click",async()=>{const val=$("#promptOutput").value;if(!val){toast("اول پرامپت را بساز.");return;}try{await navigator.clipboard.writeText(val);$("#promptStatus").textContent="پرامپت کپی شد.";}catch{$("#promptOutput").select();const ok=document.execCommand("copy");$("#promptStatus").textContent=ok?"پرامپت کپی شد.":"متن را دستی کپی کن.";}});
  $("#flashcardForm").addEventListener("submit",e=>{e.preventDefault();state.flashcards.push({question:$("#flashQuestion").value.trim(),answer:$("#flashAnswer").value.trim()});$("#flashQuestion").value="";$("#flashAnswer").value="";activeFlash=state.flashcards.length-1;showAnswer=false;saveState();renderCards();});
  $("#flipCard").addEventListener("click",()=>{showAnswer=!showAnswer;renderCards();});
  $("#nextCard").addEventListener("click",()=>{activeFlash++;showAnswer=false;renderCards();});
  $("#deleteCard").addEventListener("click",()=>{if(!state.flashcards.length)return;state.flashcards.splice(activeFlash,1);showAnswer=false;saveState();renderCards();});
  $("#chatForm").addEventListener("submit",async e=>{
    e.preventDefault();const input=$("#chatInput"),message=input.value.trim();if(!message)return;
    state.chat.push({role:"user",content:message});input.value="";saveState();renderChat();$("#sendMessage").disabled=true;
    const status=$("#aiStatus");status.textContent="در حال اتصال…";
    try{
      const response=await fetch("https://nexora-ai-1-y8x8.onrender.com/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,history:state.chat.slice(-12).map(({role,content})=>({role,content}))})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||"سرور هوش مصنوعی هنوز تنظیم نشده است.");
      if(!data.reply)throw new Error("سرور پاسخی برنگرداند.");
      state.chat.push({role:"assistant",content:data.reply});status.textContent="متصل";status.style.color="var(--green)";
    }catch(err){state.chat.push({role:"assistant",content:`پاسخ هوش مصنوعی در دسترس نیست: ${err.message} برای فعال‌شدن گفت‌وگو، سرور را اجرا و کلید API را در فایل تنظیمات سرور وارد کن.`});status.textContent="نیازمند اتصال API";status.style.color="";}
    finally{$("#sendMessage").disabled=false;saveState();renderChat();renderHistory();}
  });
    $("#processText").addEventListener("click", async () => {
    const input = $("#textInput");
    const result = $("#textResult");
    const button = $("#processText");

    const text = input.value.trim();
    const action = $("#textAction").value;

    if (!text) {
      result.textContent = "ابتدا متن موردنظر را وارد کن.";
      input.focus();
      return;
    }

    const prompt = action === "summarize"
      ? "متن زیر را به زبان فارسی، دقیق و روان خلاصه کن:\n\n" + text
      : "متن زیر را به زبان فارسی ترجمه کن. اگر متن فارسی است، آن را به انگلیسی ترجمه کن:\n\n" + text;

    button.disabled = true;
    result.textContent = "در حال پردازش متن...";

    try {
      const response = await fetch(
        "https://nexora-ai-1-y8x8.onrender.com/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ message: prompt })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "خطا در پردازش متن");
      }

      if (!data.reply) {
        throw new Error("پاسخی از سرور دریافت نشد.");
      }

      result.textContent = data.reply;

    } catch (error) {
      result.textContent = "خطا: " + error.message;
    } finally {
      button.disabled = false;
    }
  });
  $("#exportData").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="nexora-backup.json";a.click();URL.revokeObjectURL(url);$("#backupStatus").textContent="فایل پشتیبان ساخته شد.";});
  $("#importData").addEventListener("change",async e=>{const file=e.target.files?.[0];if(!file)return;try{const imported=JSON.parse(await file.text());if(!imported||typeof imported!=="object")throw Error();state={...defaultState,...imported};saveState();renderAll();$("#backupStatus").textContent="پشتیبان بازیابی شد.";}catch{$("#backupStatus").textContent="فایل پشتیبان معتبر نیست.";}e.target.value="";});
  $("#clearLocalData").addEventListener("click",()=>{if(!confirm("همه اطلاعات محلی NEXORA AI از این مرورگر حذف شود؟"))return;localStorage.removeItem(STORAGE_KEY);state={...defaultState};activeFlash=0;showAnswer=false;renderAll();$("#backupStatus").textContent="داده‌های محلی پاک شدند.";});
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("#installButton").hidden=false;});
  $("#installButton").addEventListener("click",async()=>{if(!deferredInstall){toast("از منوی مرورگر گزینهٔ Add to Home screen را بررسی کن.");return;}deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("#installButton").hidden=true;});
  if("serviceWorker" in navigator && /^https?:$/.test(location.protocol)){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
  if(location.protocol==="file:")$("#connectionStatus").textContent="پیش‌نمایش محلی";
  setPageLabel(location.hash);renderAll();
});
