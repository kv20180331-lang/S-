(() => {
  const STORAGE_KEY = "s-city-newsroom-v1";
  const TEACHER_MODE = new URLSearchParams(window.location.search).get("teacher") === "1";
  const $ = (selector, root = document) => root.querySelector(selector);
  const app = $("#app");
  let firstPeriodWarning=false;
  const uiScroll={wire:0,map:0,dossier:0};
  const emptyMembers = () => Array.from({length:4},()=>({name:""}));
  const FIRST_PERIOD_NEWS_VALUES=[
    ["timeliness","时效性","这是正在发生或刚刚发生的事情"],
    ["impact","重要性","影响较多人或涉及重要公共事务"],
    ["proximity","接近性","与S城市民 / 本校学生生活较接近"],
    ["prominence","显著性","涉及重要机构、人物或公共事件"],
    ["novelty","新奇性","具有反常、意外或少见之处"],
    ["human","人情味","能够呈现普通人的真实处境"],
    ["other","其他","其他新闻价值"]
  ];
  const FIRST_PERIOD_VERIFICATIONS=[
    ["reportable","已经有充分证据，可以报道"],
    ["mostly_confirmed","基本事实已确认，但仍有细节待核"],
    ["single_source","目前主要来自单一来源，需要继续核实"],
    ["unconfirmed","信息仍然无法确认"],
    ["debunked","已经被证伪"],
    ["hold","我们决定暂不报道"]
  ];
  const FIRST_PERIOD_NEEDS=["当事人","第二来源","现场","数据","背景资料","官方回应","专业人士","不同观点","目前还不确定"];
  const FIRST_PERIOD_CHECKS=[
    ["confirmedVsPending","我们区分了“已经确认”和“仍待核实”的信息"],
    ["rumorVsFact","我们没有把社交平台传言直接当成事实"],
    ["secondSource","重要判断尽可能寻找了第二来源或独立证据"],
    ["uncertaintyLanguage","我们没有把“可能、初步、正在调查”写成“已经确定”"]
  ];
  const PITCH_POOL_MAX=10;
  const PITCH_NEWS_VALUES=[
    ["timeliness","时效性"],["impact","重要性"],["proximity","接近性"],["prominence","显著性"],["novelty","新奇性"],["human","人情味"]
  ];
  const PITCH_VERIFICATIONS=[
    ["clear","事实较明确"],["verify","还需要进一步核实"],["lead","目前主要是线索 / 传言"]
  ];
  const MORNING_VERIFY_METHODS=["去现场","联系当事人","联系官方 / 涉事方","寻找第二来源","查数据 / 背景资料","其他"];
  const FINAL_CHECK_OPTIONS=[
    ["confirmed","已确认，可以报道"],
    ["mostly","核心事实已确认，但仍有细节待核"],
    ["uncertain","仍不能充分确认"],
    ["debunked","已证伪"],
    ["hold","决定暂不报道"]
  ];
  const freshFirstPeriodSubmission = () => ({
    topStories:Array.from({length:3},()=>({eventId:"",newsValues:[],valueReason:"",verificationDecision:"",verificationReason:""})),
    headlineEventId:"",
    briefCandidates:[],
    briefFacts:{},
    judgementChange:{before:"",evidenceIds:[],evidenceReason:"",after:""},
    verificationChecklist:{confirmedVsPending:false,rumorVsFact:false,secondSource:false,uncertaintyLanguage:false},
    biggestUncertainty:"",
    nextReporting:{storyId:"",question:"",needs:[],reason:""},
    mostCertainFact:"",
    stillNeedsVerification:"",
    submittedAt:""
  });
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
    pitchPool:[], pitchDecisions:{}, briefCandidates:[], finalBriefs:[], finalCheck:{},
    newsroomProfile:{name:"",members:emptyMembers()},
    firstPeriodSubmission:freshFirstPeriodSubmission(),
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
  function normalizeFirstPeriodSubmission(value={}) {
    const base=freshFirstPeriodSubmission(), top=Array.isArray(value.topStories)?value.topStories:[];
    return {
      ...base,...value,
      topStories:base.topStories.map((item,index)=>({ ...item, ...(top[index]||{}), newsValues:Array.isArray(top[index]?.newsValues)?top[index].newsValues:[] })),
      headlineEventId:typeof value.headlineEventId==="string"?value.headlineEventId:"",
      briefCandidates:Array.isArray(value.briefCandidates)?value.briefCandidates.filter(id=>EVENTS.some(event=>event.id===id)):[],
      briefFacts:typeof value.briefFacts==="object"&&value.briefFacts?value.briefFacts:{},
      judgementChange:{...base.judgementChange,...(value.judgementChange||{}),evidenceIds:Array.isArray(value.judgementChange?.evidenceIds)?value.judgementChange.evidenceIds:[]},
      verificationChecklist:{...base.verificationChecklist,...(value.verificationChecklist||{})},
      nextReporting:{...base.nextReporting,...(value.nextReporting||{}),needs:Array.isArray(value.nextReporting?.needs)?value.nextReporting.needs:[]},
      submittedAt:typeof value.submittedAt==="string"?value.submittedAt:""
    };
  }
  function normalizePitchPool(value=[]) {
    return (Array.isArray(value)?value:[])
      .filter(item=>item&&EVENTS.some(event=>event.id===item.eventId))
      .slice(0,PITCH_POOL_MAX)
      .map(item=>({
        eventId:item.eventId,
        newsValues:Array.isArray(item.newsValues)?item.newsValues.filter(id=>PITCH_NEWS_VALUES.some(value=>value[0]===id)):[],
        verificationJudgment:PITCH_VERIFICATIONS.some(value=>value[0]===item.verificationJudgment)?item.verificationJudgment:"",
        addedAt:typeof item.addedAt==="string"?item.addedAt:new Date().toISOString()
      }));
  }
  function normalizePitchDecisions(value={}, pool=[]) {
    const source=typeof value==="object"&&value?value:{};
    const result={};
    Object.entries(source).forEach(([eventId,item])=>{
      if(!EVENTS.some(event=>event.id===eventId)||!item)return;
      result[eventId]={
        eventId,
        newsValues:Array.isArray(item.newsValues)?item.newsValues.filter(id=>PITCH_NEWS_VALUES.some(value=>value[0]===id)):[],
        verificationJudgment:PITCH_VERIFICATIONS.some(value=>value[0]===item.verificationJudgment)?item.verificationJudgment:"",
        pitchDecision:["join","skip"].includes(item.pitchDecision)?item.pitchDecision:"",
        decidedAt:typeof item.decidedAt==="string"?item.decidedAt:""
      };
    });
    normalizePitchPool(pool).forEach(item=>{
      if(!result[item.eventId]){
        result[item.eventId]={eventId:item.eventId,newsValues:item.newsValues,verificationJudgment:item.verificationJudgment,pitchDecision:"join",decidedAt:item.addedAt};
      }
    });
    return result;
  }
  function normalizeBriefCandidates(value=[]) {
    return [...new Set(Array.isArray(value)?value:[])].filter(id=>EVENTS.some(event=>event.id===id));
  }
  function normalizeFinalBriefs(value=[]) {
    return (Array.isArray(value)?value:[])
      .filter(item=>item&&EVENTS.some(event=>event.id===item.eventId))
      .slice(0,6)
      .map(item=>({eventId:item.eventId,title:typeof item.title==="string"?item.title:"",body:typeof item.body==="string"?item.body:"",source:typeof item.source==="string"?item.source:""}));
  }
  function normalizeNewsroomProfile(profile={}) {
    const cleanMember=name=>({name:typeof name==="string"?name:""});
    if(Array.isArray(profile.members)){
      return {name:typeof profile.name==="string"?profile.name:"",members:emptyMembers().map((empty,index)=>cleanMember(profile.members[index]?.name??empty.name))};
    }
    /* 兼容上一版5个固定岗位：只迁移成员姓名，旧角色字段安全忽略。 */
    const names=[];
    const addLegacy=(name)=>{
      if(typeof name!=="string"||!name.trim())return;
      const clean=name.trim();
      if(!names.includes(clean)&&names.length<4)names.push(clean);
    };
    addLegacy(profile.editorInChief);
    addLegacy(profile.cityReporter);
    addLegacy(profile.verificationEditor);
    addLegacy(profile.copyEditor);
    addLegacy(profile.dataReporter);
    return {name:typeof profile.name==="string"?profile.name:"",members:[...names.map(cleanMember),...emptyMembers()].slice(0,4)};
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
        firstPeriodSubmission: normalizeFirstPeriodSubmission(stored.firstPeriodSubmission || base.firstPeriodSubmission),
        reporting: normalizeReporting(stored.reporting || base.reporting),
        pitchPool: normalizePitchPool(stored.pitchPool || []),
        pitchDecisions: normalizePitchDecisions(stored.pitchDecisions || {}, stored.pitchPool || []),
        briefCandidates: normalizeBriefCandidates(stored.briefCandidates || stored.firstPeriodSubmission?.briefCandidates || stored.editionBriefIds || stored.finalEdition?.newsBriefIds || []),
        finalBriefs: normalizeFinalBriefs(stored.finalBriefs || stored.finalEdition?.finalBriefs || []),
        finalCheck: typeof stored.finalCheck === "object" && stored.finalCheck ? stored.finalCheck : {},
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
      state.briefCandidates = normalizeBriefCandidates(state.briefCandidates);
      if(!state.finalBriefs.length&&state.editionBriefIds.length){
        state.finalBriefs=state.editionBriefIds.slice(0,6).map(id=>{const event=EVENTS.find(item=>item.id===id);return {eventId:id,title:event?.title||"",body:event?.content||"",source:event?.source||""};});
      }
      return state;
    }
    catch { return freshState(); }
  }
  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(newsroomState)); }
  function toast(message) { const box=$("#toast"); box.textContent=message; box.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>box.classList.remove("show"),2200); }
  function captureDeskScroll() {
    uiScroll.wire=$("#wireList")?.scrollTop||0;
    uiScroll.map=$(".map-panel")?.scrollTop||0;
    uiScroll.dossier=$("#detailPanel")?.scrollTop||0;
    return {...uiScroll};
  }
  function restoreDeskScroll(scroll=uiScroll) {
    requestAnimationFrame(()=>{
      const wire=$("#wireList"), map=$(".map-panel"), dossier=$("#detailPanel");
      if(wire)wire.scrollTop=scroll.wire||0;
      if(map)map.scrollTop=scroll.map||0;
      if(dossier)dossier.scrollTop=scroll.dossier||0;
    });
  }
  function eventById(id) { return EVENTS.find(event => event.id === id); }
  function locationById(id) { return LOCATIONS.find(location => location.id === id); }
  function html(value="") { return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]); }
  function draftDisplayTitle(genre,draft){ const story=reportingStory(draft?.storyline); return draft?.title?.trim() || story?.title || REPORTING_GENRES[genre]?.label || "未命名稿件"; }
  function activeNewsroomMembers() { return (newsroomState.newsroomProfile.members||[]).filter(member=>member.name?.trim()); }
  function newsroomMemberNames(separator="、") { return activeNewsroomMembers().map(member=>member.name.trim()).join(separator); }
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
    newsroomState.statusHistory[id] = newsroomState.statusHistory[id] || [{ time:SIMULATION.rounds[deskRound()]?.time || "09:00", status:"pending", method }];
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
    const parent={briefing:"cover",round1:"briefing",meeting1:"round1",meeting1Submission:"meeting1",transition2:"meeting1Submission",round2:"transition2",meeting2:"round2",meeting2Submission:"meeting2",publicationDecision:"meeting2Submission",publicationSubmission:"publicationDecision",midday:"meeting2",transition3:"publicationSubmission",round3:"transition3",deadline:"round3",firstPeriodDeadline:"deadline",firstPeriodSubmission:"firstPeriodDeadline",reportingIntro:"firstPeriodSubmission",reportingSelect:"reportingIntro",reportingNews1:"reportingSelect",reportingNews2:"reportingSelect",reportingFeature:"reportingSelect",reportingCommentary:"reportingSelect",writingNews1:"reportingNews1",writingNews2:"reportingNews2",writingFeature:"reportingFeature",writingCommentary:"reportingCommentary",edition:"reportingSelect",published:"edition",review:"published",bulletinVersion:"round3"};
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
  function deskRound() {
    const match=String(newsroomState.currentScene||"").match(/^round([123])$/);
    return match ? Number(match[1]) : newsroomState.currentRound;
  }
  function pitchPoolItems() { newsroomState.pitchPool=normalizePitchPool(newsroomState.pitchPool); return newsroomState.pitchPool.map(item=>({...item,event:eventById(item.eventId)})).filter(item=>item.event); }
  function pitchPoolEventIds() { return pitchPoolItems().map(item=>item.eventId); }
  function pitchEntry(id) { return pitchPoolItems().find(item=>item.eventId===id); }
  function pitchDecision(id) { return newsroomState.pitchDecisions?.[id] || null; }
  function hasPitchDecision(id) { const item=pitchDecision(id); return Boolean(item?.pitchDecision&&item.newsValues?.length&&item.verificationJudgment); }
  function isBriefCandidate(id) { return newsroomState.briefCandidates?.includes(id); }
  function subjectDraftEventIds() {
    const ids=new Set();
    Object.values(newsroomState.reporting?.selectedStories||{}).forEach(storyId=>storyEvents(storyId).forEach(event=>ids.add(event.id)));
    return ids;
  }
  function briefCandidateItems() {
    const poolIds=new Set(pitchPoolEventIds());
    const subjectIds=subjectDraftEventIds();
    newsroomState.briefCandidates=normalizeBriefCandidates(newsroomState.briefCandidates).filter(id=>poolIds.has(id)&&!subjectIds.has(id));
    return newsroomState.briefCandidates.map(id=>eventById(id)).filter(Boolean);
  }
  function finalBriefDraftFor(id) {
    const existing=(newsroomState.finalBriefs||[]).find(item=>item.eventId===id);
    const event=eventById(id);
    const fact=newsroomState.firstPeriodSubmission?.briefFacts?.[id]||"";
    return existing||{eventId:id,title:event?.title||"",body:fact||event?.content||"",source:event?.source||""};
  }
  function applyBriefCandidateDrafts(ids=[],facts={}) {
    const unique=normalizeBriefCandidates(ids).slice(0,6);
    newsroomState.briefCandidates=unique;
    newsroomState.finalBriefs=unique.map(id=>{
      const draft=finalBriefDraftFor(id);
      return {...draft,body:(facts[id]||draft.body||"").trim()};
    });
  }
  function finalBriefByEventId(id) {
    return (newsroomState.finalEdition?.finalBriefs||newsroomState.finalBriefs||[]).find(item=>item.eventId===id);
  }
  function valueLabels(ids=[]) { return ids.map(id=>PITCH_NEWS_VALUES.find(item=>item[0]===id)?.[1]||id).join(" · "); }
  function pitchVerificationLabel(id="") { return PITCH_VERIFICATIONS.find(item=>item[0]===id)?.[1]||"尚未判断"; }
  function pitchDecisionLabel(value="") { return value==="join"?"加入选题池":value==="skip"?"暂不加入选题池":"尚未决定"; }
  function focusTrackIds() {
    const ids=newsroomState.meeting2Snapshot?.tracks?.length ? newsroomState.meeting2Snapshot.tracks : newsroomState.meeting1Snapshot?.tracks||[];
    return ids.filter(id=>eventById(id)).slice(0,3);
  }
  function focusStorylines() { return new Set(focusTrackIds().map(id=>eventById(id)?.storyline).filter(Boolean)); }
  function isFocusRelated(event) { const lines=focusStorylines(); return Boolean(event?.storyline&&lines.has(event.storyline)); }
  function relatedRound3EventsFor(id) {
    const base=eventById(id); if(!base?.storyline)return[];
    return knownEvents().filter(event=>event.id!==id&&event.storyline===base.storyline&&event.round>=3).sort((a,b)=>a.publishTime.localeCompare(b.publishTime));
  }
  function finalCheckData(id) { return newsroomState.finalCheck?.[id]||{status:"",reason:""}; }
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
    syncFinalCheckFromDom();
    const unfinished=unfinishedFinalCheckCount();
    if(unfinished){toast(`还有${unfinished}条重点新闻尚未完成最终核实。`);return;}
    const finalErrors=finalCheckErrors();
    if(finalErrors.length){toast(finalErrors[0]);return;}
    const readiness=reportingPlanFeasibility();
    newsroomState.deadlineLocked=true;saveState();go("firstPeriodDeadline");
    if(readiness.reasons[0])toast(`已进入截稿；提示：${readiness.reasons[0]}`);
  }
  function syncFinalCheckFromDom() {
    const ids=focusTrackIds();
    if(!ids.length)return;
    newsroomState.finalCheck=newsroomState.finalCheck||{};
    ids.forEach(id=>{
      const current=finalCheckData(id);
      const status=$(`input[name="finalCheckStatus-${id}"]:checked`)?.value||current.status||"";
      const reason=$(`[data-final-check-reason="${id}"]`)?.value.trim()||current.reason||"";
      newsroomState.finalCheck[id]={...current,status,reason};
    });
    saveState();
  }
  function unfinishedFinalCheckCount() {
    return focusTrackIds().filter(id=>{
      const data=finalCheckData(id);
      return !data.status||!data.reason||data.reason.replace(/\s/g,"").length<12;
    }).length;
  }
  function finalCheckErrors() {
    const ids=focusTrackIds(),errors=[];
    if(ids.length!==3)errors.push("请先完成13:00午间编辑会，确定3条最终追踪新闻。");
    ids.forEach((id,index)=>{
      const data=finalCheckData(id);
      if(!data.status)errors.push(`请为第${index+1}条重点新闻选择17:00最终核实判断。`);
      if(!data.reason)errors.push(`请填写第${index+1}条重点新闻的最终判断依据。`);
      else if(data.reason.replace(/\s/g,"").length<12)errors.push(`第${index+1}条最终判断依据过短，请写清楚为什么这样判断。`);
    });
    return errors;
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
    const round=SIMULATION.rounds[deskRound()];
    const resourceStatus=`<span><small>剩余采访</small><b class="resource-count">${newsroomState.remainingInvestigations} 次</b></span>`;
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
    app.innerHTML=`<section class="scene briefing-scene"><div class="briefing-paper"><header><span>S CITY DAILY · MORNING BRIEF</span><time>${SIMULATION.date} ${SIMULATION.weekday}　09:00</time></header><form id="profileForm" class="briefing-form" novalidate><div class="briefing-grid"><div class="brief-main"><p class="kicker">TODAY'S ASSIGNMENT</p><h1>17:00前，完成今天的新闻采集与编辑判断。</h1><p class="identity-line">你们是<strong>《S城日报》城市新闻部</strong>。17:00之前，你们首先是一间新闻编辑部：决定去哪里、相信什么、继续查什么、什么值得报道。新闻日结束以后，再把真正掌握的事实写成消息一、消息二、新闻特写和评论。</p><div class="edition-rule"><b>17:00</b><span>新闻日截稿</span><i></i><b>4</b><span>课堂形成初稿</span></div><ul><li>发布事实必须注明来源</li><li>关键事实必须得到充分核实</li><li>优先使用相互独立的来源交叉验证</li><li>判断可以修改，但必须说明为什么修改</li></ul></div><aside class="profile-form"><p class="kicker">BUILD YOUR NEWSROOM</p><h2>${started?"修改编辑部资料":"建立你们的编辑部"}</h2><p class="profile-guidance">请填写小组名称和成员姓名。<b>3—4人组成一个小组，本组成员均需为本班学生。</b></p><label class="profile-name">编辑部名称<input name="name" value="${html(profile.name)}" placeholder="例如：青川新闻社 / 南湾观察 / S城青年报"></label><div class="member-fields simple-members">${profile.members.map((member,index)=>`<article class="member-card"><header><b>成员 ${index+1}</b>${index===3?"<small>可选</small>":""}</header><label class="member-name">姓名<input name="member${index+1}Name" value="${html(member.name)}" placeholder="${index===3?"可留空":"填写姓名"}"></label></article>`).join("")}</div><p class="profile-note">小组资料只用于最终日报和复盘档案署名，不影响采访、核实、写作和排版。</p></aside></div><footer><p>采访机会由整个编辑部共享：09:00 +3、13:00 +3、17:00 +2。<br>选择把记者派往哪里，本身就是编辑判断。</p><button class="primary-action" type="submit">${started?"保存编辑部资料":"进入今日编辑部"} <span>→</span></button></footer></form></div></section>`;
  }

  function regionLayer() { return REGIONS.map(region=>`<div class="region tone-${region.tone} region-${region.id}" style="--x:${region.x}%;--y:${region.y}%;--w:${region.w}%;--h:${region.h}%"><span>${region.name}</span></div>`).join(""); }
  function availableLocationEvents(locationId) { const round=deskRound();return EVENTS.filter(event=>event.location===locationId&&event.round<=round&&event.accessType!=="investigation"&&!isDiscovered(event.id)&&prerequisitesMet(event)); }
  function mapNodes() {
    return LOCATIONS.map(location=>{
      const unread=availableLocationEvents(location.id).length;
      const edgeClass=[location.x<12?"edge-left":"",location.x>88?"edge-right":"",location.y<12?"edge-top":"",location.y>86?"edge-bottom":""].filter(Boolean).join(" ");
      return `<button class="landmark type-${iconGroup(location)} ${edgeClass} ${location.entryType?"special-entry":""} ${newsroomState.selectedLocation===location.id?"active":""} ${newsroomState.discoveredLocations.includes(location.id)?"visited":""}" style="--x:${location.x}%;--y:${location.y}%" data-location="${location.id}" title="${html(location.name)}${unread?` · ${unread}条新动态`:""}" aria-label="${location.name}${unread?`，有${unread}条新动态`:""}"><span class="place-icon">${location.icon}</span><span class="place-name">${location.name.replace("S城","")}</span>${unread?`<i class="node-state unseen" title="有新动态"></i>`:""}</button>`;
    }).join("");
  }
  function renderWire() {
    const items=filteredKnownEvents();
    const round=deskRound();
    return items.map(event=>{const entry=pitchEntry(event.id),related=round===3&&isFocusRelated(event);return `<button class="wire-item ${newsroomState.selectedEvent===event.id?"active":""} ${related?"focus-related":round===3?"soft-dim":""}" data-event="${event.id}" data-location="${event.location}"><div class="wire-top"><time>${event.publishTime}</time><span>${event.region} · ${locationById(event.location)?.name||""}</span><i></i></div><span class="desk-badge desk-${event.desk}">${deskLabel(event)}</span>${related&&event.round>=3?`<strong class="tracked-badge">与你们正在追踪的新闻有关 · NEW</strong>`:""}${entry?`<strong class="pitch-badge">已入选题池</strong>`:""}<h3>${event.title}</h3><p>${event.content}</p><div class="wire-source">来源：${event.source}</div><div class="wire-tags"><span class="${sourceClass(event.sourceType)}">${event.sourceType}</span><span>${verificationLabel(event.verificationStatus)}</span><em>${accessLabel(event)}</em></div></button>`;}).join("") || `<div class="wire-empty"><b>${knownEvents().length?"当前筛选下没有线索":"尚未发现线索"}</b><span>${knownEvents().length?"切换筛选可查看其他已发现信息。":"点击地图地点，查询该处当前阶段的信息。"}</span>${knownEvents().length?"":`<small>新阶段只会在地图上提示 NEW，不会自动进入这里。</small>`}</div>`;
  }
  function pitchPoolPanel() {
    const items=pitchPoolItems();
    return `<section class="pitch-pool-panel" id="pitchPoolPanel" hidden><header><div><span>PITCH POOL</span><h2>选题池 ${items.length} / ${PITCH_POOL_MAX}</h2></div><button type="button" data-pitch-close>×</button></header><p>选题池不是已发现线索总表，而是编辑部准备认真比较、可能继续报道的新闻。最多10条；其中也可以标记为【简讯候选】。</p><div class="pitch-pool-list">${items.map(item=>`<article class="${isBriefCandidate(item.eventId)?"brief-candidate":""}"><time>${html(item.event.publishTime)}</time><h3>${html(item.event.title)}</h3><p>${html(item.event.source)}｜${html(item.event.sourceType)}</p><div><span>${html(valueLabels(item.newsValues)||"未勾选新闻价值")}</span><span>${html(pitchVerificationLabel(item.verificationJudgment))}</span>${isBriefCandidate(item.eventId)?`<span>简讯候选</span>`:""}</div><small>加入时间：${new Date(item.addedAt).toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"})}</small><button data-brief-candidate-toggle="${item.eventId}">${isBriefCandidate(item.eventId)?"取消简讯候选":"标记为简讯候选"}</button><button data-pitch-remove="${item.eventId}">移出选题池</button></article>`).join("")||`<div class="wire-empty"><b>选题池还是空的</b><span>打开线索详情，在“编辑初判”中决定是否加入。</span></div>`}</div></section>`;
  }
  function pitchPoolPreview() {
    const items=pitchPoolItems();
    return `<section class="pitch-pool-preview"><header><span>当前选题池</span><b>${items.length}/${PITCH_POOL_MAX}</b></header><div>${items.map(item=>`<article><time>${html(item.event.publishTime)}</time><h3>${html(item.event.title)}</h3><p>${html(valueLabels(item.newsValues)||"未勾选新闻价值")}｜${html(pitchVerificationLabel(item.verificationJudgment))}</p></article>`).join("")||"<p>选题池为空。请先返回地图添加候选新闻。</p>"}</div></section>`;
  }
  function globalDeskStats() {
    const focus=focusTrackIds().length;
    return `<span>已发现 <b>${knownEvents().length} 条</b></span><span>选题池 <b>${pitchPoolItems().length}/${PITCH_POOL_MAX}</b></span>${focus?`<span>当前重点 <b>${focus}条</b></span>`:""}<button type="button" class="pitch-toggle" data-pitch-open>打开选题池</button>`;
  }
  function editorialButtons(event) {
    const selected=newsroomState.editorialStatuses[event.id]||"pending";
    return `<div class="editorial-marks" aria-label="我的编辑标记">${Object.entries(EDITORIAL_STATUS).map(([key,item])=>`<button class="${selected===key?"active":""}" data-status="${key}" data-id="${event.id}" title="${item.label}">${item.symbol}<span>${item.label}</span></button>`).join("")}</div>`;
  }
  function pitchJudgementCard(event) {
    const item=pitchDecision(event.id);
    if(!item)return `<section class="pitch-result-card pending"><b>编辑初判</b><p>尚未完成。首次打开这条新闻时需要完成初判。</p><button data-pitch-edit="${event.id}">开始初判</button></section>`;
    return `<section class="pitch-result-card"><header><b>初判结果</b><span>${html(pitchDecisionLabel(item.pitchDecision))}</span></header><p><strong>新闻价值：</strong>${html(valueLabels(item.newsValues)||"未选择")}</p><p><strong>信息状态：</strong>${html(pitchVerificationLabel(item.verificationJudgment))}</p><button data-pitch-edit="${event.id}">修改初判</button></section>`;
  }
  function pitchDecisionModal() {
    const event=eventById(newsroomState.pendingPitchEventId);
    if(!event)return"";
    const item=pitchDecision(event.id)||{};
    return `<div class="pitch-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="pitchModalTitle"><section class="pitch-modal"><header><span>编辑初判</span><h2 id="pitchModalTitle">编辑初判｜${html(event.title)}</h2><p>完成这三项判断后，才能继续浏览下一条新闻。</p></header><div class="pitch-modal-body"><fieldset><legend>① 这条新闻具有哪些新闻价值？*</legend>${PITCH_NEWS_VALUES.map(([id,label])=>`<label><input type="checkbox" name="modalPitchValue" value="${id}" ${item.newsValues?.includes(id)?"checked":""}>${label}</label>`).join("")}</fieldset><fieldset><legend>② 目前的信息状态是？*</legend>${PITCH_VERIFICATIONS.map(([id,label])=>`<label><input type="radio" name="modalPitchVerify" value="${id}" ${item.verificationJudgment===id?"checked":""}>${label}</label>`).join("")}</fieldset><fieldset><legend>③ 是否加入选题池？*</legend><label><input type="radio" name="modalPitchDecision" value="join" ${item.pitchDecision==="join"?"checked":""}>加入选题池</label><label><input type="radio" name="modalPitchDecision" value="skip" ${item.pitchDecision==="skip"?"checked":""}>暂不加入选题池</label></fieldset></div><footer><button class="primary-action" data-pitch-complete="${event.id}" disabled>完成初判</button></footer></section></div>`;
  }
  function evidenceCompareCard(event) {
    if(deskRound()!==3||!isFocusRelated(event)||event.round<3)return"";
    const base=focusTrackIds().map(eventById).find(item=>item?.storyline===event.storyline);
    return `<section class="evidence-compare"><b>证据对照提示</b><p><strong>此前我们知道：</strong>${html(base?`${base.publishTime}｜${base.title}`:"13:00已有重点新闻")}</p><p><strong>现在的新证据：</strong>${html(`${event.publishTime}｜${event.title}`)}</p><p><strong>请特别比较：</strong>时间 / 范围 / 来源 / 确定程度等关键词。</p><div>${["印证","补充","限定","修正 / 反转","证伪","暂时无法判断"].map(label=>`<label><input type="radio" name="evidenceRelation-${event.id}"> ${label}</label>`).join("")}</div></section>`;
  }
  function investigationOptions(locationId) {
    const options=EVENTS.filter(event=>event.location===locationId&&event.round<=deskRound()&&event.accessType==="investigation"&&!isDiscovered(event.id)&&prerequisitesMet(event));
    if(!options.length)return"";
    return `<section class="investigation-box"><header><span>REPORTER ACTION</span><b>可执行记者调查</b></header>${options.map(event=>`<div><p>这条线索需要记者主动获取，行动前不会显示结果。</p><button data-investigate="${event.id}" ${newsroomState.remainingInvestigations<event.cost?"disabled":""}>${event.actionLabel}<small>消耗 ${event.cost} 次采访机会</small></button></div>`).join("")}</section>`;
  }
  function specialEntryModule(location) {
    if(!location.channels?.length)return"";
    if(location.entryType==="market"){
      const snapshot=MARKET_SNAPSHOTS[deskRound()]||MARKET_SNAPSHOTS[1];
      return `<section class="entry-module market-entry"><header><span>MARKET SNAPSHOT</span><b>${snapshot.note}</b><small>${snapshot.session}</small></header><div class="market-indexes">${snapshot.indexes.map(([group,name,value,change,state])=>`<article><span>${group} · ${state}</span><b>${name}</b><strong>${value}</strong><em class="${change.includes("-")?"down":""}">${change}</em></article>`).join("")}</div><div class="sector-strip">${snapshot.sectors.map(item=>`<span>${item}</span>`).join("")}</div><p>价格变化是事实；关于“为什么涨跌”的解释可能只是分析，仍需核实。</p></section>`;
    }
    return `<section class="entry-module ${location.entryType}-entry"><header><span>${location.entryType==="government"?"GOVERNMENT INFORMATION":"NEWS AGENCY WIRES"}</span><b>${location.entryType==="government"?"政务公开信息入口":"国内与国际电讯入口"}</b></header><div>${location.channels.map(channel=>`<span>${channel}</span>`).join("")}</div></section>`;
  }
  function detailPanel() {
    const location=locationById(newsroomState.selectedLocation);
    if(!location)return`<div class="editor-note"><span class="kicker">EDITOR'S NOTE</span><h2>今日编辑提示</h2><blockquote>“地图只告诉你哪里有动态，不告诉你什么最重要。”</blockquote><ol><li><b>发现</b><span>浏览公开信息，主动探索地图。</span></li><li><b>核实</b><span>把有限采访机会用于关键问题。</span></li><li><b>判断</b><span>用编辑标记记录你此刻的判断。</span></li></ol></div>`;
    const events=knownEvents().filter(event=>event.location===location.id).reverse();
    const round=deskRound();
    return `<div class="detail-dossier"><header class="place-head"><span class="category">${location.category}</span><h2>${location.name}</h2><p>${location.region}</p></header><div class="place-summary"><span>当前已发现 <b>${events.length} 条</b></span><span>最新更新 <b>${events.at(-1)?.publishTime||"—"}</b></span></div>${specialEntryModule(location)}${investigationOptions(location.id)}<div class="timeline-label"><span>地点公开信息</span><span>LOCATION DOSSIER</span></div><div class="event-list">${events.map(event=>`<article class="event-card ${newsroomState.selectedEvent===event.id?"focused":""} ${round===3&&isFocusRelated(event)?"focus-related":round===3?"soft-dim":""}" data-event="${event.id}" data-location="${event.location}" tabindex="0"><div class="event-time"><time>${event.publishTime}</time><i></i></div><div class="event-body"><div class="event-status"><span>${event.sourceType}</span><span>${verificationLabel(event.verificationStatus)}</span>${round===3&&isFocusRelated(event)&&event.round>=3?`<em>与你们正在追踪的新闻有关 · NEW</em>`:""}</div><h3>${event.title}</h3><p>${event.content}</p><dl><div><dt>信息来源</dt><dd>${event.source}</dd></div><div><dt>获取方式</dt><dd>${accessLabel(event)}</dd></div></dl>${editorialButtons(event)}${evidenceCompareCard(event)}${pitchJudgementCard(event)}</div></article>`).join("")||`<div class="no-news">当前阶段，这里暂无可查询信息。</div>`}</div></div>`;
  }
  function roundAction() {
    const round=deskRound();
    if(round===1)return`<button data-action="meeting1" class="desk-next">进入09:00编辑会 →</button>`;
    if(round===2)return`<button data-action="meeting2" class="desk-next">进入13:00编辑会 →</button>`;
    const readiness=reportingPlanFeasibility();
    return `<div class="deadline-gate ${readiness.ready?"ready":"not-ready"}"><small>${readiness.ready?"后续四文体采写基础已具备":html(readiness.reasons[0]||"还可继续发现新闻，也可以进入截稿")}</small><button data-action="deadline" class="desk-next danger">完成最终核实 · 进入17:00截稿单 →</button></div>`;
  }
  function deskSwitch() { return `<nav class="desk-switch" aria-label="新闻Desk切换">${Object.entries(DESKS).map(([key,desk])=>`<button class="${newsroomState.currentDesk===key?"active":""}" data-desk="${key}"><span>${desk.code}</span>${desk.label}</button>`).join("")}</nav>`; }
  function cityDeskMain() { return `<section class="map-panel panel"><header class="section-head map-head"><div><span class="kicker">PRIMARY NEWS ENTRY</span><h2>S城都市新闻地图</h2></div><div class="map-legend"><span><i class="new-key"></i>NEW · 可查询新信息</span><span><i class="metro-key"></i>城市轨道</span></div></header><div class="city-map" id="cityMap"><div class="region-layer">${regionLayer()}</div><div class="water s-bay"><b>S湾</b><small>S BAY</small></div><div class="water east-coast"><b>东湾海岸</b><small>EAST BAY COAST</small></div><div class="river"><span>青川河</span></div><div class="road road-axis"><span>城市中轴大道</span></div><div class="road road-bay"><span>滨湾大道</span></div><div class="road road-east"><span>东部快速路</span></div><div class="metro metro-1"><span>1</span></div><div class="metro metro-2"><span>2</span></div><div class="metro metro-3"><span>3</span></div><div id="locationLayer">${mapNodes()}</div><div class="north">N<br>↑</div></div><footer class="map-caption"><span>地图是本轮唯一主要信息入口</span><span>点击 NEW 地点，新增信息才会进入左栏</span></footer></section>`; }
  function deskInvestigationCards(desk) {
    const options=EVENTS.filter(event=>event.desk===desk&&event.round<=deskRound()&&event.accessType==="investigation"&&!isDiscovered(event.id)&&prerequisitesMet(event));
    return options.map(event=>`<article class="desk-action-card"><span>REPORTER ACTION</span><h3>仍有关键问题需要主动核实</h3><p>行动前不会显示调查结果。</p><button data-investigate="${event.id}" ${newsroomState.remainingInvestigations<event.cost?"disabled":""}>${event.actionLabel}<small>消耗 ${event.cost} 次采访机会</small></button></article>`).join("");
  }
  function nonCityDeskMain() { return cityDeskMain(); }
  function deskStoryCard(event) { return `<button class="desk-story ${newsroomState.selectedEvent===event.id?"active":""}" data-event="${event.id}" data-location="${event.location}"><time>${event.publishTime}</time><span>${deskLabel(event)} · ${event.sourceType}</span><h3>${event.title}</h3><p>${event.content}</p><small>${verificationLabel(event.verificationStatus)}</small></button>`; }
  function decisionLabel(value) { return value==="publish"?"可以发布":value==="wait"?"继续等待":"尚未决定"; }
  function publicationMemoryCard() {
    const decision=newsroomState.publicationDecision;
    if(deskRound()!==3||!decision)return"";
    const selected=decision.eventId?eventById(decision.eventId):null;
    return `<section class="publication-memory"><span>13:00 PUBLISH OR WAIT</span><b>${selected?html(selected.title):"13:00未指定具体线索"}</b><p>当时判断：${decisionLabel(decision.decision)}。现在获得了新的信息，你们还会作出同样的判断吗？</p></section>`;
  }
  function finalCheckFocusPanel() {
    if(deskRound()!==3)return"";
    const snapshot=newsroomState.meeting2Snapshot, ids=focusTrackIds(), decision=newsroomState.publicationDecision;
    if(!ids.length)return `<section class="final-check-panel"><header><span>FINAL CHECK</span><h2>请先完成13:00编辑会</h2></header><p>17:00最终核实需要围绕13:00已经确定的3条重点新闻展开。</p></section>`;
    return `<section class="final-check-panel"><header><div><span>13:00我们决定继续追踪</span><h2>17:00不是重新选新闻</h2></div><p>围绕你们已经选择的新闻，寻找最后的新证据，完成截稿前核实。</p></header><div class="final-focus-cards">${ids.map((id,index)=>{const event=eventById(id),entry=pitchEntry(id),reason=snapshot?.trackReasons?.[id]||snapshot?.trackReasonList?.[index]||"未填写";return `<article><span>${String(index+1).padStart(2,"0")} ${snapshot?.headline===id?"★ 当前头条候选":""}</span><h3>${html(event?.title||id)}</h3><p><b>13:00继续追踪理由：</b>${html(reason)}</p><p><b>当前核实状态：</b>${html(entry?pitchVerificationLabel(entry.verificationJudgment):verificationLabel(event?.verificationStatus))}</p></article>`;}).join("")}</div><aside><b>13:00发布判断：</b>${html(decisionLabel(decision?.decision))}${decision?.note?`<p>${html(decision.note)}</p>`:"<p>尚未生成13:00发布判断。</p>"}</aside><p class="final-check-reminder">先检查这3条新闻有没有新变化；其他新新闻仍可查看，但不应冲散最终核实任务。</p></section>`;
  }
  function finalCheckProgressPanel() {
    if(deskRound()!==3)return"";
    const ids=focusTrackIds(); if(!ids.length)return"";
    return `<section class="final-progress-panel"><header><span>重点新闻的最新进展</span><p>只显示本组已经真实发现/查询到、且与重点新闻同一主线的17:00新线索。</p></header><div>${ids.map(id=>{const event=eventById(id), updates=relatedRound3EventsFor(id);return `<article><h3>${html(event?.title||id)}</h3><p>13:00判断：${html(newsroomState.meeting2Snapshot?.trackReasons?.[id]||"继续追踪")}</p>${updates.length?updates.map(update=>`<button data-event="${update.id}" data-location="${update.location}"><b>${update.publishTime} NEW</b>${html(update.title)}</button>`).join(""):`<small>目前本组尚未发现新的相关证据。</small>`}</article>`;}).join("")}</div></section>`;
  }
  function finalCheckJudgementPanel() {
    if(deskRound()!==3)return"";
    const ids=focusTrackIds(); if(!ids.length)return"";
    return `<section class="final-check-judgements"><header><span>17:00最终核实判断</span><b>完成后才能进入17:00截稿单</b></header>${ids.map((id,index)=>{const event=eventById(id),data=finalCheckData(id);return `<article><h3>${index+1}. ${html(event?.title||id)}</h3><fieldset><legend>截至17:00，这条新闻目前是：</legend>${FINAL_CHECK_OPTIONS.map(([value,label])=>`<label><input type="radio" name="finalCheckStatus-${id}" value="${value}" ${data.status===value?"checked":""}>${label}</label>`).join("")}</fieldset><label>我们现在这样判断，是因为：*<textarea data-final-check-reason="${id}" maxlength="160" placeholder="请说明最终核实依据、仍待核实的内容，或为什么暂不报道。">${html(data.reason||"")}</textarea></label></article>`;}).join("")}</section>`;
  }
  function renderDesk({preserveScroll=false,scroll=null}={}) {
    const preserved=preserveScroll ? (scroll||captureDeskScroll()) : null;
    const viewRound=deskRound();
    const round=SIMULATION.rounds[viewRound];
    const wireItems=knownEvents();
    const taskText=viewRound===1?"发现新闻后，请判断它是否值得进入你们的选题池。选题池最多10条。":viewRound===2?"回看上午关注的事情，并寻找可能改变判断的新信息。新发现新闻也要先进入选题池。":"围绕你们已经选择的新闻，寻找最后的新证据，完成截稿前核实。";
    app.innerHTML=`${masthead()}${publicationMemoryCard()}${taskHint(taskText,`round${viewRound}`)}${finalCheckFocusPanel()}<div class="desk-ribbon ${newsroomState.deadlineLocked?"locked":""}"><span>${round.code} · ${round.time}</span><p>${`${round.focus}：${viewRound===1?"点击地图发现线索，再作编辑初判。":viewRound===2?"地图上的 NEW 表示有待查询更新。":"17:00不是重新选新闻，先检查13:00三条重点新闻的新变化。"}`}</p><time>ENTRY: CITY MAP</time></div>${finalCheckProgressPanel()}<main class="news-desk v1-desk four-desk-layout map-first-layout"><section class="wire-panel panel"><header class="section-head discovered-head"><div><span>DISCOVERED WIRE</span><h2>已发现线索</h2></div><b>${wireItems.length} 条</b></header><div class="wire-filter"><span><i class="live-dot"></i>我的编辑标记</span><div class="wire-filter-buttons">${wireFilterButton("all","全部")}${wireFilterButton("tracking","追踪","★")}${wireFilterButton("pending","待核","？")}${wireFilterButton("confirmed","确认","✓")}</div></div><div id="wireList" class="wire-list">${renderWire()}</div></section>${cityDeskMain()}<aside class="detail-panel panel" id="detailPanel">${detailPanel()}</aside></main>${finalCheckJudgementPanel()}<footer class="stage-dock v1-stage"><div class="stage-intro"><span class="kicker">${round.code}</span><b>${round.time} · ${round.label}</b></div><div class="round-progress">${[1,2,3].map(n=>`<span class="${n===viewRound?"active":n<viewRound?"done":""}"><i>${n}</i>${SIMULATION.rounds[n].focus}</span>`).join("")}</div><div class="discovery"><span>剩余采访 <b>${newsroomState.remainingInvestigations} 次</b></span>${globalDeskStats()}</div>${roundAction()}</footer>${pitchPoolPanel()}${pitchDecisionModal()}`;
    appendBackButton();
    if(preserved)restoreDeskScroll(preserved);
    updatePitchModalButton();
  }

  function selectionOptions(selected=[], radioName="") {
    const items=pitchPoolItems();
    return items.map(item=>{const event=item.event;return `<label class="meeting-option"><input type="checkbox" name="tracks" value="${event.id}" ${selected.includes(event.id)?"checked":""}><span><b>${event.publishTime}</b>${html(event.title)}<small>${html(valueLabels(item.newsValues)||event.sourceType)}｜${html(pitchVerificationLabel(item.verificationJudgment))}</small></span>${radioName?`<input type="radio" name="${radioName}" value="${event.id}" ${event.id===selected[0]?"checked":""} aria-label="设为头条候选">`:""}</label>`;}).join("") || `<div class="meeting-empty-note">选题池为空。请返回地图，打开线索详情并完成“编辑初判”，把值得比较的新闻加入选题池。</div>`;
  }
  function collectMorningReasonDrafts(form) {
    const values={...(newsroomState.meeting1Snapshot?.trackReasons||{})};
    form?.querySelectorAll("textarea[data-morning-track-reason]").forEach(textarea=>{values[textarea.dataset.morningTrackReason]=textarea.value;});
    return values;
  }
  function morningTrackReasonFields(ids=[],values={}) {
    const unique=[...new Set(ids)].slice(0,3);
    if(!unique.length)return `<div class="meeting-empty-note">选中新闻后，这里会出现每条新闻的“为什么值得继续追踪”填写框。</div>`;
    return unique.map((id,index)=>{const event=eventById(id),decision=pitchDecision(id)||pitchEntry(id)||{};return `<article class="meeting-reason-card"><span>重点新闻 ${String(index+1).padStart(2,"0")}</span><h3>${html(event?.title||id)}</h3><div class="reason-meta"><b>新闻价值：${html(valueLabels(decision.newsValues)||"尚未记录")}</b><b>当前信息状态：${html(pitchVerificationLabel(decision.verificationJudgment))}</b></div><label>为什么值得继续追踪？*<textarea name="trackReason-${id}" data-morning-track-reason="${id}" maxlength="220" placeholder="请结合影响对象、新闻价值、时效性或当前疑点说明，不要只写“很重要”。">${html(values[id]||"")}</textarea></label><small>建议至少20字：可以写它影响了谁、为什么有公共价值、目前还有什么疑点。</small></article>`;}).join("");
  }
  function updateMorningTrackReasonFields(ids) {
    const box=$("#morningTrackReasonFields"),form=$("#meetingForm");
    if(!box)return;
    box.innerHTML=morningTrackReasonFields(ids,collectMorningReasonDrafts(form));
  }
  function renderSubmittedMeeting(round,snapshot) {
    const nextScene=round===1?"transition2":"publicationDecision";
    const changeText={yes:"有，改变了",no:"没有，反而让原判断更确定",uncertain:"目前还不能判断"}[snapshot.changed]||snapshot.changed;
    app.innerHTML=`${masthead()}<main class="meeting-scene submitted-meeting"><header><span>EDITORIAL MEETING · ${round===1?"09:00":"13:00"}</span><h1>${round===1?"晨间":"午间"}编辑会议记录</h1><p>这份记录已保存，可返回会议页继续修改。</p></header><section class="submitted-record"><span>MEETING SNAPSHOT</span><h2>当时的头条候选</h2><h3>${eventById(snapshot.headline)?.title||"—"}</h3>${round===2&&snapshot.morningTracks?.length?`<div><b>上午重点</b>${snapshot.morningTracks.map((id,index)=>`<p><i>0${index+1}</i>${eventById(id)?.title||id}</p>`).join("")}</div>`:""}<div><b>${round===2?"13:00当前重点新闻":"三条追踪线索"}</b>${snapshot.tracks.map((id,index)=>`<p><i>0${index+1}</i>${eventById(id)?.title||id}${snapshot.trackReasons?.[id]?`<small>｜${html(snapshot.trackReasons[id])}</small>`:""}</p>`).join("")}</div>${snapshot.question?`<div><b>当时最想弄清楚的问题</b><p>${html(snapshot.question)}</p></div>`:""}${snapshot.changed?`<div><b>新信息有没有改变判断</b><p>${html(changeText)}${snapshot.reason?`：${html(snapshot.reason)}`:""}</p></div>`:""}${snapshot.evidence?.length?`<div><b>改变判断的新证据</b>${snapshot.evidence.map(id=>`<p>${eventById(id)?.title||id}</p>`).join("")}</div>`:""}${snapshot.headlineReason?`<div><b>头条候选调整理由</b><p>${html(snapshot.headlineReason)}</p></div>`:""}<footer><button class="primary-action" data-resume-scene="${nextScene}">继续新闻日 →</button></footer></section></main>`;
  }
  function morningChoiceCards(snapshot) {
    const tracks=snapshot?.tracks||[];
    if(!tracks.length)return `<div class="morning-choice-empty">还没有09:00编辑会记录。请先完成晨间编辑会，再进入13:00核实与追踪。</div>`;
    return `<section class="morning-choice-panel"><header><span>09:00｜我们上午关注的新闻</span><p>13:00新的信息已经出现。你们可以保留上午的判断，也可以根据新证据新增、替换或修改。</p></header><div class="morning-choice-cards">${tracks.map((id,index)=>{const event=eventById(id);return `<article><span>上午关注 ${String(index+1).padStart(2,"0")}</span>${snapshot.headline===id?"<b>★ 上午头条候选</b>":""}<h3>${html(event?.title||id)}</h3><p>${event?`${event.publishTime}｜${html(locationById(event.location)?.name||event.region||"")}`:""}</p></article>`;}).join("")}</div><aside><b>我们上午最想弄清楚的问题</b><p>“${html(snapshot.question||"未填写")}”</p></aside></section>`;
  }
  function middayNewInfoOptions(selected=[]) {
    const fresh=knownEvents().filter(event=>discoveredDuringRound(event,2)||event.round===2);
    return fresh.map(event=>`<label><input type="checkbox" name="evidence" value="${event.id}" ${selected.includes(event.id)?"checked":""}><span><i>NEW</i><b>${event.publishTime}</b>${html(event.title)}<small>${html(event.sourceType)}｜${verificationLabel(event.verificationStatus)}</small></span></label>`).join("")||`<p class="meeting-empty-note">本组暂时还没有发现13:00新信息。请先返回地图重新点击有NEW提示的地点。</p>`;
  }
  function middayNewInfoCards() {
    const fresh=knownEvents().filter(event=>discoveredDuringRound(event,2)||event.round===2);
    return fresh.map(event=>`<article><span>NEW · 13:00新信息</span><time>${event.publishTime}</time><h3>${html(event.title)}</h3><p>${html(event.content)}</p><small>${html(event.sourceType)}｜${verificationLabel(event.verificationStatus)}</small></article>`).join("")||`<p class="meeting-empty-note">本组暂时还没有发现13:00新信息。请先返回地图重新点击有NEW提示的地点。</p>`;
  }
  function middayCurrentFocusRows(current,previous) {
    const chosen=current?.tracks?.length?current.tracks:(previous?.tracks||[]).slice(0,3);
    while(chosen.length<3)chosen.push("");
    const reasons=current?.trackReasons||{};
    return chosen.slice(0,3).map((id,index)=>`<article class="midday-focus-row"><header><span>当前重点 ${String(index+1).padStart(2,"0")}</span><b>${previous?.tracks?.includes(id)?"继续追踪 / 可替换":"新增 / 替换"}</b></header><label>选择新闻<select name="middayTrack${index}">${pitchEventOptionList(id,"从上午重点 / 当前选题池中选择")}</select></label><label>为什么现在还值得继续追踪？<textarea name="middayReason${index}" maxlength="180" placeholder="上午我们关注它，因为____；13:00出现了____；因此我们决定继续/新增关注，因为____。">${html(reasons[id]||current?.trackReasonList?.[index]||"")}</textarea></label></article>`).join("");
  }
  function renderMeeting(round) {
    const first=round===1;
    const current=first?newsroomState.meeting1Snapshot:newsroomState.meeting2Snapshot;
    const previous=newsroomState.meeting1Snapshot || {tracks:[],headline:null,question:"尚未提交09:00记录"};
    const selectedTracks=current?.tracks||[];
    const selectedEvidence=current?.evidence||[];
    if(first){
      app.innerHTML=`${masthead()}<main class="meeting-scene morning-meeting"><header><span>EDITORIAL MEETING · 09:00</span><h1>晨间编辑会议</h1><p>${current?"这份会议记录可以继续修改；最后一次保存就是当前有效版本。":"从选题池中，确定目前最值得继续追踪的方向。"}</p><div class="morning-submit-alert"><b>本页需截图提交</b><span>这是一项正式作业。请说明“为什么选这3条、为什么其中1条做头条、接下来准备查什么”。完成后生成09:00提交版并完整截图交给老师。</span></div>${taskHint("从选题池中选出最值得继续追踪的3条新闻。选题池不足3条时，请先返回地图继续寻找。","meeting1")}</header><div class="meeting-layout"><form id="meetingForm" class="meeting-form"><p class="optional-flow-note">已发现线索不等于准备报道的新闻；正式选题必须先进入选题池。</p><fieldset><legend>1. 从选题池中选择最值得继续追踪的3条新闻</legend><p>选题池 ${pitchPoolItems().length}/${PITCH_POOL_MAX}。只能从已经完成编辑初判并加入选题池的新闻中选择。</p><div class="meeting-options">${selectionOptions(selectedTracks)}</div></fieldset><section id="morningTrackReasonFields" class="meeting-reason-fields">${morningTrackReasonFields(selectedTracks,current?.trackReasons||{})}</section><fieldset><legend>2. 从上述3条中选择当前头条候选</legend><div id="headlineChoices" class="headline-choices"><p>先在上方选满三条线索。</p></div></fieldset><label class="text-question"><span>为什么它比另外两条更适合作为当前头条？*</span><textarea name="headlineReason" maxlength="220" placeholder="请比较三条新闻的影响范围、重要性、时效性和公共性。">${html(current?.headlineReason||"")}</textarea></label><label class="text-question"><span>3. 我们现在最想弄清楚的问题是什么？*</span><textarea name="question" maxlength="160" placeholder="这个问题应该是目前已有信息还不能回答、但继续采访可以回答的问题。例如：地铁设备故障和降雨有关吗？">${html(current?.question||"")}</textarea></label><section class="morning-verify-methods"><h2>4. 下一步怎么核实？*</h2><p>针对头条候选，选择你们准备采用的核实方式。</p><div>${MORNING_VERIFY_METHODS.map(method=>`<label><input type="checkbox" name="verifyMethod" value="${method}" ${(current?.verifyMethods||[]).includes(method)?"checked":""}>${method}</label>`).join("")}</div><label class="text-question"><span>我们最想获得的证据是：*</span><textarea name="desiredEvidence" maxlength="160" placeholder="例如：地铁运营方关于设备进水原因和恢复时间的正式说明。">${html(current?.desiredEvidence||"")}</textarea></label></section><button class="primary-action" type="submit">生成09:00晨间编辑会提交版 →</button></form></div></main>`;
      updateHeadlineChoices(current?.headline||selectedTracks[0]||"");
      return;
    }
    const changedValue=current?.changed||"uncertain";
    app.innerHTML=`${masthead()}<main class="meeting-scene midday-meeting"><header><span>EDITORIAL MEETING · 13:00</span><h1>核实与追踪 / 午间编辑会</h1><p>${current?"这份午间记录可以继续修改；09:00历史快照不会被覆盖。":"新证据出现后，重新检查上午的判断。修改判断不是失败。"}</p>${taskHint("回看上午关注的事情，并寻找可能改变判断的新信息。","meeting2")}<div class="midday-submit-alert"><b>本页需要截图提交</b><span>完成午间编辑会后，请生成13:00提交版并完整截图。截图将记录你们如何根据新证据修改编辑判断。</span></div>${morningChoiceCards(previous)}${pitchPoolPreview()}</header><form id="meetingForm" class="meeting-form midday-meeting-form"><section class="midday-section"><header><span>02</span><h2>13:00出现了什么新信息</h2><p>下面只突出上午之后出现或在午间新发现的信息。它们可能强化、修正或推翻上午判断。</p></header><div class="midday-new-info">${middayNewInfoCards()}</div></section><section class="midday-section change-field"><header><span>03</span><h2>新证据有没有改变上午的判断？*</h2></header><div class="midday-change-radios"><label><input type="radio" name="changed" value="yes" ${changedValue==="yes"?"checked":""}> 改变了</label><label><input type="radio" name="changed" value="no" ${changedValue==="no"?"checked":""}> 没有改变，但让原判断更确定</label><label><input type="radio" name="changed" value="uncertain" ${changedValue==="uncertain"?"checked":""}> 目前仍无法判断</label></div><div id="changeEvidence"><p>请选择1—3条本组已经发现的13:00新证据。</p><div class="evidence-options">${middayNewInfoOptions(selectedEvidence)}</div><label>原判断 → 新证据 → 新判断 *<textarea name="reason" maxlength="260" placeholder="上午我们原本认为____；\n新证据显示____；\n因此现在我们认为____。">${html(current?.reason||"")}</textarea></label><div class="fp-guide"><b>填写提示</b><p>可以参考上方新线索提示和证据对照，但不要照抄。请自己说明旧判断、新证据和新判断之间的关系。</p></div></div></section><section class="midday-section"><header><span>04</span><h2>13:00｜我们现在最值得继续追踪的3条新闻</h2><p>可以保留上午新闻，也可以用13:00新发现替换。最终整理出3条当前重点新闻。</p></header><div class="midday-focus-list">${middayCurrentFocusRows(current,previous)}</div></section><section class="midday-section"><header><span>05</span><h2>13:00当前头条候选</h2><p>上午头条候选：${html(eventById(previous.headline)?.title||"未选择")}</p></header><div id="headlineChoices" class="headline-choices"><p>先在上方整理3条当前重点新闻。</p></div><label class="text-question"><span>为什么保留/更换头条？*</span><textarea name="headlineReason" maxlength="180" placeholder="请从新闻价值、公共影响、新证据、真实性和时效性考虑。">${html(current?.headlineReason||"")}</textarea></label><label class="text-question"><span>13:00我们现在最想弄清楚的问题是什么？</span><textarea name="question" maxlength="120" placeholder="例如：午间新通报是否已经确认事件原因？">${html(current?.question||previous.question||"")}</textarea></label></section><button class="primary-action" type="submit">生成13:00午间编辑会提交版 →</button></form></main>`;
    updateHeadlineChoices(current?.headline||selectedTracks[0]||previous.headline||"");
  }
  function updateHeadlineChoices(preferred=""){
    const form=$("#meetingForm");if(!form)return;
    const previous=preferred||form.elements.headline?.value||"";
    let ids=[...form.querySelectorAll('input[name="tracks"]:checked')].map(i=>i.value);
    if(!ids.length)ids=[...form.querySelectorAll('select[name^="middayTrack"]')].map(select=>select.value).filter(Boolean);
    ids=[...new Set(ids)];
    if(newsroomState.currentScene==="meeting1")updateMorningTrackReasonFields(ids);
    const box=$("#headlineChoices");
    box.innerHTML=ids.length?ids.map((id,index)=>`<label><input type="radio" name="headline" value="${id}" ${id===(previous||ids[0])||(!previous&&index===0)?"checked":""}><span>${html(eventById(id)?.title||id)}</span></label>`).join(""):`<p>先在上方选满三条线索。</p>`;
  }
  function morningMeetingErrors(data) {
    const errors=[];
    if(pitchPoolItems().length<3)errors.push("选题池不足3条。请先返回地图，把值得比较的新闻加入选题池。");
    if(data.tracks.length!==3||new Set(data.tracks).size!==3)errors.push("请从选题池中选出3条不同的重点新闻。");
    data.tracks.forEach((id,index)=>{
      const reason=data.trackReasons?.[id]||"";
      if(!reason)errors.push(`请填写第${index+1}条重点新闻“为什么值得继续追踪”。`);
      else if(reason.replace(/\s/g,"").length<20)errors.push(`第${index+1}条追踪理由过短，请至少写清影响对象、新闻价值、时效性或当前疑点。`);
    });
    if(!data.headline||!data.tracks.includes(data.headline))errors.push("请从这3条中选择当前头条候选。");
    if(!data.headlineReason)errors.push("请填写为什么它比另外两条更适合作为当前头条。");
    else if(data.headlineReason.replace(/\s/g,"").length<30)errors.push("头条排序理由过短，请比较三条新闻的影响范围、重要性、时效性和公共性，建议至少30字。");
    if(!data.question)errors.push("请填写“我们现在最想弄清楚的问题”。");
    if(!data.verifyMethods?.length)errors.push("请至少选择1项“下一步怎么核实”。");
    if(!data.desiredEvidence)errors.push("请填写“我们最想获得的证据”。");
    return errors;
  }
  function renderMeeting1Submission() {
    const snapshot=newsroomState.meeting1Snapshot;
    const profile=newsroomState.newsroomProfile, members=newsroomMemberNames(" / ");
    if(!snapshot){go("meeting1",{record:false});return;}
    app.innerHTML=`${masthead()}<main class="scene morning-submission"><section class="morning-submit-paper"><header><div><span>S CITY DAILY · MORNING EDITORIAL RECORD</span><h1>《09:00 晨间编辑会记录》</h1><p>${SIMULATION.date} · 09:00</p></div><aside><b>${html(profile.name||"未命名编辑部")}</b><small>成员：${html(members||"未填写")}</small></aside></header><div class="fp-submit-alert">请将本页完整截图提交给老师</div><section class="morning-submit-news">${snapshot.tracks.map((id,index)=>{const event=eventById(id),decision=pitchDecision(id)||pitchEntry(id)||{};return `<article class="${snapshot.headline===id?"is-headline":""}"><span>重点新闻 ${String(index+1).padStart(2,"0")}${snapshot.headline===id?" · 头条候选":""}</span><h2>${html(event?.title||id)}</h2><time>${event?`${event.publishTime}｜${html(locationById(event.location)?.name||event.region||"")}`:"—"}</time><p><b>新闻价值标签：</b>${html(valueLabels(decision.newsValues)||"未记录")}</p><p><b>当前信息状态：</b>${html(pitchVerificationLabel(decision.verificationJudgment))}</p><p><b>为什么值得继续追踪：</b>${html(snapshot.trackReasons?.[id]||"未填写")}</p></article>`;}).join("")}</section><section class="morning-submit-grid"><article><span>HEADLINE CHOICE</span><h2>头条候选</h2><p>${html(eventById(snapshot.headline)?.title||"未选择")}</p><h3>为什么它比另外两条更适合作为当前头条？</h3><p>${html(snapshot.headlineReason||"未填写")}</p></article><article><span>CORE QUESTION</span><h2>我们现在最想弄清楚的问题</h2><p>${html(snapshot.question||"未填写")}</p></article><article><span>NEXT VERIFICATION</span><h2>下一步怎么核实</h2><ul>${(snapshot.verifyMethods||[]).map(method=>`<li>${html(method)}</li>`).join("")||"<li>未选择</li>"}</ul><h3>我们最想获得的证据</h3><p>${html(snapshot.desiredEvidence||"未填写")}</p></article></section><p class="fp-bottom-reminder">请将本页完整截图提交给老师。截图应能看出：为什么选这3条 → 为什么其中1条做头条 → 接下来准备查什么。</p><div class="fp-submit-actions"><button class="secondary-action" data-action="meeting1">返回修改</button><button class="primary-action" data-resume-scene="transition2">继续进入13:00新闻日 →</button></div></section></main>`;
  }
  function middayMeetingErrors(data) {
    const errors=[];
    if(data.tracks.length!==3||new Set(data.tracks).size!==3)errors.push("请整理出3条不同的13:00重点追踪新闻。");
    data.tracks.forEach((id,index)=>{
      const reason=data.trackReasonList?.[index]||data.trackReasons?.[id]||"";
      if(!reason)errors.push(`请填写第${index+1}条重点新闻“为什么现在仍值得继续追踪”。`);
      else if(reason.replace(/\s/g,"").length<20)errors.push(`第${index+1}条继续追踪理由过短，请至少写清楚1—2项判断依据。`);
    });
    if(!data.headline)errors.push("请选择13:00当前头条候选。");
    if(!data.headlineReason)errors.push("请填写为什么保留/更换头条。");
    else if(data.headlineReason.replace(/\s/g,"").length<12)errors.push("头条理由过短，请从新闻价值、公共影响、新证据、真实性或时效性说明。");
    if(!data.changed)errors.push("请选择“新证据有没有改变上午的判断”。");
    if(!data.evidence?.length)errors.push("请选择1—3条13:00关键新证据。");
    if(!data.reason)errors.push("请填写“原判断 → 新证据 → 新判断”。");
    else if(data.reason.replace(/\s/g,"").length<24)errors.push("“原判断 → 新证据 → 新判断”过短，请按格式写完整。");
    return errors;
  }
  function renderMeeting2Submission() {
    const snapshot=newsroomState.meeting2Snapshot, morning=newsroomState.meeting1Snapshot||{};
    const profile=newsroomState.newsroomProfile, members=newsroomMemberNames(" / ");
    if(!snapshot){go("meeting2",{record:false});return;}
    const changeText={yes:"改变了",no:"没有改变，但让原判断更确定",uncertain:"目前仍无法判断"}[snapshot.changed]||snapshot.changed;
    app.innerHTML=`${masthead()}<main class="scene midday-submission"><section class="midday-submit-paper"><header><div><span>S CITY DAILY · EDITORIAL RECORD</span><h1>《13:00 午间编辑会记录》</h1><p>${SIMULATION.date} · 13:00</p></div><aside><b>${html(profile.name||"未命名编辑部")}</b><small>成员：${html(members||"未填写")}</small></aside></header><div class="fp-submit-alert">请将本页完整截图提交给老师</div><section class="midday-submit-columns"><article><span>09:00我们原来的判断</span><h2>上午关注</h2>${(morning.tracks||[]).map((id,index)=>`<p><b>${index+1}.</b> ${html(eventById(id)?.title||id)}${morning.headline===id?"　★ 上午头条候选":""}</p>`).join("")||"<p>未记录</p>"}<h3>上午核心问题</h3><p>${html(morning.question||"未填写")}</p></article><article><span>13:00关键新证据</span><h2>${html(changeText)}</h2>${snapshot.evidence.map((id,index)=>{const event=eventById(id);return `<p><b>${index+1}.</b> ${html(event?.title||id)}<small>${event?` ${event.publishTime}｜${html(event.sourceType)}`:""}</small></p>`;}).join("")}<h3>证据作用说明</h3><p>${html(snapshot.reason||"未填写")}</p></article><article><span>13:00我们现在的判断</span><h2>当前重点新闻</h2>${snapshot.tracks.map((id,index)=>`<p><b>${index+1}.</b> ${html(eventById(id)?.title||id)}<small>${html(snapshot.trackReasons?.[id]||snapshot.trackReasonList?.[index]||"未填写理由")}</small></p>`).join("")}<h3>当前头条候选</h3><p>${html(eventById(snapshot.headline)?.title||"未选择")}</p><p><b>理由：</b>${html(snapshot.headlineReason||"未填写")}</p></article></section><section class="midday-change-flow"><h2>我们的判断怎样变化</h2><div><b>上午</b><p>${html(morning.question||eventById(morning.headline)?.title||"未填写")}</p></div><i>↓</i><div><b>新证据</b><p>${html(snapshot.evidence.map(id=>eventById(id)?.title).filter(Boolean).join("；")||"未选择")}</p></div><i>↓</i><div><b>13:00</b><p>${html(snapshot.question||eventById(snapshot.headline)?.title||"未填写")}</p></div></section><p class="fp-bottom-reminder">请将本页完整截图提交给老师。</p><div class="fp-submit-actions"><button class="secondary-action" data-action="meeting2">返回修改</button><button class="primary-action" data-action="publication-decision">继续进入13:00发布判断 →</button></div></section></main>`;
  }
  function renderTransition(round) { const next=SIMULATION.rounds[round]; app.innerHTML=`<section class="scene transition-scene"><span>TIME ADVANCE</span><time>${next.time}</time><h1>${round===2?"S城仍在变化。":"距离晚间版截稿越来越近。"}</h1><p>${round===2?"地图上的部分地点将出现 NEW。\n只有重新点击地点，新信息才会进入已发现线索。":"新的官方通报和现场变化已经出现。\n回到地图，决定哪些地点值得再次核实。"}</p><div>+${SIMULATION.investigationGrants[round]} <small>${round===3?"最后新增采访机会":"新增采访机会"}</small></div><button class="primary-action" data-action="enter-round" data-round="${round}">${round===2?"进入午间编辑台":"进入最终核实"} →</button></section>`; }
  function renderMidday() {
    const item=newsroomState.middayBulletin||{};
    app.innerHTML=`${masthead()}<main class="bulletin-scene"><header><span>S CITY DAILY · 13:00</span><h1>《S城日报 · 午间快讯》</h1><p>${newsroomState.middayBulletin?"已保存的午间快讯可以直接修改；最后一次保存就是当前版本。":"只发布一条。发布前，请确认现有证据是否足以支持这条消息。"}</p></header><form id="bulletinForm"><p class="optional-flow-note">标题、导语和来源均可留空；系统会沿用所选线索信息。</p><label>选择报道线索<select name="eventId"><option value="">请选择</option>${knownEvents().map(e=>`<option value="${e.id}" ${item.eventId===e.id?"selected":""}>${html(e.title)}</option>`).join("")}</select></label><label>标题（选填）<input name="title" maxlength="50" value="${html(item.title||"")}" placeholder="留空则使用所选线索标题"></label><label>一句话导语（选填）<textarea name="lead" maxlength="120" placeholder="留空则使用线索摘要">${html(item.lead||"")}</textarea></label><label>信息来源（选填）<input name="source" maxlength="100" value="${html(item.source||"")}" placeholder="留空则沿用线索来源"></label><label class="evidence-check"><input type="checkbox" name="enough"> 我们认为现有证据足以发布（选填）</label><button class="primary-action" type="submit">${newsroomState.middayBulletin?"保存修改":"发布午间快讯"} →</button></form></main>`;
  }
  function renderPublicationDecision() {
    const item=newsroomState.publicationDecision||{};
    const reasons=["信息已经得到充分核实","已有两个或以上相对独立的来源","核心事实已经明确","信息尚未充分核实","缺少第二来源","事件仍在快速变化","新闻价值仍不明确","其他"];
    const priorityIds=focusTrackIds();
    const optionIds=[...new Set([...priorityIds,...(item.eventId?[item.eventId]:[])])].filter(id=>eventById(id));
    app.innerHTML=`${masthead()}<main class="bulletin-scene publication-decision-scene"><header><span>13:00 · PUBLISH OR WAIT</span><h1>13:00是否适合发布？</h1><div class="midday-submit-alert"><b>本页需截图提交</b><span>这是一项第一课时阶段成果。完成发布判断后，请生成提交版并完整截图提交老师。本页将纳入过程性评价。</span></div>${taskHint("判断当前3条重点新闻中，哪一条已经足够可靠，可以发布。","publicationDecision")}</header><form id="publicationDecisionForm"><label>判断对象 *<select name="eventId"><option value="">请选择当前重点新闻</option>${optionIds.map(id=>{const e=eventById(id);return `<option value="${e.id}" ${item.eventId===e.id?"selected":""}>${html(e.publishTime)}｜${html(e.title)}</option>`;}).join("")}</select></label><fieldset class="decision-radio"><legend>13:00是否适合发布？*</legend><label><input type="radio" name="decision" value="publish" ${item.decision==="publish"?"checked":""}> 现在可以发布</label><label><input type="radio" name="decision" value="wait" ${item.decision==="wait"?"checked":""}> 暂缓发布，继续核实</label></fieldset><fieldset class="decision-reasons"><legend>理由 *（至少选择1项）</legend>${reasons.map(reason=>`<label><input type="checkbox" name="reason" value="${reason}" ${(item.reasons||[]).includes(reason)?"checked":""}> ${reason==="缺少第二来源"?termInfo(reason,"与第一条信息相对独立的另一个信息来源，用来帮助核实事实。"):reason}</label>`).join("")}</fieldset><label class="publication-note-field">请说明你们为什么作出这个发布判断？*<textarea name="note" maxlength="260" placeholder="目前已经确认____；
信息主要来自____；
仍未确认____；
因此我们认为现在应该____。">${html(item.note||"")}</textarea></label><div class="fp-guide"><b>填写提示</b><p>至少写清2点：目前已经确认了什么、信息来源是否可靠、是否有第二来源或独立证据、还有什么没有确认、事件是否仍在快速变化、为什么现在适合发布 / 为什么应该继续等待。建议不少于30字。</p></div><button class="primary-action" type="submit">生成13:00发布判断提交版 →</button></form></main>`;
  }
  function publicationDecisionErrors(data) {
    const errors=[];
    if(!data.eventId)errors.push("请选择具体的判断对象。");
    if(!data.decision)errors.push("请选择现在可以发布，或暂缓发布继续核实。");
    if(!data.reasons?.length)errors.push("请至少勾选1项发布判断理由。");
    if(!data.note)errors.push("请填写发布判断依据说明。");
    else if(data.note.replace(/\s/g,"").length<30)errors.push("补充说明过短，请至少写清2点判断依据，建议不少于30字。");
    return errors;
  }
  function renderPublicationSubmission() {
    const item=newsroomState.publicationDecision;
    if(!item){go("publicationDecision",{record:false});return;}
    const profile=newsroomState.newsroomProfile, members=newsroomMemberNames(" / "), event=eventById(item.eventId);
    app.innerHTML=`${masthead()}<main class="scene publication-submission"><section class="publication-submit-paper"><header><div><span>S CITY DAILY · PUBLISH OR WAIT</span><h1>《13:00 发布判断记录》</h1><p>${SIMULATION.date} · 13:00</p></div><aside><b>${html(profile.name||"未命名编辑部")}</b><small>成员：${html(members||"未填写")}</small></aside></header><div class="fp-submit-alert">请将本页完整截图提交给老师</div><section class="publication-submit-main"><article><span>判断对象</span><h2>${html(event?.title||"未选择")}</h2><p>${event?`${event.publishTime}｜${html(locationById(event.location)?.name||event.region||"")}｜来源：${html(event.source)}`:"—"}</p></article><article><span>我们的决定</span><h2>${decisionLabel(item.decision)}</h2><p>${item.decision==="publish"?"本编辑部认为当前信息已具备发布条件。":"本编辑部认为当前信息仍需继续核实。"}</p></article></section><section class="publication-submit-grid"><article><span>我们的理由</span><ul>${item.reasons.map(reason=>`<li>${html(reason)}</li>`).join("")}</ul></article><article><span>我们的判断依据</span><p>${html(item.note)}</p></article></section><p class="fp-bottom-reminder">请将本页完整截图提交给老师。</p><div class="fp-submit-actions"><button class="secondary-action" data-action="publication-decision">返回修改</button><button class="primary-action" data-action="transition3">继续进入17:00新闻日 →</button></div></section></main>`;
  }
  function renderBulletinVersion() { const latest=newsroomState.middayBulletinVersions.at(-1)||newsroomState.middayBulletin;app.innerHTML=`${masthead()}<main class="bulletin-scene"><header><span>VERSION CONTROL</span><h1>更新午间快讯</h1><p>旧版本不会消失。请选择“更新报道”或“发布更正”。</p></header><form id="bulletinVersionForm"><p class="optional-flow-note">更新内容可以留空，留空时沿用上一版本。</p><label>版本类型<select name="type"><option value="updated">更新报道</option><option value="corrected">发布更正</option></select></label><label>标题（选填）<input name="title" value="${latest.title||''}"></label><label>导语（选填）<textarea name="lead">${latest.lead||''}</textarea></label><label>信息来源（选填）<input name="source" value="${latest.source||''}"></label><button class="primary-action" type="submit">保存新版本 →</button></form></main>`; }
  function eventOptionList(selected="",placeholder="选择本组已发现新闻") {
    return `<option value="">${placeholder}</option>${knownEvents().map(event=>`<option value="${event.id}" ${selected===event.id?"selected":""}>${event.publishTime}｜${html(event.title)}</option>`).join("")}`;
  }
  function pitchEventOptionList(selected="",placeholder="从选题池中选择") {
    const ids=[...new Set([...(newsroomState.meeting1Snapshot?.tracks||[]),...pitchPoolEventIds(),...(selected?[selected]:[])])].filter(id=>eventById(id));
    return `<option value="">${placeholder}</option>${ids.map(id=>{const event=eventById(id),inPool=pitchEntry(id);return `<option value="${id}" ${selected===id?"selected":""}>${event.publishTime}｜${html(event.title)}${inPool?"｜选题池":"｜09:00重点"}</option>`;}).join("")}`;
  }
  function evidenceOptionList(selected=[]) {
    return knownEvents().map(event=>`<label><input type="checkbox" name="changeEvidence" value="${event.id}" ${selected.includes(event.id)?"checked":""}><span>${event.publishTime}｜${html(event.title)}</span></label>`).join("");
  }
  function firstPeriodReasonGuide() {
    return `<div class="fp-guide"><b>填写提示</b><p>请不要只写“重要”“有意思”“值得报道”。请尽量写清楚2—3点：它涉及谁、影响哪些人、为什么重要、为什么值得今天继续追踪、新闻价值体现在哪里、你们最关心哪一部分。</p><small>建议格式：我们选择继续追踪这条新闻，因为它涉及____，对____有影响，它的新闻价值主要体现在____，我们接下来最想弄清楚的是____。</small></div>`;
  }
  function firstPeriodQuestionGuide() {
    return `<div class="fp-guide"><b>填写提示</b><p>请把问题写具体，不要只写“到底怎么回事”。可以思考：是否正式确认？谁受到影响？范围、时间、原因是否明确？有没有说法不一致？还缺什么关键信息？</p><small>建议格式：我们最想弄清楚的是：____是否已经明确，以及____会对____造成什么影响。</small></div>`;
  }
  function nextReportingOptions(selected="") {
    const eventOptions=knownEvents().map(event=>`<option value="event:${event.id}" ${selected===`event:${event.id}`?"selected":""}>新闻｜${event.publishTime}｜${html(event.title)}</option>`).join("");
    const storyOptions=availableReportingStories().map(story=>`<option value="story:${story.id}" ${selected===`story:${story.id}`?"selected":""}>深采故事｜${html(story.title)}</option>`).join("");
    return `<option value="">选择已发现新闻 / 已解锁故事</option>${eventOptions}${storyOptions}`;
  }
  function firstPeriodHeadlineOptions(data) {
    const ids=[...new Set((data.topStories||[]).map(item=>item.eventId).filter(Boolean))];
    if(!ids.length)return `<option value="">先在上方选出3条继续追踪的新闻</option>`;
    return `<option value="">请选择当前头条候选</option>${ids.map((id,index)=>`<option value="${id}" ${data.headlineEventId===id?"selected":""}>候选${index+1}｜${html(eventById(id)?.title||id)}</option>`).join("")}`;
  }
  function firstPeriodSelectedItem(value) {
    if(!value)return "";
    if(value.startsWith("story:"))return reportingStory(value.slice(6))?.title||value;
    return eventById(value.replace(/^event:/,""))?.title||value;
  }
  function firstPeriodEventMini(eventId) {
    const event=eventById(eventId), place=event&&locationById(event.location);
    if(!event)return `<div class="fp-event-mini empty">选择新闻后，这里会自动显示标题、时间、地点、来源和核实状态。</div>`;
    return `<div class="fp-event-mini"><h4>${html(event.title)}</h4><dl><div><dt>时间</dt><dd>${event.publishTime}</dd></div><div><dt>地点</dt><dd>${html(place?.name||event.region||"")}</dd></div><div><dt>来源</dt><dd>${html(event.source)}</dd></div><div><dt>信息状态</dt><dd>${verificationLabel(event.verificationStatus)}</dd></div></dl></div>`;
  }
  function firstPeriodBriefCandidateSection(data) {
    const focusIds=new Set((data.topStories||[]).map(item=>item.eventId).filter(Boolean));
    const selected=new Set(normalizeBriefCandidates(data.briefCandidates||newsroomState.briefCandidates));
    const facts=data.briefFacts||{};
    const items=pitchPoolItems().filter(item=>!focusIds.has(item.eventId));
    return `<section class="fp-block brief-candidate-section"><header><span>05</span><h2>今日简讯候选</h2><p>从选题池中选择3—6条非主体稿件新闻。简讯不占3条重点追踪名额，每条只写一个已经基本确认的核心事实。</p></header><div class="brief-candidate-list">${items.map(item=>{const event=item.event,checked=selected.has(event.id);return `<article class="brief-candidate-row"><label><input type="checkbox" name="briefCandidate" value="${event.id}" ${checked?"checked":""}><span><b>${html(event.title)}</b><small>${event.publishTime}｜${html(event.source)}｜${html(pitchVerificationLabel(item.verificationJudgment))}</small></span></label><textarea name="briefFact-${event.id}" maxlength="100" placeholder="用一句话写清一个核心事实，例如：湾区会展中心今天10时开放智能制造展，主办方称预约观众超过8000人。">${html(facts[event.id]||event.content||"")}</textarea></article>`;}).join("")||`<div class="wire-empty"><b>选题池里还没有可做简讯的新闻</b><span>请先在新闻地图中完成初判，并把适合的小新闻加入选题池。</span></div>`}</div><p class="edition-brief-note">要求：3—6条；来自选题池；不与3条重点追踪新闻重复；每条只写一个核心事实。</p></section>`;
  }
  function firstPeriodSubmissionBriefSection(data) {
    const items=normalizeBriefCandidates(data.briefCandidates||newsroomState.briefCandidates).map(id=>eventById(id)).filter(Boolean);
    return `<section class="fp-submit-briefs"><header><span>S CITY NEWS BRIEFS</span><h2>今日简讯候选</h2><p>这些新闻来自第一课时选题池，不替代四篇主体作品；第二课时将在这里继续写成3—6条“S城简讯”。</p></header><div>${items.map((event,index)=>`<article><span>简讯候选 ${index+1}</span><h3>${html(event.title)}</h3><p>${html(data.briefFacts?.[event.id]||finalBriefDraftFor(event.id).body||event.content)}</p><small>${event.publishTime}｜${html(event.source)}｜${verificationLabel(event.verificationStatus)}</small></article>`).join("")||"<p>尚未选择简讯候选。</p>"}</div></section>`;
  }
  function renderDeadline() { app.innerHTML=`<section class="scene transition-scene deadline-scene"><span>17:00 · EDITION CLOSE</span><time>${termInfo("DEADLINE","截稿是课堂流程节点，不会锁定已填写内容。")}</time><h1>新闻日阶段记录。</h1>${taskHint("确认进入17:00截稿单。之后仍可返回地图、编辑会和写作台继续修改。","")}<p>接下来完成第一课时阶段成果，<br>用截稿单记录你们17:00时的编辑判断。</p><div>${newsroomState.discoveredEvents.length}<small>已获得线索</small></div><button class="primary-action" data-action="first-period-deadline">完成第一课时截稿单 →</button></section>`; }
  function renderFirstPeriodDeadline() {
    const data=newsroomState.firstPeriodSubmission;
    app.innerHTML=`${masthead()}<main class="scene first-period-scene"><header class="first-period-header"><span>第一课时阶段成果</span><strong>本页需截图提交 · 将计入第一课时评分</strong><h1>17:00｜编辑部截稿单</h1><p>新闻日已经结束。现在，请用这张截稿单说明：你们为什么选择这些新闻，你们相信了什么，哪些信息仍然不能确认，什么新证据改变了你们的判断，以及下一课时还需要继续寻找什么。</p><b>FIRST PERIOD · EDITORIAL DEADLINE REPORT</b></header><form id="firstPeriodForm" class="first-period-form"><section class="fp-requirements"><h2>第一课时阶段成果提交要求</h2><ul><li>请认真完成本页所有必填内容。</li><li>不能只勾选新闻，必须写出选择理由和判断依据。</li><li>本页完成后将生成“第一课时截稿单提交版”。</li><li>请将提交版完整截图，提交给老师。</li><li>本页将纳入第一课时过程性评价。</li></ul><b>提交提醒：完成本页后，请点击“生成第一课时提交版”，并将生成页面完整截图提交给老师。</b></section><section class="fp-block"><header><span>01</span><h2>我们的编辑选择</h2><p>截至17:00，请从本组已经发现的新闻中选择3条继续追踪的新闻。每条都必须说明为什么值得继续追踪。</p></header><div class="fp-news-grid">${data.topStories.map((item,index)=>`<article class="fp-news-card"><span>NEWS ${String(index+1).padStart(2,"0")}</span><label>选择新闻 *<select name="top${index}Event">${eventOptionList(item.eventId)}</select></label>${firstPeriodEventMini(item.eventId)}<fieldset><legend>新闻价值 NEWS VALUE *</legend>${FIRST_PERIOD_NEWS_VALUES.map(([id,label,desc])=>`<label><input type="checkbox" name="top${index}Values" value="${id}" ${item.newsValues.includes(id)?"checked":""}><b>${label}</b><small>${desc}</small></label>`).join("")}</fieldset><label>为什么选择继续追踪这条新闻？*<textarea name="top${index}ValueReason" maxlength="180" placeholder="例如：它涉及第三中学停课问题，对学生和家长都有直接影响，具有明显的重要性和接近性。我们接下来想弄清楚停课范围和恢复时间。">${html(item.valueReason)}</textarea></label>${firstPeriodReasonGuide()}<fieldset class="fp-radio"><legend>真实性与核实 VERIFICATION *</legend>${FIRST_PERIOD_VERIFICATIONS.map(([id,label])=>`<label><input type="radio" name="top${index}Verification" value="${id}" ${item.verificationDecision===id?"checked":""}>${label}</label>`).join("")}</fieldset><label>我们这样判断的依据是什么？*<textarea name="top${index}VerificationReason" maxlength="120" placeholder="说明信息来自谁、是否有第二来源、现场或官方回应。">${html(item.verificationReason)}</textarea></label></article>`).join("")}</div><div class="fp-headline-choice"><label>从上述3条中选择当前头条候选 *<select name="headlineEventId">${firstPeriodHeadlineOptions(data)}</select></label><p>头条候选不是“最热闹”的新闻，而是你们认为最需要优先报道、最能体现公共价值的一条。</p></div></section><section class="fp-block"><header><span>02</span><h2>证据怎样改变了我们的判断？</h2><p>EVIDENCE CHANGED OUR MIND</p></header><div class="fp-change-grid"><label>上午 / 较早时，我们原本认为……<textarea name="changeBefore" maxlength="100">${html(data.judgementChange.before)}</textarea></label><div class="fp-evidence-pick"><b>后来出现的新证据是……</b>${evidenceOptionList(data.judgementChange.evidenceIds)}</div><label>这条证据为什么重要？<textarea name="changeEvidenceReason" maxlength="100">${html(data.judgementChange.evidenceReason)}</textarea></label><label>所以17:00时，我们现在认为……<textarea name="changeAfter" maxlength="100">${html(data.judgementChange.after)}</textarea></label></div></section><section class="fp-block fp-two-col"><div><header><span>03</span><h2>截稿前，我们最后确认一次</h2></header><fieldset class="fp-checklist">${FIRST_PERIOD_CHECKS.map(([id,label])=>`<label><input type="checkbox" name="check-${id}" ${data.verificationChecklist[id]?"checked":""}>${label}</label>`).join("")}</fieldset><label>目前最不能确定的一件事是什么？*<textarea name="biggestUncertainty" maxlength="100">${html(data.biggestUncertainty)}</textarea></label></div><div><header><span>04</span><h2>下一步采写计划</h2><p>NEXT REPORTING MOVE</p></header><label>下一课时，我们最想继续报道哪一件事？*<select name="nextStoryId">${nextReportingOptions(data.nextReporting.storyId)}</select></label><label>如果这篇报道只能回答一个问题，我们最想回答什么？*<textarea name="nextQuestion" maxlength="120" placeholder="例如：学校停课安排是否已经正式确认，以及还有哪些年级和活动会受到影响？">${html(data.nextReporting.question)}</textarea></label>${firstPeriodQuestionGuide()}<fieldset class="fp-needs"><legend>为了回答这个问题，我们还缺什么？*</legend>${FIRST_PERIOD_NEEDS.map(need=>`<label><input type="checkbox" name="nextNeeds" value="${need}" ${data.nextReporting.needs.includes(need)?"checked":""}>${need}</label>`).join("")}</fieldset><label>为什么需要这些材料？*<textarea name="nextReason" maxlength="120">${html(data.nextReporting.reason)}</textarea></label></div></section><section class="fp-block fp-boundary"><label>截至17:00，我们最确定的事实是：<textarea name="mostCertainFact" maxlength="80">${html(data.mostCertainFact)}</textarea></label><label>截至17:00，我们最需要继续核实的是：<textarea name="stillNeedsVerification" maxlength="80">${html(data.stillNeedsVerification)}</textarea></label></section><footer><div><b>第一课时过程性评价｜20分</b><span>生成后请完整截图，本页将用于第一课时评分。</span></div><button class="secondary-action" type="button" data-action="first-period-save-draft">保存草稿</button><button class="primary-action" type="submit">生成第一课时提交版 →</button></footer></form></main>`;
  }
  const renderFirstPeriodDeadlineBase=renderFirstPeriodDeadline;
  renderFirstPeriodDeadline=function() {
    renderFirstPeriodDeadlineBase();
    $("#firstPeriodForm .fp-boundary")?.insertAdjacentHTML("beforebegin",firstPeriodBriefCandidateSection(newsroomState.firstPeriodSubmission));
  };
  function renderFirstPeriodSubmission() {
    const data=newsroomState.firstPeriodSubmission, profile=newsroomState.newsroomProfile;
    const members=newsroomMemberNames(" / ");
    const valueLabels=ids=>ids.map(id=>FIRST_PERIOD_NEWS_VALUES.find(item=>item[0]===id)?.[1]||id).join(" · ")||"未填写";
    const verificationText=id=>FIRST_PERIOD_VERIFICATIONS.find(item=>item[0]===id)?.[1]||"未填写";
    const evidenceTitles=data.judgementChange.evidenceIds.map(id=>eventById(id)).filter(Boolean).map(event=>`${event.publishTime}｜${event.title}`);
    const headlineEvent=eventById(data.headlineEventId);
    app.innerHTML=`${masthead()}<main class="scene first-period-submission"><section class="fp-submit-paper"><header><div><span>S城新闻沙盘</span><h1>第一课时阶段成果（请截图提交）</h1><p>FIRST PERIOD RESULT · ${SIMULATION.date} · 17:00 DEADLINE</p></div><aside><b>${html(profile.name||"未命名编辑部")}</b><small>成员：${html(members||"未填写")}</small></aside></header><div class="fp-submit-alert">请将本页完整截图提交给老师｜本页用于第一课时过程性评价</div><section class="pitch-process-summary"><h2>今日选题过程</h2><p>本组共发现 <b>${newsroomState.discoveredEvents.length}</b> 条｜曾进入选题池 <b>${pitchPoolItems().length}</b> 条｜最终重点追踪 <b>${data.topStories.filter(item=>item.eventId).length}</b> 条</p><small>已发现线索、选题池、最终重点追踪是三个不同层级：先发现，再比较，再确定重点。</small></section><section class="fp-submit-summary"><article><span>当前头条候选</span><h2>${html(headlineEvent?.title||"未选择")}</h2><p>${headlineEvent?`${headlineEvent.publishTime} · ${html(locationById(headlineEvent.location)?.name||headlineEvent.region||"")}`:"—"}</p></article><article><span>我们现在最想弄清楚的问题</span><h2>${html(data.nextReporting.question||"未填写")}</h2><p>请检查这个问题是否具体指向“谁受影响、哪些事实还不明确、下一步需要什么证据”。</p></article></section><section class="fp-submit-news">${data.topStories.map((item,index)=>{const event=eventById(item.eventId);const isHeadline=item.eventId&&item.eventId===data.headlineEventId;return `<article class="${isHeadline?"is-headline":""}"><span>NEWS ${String(index+1).padStart(2,"0")}${isHeadline?` · 头条候选`:""}</span><h2>${html(event?.title||"未选择新闻")}</h2><time>${event?`${event.publishTime} · ${html(locationById(event.location)?.name||event.region||"")}`:"—"}</time><p><b>新闻价值：</b>${html(valueLabels(item.newsValues))}</p><p><b>继续追踪理由：</b>${html(item.valueReason||"未填写选择理由")}</p><p><b>真实性：</b>${html(verificationText(item.verificationDecision))}</p><p><b>核实依据：</b>${html(item.verificationReason||"未填写核实依据")}</p></article>`;}).join("")}</section><section class="fp-submit-grid"><article><span>02 · EVIDENCE CHANGED OUR MIND</span><h2>证据怎样改变判断</h2><ol><li><b>原判断</b><p>${html(data.judgementChange.before||"未填写")}</p></li><li><b>新证据</b><p>${html(evidenceTitles.join("；")||"未选择")}</p><small>${html(data.judgementChange.evidenceReason||"未填写证据说明")}</small></li><li><b>新判断</b><p>${html(data.judgementChange.after||"未填写")}</p></li></ol></article><article><span>03 · VERIFICATION CHECK</span><h2>截稿真实性检查</h2><ul>${FIRST_PERIOD_CHECKS.filter(([id])=>data.verificationChecklist[id]).map(([,label])=>`<li>${html(label)}</li>`).join("")||"<li>未勾选</li>"}</ul><p><b>最不能确定：</b>${html(data.biggestUncertainty||"未填写")}</p></article><article><span>04 · NEXT REPORTING MOVE</span><h2>下一步采写</h2><p><b>报道对象：</b>${html(firstPeriodSelectedItem(data.nextReporting.storyId)||"未选择")}</p><p><b>还要补充：</b>${html(data.nextReporting.needs.join(" / ")||"未填写")}</p><p><b>补充理由：</b>${html(data.nextReporting.reason||"未填写材料理由")}</p></article><article><span>FACT BOUNDARY</span><h2>事实边界</h2><p><b>最确定的事实：</b>${html(data.mostCertainFact||"未填写")}</p><p><b>最需要继续核实：</b>${html(data.stillNeedsVerification||"未填写")}</p></article></section><section class="fp-score"><header><h2>第一课时过程性评价｜20分</h2><p>请将本页完整截图提交。以下分数由老师根据截图人工填写，系统不自动评分。</p></header><div><span>新闻价值判断</span><b>____ / 5</b><small>是否能够说明为什么一条信息值得成为新闻，而不是只凭个人喜好选题。</small></div><div><span>真实性与核实意识</span><b>____ / 5</b><small>是否能够区分事实、传言、单一来源和已核实信息，并说明判断依据。</small></div><div><span>根据证据修正判断</span><b>____ / 5</b><small>是否能够指出新证据，并清楚说明它怎样改变或强化原来的判断。</small></div><div><span>编辑决策与采写计划</span><b>____ / 5</b><small>是否能够提出清楚的下一步报道问题，并判断为了回答问题还需要什么材料。</small></div><footer><strong>总分</strong><b>____ / 20</b></footer></section><p class="fp-bottom-reminder">请将本页完整截图后提交给老师。</p><div class="fp-submit-actions"><button class="secondary-action" data-action="first-period-deadline">返回修改截稿单</button><button class="primary-action" data-action="reporting-intro">进入第二课时采写室 →</button></div></section></main>`;
  }


  const renderFirstPeriodSubmissionBase=renderFirstPeriodSubmission;
  renderFirstPeriodSubmission=function() {
    renderFirstPeriodSubmissionBase();
    $(".pitch-process-summary")?.insertAdjacentHTML("afterend",firstPeriodSubmissionBriefSection(newsroomState.firstPeriodSubmission));
  };

  function reportingHeader(title,description,stamp="REPORTING ROOM") {
    return `<header class="reporting-header"><div><span>S CITY DAILY · ${stamp}</span><h1>${title}</h1><p>${description}</p></div><div class="reporting-stamp"><b>${newsroomState.discoveredEvents.length} 条</b><span>本编辑部当日已发现线索</span></div></header>`;
  }
  function reportingRule() { return `<div class="reporting-rule"><b>REPORTING RULE</b><span>你可以选择、组织和转述事实，但不能创造事实。</span></div>`; }
  function reportingStoryCard(story) {
    const facts=storyEvents(story),channels=reportingMaterialChannels(story);
    return `<article class="story-file unlocked"><span>STORY FILE · ${html(story.id.toUpperCase())}</span><h3>${html(story.title)}</h3><p>本组已发现相关事实 ${facts.length} 条，涉及 ${new Set(facts.map(item=>item.location)).size} 个地点。</p><div class="story-directions"><small>可继续获取</small>${channels.map(item=>`<span>${html(item)}</span>`).join("")}</div><footer>${story.genres.map(genre=>`<i class="genre-chip">${html(reportingFamilyLabel(genre))}</i>`).join("")}<b class="story-state">已解锁</b></footer></article>`;
  }
  function reportingSourcePriorityPanel() {
    const focus=focusTrackIds().map(eventById).filter(Boolean);
    const pool=pitchPoolItems().filter(item=>!focus.some(event=>event.id===item.eventId));
    const briefs=briefCandidateItems();
    return `<section class="reporting-source-priority"><header><span>STORY SOURCE</span><h2>第二课时优先从这些选题出发</h2></header><div><article><b>第一课时重点新闻</b>${focus.map(event=>`<p>${html(event.title)}</p>`).join("")||"<p>尚未形成3条重点新闻。</p>"}</article><article><b>选题池中的其他新闻</b>${pool.slice(0,7).map(item=>`<p>${html(item.event.title)}<small>${html(valueLabels(item.newsValues)||"")}</small></p>`).join("")||"<p>没有其他选题池新闻。</p>"}</article><article><b>S城简讯候选</b>${briefs.map(event=>`<p>${html(event.title)}<small>${html(finalBriefDraftFor(event.id).body||event.source)}</small></p>`).join("")||"<p>尚未选择简讯候选。</p>"}</article></div></section>`;
  }
  function renderReportingIntro() {
    const unlocked=availableReportingStories();rememberUnlockedStories();saveState();
    app.innerHTML=`${masthead()}<main class="scene reporting-scene"><div class="reporting-wrap">${reportingHeader("S城采写室","新闻日已经结束。深度采写只从本编辑部实际发现过的故事出发；未发现的事件不会在这里补发。")}${taskHint("从第一课时重点新闻和选题池出发，选择报道对象，并补充真正需要的材料。","reportingIntro")}${reportingRule()}${reportingSourcePriorityPanel()}<section class="reporting-intro-copy"><article class="reporting-letter"><span class="reporting-kicker">EDITOR'S LETTER</span><h2>从线索走向作品</h2><p>今天的地图给了你们许多碎片。现在要重新打开采访本：确认事实过程、寻找人物、观察现场，并让不同观点彼此照面。</p><blockquote>四种文体不是四次改写。每一种写法，都需要重新决定材料怎样进入文章。</blockquote></article><aside class="reporting-note"><span class="reporting-kicker">WORKFLOW</span><h3>采写室工作顺序</h3><ol><li>优先从第一课时重点新闻和选题池中寻找作品对象。</li><li>两篇消息、特写、评论使用各自不同的材料组织方式。</li><li>完成写作计划，再进入文章编辑台。</li><li>提交前逐项完成事实核对声明。</li></ol></aside></section><section class="story-selector" style="margin-top:16px"><header><div><span class="reporting-kicker">UNLOCKED STORY FILES</span><h2>本组可进入深采的故事</h2></div><p>这里只列出已经满足解锁条件的故事，不对选题进行评分或推荐。</p></header><div class="story-grid">${unlocked.map(reportingStoryCard).join("")||`<div class="wire-empty"><b>尚无可进入深采的故事</b><span>请返回新闻日，通过地图发现并核实更多线索。</span></div>`}</div></section><div class="reporting-actions"><span class="progress-copy">已解锁 ${unlocked.length} 个深采故事</span><button class="primary-action" data-action="reporting-select" ${unlocked.length?"":"disabled"}>建立四篇作品计划 →</button></div></div></main>`;
  }
  const renderReportingIntroBase=renderReportingIntro;
  renderReportingIntro=function() {
    renderReportingIntroBase();
    $(".reporting-letter blockquote")?.insertAdjacentHTML("afterend",`<p class="brief-workflow-note">最终成果固定包含：消息一、消息二、新闻特写、新闻评论，以及3—6条“S城简讯”。简讯将在版面会议中从第一课时简讯候选里填写。</p>`);
    $(".reporting-note ol")?.insertAdjacentHTML("beforeend",`<li>四篇主体稿完成后，从简讯候选中写成3—6条S城简讯。</li>`);
  };
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
    const chosen=new Set(newsroomState.finalEdition?.newsBriefIds||newsroomState.editionBriefIds||newsroomState.briefCandidates||[]);
    const items=briefCandidateItems();
    return `<section class="edition-briefing edition-brief-writing"><header><div><span>NEWS BRIEFING</span><h2>S城简讯 3—6条</h2><p>简讯只能从第一课时选题池 / 简讯候选中选择。每条简讯只写一个已经确认的核心事实，不需要展开成完整消息。</p></div><strong id="editionBriefCount">已选 0 / 必须3—6</strong></header><div class="edition-brief-groups">${items.map(event=>{const draft=finalBriefDraftFor(event.id);return `<article class="brief-write-row" data-brief-card="${event.id}"><label class="edition-brief-row"><input type="checkbox" name="editionBrief" value="${event.id}" ${chosen.has(event.id)?"checked":""}><span><b><time>${event.publishTime}</time>${html(event.title)}</b><small>${html(event.source)} · ${verificationLabel(event.verificationStatus)}</small></span></label><div class="brief-write-fields"><label>标题<input name="briefTitle-${event.id}" maxlength="36" value="${html(draft.title||event.title)}" placeholder="简洁标题"></label><label>正文 30—80字<textarea name="briefBody-${event.id}" maxlength="100" placeholder="一条简讯只写一个已经确认的核心事实。">${html(draft.body||event.content||"")}</textarea></label><label>信息来源<input name="briefSource-${event.id}" maxlength="50" value="${html(draft.source||event.source||"")}" placeholder="例如：官方通报 / 记者采访"></label></div></article>`;}).join("")||`<div class="wire-empty"><b>还没有简讯候选</b><span>请回到第一课时截稿单，从选题池中选择3—6条今日简讯候选。</span></div>`}</div><p class="edition-brief-note">最终《S城日报》必须同时包含：2则消息 + 1篇特写 + 1篇评论 + 3—6条S城简讯。若某条新闻原本被放进“我们决定不报道”，选入简讯时会自动移出“不报道”。</p></section>`;
  }
  function syncEditionSelections(changedTarget=null) {
    const form=$("#editionForm");
    if(!form)return;
    const briefInputs=[...form.querySelectorAll('input[name="editionBrief"]')];
    const discardInputs=[...form.querySelectorAll('input[name="discard"]')];
    if(changedTarget?.name==="editionBrief"&&changedTarget.checked){
      const discard=discardInputs.find(input=>input.value===changedTarget.value);
      if(discard?.checked){discard.checked=false;toast("已将这条新闻从“我们决定不报道”中移出。");}
    }
    if(changedTarget?.name==="discard"&&changedTarget.checked){
      const brief=briefInputs.find(input=>input.value===changedTarget.value);
      if(brief?.checked){brief.checked=false;toast("已取消这条新闻的“S城简讯”选择。");}
    }
    const briefIds=new Set(briefInputs.filter(input=>input.checked).map(input=>input.value));
    discardInputs.forEach(input=>{if(briefIds.has(input.value))input.checked=false;});
    const finalBriefIds=new Set(briefInputs.filter(input=>input.checked).map(input=>input.value));
    briefInputs.forEach(input=>{input.disabled=false;input.closest(".edition-brief-row")?.classList.remove("unavailable");});
    discardInputs.forEach(input=>{input.disabled=false;input.closest(".discard-row")?.classList.remove("unavailable");});
    const counter=$("#editionBriefCount");
    if(counter){counter.textContent=`已选 ${finalBriefIds.size} / 必须3—6`;counter.classList.toggle("ready",finalBriefIds.size>=3&&finalBriefIds.size<=6);}
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
    const brief=finalBriefByEventId(event.id);
    return `<article class="published-brief-card ${compact?"compact":""}" data-published-event="${event.id}"><span>${html(place?.region||event.region||publishedSectionLabel(event))}</span><h3>${html(brief?.title||event.title)}</h3><p>${html(brief?.body||event.content)}</p><footer><time>${event.publishTime}</time><small>来源：${html(brief?.source||event.source)}</small></footer></article>`;
  }
  function renderPublishedSection(label,events,{compact=false}={}) {
    if(!events.length)return"";
    const sectionId=({"S城":"published-city","政务":"published-government","全国":"published-national","国际":"published-world"})[label]||"published-section";
    const title=label==="S城"?"S城简讯":label;
    return `<section class="published-section published-section-${label==="S城"?"city":label==="政务"?"government":"wire"}" id="${sectionId}"><header><span>${({"S城":"S CITY NEWS BRIEFS","政务":"GOVERNMENT","全国":"CHINA","国际":"WORLD"})[label]}</span><h2>${title}</h2><i>${events.length} STORIES</i></header><div class="published-section-grid">${events.map(event=>renderNewsBriefCard(event,compact)).join("")}</div></section>`;
  }
  function renderLeadPackage() {
    const newsroomLine=`本期编辑部：${html(newsroomState.newsroomProfile.name||"S城日报城市新闻部")}`;
    const memberLine=newsroomMemberNames("、");
    const related=getLeadRelatedEvents();
    if(isReportingEdition()){
      const edition=newsroomState.finalEdition,draft=leadReportingDraft(),meta=REPORTING_GENRES[edition.leadGenre];
      if(!draft)return `<section class="lead-package" id="published-lead"><article class="published-headline"><span>LEAD STORY</span><h2>头条作品正在修改中</h2><p>返回编辑版面或采写室保存作品后，最终日报会自动更新。</p></article></section>`;
      const story=reportingStory(draft.storyline);
      return `<section class="lead-package" id="published-lead"><article class="published-headline"><span>${meta.en} · ${meta.label} · LEAD STORY</span><h2>${html(draftDisplayTitle(newsroomState.finalEdition.leadGenre,draft))}</h2><h3>${html(story?.title||"")}</h3><div class="published-byline"><b>${newsroomLine}</b>${memberLine?`<b>成员：${html(memberLine)}</b>`:""}</div><p style="white-space:pre-line">${draft.body?html(draft.body):"（正文未填写）"}</p><footer>采写依据：新闻日已发现相关事实 ${storyEvents(draft.storyline).length} 条 · 深采材料 ${draft.selectedMaterialIds?.length||0} 份</footer></article>${related.length?`<aside class="related-progress"><header><span>RELATED UPDATES</span><h3>相关事实</h3></header><ol>${related.map(item=>`<li data-related-event="${item.id}"><time>${item.publishTime}</time><div><b>${html(item.title)}</b><small>${verificationLabel(item.verificationStatus)}</small></div></li>`).join("")}</ol></aside>`:""}</section>`;
    }
    const edition=newsroomState.finalEdition,event=eventById(edition.headline.eventId);
    return `<section class="lead-package" id="published-lead"><article class="published-headline"><span>${publishedSectionLabel(event)} · LEAD STORY</span><h2>${html(edition.headline.title)}</h2><h3>${html(edition.headline.lead)}</h3><div class="published-byline"><b>${newsroomLine}</b>${memberLine?`<b>成员：${html(memberLine)}</b>`:""}</div><p>${html(edition.headline.body)}</p><footer>信息来源：${html(edition.headline.source)}</footer></article>${related.length?`<aside class="related-progress"><header><span>RELATED UPDATES</span><h3>相关进展</h3></header><ol>${related.map(item=>`<li data-related-event="${item.id}"><time>${item.publishTime}</time><div><b>${html(item.title)}</b><small>${verificationLabel(item.verificationStatus)}</small></div></li>`).join("")}</ol></aside>`:""}</section>`;
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
    return `<div class="${className}">${members.map((member,index)=>`<article><span>成员 ${String(index+1).padStart(2,"0")}</span><b>${html(member.name)}</b></article>`).join("")}</div>`;
  }
  function renderCredits() {
    const profile=newsroomState.newsroomProfile;
    return `<section class="published-credits"><div><span>NEWSROOM CREDITS</span><h2>本期编辑部</h2><strong>${html(profile.name||"S城日报城市新闻部")}</strong></div>${renderNewsroomMembers("published-members")}<p>本期版面依据本编辑部在S城新闻沙盘中实际发现、采访和核实的信息制作。</p></section>`;
  }
  function renderPublished() {
    const profile=newsroomState.newsroomProfile;
    const briefEvents=getPublishedBriefEvents();
    const city=briefEvents;
    const government=[];
    const national=[];
    const world=[];
    const hasReporting=REPORTING_SLOT_KEYS.some(slot=>draftCompleted(newsroomState.reporting.drafts[slot]));
    const leadGenre=isReportingEdition()?newsroomState.finalEdition.leadGenre:null;
    const genreNav=hasReporting?Object.entries(REPORTING_GENRES).filter(([genre])=>draftCompleted(newsroomState.reporting.drafts[genre])&&genre!==leadGenre).map(([genre,meta])=>`<a href="#published-${genre}">${meta.label}</a>`).join(""):"";
    const sectionNav=[city.length?`<a href="#published-city">S城简讯</a>`:"",government.length?`<a href="#published-government">政务</a>`:"",newsroomState.discoveredLocations.some(id=>locationById(id)?.entryType==="market")?`<a href="#published-markets">财经</a>`:"",national.length?`<a href="#published-national">全国</a>`:"",world.length?`<a href="#published-world">国际</a>`:""].join("");
    const timeLine=`首次发布：${html(newsroomState.publishedAt||"")}${newsroomState.updatedAt?`　最后更新：${html(newsroomState.updatedAt)}`:""}`;
    app.innerHTML=`<main class="published-scene"><header class="newspaper-masthead"><div class="newspaper-mark">SC</div><div class="newspaper-name"><span>THE S CITY DAILY</span><h1>S城日报</h1><p>${SIMULATION.date} · ${SIMULATION.weekday} · 最终版</p></div><div class="newspaper-edition"><b>${html(profile.name||"S城日报城市新闻部")}</b><time>${timeLine}</time></div></header><nav class="newspaper-nav" aria-label="版面栏目"><a href="#published-lead">今日头条</a>${genreNav}${sectionNav}</nav><div class="published-editbar"><button class="secondary-action" data-action="edition">← 返回编辑版面</button></div>${renderLeadPackage()}${renderTopStories()}${renderReportingPublication()}${renderPublishedSection("S城",city)}${renderPublishedSection("政务",government,{compact:true})}${renderMarketSection([])}${renderPublishedSection("全国",national,{compact:true})}${renderPublishedSection("国际",world,{compact:true})}${renderCredits()}<footer class="published-footer"><p>《S城日报》· ${html(profile.name||"城市新闻部")}　${timeLine}</p><div><button class="print-action" data-action="print">打印 / 保存为PDF</button><button data-action="review">查看今日编辑部档案 →</button></div></footer></main>`;
  }
  function snapshotBlock(time,snapshot) { if(!snapshot)return `<section class="review-block"><time>${time}</time><div><span>编辑会议</span><h2>本次会议未提交</h2><p>教师导演模式跳过了这一场景，因此没有形成会议记录。</p></div></section>`;const changeText={yes:"有，改变了",no:"没有，反而让原判断更确定",uncertain:"目前还不能判断"}[snapshot.changed]||snapshot.changed;return `<section class="review-block"><time>${time}</time><div><span>编辑会议</span><h2>${eventById(snapshot.headline)?.title||"—"}</h2>${snapshot.morningTracks?.length?`<p><b>09:00：</b>${snapshot.morningTracks.map(id=>eventById(id)?.title).join("；")}</p>`:""}<p><b>${snapshot.morningTracks?.length?"13:00":"追踪"}：</b>${snapshot.tracks.map(id=>eventById(id)?.title).join("；")}</p>${snapshot.trackReasons?`<p><b>调整理由：</b>${snapshot.tracks.map(id=>snapshot.trackReasons[id]).filter(Boolean).join("；")||"未填写"}</p>`:""}${snapshot.question?`<p><b>核心问题：</b>${html(snapshot.question)}</p>`:""}${snapshot.changed?`<p><b>判断变化：</b>${html(changeText)}</p>`:""}${snapshot.evidence?.length?`<p><b>改变判断的证据：</b>${snapshot.evidence.map(id=>eventById(id)?.title).join("；")}</p>`:""}${snapshot.headlineReason?`<p><b>头条候选理由：</b>${html(snapshot.headlineReason)}</p>`:""}</div></section>`; }
  function firstPeriodReviewBlock() {
    const data=newsroomState.firstPeriodSubmission;
    const stories=data.topStories.map(item=>eventById(item.eventId)?.title).filter(Boolean);
    const evidence=data.judgementChange.evidenceIds.map(id=>eventById(id)?.title).filter(Boolean);
    const briefs=normalizeBriefCandidates(data.briefCandidates||newsroomState.briefCandidates).map(id=>eventById(id)?.title).filter(Boolean);
    return `<section class="review-block first-period-review-block"><time>D · 17:00</time><div><span>第一课时编辑部截稿单</span><h2>17:00｜阶段成果</h2><p><b>三条重点新闻：</b>${stories.join("；")||"未生成"}</p><p><b>今日简讯候选：</b>${briefs.join("；")||"未选择"}</p><p><b>证据怎样改变判断：</b>${html(data.judgementChange.before||"—")} → ${html(evidence.join("；")||"—")} → ${html(data.judgementChange.after||"—")}</p><p><b>最确定事实：</b>${html(data.mostCertainFact||"—")}</p><p><b>最需要核实：</b>${html(data.stillNeedsVerification||"—")}</p><p><b>下一步核心问题：</b>${html(data.nextReporting.question||"—")}</p></div></section>`;
  }
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
    app.innerHTML=`${masthead()}<main class="review-scene"><header><span>NEWSROOM ARCHIVE · ${SIMULATION.date}</span><h1>专题复盘 / 今日编辑部档案</h1><p>${html(profile.name||"S城日报城市新闻部")} · 回看一天中，证据如何改变判断，选择如何形成版面。</p></header>${renderFinalReflection()}<div class="review-timeline">${snapshotBlock("B · 09:00",newsroomState.meeting1Snapshot)}${snapshotBlock("C · 13:00",newsroomState.meeting2Snapshot)}${publicationDecisionBlock()}${firstPeriodReviewBlock()}<section class="review-block"><time>E</time><div><span>调查记录</span><h2>全天使用 ${newsroomState.investigationHistory.length} / 8 次采访机会</h2>${newsroomState.investigationHistory.map(h=>`<p>${h.time}　${html(h.action)} → ${html(eventById(h.eventId)?.title||"")}</p>`).join("")||"<p>未执行主动调查。</p>"}</div></section><section class="review-block"><time>F</time><div class="edition-review"><span>四篇作品计划与初稿</span><h2>消息一 / 消息二 / 特写 / 评论</h2><div class="authored-review">${Object.entries(REPORTING_GENRES).map(([genre,meta])=>{const draft=reporting.drafts[genre],story=reportingStory(reporting.selectedStories[genre]);return `<article><b>${meta.en} · ${meta.label}</b><p>${draftCompleted(draft)?html(draftDisplayTitle(genre,draft)):"未完成"}</p><small>${story?html(story.title):"未选择故事"} · 采用材料 ${draft?.selectedMaterialIds?.length||0} 份</small></article>`;}).join("")}</div></div></section><section class="review-block edition-choice-review"><time>G</time><div class="edition-review"><span>最终版面选择</span><h2>${html(profile.name||"S城日报城市新闻部")}</h2>${renderNewsroomMembers("review-newsroom-members")}<p>${editionSummary}</p><div class="authored-review">${authored}</div><div class="edition-review-summary"><strong>额外编入简讯：${getPublishedBriefEvents().length}条</strong>${Object.entries(categoryCounts).map(([label,count])=>`<span>${label} <b>${count}</b></span>`).join("")}</div></div></section><section class="review-block"><time>H</time><div><span>未刊发选择</span><h2>我们决定不报道</h2>${newsroomState.discardedStories.map(d=>`<p>${html(eventById(d.id)?.title||"")}｜${html(d.reason)}${d.note?`：${html(d.note)}`:""}</p>`).join("")||"<p>未记录不报道线索。</p>"}</div></section></div><section class="status-review"><span>EDITORIAL STATUS HISTORY</span><h2>线索判断变化</h2><div>${Object.entries(newsroomState.statusHistory).map(([id,history])=>`<article><h3>${html(eventById(id)?.title||"")}</h3><p>${history.map(h=>`${EDITORIAL_STATUS[h.status]?.symbol||""}${EDITORIAL_STATUS[h.status]?.label||h.status}`).join(" → ")}${isLeadEvent(id)?" → HEADLINE":""}</p></article>`).join("")}</div></section>${legacy}<footer><button class="secondary-action" data-action="published">返回最终版面</button><button class="danger-button" data-action="reset">重新开始新闻日</button></footer></main>`;
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
    document.body.classList.toggle("final-check-page",scene==="round3");
    if(scene==="cover")renderCover(); else if(scene==="briefing")renderBriefing(); else if(/^round/.test(scene))renderDesk(); else if(scene==="meeting1")renderMeeting(1); else if(scene==="meeting1Submission")renderMeeting1Submission(); else if(scene==="transition2")renderTransition(2); else if(scene==="meeting2")renderMeeting(2); else if(scene==="meeting2Submission")renderMeeting2Submission(); else if(scene==="publicationDecision"||scene==="midday")renderPublicationDecision(); else if(scene==="publicationSubmission")renderPublicationSubmission(); else if(scene==="bulletinVersion")renderBulletinVersion(); else if(scene==="transition3")renderTransition(3); else if(scene==="deadline")renderDeadline(); else if(scene==="firstPeriodDeadline")renderFirstPeriodDeadline(); else if(scene==="firstPeriodSubmission")renderFirstPeriodSubmission(); else if(scene==="reportingIntro")renderReportingIntro(); else if(scene==="reportingSelect")renderReportingSelect(); else if(scene==="reportingNews1"||scene==="reportingCommunication")renderMaterialWorkspace("news1"); else if(scene==="reportingNews2")renderMaterialWorkspace("news2"); else if(scene==="reportingFeature")renderMaterialWorkspace("feature"); else if(scene==="reportingCommentary")renderMaterialWorkspace("commentary"); else if(scene==="writingNews1"||scene==="writingNews")renderWriting("news1"); else if(scene==="writingNews2")renderWriting("news2"); else if(scene==="writingCommunication")renderWriting("news1"); else if(scene==="writingFeature")renderWriting("feature"); else if(scene==="writingCommentary")renderWriting("commentary"); else if(scene==="edition")renderEdition(); else if(scene==="published")renderPublished(); else if(scene==="review"){renderReview();appendDeskReview();appendReportingReview();} else {newsroomState.currentScene="cover";saveState();renderCover();}
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
    newsroomState.currentDesk=desk;
    newsroomState.deskOpenCounts[desk]=(newsroomState.deskOpenCounts[desk]||0)+1;
    let found=0;
    EVENTS.filter(event=>event.desk===desk&&event.round<=deskRound()&&event.accessType==="desk_discovery"&&prerequisitesMet(event)).forEach(event=>{if(discover(event.id,"desk_discovery"))found++;});
    saveState();renderDesk({preserveScroll:true});if(found)toast(`主动查看Desk，获得 ${found} 条背景线索`);
  }

  function handleMapClick(locationId) {
    const location=locationById(locationId);
    newsroomState.selectedLocation=locationId; newsroomState.selectedEvent=null;
    if(!newsroomState.discoveredLocations.includes(locationId))newsroomState.discoveredLocations.push(locationId);
    const deskByEntry={government:"government",market:"markets",wire:"national_world"};
    newsroomState.currentDesk=deskByEntry[location?.entryType]||"city";
    newsroomState.deskOpenCounts[newsroomState.currentDesk]=(newsroomState.deskOpenCounts[newsroomState.currentDesk]||0)+1;
    let found=0;
    EVENTS.filter(event=>event.location===locationId&&event.round<=deskRound()&&event.accessType!=="investigation"&&!isDiscovered(event.id)).forEach(event=>{if(prerequisitesMet(event)&&discover(event.id,event.acquisition||"地点查询"))found++;});
    saveState(); renderDesk({preserveScroll:true}); toast(found?`在${location?.name}发现 ${found} 条新线索`:`${location?.name}当前没有未读更新`);
  }
  function investigate(id) {
    const event=eventById(id);
    if(isDiscovered(id)||!prerequisitesMet(event))return;
    if(newsroomState.remainingInvestigations<event.cost){toast("采访机会不足");return;}
    newsroomState.remainingInvestigations-=event.cost; discover(id,event.acquisition||"记者采访");
    newsroomState.investigationHistory.push({eventId:id,action:event.actionLabel,time:SIMULATION.rounds[deskRound()].time,round:deskRound()});
    newsroomState.selectedEvent=id; newsroomState.selectedLocation=event.location; newsroomState.currentDesk=event.desk; newsroomState.wireTab="discovered"; saveState(); renderDesk({preserveScroll:true}); toast(`调查完成：线索已进入左栏，剩余 ${newsroomState.remainingInvestigations} 次采访机会`);
  }
  function changeEditorial(id,status) { newsroomState.editorialStatuses[id]=status; const history=newsroomState.statusHistory[id]||[]; if(history.at(-1)?.status!==status)history.push({time:SIMULATION.rounds[deskRound()].time,status}); newsroomState.statusHistory[id]=history; saveState(); renderDesk({preserveScroll:true}); }
  function savePitchDecision(id,{add=false,remove=false,skip=false,fromModal=false}={}) {
    const event=eventById(id); if(!event)return;
    if(!add&&!remove&&!skip&&!fromModal){toast("已暂不加入选题池");return;}
    const values=fromModal
      ? [...document.querySelectorAll('input[name="modalPitchValue"]:checked')].map(input=>input.value)
      : [...document.querySelectorAll("input:checked")].filter(input=>input.name===`pitchValue-${id}`).map(input=>input.value);
    const verification=fromModal
      ? document.querySelector('input[name="modalPitchVerify"]:checked')?.value||""
      : [...document.querySelectorAll("input:checked")].find(input=>input.name===`pitchVerify-${id}`)?.value||"";
    const decision=fromModal ? document.querySelector('input[name="modalPitchDecision"]:checked')?.value||"" : (skip?"skip":"join");
    const existing=pitchEntry(id);
    if(remove){
      newsroomState.pitchPool=newsroomState.pitchPool.filter(item=>item.eventId!==id);
      newsroomState.briefCandidates=normalizeBriefCandidates(newsroomState.briefCandidates).filter(candidateId=>candidateId!==id);
      if(newsroomState.pitchDecisions?.[id])newsroomState.pitchDecisions[id]={...newsroomState.pitchDecisions[id],pitchDecision:"skip"};
      saveState(); renderDesk({preserveScroll:true}); toast("已移出选题池"); return;
    }
    if(!values.length){toast("请先至少勾选一项新闻价值。");return;}
    if(!verification){toast("请先判断目前的信息状态。");return;}
    if(!decision){toast("请选择是否加入选题池。");return;}
    if(decision==="join"&&!existing&&pitchPoolItems().length>=PITCH_POOL_MAX){toast("选题池已满，请先移出一条新闻。");return;}
    newsroomState.pitchDecisions=newsroomState.pitchDecisions||{};
    newsroomState.pitchDecisions[id]={eventId:id,newsValues:values,verificationJudgment:verification,pitchDecision:decision,decidedAt:new Date().toISOString()};
    if(decision==="join"){
      const next={eventId:id,newsValues:values,verificationJudgment:verification,addedAt:existing?.addedAt||new Date().toISOString()};
      newsroomState.pitchPool=[...newsroomState.pitchPool.filter(item=>item.eventId!==id),next].slice(0,PITCH_POOL_MAX);
    }else{
      newsroomState.pitchPool=newsroomState.pitchPool.filter(item=>item.eventId!==id);
      newsroomState.briefCandidates=normalizeBriefCandidates(newsroomState.briefCandidates).filter(candidateId=>candidateId!==id);
    }
    newsroomState.pendingPitchEventId=null;
    saveState(); renderDesk({preserveScroll:true}); toast(decision==="join"?(existing?"选题池判断已更新":"已加入选题池"):"已记录：暂不加入选题池");
  }
  function openPitchModal(id) { newsroomState.pendingPitchEventId=id; renderDesk({preserveScroll:true}); }
  function toggleBriefCandidate(id) {
    if(!pitchEntry(id)){toast("简讯候选必须先加入选题池。");return;}
    const set=new Set(normalizeBriefCandidates(newsroomState.briefCandidates));
    if(set.has(id)){set.delete(id);toast("已取消简讯候选");}
    else {set.add(id);toast("已标记为简讯候选");}
    newsroomState.briefCandidates=[...set];
    saveState();
    renderDesk({preserveScroll:true});
  }
  function updatePitchModalButton() {
    const button=$("[data-pitch-complete]"); if(!button)return;
    const hasValue=Boolean(document.querySelector('input[name="modalPitchValue"]:checked'));
    const hasVerify=Boolean(document.querySelector('input[name="modalPitchVerify"]:checked'));
    const hasDecision=Boolean(document.querySelector('input[name="modalPitchDecision"]:checked'));
    button.disabled=!(hasValue&&hasVerify&&hasDecision);
  }
  function saveFinalCheckInput(target) {
    const statusMatch=target.name?.match(/^finalCheckStatus-(.+)$/);
    const id=statusMatch?.[1]||target.dataset.finalCheckReason;
    if(!id)return false;
    newsroomState.finalCheck=newsroomState.finalCheck||{};
    const current=finalCheckData(id);
    newsroomState.finalCheck[id]={...current};
    if(statusMatch)newsroomState.finalCheck[id].status=target.value;
    if(target.dataset.finalCheckReason)newsroomState.finalCheck[id].reason=target.value.trim();
    saveState();
    return true;
  }
  function submitMeeting(form,round) {
    const previous=round===1?newsroomState.meeting1Snapshot:newsroomState.meeting2Snapshot;
    let rawTracks=round===2
      ? [...form.querySelectorAll('select[name^="middayTrack"]')].map(select=>select.value).filter(Boolean)
      : [...form.querySelectorAll('input[name="tracks"]:checked')].map(i=>i.value);
    rawTracks=[...new Set(rawTracks)];
    let tracks=rawTracks.slice(0,3);
    const headline=form.elements.headline?.value||tracks[0]||null;
    const revision=(previous?.revision||1)+(previous?1:0);
    if(round===1){
      const trackReasons=Object.fromEntries(tracks.map(id=>[id,form.elements[`trackReason-${id}`]?.value.trim()||""]));
      const data={...(previous||{}),tracks:rawTracks,headline,trackReasons,trackReasonList:rawTracks.map(id=>trackReasons[id]||""),headlineReason:form.elements.headlineReason?.value.trim()||"",question:form.elements.question?.value.trim()||"",verifyMethods:[...form.querySelectorAll('input[name="verifyMethod"]:checked')].map(input=>input.value),desiredEvidence:form.elements.desiredEvidence?.value.trim()||"",submittedAt:previous?.submittedAt||"09:00",revision,updatedAt:new Date().toISOString()};
      const errors=morningMeetingErrors(data);
      if(errors.length){toast(errors[0]);return;}
      data.tracks=rawTracks.slice(0,3);
      data.trackReasonList=data.tracks.map(id=>trackReasons[id]||"");
      newsroomState.meeting1Snapshot=data;saveState();go("meeting1Submission");
    }
    else {
      const changed=form.elements.changed?.value||"uncertain";
      const evidence=[...form.querySelectorAll('input[name="evidence"]:checked')].map(i=>i.value).slice(0,3);
      const trackReasonList=[0,1,2].map(index=>form.elements[`middayReason${index}`]?.value.trim()||"");
      const trackReasons=Object.fromEntries(tracks.map((id,index)=>[id,trackReasonList[index]||""]));
      const data={...(previous||{}),tracks,headline,changed,evidence,reason:form.elements.reason?.value.trim()||"",trackReasons,trackReasonList,headlineReason:form.elements.headlineReason?.value.trim()||"",question:form.elements.question?.value.trim()||"",morningTracks:[...(newsroomState.meeting1Snapshot?.tracks||[])],morningHeadline:newsroomState.meeting1Snapshot?.headline||null,submittedAt:previous?.submittedAt||"13:00",revision,updatedAt:new Date().toISOString()};
      newsroomState.meeting2Snapshot=data;saveState();
      const errors=middayMeetingErrors(data);
      if(errors.length){toast(errors[0]);return;}
      go("meeting2Submission");
    }
  }
  function submitPublicationDecision(form) {
    const previous=newsroomState.publicationDecision||{};
    const data={
      ...previous,
      eventId:form.elements.eventId?.value||null,
      decision:form.elements.decision?.value||null,
      reasons:[...form.querySelectorAll('input[name="reason"]:checked')].map(input=>input.value),
      note:form.elements.note?.value.trim()||"",
      savedAt:previous.savedAt||new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };
    newsroomState.publicationDecision=data;saveState();
    const errors=publicationDecisionErrors(data);
    if(errors.length){toast(errors[0]);return;}
    go("publicationSubmission");
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
  function readFirstPeriodForm(form) {
    const topStories=[0,1,2].map(index=>({
      eventId:form.elements[`top${index}Event`]?.value||"",
      newsValues:[...form.querySelectorAll(`input[name="top${index}Values"]:checked`)].map(input=>input.value),
      valueReason:form.elements[`top${index}ValueReason`]?.value.trim()||"",
      verificationDecision:form.elements[`top${index}Verification`]?.value||"",
      verificationReason:form.elements[`top${index}VerificationReason`]?.value.trim()||""
    }));
    const briefCandidates=[...form.querySelectorAll('input[name="briefCandidate"]:checked')].map(input=>input.value).slice(0,6);
    const briefFacts=Object.fromEntries([...form.querySelectorAll('textarea[name^="briefFact-"]')].map(textarea=>[textarea.name.replace("briefFact-",""),textarea.value.trim()]));
    return {
      ...newsroomState.firstPeriodSubmission,
      topStories,
      headlineEventId:form.elements.headlineEventId?.value||"",
      briefCandidates,
      briefFacts,
      judgementChange:{
        before:form.elements.changeBefore?.value.trim()||"",
        evidenceIds:[...form.querySelectorAll('input[name="changeEvidence"]:checked')].map(input=>input.value).slice(0,3),
        evidenceReason:form.elements.changeEvidenceReason?.value.trim()||"",
        after:form.elements.changeAfter?.value.trim()||""
      },
      verificationChecklist:Object.fromEntries(FIRST_PERIOD_CHECKS.map(([id])=>[id,Boolean(form.elements[`check-${id}`]?.checked)])),
      biggestUncertainty:form.elements.biggestUncertainty?.value.trim()||"",
      nextReporting:{
        storyId:form.elements.nextStoryId?.value||"",
        question:form.elements.nextQuestion?.value.trim()||"",
        needs:[...form.querySelectorAll('input[name="nextNeeds"]:checked')].map(input=>input.value),
        reason:form.elements.nextReason?.value.trim()||""
      },
      mostCertainFact:form.elements.mostCertainFact?.value.trim()||"",
      stillNeedsVerification:form.elements.stillNeedsVerification?.value.trim()||""
    };
  }
  function firstPeriodValidationErrors(data) {
    const errors=[];
    const selected=data.topStories.map(item=>item.eventId).filter(Boolean);
    if(selected.length!==3||new Set(selected).size!==3)errors.push("请先选满3条不同的继续追踪线索。");
    data.topStories.forEach((item,index)=>{
      const label=`已选新闻${index+1}`;
      if(!item.eventId)return;
      if(!item.valueReason)errors.push(`请补充“${label}”的选择理由。`);
      else if(item.valueReason.replace(/\s/g,"").length<20)errors.push(`${label}：理由过于简单，请写清楚新闻涉及对象、新闻价值或你们想继续追踪的原因。`);
      if(!item.newsValues.length)errors.push(`请为“${label}”勾选至少一项新闻价值。`);
      if(!item.verificationDecision)errors.push(`请为“${label}”选择真实性与核实判断。`);
      if(!item.verificationReason)errors.push(`请补充“${label}”的核实判断依据。`);
    });
    if(data.headlineEventId&&!selected.includes(data.headlineEventId))errors.push("当前头条候选必须从已选的3条新闻中产生。");
    if(!data.biggestUncertainty)errors.push("请填写“我们目前最不能确定的地方”。");
    if(!data.nextReporting.storyId)errors.push("请选择下一课时最想继续报道的一件事。");
    if(!data.nextReporting.question)errors.push("请填写“我们现在最想弄清楚的问题”。");
    else if(data.nextReporting.question.replace(/\s/g,"").length<12)errors.push("“我们现在最想弄清楚的问题”过于简单，请把问题写具体。");
    if(!data.nextReporting.needs.length)errors.push("请勾选接下来还需要补充什么信息。");
    if(!data.nextReporting.reason)errors.push("请填写为什么需要这些补充材料。");
    const focusIds=new Set(selected);
    const briefIds=normalizeBriefCandidates(data.briefCandidates||[]);
    if(briefIds.length<3||briefIds.length>6)errors.push("请从选题池中选择3—6条今日简讯候选。");
    briefIds.forEach((id,index)=>{
      if(focusIds.has(id))errors.push("今日简讯候选不能与3条重点追踪新闻重复。");
      const fact=(data.briefFacts?.[id]||"").trim();
      if(!fact)errors.push(`请填写第${index+1}条简讯候选的核心事实。`);
      else if(fact.replace(/\s/g,"").length<12)errors.push(`第${index+1}条简讯候选的核心事实过于简单，请写清一个已确认事实。`);
    });
    return errors;
  }
  function submitFirstPeriod(form) {
    const data=readFirstPeriodForm(form);
    newsroomState.firstPeriodSubmission=data;
    applyBriefCandidateDrafts(data.briefCandidates,data.briefFacts);
    const errors=firstPeriodValidationErrors(data);
    if(errors.length){
      saveState();
      toast(errors[0]);
      return;
    }
    newsroomState.firstPeriodSubmission={...data,submittedAt:new Date().toISOString()};
    saveState();go("firstPeriodSubmission");
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
      return {name:memberName};
    });
    if(!name){toast("请填写编辑部名称");return;}
    if(members.slice(0,3).some(member=>!member.name)){toast("请至少填写3名小组成员");return;}
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
    const allowedBriefIds=new Set(briefCandidateItems().map(event=>event.id));
    if(newsBriefIds.length<3||newsBriefIds.length>6){toast("请从简讯候选中选择3—6条S城简讯");return;}
    if(newsBriefIds.some(id=>!allowedBriefIds.has(id))){toast("今日简讯只能使用第一课时选题池 / 简讯候选");return;}
    if(newsBriefIds.some(id=>subjectDraftEventIds().has(id))){toast("简讯不能与四篇主体稿重复使用同一新闻");return;}
    const finalBriefs=newsBriefIds.map(id=>({
      eventId:id,
      title:form.elements[`briefTitle-${id}`]?.value.trim()||"",
      body:form.elements[`briefBody-${id}`]?.value.trim()||"",
      source:form.elements[`briefSource-${id}`]?.value.trim()||""
    }));
    for(const [index,item] of finalBriefs.entries()){
      if(!item.title){toast(`请填写第${index+1}条简讯标题`);return;}
      const count=wordCount(item.body);
      if(count<30||count>80){toast(`第${index+1}条简讯正文需要控制在30—80字`);return;}
      if(!item.source){toast(`请填写第${index+1}条简讯的信息来源`);return;}
    }
    const discards=[...form.querySelectorAll('input[name="discard"]:checked')].map(input=>({id:input.value,reason:form.elements[`reason-${input.value}`].value,note:form.elements[`note-${input.value}`].value.trim()}));
    if(discards.some(item=>newsBriefIds.includes(item.id))){toast("决定不报道的线索不能同时进入今日简讯");return;}
    newsroomState.editionBriefIds=[...newsBriefIds];
    newsroomState.finalBriefs=[...finalBriefs];
    const wasPublished=Boolean(newsroomState.finalEdition);
    newsroomState.finalEdition={...(newsroomState.finalEdition||{}),mode:"reporting",leadGenre,publishedDraftGenres:Object.keys(REPORTING_GENRES),newsBriefIds:[...newsBriefIds],finalBriefs:[...finalBriefs]};
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
    return draft;
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
    const pitchAdd=event.target.closest("[data-pitch-add]")?.dataset.pitchAdd;
    const pitchSkip=event.target.closest("[data-pitch-skip]")?.dataset.pitchSkip;
    const pitchRemove=event.target.closest("[data-pitch-remove]")?.dataset.pitchRemove;
    const pitchEdit=event.target.closest("[data-pitch-edit]")?.dataset.pitchEdit;
    const pitchComplete=event.target.closest("[data-pitch-complete]")?.dataset.pitchComplete;
    const briefCandidateToggle=event.target.closest("[data-brief-candidate-toggle]")?.dataset.briefCandidateToggle;
    const pitchOpen=event.target.closest("[data-pitch-open]");
    const pitchClose=event.target.closest("[data-pitch-close]");
    const reportingAction=event.target.closest("[data-reporting-action]");
    const openGenre=event.target.closest("[data-open-genre]")?.dataset.openGenre;
    const writeGenre=event.target.closest("[data-write-genre]")?.dataset.writeGenre;
    const saveDraftButton=event.target.closest("[data-save-draft]");
    const angleButton=event.target.closest("[data-angle-card]");
    const customAngleButton=event.target.closest("[data-save-custom-angle]");
    if(angleButton){const genre=angleButton.dataset.angleGenre;newsroomState.reporting.selectedAngles[genre]=angleButton.dataset.angleCard;saveState();renderMaterialWorkspace(genre);return;}
    if(customAngleButton){const genre=customAngleButton.dataset.saveCustomAngle;const textarea=$(`[data-custom-angle="${genre}"]`);newsroomState.reporting.selectedAngles[genre]="custom";newsroomState.reporting.customAngles[genre]=textarea?.value.trim()||"";saveState();renderMaterialWorkspace(genre);return;}
    if(action==="back"){goBack();return;} if(action==="print"){window.print();return;} if(resumeScene){go(resumeScene);return;} if(pitchComplete){savePitchDecision(pitchComplete,{fromModal:true});return;} if(pitchEdit){openPitchModal(pitchEdit);return;} if(briefCandidateToggle){toggleBriefCandidate(briefCandidateToggle);return;} if(pitchOpen){const panel=$("#pitchPoolPanel");if(panel)panel.hidden=false;return;} if(pitchClose){const panel=$("#pitchPoolPanel");if(panel)panel.hidden=true;return;} if(pitchAdd){savePitchDecision(pitchAdd,{add:true});return;} if(pitchSkip){savePitchDecision(pitchSkip,{remove:Boolean(pitchEntry(pitchSkip))});return;} if(pitchRemove){savePitchDecision(pitchRemove,{remove:true});return;} if(reportingAction){performReportingAction(reportingAction.dataset.reportingAction,reportingAction.dataset.reportingGenre);return;} if(openGenre){go(reportingSceneFor(openGenre,false));return;} if(writeGenre){go(reportingSceneFor(writeGenre,true));return;} if(saveDraftButton){const form=saveDraftButton.closest("form");if(form){saveWritingDraft(form);const oldText=saveDraftButton.textContent;saveDraftButton.textContent="已保存";setTimeout(()=>{saveDraftButton.textContent=oldText;},1200);}return;} if(desk){openDesk(desk);return;} if(wireFilter){newsroomState.wireFilter=wireFilter;saveState();renderDesk({preserveScroll:true});return;} if(wireTab){newsroomState.wireTab=wireTab;saveState();renderDesk({preserveScroll:true});return;} if(location&&!wire){handleMapClick(location);return;} if(statusButton){changeEditorial(statusButton.dataset.id,statusButton.dataset.status);return;} if(wire){const selected=eventById(wire.dataset.event);newsroomState.selectedLocation=wire.dataset.location;newsroomState.selectedEvent=wire.dataset.event;if(selected?.desk)newsroomState.currentDesk=selected.desk;if(!hasPitchDecision(wire.dataset.event))newsroomState.pendingPitchEventId=wire.dataset.event;saveState();renderDesk({preserveScroll:true});return;} if(investigation){investigate(investigation);return;}
    if(action==="enter-briefing")go("briefing"); if(action==="start-round1"){grantRound(1);go("round1");} if(action==="meeting1")go("meeting1"); if(action==="meeting2")go("meeting2"); if(action==="publication-decision")go("publicationDecision"); if(action==="transition3")go("transition3"); if(action==="enter-round"){const round=Number(event.target.closest("[data-round]").dataset.round);grantRound(round);go(`round${round}`);} if(action==="deadline"){attemptDeadline();} if(action==="first-period-deadline"){firstPeriodWarning=false;go("firstPeriodDeadline");} if(action==="first-period-save-draft"){const form=$("#firstPeriodForm");if(form){const draft=readFirstPeriodForm(form);newsroomState.firstPeriodSubmission=draft;applyBriefCandidateDrafts(draft.briefCandidates,draft.briefFacts);saveState();toast("截稿单草稿已保存");}} if(action==="first-period-warning-cancel"){firstPeriodWarning=false;renderFirstPeriodDeadline();appendBackButton();appendClearRecordsButton();} if(action==="first-period-force-submit"){const form=$("#firstPeriodForm");if(form)submitFirstPeriod(form);} if(action==="reporting-intro")go("reportingIntro"); if(action==="reporting-select")go("reportingSelect"); if(action==="reporting-complete"){if(!REPORTING_SLOT_KEYS.every(slot=>draftCompleted(newsroomState.reporting.drafts[slot]))){toast("请先完成四篇作品");return;}go(newsroomState.finalEdition?"published":"edition");} if(action==="edition")go("edition"); if(action==="bulletin-version")go("bulletinVersion"); if(action==="review")go("review"); if(action==="published")go("published"); if(action==="reset")resetDay();
  });
  app.addEventListener("change",event=>{if(event.target.closest(".pitch-modal"))updatePitchModalButton();if(saveFinalCheckInput(event.target))return;const firstPeriodForm=event.target.closest("#firstPeriodForm");if(firstPeriodForm&&/^top\dEvent$/.test(event.target.name)){newsroomState.firstPeriodSubmission=readFirstPeriodForm(firstPeriodForm);saveState();renderFirstPeriodDeadline();appendBackButton();appendClearRecordsButton();return;}if(event.target.name==="tracks"||/^middayTrack\d$/.test(event.target.name))updateHeadlineChoices();if(event.target.name==="headlineEvent"){const selected=eventById(event.target.value);const related=selected?knownEvents().filter(e=>e.storyline===selected.storyline):[];const sourceCount=independentSourceCount(related);const warning=$("#sourceWarning");if(warning)warning.textContent=sourceCount<2?"当前同方向信息仍主要来自单一来源，请继续核实。":`当前同方向信息涉及 ${sourceCount} 个不同来源；仍请判断这些来源是否真正独立。`;}if(["headlineEvent","brief1Event","brief2Event","editionBrief","discard"].includes(event.target.name))syncEditionSelections(event.target);const writingForm=event.target.closest("#writingForm");if(writingForm)queueWritingAutosave(writingForm);});
  app.addEventListener("input",event=>{if(saveFinalCheckInput(event.target))return;if(event.target.name==="headlineBody")event.target.parentElement.querySelector(".char-count").textContent=`${event.target.value.length} / 150—250`;const writingForm=event.target.closest("#writingForm");if(writingForm){if(event.target.name==="body")updateWritingCount(event.target.value,Number(writingForm.dataset.min),Number(writingForm.dataset.max));queueWritingAutosave(writingForm);}});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&$(".pitch-modal-backdrop")){event.preventDefault();event.stopPropagation();toast("请先完成本条新闻的编辑初判");}});
  app.addEventListener("submit",event=>{event.preventDefault();if(event.target.id==="profileForm")submitProfile(event.target);if(event.target.id==="meetingForm")submitMeeting(event.target,newsroomState.currentScene==="meeting1"?1:2);if(event.target.id==="publicationDecisionForm")submitPublicationDecision(event.target);if(event.target.id==="firstPeriodForm")submitFirstPeriod(event.target);if(event.target.id==="bulletinForm")submitBulletin(event.target);if(event.target.id==="bulletinVersionForm")submitBulletin(event.target,event.target.elements.type.value);if(event.target.id==="reportingSelectionForm")submitReportingSelection(event.target);if(event.target.id==="writingForm")submitWriting(event.target);if(event.target.id==="editionForm")submitEdition(event.target);if(event.target.id==="reflectionForm")submitFinalReflection(event.target);});

  function renderTeacherActions(){const box=$("#teacherActions");if(!box||!TEACHER_MODE)return;box.innerHTML=[{label:"开始09:00",scene:"round1",round:1},{label:"进入09:00编辑会",scene:"meeting1",round:1},{label:"推进至13:00",scene:"round2",round:2},{label:"进入13:00编辑会",scene:"meeting2",round:2},{label:"13:00发布判断",scene:"publicationDecision",round:2},{label:"推进至17:00",scene:"round3",round:3},{label:"进入DEADLINE",scene:"deadline",round:3},{label:"第一课时截稿单",scene:"firstPeriodDeadline"},{label:"进入采写室",scene:"reportingIntro"}].map(item=>`<button data-teacher-scene="${item.scene}" ${item.round?`data-round="${item.round}"`:""}>${item.label}</button>`).join("");}
  const teacherToggle=$("#teacherToggle"),teacherPanel=$("#teacherPanel"),teacherClose=$("#teacherClose"),resetButton=$("#resetDay"),teacherActions=$("#teacherActions");
  if(TEACHER_MODE){teacherToggle.hidden=false;teacherToggle.addEventListener("click",()=>teacherPanel.hidden=false);teacherClose.addEventListener("click",()=>teacherPanel.hidden=true);resetButton.addEventListener("click",resetDay);teacherActions.addEventListener("click",event=>{const button=event.target.closest("[data-teacher-scene]");if(!button)return;const scene=button.dataset.teacherScene;if(scene==="reportingIntro"&&!availableReportingStories().length){toast("当前编辑部没有足够的已发现故事可进入深采。");return;}if(button.dataset.round)grantRound(Number(button.dataset.round));go(scene);teacherPanel.hidden=true;});}else{teacherToggle.hidden=true;teacherPanel.hidden=true;}
  render();
})();
