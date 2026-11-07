// 悬浮窗控制面板：只负责 UI 与事件转发，不写业务逻辑
// 布局字段对应评分点：实时点赞数、速度滑块、启停、动态评论输入
// TODO 外观细节（位置、透明度、尺寸）现场再调

var config = require("./config.js");

var panel = null;

// actions: { onToggle, onSpeedChange(progress), onSendComment(text), onClose }
function create(actions) {
    panel = floaty.window(
        <vertical bg="#dd1a1a1a" padding="10" w="240">
            <text id="title" text="小红书直播助手" textColor="#ffffff" textSize="14sp"/>
            <text id="stat" text="点赞 0 · 评论 0 · 间隔 0ms" textColor="#bbbbbb" textSize="11sp"/>
            <seekbar id="speed" max="9" progress="5" w="220"/>
            <horizontal>
                <button id="toggle" text="开始" w="105" h="36"/>
                <button id="close" text="退出" w="105" h="36"/>
            </horizontal>
            <input id="commentInput" hint="动态评论内容" textSize="12sp" w="220"/>
            <button id="sendComment" text="发送评论" w="220" h="36"/>
        </vertical>
    );

    panel.setPosition(16, Math.floor(device.height * 0.25));

    // ---------------- 事件绑定（逻辑待填） ----------------
    panel.toggle.on("click", function () {
        // TODO: 切换 config.running，更新按钮文字“开始/暂停”
        actions.onToggle();
    });

    panel.speed.setOnSeekBarChangeListener({
        onProgressChanged: function (seekbar, progress, fromUser) {
            if (!fromUser) return;
            // TODO: 进度 → 间隔映射，写入 config.interval 并刷新 stat
            actions.onSpeedChange(progress);
        }
    });

    panel.sendComment.on("click", function () {
        var text = String(panel.commentInput.text || "");
        // TODO: 调用 xhs.sendComment(text)，成功后清空输入框
        actions.onSendComment(text);
    });

    panel.close.on("click", function () {
        actions.onClose();
    });

    return panel;
}

// 刷新状态栏文字
function updateStats() {
    if (!panel) return;
    // TODO: panel.stat.setText("点赞 " + config.stats.likes + " · 评论 " + config.stats.comments + " · 间隔 " + config.interval + "ms");
}

// 关闭悬浮窗，脚本退出时必须调用，否则残留
function close() {
    if (panel) {
        panel.close();
        panel = null;
    }
}

module.exports = {
    create: create,
    updateStats: updateStats,
    close: close
};
