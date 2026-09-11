/* S城新闻沙盘 V1.1 数据层：地图是唯一主要信息入口。 */
const SIMULATION={date:"2026年9月15日",weekday:"星期二",investigationGrants:{1:3,2:3,3:2},rounds:{1:{time:"09:00",code:"ROUND 01",label:"晨间线索",focus:"发现线索"},2:{time:"13:00",code:"ROUND 02",label:"午间更新",focus:"核实与修正"},3:{time:"17:00",code:"ROUND 03",label:"FINAL CHECK",focus:"最终核实"}}};

const REGIONS=[
 {id:"airport-zone",name:"西北临空智造区",x:1,y:2,w:28,h:25,tone:"sand"},{id:"tech-zone",name:"西部科创园区",x:3,y:29,w:29,h:25,tone:"lilac"},{id:"frontbay-zone",name:"西部前湾新区",x:1,y:56,w:31,h:28,tone:"mint"},{id:"central-zone",name:"中央政务商务区",x:33,y:22,w:29,h:40,tone:"peach"},{id:"port-border-zone",name:"南部口岸商贸区",x:33,y:64,w:29,h:27,tone:"rose"},{id:"education-zone",name:"东北居住教育区",x:62,y:2,w:29,h:38,tone:"yellow"},{id:"harbor-zone",name:"东部港口物流区",x:63,y:42,w:28,h:28,tone:"blue"},{id:"eco-zone",name:"东部山海生态区",x:77,y:69,w:23,h:30,tone:"green"}
];

/* channels 仅用于右栏说明特殊入口可以查询的栏目。 */
const LOCATIONS=[
 {id:"airport",name:"S城国际机场",region:"西北临空智造区",category:"航空交通",icon:"✈",x:8,y:12},{id:"aircargo",name:"航空货运中心",region:"西北临空智造区",category:"港航物流",icon:"货",x:19,y:11},{id:"airmanufacturing",name:"临空智造园",region:"西北临空智造区",category:"先进制造",icon:"造",x:12,y:22},{id:"airportcommunity",name:"临空大型社区",region:"西北临空智造区",category:"社区民生",icon:"宅",x:24,y:23},
 {id:"techpark",name:"S城科技园",region:"西部科创园区",category:"科技产业",icon:"科",x:9,y:37},{id:"university",name:"南湾大学城",region:"西部科创园区",category:"教育科研",icon:"学",x:22,y:35},{id:"aiindustrial",name:"人工智能产业园",region:"西部科创园区",category:"科技产业",icon:"AI",x:13,y:49},{id:"techmetro",name:"科技园地铁站",region:"西部科创园区",category:"轨道交通",icon:"M",x:26,y:50},
 {id:"finance",name:"前湾金融中心",region:"西部前湾新区",category:"财经市场入口",icon:"财",x:9,y:64,entryType:"market",channels:["A股与港股","海外市场","行业板块","市场解释核验"]},{id:"expo",name:"湾区会展中心",region:"西部前湾新区",category:"会展文化",icon:"展",x:24,y:62},{id:"baypark",name:"湾海公园",region:"西部前湾新区",category:"滨海生态",icon:"湾",x:10,y:78},{id:"frontcommercial",name:"前湾商业中心",region:"西部前湾新区",category:"城市商业",icon:"商",x:25,y:78},
 {id:"civic",name:"S城市民中心",region:"中央政务商务区",category:"政务信息入口",icon:"政",x:44,y:30,entryType:"government",channels:["今日政府会议","会议议程","政策发布","新闻发布厅"]},{id:"media",name:"S城媒体中心",region:"中央政务商务区",category:"通讯社信息入口",icon:"媒",x:37,y:42,entryType:"wire",channels:["国内电讯","国际电讯","突发更新"]},{id:"weather",name:"S城气象台",region:"中央政务商务区",category:"气象服务",icon:"气",x:55,y:28},{id:"emergency",name:"S城应急指挥中心",region:"中央政务商务区",category:"应急管理",icon:"应",x:54,y:44},{id:"metro",name:"地铁中心站",region:"中央政务商务区",category:"轨道交通",icon:"M",x:44,y:55},{id:"centralfinance",name:"中央金融街",region:"中央政务商务区",category:"商务楼宇",icon:"金",x:56,y:57},
 {id:"border",name:"S城口岸",region:"南部口岸商贸区",category:"交通口岸",icon:"关",x:38,y:78},{id:"station",name:"S城火车站",region:"南部口岸商贸区",category:"铁路交通",icon:"站",x:48,y:69},{id:"electronics",name:"电子商业街",region:"南部口岸商贸区",category:"电子商业",icon:"电",x:57,y:82},{id:"oldcommercial",name:"老城商业中心",region:"南部口岸商贸区",category:"城市商业",icon:"城",x:47,y:86},
 {id:"school",name:"S城第三中学",region:"东北居住教育区",category:"基础教育",icon:"校",x:69,y:11},{id:"hospital",name:"S城第一人民医院",region:"东北居住教育区",category:"医疗卫生",icon:"医",x:82,y:12},{id:"stadium",name:"S城体育中心",region:"东北居住教育区",category:"体育场馆",icon:"体",x:69,y:27},{id:"community",name:"东城家园",region:"东北居住教育区",category:"社区民生",icon:"宅",x:83,y:27},{id:"communityservice",name:"东城社区服务中心",region:"东北居住教育区",category:"社区服务",icon:"服",x:76,y:37},
 {id:"harbor",name:"深东港",region:"东部港口物流区",category:"港口交通",icon:"港",x:68,y:52},{id:"harborlogistics",name:"港区物流中心",region:"东部港口物流区",category:"港航物流",icon:"物",x:82,y:49},{id:"eastroad",name:"东部快速路",region:"东部港口物流区",category:"道路交通",icon:"路",x:76,y:64},
 {id:"eastpark",name:"东湾海岸公园",region:"东部山海生态区",category:"滨海生态",icon:"岸",x:86,y:75},{id:"mountain",name:"山海景区",region:"东部山海生态区",category:"文旅生态",icon:"山",x:94,y:76},{id:"reservoir",name:"东湾水库",region:"东部山海生态区",category:"水务生态",icon:"水",x:84,y:90},{id:"ocean",name:"海洋观测站",region:"东部山海生态区",category:"海洋科研",icon:"海",x:94,y:91}
];

/* 所有数值均为虚构教学数据。 */
const MARKET_SNAPSHOTS={
 1:{note:"模拟市场数据，仅用于新闻教学",session:"09:00｜A股、港股待开盘；海外显示上一交易日收盘",indexes:[["A股","上证指数","3,152.78","上一交易日 +0.18%","待开盘"],["A股","深证成指","10,284.36","上一交易日 +0.42%","待开盘"],["A股","创业板指","2,084.15","上一交易日 +0.61%","待开盘"],["港股","恒生指数","18,426.70","上一交易日 -0.24%","待开盘"],["港股","恒生科技指数","3,887.42","上一交易日 -0.37%","待开盘"],["海外","纳斯达克综合指数","17,592.13","上一交易日 +0.83%","已收盘"],["海外","标普500","5,633.09","上一交易日 +0.41%","已收盘"]],sectors:["科技设备：待开盘","机器人产业链：待开盘","港口物流：待开盘","消费：待开盘","港股科技：待开盘"]},
 2:{note:"模拟市场数据，仅用于新闻教学",session:"13:00｜A股午间收盘；港股盘中；美国市场今日尚未开盘",indexes:[["A股","上证指数","3,141.26","-0.37%","午间"],["A股","深证成指","10,238.54","-0.45%","午间"],["A股","创业板指","2,094.82","+0.51%","午间"],["港股","恒生指数","18,351.44","-0.41%","盘中"],["港股","恒生科技指数","3,921.38","+0.87%","盘中"],["海外","纳斯达克综合指数","17,592.13","上一交易日 +0.83%","未开盘"],["海外","标普500","5,633.09","上一交易日 +0.41%","未开盘"]],sectors:["科技设备 +1.3%","机器人产业链 +2.1%","港口物流 -1.2%","消费 -0.6%","港股科技 +0.9%"]},
 3:{note:"模拟市场数据，仅用于新闻教学",session:"17:00｜A股已收盘；港股日间数据；美国市场今日尚未开盘",indexes:[["A股","上证指数","3,137.92","-0.47%","收盘"],["A股","深证成指","10,221.17","-0.61%","收盘"],["A股","创业板指","2,101.64","+0.84%","收盘"],["港股","恒生指数","18,302.16","-0.68%","日间"],["港股","恒生科技指数","3,934.06","+1.20%","日间"],["海外","纳斯达克综合指数","17,592.13","上一交易日 +0.83%","未开盘"],["海外","标普500","5,633.09","上一交易日 +0.41%","未开盘"]],sectors:["科技设备 +1.6%","机器人产业链 +2.4%","港口物流 -1.5%","消费 -0.8%","港股科技 +1.2%"]}
};

/* 事件行字段：id,轮次,时间,地点,标题,内容,来源,来源类型,获取方式,故事线,价值层,补充字段。 */
function toEvent(row,defaults={}){const [id,round,publishTime,location,title,content,source,sourceType,acquisition,storyline="daily",valueTier="city_dynamic",extra={}] = row;const place=LOCATIONS.find(item=>item.id===location);return {id,round,publishTime,location,title,content,source,sourceType,acquisition,storyline,valueTier,region:place?.region||"S城",desk:"city",scope:"local",accessType:"location",verificationStatus:"verified",evidenceLevel:"primary",...defaults,...extra};}

const CITY_ROWS=[
 ["A01",1,"07:42","airport","机场启动低能见度运行程序","受云层和降雨影响，部分进港航班间隔拉大。","S城机场运行公告","交通运营通报","官方发布","rain","ordinary"],
 ["A02",2,"10:18","airport","机场延误航班增至23架次","机场提醒旅客关注航空公司通知，目前航站楼秩序正常。","S城机场运行中心","交通运营通报","官方发布","rain","ordinary"],
 ["A03",3,"15:36","airport","机场进出港效率逐步恢复","降雨间歇后跑道保障能力回升，仍有少量航班等待调时。","S城机场运行中心","交通运营通报","官方发布","rain"],
 ["A04",1,"08:06","aircargo","航空货运中心启用冷链查验通道","新通道面向生鲜和医药类货物，今日开始试运行。","航空货运中心","企业通知","地点查询","daily","ordinary"],
 ["A05",2,"11:06","aircargo","部分航空货物转入延后装运","雷雨天气使三批货物调整装机时间，冷链货物未受影响。","货运中心调度信息","企业通知","地点查询","rain"],
 ["A06",1,"08:14","airmanufacturing","临空智造园发布秋季招聘计划","12家企业合计发布约680个技术与生产岗位。","临空智造园管委会","园区通知","地点查询","jobs","ordinary"],
 ["A07",2,"11:22","airmanufacturing","园区开放日因天气移至室内","原定室外无人机演示取消，其他招聘活动继续。","临空智造园","企业通知","官方发布","rain"],
 ["A08",2,"12:12","airportcommunity","社区车库入口出现少量积水","物业设置挡水板，网传“车辆被淹”照片无法确认拍摄地点。","居民报料与物业回应","市民投稿","社交平台","rain","background",{verificationStatus:"partially_verified"}],
 ["A09",3,"15:08","airportcommunity","物业确认车库未发生车辆受淹","积水中午前排除，早前流传的受淹照片来自外地。","社区物业与图片反向检索","记者核实","第二来源","rain","noise",{verificationStatus:"debunked"}],

 ["07",1,"08:48","techpark","星途科技发布城市配送机器人","企业宣布新一代配送机器人正式发布，并称将服务全城。","星途科技新闻稿","企业通知","地点查询","robot","ordinary",{verificationStatus:"single_source",evidenceLevel:"interested_party"}],
 ["19",2,"12:40","techpark","机器人目前仅获准园区约3公里测试","园区管理方确认产品尚未获准进入公共道路。","科创园管理方与记者核实","记者采访","第二来源","robot","background",{accessType:"investigation",actionLabel:"联系园区管理方 / 寻找第二来源",cost:1,prerequisites:["07"],evidenceLevel:"independent"}],
 ["T03",3,"15:22","techpark","科技园恢复室外机器人演示","雨势减弱后演示在封闭道路恢复，现场设置人工安全员。","科技园活动中心","园区通知","地点查询","robot"],
 ["T04",1,"08:08","university","南湾大学城迎来秋季新生报到","三所高校增设地铁接驳点和志愿服务站。","大学城联合服务中心","校方通报","官方发布","campus","ordinary"],
 ["T05",2,"11:14","university","高校开放两处礼堂供学生避雨","多项户外迎新活动顺延，教学安排暂未调整。","大学城联合服务中心","校方通报","官方发布","rain"],
 ["T06",1,"08:26","aiindustrial","人工智能产业园举行专场招聘会","46家企业提供算法、产品和制造类岗位。","人工智能产业园","园区通知","地点查询","jobs","ordinary"],
 ["T07",2,"10:52","aiindustrial","园区一栋办公楼短时网络波动","运营方称为机房切换测试，与强降雨是否有关尚在排查。","产业园运营方","企业通知","地点查询","daily","background",{verificationStatus:"single_source"}],
 ["T08",1,"08:32","techmetro","科技园站早高峰客流同比增加","高校报到与园区招聘会叠加，车站增派引导人员。","S城地铁运营公司","交通运营通报","官方发布","traffic"],
 ["T09",3,"15:42","techmetro","科技园站部分地面接驳线路恢复","此前因积水绕行的两条公交线路恢复原线。","S城公交集团","交通运营通报","官方发布","rain"],

 ["F01",1,"08:12","expo","湾区智能制造展今日开幕","展会有420家企业参展，预计持续三天。","湾区会展中心","会展通知","地点查询","expo","ordinary"],
 ["F02",2,"11:34","expo","会展中心上午入场观众约2.8万人次","部分观众因降雨延后到场，主办方增开连廊入口。","展会组委会","企业通知","地点查询","expo","ordinary"],
 ["04",1,"08:24","baypark","湾海公园部分亲水平台临时关闭","管理人员封闭低洼亲水平台，现场可见局部积水。","公园管理处","官方通报","地点查询","rain","background"],
 ["09",2,"10:46","baypark","市民上传青川河水位上涨视频","视频显示近湾段水位明显上涨，拍摄位置已核对。","市民视频投稿","市民投稿","社交平台","rain","major",{verificationStatus:"partially_verified",evidenceLevel:"user_generated"}],
 ["B03",3,"15:18","baypark","湾海公园继续关闭沿河步道","水位虽未超过警戒线，管理方决定闭园至次日上午。","湾海公园管理处","官方通报","官方发布","rain","ordinary"],
 ["F03",1,"08:38","frontcommercial","前湾商业中心举办湾区美食周","活动首日设置80个餐饮摊位。","前湾商业中心","企业通知","地点查询","commerce"],
 ["F04",2,"12:08","frontcommercial","商场中庭短时聚集避雨人群","秩序正常；一段“商场被淹”视频实为入口外积水。","商场保安与现场观察","现场观察","现场观察","rain","noise",{verificationStatus:"partially_verified"}],

 ["01",1,"07:30","weather","气象台发布暴雨黄色预警","预计上午到夜间有强降水，局部伴有短时大风。","S城气象台","官方通报","官方发布","rain","major"],
 ["17",2,"12:16","weather","部分区域升级暴雨橙色预警","西部沿海和中央城区降雨增强，需防范短时积水。","S城气象台","官方通报","官方发布","rain","major"],
 ["W03",3,"16:12","weather","气象台发布暴雨红色预警","部分街道三小时累计雨量超过100毫米。","S城气象台","官方通报","官方发布","rain","major"],
 ["E01",1,"08:22","emergency","应急指挥中心启动联合值守","气象、水务、交通等部门派员进驻值守席位。","S城应急指挥中心","官方通报","地点查询","rain","background"],
 ["26",3,"15:28","emergency","全市已处置11处道路积水点","截至15时，暂未收到本轮降雨导致的人员死亡报告。","S城应急指挥中心","官方通报","官方发布","rain","major"],
 ["02",1,"08:10","metro","地铁3号线部分区段设备异常","运营方称部分区段暂停运营，原因仍在排查。","S城地铁运营公司","交通运营通报","官方发布","rain","major"],
 ["20",2,"12:52","metro","地铁中心站入口出现积水照片","记者确认B口外出现积水，设备异常原因仍未确定。","市民照片与记者定位核验","现场观察","现场观察","rain","major",{verificationStatus:"partially_verified"}],
 ["30",3,"16:45","metro","地铁确认上午设备异常与强降雨有关","最终排查显示设备区域进水是直接原因。","S城地铁运营公司最终通报","交通运营通报","官方发布","rain","major"],
 ["C01",2,"11:48","centralfinance","网传中央金融街一栋写字楼停电","多段短视频声称整栋楼停电，物业暂未说明。","本地社交平台","社交平台","社交平台","rain","noise",{verificationStatus:"unverified"}],
 ["C02",3,"14:44","centralfinance","物业确认仅地下设备层短时断电","办公区域供电正常，短时断电已于12时前恢复。","楼宇物业与租户核实","记者核实","第二来源","rain","background"],

 ["08",1,"08:56","border","S城口岸早高峰客流高于近期平均","入境客流较近五个工作日同期平均高约15%。","S城口岸运行数据","官方通报","官方发布","border","ordinary"],
 ["15",2,"11:55","border","口岸客流增幅扩大，接驳候车延长","上午客流增幅扩大至22%，部分线路候车延长约15分钟。","口岸运行中心","官方通报","官方发布","border","ordinary"],
 ["S01",1,"08:28","station","火车站上午列车运行基本正常","车站提醒旅客预留进站时间，暂未出现大面积晚点。","S城火车站","交通运营通报","官方发布","traffic"],
 ["S02",3,"15:02","station","受外地线路天气影响六趟列车晚点","晚点集中在20至55分钟，站内增设改签窗口。","铁路运行公告","交通运营通报","官方发布","rain","ordinary"],
 ["06",1,"08:42","electronics","网传明星林川现身电子商业街","一张模糊照片在社交平台传播。","本地娱乐话题账号","网络传言","社交平台","celebrity","noise",{verificationStatus:"unverified",evidenceLevel:"lead"}],
 ["23",3,"14:38","electronics","工作室确认林川当天未到S城","工作室提供公开行程，记者另向场地方核实。","林川工作室与场地方","记者采访","第二来源","celebrity","noise",{accessType:"investigation",actionLabel:"联系工作室 / 寻找第二来源",cost:1,prerequisites:["06"],verificationStatus:"debunked",evidenceLevel:"cross_checked"}],
 ["O01",2,"11:18","oldcommercial","老城商业中心雨具销量明显增加","六家受访商户称销量约为平日两倍，样本有限。","记者走访6家商户","记者采访","现场观察","commerce"],
 ["O02",3,"15:54","oldcommercial","老城夜市宣布提前结束今日营业","管理方提示摊主加固设备并有序撤场。","老城商业中心管理处","企业通知","官方发布","rain"],

 ["05",1,"08:35","school","第三中学科技节如期开幕","学生展示机器人和自制气象仪，户外展区暂时正常。","第三中学校园广播","校园广播","地点查询","school","ordinary"],
 ["16",2,"12:04","school","网传第三中学“因暴雨紧急停课”","家长群截图称学校已经停课。","家长群截图","社交平台","社交平台","school","noise",{verificationStatus:"unverified"}],
 ["18",2,"12:28","school","学校澄清：目前未停课","科技节户外活动转移至室内，学校没有发布停课通知。","第三中学校方通报","校方通报","官方发布","school","ordinary",{prerequisites:["16"]}],
 ["29",3,"16:20","school","红色预警后第三中学停止剩余课程","在校学生由学校妥善安置，家长无需冒雨立即到校。","教育部门与第三中学","校方通报","官方发布","school","major",{evidenceLevel:"cross_checked"}],
 ["HOS1",1,"08:18","hospital","第一人民医院开设青少年脊柱门诊","新门诊每周二、周四接诊，需提前预约。","第一人民医院","医院通知","官方发布","health","ordinary"],
 ["14",2,"11:46","hospital","医院上午跌伤及交通伤患者增加","急诊科称相关患者较平日同期增加，尚无危重病例。","第一人民医院急诊科","记者采访","记者采访","rain","major",{accessType:"investigation",actionLabel:"联系医院急诊科",cost:1}],
 ["HOS3",3,"15:48","hospital","医院增开临时急诊观察区","院方调配床位应对雨天伤病患者，常规门诊照常。","第一人民医院","医院通知","官方发布","rain","ordinary"],
 ["ST01",1,"08:40","stadium","S城青少年篮球联赛今日开赛","32支队伍将在体育中心进行小组赛。","S城体育中心","赛事通知","地点查询","sports","ordinary"],
 ["ST02",2,"12:22","stadium","体育中心取消下午室外田径体验","室内篮球赛事继续，观众入场口调整至北门。","S城体育中心","赛事通知","官方发布","rain"],
 ["03",1,"08:18","community","东城家园4栋住宅楼电梯停运","居民反映两部电梯同时停运，物业已张贴检修告示。","社区居民报料","市民投稿","地点查询","elevator","ordinary",{verificationStatus:"single_source"}],
 ["13",2,"11:38","community","电梯停运影响高龄居民复诊","记者走访发现，一名住在17层的老人因此推迟复诊。","居民采访与现场观察","记者采访","记者采访","elevator","ordinary",{accessType:"investigation",actionLabel:"去现场 / 采访居民",cost:1,prerequisites:["03"],verificationStatus:"partially_verified",evidenceLevel:"independent"}],
 ["27",3,"15:44","community","市场监管部门介入电梯维保调查","部分维保记录需要进一步核实，故障原因尚未查明。","S城市场监管部门","官方通报","官方发布","elevator","ordinary",{prerequisites:["03"],verificationStatus:"under_investigation"}],
 ["CS01",1,"08:50","communityservice","社区服务中心开设长者智能手机课堂","首期20个名额已报满，下周将增开一场。","东城社区服务中心","社区通知","地点查询","community"],
 ["CS02",2,"12:34","communityservice","服务中心向低洼楼栋发放挡水物资","工作人员向5个小区运送沙袋。","东城社区服务中心","社区通知","官方发布","rain","background"],

 ["P01",1,"08:04","harbor","深东港公布八月集装箱吞吐量","八月吞吐量同比增长4.6%。","深东港运营数据","企业数据","地点查询","port","ordinary"],
 ["P02",2,"11:02","harbor","港区暂停部分高空吊装作业","雷雨大风使两个泊位调整作业计划。","深东港调度中心","企业通知","官方发布","rain","ordinary"],
 ["P03",3,"15:16","harbor","深东港积压车辆开始分批放行","风力下降后部分作业恢复，港区外道路仍有排队。","深东港调度中心","企业通知","地点查询","rain","ordinary"],
 ["PL01",1,"08:46","harborlogistics","港区物流中心启用无人仓二期","二期增加冷链和跨境电商分拣线。","港区物流中心","企业通知","地点查询","port","ordinary"],
 ["PL02",2,"12:02","harborlogistics","部分集卡预约时段顺延","港口作业调整导致下午预约量重新分配。","港区物流中心","企业通知","官方发布","rain"],
 ["ER01",2,"11:28","eastroad","东部快速路一处边坡排水不畅","养护单位封闭最右侧车道检查。","道路养护单位","交通运营通报","地点查询","rain","ordinary"],
 ["ER02",3,"14:54","eastroad","东部快速路两处低洼路段交通管制","交警实施临时管制并引导车辆绕行。","S城交警","官方通报","官方发布","rain","major"],
 ["EP01",2,"10:38","eastpark","东湾海岸公园关闭礁石步道","海边风浪增强，管理人员劝离游客。","东湾海岸公园","官方通报","地点查询","rain","ordinary"],
 ["EP02",3,"15:32","eastpark","网传海岸出现“巨浪越堤”视频","视频拍摄于去年台风期间，并非今日现场。","社交平台与记者核验","网络传言","第二来源","rain","noise",{verificationStatus:"debunked"}],
 ["MT01",2,"10:58","mountain","山海景区暂停高处观景线路","低海拔游客中心维持开放，已停止售卖登山票。","山海景区","景区通知","地点查询","rain","ordinary"],
 ["MT02",3,"14:28","mountain","景区转移两批滞留徒步游客","37名游客已安全返回服务站，无人受伤。","山海景区与救援队","官方通报","官方发布","rain","major"],
 ["R01",2,"11:42","reservoir","东湾水库水位较清晨上涨0.31米","水库仍低于汛限水位，正在增加巡查频次。","S城水务部门","官方通报","地点查询","rain","background"],
 ["R02",3,"16:06","reservoir","水库开始预泄部分来水","水务部门称预泄属于调度措施，当前不存在溃坝风险。","S城水务部门","官方通报","官方发布","rain","major"],
 ["OC01",2,"12:18","ocean","海洋观测站记录近岸浪高上升","平均浪高增加，暂未达到风暴潮警戒级别。","S城海洋观测站","观测数据","地点查询","rain","background"],
 ["OC02",3,"15:58","ocean","观测站发现近岸漂浮垃圾带","科研人员称可能与强降雨径流有关，具体来源待分析。","S城海洋观测站","现场观察","现场观察","rain","ordinary",{verificationStatus:"partially_verified"}]
];
const CITY_EVENTS=CITY_ROWS.map(row=>toEvent(row));

/* 市民中心：政府会议、部门政策与新闻发布厅。 */
const GOVERNMENT_ROWS=[
 ["G1",1,"08:20","civic","S城市政府常务会议今日召开","议程包括配送设备道路测试、社区托育和公共数据开放；审议不等于通过。","S城市政府办公室","官方议程","官方发布","policy","ordinary"],
 ["G05",1,"08:30","civic","教育部门发布秋季校园安全提示","要求学校完善极端天气接送和停课信息发布流程。","S城教育部门","部门通知","官方发布","education","ordinary"],
 ["G06",1,"08:36","civic","交通部门公布三条道路施工安排","施工持续两周，部分路段夜间占道。","S城交通部门","部门通知","官方发布","traffic"],
 ["G07",1,"08:54","civic","住建部门启动老旧小区电梯摸排","首批覆盖18个小区，结果将在月底汇总。","S城住建部门","部门通知","官方发布","elevator","background"],
 ["G2",2,"10:30","civic","常务会议仍在进行，尚未公布审议结果","公开会议状态显示会议仍在进行，目前没有正式结果。","市民中心会议公开栏","现场公开信息","地点查询","policy","background"],
 ["G08",2,"11:10","civic","水务部门：青川河水位上涨0.76米","水位较清晨上涨，但目前尚未超过警戒线。","S城水务部门","官方通报","官方发布","rain","major"],
 ["G09",2,"11:32","civic","市场监管部门公布校园食品抽检结果","抽检126批次，2批次调味品不合格并已处置。","S城市场监管部门","部门通报","官方发布","food","ordinary"],
 ["G10",2,"12:42","civic","新闻发布厅预告16时举行防汛发布会","应急、气象、水务和交通部门将介绍处置进展。","S城市政府新闻办公室","发布会预告","官方发布","rain","major"],
 ["G3",3,"14:20","civic","市政府原则通过配送设备道路测试办法","初期测试范围限定在指定产业园区和部分封闭道路。","市政府常务会议通报","官方通报","官方发布","policy","ordinary"],
 ["28",3,"16:02","civic","S城启动防汛Ⅲ级应急响应","部分区域三小时累计雨量超过100毫米，多部门进入应急状态。","S城市政府新闻办公室","官方通报","官方发布","rain","major"],
 ["G11",3,"16:18","civic","住建部门要求排查地下空间防涝设施","范围包括住宅车库、商场地下层和在建工地。","S城住建部门","部门通知","官方发布","rain","ordinary"],
 ["G4",3,"16:30","civic","新测试办法仍需完成正式发布程序","具体实施日期和首批测试道路将另行公布。","S城市政府新闻办","记者采访","记者采访","policy","background",{accessType:"investigation",actionLabel:"联系市政府新闻办",cost:1,prerequisites:["G3"],evidenceLevel:"independent"}]
];
const GOVERNMENT_EVENTS=GOVERNMENT_ROWS.map(row=>toEvent(row,{desk:"government",scope:"government"}));

/* 前湾金融中心：价格变化是事实，涨跌原因需要独立核实。 */
const MARKET_ROWS=[
 ["H01",1,"08:05","finance","A股与港股尚未进入日间交易","页面显示上一交易日收盘值和待开盘状态。","模拟市场行情板","市场数据","地点查询","market","background",{evidenceLevel:"data"}],
 ["H02",1,"08:25","finance","纳斯达克显示上一交易日收盘","美国市场今日尚未开盘，不能表述为今日盘中行情。","模拟海外市场行情板","市场数据","地点查询","market","background",{evidenceLevel:"data"}],
 ["H03",1,"08:45","finance","五个行业板块等待开盘","科技设备、机器人、港口物流、消费和港股科技暂不显示日内涨跌。","模拟行业行情板","市场数据","地点查询","market","city_dynamic",{evidenceLevel:"data"}],
 ["H1",2,"09:31","finance","A股主要指数开盘后震荡","上证和深证成指盘中走弱，创业板指相对活跃。","模拟市场行情板","市场数据","地点查询","market","ordinary",{evidenceLevel:"data"}],
 ["H2",2,"11:30","finance","机器人产业链盘中上涨2.1%","价格变化可确认；自媒体给出的上涨原因尚未核实。","模拟行情与财经自媒体","市场数据","地点查询","market","ordinary",{verificationStatus:"partially_verified",evidenceLevel:"mixed"}],
 ["H05",2,"11:52","finance","港口物流板块盘中走弱","多只相关股票下跌，不能仅凭港口作业调整解释全部变化。","模拟市场行情板","市场数据","地点查询","market","ordinary",{evidenceLevel:"data"}],
 ["H06",2,"12:20","finance","恒生科技指数盘中上涨","港股科技相对活跃，纳斯达克仍为上一交易日收盘。","模拟港股行情板","市场数据","地点查询","market","ordinary",{evidenceLevel:"data"}],
 ["H4",3,"15:05","finance","A股收盘：创业板指上涨，其余主要指数走弱","机器人和科技设备较强，港口物流与消费偏弱。","模拟市场收盘数据","市场数据","地点查询","market","ordinary",{evidenceLevel:"data"}],
 ["H07",3,"15:40","finance","港股科技保持上涨，恒生指数走弱","这是价格变化，不等于已经找到唯一涨跌原因。","模拟港股市场数据","市场数据","地点查询","market","ordinary",{evidenceLevel:"data"}],
 ["H3",3,"16:08","finance","市场人士称板块变化存在多重因素","政策预期、行业数据和发布会均可能影响交易，无法简单归因。","多名市场人士","记者采访","第二来源","market","background",{accessType:"investigation",actionLabel:"采访市场人士核实涨跌原因",cost:1,prerequisites:["H2"],verificationStatus:"partially_verified",evidenceLevel:"independent"}]
];
const MARKET_EVENTS=MARKET_ROWS.map(row=>toEvent(row,{desk:"markets",scope:"market"}));

/* 媒体中心：11条国内、国际底层电讯，分散在三轮。 */
const WIRE_ROWS=[
 ["I01",1,"07:55","media","国家航天任务计划今日实施关键操作","任务窗口与技术目标已由国家航天机构公布。","国家航天机构","通讯社电讯","通讯社电讯","space","major",{region:"全国",evidenceLevel:"wire"}],
 ["I02",1,"08:15","media","北方多地迎来秋季首场大范围降温","中央气象部门提示昼夜温差明显增大。","国家通讯社","通讯社电讯","通讯社电讯","weather","ordinary",{region:"全国",evidenceLevel:"wire"}],
 ["I03",1,"08:44","media","国际原油价格上一交易日小幅波动","多家机构对波动给出不同解释。","国际通讯社","通讯社电讯","通讯社电讯","world_economy","background",{region:"国际",scope:"world",verificationStatus:"partially_verified",evidenceLevel:"wire"}],
 ["I1",2,"09:10","media","国家航天任务完成关键阶段操作","后续科学数据将在近期公布，任务仍在继续。","国家航天机构","通讯社电讯","通讯社电讯","space","major",{region:"全国",evidenceLevel:"wire"}],
 ["I04",2,"10:05","media","某省高速公路客车事故救援结束","当地公布初步伤亡情况，事故原因仍在调查。","国家通讯社与当地应急部门","通讯社电讯","通讯社电讯","public_event","major",{region:"全国",verificationStatus:"partially_verified",evidenceLevel:"wire"}],
 ["I2",2,"10:40","media","海外某国沿海地区发生强烈地震","当地正在评估灾情，初步数字仍在更新。","国际通讯社与当地官方机构","通讯社电讯","通讯社电讯","earthquake","major",{region:"国际",scope:"world",verificationStatus:"partially_verified",evidenceLevel:"wire"}],
 ["I05",2,"12:06","media","亚洲主要货币汇率日间波动","多家机构给出不同解释，价格与原因分析应分开。","国际财经通讯社","通讯社电讯","通讯社电讯","world_economy","background",{region:"国际",scope:"world",verificationStatus:"partially_verified",evidenceLevel:"wire"}],
 ["I06",3,"14:12","media","高速公路客车事故调查组成立","调查组将核查车辆状况、道路条件与驾驶记录。","国家通讯社","通讯社电讯","通讯社电讯","public_event","ordinary",{region:"全国",evidenceLevel:"wire"}],
 ["I07",3,"15:02","media","航天任务首批遥测数据状态正常","后续科学结论仍需分析。","国家航天机构","通讯社电讯","通讯社电讯","space","ordinary",{region:"全国",evidenceLevel:"wire"}],
 ["I3",3,"16:00","media","地震灾情数字更新，中国领事机构发布提醒","当地更新受灾数据，领事机构正在核实中国公民情况。","当地政府与中国领事机构","通讯社电讯","通讯社电讯","earthquake","major",{region:"国际",scope:"world",evidenceLevel:"cross_checked"}],
 ["I08",3,"16:34","media","国际航运组织发布港口效率报告","亚洲主要港口平均等待时间较上季度下降。","国际航运组织","通讯社电讯","通讯社电讯","world_economy","ordinary",{region:"国际",scope:"world",evidenceLevel:"wire"}]
];
const WIRE_EVENTS=WIRE_ROWS.map(row=>toEvent(row,{desk:"national_world",scope:"national"}));

const EVENTS=[...CITY_EVENTS,...GOVERNMENT_EVENTS,...MARKET_EVENTS,...WIRE_EVENTS];
const EDITORIAL_STATUS={tracking:{symbol:"★",label:"追踪"},pending:{symbol:"？",label:"待核"},confirmed:{symbol:"✓",label:"已确认"},dropped:{symbol:"×",label:"放弃"}};
const DISCARD_REASONS=["公共影响较小","信息仍不足","已经被更重大事件覆盖","与其他新闻高度重复","时效性下降","已经证伪","其他"];
const DESKS={city:{code:"CITY",label:"城市现场",short:"城市"},government:{code:"GOVERNMENT",label:"政务信息",short:"政务"},markets:{code:"MARKETS",label:"财经市场",short:"财经"},national_world:{code:"NATIONAL / WORLD",label:"国内·国际",short:"国内·国际"}};
