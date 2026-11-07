// 小红书操作层：所有与界面控件打交道的动作都收敛到这里
// 约定：函数返回 boolean 表示动作是否成功，不抛异常给调用方
// TODO 所有选择器需用 Autox.js 悬浮窗“布局分析”实测后填写

var config = require("./config.js");

// ------------------------------------------------------------------
// 内部工具
// ------------------------------------------------------------------

// 随机延时，模拟真人节奏
function sleepRandom(min, max) {
    sleep(min + Math.floor(Math.random() * (max - min + 1)));
}

// 按比例取屏幕坐标（避免写死分辨率）
function posX(ratio) { return Math.floor(device.width * ratio); }
function posY(ratio) { return Math.floor(device.height * ratio); }

// ------------------------------------------------------------------
// M1 基础题 1：启动 App，随机进入一个直播间
// ------------------------------------------------------------------

// 启动小红书并跳过开屏广告
function launchApp() {
    // TODO: app.launchPackage(config.pkg); sleepRandom(2000, 4000); 处理开屏广告
    log("[xhs] TODO launchApp");
    return false;
}

// 判定当前是否在直播间（用直播间独有的控件做标志）
function inLiveRoom() {
    // TODO: return textContains("说点什么").exists() || descContains("点赞").exists();
    log("[xhs] TODO inLiveRoom");
    return false;
}

// 进入直播列表，随机点一个直播间
function enterLiveRoom() {
    // TODO: 1) 点击首页“直播”入口  2) 抓取可见直播卡片  3) 随机点击一张
    log("[xhs] TODO enterLiveRoom");
    return false;
}

// ------------------------------------------------------------------
// M2 基础题 2：编辑文本并自动发帖
// ------------------------------------------------------------------

// 发布图文笔记
function publishPost(title, body) {
    // TODO: 点“+”→ 选图 → 下一步 → 填标题/正文 → 点发布
    log("[xhs] TODO publishPost: " + title);
    return false;
}

// ------------------------------------------------------------------
// M3 中等题 3.1：滑屏切换直播间
// ------------------------------------------------------------------

// 滑到下一个直播间
function nextRoom() {
    // TODO: swipe 竖向滑动（避开底部评论栏与右侧按钮区）→ 等待加载 → 校验页面
    log("[xhs] TODO nextRoom");
    return false;
}

// ------------------------------------------------------------------
// M4 中等题 3.2：点赞与关注
// ------------------------------------------------------------------

// 点赞一次
function like() {
    // TODO: 定位点赞控件并点击，坐标兜底
    return false;
}

// 关注主播（幂等：已关注则跳过）
function follow() {
    // TODO: 查 text("关注")，按钮文本为“已关注”时不点
    return false;
}

// ------------------------------------------------------------------
// M5 中等题 4：点赞循环（由线程调用）
// ------------------------------------------------------------------

function likeLoop() {
    // TODO 在调用方用 threads.start(likeLoop) 启动
    while (config.running) {
        if (inLiveRoom()) {
            // TODO: like()；计数；达到 maxLikesPerRound 后降速或暂停
        }
        sleep(config.interval + Math.floor(Math.random() * 120));
    }
}

// ------------------------------------------------------------------
// M6 进阶题 5：自动评论
// ------------------------------------------------------------------

// 发送一条评论，text 为空时从评论池随机取
function sendComment(text) {
    // TODO: 点输入框 → 填内容 → 点发送 → back() 收键盘
    log("[xhs] TODO sendComment: " + (text || ""));
    return false;
}

// ------------------------------------------------------------------
// 通用
// ------------------------------------------------------------------

// 回到小红书首页，清理现场
function backToHome() {
    // TODO: 连续 back 直到 currentPackage() 非目标包或到达首页
    log("[xhs] TODO backToHome");
    return false;
}

module.exports = {
    launchApp: launchApp,
    inLiveRoom: inLiveRoom,
    enterLiveRoom: enterLiveRoom,
    publishPost: publishPost,
    nextRoom: nextRoom,
    like: like,
    follow: follow,
    likeLoop: likeLoop,
    sendComment: sendComment,
    backToHome: backToHome,
    sleepRandom: sleepRandom,
    posX: posX,
    posY: posY
};
