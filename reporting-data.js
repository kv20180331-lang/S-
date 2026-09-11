/*
 * S CITY REPORTING ROOM
 * 深度采写素材与新闻日 EVENTS 分离维护。
 * quoteAllowed 为 true 的引语可原意引用；observations 只能据实转述，不得补写心理或因果。
 */

const REPORTING_GENRES = {
  news: { label: "消息", en: "TODAY'S NEWS", limit: "300—450字" },
  communication: { label: "通讯", en: "IN DEPTH", limit: "700—1000字" },
  feature: { label: "新闻特写", en: "SCENE", limit: "500—700字" },
  commentary: { label: "评论", en: "OPINION", limit: "600—800字" }
};

const REPORTING_STORIES = [
  {id:"elevator",title:"东城家园电梯停运",unlock:{any:["03"]},eventIds:["03","13","27"],genres:["communication","feature","commentary"],directions:["居民采访","物业与维保回应","背景资料","现场观察"]},
  {id:"school",title:"第三中学停课信息",unlock:{any:["05","16"]},eventIds:["05","16","18","29"],genres:["news","communication","feature","commentary"],directions:["师生与家长采访","校园规则","礼堂现场","不同观点"]},
  {id:"mountain",title:"山海景区游客转移",unlock:{any:["MT01","MT02"]},eventIds:["MT01","MT02"],genres:["news","communication","feature"],directions:["游客与救援人员采访","救援记录","线路资料","现场观察"]},
  {id:"port_rain",title:"暴雨中的深东港",unlock:{any:["P02"]},eventIds:["P02","P03"],genres:["communication","feature"],directions:["司机与调度采访","操作员采访","调度数据","港区现场"]},
  {id:"robot",title:"配送机器人测试",unlock:{any:["07"]},eventIds:["07","19","T03","G1","G2"],genres:["news","communication","commentary"],directions:["企业与工作人员采访","测试数据","政策资料","不同观点"]},
  {id:"rain",title:"S城强降雨",unlock:{storyline:"rain",minimum:3,minimumLocations:3},eventStoryline:"rain",genres:["news","communication","commentary"],directions:["气象与应急采访","跨地点时间线","城市运行资料","不同观点"]},
  {id:"metro_rain",title:"地铁B口积水",unlock:{any:["20"]},eventIds:["02","20","30"],genres:["news","feature"],directions:["现场笔记","人物跟随"]},
  {id:"celebrity",title:"明星现身传言",unlock:{any:["06"]},eventIds:["06","23"],genres:["news","commentary"],directions:["传播记录","转发者与现场采访","媒介观点"]},
  {id:"nightmarket",title:"老城夜市提前收摊",unlock:{any:["O02"]},eventIds:["O01","O02"],genres:["feature"],directions:["现场笔记","摊主采访"]},
  {id:"market_causality",title:"机器人产业链盘中上涨",unlock:{any:["H2"]},eventIds:["07","G1","G2","H2","H3"],genres:["news","commentary"],directions:["市场数据","市场人士采访","财经编辑观点","背景资料"]}
];

const material = (item) => ({
  type:"interview", title:item.actionLabel || "采写材料", actionLabel:"查看材料",
  unlock:null,
  source:{name:"未署名来源",identity:""}, sourceTag:"记者现场", summary:"",
  quotes:[], details:[], observations:[], genres:[], reliabilityTag:"可核实来源",
  quoteAllowed:true, warning:"只能使用卡片中明确提供的事实，不得补写未出现的细节。",
  autoGenres:[], featureFollow:false, factContribution:false, process:false,
  ...item
});

const REPORTING_MATERIALS = [
  /* 电梯 */
  material({id:"EL_INT_01",storyline:"elevator",actionLabel:"采访一名行动不便的居民",source:{name:"陈庆海",identity:"72岁，退休公交司机，东城家园6栋17楼居民"},sourceTag:"直接采访 · 当事人",summary:"膝关节手术后的复诊计划因电梯停运被迫推迟。",details:["三个月前接受膝关节手术。","每两周到第一人民医院复诊。","当天原定09:30复诊。","女儿当天在城西工作，无法立即赶来。","最终联系医院，把预约推迟到第二天。"],quotes:["我走到电梯口，两部都没亮。我一看就知道，今天这个楼我是下不去了。","年轻时候十七层我敢走，现在这条腿，下去了就不知道还能不能上来。","十七层，不是咬咬牙就能走下去的。"],genres:["communication","feature","commentary"],featureFollow:true,autoGenres:["commentary"],factContribution:true}),
  material({id:"EL_INT_02",storyline:"elevator",actionLabel:"采访另一户受影响居民",source:{name:"刘婧",identity:"34岁，东城家园14楼居民"},sourceTag:"直接采访 · 当事人",summary:"她原定送两岁女儿去托育中心，丈夫临时返回协助。",details:["原定08:30送两岁女儿到托育中心。","需要同时抱孩子和携带折叠婴儿车。","丈夫临时从单位返回帮助下楼。","比平时晚出门约50分钟。"],quotes:["我能走楼梯，可一只手抱孩子，一只手拎婴儿车，十四层怎么走？"],genres:["communication"]}),
  material({id:"EL_INT_03",storyline:"elevator",actionLabel:"联系小区物业",source:{name:"赵宏",identity:"东城家园物业项目经理"},sourceTag:"直接采访 · 涉事方",summary:"物业说明报修、到场和临时协助情况。",details:["06:47收到第一条报修信息。","07:18维保人员到场。","物业初步怀疑可能涉及同批次控制模块。","上午安排两名工作人员帮助有紧急需要居民联系家属或医院。","目前没有针对高层行动不便居民的专门转运预案。"],quotes:["我们6点47分收到第一条报修信息，7点18分维保人员到场。","上午安排工作人员协助有紧急需要的住户联系医院或家属，但没有针对高层行动不便居民的专门转运预案。"],genres:["communication","commentary"],autoGenres:["commentary"],factContribution:true,process:true,reliabilityTag:"利益相关方说法",warning:"涉事方说法。控制模块只是初步判断，不能写成最终故障原因。"}),
  material({id:"EL_INT_04",storyline:"elevator",actionLabel:"采访电梯维保工程师",source:{name:"何勇",identity:"电梯维保工程师"},sourceTag:"直接采访 · 工作人员",summary:"工程师说明排查步骤与现阶段结论边界。",details:["现场检查控制柜。","读取故障代码。","核对维保记录。","逐台复位。"],quotes:["四栋使用同批型号控制模块，只说明值得一起排查，不能证明四台设备是同一个故障原因。"],genres:["communication"]}),
  material({id:"EL_BG_01",storyline:"elevator",type:"background",title:"东城家园基础资料",actionLabel:"查阅东城家园基础资料",source:{name:"东城家园公开资料",identity:"社区基础资料"},sourceTag:"官方资料",summary:"小区楼龄、户数、电梯与老年人口背景。",details:["2011年交付。","涉事4栋约620户。","每栋2台电梯。","登记60岁以上居民约170人。","最近一次定期检验结果为“合格”。"],genres:["communication","commentary"],factContribution:true,warning:"检验合格不意味着设备未来不会故障。"}),
  material({id:"EL_BG_02",storyline:"elevator",type:"background",title:"监管部门调查进度",actionLabel:"联系市场监管部门",source:{name:"S城市场监管部门",identity:"监管部门回应"},sourceTag:"官方资料",summary:"监管部门正在核查维保记录与故障原因。",details:["正在核查维保记录。","正在核查故障原因。","尚未作出责任认定。"],genres:["communication","commentary"],factContribution:true,warning:"现有证据不支持“物业违规导致电梯故障”的表述。"}),
  material({id:"EL_FIELD_01",storyline:"elevator",type:"field_note",title:"17楼电梯门前",actionLabel:"调取记者现场笔记",source:{name:"本报记者",identity:"08:53—09:06，东城家园6栋17楼"},sourceTag:"记者现场",summary:"一张复诊预约单和一扇没有亮起的电梯门。",observations:["两扇银灰色电梯门紧闭。","门上贴着A4纸：“设备故障，暂停使用”。","陈庆海手里拿着折过两次的医院预约单。","他按了一次下行按钮，按钮没有亮。","他推开消防楼梯门，楼道声控灯亮起。","他向下看了约三秒，随后重新把门关上。","电梯井内传出维修人员敲击金属的声音。","楼下有人喊：“师傅，什么时候能好？”","陈庆海把预约单重新折好，塞入衬衣胸前口袋。","09:06，他拨通医院电话：“医生你好，我今天可能来不了了。”"],quotes:["十七层，不是咬咬牙就能走下去的。"],genres:["feature"],autoGenres:["feature"],quoteAllowed:true}),

  /* 第三中学 */
  material({id:"SCH_INT_01",storyline:"school",actionLabel:"采访八年级学生",source:{name:"林嘉",identity:"八年级学生"},sourceTag:"直接采访 · 当事人",summary:"她经历了午间传言和下午正式通知。",details:["看到截图后，她给母亲发送了一个“？”。"],quotes:["中午我们还在礼堂调机器人，有同学突然说‘停课了’，大家第一反应都是拿手机。","中午那个停课是假的，可现在真的停了。"],genres:["communication","feature"],featureFollow:true}),
  material({id:"SCH_INT_02",storyline:"school",actionLabel:"采访班主任",source:{name:"陈老师",identity:"八年级班主任"},sourceTag:"直接采访 · 工作人员",summary:"班主任解释为何不能依据截图自行宣布停课。",quotes:["当时学校没有收到停课通知，我不能因为一张截图告诉学生‘你们放学吧’。","我们特意强调的是‘截至目前’。"],genres:["communication","commentary"],factContribution:true}),
  material({id:"SCH_INT_03",storyline:"school",actionLabel:"采访学生家长",source:{name:"罗女士",identity:"第三中学学生家长"},sourceTag:"直接采访 · 当事人",summary:"家长关注的不只是快慢，还有下一条通知能否相信。",quotes:["截图一出来我已经准备跟公司请假了。","我不是生气，我是不知道下一条到底该信谁。","这次通知明确写了不用立即冒雨接，我反而没有马上开车。"],genres:["communication","commentary"],factContribution:true}),
  material({id:"SCH_INT_04",storyline:"school",actionLabel:"联系学校值班副校长",source:{name:"第三中学值班副校长",identity:"校方负责人"},sourceTag:"直接采访 · 涉事方",summary:"校方说明12:28澄清与16点后决定并不矛盾。",quotes:["12点28分那条澄清没有失效，它准确描述了12点28分的事实。","16点以后条件发生变化，决定自然也发生变化。"],genres:["communication","commentary"],factContribution:true,process:true,reliabilityTag:"涉事方说法"}),
  material({id:"SCH_BG_01",storyline:"school",type:"background",title:"极端天气校园信息规则",actionLabel:"查阅极端天气校园信息规则",source:{name:"S城教育部门",identity:"校园极端天气公开指引"},sourceTag:"官方资料",summary:"校园公告应标明当前时间和适用范围。",details:["学校根据当前有效预警和教育部门要求处理。","已经在校学生优先确保安全。","不要求家长在极端天气中立即冒险接回。","公告应注明当前时间和适用范围。"],genres:["communication","commentary"],factContribution:true}),
  material({id:"SCH_FIELD_01",storyline:"school",type:"field_note",title:"16:20，科技节停下来",actionLabel:"调取礼堂现场笔记",source:{name:"本报记者",identity:"16:20，第三中学礼堂"},sourceTag:"记者现场",summary:"红色预警抵达手机屏幕，科技节展品被装回纸箱。",observations:["一台学生自制气象仪仍在旋转，旁边贴着“风速实验组”。","十几部学生手机几乎同时亮起红色预警提示。","有人说：“真的红了。”","两名学生开始把机器人模型装入纸箱。","班主任逐个点名核对人数。","纸箱盖合上之前，机器人轮子还转了一下。","窗外雨声明显增大。","广播：“请各班学生留在原区域，等待学校统一安排。”"],quotes:["中午那个停课是假的，可现在真的停了。"],genres:["feature"],autoGenres:["feature"]}),
  material({id:"SCH_VIEW_01",storyline:"school",type:"viewpoint",title:"家长观点：宁愿先收到提醒",source:{name:"受访家长甲",identity:"学生家长"},sourceTag:"直接采访 · 当事人",summary:"倾向于尽早发布提醒。",quotes:["极端天气里，我宁愿先看到一个提醒，哪怕还没完全确认。"],genres:["commentary"],autoGenres:["commentary"]}),
  material({id:"SCH_VIEW_02",storyline:"school",type:"viewpoint",title:"另一位家长：错误信息也可能制造危险",source:{name:"受访家长乙",identity:"学生家长"},sourceTag:"直接采访 · 当事人",summary:"担忧未经确认的消息引发集中接送。",quotes:["如果大家看到未经确认的停课消息都开车去学校，可能反而制造危险。"],genres:["commentary"],autoGenres:["commentary"]}),
  material({id:"SCH_VIEW_03",storyline:"school",type:"viewpoint",title:"教师观点",actionLabel:"采访教师了解发布边界",source:{name:"受访教师",identity:"第三中学教师"},sourceTag:"直接采访 · 工作人员",summary:"更新信息不能靠猜测。",quotes:["信息可以更新，但不能先猜一个决定出来。"],genres:["commentary"]}),
  material({id:"SCH_VIEW_04",storyline:"school",type:"viewpoint",title:"传播研究者观点",actionLabel:"采访传播研究者",source:{name:"传播研究者",identity:"第三方研究者"},sourceTag:"第三方专家",summary:"关键是区分已确认与仍在核实的内容。",quotes:["真正的问题不是简单的快和准，而是能不能清楚区分：什么已经确认，什么仍在核实。"],genres:["commentary"],commentQuestion:"突发事件中，“尚未确认”的信息应不应该发布？"}),

  /* 山海景区 */
  material({id:"MT_INT_01",storyline:"mountain",actionLabel:"采访景区巡护员",source:{name:"景区巡护员",identity:"参与定位游客"},sourceTag:"直接采访 · 工作人员",summary:"救援从确认各组游客位置开始。",quotes:["第一件事不是冲上山，是先确认每一组游客在哪里。"],genres:["communication"]}),
  material({id:"MT_INT_02",storyline:"mountain",actionLabel:"采访救援员",source:{name:"林超",identity:"救援队员"},sourceTag:"直接采访 · 工作人员",summary:"湿滑石阶要求救援队控制速度。",quotes:["真正危险的是湿石阶，不是雨有多大。","越急越容易滑，我们一路都在喊慢一点。"],genres:["communication","feature"],featureFollow:true}),
  material({id:"MT_INT_03",storyline:"mountain",actionLabel:"采访一名游客",source:{name:"周怡",identity:"大学生游客"},sourceTag:"直接采访 · 当事人",summary:"能见度变化让游客意识到风险。",quotes:["最开始大家还觉得雨景很好看。","山下建筑慢慢看不清了，我才觉得有点不对。"],genres:["communication","feature"],featureFollow:true}),
  material({id:"MT_BG_01",storyline:"mountain",type:"background",title:"高处线路资料",actionLabel:"查阅高处线路资料",source:{name:"山海景区线路资料",identity:"公开导览与安全资料"},sourceTag:"官方资料",summary:"高处线路长4.8公里，雨天有湿滑与能见度风险。",details:["线路约4.8公里。","最高点约430米。","部分路段为天然石阶。","雨天主要风险为湿滑、能见度下降。"],genres:["communication"],factContribution:true}),
  material({id:"MT_TIME_01",storyline:"mountain",type:"background",title:"景区救援记录",actionLabel:"调取景区救援记录",source:{name:"山海景区救援记录",identity:"现场处置时间表"},sourceTag:"官方资料",summary:"从暂停售票到最后一批游客返回的完整时间线。",details:["12:52，暂停高处线路售票。","13:17，确认仍有37人在两条山径。","13:29，6名救援人员分两组出发。","14:06，第一批21人返回服务站。","14:28，最后16人返回。","无人受伤。"],genres:["communication"],factContribution:true,process:true}),
  material({id:"MT_FIELD_01",storyline:"mountain",type:"field_note",title:"14:28，最后一个人跨过门槛",actionLabel:"调取救援现场笔记",source:{name:"本报记者",identity:"14:28，山海景区服务站"},sourceTag:"记者现场",summary:"最后16名游客回到服务站的现场。",observations:["最后16名游客排成一列。","一名救援员在最滑石阶下方拉着辅助绳。","一双白色运动鞋已经变成泥黄色。","一名游客手中的纸质景区地图被雨泡软，边缘卷起。","服务站工作人员递出毛巾和热水。","救援员喊：“别看后面，看脚下！”","14:28，最后一名游客跨进服务站。","服务站门关闭以后，仍能听见门外雨水冲过排水沟的声音。"],genres:["feature"],autoGenres:["feature"]}),

  /* 深东港 */
  material({id:"PORT_INT_01",storyline:"port_rain",actionLabel:"采访一名集卡司机",source:{name:"黄志强",identity:"47岁，集卡司机"},sourceTag:"直接采访 · 当事人",summary:"港外排队影响后续预约。",quotes:["平时一趟四十多分钟，今天港外排了一个多小时。","我最怕的不是这一趟慢，是后面的预约全部一起乱。"],genres:["communication","feature"],featureFollow:true}),
  material({id:"PORT_INT_02",storyline:"port_rain",actionLabel:"采访港口调度员",source:{name:"吴静",identity:"31岁，港口调度员"},sourceTag:"直接采访 · 工作人员",summary:"设备停机后，调度仍需重排预约和泊位。",quotes:["机器停下来以后，调度不能停。","前面一个时段动不了，后面的预约、泊位、车辆全部要重新排。"],genres:["communication","feature"],featureFollow:true}),
  material({id:"PORT_INT_03",storyline:"port_rain",actionLabel:"采访岸桥操作员",source:{name:"岸桥操作员",identity:"深东港一线工作人员"},sourceTag:"直接采访 · 工作人员",summary:"是否停机取决于实时风速是否超过安全标准。",quotes:["不是下雨就一定停，真正盯的是风速。","驾驶室在几十米高处，超过安全标准就不能冒险。"],genres:["communication"]}),
  material({id:"PORT_DATA_01",storyline:"port_rain",type:"data",title:"港口调度统计",actionLabel:"获取港口调度统计",source:{name:"深东港调度中心",identity:"当日调度统计"},sourceTag:"数据资料",summary:"两泊位停作业，43辆预约集卡调时，15:16后恢复。",details:["2个泊位暂停高空吊装。","43辆预约集卡调整时段。","3批货物延后。","15:16后逐渐恢复。","当日无货物安全事故。"],genres:["communication"],factContribution:true,process:true}),
  material({id:"PORT_FIELD_01",storyline:"port_rain",type:"field_note",title:"11:02，吊具停在半空",actionLabel:"调取港区现场笔记",source:{name:"本报记者",identity:"11:02，深东港"},sourceTag:"记者现场",summary:"外面的机器安静下来，调度大厅里的电话反而更多。",observations:["一只空吊具停止移动，巨大的岸桥保持静止。","下面的集卡仍缓慢移动。","岸桥操作员从几十米高的驾驶室下来。","调度大厅内，两个原本绿色的泊位框变成黄色。","吴静拿起电话：“12点这一批先往后移。”","随后拿起另一部电话：“司机先别进闸，等新预约。”","核心观察：外面的机器安静下来，调度大厅里的电话反而更多了。"],genres:["feature"],autoGenres:["feature"]}),

  /* 配送机器人 */
  material({id:"ROB_INT_01",storyline:"robot",actionLabel:"采访星途科技产品经理",source:{name:"星途科技产品经理",identity:"产品发布涉事方"},sourceTag:"直接采访 · 涉事方",summary:"“服务全城”是长期目标，测试限制在附件中。",quotes:["‘服务全城’说的是长期目标，不意味着今天可以驶入所有公共道路。","具体测试范围写在新闻资料附件里。"],details:["记者追问：为什么发布会主页面没有强调测试限制？"],genres:["communication","commentary"],reliabilityTag:"利益相关方说法",factContribution:true,process:true}),
  material({id:"ROB_INT_02",storyline:"robot",actionLabel:"跟随一名机器人测试安全员",source:{name:"何嘉",identity:"机器人测试安全员"},sourceTag:"直接采访 · 工作人员",summary:"安全员每日跟随约20公里，并携带人工控制器。",details:["每日跟随机器人约20公里。","腰间携带手持人工控制器。"],quotes:["大家看它自己跑，会觉得完全没有人管，其实异常情况下必须人工接管。"],genres:["communication"],factContribution:true}),
  material({id:"ROB_INT_03",storyline:"robot",actionLabel:"采访一名配送骑手",source:{name:"张浩",identity:"配送骑手"},sourceTag:"直接采访 · 当事人",summary:"固定路线之外，门禁和临时地址才是配送难点。",quotes:["园区固定路线它有优势，但居民楼、电梯、门禁、临时改地址，这些才是城市配送真正麻烦的地方。"],genres:["communication"]}),
  material({id:"ROB_DATA_01",storyline:"robot",type:"data",title:"机器人测试运行数据",actionLabel:"获取测试运行数据",source:{name:"园区测试台账",identity:"模拟教学数据"},sourceTag:"数据资料",summary:"3.1公里固定线路的阶段性测试记录。",details:["测试线路3.1公里。","固定停靠点7个。","平均速度约6km/h。","日均测试订单约210单。","人工接管率约3.2%。","尚未获得城市开放道路商业运营许可。"],genres:["communication","commentary"],reliabilityTag:"模拟教学数据",factContribution:true,warning:"必须标明“模拟教学数据”；测试数据不能外推为全城运行表现。"}),
  material({id:"ROB_VIEW_01",storyline:"robot",type:"viewpoint",title:"支持试点的园区居民",source:{name:"园区居民甲",identity:"试点支持者"},sourceTag:"直接采访 · 当事人",summary:"认为机器人可能减少配送电动车乱停。",quotes:["如果它能减少园区里乱停的配送电动车，我支持试。"],genres:["commentary"],autoGenres:["commentary"]}),
  material({id:"ROB_VIEW_02",storyline:"robot",type:"viewpoint",title:"推婴儿车居民",source:{name:"园区居民乙",identity:"道路使用者"},sourceTag:"直接采访 · 当事人",summary:"担忧机器人进一步挤占人行道。",quotes:["有些人行道两个人并排都嫌挤，再加机器人谁给谁让？"],genres:["commentary"],autoGenres:["commentary"]}),
  material({id:"ROB_VIEW_03",storyline:"robot",type:"viewpoint",title:"交通研究者",actionLabel:"采访交通研究者",source:{name:"交通研究者",identity:"第三方研究者"},sourceTag:"第三方专家",summary:"把问题放到道路空间分配中讨论。",quotes:["真正的问题不是机器人先进不先进，而是谁拥有道路空间。"],genres:["commentary"]}),
  material({id:"ROB_VIEW_04",storyline:"robot",type:"viewpoint",title:"法律研究者",actionLabel:"采访法律研究者",source:{name:"法律研究者",identity:"第三方研究者"},sourceTag:"第三方专家",summary:"关注碰撞后的责任划分。",quotes:["发生碰撞以后，制造商、运营者和人工控制人员之间的责任必须提前明确。"],genres:["commentary"]}),
  material({id:"ROB_BG_01",storyline:"robot",type:"background",title:"道路测试政策",actionLabel:"查询道路测试政策",source:{name:"S城市政府会议资料",identity:"政策公开资料"},sourceTag:"官方资料",summary:"管理办法只获原则通过，具体道路和日期未最终公布。",details:["市政府只是“原则通过配送设备道路测试管理办法”。","具体测试道路尚未最终公布。","正式实施日期尚未最终公布。"],genres:["communication","commentary"],factContribution:true,warning:"“原则通过”不等于“机器人已获准全城上路”。",commentQuestion:"新技术进入城市，应该先有完整规则再开放，还是边试边建立规则？"}),

  /* 暴雨城市主线 */
  material({id:"RAIN_INT_01",storyline:"rain",actionLabel:"采访气象台值班预报员",source:{name:"沈遥",identity:"S城气象台值班预报员"},sourceTag:"直接采访 · 工作人员",summary:"预警随实时观测变化而升级。",details:["自动站雨量约每5分钟更新一次。"],quotes:["预警升级不代表上午预报错了，而是实时观测结果不断发生变化。"],genres:["communication","commentary"],factContribution:true}),
  material({id:"RAIN_INT_02",storyline:"rain",actionLabel:"进入应急指挥中心采访",source:{name:"梁峰",identity:"应急指挥中心值班人员"},sourceTag:"直接采访 · 工作人员",summary:"多个城市系统在同一时段持续更新。",details:["屏幕同时包括地铁、道路、河流、水库、学校、景区。"],quotes:["最忙的时候不是某一个数字特别大，而是十几个系统同时在更新。"],genres:["communication","commentary"],factContribution:true}),
  material({id:"RAIN_INT_03",storyline:"rain",actionLabel:"采访一名普通通勤者",source:{name:"谢琳",identity:"S城市民、通勤者、学生家长"},sourceTag:"直接采访 · 当事人",summary:"她在一天中连续遇到地铁异常、积水和学校停课通知。",details:["上午遇到地铁异常。","中午公司楼下出现积水。","下午收到孩子学校停止剩余课程通知。"],quotes:["早上我以为只是地铁坏了，到下午才发现这些可能都是同一场雨。"],genres:["communication"]}),
  material({id:"RAIN_BG_01",storyline:"rain",type:"background",title:"本组掌握的暴雨时间线",actionLabel:"整理本组暴雨时间线",source:{name:"本编辑部已发现线索",identity:"动态生成，不读取未发现事件"},sourceTag:"记者现场",summary:"只按时间整理本组实际发现的暴雨相关事件。",genres:["communication","commentary"],autoGenres:["commentary"],factContribution:true,process:true,dynamic:"rain_timeline",warning:"这张卡只汇总本组已发现的 rain 事件，不代表城市全部情况。"}),
  material({id:"RAIN_VIEW_01",storyline:"rain",type:"viewpoint",title:"市民A",source:{name:"受访市民A",identity:"道路使用者"},sourceTag:"直接采访 · 当事人",summary:"把道路积水与排水能力联系起来。",quotes:["看到道路积水，我第一反应就是城市排水是不是不行。"],genres:["commentary"],autoGenres:["commentary"]}),
  material({id:"RAIN_VIEW_02",storyline:"rain",type:"viewpoint",title:"水务工程师",source:{name:"水务工程师",identity:"专业技术人员"},sourceTag:"第三方专家",summary:"强调排水系统存在设计标准与极端天气边界。",quotes:["排水系统都有设计标准，不可能保证所有极端天气下道路一滴水都不积。"],genres:["commentary"],autoGenres:["commentary"]}),
  material({id:"RAIN_VIEW_03",storyline:"rain",type:"viewpoint",title:"城市规划研究者",actionLabel:"采访城市规划研究者",source:{name:"城市规划研究者",identity:"第三方研究者"},sourceTag:"第三方专家",summary:"建议从预警、封控、转移和恢复速度综合评价。",quotes:["评价城市韧性不能只看有没有积水，还要看预警、封控、人员转移以及恢复速度。"],genres:["commentary"]}),
  material({id:"RAIN_VIEW_04",storyline:"rain",type:"viewpoint",title:"市民B",actionLabel:"补访一名学生家长",source:{name:"受访市民B",identity:"学生家长"},sourceTag:"直接采访 · 当事人",summary:"更关注学校和地铁是否采取及时保护措施。",quotes:["我更关心学校有没有把孩子留在安全地方、地铁有没有及时关闭进水口。"],genres:["commentary"],commentQuestion:"一场极端天气之后，应该用什么标准评价一座城市？"}),

  /* 地铁特写：材料时间严格停留在12:52左右。 */
  material({id:"METRO_FIELD_01",storyline:"metro_rain",type:"field_note",title:"12:52，B口台阶",actionLabel:"查看B口现场笔记",source:{name:"本报记者",identity:"12:52，地铁中心站B口"},sourceTag:"记者现场",summary:"站务人员抬来挡水板，乘客改走A口。",observations:["雨水沿B口最下方三级台阶向内流。","两名站务人员抬来蓝色挡水板。","其中一人蹲下检查底部密封。","十几名准备出站的乘客被引导改走A口。"],genres:["feature"],autoGenres:["feature"]}),
  material({id:"METRO_FIELD_02",storyline:"metro_rain",type:"field_note",title:"12:55，出口外积水",actionLabel:"查看入口现场笔记",source:{name:"本报记者",identity:"12:55，地铁中心站B口"},sourceTag:"记者现场",summary:"乘客涉水离开，保洁员把入口水推回门外。",observations:["一名穿浅色衬衣的男子脱下皮鞋，卷起裤脚，走过出口外积水。","一名保洁员不断把站厅入口处的水推回门外。"],genres:["feature"],autoGenres:["feature"]}),
  material({id:"METRO_SOUND_01",storyline:"metro_rain",type:"field_note",title:"B口的声音",actionLabel:"查看现场声音记录",source:{name:"本报记者",identity:"12:52左右，地铁中心站B口"},sourceTag:"记者现场",summary:"雨点、对讲机与每三分钟重复一次的广播。",observations:["雨点敲击玻璃顶棚。","对讲机传出短促通话。","广播约每3分钟重复：“B口临时关闭，请从A口出站。”"],genres:["feature"],autoGenres:["feature"]}),
  material({id:"METRO_FOLLOW_A",storyline:"metro_rain",actionLabel:"跟随站务员",source:{name:"小吴",identity:"地铁中心站站务员"},sourceTag:"直接采访 · 工作人员",summary:"他用粉笔标记水位变化。",observations:["小吴拿白色粉笔，在侧墙接近水面处画一道线。","三分钟后，又画第二道。","两道线相距约两个指节。"],quotes:["刚才还在下面，现在到这里了。"],details:["记者问：“水还在涨？”小吴指向第二道线作答。"],genres:["feature"],featureFollow:true,warning:"材料发生在12:52左右，人物不知道16:45才确认的设备进水原因。"}),
  material({id:"METRO_FOLLOW_B",storyline:"metro_rain",actionLabel:"跟随一名受影响乘客",source:{name:"周岚",identity:"32岁，在中央金融街上班的通勤乘客"},sourceTag:"直接采访 · 当事人",summary:"她改走A口，并给同事发消息说明会迟到。",observations:["周岚在B口指示牌前停下，确认封闭提示后转向A口。","她把折伞装回塑料袋，一边走一边给同事发送语音。","从B口绕到A口约多用七分钟。"],quotes:["我不是走不了，就是得重新找路，也要告诉同事会晚一点。"],genres:["feature"],featureFollow:true,warning:"这是普通通勤受影响情形，没有人员伤亡或严重困境；人物不知道后续故障结论。"}),
  material({id:"METRO_FOLLOW_C",storyline:"metro_rain",actionLabel:"跟随现场保洁员",source:{name:"李阿姨",identity:"地铁中心站保洁员"},sourceTag:"直接采访 · 工作人员",summary:"她持续推水，并按站务要求调整清洁区域。",observations:["李阿姨把入口地垫向内拖了半米。","她用推水刮把薄水层推向门外。","站务员抬挡水板时，她停下让出通道。","挡水板放好后，她转到侧边继续处理鞋底带入的水。"],quotes:["先把门口这一层推回去，站务让我换区域我就跟着换。"],genres:["feature"],featureFollow:true,warning:"材料发生在12:52左右，不得让人物知道16:45才确认的设备进水原因。"}),

  /* 明星传言 */
  material({id:"RUM_CHAIN_01",storyline:"celebrity",type:"background",title:"09:06 · 原始帖子",source:{name:"社交平台原始帖子",identity:"09:06发布"},sourceTag:"社交平台原始材料",summary:"原帖使用不确定语气并带有问号。",details:["原始帖子：“好像在电子商业街看到林川？？？”"],genres:["commentary"],autoGenres:["commentary"],factContribution:true,quoteAllowed:true}),
  material({id:"RUM_CHAIN_02",storyline:"celebrity",type:"background",title:"09:11 · 二次娱乐账号",source:{name:"二次娱乐账号",identity:"09:11转发"},sourceTag:"社交平台原始材料",summary:"不确定表述被改写为肯定标题。",details:["标题：“林川现身S城电子商业街！”"],genres:["commentary"],autoGenres:["commentary"],factContribution:true}),
  material({id:"RUM_CHAIN_03",storyline:"celebrity",type:"background",title:"09:19 · 群聊转发",source:{name:"本地群聊截图",identity:"09:19传播"},sourceTag:"社交平台原始材料",summary:"群聊进一步转化为到场号召。",details:["群聊转发：“快去电子商业街，林川在！”"],genres:["commentary"],autoGenres:["commentary"],factContribution:true}),
  material({id:"RUM_VIEW_01",storyline:"celebrity",type:"viewpoint",title:"原始发布者",source:{name:"原始发布者",identity:"最初照片发布者"},sourceTag:"直接采访 · 当事人",summary:"认为问号已经表达不确定。",quotes:["我也没说肯定是他，我后面还打了两个问号。"],genres:["commentary"],autoGenres:["commentary"]}),
  material({id:"RUM_VIEW_02",storyline:"celebrity",type:"viewpoint",title:"普通转发者",source:{name:"普通转发者",identity:"群聊转发参与者"},sourceTag:"直接采访 · 当事人",summary:"认为自己只是转发。",quotes:["我没说是真的，我就是转了一下。"],genres:["commentary"],autoGenres:["commentary"]}),
  material({id:"RUM_VIEW_03",storyline:"celebrity",type:"viewpoint",title:"现场店员",actionLabel:"采访电子商业街店员",source:{name:"现场店员",identity:"电子商业街商户工作人员"},sourceTag:"直接采访 · 工作人员",summary:"人群中许多人并不知道在等谁。",quotes:["后来很多人根本不知道在等谁，看别人围着就停下来了。"],genres:["commentary"]}),
  material({id:"RUM_VIEW_04",storyline:"celebrity",type:"viewpoint",title:"娱乐账号运营者",actionLabel:"采访娱乐账号运营者",source:{name:"娱乐账号运营者",identity:"二次传播账号"},sourceTag:"利益相关方",summary:"说明流量时效压力和自己的核实方式。",quotes:["这种热点早五分钟和晚五分钟，数据差很多。","偶遇消息一般很难等官方正式回复。"],details:["记者问：“你们核实了吗？”"],genres:["commentary"],reliabilityTag:"利益相关方说法"}),
  material({id:"RUM_VIEW_05",storyline:"celebrity",type:"viewpoint",title:"媒介研究者",actionLabel:"采访媒介研究者",source:{name:"媒介研究者",identity:"第三方研究者"},sourceTag:"第三方专家",summary:"转发行为仍然参与信息传播。",quotes:["‘只是转发’并不会自动退出传播责任。"],genres:["commentary"],commentQuestion:"一条信息没有被任何一个人彻底编造，为什么在传播过程中仍然可能越来越不真实？"}),

  /* 老城夜市 */
  material({id:"NIGHT_FIELD_01",storyline:"nightmarket",type:"field_note",title:"15:54，棚顶积水",source:{name:"本报记者",identity:"15:54，老城夜市"},sourceTag:"记者现场",summary:"摊主用竹竿顶起塑料棚顶。",observations:["一名摊主用竹竿顶起塑料棚顶。","积着的雨水突然从一侧倾下。"],genres:["feature"],autoGenres:["feature"]}),
  material({id:"NIGHT_FIELD_02",storyline:"nightmarket",type:"field_note",title:"叠起的红凳与白烟",source:{name:"本报记者",identity:"老城夜市"},sourceTag:"记者现场",summary:"收摊动作在雨中继续。",observations:["红色塑料凳一张张叠起来。","炭炉遇到飘入的雨水，冒出一股白烟。"],genres:["feature"],autoGenres:["feature"]}),
  material({id:"NIGHT_INT_01",storyline:"nightmarket",actionLabel:"跟随夜市摊主老周",source:{name:"老周",identity:"老城夜市摊主"},sourceTag:"直接采访 · 当事人",summary:"平时准备热闹的时刻，今天却在收摊。",quotes:["平常这个点才准备热闹，今天是反着来的。"],genres:["feature"],featureFollow:true}),
  material({id:"NIGHT_FIELD_03",storyline:"nightmarket",type:"field_note",title:"最后一名顾客",source:{name:"本报记者",identity:"老城夜市"},sourceTag:"记者现场",summary:"最后一名顾客提着炒粉离开。",observations:["最后一名顾客一手撑伞，一手提着刚打包的炒粉离开。"],genres:["feature"],autoGenres:["feature"]}),
  material({id:"NIGHT_FIELD_04",storyline:"nightmarket",type:"field_note",title:"16:08，招牌灯",source:{name:"本报记者",identity:"16:08，老城夜市"},sourceTag:"记者现场",summary:"摊位基本收起，只剩几块招牌灯。",observations:["摊位基本收起。","整条夜市只剩几块还没有关闭的招牌灯。"],genres:["feature"],autoGenres:["feature"],warning:"不要增加专家、政策或宏大意义；这是一则生活新闻特写。"}),

  /* 财经因果 */
  material({id:"MK_FACT_01",storyline:"market_causality",type:"fact",title:"新品与政策发生在行情之前",source:{name:"本编辑部已发现资料",identity:"08:48产品发布及政府会议议程"},sourceTag:"官方资料",summary:"星途新品发布；当天上午政府会议讨论配送设备道路测试。",details:["08:48，星途科技发布新品。","当天上午，政府会议讨论配送设备道路测试。"],genres:["commentary"],autoGenres:["commentary"],factContribution:true}),
  material({id:"MK_FACT_02",storyline:"market_causality",type:"fact",title:"盘中行情背景",source:{name:"模拟市场数据",identity:"11:30市场快照"},sourceTag:"数据资料",summary:"机器人产业链盘中上涨2.1%，同时创业板整体相对活跃。",details:["11:30，机器人产业链盘中上涨2.1%。","同时，创业板整体相对活跃。"],genres:["commentary"],autoGenres:["commentary"],factContribution:true,reliabilityTag:"模拟市场数据"}),
  material({id:"MK_VIEW_01",storyline:"market_causality",type:"viewpoint",title:"财经自媒体标题",source:{name:"财经自媒体",identity:"行情解读账号"},sourceTag:"社交平台原始材料",summary:"把新品发布直接写成板块上涨原因。",quotes:["星途发布新品，机器人板块应声大涨！"],genres:["commentary"],autoGenres:["commentary"],warning:"这是自媒体的因果判断，不是已经核实的市场事实。"}),
  material({id:"MK_VIEW_02",storyline:"market_causality",type:"viewpoint",title:"市场人士观点",source:{name:"受访市场人士",identity:"市场参与者"},sourceTag:"直接采访 · 当事人",summary:"时间相邻只能提示可能联系。",quotes:["时间相邻只能提示可能存在联系，不能证明是唯一原因。"],genres:["commentary"],autoGenres:["commentary"]}),
  material({id:"MK_VIEW_03",storyline:"market_causality",type:"viewpoint",title:"财经编辑观点",actionLabel:"采访财经编辑",source:{name:"财经编辑",identity:"第三方媒体从业者"},sourceTag:"第三方专家",summary:"市场可能不存在一个清楚、唯一的原因。",quotes:["读者喜欢一个清楚的原因，但市场经常根本不给你一个原因。"],genres:["commentary"]}),
  material({id:"MK_BG_01",storyline:"market_causality",type:"background",title:"时间关系与因果关系",actionLabel:"查阅因果核验说明",source:{name:"财经核实手册",identity:"新闻采写背景资料"},sourceTag:"官方资料",summary:"“A发生在B之前”不能自动证明“A导致B”。",details:["新品发布与股票上涨目前只能说明两件事在时间上接近。","仍需要更多证据证明因果。"],genres:["commentary"],factContribution:true,warning:"不得把时间先后直接写成唯一因果。",commentQuestion:"为了让复杂新闻更容易理解，媒体可以把原因说得简单一点吗？"})
];
