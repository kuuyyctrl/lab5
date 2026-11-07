// 入口：只做流程编排与自检，具体动作全部调用 lib 中的方法
// 当前为框架版本，业务函数均为 TODO 占位，运行后只输出日志

"auto";

var config = require("./lib/config.js");
var xhs = require("./lib/xhs.js");
var panel = require("./lib/floatyPanel.js");

var likeThread = null;

// ================= 阶段 1：环境自检 =================
function checkEnv() {
    if (!auto.waitFor()) {
        toast("无障碍服务未开启，脚本退出");
        return false;
    }
    // TODO: 检查悬浮窗权限、屏幕是否点亮、目标包是否已安装
    return true;
}

// ================= 阶段 2：启动并进入直播间 =================
function bootLiveRoom() {
    if (!xhs.launchApp()) {
        toast("启动小红书失败");
        return false;
    }
    if (!xhs.enterLiveRoom()) {
        toast("进入直播间失败，请手动进入");
        return false;
    }
    return true;
}

// ================= 阶段 3：点赞线程 =================
function startLikeThread() {
    if (likeThread) return;
    config.running = true;
    likeThread = threads.start(function () {
        xhs.likeLoop();
    });
    toast("点赞线程已启动");
}

function stopLikeThread() {
    config.running = false;
    likeThread = null;
}

// ================= 阶段 4：悬浮窗 =================
function createPanel() {
    panel.create({
        // 开始 / 暂停
        onToggle: function () {
            if (config.running) {
                stopLikeThread();
            } else {
                startLikeThread();
            }
        },

        // 速度滑块：progress 0~9
        onSpeedChange: function (progress) {
            // TODO: 映射为 1000ms ~ 100ms，写回 config.interval
            log("[panel] speed=" + progress);
        },

        // 动态评论
        onSendComment: function (text) {
            if (!text) {
                toast("评论内容为空");
                return;
            }
            threads.start(function () {
                xhs.sendComment(text);
            });
        },

        // 退出
        onClose: function () {
            exit();
        }
    });

    // 状态栏刷新
    setInterval(function () {
        panel.updateStats();
    }, 1000);
}

// ================= 主流程 =================
function main() {
    console.show();
    log("[main] 框架启动");

    if (!checkEnv()) return;
    if (!bootLiveRoom()) return;

    createPanel();
    startLikeThread();
}

// 脚本退出时释放资源
events.on("exit", function () {
    config.running = false;
    threads.shutDownAll();
    panel.close();
});

try {
    main();
} catch (e) {
    log("[main] 异常: " + e);
    toast("脚本异常，已退出");
    panel.close();
}
