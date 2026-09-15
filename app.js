(() => {
  const STORAGE_KEY = "s-city-newsroom-v1";
  const TEACHER_MODE = new URLSearchParams(window.location.search).get("teacher") === "1";
  const $ = (selector, root = document) => root.querySelector(selector);
  const app = $("#app");
  const NEWSROOM_ROLES = [
    {id:"editorial",label:"主编 / 选题"},
    {id:"reporting",label:"记者 / 调查"},
    {id:"verification",label:"核实"},
    {id:"production",label:"文字 / 版面"}
  ];
  const emptyMembers = () => Array.from({length:4},()=>({name:"",roles:[]}));
  const REPORTING_SLOT_KEYS = Object.keys(REPORTING_GENRES);
  const slotFamily = (slot) => REPORTING_GENRES[slot]?.family || slot;
  const emptySlotSet = (valueFactory=()=>null) => Object.fromEntries(REPORTING_SLOT_KEYS.map(slot=>[slot,valueFactory(slot)]));
  const emptyWritingSet = () => emptySlotSet(()=>({}));
  const freshReporting = () => ({
    selectedStories:emptySlotSet(()=>null),
    acquiredMaterialIds:[], news1Actions:[], news2Actions:[], newsActions:[], communicationActions:[], featureFollowUp:null,
    commentaryActions:[], writingPlans:emptyWritingSet(),
    selectedAngles:emptySlotSet(()=>null), customAngles:emptySlotSet(()=>""),
    drafts:emptySlotSet(()=>null),
    unlockedStoryIds:[]
  });
  const freshState = () => ({
    currentScene:"cover", currentRound:0, remainingInvestigations:0, grantedRounds:[],
    discoveredLocations:[], discoveredEvents:[], editorialStatuses:{}, statusHistory:{},
    investigationHistory:[], meeting1Snapshot:null, meeting2Snapshot:null,
    publicationDecision:null, middayBulletin:null, middayBulletinVersions:[], finalEdition:null, discardedStories:[], finalReflection:null,
    newsroomProfile:{name:"",members:emptyMembers()},
    editionBriefIds:[],
    selectedLocation:null, selectedEvent:null, currentDesk:"city", wireTab:"discovered", wireFilter:"all", deskOpenCounts:{city:0,government:0,markets:0,national_world:0},
    sceneHistory:[], previousScene:null, deadlineLocked:false, publishedAt:null,
    reporting:freshReporting()
  });
  function normalizeReporting(reporting={}) {
    const base=freshReporting();
    const validStoryIds=new Set(REPORTING_STORIES.map(story=>story.id));
    const validMaterialIds=new Set(REPORTING_MATERIALS.map(item=>item.id));
    const legacySelected=reporting.selectedStories||{};
    const selectedStories={...base.selectedStories,...legacySelected};
    if(!selectedStories.news1&&legacySelected.news)selectedStories.news1=legacySelected.news;
    Object.keys(selectedStories).forEach(genre=>{if(!validStoryIds.has(selectedStories[genre]))selectedStories[genre]=null;});
    const cleanIds=value=>[...new Set(Array.isArray(value)?value:[])].filter(id=>validMaterialIds.has(id));
    const legacyNewsActions=cleanIds([...(reporting.newsActions||[]),...(reporting.communicationActions||[])]);
    const actionsForStory=(ids,storyId)=>storyId
      ? ids.filter(id=>REPORTING_MATERIALS.find(item=>item.id===id)?.storyline===storyId)
      : [];
    /* 旧版的两篇消息共用 newsActions；按已选故事安全拆分，无法区分时保留到对应消息中。 */
    const news1Actions=Array.isArray(reporting.news1Actions)
      ? cleanIds(reporting.news1Actions)
      : selectedStories.news1?actionsForStory(legacyNewsActions,selectedStories.news1):legacyNewsActions;
    const news2Legacy=cleanIds([...(reporting.communicationActions||[]),...legacyNewsActions]);
    const news2Actions=Array.isArray(reporting.news2Actions)
      ? cleanIds(reporting.news2Actions)
      : selectedStories.news2?actionsForStory(news2Legacy,selectedStories.news2):cleanIds(reporting.communicationActions);
    const legacyDrafts=reporting.drafts||{};
    const drafts={...base.drafts,...legacyDrafts};
    if(!drafts.news1&&legacyDrafts.news)drafts.news1={...legacyDrafts.news,genre:"news1"};
    delete drafts.news; delete drafts.communication;
    const legacyPlans=reporting.writingPlans||{};
    const writingPlans={...base.writingPlans,...legacyPlans};
    if(!Object.keys(writingPlans.news1||{}).length&&legacyPlans.news)writingPlans.news1=legacyPlans.news;
    delete writingPlans.news; delete writingPlans.communication;
    const selectedAngles={...base.selectedAngles,...(reporting.selectedAngles||{})};
    const customAngles={...base.customAngles,...(reporting.customAngles||{})};
    return {
      ...base,...reporting,selectedStories,
      acquiredMaterialIds:cleanIds(reporting.acquiredMaterialIds),
      news1Actions,news2Actions,
      newsActions:cleanIds([...news1Actions,...news2Actions]),
      communicationActions:cleanIds(reporting.communicationActions),
      commentaryActions:cleanIds(reporting.commentaryActions),
      featureFollowUp:validMaterialIds.has(reporting.featureFollowUp)?reporting.featureFollowUp:null,
      selectedAngles,customAngles,writingPlans,drafts,
      unlockedStoryIds:[...new Set(Array.isArray(reporting.unlockedStoryIds)?reporting.unlockedStoryIds:[])].filter(id=>validStoryIds.has(id))
    };
  }
  function normalizeNewsroomProfile(profile={}) {
    const allowed=new Set(NEWSROOM_ROLES.map(role=>role.id));
    if(Array.isArray(profile.members)){
      return {name:typeof profile.name==="string"?profile.name:"",members:emptyMembers().map((empty,index)=>{const member=profile.members[index]||empty;return {name:typeof member.name==="string"?member.name:"",roles:[...new Set(Array.isArray(member.roles)?member.roles.filter(role=>allowed.has(role)):[])]};})};
    }
    /* 兼容上一版5个固定岗位：最多保留4名成员，溢出的职责并入最接近的编辑成员。 */
    const migrated=[];
    const addLegacy=(name,role)=>{
      if(typeof name!=="string"||!name.trim())return;
      const clean=name.trim();
      let member=migrated.find(item=>item.name===clean);
      if(!member&&migrated.length<4){member={name:clean,roles:[]};migrated.push(member);}
      if(!member){member=role==="production"?migrated.find(item=>item.roles.includes("editorial")):migrated.find(item=>item.roles.includes(role));member=member||migrated[0];}
      if(member&&!member.roles.includes(role))member.roles.push(role);
    };
    addLegacy(profile.editorInChief,"editorial");
    addLegacy(profile.cityReporter,"reporting");
    addLegacy(profile.verificationEditor,"verification");
    addLegacy(profile.copyEditor,"production");
    addLegacy(profile.dataReporter,"reporting");
    return {name:typeof profile.name==="string"?profile.name:"",members:[...migrated,...emptyMembers()].slice(0,4)};
  }
  let newsroomState = loadState();

  function loadState() {
    try {
      const base = freshState();
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const state = {
        ...base,
        ...stored,
        newsroomProfile: normalizeNewsroomProfile(stored.newsroomProfile || base.newsroomProfile),
        reporting: normalizeReporting(stored.reporting || base.reporting),
        editionBriefIds: Array.isArray(stored.editionBriefIds) ? stored.editionBriefIds : (stored.finalEdition?.newsBriefIds || []),
        deskOpenCounts: { ...base.deskOpenCounts, ...(stored.deskOpenCounts || {}) },
        sceneHistory: Array.isArray(stored.sceneHistory) ? stored.sceneHistory : [],
        previousScene: typeof stored.previousScene === "string" ? stored.previousScene : null,
        wireTab: "discovered",
        wireFilter: ["all","tracking","pending","confirmed"].includes(stored.wireFilter) ? stored.wireFilter : "all"
      };
      state.discoveredEvents = (state.discoveredEvents || []).filter(id=>EVENTS.some(event=>event.id===id));
      state.discoveredLocations = (state.discoveredLocations || []).filter(id=>LOCATIONS.some(location=>location.id===id));
      state.editionBriefIds = [...new Set(state.editionBriefIds)].filter(id=>state.discoveredEvents.includes(id));
      return state;
    }
    catch { return freshState(); }
  }
  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(newsroomState)); }
  function toast(message) { const box=$("#toast"); box.textContent=message; box.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>box.classList.remove("show"),2200); }
  function eventById(id) { return EVENTS.find(event => event.id === id); }
  function locationById(id) { return LOCATIONS.find(location => location.id === id); }
  function html(value="") { return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]); }
  function draftDisplayTitle(genre,draft){ const story=reportingStory(draft?.storyline); return draft?.title?.trim() || story?.title || REPORTING_GENRES[genre]?.label || "未命名稿件"; }
  function activeNewsroomMembers() { return (newsroomState.newsroomProfile.members||[]).filter(member=>member.name?.trim()); }
  function memberNamesForRole(roleId) { return activeNewsroomMembers().filter(member=>member.roles.includes(roleId)).map(member=>member.name.trim()).join("、"); }
  function roleLabel(roleId) { return NEWSROOM_ROLES.find(role=>role.id===roleId)?.label||roleId; }
  function isReportingEdition(edition=newsroomState.finalEdition) { return edition?.mode === "reporting"; }
  function draftCompleted(draft) { return Boolean(draft?.completed ?? draft?.submitted); }
  function allReportingDraftsSubmitted() { return REPORTING_SLOT_KEYS.every(slot=>draftCompleted(newsroomState.reporting.drafts[slot])); }
  function leadReportingDraft() {
    if(!isReportingEdition()) return null;
    return newsroomState.reporting.drafts[newsroomState.finalEdition.leadGenre] || null;
  }
  function isLeadEvent(id) {
    if(isReportingEdition()) {
      const draft=leadReportingDraft();
      return draft ? storyEvents(draft.storyline).some(event=>event.id===id) : false;
    }
    return newsroomState.finalEdition?.headline?.eventId===id;
  }
  function isDiscovered(id) { return newsroomState.discoveredEvents.includes(id); }
  function prerequisitesMet(event) {
    const all = !event.prerequisites?.length || event.prerequisites.every(isDiscovered);
    const any = !event.prerequisitesAny?.length || event.prerequisitesAny.some(isDiscovered);
    return all && any;
  }
  function discover(id, method="地点查询") {
    if (isDiscovered(id)) return false;
    newsroomState.discoveredEvents.push(id);
    newsroomState.editorialStatuses[id] = newsroomState.editorialStatuses[id] || "pending";
    newsroomState.statusHistory[id] = newsroomState.statusHistory[id] || [{ time:SIMULATION.rounds[newsroomState.currentRound]?.time || "09:00", status:"pending", method }];
    return true;
  }
  function grantRound(round) {
    for (let current = 1; current <= round; current++) {
      if (!newsroomState.grantedRounds.includes(current)) {
        newsroomState.remainingInvestigations += SIMULATION.investigationGrants[current];
        newsroomState.grantedRounds.push(current);
      }
    }
    newsroomState.currentRound = Math.max(newsroomState.currentRound, round);
    saveState();
  }
  function go(scene, { record=true }={}) {
    const from=newsroomState.currentScene;
    if(record&&from&&from!==scene){
      newsroomState.sceneHistory.push(from);
      if(newsroomState.sceneHistory.length>80)newsroomState.sceneHistory.shift();
      newsroomState.previousScene=from;
    }
    newsroomState.currentScene=scene;saveState();render();window.scrollTo(0,0);
  }
  function goBack() {
    if(newsroomState.currentScene==="cover")return;
    const parent={briefing:"cover",round1:"briefing",meeting1:"round1",transition2:"meeting1",round2:"transition2",meeting2:"round2",publicationDecision:"meeting2",midday:"meeting2",transition3:"publicationDecision",round3:"transition3",deadline:"round3",reportingIntro:"deadline",reportingSelect:"reportingIntro",reportingNews1:"reportingSelect",reportingNews2:"reportingSelect",reportingFeature:"reportingSelect",reportingCommentary:"reportingSelect",writingNews1:"reportingNews1",writingNews2:"reportingNews2",writingFeature:"reportingFeature",writingCommentary:"reportingCommentary",edition:"reportingSelect",published:"edition",review:"published",bulletinVersion:"round3"};
    const from=newsroomState.currentScene;
    let target=null;
    while(newsroomState.sceneHistory.length&&!target){
      const candidate=newsroomState.sceneHistory.pop();
      if(candidate&&candidate!==from)target=candidate;
    }
    target=target||parent[from]||"cover";
    newsroomState.previousScene=from;
    newsroomState.currentScene=target;saveState();render();window.scrollTo(0,0);
  }
  function knownEvents() { return newsroomState.discoveredEvents.map(eventById).filter(Boolean).sort((a,b)=>b.publishTime.localeCompare(a.publishTime)); }
  function filteredKnownEvents() {
    const all=knownEvents(),filter=newsroomState.wireFilter||"all";
    if(filter==="all")return all;
    return all.filter(event=>newsroomState.editorialStatuses[event.id]===filter);
  }
  function wireFilterButton(id,label,symbol="") {
    const count=id==="all"?knownEvents().length:knownEvents().filter(event=>newsroomState.editorialStatuses[event.id]===id).length;
    const shown=["pending","confirmed"].includes(id)
      ? termInfo(label,"这里统计的是本组主动添加的编辑标记，不等于线索来源本身的核实状态。")
      : label;
    return `<button type="button" data-wire-filter="${id}" class="${newsroomState.wireFilter===id?"active":""}">${symbol}${shown}<b>${count}</b></button>`;
  }
  function clipEvents() { return knownEvents(); }
  function reportingStory(id) { return REPORTING_STORIES.find(story=>story.id===id); }
  function reportingMaterial(id) { return REPORTING_MATERIALS.find(item=>item.id===id); }
  function reportingFamilyLabel(family) {
    return ({news:"消息",feature:"新闻特写",commentary:"评论"})[family] || REPORTING_GENRES[family]?.label || family;
  }
  function reportingActionKey(genre) {
    const family=slotFamily(genre);
    if(family==="news")return genre==="news2"?"news2Actions":"news1Actions";
    if(family==="commentary")return "commentaryActions";
    return null;
  }
  function reportingActionIds(genre) {
    const key=reportingActionKey(genre);
    return key&&Array.isArray(newsroomState.reporting[key])?newsroomState.reporting[key]:[];
  }
  function storyEvents(storyOrId) {
    const story=typeof storyOrId==="string"?reportingStory(storyOrId):storyOrId;
    if(!story)return[];
    return knownEvents().filter(event=>story.eventIds?.includes(event.id)||(story.eventStoryline&&event.storyline===story.eventStoryline)).sort((a,b)=>a.publishTime.localeCompare(b.publishTime));
  }
  function independentSourceCount(events=[]) {
    return new Set(events.map(event=>`${event.source||""}|${event.sourceType||""}`).filter(Boolean)).size;
  }
  function discoveredDuringRound(event,round) {
    const first=(newsroomState.statusHistory[event.id]||[])[0];
    return first?.time===SIMULATION.rounds[round]?.time;
  }
  function isStoryUnlocked(story) {
    const rule=story.unlock||{};
    if(rule.any?.length&&!rule.any.some(isDiscovered))return false;
    if(rule.all?.length&&!rule.all.every(isDiscovered))return false;
    if(rule.storyline){
      const events=knownEvents().filter(event=>event.storyline===rule.storyline);
      if(events.length<(rule.minimum||1))return false;
      const locations=new Set(events.map(event=>event.location));
      if(locations.size<(rule.minimumLocations||1))return false;
    }
    return true;
  }
  function availableReportingStories() { return REPORTING_STORIES.filter(isStoryUnlocked); }
  function reportingMaterialChannels(storyOrId) {
    const story=typeof storyOrId==="string"?reportingStory(storyOrId):storyOrId;if(!story)return[];
    const items=materialsFor(story.id);const channels=[];
    if(items.some(item=>item.type==="interview"))channels.push("人物采访");
    if(items.some(item=>item.type==="field_note"))channels.push("现场观察");
    if(items.some(item=>item.type==="background"))channels.push("背景资料");
    if(items.some(item=>item.type==="data"))channels.push("数据资料");
    if(items.some(item=>item.type==="viewpoint"))channels.push("多方观点");
    return channels;
  }
  function reportingPlanFeasibility() {
    const candidates={};
    REPORTING_SLOT_KEYS.forEach(genre=>{candidates[genre]=availableReportingStories().filter(story=>story.genres.includes(slotFamily(genre)));});
    const missingGenres=Object.entries(candidates).filter(([,items])=>!items.length).map(([genre])=>REPORTING_GENRES[genre].label);
    const reasons=[];
    if(missingGenres.length)reasons.push(`还缺可用于${missingGenres.join("、")}的已发现故事`);
    if(newsroomState.discoveredEvents.length<6)reasons.push(`你们目前发现的新闻较少，后续日报可选择的内容也会较少`);
    return {ready:!missingGenres.length,reasons,candidates};
  }
  function attemptDeadline() {
    const readiness=reportingPlanFeasibility();
    if(newsroomState.discoveredEvents.length<6&&!confirm("你们目前发现的新闻较少，后续可以选择的版面内容也会较少。\n\n点“取消”继续寻找；点“确定”仍然截稿。"))return;
    newsroomState.deadlineLocked=true;saveState();go("deadline");
    if(readiness.reasons[0])toast(`已进入截稿；提示：${readiness.reasons[0]}`);
  }
  function rememberUnlockedStories() {
    const ids=availableReportingStories().map(story=>story.id);
    newsroomState.reporting.unlockedStoryIds=[...new Set([...newsroomState.reporting.unlockedStoryIds,...ids])];
    return ids;
  }
  function materialsFor(storyId,genre) { const family=genre?slotFamily(genre):null;return REPORTING_MATERIALS.filter(item=>item.storyline===storyId&&(!family||item.genres.includes(family))); }
  function acquireMaterial(id) {
    if(!reportingMaterial(id)||newsroomState.reporting.acquiredMaterialIds.includes(id))return false;
    newsroomState.reporting.acquiredMaterialIds.push(id);return true;
  }
  function ensureAutomaticMaterials() {
    Object.entries(newsroomState.reporting.selectedStories).forEach(([genre,storyId])=>{
      if(!storyId)return;
      materialsFor(storyId,genre).filter(item=>item.autoGenres.includes(slotFamily(genre))).forEach(item=>acquireMaterial(item.id));
    });
  }
  function acquiredMaterials(storyId,genre) {
    return newsroomState.reporting.acquiredMaterialIds.map(reportingMaterial).filter(item=>item&&item.storyline===storyId&&(!genre||item.genres.includes(slotFamily(genre))));
  }
  function isViewpointMaterial(item) { return item.type==="viewpoint"||(item.type==="interview"&&item.autoGenres.includes("commentary")); }
  function featureCompleteness(storyId) {
    const items=acquiredMaterials(storyId,"feature");
    const field=items.filter(item=>item.type==="field_note");
    const observations=field.flatMap(item=>item.observations||[]);
    const hasTimeAndPlace=field.some(item=>/\d{1,2}:\d{2}/.test(`${item.title} ${item.source?.identity||""}`));
    const follow=reportingMaterial(newsroomState.reporting.featureFollowUp);
    const missing=[];
    if(!field.length)missing.push("还需要完整现场笔记");
    if(!hasTimeAndPlace)missing.push("现场笔记需要明确时间与地点");
    if(observations.length<3)missing.push(`还需要 ${3-observations.length} 项可观察细节`);
    if(!follow||follow.storyline!==storyId)missing.push("还需要选择并跟随 1 位人物");
    return {complete:!missing.length,missing,observations:observations.length,follow};
  }
  function commentaryCompleteness(storyId) {
    const items=acquiredMaterials(storyId,"commentary");
    const factMaterials=items.filter(item=>item.factContribution&&!isViewpointMaterial(item));
    const factCount=storyEvents(storyId).length+factMaterials.length;
    const viewpoints=items.filter(isViewpointMaterial);
    const independent=new Set(viewpoints.map(item=>item.source?.name||item.id)).size;
    const support=items.some(item=>["background","data"].includes(item.type)||item.sourceTag==="第三方专家");
    const missing=[];
    if(factCount<3)missing.push(`还需要 ${3-factCount} 项事实依据`);
    if(independent<2)missing.push(`还需要 ${2-independent} 个不同观点`);
    if(!support)missing.push("还需要 1 份政策、数据或第三方材料");
    return {complete:!missing.length,missing,factCount,viewpoints:independent,support};
  }
  function reportingCompleteness(genre,storyId) {
    const family=slotFamily(genre);
    if(family==="news")return {complete:storyEvents(storyId).length>0,missing:[]};
    if(family==="feature")return featureCompleteness(storyId);
    if(family==="commentary")return commentaryCompleteness(storyId);
    return {complete:storyEvents(storyId).length>0,missing:[]};
  }
  function reportingSceneFor(genre,writing=false) { return `${writing?"writing":"reporting"}${genre[0].toUpperCase()}${genre.slice(1)}`; }
  function materialTypeLabel(type) { return ({fact:"事实",interview:"人物采访",field_note:"现场笔记",background:"背景资料",viewpoint:"观点",data:"数据资料"})[type]||type; }
  function angleCardsFor(genre,storyId) {
    const family=slotFamily(genre), cards=REPORTING_ANGLE_CARDS?.[family]?.[storyId]||[];
    return cards.filter(card=>{
      const badEvents=(card.eventIds||[]).filter(id=>!eventById(id));
      const badMaterials=(card.materialIds||[]).filter(id=>{const item=reportingMaterial(id);return !item||!item.genres.includes(family);});
      if(badEvents.length||badMaterials.length){console.error("Invalid reporting angle card",{storyId,genre,cardId:card.id,badEvents,badMaterials});return false;}
      return true;
    });
  }
  function angleText(genre) {
    const storyId=newsroomState.reporting.selectedStories[genre];
    const selected=newsroomState.reporting.selectedAngles?.[genre];
    if(selected==="custom")return newsroomState.reporting.customAngles?.[genre]?.trim()||"自定报道角度";
    const card=angleCardsFor(genre,storyId).find(item=>item.id===selected);
    return card?.title||"尚未选择报道角度";
  }
  function renderAngleChooser(genre,storyId) {
    const cards=angleCardsFor(genre,storyId), selected=newsroomState.reporting.selectedAngles?.[genre]||"", custom=newsroomState.reporting.customAngles?.[genre]||"";
    const cardHtml=cards.map(card=>{const materials=(card.materialIds||[]).map(reportingMaterial).filter(Boolean);return `<article class="angle-card ${selected===card.id?"active":""}"><span>ANGLE CARD</span><h3>${html(card.title)}</h3><p>${html(card.question)}</p>${materials.length?`<small>材料提示：${materials.map(item=>materialTypeLabel(item.type)).join(" · ")}</small>`:""}${card.hint?`<em>${html(card.hint)}</em>`:""}<button data-angle-card="${card.id}" data-angle-genre="${genre}">${selected===card.id?"已选择":"选择这个角度"}</button></article>`;}).join("");
    return `<section class="angle-panel"><header><span>REPORTING ANGLE</span><h2>报道角度提示卡</h2><p>提示卡只告诉你可以追问什么，不提前展示材料内容。你也可以使用自己的角度。</p></header><div class="angle-grid">${cardHtml||`<div class="desk-empty">当前故事暂无预设角度卡，可使用自定报道角度。</div>`}</div><article class="angle-custom ${selected==="custom"?"active":""}"><label>我有自己的报道角度<textarea data-custom-angle="${genre}" placeholder="我们最想回答：____">${html(custom)}</textarea></label><button data-save-custom-angle="${genre}">保存自定角度</button></article><p class="current-angle">当前报道角度：<b>${html(angleText(genre))}</b></p></section>`;
  }
  function wordCount(text="") { return String(text).replace(/\s/g,"").length; }
  function writingCountFeedback(count,min,max) {
    if(!count)return{className:"empty",text:"正文尚未填写"};
    if(count<min)return{className:"under",text:`还差 ${min-count} 字达到建议下限`};
    if(count>max)return{className:"over",text:`超过建议上限 ${count-max} 字`};
    return{className:"ready",text:"已在建议篇幅内"};
  }
  function updateWritingCount(text,min,max) {
    const counter=$("#writingCount");if(!counter)return;
    const count=wordCount(text),feedback=writingCountFeedback(count,min,max);
    counter.className=feedback.className;
    counter.textContent=`${count} 字 · ${feedback.text}`;
  }
  function verificationLabel(status) { return ({verified:"已核实",partially_verified:"部分核实",single_source:"单一来源",unverified:"尚未核实",debunked:"已证伪",under_investigation:"调查中"})[status] || status; }
  function accessLabel(value) { if(typeof value==="object")return value.acquisition||accessLabel(value.accessType);return ({location:"地点查询",investigation:"记者采访",public:"官方发布",map:"地点查询",desk_discovery:"地点查询"})[value]||value; }
  function deskLabel(event) { return event.region === "国际" || event.scope === "world" ? "国际" : event.region === "全国" || event.scope === "national" ? "全国" : DESKS[event.desk]?.short || "城市"; }
  function publishedSectionLabel(event) {
    if (!event) return "S城";
    if (event.scope === "world" || event.region === "国际") return "国际";
    if (event.scope === "national" || event.region === "全国") return "全国";
    if (event.desk === "markets" || event.scope === "market") return "财经";
    if (event.desk === "government" || event.scope === "government") return "政务";
    return "S城";
  }
  function sourceClass(type) { return /传言|社交/.test(type)?"uncertain":/官方|通报|校方/.test(type)?"official":"reported"; }
  function iconGroup(location) { if(/交通|口岸|港航|道路/.test(location.category))return"transport";if(/政务|应急|通讯社/.test(location.category))return"civic";if(/教育|科研/.test(location.category))return"education";if(/医疗/.test(location.category))return"medical";if(/金融|财经|商业|产业|制造|会展/.test(location.category))return"business";return"culture"; }

  function masthead(extra="") {
    const round=SIMULATION.rounds[newsroomState.currentRound];
    const resourceStatus=newsroomState.deadlineLocked
      ? `<span><small>新闻日</small><b class="resource-count">已截稿 🔒</b></span>`
      : `<span><small>剩余采访</small><b class="resource-count">${newsroomState.remainingInvestigations} 次</b></span>`;
    return `<header class="masthead v1-masthead"><div class="identity"><span class="edition">SC</span><div><h1>S城新闻沙盘</h1><p>S CITY DESK · 城市新闻模拟编辑台</p></div></div><div class="desk-status"><span><small>ROUND</small><b>${round?.code || "NEWS DAY"}</b></span><span><small>当前时间</small><b>${round?.time || "09:00"}</b></span><span><small>当前DESK</small><b>${DESKS[newsroomState.currentDesk]?.code || "CITY"}</b></span>${resourceStatus}<span><small>已发现</small><b>${newsroomState.discoveredEvents.length} 条</b></span>${extra}</div></header>`;
  }
  const THINK_PROMPTS={
    round1:["哪件事影响的人更多？","哪件事更紧急？","哪件事你们还不能确定真假？"],
    meeting1:["哪一条最值得继续追？","哪一条最不确定？","哪一条最可能继续发展？"],
    round2:["上午的问题有答案了吗？","有没有新信息支持或推翻原来的判断？"],
    meeting2:["什么让你们更确定？","什么让你们开始怀疑原来的判断？"],
    publicationDecision:["核心事实可靠吗？","有没有第二个相对独立的来源？","还有哪些内容只能说“尚未确认”？"],
    round3:["如果马上截稿，你们最担心哪条新闻还有事实没弄清？"],
    reportingIntro:["这篇文章现在更缺人物、现场、背景、数据，还是不同观点？"],
    reportingSelect:["哪类文体最适合这条新闻？","四篇作品要分散报道，还是集中比较不同写法？"],
    news:["如果读者只看第一句话，他最需要先知道什么？","最新的事实一定是最重要的吗？"],
    feature:["哪个真实的现场或瞬间最值得放大？","素材里有哪些动作、声音和环境细节？"],
    commentary:["你的观点依据是什么？","有没有另一种值得回应的看法？"],
    edition:["头条应该是你们最喜欢的一篇，还是今天公众最需要知道的一篇？"],
    review:["哪条新证据曾经改变过你们的判断？","如果另一组掌握同样的信息，他们一定会做出同一张报纸吗？"]
  };
  function taskHint(text,key) {
    const prompts=THINK_PROMPTS[key]||[];
    return `<section class="student-step-hint"><p><b>现在要做：</b>${text}</p>${prompts.length?`<details><summary>💡 想一想</summary>${prompts.map(item=>`<span>${html(item)}</span>`).join("")}</details>`:""}</section>`;
  }
  function termInfo(term,text){return `<span class="term-info" tabindex="0">${html(term)}<i>${html(text)}</i></span>`;}

  function renderCover() {
    app.innerHTML=`<section class="scene cover-scene"><div class="cover-map" aria-hidden="true"><i></i><i></i><i></i><i></i><span>S湾</span><b>青川河</b></div><div class="cover-copy"><span class="cover-edition">S CITY DESK · V1.0</span><p class="cover-date">SEPTEMBER 15 · S CITY</p><h1>S城新闻沙盘</h1><h2>城市新闻模拟编辑台</h2><blockquote>“你看到的，只是城市的一部分。”</blockquote><button class="primary-action" data-action="enter-briefing">进入编辑部 <span>→</span></button></div></section>`;
  }
  function renderBriefing() {
    const profile=newsroomState.newsroomProfile;
    const started=newsroomState.currentRound>0||newsroomState.grantedRounds.includes(1);
    app.innerHTML=`<section class="scene briefing-scene"><div class="briefing-paper"><header><span>S CITY DAILY · MORNING BRIEF</span><time>${SIMULATION.date} ${SIMULATION.weekday}　09:00</time></header><form id="profileForm" class="briefing-form" novalidate><div class="briefing-grid"><div class="brief-main"><p class="kicker">TODAY'S ASSIGNMENT</p><h1>17:00前，完成今天的新闻采集与编辑判断。</h1><p class="identity-line">你们是<strong>《S城日报》城市新闻部</strong>。17:00之前，你们首先是一间新闻编辑部：决定去哪里、相信什么、继续查什么、什么值得报道。新闻日结束以后，再把真正掌握的事实写成消息一、消息二、新闻特写和评论。</p><div class="edition-rule"><b>17:00</b><span>新闻日截稿</span><i></i><b>4</b><span>课堂形成初稿</span></div><ul><li>发布事实必须注明来源</li><li>关键事实必须得到充分核实</li><li>优先使用相互独立的来源交叉验证</li><li>判断可以修改，但必须说明为什么修改</li></ul></div><aside class="profile-form"><p class="kicker">BUILD YOUR NEWSROOM</p><h2>${started?"修改编辑部资料":"建立编辑部"}</h2><p class="profile-guidance"><b>3—4人组成一个编辑部。</b>4人组可以一人一职；3人组由一名成员兼任两项职责。重要决定由全组共同讨论。</p><label class="profile-name">编辑部名称（选填）<input name="name" value="${html(profile.name)}" placeholder="例如：第三编辑部"></label><div class="member-fields">${profile.members.map((member,index)=>`<article class="member-card"><header><b>成员 ${String(index+1).padStart(2,"0")}</b><small>OPTIONAL</small></header><label class="member-name">姓名（选填）<input name="member${index+1}Name" value="${html(member.name)}" placeholder="填写姓名"></label><div class="member-roles" aria-label="成员${index+1}职责">${NEWSROOM_ROLES.map(role=>`<label><input type="checkbox" name="member${index+1}Roles" value="${role.id}" ${member.roles.includes(role.id)?"checked":""}><span>${role.label}</span></label>`).join("")}</div></article>`).join("")}</div><p class="profile-note"><b>四项职责：</b>主编 / 选题负责主持讨论和确定重点新闻；记者 / 调查负责寻找线索和选择采访；核实负责检查来源和事实；文字 / 版面负责整理稿件和最终版面。角色分工是课堂建议，不是系统门槛。</p></aside></div><footer><p>采访机会由整个编辑部共享：09:00 +3、13:00 +3、17:00 +2。<br>选择把记者派往哪里，本身就是编辑判断。</p><button class="primary-action" type="submit">${started?"保存编辑部资料":"09:00 开始工作"} <span>→</span></button></footer></form></div></section>`;
  }

  function regionLayer() { return REGIONS.map(region=>`<div class="region tone-${region.tone} region-${region.id}" style="--x:${region.x}%;--y:${region.y}%;--w:${region.w}%;--h:${region.h}%"><span>${region.name}</span></div>`).join(""); }
  function availableLocationEvents(locationId) { if(newsroomState.deadlineLocked)return[];return EVENTS.filter(event=>event.location===locationId&&event.round<=newsroomState.currentRound&&event.accessType!=="investigation"&&!isDiscovered(event.id)&&prerequisitesMet(event)); }
  function mapNodes() {
    return LOCATIONS.map(location=>{
      const unread=availableLocationEvents(location.id).length;
      return `<button class="landmark type-${iconGroup(location)} ${location.entryType?"special-entry":""} ${newsroomState.selectedLocation===location.id?"active":""} ${newsroomState.discoveredLocations.includes(location.id)?"visited":""}" style="--x:${location.x}%;--y:${location.y}%" data-location="${location.id}" title="${html(location.name)}${unread?` · ${unread}条新动态`:""}" aria-label="${location.name}${unread?`，有${unread}条新动态`:""}"><span class="place-icon">${location.icon}</span><span class="place-name">${location.name.replace("S城","")}</span>${unread?`<i class="node-state unseen" title="有新动态"></i>`:""}</button>`;
    }).join("");
  }
  function renderWire() {
    const items=filteredKnownEvents();
    return items.map(event=>`<button class="wire-item ${newsroomState.selectedEvent===event.id?"active":""}" data-event="${event.id}" data-location="${event.location}"><div class="wire-top"><time>${event.publishTime}</time><span>${event.region} · ${locationById(event.location)?.name||""}</span><i></i></div><span class="desk-badge desk-${event.desk}">${deskLabel(event)}</span><h3>${event.title}</h3><p>${event.content}</p><div class="wire-source">来源：${event.source}</div><div class="wire-tags"><span class="${sourceClass(event.sourceType)}">${event.sourceType}</span><span>${verificationLabel(event.verificationStatus)}</span><em>${accessLabel(event)}</em></div></button>`).join("") || `<div class="wire-empty"><b>${knownEvents().length?"当前筛选下没有线索":"尚未发现线索"}</b><span>${knownEvents().length?"切换筛选可查看其他已发现信息。":"点击地图地点，查询该处当前阶段的信息。"}</span>${knownEvents().length?"":`<small>新阶段只会在地图上提示 NEW，不会自动进入这里。</small>`}</div>`;
  }
  function editorialButtons(event) {
    const selected=newsroomState.editorialStatuses[event.id]||"pending";
    return `<div class="editorial-marks" aria-label="我的编辑标记">${Object.entries(EDITORIAL_STATUS).map(([key,item])=>`<button class="${selected===key?"active":""}" data-status="${key}" data-id="${event.id}" title="${item.label}">${item.symbol}<span>${item.label}</span></button>`).join("")}</div>`;
  }
  function investigationOptions(locationId) {
    if(newsroomState.deadlineLocked)return"";
    const options=EVENTS.filter(event=>event.location===locationId&&event.round<=newsroomState.currentRound&&event.accessType==="investigation"&&!isDiscovered(event.id)&&prerequisitesMet(event));
    if(!options.length)return"";
    return `<section class="investigation-box"><header><span>REPORTER ACTION</span><b>可执行记者调查</b></header>${options.map(event=>`<div><p>这条线索需要记者主动获取，行动前不会显示结果。</p><button data-investigate="${event.id}" ${newsroomState.remainingInvestigations<event.cost?"disabled":""}>${event.actionLabel}<small>消耗 ${event.cost} 次采访机会</small></button></div>`).join("")}</section>`;
  }
  function specialEntryModule(location) {
    if(!location.channels?.length)return"";
    if(newsroomState.deadlineLocked)return `<section class="entry-module locked-entry"><header><span>NEWS DAY CLOSED</span><b>特殊信息入口已停止刷新</b></header><p>17:00截稿后只能回看左栏中已经发现的信息，不会再显示新的市场快照、政务信息或电讯更新。</p></section>`;
    if(location.entryType==="market"){
      const snapshot=MARKET_SNAPSHOTS[newsroomState.currentRound]||MARKET_SNAPSHOTS[1];
      return `<section class="entry-module market-entry"><header><span>MARKET SNAPSHOT</span><b>${snapshot.note}</b><small>${snapshot.session}</small></header><div class="market-indexes">${snapshot.indexes.map(([group,name,value,change,state])=>`<article><span>${group} · ${state}</span><b>${name}</b><strong>${value}</strong><em class="${change.includes("-")?"down":""}">${change}</em></article>`).join("")}</div><div class="sector-strip">${snapshot.sectors.map(item=>`<span>${item}</span>`).join("")}</div><p>价格变化是事实；关于“为什么涨跌”的解释可能只是分析，仍需核实。</p></section>`;
    }
    return `<section class="entry-module ${location.entryType}-entry"><header><span>${location.entryType==="government"?"GOVERNMENT INFORMATION":"NEWS AGENCY WIRES"}</span><b>${location.entryType==="government"?"政务公开信息入口":"国内与国际电讯入口"}</b></header><div>${location.channels.map(channel=>`<span>${channel}</span>`).join("")}</div></section>`;
  }
  function detailPanel() {
    const location=locationById(newsroomState.selectedLocation);
    if(!location)return`<div class="editor-note"><span class="kicker">EDITOR'S NOTE</span><h2>今日编辑提示</h2><blockquote>“地图只告诉你哪里有动态，不告诉你什么最重要。”</blockquote><ol><li><b>发现</b><span>浏览公开信息，主动探索地图。</span></li><li><b>核实</b><span>把有限采访机会用于关键问题。</span></li><li><b>判断</b><span>用编辑标记记录你此刻的判断。</span></li></ol></div>`;
    const events=knownEvents().filter(event=>event.location===location.id).reverse();
    return `<div class="detail-dossier"><header class="place-head"><span class="category">${location.category}</span><h2>${location.name}</h2><p>${location.region}</p></header><div class="place-summary"><span>当前已发现 <b>${events.length} 条</b></span><span>最新更新 <b>${events.at(-1)?.publishTime||"—"}</b></span></div>${specialEntryModule(location)}${investigationOptions(location.id)}<div class="timeline-label"><span>地点公开信息</span><span>LOCATION DOSSIER</span></div><div class="event-list">${events.map(event=>`<article class="event-card ${newsroomState.selectedEvent===event.id?"focused":""}"><div class="event-time"><time>${event.publishTime}</time><i></i></div><div class="event-body"><div class="event-status"><span>${event.sourceType}</span><span>${verificationLabel(event.verificationStatus)}</span></div><h3>${event.title}</h3><p>${event.content}</p><dl><div><dt>信息来源</dt><dd>${event.source}</dd></div><div><dt>获取方式</dt><dd>${accessLabel(event)}</dd></div></dl>${editorialButtons(event)}</div></article>`).join("")||`<div class="no-news">当前阶段，这里暂无可查询信息。</div>`}</div></div>`;
  }
  function roundAction() {
    if(newsroomState.deadlineLocked)return`<span class="deadline-readonly">🔒 新闻日已截稿 · 当前仅可回看</span>`;
    if(newsroomState.currentRound===1)return`<button data-action="meeting1" class="desk-next">进入09:00编辑会 →</button>`;
    if(newsroomState.currentRound===2)return`<button data-action="meeting2" class="desk-next">进入13:00编辑会 →</button>`;
    const readiness=reportingPlanFeasibility();
    return `<div class="deadline-gate ${readiness.ready?"ready":"not-ready"}"><small>${readiness.ready?"后续四文体采写基础已具备":html(readiness.reasons[0]||"还可继续发现新闻，也可以进入截稿")}</small><button data-action="deadline" class="desk-next danger">结束新闻日 · 进入截稿 →</button></div>`;
  }
  function deskSwitch() { return `<nav class="desk-switch" aria-label="新闻Desk切换">${Object.entries(DESKS).map(([key,desk])=>`<button class="${newsroomState.currentDesk===key?"active":""}" data-desk="${key}"><span>${desk.code}</span>${desk.label}</button>`).join("")}</nav>`; }
  function cityDeskMain() { return `<section class="map-panel panel"><header class="section-head map-head"><div><span class="kicker">PRIMARY NEWS ENTRY</span><h2>S城都市新闻地图</h2></div><div class="map-legend"><span><i class="new-key"></i>NEW · 可查询新信息</span><span><i class="metro-key"></i>城市轨道</span></div></header><div class="city-map" id="cityMap"><div class="region-layer">${regionLayer()}</div><div class="water s-bay"><b>S湾</b><small>S BAY</small></div><div class="water east-coast"><b>东湾海岸</b><small>EAST BAY COAST</small></div><div class="river"><span>青川河</span></div><div class="road road-axis"><span>城市中轴大道</span></div><div class="road road-bay"><span>滨湾大道</span></div><div class="road road-east"><span>东部快速路</span></div><div class="metro metro-1"><span>1</span></div><div class="metro metro-2"><span>2</span></div><div class="metro metro-3"><span>3</span></div><div id="locationLayer">${mapNodes()}</div><div class="north">N<br>↑</div></div><footer class="map-caption"><span>${newsroomState.deadlineLocked?"新闻日已截稿：地图仅供回看":"地图是本轮唯一主要信息入口"}</span><span>${newsroomState.deadlineLocked?"不会再产生任何新线索":"点击 NEW 地点，新增信息才会进入左栏"}</span></footer></section>`; }
  function deskInvestigationCards(desk) {
    if(newsroomState.deadlineLocked)return"";
    const options=EVENTS.filter(event=>event.desk===desk&&event.round<=newsroomState.currentRound&&event.accessType==="investigation"&&!isDiscovered(event.id)&&prerequisitesMet(event));
    return options.map(event=>`<article class="desk-action-card"><span>REPORTER ACTION</span><h3>仍有关键问题需要主动核实</h3><p>行动前不会显示调查结果。</p><button data-investigate="${event.id}" ${newsroomState.remainingInvestigations<event.cost?"disabled":""}>${event.actionLabel}<small>消耗 ${event.cost} 次采访机会</small></button></article>`).join("");
  }
  function nonCityDeskMain() { return cityDeskMain(); }
  function deskStoryCard(event) { return `<button class="desk-story ${newsroomState.selectedEvent===event.id?"active":""}" data-event="${event.id}" data-location="${event.location}"><time>${event.publishTime}</time><span>${deskLabel(event)} · ${event.sourceType}</span><h3>${event.title}</h3><p>${event.content}</p><small>${verificationLabel(event.verificationStatus)}</small></button>`; }
  function decisionLabel(value) { return value==="publish"?"可以发布":value==="wait"?"继续等待":"尚未决定"; }
  function publicationMemoryCard() {
    const decision=newsroomState.publicationDecision;
    if(newsroomState.currentRound!==3||!decision)return"";
    const selected=decision.eventId?eventById(decision.eventId):null;
    return `<section class="publication-memory"><span>13:00 PUBLISH OR WAIT</span><b>${selected?html(selected.title):"13:00未指定具体线索"}</b><p>当时判断：${decisionLabel(decision.decision)}。现在获得了新的信息，你们还会作出同样的判断吗？</p></section>`;
  }
  function renderDesk() {
    const round=SIMULATION.rounds[newsroomState.currentRound];
    const wireItems=knownEvents();
    const taskText=newsroomState.currentRound===1?"浏览S城，发现你们认为值得关注的新闻。":newsroomState.currentRound===2?"回看上午关注的事情，并寻找可能改变判断的新信息。":"截稿前，补齐你们最需要确认的事实。";
    app.innerHTML=`${masthead()}${publicationMemoryCard()}${taskHint(taskText,`round${newsroomState.currentRound}`)}<div class="desk-ribbon ${newsroomState.deadlineLocked?"locked":""}"><span>${round.code} · ${round.time}</span><p>${newsroomState.deadlineLocked?"新闻日已截稿：当前页面只用于回看，任何地点都不会再产生新信息。":`${round.focus}：${newsroomState.currentRound===1?"点击地图，决定先看哪里。":newsroomState.currentRound===2?"地图上的 NEW 表示有待查询更新。":"发稿前还有哪些地点没有重新核实？"}`}</p><time>${newsroomState.deadlineLocked?"READ ONLY":"ENTRY: CITY MAP"}</time></div><main class="news-desk v1-desk four-desk-layout map-first-layout"><section class="wire-panel panel"><header class="section-head discovered-head"><div><span>DISCOVERED WIRE</span><h2>已发现线索</h2></div><b>${wireItems.length} 条</b></header><div class="wire-filter"><span><i class="live-dot"></i>我的编辑标记</span><div class="wire-filter-buttons">${wireFilterButton("all","全部")}${wireFilterButton("tracking","追踪","★")}${wireFilterButton("pending","待核","？")}${wireFilterButton("confirmed","确认","✓")}</div></div><div id="wireList" class="wire-list">${renderWire()}</div></section>${cityDeskMain()}<aside class="detail-panel panel" id="detailPanel">${detailPanel()}</aside></main><footer class="stage-dock v1-stage"><div class="stage-intro"><span class="kicker">${round.code}</span><b>${round.time} · ${round.label}</b></div><div class="round-progress">${[1,2,3].map(n=>`<span class="${n===newsroomState.currentRound?"active":n<newsroomState.currentRound?"done":""}"><i>${n}</i>${SIMULATION.rounds[n].focus}</span>`).join("")}</div><div class="discovery"><span>${newsroomState.deadlineLocked?"新闻日状态":"剩余采访"} <b>${newsroomState.deadlineLocked?"已截稿 🔒":`${newsroomState.remainingInvestigations} 次`}</b></span><span>已发现线索 <b>${wireItems.length} 条</b></span></div>${roundAction()}</footer>`;
    appendBackButton();
  }

  function selectionOptions(selected=[], radioName="") {
    return knownEvents().map(event=>`<label class="meeting-option"><input type="checkbox" name="tracks" value="${event.id}" ${selected.includes(event.id)?"checked":""}><span><b>${event.publishTime}</b>${event.title}<small>${event.sourceType}</small></span>${radioName?`<input type="radio" name="${radioName}" value="${event.id}" ${event.id===selected[0]?"checked":""} aria-label="设为头条候选">`:""}</label>`).join("");
  }
  function renderSubmittedMeeting(round,snapshot) {
    const nextScene=round===1?"transition2":"publicationDecision";
    app.innerHTML=`${masthead()}<main class="meeting-scene submitted-meeting"><header><span>EDITORIAL MEETING · ${round===1?"09:00":"13:00"}</span><h1>${round===1?"晨间":"午间"}编辑会议记录</h1><p>这份记录已保存，可返回会议页继续修改。</p></header><section class="submitted-record"><span>MEETING SNAPSHOT</span><h2>当时的头条候选</h2><h3>${eventById(snapshot.headline)?.title||"—"}</h3><div><b>三条追踪线索</b>${snapshot.tracks.map((id,index)=>`<p><i>0${index+1}</i>${eventById(id)?.title||id}</p>`).join("")}</div>${snapshot.question?`<div><b>当时最想弄清楚的问题</b><p>${snapshot.question}</p></div>`:""}${snapshot.changed?`<div><b>是否改变判断</b><p>${snapshot.changed==="yes"?"是":"否"}${snapshot.reason?`：${snapshot.reason}`:""}</p></div>`:""}${snapshot.evidence?.length?`<div><b>改变判断的新证据</b>${snapshot.evidence.map(id=>`<p>${eventById(id)?.title||id}</p>`).join("")}</div>`:""}<footer><button class="primary-action" data-resume-scene="${nextScene}">继续新闻日 →</button></footer></section></main>`;
  }
  function renderMeeting(round) {
    const first=round===1;
    const current=first?newsroomState.meeting1Snapshot:newsroomState.meeting2Snapshot;
    const previous=newsroomState.meeting1Snapshot || {tracks:[],headline:null,question:"尚未提交09:00记录"};
    const selectedTracks=current?.tracks||[];
    const selectedEvidence=current?.evidence||[];
    app.innerHTML=`${masthead()}<main class="meeting-scene"><header><span>EDITORIAL MEETING · ${round===1?"09:00":"13:00"}</span><h1>${round===1?"晨间":"午间"}编辑会议</h1><p>${current?"这份会议记录可以继续修改；最后一次保存就是当前有效版本。":first?"从已经发现的线索中，确定目前最值得继续追踪的方向。":"新证据出现后，重新检查上午的判断。修改判断不是失败。"}</p>${taskHint(first?"从已经发现的线索中，选出最值得继续追踪的新闻。":"看看新出现的证据，有没有改变你们上午的判断。",first?"meeting1":"meeting2")}</header><div class="meeting-layout">${!first?`<aside class="previous-snapshot"><span>你们09:00的判断</span><h2>${eventById(previous.headline)?.title||"—"}</h2><p><b>追踪线索</b>${previous.tracks.map(id=>eventById(id)?.title).join("；")}</p><p><b>核心问题</b>${previous.question}</p></aside>`:""}<form id="meetingForm" class="meeting-form"><p class="optional-flow-note">文字说明均为选填；只做选择也可以保存本次编辑会。</p><fieldset><legend>1. 选择最值得继续追踪的3条线索</legend><p>只能从你们已经发现的信息中选择。</p><div class="meeting-options">${selectionOptions(selectedTracks)}</div></fieldset><fieldset><legend>2. 从上述3条中选择当前头条候选</legend><div id="headlineChoices" class="headline-choices"><p>先在上方选满三条线索。</p></div></fieldset>${first?`<label class="text-question"><span>3. 我们现在最想弄清楚的问题是什么？</span><textarea name="question" maxlength="120" placeholder="例如：地铁设备故障和降雨有关吗？">${html(current?.question||"")}</textarea></label>`:`<fieldset class="change-field"><legend>3. 与09:00相比，你们改变判断了吗？</legend><label><input type="radio" name="changed" value="yes" ${current?.changed==="yes"?"checked":""}> 是</label><label><input type="radio" name="changed" value="no" ${current?.changed!=="yes"?"checked":""}> 否</label><div id="changeEvidence" ${current?.changed==="yes"?"":"hidden"}><p>哪些新证据改变了判断？（选择1—3条）</p><div class="evidence-options">${knownEvents().filter(e=>discoveredDuringRound(e,2)).map(e=>`<label><input type="checkbox" name="evidence" value="${e.id}" ${selectedEvidence.includes(e.id)?"checked":""}>${e.title}</label>`).join("")}</div><textarea name="reason" maxlength="160" placeholder="为什么？">${html(current?.reason||"")}</textarea></div></fieldset>`}<button class="primary-action" type="submit">${current?"保存修改":"保存"}${round===1?"09:00":"13:00"}编辑会 →</button></form></div></main>`;
    updateHeadlineChoices(current?.headline||selectedTracks[0]||"");
  }
  function updateHeadlineChoices(preferred=""){const form=$("#meetingForm");if(!form)return;const previous=preferred||form.elements.headline?.value||"";const ids=[...form.querySelectorAll('input[name="tracks"]:checked')].map(i=>i.value);const box=$("#headlineChoices");box.innerHTML=ids.length?ids.map((id,index)=>`<label><input type="radio" name="headline" value="${id}" ${id===(previous||ids[0])||(!previous&&index===0)?"checked":""}><span>${eventById(id).title}</span></label>`).join(""):`<p>先在上方选满三条线索。</p>`;}
  function renderTransition(round) { const next=SIMULATION.rounds[round]; app.innerHTML=`<section class="scene transition-scene"><span>TIME ADVANCE</span><time>${next.time}</time><h1>${round===2?"S城仍在变化。":"距离晚间版截稿越来越近。"}</h1><p>${round===2?"地图上的部分地点将出现 NEW。\n只有重新点击地点，新信息才会进入已发现线索。":"新的官方通报和现场变化已经出现。\n回到地图，决定哪些地点值得再次核实。"}</p><div>+${SIMULATION.investigationGrants[round]} <small>${round===3?"最后新增采访机会":"新增采访机会"}</small></div><button class="primary-action" data-action="enter-round" data-round="${round}">${round===2?"进入午间编辑台":"进入最终核实"} →</button></section>`; }
  function renderMidday() {
    const item=newsroomState.middayBulletin||{};
    app.innerHTML=`${masthead()}<main class="bulletin-scene"><header><span>S CITY DAILY · 13:00</span><h1>《S城日报 · 午间快讯》</h1><p>${newsroomState.middayBulletin?"已保存的午间快讯可以直接修改；最后一次保存就是当前版本。":"只发布一条。发布前，请确认现有证据是否足以支持这条消息。"}</p></header><form id="bulletinForm"><p class="optional-flow-note">标题、导语和来源均可留空；系统会沿用所选线索信息。</p><label>选择报道线索<select name="eventId"><option value="">请选择</option>${knownEvents().map(e=>`<option value="${e.id}" ${item.eventId===e.id?"selected":""}>${html(e.title)}</option>`).join("")}</select></label><label>标题（选填）<input name="title" maxlength="50" value="${html(item.title||"")}" placeholder="留空则使用所选线索标题"></label><label>一句话导语（选填）<textarea name="lead" maxlength="120" placeholder="留空则使用线索摘要">${html(item.lead||"")}</textarea></label><label>信息来源（选填）<input name="source" maxlength="100" value="${html(item.source||"")}" placeholder="留空则沿用线索来源"></label><label class="evidence-check"><input type="checkbox" name="enough"> 我们认为现有证据足以发布（选填）</label><button class="primary-action" type="submit">${newsroomState.middayBulletin?"保存修改":"发布午间快讯"} →</button></form></main>`;
  }
  function renderPublicationDecision() {
    const item=newsroomState.publicationDecision||{};
    const reasons=["信息尚未充分核实","缺少第二来源","事件仍在快速变化","新闻价值暂不明确","其他"];
    app.innerHTML=`${masthead()}<main class="bulletin-scene publication-decision-scene"><header><span>13:00 · PUBLISH OR WAIT</span><h1>午间发布判断</h1><p>这不是写作任务，而是编辑部在信息仍不完整时作出的“是否现在发布”判断。所有内容都可以留空；保存后进入17:00新闻日。</p>${taskHint("判断目前掌握的信息是否已经足够可靠，可以发布。","publicationDecision")}</header><form id="publicationDecisionForm"><p class="optional-flow-note">如果《S城日报》现在必须发布一条消息，你们会选择哪一条？也可以暂不指定。</p><label>判断对象（选填）<select name="eventId"><option value="">暂不指定具体线索</option>${knownEvents().map(e=>`<option value="${e.id}" ${item.eventId===e.id?"selected":""}>${html(e.publishTime)}｜${html(e.title)}</option>`).join("")}</select></label><fieldset class="decision-radio"><legend>13:00是否适合发布？（选填）</legend><label><input type="radio" name="decision" value="publish" ${item.decision==="publish"?"checked":""}> 现在可以发布</label><label><input type="radio" name="decision" value="wait" ${item.decision==="wait"?"checked":""}> 暂缓发布，继续核实</label></fieldset><fieldset class="decision-reasons"><legend>理由（选填，可多选）</legend>${reasons.map(reason=>`<label><input type="checkbox" name="reason" value="${reason}" ${(item.reasons||[]).includes(reason)?"checked":""}> ${reason==="缺少第二来源"?termInfo(reason,"与第一条信息相对独立的另一个信息来源，用来帮助核实事实。"):reason}</label>`).join("")}</fieldset><label>补充说明（选填）<textarea name="note" maxlength="180" placeholder="例如：目前只有单一来源，尚未得到独立证据。">${html(item.note||"")}</textarea></label><button class="primary-action" type="submit">${newsroomState.publicationDecision?"保存修改":"保存发布判断"} →</button></form></main>`;
  }
  function renderBulletinVersion() { const latest=newsroomState.middayBulletinVersions.at(-1)||newsroomState.middayBulletin;app.innerHTML=`${masthead()}<main class="bulletin-scene"><header><span>VERSION CONTROL</span><h1>更新午间快讯</h1><p>旧版本不会消失。请选择“更新报道”或“发布更正”。</p></header><form id="bulletinVersionForm"><p class="optional-flow-note">更新内容可以留空，留空时沿用上一版本。</p><label>版本类型<select name="type"><option value="updated">更新报道</option><option value="corrected">发布更正</option></select></label><label>标题（选填）<input name="title" value="${latest.title||''}"></label><label>导语（选填）<textarea name="lead">${latest.lead||''}</textarea></label><label>信息来源（选填）<input name="source" value="${latest.source||''}"></label><button class="primary-action" type="submit">保存新版本 →</button></form></main>`; }
  function renderDeadline() { app.innerHTML=`<section class="scene transition-scene deadline-scene"><span>17:00 · EDITION CLOSE</span><time>${termInfo("DEADLINE","截稿后可以继续修改文章，但不能再获得新的新闻信息。")}</time><h1>新闻日采访结束。</h1>${taskHint("确认新闻日结束。截稿后可以修改文章，但不能再获得新的新闻信息。","")}<p>地图调查已经锁定。接下来进入采写室，<br>把今天真正发现的事实发展为四种新闻作品。</p><div>${newsroomState.discoveredEvents.length}<small>已获得线索</small></div><button class="primary-action" data-action="reporting-intro">进入 S CITY REPORTING ROOM →</button></section>`; }

  function reportingHeader(title,description,stamp="REPORTING ROOM") {
    return `<header class="reporting-header"><div><span>S CITY DAILY · ${stamp}</span><h1>${title}</h1><p>${description}</p></div><div class="reporting-stamp"><b>${newsroomState.discoveredEvents.length} 条</b><span>本编辑部当日已发现线索</span></div></header>`;
  }
  function reportingRule() { return `<div class="reporting-rule"><b>REPORTING RULE</b><span>你可以选择、组织和转述事实，但不能创造事实。</span></div>`; }
  function reportingStoryCard(story) {
    const facts=storyEvents(story),channels=reportingMaterialChannels(story);
    return `<article class="story-file unlocked"><span>STORY FILE · ${html(story.id.toUpperCase())}</span><h3>${html(story.title)}</h3><p>本组已发现相关事实 ${facts.length} 条，涉及 ${new Set(facts.map(item=>item.location)).size} 个地点。</p><div class="story-directions"><small>可继续获取</small>${channels.map(item=>`<span>${html(item)}</span>`).join("")}</div><footer>${story.genres.map(genre=>`<i class="genre-chip">${html(reportingFamilyLabel(genre))}</i>`).join("")}<b class="story-state">已解锁</b></footer></article>`;
  }
  function renderReportingIntro() {
    const unlocked=availableReportingStories();rememberUnlockedStories();saveState();
    app.innerHTML=`${masthead()}<main class="scene reporting-scene"><div class="reporting-wrap">${reportingHeader("S城采写室","新闻日已经结束。深度采写只从本编辑部实际发现过的故事出发；未发现的事件不会在这里补发。")}${taskHint("从已经发现的新闻中选择报道对象，并补充真正需要的材料。","reportingIntro")}${reportingRule()}<section class="reporting-intro-copy"><article class="reporting-letter"><span class="reporting-kicker">EDITOR'S LETTER</span><h2>从线索走向作品</h2><p>今天的地图给了你们许多碎片。现在要重新打开采访本：确认事实过程、寻找人物、观察现场，并让不同观点彼此照面。</p><blockquote>四种文体不是四次改写。每一种写法，都需要重新决定材料怎样进入文章。</blockquote></article><aside class="reporting-note"><span class="reporting-kicker">WORKFLOW</span><h3>采写室工作顺序</h3><ol><li>只从已解锁的故事中选择四篇作品。</li><li>两篇消息、特写、评论使用各自不同的材料组织方式。</li><li>完成写作计划，再进入文章编辑台。</li><li>提交前逐项完成事实核对声明。</li></ol></aside></section><section class="story-selector" style="margin-top:16px"><header><div><span class="reporting-kicker">UNLOCKED STORY FILES</span><h2>本组可进入深采的故事</h2></div><p>这里只列出已经满足解锁条件的故事，不对选题进行评分或推荐。</p></header><div class="story-grid">${unlocked.map(reportingStoryCard).join("")||`<div class="wire-empty"><b>尚无可进入深采的故事</b><span>请返回新闻日，通过地图发现并核实更多线索。</span></div>`}</div></section><div class="reporting-actions"><span class="progress-copy">已解锁 ${unlocked.length} 个深采故事</span><button class="primary-action" data-action="reporting-select" ${unlocked.length?"":"disabled"}>建立四篇作品计划 →</button></div></div></main>`;
  }
  function genreStoryOptions(genre,selected) {
    return availableReportingStories().filter(story=>story.genres.includes(slotFamily(genre))).map(story=>`<option value="${story.id}" ${selected===story.id?"selected":""}>${html(story.title)}（已发现${storyEvents(story).length}条事实）</option>`).join("");
  }
  function renderReportingDashboard() {
    const selections=newsroomState.reporting.selectedStories;
    const allSelected=REPORTING_SLOT_KEYS.every(slot=>selections[slot]);
    if(!allSelected)return"";
    return `<section class="reporting-dashboard"><header><div><span class="reporting-kicker">FOUR WRITING DESKS</span><h2>四篇作品进度</h2></div><p>两篇消息彼此独立选题；所有作品都可先看报道角度，再进入材料与写作。</p></header><div class="desk-cards">${Object.entries(REPORTING_GENRES).map(([genre,meta])=>{const story=reportingStory(selections[genre]);const draft=newsroomState.reporting.drafts[genre];const completed=draftCompleted(draft);const completeness=reportingCompleteness(genre,story.id);const ready=slotFamily(genre)==="news"||completeness.complete;return `<article class="desk-card ${completed?"submitted":""}"><span>${meta.en}</span><h3>${meta.label}</h3><p>${html(story.title)}<br>${completed?`已完成 · ${html(draftDisplayTitle(genre,draft))}`:draft?"写作中":slotFamily(genre)==="news"?"选择报道角度，使用最可靠事实进入消息写作":ready?"已达到建议写作条件":`建议补充：${html(completeness.missing[0]||"")}`}</p><footer><b>${completed?"✓ 已完成":draft?"写作中":ready?"READY":"REPORTING"}</b><button data-open-genre="${genre}">${completed?"查看 / 修改":"进入采写"} →</button></footer></article>`;}).join("")}</div></section>`;
  }
  function renderReportingSelect() {
    rememberUnlockedStories();ensureAutomaticMaterials();saveState();
    const selections=newsroomState.reporting.selectedStories;
    app.innerHTML=`${masthead()}<main class="scene reporting-scene"><div class="reporting-wrap">${reportingHeader("四篇作品计划","课堂任务是完成选题、材料采集和核心写作，形成消息一、消息二、新闻特写和评论四篇初稿。课后可以继续返回修改，完善为正式《S城日报》。","STORY CONFERENCE")}${taskHint("为两篇消息、新闻特写和评论选择合适的报道对象。","reportingSelect")}${reportingRule()}<form id="reportingSelectionForm" class="story-selector"><header><div><span class="reporting-kicker">ASSIGNMENT BOARD</span><h2>选择报道方向</h2></div><p>作品完成后仍可修改选题与正文；已获得材料和已消耗的深采机会不会退回。</p></header><div class="genre-selection-grid">${Object.entries(REPORTING_GENRES).map(([genre,meta])=>{const draft=newsroomState.reporting.drafts[genre];const selected=selections[genre];const completed=draftCompleted(draft);return `<article class="genre-select-card ${completed?"done":""}"><span>${meta.en}</span><h3>${meta.label}</h3><select name="${genre}"><option value="">选择一个已解锁故事</option>${genreStoryOptions(genre,selected)}</select><p>${selected?`可继续获取：${html(reportingMaterialChannels(reportingStory(selected)).join(" · "))}`:"只显示本组新闻日已经解锁、且可用于该文体的故事。"}</p></article>`;}).join("")}</div><div class="selection-rule"><strong>选题建议：</strong>两篇消息应该各自回答一个清楚问题；特写聚焦一个真实现场；评论必须建立在事实和材料基础上。</div><div class="reporting-actions"><button type="button" class="secondary-action" data-action="reporting-intro">查看已解锁故事</button><button class="primary-action" type="submit">保存作品计划</button></div></form>${renderReportingDashboard()}<div class="reporting-actions"><span class="progress-copy">四篇作品完成后进入版面选择；后续仍可返回修改。</span><button class="primary-action" data-action="reporting-complete" ${REPORTING_SLOT_KEYS.every(slot=>draftCompleted(newsroomState.reporting.drafts[slot]))?"":"disabled"}>四篇完成 · 进入版面编排 →</button></div></div></main>`;
  }
  function renderStoryFacts(storyId,{limit=0,selectable=false,selectedId=""}={}) {
    let facts=storyEvents(storyId);if(limit)facts=facts.slice(-limit);
    if(!facts.length)return`<div class="desk-empty">本编辑部没有发现这条故事的可用事实。</div>`;
    if(selectable)return`<div class="lead-facts">${facts.map(event=>`<label><input type="radio" name="leadFactId" value="${event.id}" ${selectedId===event.id?"checked":""}><time>${event.publishTime}</time><span>${html(event.title)}<small>　${html(event.source)}</small></span></label>`).join("")}</div>`;
    return facts.map(event=>`<article class="fact-record"><time>${event.publishTime}</time><span>${html(locationById(event.location)?.name||event.region)}</span><h3>${html(event.title)}</h3><p>${html(event.content)}｜来源：${html(event.source)}</p></article>`).join("");
  }
  function materialCard(item) {
    const dynamic=item.dynamic==="rain_timeline"?`<div class="dynamic-timeline">${storyEvents("rain").map(event=>`<p><time>${event.publishTime}</time><span>${html(locationById(event.location)?.name||event.region)} · ${html(event.title)}</span></p>`).join("")}</div>`:"";
    const detailItems=[...(item.details||[]),...(item.observations||[])];
    return `<article class="material-card" data-material-card="${item.id}"><header><span class="source-chip">${html(item.sourceTag)}</span><span class="material-type">${materialTypeLabel(item.type)}</span></header><h3>${html(item.title)}</h3><p class="source-line">${html(item.source?.name)}${item.source?.identity?`｜${html(item.source.identity)}`:""}</p>${item.summary?`<p>${html(item.summary)}</p>`:""}${dynamic}${detailItems.length?`<ul>${detailItems.map(detail=>`<li>${html(detail)}</li>`).join("")}</ul>`:""}${item.quotes?.map(quote=>`<blockquote>“${html(quote)}”</blockquote>`).join("")||""}${item.warning?`<p class="material-warning">${html(item.warning)}</p>`:""}<div class="usage-key"><span><b>可直接引用：</b>${item.quoteAllowed&&item.quotes?.length?"卡片中的引语（不得改变原意）":"无"}</span><span><b>可转述：</b>摘要、明确事实与可观察细节</span><span><b>不得补写：</b>未出现的动作、心理、数据、因果与结论</span></div></article>`;
  }
  function renderCompleteness(genre,storyId) {
    const status=reportingCompleteness(genre,storyId);
    let details=[];
    const family=slotFamily(genre);
    if(family==="news")details=[`已发现事实 ${storyEvents(storyId).length} 条`,`报道角度 ${angleText(genre)==="尚未选择报道角度"?"待选择":"已选择"}`];
    if(family==="feature")details=[`现场观察 ${status.observations} 项`,`人物跟随 ${status.follow?status.follow.source.name:"待选择"}`];
    if(family==="commentary")details=[`事实依据 ${status.factCount}/3`,`不同观点 ${status.viewpoints}/2`,`政策/数据/第三方 ${status.support?"已具备":"待补"}`];
    return `<section class="completeness ${status.complete?"complete":""}"><b>${status.complete?"✓ 已达到建议写作条件":"建议写作条件提示"}</b><ul>${details.map(item=>`<li>${html(item)}</li>`).join("")}${status.missing.map(item=>`<li>${html(item)}</li>`).join("")}</ul></section>`;
  }
  function reportingActionCard(item,genre) {
    const acquired=newsroomState.reporting.acquiredMaterialIds.includes(item.id);
    const family=slotFamily(genre);
    const selected=family==="feature"&&newsroomState.reporting.featureFollowUp===item.id;
    const used=family==="news"?reportingActionIds(genre).length:family==="commentary"?newsroomState.reporting.commentaryActions.length:newsroomState.reporting.featureFollowUp?1:0;
    const max=family==="news"?4:family==="commentary"?2:1;
    const disabled=(!acquired&&used>=max)||(family==="feature"&&Boolean(newsroomState.reporting.featureFollowUp)&&!selected);
    return `<article class="material-action ${acquired||selected?"acquired":""}"><span>${materialTypeLabel(item.type)} · ${html(item.sourceTag)}</span><h3>${html(item.actionLabel)}</h3><p>${acquired||selected?html(item.summary||"材料已收入记者素材夹。"):'执行前不显示采访或查询结果；完成后材料才会进入记者素材夹。'}</p><button data-reporting-action="${item.id}" data-reporting-genre="${genre}" ${disabled?"disabled":""}>${selected?"已选择此人物":acquired?"已收入素材夹":item.actionLabel}<small>${family==="feature"?"人物跟随 1/1":`深采动作 ${used}/${max}`}</small></button></article>`;
  }
  function renderMaterialWorkspace(genre) {
    const storyId=newsroomState.reporting.selectedStories[genre];
    if(!storyId||!isStoryUnlocked(reportingStory(storyId))){toast("请先为这类作品选择一个已解锁故事");go("reportingSelect");return;}
    ensureAutomaticMaterials();saveState();
    const story=reportingStory(storyId);const status=reportingCompleteness(genre,storyId),family=slotFamily(genre);
    let candidates=materialsFor(storyId,genre).filter(item=>!item.autoGenres.includes(family));
    if(family==="feature")candidates=candidates.filter(item=>item.featureFollow);
    const acquired=acquiredMaterials(storyId,genre);
    const used=family==="news"?reportingActionIds(genre).length:family==="commentary"?newsroomState.reporting.commentaryActions.length:newsroomState.reporting.featureFollowUp?1:0;
    const max=family==="news"?4:family==="commentary"?2:1;
    app.innerHTML=`${masthead()}<main class="scene reporting-scene"><div class="reporting-wrap">${reportingHeader(`${REPORTING_GENRES[genre].label}采写台`,story.title,REPORTING_GENRES[genre].en)}${reportingRule()}${renderAngleChooser(genre,storyId)}<section class="reporting-workspace"><article class="reporting-column"><header><span>DISCOVERED FACTS</span><h2>新闻日事实</h2><p>只显示本编辑部当天主动发现的相关线索。</p></header><div class="reporting-scroll">${renderStoryFacts(storyId)}</div></article><article class="reporting-column"><header><span>REPORTING ACTIONS</span><h2>${family==="feature"?"选择一位人物跟随":"主动获取新材料"}</h2><p>${family==="news"?"消息最多可补充4项事实材料。":family==="commentary"?"基础事实与观点材料会进入素材夹；还可深采2项。":"基础现场已放入素材夹；只能选择一位人物继续跟随。"}</p><div class="quota-meter"><b>${used} / ${max}</b><i><span style="width:${used/max*100}%"></span></i></div></header><div class="reporting-scroll">${candidates.map(item=>reportingActionCard(item,genre)).join("")||`<div class="desk-empty">当前没有更多可执行动作。</div>`}</div>${renderCompleteness(genre,storyId)}</article><aside class="reporting-column clipbook"><header><span>REPORTER'S CLIPBOOK</span><h2>记者素材夹</h2><p>来源性质、可引用内容和使用边界均随卡片保存。</p></header><div class="reporting-scroll">${acquired.map(materialCard).join("")||`<div class="desk-empty">执行深采动作后，材料会进入这里。</div>`}</div></aside></section><div class="reporting-actions"><button class="secondary-action" data-action="reporting-select">返回四篇计划</button><button class="primary-action" data-write-genre="${genre}">${draftCompleted(newsroomState.reporting.drafts[genre])?"查看 / 修改作品":status.complete?"进入写作 →":"材料未齐也可先进入写作 →"}</button></div></div></main>`;
  }
  function planningFields(genre,draft) {
    const plan=draft?.planningAnswers||newsroomState.reporting.writingPlans[genre]||{};
    const family=slotFamily(genre);
    if(family==="news")return `<div class="planning-board"><span>LEAD DECISION</span><h3>选择一条导语核心事实</h3><p>从本组实际发现的事实中选择1条你认为最应进入导语的核心事实。系统按时间排序，但“最新”不等于“最重要”。</p><p class="angle-line">这篇文章主要想回答：<b>${html(angleText(genre))}</b></p>${renderStoryFacts(draft?.storyline||newsroomState.reporting.selectedStories[genre],{selectable:true,selectedId:draft?.leadFactId||plan.leadFactId})}</div>`;
    if(family==="feature")return `<div class="planning-board"><span>SCENE PLAN</span><h3>新闻特写写作计划</h3><p class="angle-line">这篇文章主要想回答：<b>${html(angleText(genre))}</b></p><label>你选择聚焦哪个具体时刻？<textarea name="planMoment">${html(plan.moment||"")}</textarea></label><label>哪一项可观察细节将成为文章线索？<textarea name="planDetail">${html(plan.detail||"")}</textarea></label></div>`;
    const storyId=draft?.storyline||newsroomState.reporting.selectedStories.commentary;
    const facts=storyEvents(storyId);
    const materialFacts=acquiredMaterials(storyId,"commentary").filter(item=>item.factContribution&&!isViewpointMaterial(item));
    const views=acquiredMaterials(storyId,"commentary").filter(isViewpointMaterial);
    const factChoices=[...facts.map(event=>({id:event.id,label:`${event.publishTime}｜${event.title}`})),...materialFacts.map(item=>({id:item.id,label:`材料｜${item.title}`}))];
    const factOptions=name=>factChoices.map(item=>`<option value="${item.id}" ${plan[name]===item.id?"selected":""}>${html(item.label)}</option>`).join("");
    return `<div class="planning-board"><span>ARGUMENT PLAN</span><h3>评论立论表</h3><label>你的明确观点是什么？<textarea name="planStance">${html(plan.stance||"")}</textarea></label><label>事实依据一<select name="fact1Id"><option value="">请选择</option>${factOptions("fact1Id")}</select></label><label>事实依据二<select name="fact2Id"><option value="">请选择</option>${factOptions("fact2Id")}</select></label><label>需要回应的不同观点<select name="counterViewpointId"><option value="">请选择</option>${views.map(item=>`<option value="${item.id}" ${plan.counterViewpointId===item.id?"selected":""}>${html(item.title)}｜${html(item.source.name)}</option>`).join("")}</select></label><label>文章论证骨架<textarea name="planSkeleton">${html(plan.skeleton||"")}</textarea></label></div>`;
  }
  function renderWritingReference(genre,storyId) {
    const materials=acquiredMaterials(storyId,genre);
    const family=slotFamily(genre);
    return `<article class="writing-reference"><header><span>${family==="feature"?"FIELD NOTE":"REPORTER'S CLIPBOOK"}</span><h2>${family==="news"?"已发现事实":family==="feature"?"现场笔记与人物":"可用采写材料"}</h2><p class="current-angle">这篇文章主要想回答：<b>${html(angleText(genre))}</b></p></header><div class="writing-reference-body">${renderStoryFacts(storyId)}${materials.map(materialCard).join("")}</div></article>`;
  }
  const FACT_CHECK_ITEMS=["人物均来自采访材料","直接引语没有编造或改变原意","数字与数据均来自现有材料","尚未确认的信息没有被写成确定事实","没有自行补写素材中未出现的人物心理、动作、细节或因果关系"];
  function renderSubmittedDraft(genre,draft) {
    const meta=REPORTING_GENRES[genre];const story=reportingStory(draft.storyline);
    app.innerHTML=`${masthead()}<main class="scene writing-scene"><div class="reporting-wrap">${reportingHeader(`${meta.label} · 已提交`,story?.title||"",meta.en)}${reportingRule()}<article class="submitted-record reporting-submitted"><span>${meta.en} · SUBMITTED</span><h2>${html(story?.title||"")}</h2><h3>${html(draftDisplayTitle(genre,draft))}</h3><div><b>正文</b><p style="white-space:pre-line">${draft.body?html(draft.body):"（正文未填写）"}</p></div><div><b>采用材料</b><p>${draft.selectedMaterialIds?.length||0}份深采材料${draft.leadFactId?` · 导语事实 ${html(eventById(draft.leadFactId)?.title||draft.leadFactId)}`:""}</p></div><footer><button class="primary-action" data-action="reporting-select">返回四篇作品计划 →</button></footer></article></div></main>`;
  }
  function renderWriting(genre) {
    const storyId=newsroomState.reporting.selectedStories[genre];const draft=newsroomState.reporting.drafts[genre];
    if(!storyId){go("reportingSelect");return;}
    const meta=REPORTING_GENRES[genre],story=reportingStory(storyId);const saved=draft||{};
    const completed=draftCompleted(saved),checks=saved.factCheck||[];
    const min=Number(meta.limit.split("—")[0]),max=Number(meta.limit.match(/(\d+)字/)[1]);
    const family=slotFamily(genre);
    const taskMap={news:"用最重要、最可靠的事实，告诉读者发生了什么。不要从遥远背景写起，先交代最新、重要、已确认的事实；检查5W、最新进展和不确定信息。",feature:"聚焦一个真实现场或瞬间，让读者看见事情是怎样发生的。不要概括整件新闻，优先使用动作、声音、环境、行为和引语；不得编造心理、动作和环境。",commentary:`在事实基础上提出自己的判断，并用材料支撑观点。不要只写“我觉得”，要有事实、观点、依据和需要回应的另一面。${termInfo("新闻评论","可以表达观点，但观点必须建立在事实和材料基础上。")}`};
    const count=wordCount(saved.body||""),feedback=writingCountFeedback(count,min,max);
    app.innerHTML=`${masthead()}<main class="scene writing-scene"><div class="reporting-wrap">${reportingHeader(`${meta.label}写作台`,`${story.title} · 建议篇幅 ${meta.limit} · 课堂形成初稿`,meta.en)}${taskHint(taskMap[family],family)}${reportingRule()}<section class="writing-layout">${renderWritingReference(genre,storyId)}<article class="writing-paper"><header><span>WRITING DESK · AUTOSAVE${completed?" · 已完成":""}</span><h2>${completed?"查看 / 修改作品":"完成写作计划、材料选择与核心写作"}</h2><p>所有文字均为选填；本环节先形成课堂初稿，之后仍可返回继续修改完善。</p></header><form id="writingForm" class="writing-form" data-genre="${genre}" data-min="${min}" data-max="${max}" novalidate>${planningFields(genre,saved)}<label>文章标题（选填）<input type="text" name="title" maxlength="70" value="${html(saved.title||"")}" placeholder="可留空，系统将显示故事名称"></label><label>正文（选填）<textarea name="body" maxlength="${max}" placeholder="可留空直接推进；正式课堂写作时再完成">${html(saved.body||"")}</textarea></label><div class="word-meter"><span>建议篇幅 ${meta.limit}</span><strong id="writingCount" class="${feedback.className}">${count} 字 · ${feedback.text}</strong></div><section class="fact-check"><span>FACT CHECK · SUBMISSION DECLARATION</span><h3>提交前事实核对</h3>${FACT_CHECK_ITEMS.map((item,index)=>`<label><input type="checkbox" name="factCheck" value="${index+1}" ${checks.includes(String(index+1))?"checked":""}> ${item}</label>`).join("")}</section><p class="draft-status">输入内容会自动保存到本机；保存完成后仍可继续修改。</p><div class="writing-actions"><button type="button" class="secondary-action" data-open-genre="${genre}">返回材料与角度</button><button type="button" class="secondary-action" data-action="reporting-select">返回四篇作品计划</button><button type="button" class="secondary-action" data-save-draft="${genre}">保存草稿</button><button class="primary-action" type="submit">${completed?"保存修改并继续":"完成并继续"} →</button></div></form></article></section></div></main>`;
    if(slotFamily(genre)==="commentary"){
      const plan=saved.planningAnswers||newsroomState.reporting.writingPlans.commentary||{};
      ["fact1Id","fact2Id"].forEach(name=>{const field=$(`[name="${name}"]`);if(field)field.value=plan[name]||"";});
    }
  }
  function renderEditionBriefPicker() {
    const groups=["S城","政务","财经","全国","国际"];
    const chosen=new Set(newsroomState.finalEdition?.newsBriefIds||newsroomState.editionBriefIds||[]);
    return `<section class="edition-briefing"><header><div><span>NEWS BRIEFING</span><h2>今日简讯编排</h2><p>建议选择3—5条，可少选，也可以不选。无需重写，系统会使用已有新闻素材生成简讯。按栏目展开查看，减少页面拥挤。</p></div><strong id="editionBriefCount">已选 0 / 建议3—5</strong></header><div class="edition-brief-groups">${groups.map(label=>{const items=knownEvents().filter(event=>publishedSectionLabel(event)===label);const open=items.some(event=>chosen.has(event.id));return items.length?`<details class="edition-brief-group" ${open?"open":""}><summary><b>${label}</b><small>${items.length}条可选</small></summary><div>${items.map(event=>`<label class="edition-brief-row" data-brief-card="${event.id}"><input type="checkbox" name="editionBrief" value="${event.id}"><span><b><time>${event.publishTime}</time>${html(event.title)}</b><small>${html(event.source)} · ${verificationLabel(event.verificationStatus)}</small></span></label>`).join("")}</div></details>`:"";}).join("")}</div><p class="edition-brief-note">简讯与“决定不报道”的线索不能重复。若简讯与四篇主稿属于同一故事，请由编辑部判断是否仍有独立信息价值。</p></section>`;
  }
  function syncEditionSelections() {
    const form=$("#editionForm");
    if(!form)return;
    const briefInputs=[...form.querySelectorAll('input[name="editionBrief"]')];
    const discardInputs=[...form.querySelectorAll('input[name="discard"]')];
    const discardIds=new Set(discardInputs.filter(input=>input.checked).map(input=>input.value));
    briefInputs.forEach(input=>{if(discardIds.has(input.value))input.checked=false;});
    const briefIds=new Set(briefInputs.filter(input=>input.checked).map(input=>input.value));
    discardInputs.forEach(input=>{if(briefIds.has(input.value))input.checked=false;});
    const finalBriefIds=new Set(briefInputs.filter(input=>input.checked).map(input=>input.value));
    briefInputs.forEach(input=>{input.disabled=discardIds.has(input.value);input.closest(".edition-brief-row")?.classList.toggle("unavailable",input.disabled&&!input.checked);});
    discardInputs.forEach(input=>{input.disabled=finalBriefIds.has(input.value);input.closest(".discard-row")?.classList.toggle("unavailable",input.disabled&&!input.checked);});
    const counter=$("#editionBriefCount");
    if(counter){counter.textContent=`已选 ${finalBriefIds.size} / 建议3—5`;counter.classList.toggle("ready",finalBriefIds.size>=3&&finalBriefIds.size<=5);}
  }
  function renderDiscardEditor(discarded) {
    const rows=knownEvents().map(event=>{
      const item=discarded.get(event.id)||{};
      return `<label class="discard-row" data-discard-row="${event.id}"><input type="checkbox" name="discard" value="${event.id}" ${discarded.has(event.id)?"checked":""}><span>${html(event.title)}</span><select name="reason-${event.id}">${DISCARD_REASONS.map(reason=>`<option ${item.reason===reason?"selected":""}>${reason}</option>`).join("")}</select><input name="note-${event.id}" value="${html(item.note||"")}" placeholder="补充说明（可选）"></label>`;
    }).join("");
    return `<details class="discard-editor" ${discarded.size?"open":""}><summary><span><b>我们决定不报道</b><small>已选 ${discarded.size} 条 · 点击展开</small></span></summary><header><span>EDITORIAL CHOICE</span><h2>我们决定不报道</h2><p>建议至少选择1条没有编入今日简讯的已发现线索，并记录原因；这只是编辑复盘提示，不会阻止发布。</p></header><div class="discard-list">${rows}</div></details>`;
  }
  function renderEdition() {
    if(!allReportingDraftsSubmitted()){toast("请先完成消息一、消息二、特写和评论四篇课堂初稿");go("reportingSelect");return;}
    const leadCandidates=["news1","news2","feature"].map(genre=>[genre,REPORTING_GENRES[genre],newsroomState.reporting.drafts[genre]]);
    const edition=newsroomState.finalEdition||{};
    const selectedLead=edition.leadGenre||"news1";
    const selectedBriefs=new Set(edition.newsBriefIds||newsroomState.editionBriefIds||[]);
    const discarded=new Map((newsroomState.discardedStories||[]).map(item=>[item.id,item]));
    app.innerHTML=`${masthead()}<main class="edition-scene"><header><span>THE S CITY DAILY · FINAL EDITION CONFERENCE</span><h1>S城日报 · 最终版面会议</h1><p>${html(newsroomState.newsroomProfile.name||"S城日报城市新闻部")} · ${SIMULATION.date}　四篇主稿已经完成。版面选择可以返回修改，新闻日事实和深采资源不会回退。</p>${taskHint("决定什么上头条、什么做简讯、什么暂时不报道。","edition")}</header><form id="editionForm"><section class="edition-conference"><header><span>LEAD DECISION</span><h2>哪一篇作品放在今天最重要的位置？</h2><p>从消息一、消息二、新闻特写中选择1篇作为首页头条。评论固定进入 OPINION 栏目，不作为事实新闻头条。</p></header><div class="lead-work-grid">${leadCandidates.map(([genre,meta,draft])=>`<label class="lead-work-card"><input type="radio" name="leadGenre" value="${genre}" ${selectedLead===genre?"checked":""}><span>${meta.en} · ${meta.label}</span><h3>${html(draftDisplayTitle(genre,draft))}</h3><p>${html(reportingStory(draft.storyline)?.title||"")}</p><small>${wordCount(draft.body)}字 · 已完成</small></label>`).join("")}</div></section>${renderEditionBriefPicker()}${renderDiscardEditor(discarded)}<button class="publish-button" type="submit">${newsroomState.finalEdition?"保存修改并更新《S城日报》":"完成版面选择 · 发布《S城日报》"}</button></form></main>`;
    $("#editionForm")?.querySelectorAll('input[name="editionBrief"]').forEach(input=>{input.checked=selectedBriefs.has(input.value);});
    syncEditionSelections();
  }
  function appendLocalRule() { return; }
  function renderLockedEdition() {
    const edition=newsroomState.finalEdition;
    if(isReportingEdition(edition)){
      const lead=newsroomState.reporting.drafts[edition.leadGenre];
      const leadMeta=REPORTING_GENRES[edition.leadGenre];
      return void(app.innerHTML=`${masthead()}<main class="edition-scene locked-edition"><header><span>THE S CITY DAILY · PUBLISHED</span><h1>最终版面已发布</h1><p>${html(newsroomState.newsroomProfile.name||"S城日报城市新闻部")} · 四篇新闻作品 · ${(edition.newsBriefIds||[]).length}条今日简讯。可返回版面会议继续调整。</p></header><section><article><span>LEAD STORY · ${leadMeta.label}</span><h2>${html(draftDisplayTitle(edition.leadGenre,lead))}</h2><p>${html(reportingStory(lead.storyline)?.title||"")}</p></article>${Object.entries(REPORTING_GENRES).filter(([genre])=>genre!==edition.leadGenre).map(([genre,meta])=>{const draft=newsroomState.reporting.drafts[genre];return `<article><span>${meta.en}</span><h2>${html(draftDisplayTitle(genre,draft))}</h2><p>${html(reportingStory(draft.storyline)?.title||"")}</p></article>`;}).join("")}</section><button class="primary-action" data-resume-scene="published">返回已发布版面 →</button></main>`);
    }
    const briefCount=(edition.newsBriefIds||newsroomState.editionBriefIds||[]).length;
    app.innerHTML=`${masthead()}<main class="edition-scene locked-edition"><header><span>THE S CITY DAILY · PUBLISHED</span><h1>晚间版已发布</h1><p>${html(newsroomState.newsroomProfile.name||"S城日报城市新闻部")} · 3篇主笔报道 · ${briefCount}条今日简讯。可返回版面会议继续调整。</p></header><section><article><span>HEADLINE</span><h2>${html(edition.headline.title)}</h2><p>${html(edition.headline.lead)}</p></article>${edition.briefs.map((item,index)=>`<article><span>BRIEF 0${index+1}</span><h2>${html(item.title)}</h2><p>${html(item.body)}</p></article>`).join("")}</section><button class="primary-action" data-resume-scene="published">返回已发布版面 →</button></main>`;
  }
  function getPublishedBriefEvents() {
    const ids=newsroomState.finalEdition?.newsBriefIds||newsroomState.editionBriefIds||[];
    return ids.filter(id=>newsroomState.discoveredEvents.includes(id)).map(eventById).filter(Boolean);
  }
  function publicationDecisionBlock() {
    const decision=newsroomState.publicationDecision;
    if(!decision)return `<section class="review-block"><time>D</time><div><span>13:00发布判断</span><h2>未记录发布判断</h2><p>旧流程或教师导演模式可能跳过了这一环节。</p></div></section>`;
    const event=decision.eventId?eventById(decision.eventId):null;
    return `<section class="review-block"><time>D</time><div><span>13:00发布判断</span><h2>${event?html(event.title):"未指定具体线索"} · ${decisionLabel(decision.decision)}</h2>${decision.reasons?.length?`<p><b>理由：</b>${decision.reasons.map(html).join("；")}</p>`:""}${decision.note?`<p><b>补充：</b>${html(decision.note)}</p>`:""}</div></section>`;
  }
  function finalLeadSummary() {
    const edition=newsroomState.finalEdition;
    if(isReportingEdition(edition)){
      const draft=newsroomState.reporting.drafts[edition.leadGenre];
      const story=reportingStory(draft?.storyline);
      return {title:draftDisplayTitle(edition.leadGenre,draft),story:story?.title||""};
    }
    return {title:edition?.headline?.title||"—",story:""};
  }
  function renderFinalReflection() {
    const reflection=newsroomState.finalReflection||{};
    const lead=finalLeadSummary();
    const morning=eventById(newsroomState.meeting1Snapshot?.headline);
    const noon=newsroomState.publicationDecision;
    const noonEvent=noon?.eventId?eventById(noon.eventId):null;
    const reality=reflection.reality||"";
    return `<section class="final-reflection-panel"><header><span>FINAL REFLECTION</span><h2>今日编辑部复盘</h2><p>问题均可留空。这里帮助学生把“新闻选择”与“现实本身”区分开。</p>${taskHint("回看你们今天的判断是怎样形成和改变的。","review")}</header><div class="reflection-context"><article><b>09:00头条候选</b><span>${html(morning?.title||"—")}</span></article><article><b>13:00发布判断</b><span>${noonEvent?html(noonEvent.title):"未指定"} · ${decisionLabel(noon?.decision)}</span></article><article><b>最终头条</b><span>${html(lead.title||"—")}${lead.story?`｜${html(lead.story)}`:""}</span></article></div><form id="reflectionForm" class="reflection-form"><label>1. 哪一条新证据最明显改变了你们的原判断？<textarea name="q1" maxlength="240" placeholder="可留空">${html(reflection.q1||"")}</textarea></label><label>2. 另一个编辑部掌握完全相同的信息，头条一定一样吗？为什么？<textarea name="q2" maxlength="260" placeholder="可留空">${html(reflection.q2||"")}</textarea></label><fieldset><legend>3. 新闻是在复制现实，还是在选择现实？（选填）</legend><label><input type="radio" name="reality" value="copy" ${reality==="copy"?"checked":""}> 更接近复制现实</label><label><input type="radio" name="reality" value="choice" ${reality==="choice"?"checked":""}> 更接近选择现实</label><label><input type="radio" name="reality" value="both" ${reality==="both"?"checked":""}> 两者都有</label></fieldset><label>说明（选填）<textarea name="realityNote" maxlength="260" placeholder="可留空">${html(reflection.realityNote||"")}</textarea></label><button class="primary-action" type="submit">${newsroomState.finalReflection?"保存复盘修改":"完成专题复盘"}</button></form></section>`;
  }
  function getLeadRelatedEvents() {
    if(isReportingEdition()){
      const draft=leadReportingDraft();
      if(!draft)return[];
      return storyEvents(draft.storyline).sort((a,b)=>b.publishTime.localeCompare(a.publishTime)).slice(0,5);
    }
    const leadId=newsroomState.finalEdition?.headline?.eventId;
    const leadEvent=eventById(leadId);
    if(!leadEvent)return[];
    return newsroomState.discoveredEvents.map(eventById).filter(event=>event&&event.id!==leadId&&event.storyline===leadEvent.storyline).sort((a,b)=>b.publishTime.localeCompare(a.publishTime)).slice(0,5);
  }
  function renderNewsBriefCard(event,compact=false) {
    const place=locationById(event.location);
    return `<article class="published-brief-card ${compact?"compact":""}" data-published-event="${event.id}"><span>${html(place?.region||event.region||publishedSectionLabel(event))}</span><h3>${html(event.title)}</h3><p>${html(event.content)}</p><footer><time>${event.publishTime}</time><small>来源：${html(event.source)}</small></footer></article>`;
  }
  function renderPublishedSection(label,events,{compact=false}={}) {
    if(!events.length)return"";
    const sectionId=({"S城":"published-city","政务":"published-government","全国":"published-national","国际":"published-world"})[label]||"published-section";
    return `<section class="published-section published-section-${label==="S城"?"city":label==="政务"?"government":"wire"}" id="${sectionId}"><header><span>${({"S城":"S CITY","政务":"GOVERNMENT","全国":"CHINA","国际":"WORLD"})[label]}</span><h2>${label}</h2><i>${events.length} STORIES</i></header><div class="published-section-grid">${events.map(event=>renderNewsBriefCard(event,compact)).join("")}</div></section>`;
  }
  function renderLeadPackage() {
    const bylines=[["本报记者",memberNamesForRole("reporting")],["主编 / 选题",memberNamesForRole("editorial")],["核实",memberNamesForRole("verification")],["文字 / 版面",memberNamesForRole("production")]].filter(([,value])=>value);
    const related=getLeadRelatedEvents();
    if(isReportingEdition()){
      const edition=newsroomState.finalEdition,draft=leadReportingDraft(),meta=REPORTING_GENRES[edition.leadGenre];
      if(!draft)return `<section class="lead-package" id="published-lead"><article class="published-headline"><span>LEAD STORY</span><h2>头条作品正在修改中</h2><p>返回编辑版面或采写室保存作品后，最终日报会自动更新。</p></article></section>`;
      const story=reportingStory(draft.storyline);
      return `<section class="lead-package" id="published-lead"><article class="published-headline"><span>${meta.en} · ${meta.label} · LEAD STORY</span><h2>${html(draftDisplayTitle(newsroomState.finalEdition.leadGenre,draft))}</h2><h3>${html(story?.title||"")}</h3>${bylines.length?`<div class="published-byline">${bylines.map(([label,value])=>`<b>${label}：${html(value)}</b>`).join("")}</div>`:""}<p style="white-space:pre-line">${draft.body?html(draft.body):"（正文未填写）"}</p><footer>采写依据：新闻日已发现相关事实 ${storyEvents(draft.storyline).length} 条 · 深采材料 ${draft.selectedMaterialIds?.length||0} 份</footer></article>${related.length?`<aside class="related-progress"><header><span>RELATED UPDATES</span><h3>相关事实</h3></header><ol>${related.map(item=>`<li data-related-event="${item.id}"><time>${item.publishTime}</time><div><b>${html(item.title)}</b><small>${verificationLabel(item.verificationStatus)}</small></div></li>`).join("")}</ol></aside>`:""}</section>`;
    }
    const edition=newsroomState.finalEdition,event=eventById(edition.headline.eventId);
    return `<section class="lead-package" id="published-lead"><article class="published-headline"><span>${publishedSectionLabel(event)} · LEAD STORY</span><h2>${html(edition.headline.title)}</h2><h3>${html(edition.headline.lead)}</h3>${bylines.length?`<div class="published-byline">${bylines.map(([label,value])=>`<b>${label}：${html(value)}</b>`).join("")}</div>`:""}<p>${html(edition.headline.body)}</p><footer>信息来源：${html(edition.headline.source)}</footer></article>${related.length?`<aside class="related-progress"><header><span>RELATED UPDATES</span><h3>相关进展</h3></header><ol>${related.map(item=>`<li data-related-event="${item.id}"><time>${item.publishTime}</time><div><b>${html(item.title)}</b><small>${verificationLabel(item.verificationStatus)}</small></div></li>`).join("")}</ol></aside>`:""}</section>`;
  }
  function renderTopStories() {
    if(isReportingEdition())return"";
    return `<section class="top-stories"><header><span>TOP STORIES</span><h2>今日重点</h2></header><div>${newsroomState.finalEdition.briefs.map(item=>{const event=eventById(item.eventId);return `<article data-authored-event="${item.eventId}"><span>${publishedSectionLabel(event)}</span><h2>${html(item.title)}</h2><p>${html(item.body)}</p><footer>信息来源：${html(item.source)}</footer></article>`;}).join("")}</div></section>`;
  }
  function renderReportingPublication() {
    const drafts=newsroomState.reporting.drafts;
    const leadGenre=isReportingEdition()?newsroomState.finalEdition.leadGenre:null;
    const items=Object.entries(REPORTING_GENRES).filter(([genre])=>draftCompleted(drafts[genre])&&genre!==leadGenre);
    if(!items.length)return`<section class="published-reporting-empty"><b>S CITY REPORTING ROOM</b><br>本版面尚未收录第二阶段四类作品。返回采写室后，可使用本组已发现故事完成写作。<button class="secondary-action" data-action="reporting-intro">进入采写室</button></section>`;
    return `<section class="published-reporting" aria-label="采写室主要作品">${items.map(([genre,meta])=>{const draft=drafts[genre],story=reportingStory(draft.storyline);const sourceCount=draft.selectedMaterialIds?.length||0;return `<article class="published-work ${genre}" id="published-${genre}"><header><span>${meta.en} · ${meta.label}</span><h2>${html(draftDisplayTitle(genre,draft))}</h2><small>${html(story?.title||"")}<br>采写材料 ${sourceCount} 份</small></header>${genre==="commentary"?`<p class="opinion-notice">本文为评论文章，事实依据来自本编辑部当日采写材料。</p>`:""}<div class="work-body">${draft.body?html(draft.body):"（正文未填写）"}</div></article>`;}).join("")}</section>`;
  }
  function renderMarketSection(briefEvents) {
    const marketBriefs=briefEvents.filter(event=>publishedSectionLabel(event)==="财经");
    const openedFinance=newsroomState.discoveredLocations.some(id=>locationById(id)?.entryType==="market");
    if(!openedFinance&&!marketBriefs.length)return"";
    const snapshot=MARKET_SNAPSHOTS[3];
    return `<section class="published-section published-markets" id="published-markets"><header><span>MARKETS</span><h2>财经</h2><i>17:00 SNAPSHOT</i></header><div class="published-market-note"><b>${html(snapshot.note)}</b><span>${html(snapshot.session)}</span></div><div class="published-index-grid">${snapshot.indexes.map(([group,name,value,change,state])=>`<article><span>${group} · ${state}</span><b>${name}</b><strong>${value}</strong><em class="${change.includes("-")?"down":""}">${change}</em></article>`).join("")}</div>${marketBriefs.length?`<div class="published-market-stories">${marketBriefs.map(event=>renderNewsBriefCard(event,true)).join("")}</div>`:""}<p class="market-method">价格变化是事实；关于“为什么涨跌”的解释可能只是分析，仍需独立核实。</p></section>`;
  }
  function renderNewsroomMembers(className="newsroom-members") {
    const members=activeNewsroomMembers();
    if(!members.length)return"";
    return `<div class="${className}">${members.map((member,index)=>`<article><span>成员 ${String(index+1).padStart(2,"0")}</span><b>${html(member.name)}</b><p>${member.roles.map(roleLabel).join(" · ")}</p></article>`).join("")}</div>`;
  }
  function renderCredits() {
    const profile=newsroomState.newsroomProfile;
    return `<section class="published-credits"><div><span>NEWSROOM CREDITS</span><h2>本期编辑部</h2><strong>${html(profile.name||"S城日报城市新闻部")}</strong></div>${renderNewsroomMembers("published-members")}<p>本期版面依据本编辑部在S城新闻沙盘中实际发现、采访和核实的信息制作。</p></section>`;
  }
  function renderPublished() {
    const profile=newsroomState.newsroomProfile;
    const briefEvents=getPublishedBriefEvents();
    const city=briefEvents.filter(event=>publishedSectionLabel(event)==="S城");
    const government=briefEvents.filter(event=>publishedSectionLabel(event)==="政务").slice(0,3);
    const national=briefEvents.filter(event=>publishedSectionLabel(event)==="全国");
    const world=briefEvents.filter(event=>publishedSectionLabel(event)==="国际");
    const hasReporting=REPORTING_SLOT_KEYS.some(slot=>draftCompleted(newsroomState.reporting.drafts[slot]));
    const leadGenre=isReportingEdition()?newsroomState.finalEdition.leadGenre:null;
    const genreNav=hasReporting?Object.entries(REPORTING_GENRES).filter(([genre])=>draftCompleted(newsroomState.reporting.drafts[genre])&&genre!==leadGenre).map(([genre,meta])=>`<a href="#published-${genre}">${meta.label}</a>`).join(""):"";
    const sectionNav=[city.length?`<a href="#published-city">S城</a>`:"",government.length?`<a href="#published-government">政务</a>`:"",(briefEvents.some(event=>publishedSectionLabel(event)==="财经")||newsroomState.discoveredLocations.some(id=>locationById(id)?.entryType==="market"))?`<a href="#published-markets">财经</a>`:"",national.length?`<a href="#published-national">全国</a>`:"",world.length?`<a href="#published-world">国际</a>`:""].join("");
    const timeLine=`首次发布：${html(newsroomState.publishedAt||"")}${newsroomState.updatedAt?`　最后更新：${html(newsroomState.updatedAt)}`:""}`;
    app.innerHTML=`<main class="published-scene"><header class="newspaper-masthead"><div class="newspaper-mark">SC</div><div class="newspaper-name"><span>THE S CITY DAILY</span><h1>S城日报</h1><p>${SIMULATION.date} · ${SIMULATION.weekday} · 最终版</p></div><div class="newspaper-edition"><b>${html(profile.name||"S城日报城市新闻部")}</b><time>${timeLine}</time></div></header><nav class="newspaper-nav" aria-label="版面栏目"><a href="#published-lead">今日头条</a>${genreNav}${sectionNav}</nav><div class="published-editbar"><button class="secondary-action" data-action="edition">← 返回编辑版面</button></div>${renderLeadPackage()}${renderTopStories()}${renderReportingPublication()}${renderPublishedSection("S城",city)}${renderPublishedSection("政务",government,{compact:true})}${renderMarketSection(briefEvents)}${renderPublishedSection("全国",national,{compact:true})}${renderPublishedSection("国际",world,{compact:true})}${renderCredits()}<footer class="published-footer"><p>《S城日报》· ${html(profile.name||"城市新闻部")}　${timeLine}</p><div><button class="print-action" data-action="print">打印 / 保存为PDF</button><button data-action="review">查看今日编辑部档案 →</button></div></footer></main>`;
  }
  function snapshotBlock(time,snapshot) { if(!snapshot)return `<section class="review-block"><time>${time}</time><div><span>编辑会议</span><h2>本次会议未提交</h2><p>教师导演模式跳过了这一场景，因此没有形成会议记录。</p></div></section>`;return `<section class="review-block"><time>${time}</time><div><span>编辑会议</span><h2>${eventById(snapshot.headline)?.title||"—"}</h2><p><b>追踪：</b>${snapshot.tracks.map(id=>eventById(id)?.title).join("；")}</p>${snapshot.question?`<p><b>核心问题：</b>${snapshot.question}</p>`:""}${snapshot.changed?`<p><b>是否改变：</b>${snapshot.changed==="yes"?"是":"否"}</p>`:""}${snapshot.evidence?.length?`<p><b>改变判断的证据：</b>${snapshot.evidence.map(id=>eventById(id)?.title).join("；")}</p>`:""}</div></section>`; }
  function editionCategoryCounts() {
    const counts={"S城":0,"政务":0,"财经":0,"全国":0,"国际":0};
    getPublishedBriefEvents().forEach(event=>counts[publishedSectionLabel(event)]++);
    return counts;
  }
  function renderReview() {
    const versions=[newsroomState.middayBulletin,...newsroomState.middayBulletinVersions].filter(Boolean);
    const edition=newsroomState.finalEdition;
    const categoryCounts=editionCategoryCounts();
    const profile=newsroomState.newsroomProfile;
    const reporting=newsroomState.reporting;
    const authored=isReportingEdition(edition)
      ? Object.entries(REPORTING_GENRES).map(([genre,meta])=>{const draft=newsroomState.reporting.drafts[genre];return `<article><b>${edition.leadGenre===genre?"HEADLINE · ":""}${meta.en}</b><p>${html(draft?.title||"未提交")}</p></article>`;}).join("")
      : `<article><b>HEADLINE</b><p>${html(edition?.headline?.title||"—")}</p></article>${(edition?.briefs||[]).map((item,index)=>`<article><b>TOP STORY 0${index+1}</b><p>${html(item.title)}</p></article>`).join("")}`;
    const editionSummary=isReportingEdition(edition)?"四篇课堂初稿进入版面；版面选择可继续修改。":"3篇主笔报道";
    const legacy=versions.length?`<section class="legacy-bulletin-review"><span>旧版午间快讯记录</span><h2>兼容旧流程数据</h2>${versions.map((v,i)=>`<article class="version-card"><b>V${i+1} · ${{original:"原始版本",updated:"更新报道",corrected:"发布更正"}[v.type]}</b><h3>${html(v.title)}</h3><p>${html(v.lead)}</p><small>${v.time}｜${html(v.source)}</small></article>`).join("")}</section>`:"";
    app.innerHTML=`${masthead()}<main class="review-scene"><header><span>NEWSROOM ARCHIVE · ${SIMULATION.date}</span><h1>专题复盘 / 今日编辑部档案</h1><p>${html(profile.name||"S城日报城市新闻部")} · 回看一天中，证据如何改变判断，选择如何形成版面。</p></header>${renderFinalReflection()}<div class="review-timeline">${snapshotBlock("B · 09:00",newsroomState.meeting1Snapshot)}${snapshotBlock("C · 13:00",newsroomState.meeting2Snapshot)}${publicationDecisionBlock()}<section class="review-block"><time>E</time><div><span>调查记录</span><h2>全天使用 ${newsroomState.investigationHistory.length} / 8 次采访机会</h2>${newsroomState.investigationHistory.map(h=>`<p>${h.time}　${html(h.action)} → ${html(eventById(h.eventId)?.title||"")}</p>`).join("")||"<p>未执行主动调查。</p>"}</div></section><section class="review-block"><time>F</time><div class="edition-review"><span>四篇作品计划与初稿</span><h2>消息一 / 消息二 / 特写 / 评论</h2><div class="authored-review">${Object.entries(REPORTING_GENRES).map(([genre,meta])=>{const draft=reporting.drafts[genre],story=reportingStory(reporting.selectedStories[genre]);return `<article><b>${meta.en} · ${meta.label}</b><p>${draftCompleted(draft)?html(draftDisplayTitle(genre,draft)):"未完成"}</p><small>${story?html(story.title):"未选择故事"} · 采用材料 ${draft?.selectedMaterialIds?.length||0} 份</small></article>`;}).join("")}</div></div></section><section class="review-block edition-choice-review"><time>G</time><div class="edition-review"><span>最终版面选择</span><h2>${html(profile.name||"S城日报城市新闻部")}</h2>${renderNewsroomMembers("review-newsroom-members")}<p>${editionSummary}</p><div class="authored-review">${authored}</div><div class="edition-review-summary"><strong>额外编入简讯：${getPublishedBriefEvents().length}条</strong>${Object.entries(categoryCounts).map(([label,count])=>`<span>${label} <b>${count}</b></span>`).join("")}</div></div></section><section class="review-block"><time>H</time><div><span>未刊发选择</span><h2>我们决定不报道</h2>${newsroomState.discardedStories.map(d=>`<p>${html(eventById(d.id)?.title||"")}｜${html(d.reason)}${d.note?`：${html(d.note)}`:""}</p>`).join("")||"<p>未记录不报道线索。</p>"}</div></section></div><section class="status-review"><span>EDITORIAL STATUS HISTORY</span><h2>线索判断变化</h2><div>${Object.entries(newsroomState.statusHistory).map(([id,history])=>`<article><h3>${html(eventById(id)?.title||"")}</h3><p>${history.map(h=>`${EDITORIAL_STATUS[h.status]?.symbol||""}${EDITORIAL_STATUS[h.status]?.label||h.status}`).join(" → ")}${isLeadEvent(id)?" → HEADLINE":""}</p></article>`).join("")}</div></section>${legacy}<footer><button class="secondary-action" data-action="published">返回最终版面</button><button class="danger-button" data-action="reset">重新开始新闻日</button></footer></main>`;
  }
  function appendReportingReview() {
    const target=$(".edition-choice-review")||$(".status-review");if(!target)return;
    const reporting=newsroomState.reporting;
    const unlocked=reporting.unlockedStoryIds.map(reportingStory).filter(Boolean);
    const featureFollow=reportingMaterial(reporting.featureFollowUp);
    const section=document.createElement("section");section.className="reporting-review";
    section.innerHTML=`<span>S CITY REPORTING ROOM · ARCHIVE</span><h2>采写室工作档案</h2><p>记录本组从已发现线索中解锁、深采、组织并完成四类作品的过程，不进行分数或等级评价。</p><div class="reporting-review-details"><b>消息一材料：</b>${reporting.news1Actions.map(id=>html(reportingMaterial(id)?.title||id)).join("；")||"未执行"}<br><b>消息二材料：</b>${reporting.news2Actions.map(id=>html(reportingMaterial(id)?.title||id)).join("；")||"未执行"}<br><b>解锁故事：</b>${unlocked.map(story=>html(story.title)).join("；")||"无"}<br><b>特写现场：</b>${reporting.selectedStories.feature?html(reportingStory(reporting.selectedStories.feature)?.title||""):"未选择"}；<b>跟随人物：</b>${featureFollow?html(featureFollow.source.name):"未选择"}<br><b>评论深采：</b>${reporting.commentaryActions.map(id=>html(reportingMaterial(id)?.title||id)).join("；")||"未执行"}</div><div class="reporting-review-grid">${Object.entries(REPORTING_GENRES).map(([genre,meta])=>{const draft=reporting.drafts[genre],story=reportingStory(reporting.selectedStories[genre]);return `<article><span>${meta.en}</span><h3>${draftCompleted(draft)?html(draftDisplayTitle(genre,draft)):"未完成"}</h3><p>${story?html(story.title):"未选择故事"}</p><p>采用材料 ${draft?.selectedMaterialIds?.length||0} 份</p></article>`;}).join("")}</div><p class="reporting-review-details">采写路径：发现事实 → 选择故事 → 补充材料 → 形成计划 → 写作核对 → 出版归档。</p>`;
    target.before(section);
  }
  function appendDeskReview() { const target=$(".status-review");if(!target)return;const counts=Object.keys(DESKS).map(key=>({key,count:knownEvents().filter(event=>event.desk===key).length,opens:newsroomState.deskOpenCounts[key]||0}));const section=document.createElement("section");section.className="desk-review";section.innerHTML=`<span>DESK ATTENTION</span><h2>本组关注分布</h2><p>仅记录信息选择，不进行评分。</p><div>${counts.map(item=>`<article><b>${DESKS[item.key].code}</b><strong>${item.count} 条</strong><small>打开 ${item.opens} 次</small></article>`).join("")}</div>`;target.before(section); }

  function render() {
    const scene=newsroomState.currentScene;
    if(scene==="cover")renderCover(); else if(scene==="briefing")renderBriefing(); else if(/^round/.test(scene))renderDesk(); else if(scene==="meeting1")renderMeeting(1); else if(scene==="transition2")renderTransition(2); else if(scene==="meeting2")renderMeeting(2); else if(scene==="publicationDecision"||scene==="midday")renderPublicationDecision(); else if(scene==="bulletinVersion")renderBulletinVersion(); else if(scene==="transition3")renderTransition(3); else if(scene==="deadline")renderDeadline(); else if(scene==="reportingIntro")renderReportingIntro(); else if(scene==="reportingSelect")renderReportingSelect(); else if(scene==="reportingNews1"||scene==="reportingCommunication")renderMaterialWorkspace("news1"); else if(scene==="reportingNews2")renderMaterialWorkspace("news2"); else if(scene==="reportingFeature")renderMaterialWorkspace("feature"); else if(scene==="reportingCommentary")renderMaterialWorkspace("commentary"); else if(scene==="writingNews1"||scene==="writingNews")renderWriting("news1"); else if(scene==="writingNews2")renderWriting("news2"); else if(scene==="writingCommunication")renderWriting("news1"); else if(scene==="writingFeature")renderWriting("feature"); else if(scene==="writingCommentary")renderWriting("commentary"); else if(scene==="edition")renderEdition(); else if(scene==="published")renderPublished(); else if(scene==="review"){renderReview();appendDeskReview();appendReportingReview();} else {newsroomState.currentScene="cover";saveState();renderCover();}
    appendBackButton();
    appendClearRecordsButton();
    renderTeacherActions();
  }
  function appendBackButton() { if(newsroomState.currentScene==="cover"||$(".scene-back"))return;const button=document.createElement("button");button.className="scene-back";button.dataset.action="back";button.innerHTML="<span>←</span> 返回";const mast=$(".masthead");if(mast){button.classList.add("in-masthead");mast.prepend(button);}else{const scene=app.firstElementChild;scene?.classList.add("has-scene-back");scene?.prepend(button);} }
  function appendClearRecordsButton() {
    if($(".clear-records-button"))return;
    const button=document.createElement("button");
    button.className="clear-records-button";
    button.dataset.action="reset";
    button.title="清空本机保存的全部课堂记录";
    button.textContent="清空记录";
    app.append(button);
  }

  function openDesk(desk) {
    if(newsroomState.deadlineLocked){toast("新闻日已截稿：Desk仅可回看已发现信息");return;}
    newsroomState.currentDesk=desk;
    newsroomState.deskOpenCounts[desk]=(newsroomState.deskOpenCounts[desk]||0)+1;
    let found=0;
    EVENTS.filter(event=>event.desk===desk&&event.round<=newsroomState.currentRound&&event.accessType==="desk_discovery"&&prerequisitesMet(event)).forEach(event=>{if(discover(event.id,"desk_discovery"))found++;});
    saveState();renderDesk();if(found)toast(`主动查看Desk，获得 ${found} 条背景线索`);
  }

  function handleMapClick(locationId) {
    const location=locationById(locationId);
    if(newsroomState.deadlineLocked){
      if(!newsroomState.discoveredLocations.includes(locationId)){toast("新闻日已截稿：未在截稿前打开的地点不能再获取信息");return;}
      newsroomState.selectedLocation=locationId;newsroomState.selectedEvent=null;
      const deskByEntry={government:"government",market:"markets",wire:"national_world"};
      newsroomState.currentDesk=deskByEntry[location?.entryType]||"city";
      saveState();renderDesk();toast("新闻日已截稿：当前仅回看截稿前已发现的信息");return;
    }
    newsroomState.selectedLocation=locationId; newsroomState.selectedEvent=null;
    if(!newsroomState.discoveredLocations.includes(locationId))newsroomState.discoveredLocations.push(locationId);
    const deskByEntry={government:"government",market:"markets",wire:"national_world"};
    newsroomState.currentDesk=deskByEntry[location?.entryType]||"city";
    newsroomState.deskOpenCounts[newsroomState.currentDesk]=(newsroomState.deskOpenCounts[newsroomState.currentDesk]||0)+1;
    let found=0;
    EVENTS.filter(event=>event.location===locationId&&event.round<=newsroomState.currentRound&&event.accessType!=="investigation"&&!isDiscovered(event.id)).forEach(event=>{if(prerequisitesMet(event)&&discover(event.id,event.acquisition||"地点查询"))found++;});
    saveState(); renderDesk(); toast(found?`在${location?.name}发现 ${found} 条新线索`:`${location?.name}当前没有未读更新`);
  }
  function investigate(id) {
    const event=eventById(id);
    if(newsroomState.deadlineLocked||isDiscovered(id)||!prerequisitesMet(event))return;
    if(newsroomState.remainingInvestigations<event.cost){toast("采访机会不足");return;}
    newsroomState.remainingInvestigations-=event.cost; discover(id,event.acquisition||"记者采访");
    newsroomState.investigationHistory.push({eventId:id,action:event.actionLabel,time:SIMULATION.rounds[newsroomState.currentRound].time,round:newsroomState.currentRound});
    newsroomState.selectedEvent=id; newsroomState.selectedLocation=event.location; newsroomState.currentDesk=event.desk; newsroomState.wireTab="discovered"; saveState(); renderDesk(); toast(`调查完成：线索已进入左栏，剩余 ${newsroomState.remainingInvestigations} 次采访机会`);
  }
  function changeEditorial(id,status) { if(newsroomState.deadlineLocked){toast("新闻日已截稿：编辑标记已锁定");return;} newsroomState.editorialStatuses[id]=status; const history=newsroomState.statusHistory[id]||[]; if(history.at(-1)?.status!==status)history.push({time:SIMULATION.rounds[newsroomState.currentRound].time,status}); newsroomState.statusHistory[id]=history; saveState(); renderDesk(); }
  function submitMeeting(form,round) {
    const previous=round===1?newsroomState.meeting1Snapshot:newsroomState.meeting2Snapshot;
    let tracks=[...form.querySelectorAll('input[name="tracks"]:checked')].map(i=>i.value);
    if(tracks.length<3){for(const event of knownEvents()){if(!tracks.includes(event.id))tracks.push(event.id);if(tracks.length===3)break;}}
    tracks=tracks.slice(0,3);
    const headline=form.elements.headline?.value||tracks[0]||null;
    const revision=(previous?.revision||1)+(previous?1:0);
    if(round===1){newsroomState.meeting1Snapshot={...(previous||{}),tracks,headline,question:form.elements.question?.value?.trim()||"",submittedAt:previous?.submittedAt||"09:00",revision,updatedAt:new Date().toISOString()};saveState();go("transition2");}
    else {const changed=form.elements.changed?.value||"no",evidence=[...form.querySelectorAll('input[name="evidence"]:checked')].map(i=>i.value).slice(0,3);newsroomState.meeting2Snapshot={...(previous||{}),tracks,headline,changed,evidence,reason:form.elements.reason?.value.trim()||"",submittedAt:previous?.submittedAt||"13:00",revision,updatedAt:new Date().toISOString()};saveState();go("publicationDecision");}
  }
  function submitPublicationDecision(form) {
    const previous=newsroomState.publicationDecision||{};
    newsroomState.publicationDecision={
      ...previous,
      eventId:form.elements.eventId?.value||null,
      decision:form.elements.decision?.value||null,
      reasons:[...form.querySelectorAll('input[name="reason"]:checked')].map(input=>input.value),
      note:form.elements.note?.value.trim()||"",
      savedAt:previous.savedAt||new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };
    saveState();go("transition3");
  }
  function submitFinalReflection(form) {
    newsroomState.finalReflection={
      q1:form.elements.q1?.value.trim()||"",
      q2:form.elements.q2?.value.trim()||"",
      reality:form.elements.reality?.value||"",
      realityNote:form.elements.realityNote?.value.trim()||"",
      updatedAt:new Date().toISOString()
    };
    saveState();renderReview();appendDeskReview();appendReportingReview();appendBackButton();toast("专题复盘已保存");
  }
  function submitBulletin(form,type="original") {
    const previous=newsroomState.middayBulletinVersions.at(-1)||newsroomState.middayBulletin||{};
    const fallbackEvent=eventById(form.elements.eventId?.value)||eventById(previous.eventId)||knownEvents()[0]||null;
    const item={type,eventId:fallbackEvent?.id||previous.eventId||null,title:form.elements.title?.value.trim()||previous.title||fallbackEvent?.title||"",lead:form.elements.lead?.value.trim()||previous.lead||fallbackEvent?.content||"",source:form.elements.source?.value.trim()||previous.source||fallbackEvent?.source||"",time:type==="original"?"13:10":"17:00",updatedAt:new Date().toISOString()};
    if(type==="original")newsroomState.middayBulletin=item;else newsroomState.middayBulletinVersions.push(item);
    saveState();go(type==="original"?"transition3":"round3");
  }
  function submitProfile(form) {
    const name=form.elements.name?.value.trim()||"";
    const members=[1,2,3,4].map(index=>{
      const memberName=form.elements[`member${index}Name`]?.value.trim()||"";
      const roles=[...form.querySelectorAll(`input[name="member${index}Roles"]:checked`)].map(input=>input.value);
      return {name:memberName,roles};
    });
    newsroomState.newsroomProfile={name,members};
    const alreadyStarted=newsroomState.currentRound>0||newsroomState.grantedRounds.includes(1);
    saveState();
    if(alreadyStarted){
      const target=newsroomState.previousScene&&newsroomState.previousScene!=="cover"?newsroomState.previousScene:`round${newsroomState.currentRound||1}`;
      toast("编辑部资料已保存");
      go(target);
      return;
    }
    grantRound(1);go("round1");
  }
  function submitEdition(form) {
    if(!allReportingDraftsSubmitted()){toast("请先完成四篇课堂初稿");return;}
    const leadGenre=form.elements.leadGenre?.value||["news1","news2","feature"].find(genre=>draftCompleted(newsroomState.reporting.drafts[genre]));
    const newsBriefIds=[...form.querySelectorAll('input[name="editionBrief"]:checked')].map(input=>input.value);
    if(newsBriefIds.some(id=>!newsroomState.discoveredEvents.includes(id))){toast("今日简讯只能使用本组已经发现的线索");return;}
    const discards=[...form.querySelectorAll('input[name="discard"]:checked')].map(input=>({id:input.value,reason:form.elements[`reason-${input.value}`].value,note:form.elements[`note-${input.value}`].value.trim()}));
    if(discards.some(item=>newsBriefIds.includes(item.id))){toast("决定不报道的线索不能同时进入今日简讯");return;}
    newsroomState.editionBriefIds=[...newsBriefIds];
    const wasPublished=Boolean(newsroomState.finalEdition);
    newsroomState.finalEdition={...(newsroomState.finalEdition||{}),mode:"reporting",leadGenre,publishedDraftGenres:Object.keys(REPORTING_GENRES),newsBriefIds:[...newsBriefIds]};
    newsroomState.discardedStories=discards;
    const now=new Date().toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit",hour12:false});
    if(!newsroomState.publishedAt)newsroomState.publishedAt=now;
    if(wasPublished)newsroomState.updatedAt=now;
    saveState();go("published");
  }
  function submitReportingSelection(form) {
    const formData=new FormData(form);const next={};
    REPORTING_SLOT_KEYS.forEach(genre=>{next[genre]=formData.get(genre)||newsroomState.reporting.selectedStories[genre]||null;});
    for(const [genre,storyId] of Object.entries(next)){
      const story=reportingStory(storyId);
      if(!story||!isStoryUnlocked(story)||!story.genres.includes(slotFamily(genre))){toast(`请为“${REPORTING_GENRES[genre].label}”选择一个已解锁故事`);return;}
    }
    const ids=Object.values(next);const unique=new Set(ids);
    const changedGenres=Object.keys(next).filter(genre=>newsroomState.reporting.selectedStories[genre]&&newsroomState.reporting.selectedStories[genre]!==next[genre]&&newsroomState.reporting.drafts[genre]);
    if(changedGenres.length&&!confirm("更换报道对象后，对应文体的当前写作内容将清空。\n已经获得的采访材料不会消失，已经消耗的深采机会不会退回。\n是否继续？"))return;
    for(const genre of REPORTING_SLOT_KEYS){
      const previous=newsroomState.reporting.selectedStories[genre];
      if(previous&&previous!==next[genre]){
        newsroomState.reporting.drafts[genre]=null;newsroomState.reporting.writingPlans[genre]={};newsroomState.reporting.selectedAngles[genre]=null;newsroomState.reporting.customAngles[genre]="";
      }
      newsroomState.reporting.selectedStories[genre]=next[genre];
    }
    ensureAutomaticMaterials();saveState();renderReportingSelect();toast(unique.size<2?"四篇作品计划已保存；提示：也可以尝试覆盖更多事件":"四篇作品计划已保存");
  }
  function performReportingAction(id,genre) {
    const item=reportingMaterial(id),storyId=newsroomState.reporting.selectedStories[genre];
    const family=slotFamily(genre);
    if(!item||item.storyline!==storyId||!item.genres.includes(family)){toast("这项材料不属于当前采写任务");return;}
    if(family==="feature"){
      if(newsroomState.reporting.featureFollowUp&&newsroomState.reporting.featureFollowUp!==id){toast("新闻特写只能选择一位人物跟随");return;}
      newsroomState.reporting.featureFollowUp=id;
    } else {
      const key=reportingActionKey(genre);
      const max=family==="news"?4:2;
      if(!newsroomState.reporting[key].includes(id)){
        if(newsroomState.reporting[key].length>=max){toast(`本类作品最多执行 ${max} 次主动深采`);return;}
        newsroomState.reporting[key].push(id);
      }
    }
    newsroomState.reporting.newsActions=[...new Set([...newsroomState.reporting.news1Actions,...newsroomState.reporting.news2Actions])];
    acquireMaterial(id);saveState();renderMaterialWorkspace(genre);toast("采写完成：材料已收入记者素材夹");
  }
  function selectedMaterialIdsForDraft(genre,storyId) {
    const items=acquiredMaterials(storyId,genre);
    const family=slotFamily(genre);
    if(family==="feature")return items.filter(item=>item.autoGenres.includes("feature")||item.id===newsroomState.reporting.featureFollowUp).map(item=>item.id);
    return items.map(item=>item.id);
  }
  function writingPlanFromForm(form,genre) {
    const value=name=>form.elements[name]?.value?.trim?.()||"";
    const family=slotFamily(genre);
    if(family==="news")return{leadFactId:value("leadFactId")};
    if(family==="feature")return{moment:value("planMoment"),detail:value("planDetail")};
    return{stance:value("planStance"),fact1Id:value("fact1Id"),fact2Id:value("fact2Id"),counterViewpointId:value("counterViewpointId"),skeleton:value("planSkeleton")};
  }
  function saveWritingDraft(form,{submitted=false,quiet=false}={}) {
    const genre=form.dataset.genre;if(!REPORTING_GENRES[genre])return;
    const previous=newsroomState.reporting.drafts[genre]||{};
    const completed=submitted||draftCompleted(previous);
    const storyId=newsroomState.reporting.selectedStories[genre],plan=writingPlanFromForm(form,genre);
    const checks=[...form.querySelectorAll('input[name="factCheck"]:checked')].map(input=>input.value);
    const draft={...previous,genre,storyline:storyId,title:form.elements.title?.value.trim()||"",body:form.elements.body?.value||"",selectedMaterialIds:selectedMaterialIdsForDraft(genre,storyId),planningAnswers:plan,savedAt:new Date().toISOString(),submitted:completed,completed, factCheck:checks};
    if(slotFamily(genre)==="news")draft.leadFactId=plan.leadFactId;
    if(slotFamily(genre)==="commentary"){draft.stance=plan.stance;draft.counterViewpointId=plan.counterViewpointId;}
    if(submitted&&!draft.submittedAt)draft.submittedAt=new Date().toISOString();
    if(completed&&draft.submittedAt)draft.updatedAt=new Date().toISOString();
    newsroomState.reporting.writingPlans[genre]=plan;newsroomState.reporting.drafts[genre]=draft;saveState();
    if(!quiet)toast(submitted||completed?`${REPORTING_GENRES[genre].label}已保存`:"草稿已保存到本机");
  }
  function submitWriting(form) {
    const genre=form.dataset.genre,storyId=newsroomState.reporting.selectedStories[genre];
    if(!storyId){toast("请先选择一个故事");return;}
    const hasBody=Boolean(form.elements.body?.value.trim());
    saveWritingDraft(form,{submitted:true,quiet:true});
    go("reportingSelect");
    toast(hasBody?`${REPORTING_GENRES[genre].label}已保存并提交`:`${REPORTING_GENRES[genre].label}已提交；正文未填写，可稍后补充`);
  }
  function queueWritingAutosave(form) {
    clearTimeout(queueWritingAutosave.timer);
    queueWritingAutosave.timer=setTimeout(()=>saveWritingDraft(form,{quiet:true}),250);
  }
  function resetDay(){if(!confirm("确定清空所有记录吗？\n\n这会清除本机保存的编辑部资料、已发现线索、采访记录、写作内容、版面和复盘，并回到封面。"))return;localStorage.removeItem(STORAGE_KEY);newsroomState=freshState();const panel=$("#teacherPanel");if(panel)panel.hidden=true;render();toast("所有记录已清空");}

  app.addEventListener("click",event=>{
    const action=event.target.closest("[data-action]")?.dataset.action;
    const resumeScene=event.target.closest("[data-resume-scene]")?.dataset.resumeScene;
    const desk=event.target.closest("[data-desk]")?.dataset.desk;
    const wireTab=event.target.closest("[data-wire-tab]")?.dataset.wireTab;
    const wireFilter=event.target.closest("[data-wire-filter]")?.dataset.wireFilter;
    const location=event.target.closest("[data-location]")?.dataset.location;
    const wire=event.target.closest("[data-event]");
    const investigation=event.target.closest("[data-investigate]")?.dataset.investigate;
    const statusButton=event.target.closest("[data-status]");
    const reportingAction=event.target.closest("[data-reporting-action]");
    const openGenre=event.target.closest("[data-open-genre]")?.dataset.openGenre;
    const writeGenre=event.target.closest("[data-write-genre]")?.dataset.writeGenre;
    const saveDraftButton=event.target.closest("[data-save-draft]");
    const angleButton=event.target.closest("[data-angle-card]");
    const customAngleButton=event.target.closest("[data-save-custom-angle]");
    if(angleButton){const genre=angleButton.dataset.angleGenre;newsroomState.reporting.selectedAngles[genre]=angleButton.dataset.angleCard;saveState();renderMaterialWorkspace(genre);return;}
    if(customAngleButton){const genre=customAngleButton.dataset.saveCustomAngle;const textarea=$(`[data-custom-angle="${genre}"]`);newsroomState.reporting.selectedAngles[genre]="custom";newsroomState.reporting.customAngles[genre]=textarea?.value.trim()||"";saveState();renderMaterialWorkspace(genre);return;}
    if(action==="back"){goBack();return;} if(action==="print"){window.print();return;} if(resumeScene){go(resumeScene);return;} if(reportingAction){performReportingAction(reportingAction.dataset.reportingAction,reportingAction.dataset.reportingGenre);return;} if(openGenre){go(reportingSceneFor(openGenre,false));return;} if(writeGenre){go(reportingSceneFor(writeGenre,true));return;} if(saveDraftButton){const form=saveDraftButton.closest("form");if(form)saveWritingDraft(form);return;} if(desk){openDesk(desk);return;} if(wireFilter){newsroomState.wireFilter=wireFilter;saveState();renderDesk();return;} if(wireTab){newsroomState.wireTab=wireTab;saveState();renderDesk();return;} if(location&&!wire){handleMapClick(location);return;} if(wire){const selected=eventById(wire.dataset.event);newsroomState.selectedLocation=wire.dataset.location;newsroomState.selectedEvent=wire.dataset.event;if(selected?.desk)newsroomState.currentDesk=selected.desk;saveState();renderDesk();return;} if(investigation){investigate(investigation);return;} if(statusButton){changeEditorial(statusButton.dataset.id,statusButton.dataset.status);return;}
    if(action==="enter-briefing")go("briefing"); if(action==="start-round1"){grantRound(1);go("round1");} if(action==="meeting1")go("meeting1"); if(action==="meeting2")go("meeting2"); if(action==="enter-round"){const round=Number(event.target.closest("[data-round]").dataset.round);grantRound(round);go(`round${round}`);} if(action==="deadline"){attemptDeadline();} if(action==="reporting-intro")go("reportingIntro"); if(action==="reporting-select")go("reportingSelect"); if(action==="reporting-complete"){if(!REPORTING_SLOT_KEYS.every(slot=>draftCompleted(newsroomState.reporting.drafts[slot]))){toast("请先完成四篇作品");return;}go(newsroomState.finalEdition?"published":"edition");} if(action==="edition")go("edition"); if(action==="bulletin-version")go("bulletinVersion"); if(action==="review")go("review"); if(action==="published")go("published"); if(action==="reset")resetDay();
  });
  app.addEventListener("change",event=>{if(event.target.name==="tracks")updateHeadlineChoices();if(event.target.name==="changed")$("#changeEvidence").hidden=event.target.value!=="yes";if(event.target.name==="headlineEvent"){const selected=eventById(event.target.value);const related=selected?knownEvents().filter(e=>e.storyline===selected.storyline):[];const sourceCount=independentSourceCount(related);const warning=$("#sourceWarning");if(warning)warning.textContent=sourceCount<2?"当前同方向信息仍主要来自单一来源，请继续核实。":`当前同方向信息涉及 ${sourceCount} 个不同来源；仍请判断这些来源是否真正独立。`;}if(["headlineEvent","brief1Event","brief2Event","editionBrief","discard"].includes(event.target.name))syncEditionSelections();const writingForm=event.target.closest("#writingForm");if(writingForm)queueWritingAutosave(writingForm);});
  app.addEventListener("input",event=>{if(event.target.name==="headlineBody")event.target.parentElement.querySelector(".char-count").textContent=`${event.target.value.length} / 150—250`;const writingForm=event.target.closest("#writingForm");if(writingForm){if(event.target.name==="body")updateWritingCount(event.target.value,Number(writingForm.dataset.min),Number(writingForm.dataset.max));queueWritingAutosave(writingForm);}});
  app.addEventListener("submit",event=>{event.preventDefault();if(event.target.id==="profileForm")submitProfile(event.target);if(event.target.id==="meetingForm")submitMeeting(event.target,newsroomState.currentScene==="meeting1"?1:2);if(event.target.id==="publicationDecisionForm")submitPublicationDecision(event.target);if(event.target.id==="bulletinForm")submitBulletin(event.target);if(event.target.id==="bulletinVersionForm")submitBulletin(event.target,event.target.elements.type.value);if(event.target.id==="reportingSelectionForm")submitReportingSelection(event.target);if(event.target.id==="writingForm")submitWriting(event.target);if(event.target.id==="editionForm")submitEdition(event.target);if(event.target.id==="reflectionForm")submitFinalReflection(event.target);});

  function renderTeacherActions(){const box=$("#teacherActions");if(!box||!TEACHER_MODE)return;box.innerHTML=[{label:"开始09:00",scene:"round1",round:1},{label:"进入09:00编辑会",scene:"meeting1",round:1},{label:"推进至13:00",scene:"round2",round:2},{label:"进入13:00编辑会",scene:"meeting2",round:2},{label:"13:00发布判断",scene:"publicationDecision",round:2},{label:"推进至17:00",scene:"round3",round:3},{label:"进入DEADLINE",scene:"deadline",round:3},{label:"进入采写室",scene:"reportingIntro"}].map(item=>`<button data-teacher-scene="${item.scene}" ${item.round?`data-round="${item.round}"`:""}>${item.label}</button>`).join("");}
  const teacherToggle=$("#teacherToggle"),teacherPanel=$("#teacherPanel"),teacherClose=$("#teacherClose"),resetButton=$("#resetDay"),teacherActions=$("#teacherActions");
  if(TEACHER_MODE){teacherToggle.hidden=false;teacherToggle.addEventListener("click",()=>teacherPanel.hidden=false);teacherClose.addEventListener("click",()=>teacherPanel.hidden=true);resetButton.addEventListener("click",resetDay);teacherActions.addEventListener("click",event=>{const button=event.target.closest("[data-teacher-scene]");if(!button)return;const scene=button.dataset.teacherScene;if(scene==="reportingIntro"&&!availableReportingStories().length){toast("当前编辑部没有足够的已发现故事可进入深采。");return;}if(button.dataset.round)grantRound(Number(button.dataset.round));if(scene==="deadline")newsroomState.deadlineLocked=true;go(scene);teacherPanel.hidden=true;});}else{teacherToggle.hidden=true;teacherPanel.hidden=true;}
  render();
})();
