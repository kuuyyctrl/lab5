# Autox.js v7 使用文档（小红书自动化实战）

> 面向本任务：在真机上用 Autox.js v7 完成“进入直播间 / 自动发帖 / 滑屏切换 / 点赞关注 / 自动评论”等功能。
> 阅读顺序建议：环境搭建 → 核心 API → 小红书场景套路 → 完整模板 → 调试与排错。

## 一、环境搭建

### 1.1 安装

1. 下载 **Autox.js v7** APK（课程群 / 官方发布页），安装到 Android 手机（建议 Android 10–14，真机优先于模拟器）。
2. 首次启动按提示授予以下权限，缺一不可：

| 权限 | 作用 | 备注 |
| --- | --- | --- |
| 无障碍服务（Accessibility） | 读取控件树、模拟点击滑动 | 系统设置 → 无障碍 → Autox.js → 开启 |
| 通知读取权限 | 部分脚本场景需要 | 系统设置 → 通知使用权 |
| 悬浮窗（显示在其他应用上层） | `floaty` 控制面板、`console.show()` | 系统设置 → 特殊应用权限 |
| 后台运行 / 自启动 / 电池不优化 | 防止服务被杀 | 小米、华为、OPPO、vivo 均需单独设置 |

3. 在 Autox.js 主界面点“启动服务”，状态显示“无障碍服务已开启”即成功。

### 1.2 电脑端开发（推荐）

1. VS Code 安装插件：**Auto.js-Autox.js-VSCodeExt**（作者 hyb1996 的社区版或 v7 配套版）。
2. 手机与电脑接同一局域网，手机端 Autox.js 打开“服务 → 电脑端控制/客户端模式”。
3. VS Code 按 `Ctrl+Shift+P` → `Autox: 连接设备` → 输入手机 IP（或自动发现）。
4. 编写脚本后 `Autox: 保存到设备` 或在手机端“运行”，日志实时回传到 VS Code。

> 没有电脑时，直接在手机端“新建脚本”编辑，配合 `toast()` / `console.show()` 调试即可。

### 1.3 工程组织

单文件脚本足够应对现场题；若要多人协作，使用项目结构：

```
project/
├── project.json          // 工程配置（包名、权限、入口、最低 Android 版本）
├── main.js               // 入口
└── lib/
    ├── xhs.js            // 小红书页面/控件封装
    └── floatyPanel.js    // 悬浮窗控制面板
```

`project.json` 关键字段：

```json
{
  "name": "xhs_live_bot",
  "packageName": "com.example.xhslivebot",
  "versionName": "1.0.0",
  "main": "main.js",
  "launchConfig": { "displaySplash": false },
  "permissions": [],
  "packageNameList": ["com.xingin.xhs"]
}
```

> Android 11+ 有“包可见性”限制，`app.launchPackage()` 需要把目标包名写进 `packageNameList`，否则会抛异常。

## 二、核心 API 速查

| 需求 | API | 示例 |
| --- | --- | --- |
| 启动 App | `app.launchPackage(pkg)` | `app.launchPackage("com.xingin.xhs")` |
| 等待界面 | `text/desc/id(...).findOne(timeout)` | `text("说点什么").findOnce()` |
| 点击控件 | `控件.click()` | `btn.click()` |
| 点击坐标 | `click(x, y)` | `click(540, 2100)` |
| 长按 / 双击 | `longClick(x,y)` / `doubleClick(x,y)` | — |
| 手势（自定义轨迹） | `gesture(duration, [p1, p2, ...])` | `gesture(1000, [500,1500],[500,600])` |
| 滑动 | `swipe(x1,y1,x2,y2,duration)` | `swipe(540, 1700, 540, 500, 400)` |
| 输入文本 | `setText(str)` / `input(text)` | `input("今天也要加油呀")` |
| 返回 / 主页 | `back()` / `home()` | — |
| 屏幕尺寸 | `device.width` / `device.height` | — |
| 延时 | `sleep(ms)` / `sleep(random(800,1500))` | — |
| 日志 | `toast(msg)` / `log(msg)` / `console.show()` | — |
| 子线程 | `threads.start(fn)` / `threads.shutDownAll()` | 点赞跑后台，UI 留主线程 |
| 悬浮窗 | `floaty.window(view)` / `floaty.rawWindow(view)` | 调速面板 |
| 音量/亮度/唤醒 | `device.setVolume()` `device.wakeUp()` | 演示前唤醒屏幕 |

### 选择器优先级建议

1. `text("...")`、`desc("...")`：可读性最好，跨版本最稳。
2. `id("...")`：需先用“布局分析”确认资源 ID，版本升级易失效。
3. `bounds()` 坐标兜底：作为最后一道保险，但要按 `device.width/height` 比例换算。

组合定位示例：

```js
// 在“说点什么...”输入框所在的父容器内找发送按钮
let send = text("发送").boundsInside(0, device.height * 0.7, device.width, device.height).findOne(3000);
```

## 三、小红书场景实现套路

小红书包名：`com.xingin.xhs`。

### 3.1 启动并进入直播间（基础题 1）

现场做法：先把“人工进入直播间”的路径跑通，再固化成脚本。

1. 启动 App，处理开屏广告（`text("跳过")` / `desc("关闭")` / 右上角坐标）。
2. 进入直播入口：首页顶部“直播”频道 / 发现页金刚区“直播” / 任意笔记作者头像的“直播中”标识。
3. 用“直播间独有控件”判定已进入，而不是用固定延时：

```js
// 直播间判定标志：评论输入框 + 点赞按钮在同一界面
function inLiveRoom() {
    return textContains("说点什么").exists() && descContains("点赞").exists();
}
```

4. **随机进入**：在直播列表页取可见的直播卡片元素，随机抽一个点击：

```js
let cards = className("android.widget.FrameLayout").boundsInside(0, 300, device.width, device.height).find();
if (cards.length > 0) {
    let target = cards[random(0, Math.min(cards.length - 1, 6))];
    click(target.bounds().centerX(), target.bounds().centerY());
}
```

> 卡片容器类名随版本变化，务必先用“悬浮窗 → 布局分析”抓真实类名，再写选择器。

### 3.2 自动发帖（基础题 2）

流程：首页“+”→ 选择图片 → 下一步 → 填标题/正文 → 加话题 → 发布。

```js
function postNote(title, body) {
    // 1. 进入发布页
    click(device.width - 60, 120);              // “+”号（按比例换算更佳）
    sleep(2000);

    // 2. 选取相册首张图片
    let firstImg = className("android.widget.ImageView").findOne(5000);
    firstImg.click();
    sleep(800);
    text("下一步").findOne(3000).click();
    sleep(1500);

    // 3. 填标题与正文
    let titleBox = textContains("填写标题").findOne(3000);
    if (titleBox) { titleBox.click(); setText(title); sleep(500); }

    let bodyBox = textContains("添加正文").findOne(3000) || className("android.widget.EditText").findOne(3000);
    if (bodyBox) { bodyBox.click(); setText(body); sleep(800); }

    // 4. 发布
    let publish = text("发布").findOne(3000) || desc("发布").findOne(3000);
    if (publish) { publish.click(); }
}
```

要点：

- 输入中文用 `setText()`；若控件不响应，先 `click()` 聚焦再 `setText()`，仍失败则用剪贴板 + 粘贴（`setClip()` + 长按菜单“粘贴”）。
- 发布按钮常因内容未就绪而置灰，需先判断 `publish.enabled()`，必要时循环等待。
- 现场演示建议提前把图片保存到相册首屏，避免相册列表滚动。

### 3.3 滑屏切换直播间（中等题 3.1）

直播间之间通常是**上下切换**（竖向滑动）：

```js
function nextLiveRoom() {
    swipe(device.width / 2, device.height * 0.8, device.width / 2, device.height * 0.25, 350);
    sleep(random(1200, 2200));         // 等新直播间加载
    if (!inLiveRoom()) {               // 加载失败或跳到广告页
        sleep(2000);
        if (!inLiveRoom()) back();
    }
}
```

要点：

- 滑动起止点避开底部评论栏和右侧点赞/礼物按钮区，防止误触。
- 滑动时长 300–500ms 更接近真人；过慢会被识别为长按。
- 切换后判断页面“变没变”，可用直播间标题控件文本作为去重依据。

### 3.4 快捷点赞与关注（中等题 3.2）

```js
function quickLike() {
    let btn = descContains("点赞").findOne(3000) || textContains("赞").findOne(3000);
    if (btn) { btn.click(); return true; }
    // 兜底：直播间右侧点赞按钮的常见坐标（按分辨率比例）
    click(device.width * 0.92, device.height * 0.72);
    return false;
}

function quickFollow() {
    let f = text("关注").findOne(2000);
    if (f && f.clickable()) { f.click(); return true; }
    if (f) { click(f.bounds().centerX(), f.bounds().centerY()); return true; }
    return false;              // 已关注 / 未找到
}
```

要点：

- 关注是**幂等操作**：按钮文本会从“关注”变为“已关注”，点击前先判断状态，避免反复点。
- 点赞控件可能在点击后动画位移，建议点击中心坐标而非控件引用。

### 3.5 自动点赞 + 实时速度控制（中等题 4）

结构：**后台线程持续点赞** + **悬浮窗滑块改间隔**。

```js
let config = { interval: 500, running: true, count: 0 };

function likeLoop() {
    while (config.running) {
        if (inLiveRoom()) {
            quickLike();
            config.count++;
        }
        sleep(config.interval + random(0, 100));
    }
}

// 悬浮窗：拖动滑块实时改变点赞间隔
let panel = floaty.window(
    <frame gravity="center">
        <vertical bg="#cc000000" padding="8">
            <text id="info" textColor="#ffffff" textSize="12sp">点赞：0</text>
            <seekbar id="speed" max="9" progress="5" w="220"/>
            <button id="stop" text="停止" w="220" h="36"/>
        </vertical>
    </frame>
);

panel.speed.setOnSeekBarChangeListener({
    onProgressChanged: function (sb, progress, fromUser) {
        // 进度 0~9 映射间隔 1000ms~100ms（进度越大越快）
        config.interval = 1000 - progress * 100;
        panel.info.setText("间隔 " + config.interval + "ms");
    }
});

panel.stop.on("click", () => { config.running = false; });

threads.start(likeLoop);

setInterval(() => {
    panel.info.setText("点赞：" + config.count + " / " + config.interval + "ms");
}, 1000);

// 脚本结束时释放悬浮窗，否则残留
events.on("exit", () => panel.close());
```

要点（对应评分点 4.1 / 4.2）：

- **间隔下限**：不低于 200–300ms；默认 500ms，避免 App 卡死或触发风控。
- **计数上限**：可设置每轮最大点赞数（如 300），到量自动降速或暂停。
- **UI 外观**：显示实时点赞数、当前间隔、启停按钮，演示时可现场拖动滑块对比速度。
- 悬浮窗里的 `setOnSeekBarChangeListener` 只负责改配置，真正的节奏由点赞线程读取，避免 UI 线程阻塞。

### 3.6 自动评论（进阶题 5）

静态评论池（5.1）+ 悬浮窗实时输入（5.2）：

```js
let textPool = [
    "主播讲得太好了，学到了！",
    "今天也要元气满满呀～",
    "这个分享真的有用，收藏了",
    "支持一下，继续加油！",
    "氛围感拉满，爱了爱了"
];
let dynamic = { text: "" };   // 悬浮窗输入框实时同步

function sendComment() {
    let box = textContains("说点什么").findOne(3000);
    if (!box) return false;
    box.click();
    sleep(600);

    let content = dynamic.text || textPool[random(0, textPool.length - 1)];
    let input = className("android.widget.EditText").findOne(3000);
    if (!input) return false;
    input.setText(content);
    sleep(400);

    let send = text("发送").findOne(3000);
    if (send) send.click();
    sleep(300);
    back();                    // 收起键盘，避免遮挡点赞按钮
    return true;
}
```

动态评论悬浮窗：

```js
let inputWin = floaty.window(
    <vertical bg="#eeffffff" padding="8" w="300">
        <input id="edit" textSize="13sp" hint="输入要发送的评论"/>
        <horizontal>
            <button id="send" text="发送一条" w="140" h="36"/>
            <button id="clear" text="清空" w="140" h="36"/>
        </horizontal>
    </vertical>
);

inputWin.edit.on("text", function (s) { dynamic.text = s; });
inputWin.send.on("click", () => { threads.start(sendComment); });
inputWin.clear.on("click", () => { inputWin.edit.setText(""); dynamic.text = ""; });
```

要点：

- 评论去重：记录已发送内容，随机池内避免连续重复，降低被判为垃圾评论的概率。
- 每条评论发送后 `back()` 收键盘，否则下一次 `findOne` 可能被输入法遮挡。
- 现场演示“动态评论”时，在悬浮窗里打字点发送，能直接体现实时可改。

## 四、完整脚本模板（可直接改）

```js
"auto";                                     // 免手动点“运行”
auto.waitFor();                             // 等待无障碍服务就绪
console.show();                             // 显示日志（演示时便于解说）

const PKG = "com.xingin.xhs";
const config = { interval: 600, running: true, likes: 0, autoFollow: false };

// ---------- 通用 ----------
function safeBack() { if (currentPackage() !== PKG) return; back(); sleep(800); }

function inLiveRoom() {
    return textContains("说点什么").exists() || descContains("点赞").exists();
}

// ---------- 启动并进入 ----------
function openXhs() {
    app.launchPackage(PKG);
    sleep(3000);
    // 处理开屏广告：优先找“跳过/关闭”，找不到就点右上角
    let skip = textContains("跳过").findOne(2000) || descContains("关闭").findOne(2000);
    if (skip) { skip.click(); sleep(800); }
}

function enterLiveRoom() {
    // 1. 首页顶部“直播”频道入口（坐标兜底）
    let tab = text("直播").findOne(3000);
    if (tab) tab.click(); else click(device.width * 0.5, 120);
    sleep(2500);

    // 2. 随机点一张直播卡片
    let cards = className("android.widget.FrameLayout")
        .boundsInside(0, 300, device.width, device.height).find();
    if (cards.length) {
        let c = cards[random(0, Math.min(6, cards.length - 1))];
        click(c.bounds().centerX(), c.bounds().centerY());
    }
    sleep(3000);
    return inLiveRoom();
}

// ---------- 点赞线程 ----------
function likeLoop() {
    while (config.running) {
        if (inLiveRoom()) {
            let btn = descContains("点赞").findOnce() || textContains("赞").findOnce();
            if (btn) { click(btn.bounds().centerX(), btn.bounds().centerY()); }
            else { click(device.width * 0.92, device.height * 0.72); }
            config.likes++;
            if (config.autoFollow) quickFollow();
        }
        sleep(config.interval + random(0, 120));
    }
}

function quickFollow() {
    let f = text("关注").findOnce();
    if (f) { click(f.bounds().centerX(), f.bounds().centerY()); }
}

// ---------- 主流程 ----------
openXhs();
if (!enterLiveRoom()) { toast("进入直播间失败，请手动进入"); }
threads.start(likeLoop);
toast("脚本已启动，悬浮窗可调速");
```

> 模板只是骨架：小红书控件随版本变化，必须用“布局分析”把 `text/desc/id/className` 校准确认，坐标兜底按分辨率比例改写。

## 五、调试方法

| 手段 | 用法 |
| --- | --- |
| 布局分析 | Autox.js 悬浮窗 → “布局分析/查看控件”，读取 id、class、bounds、clickable |
| 日志 | `console.show()` + `log()`；VS Code 连接后可看手机日志 |
| 弹窗提示 | `toast()` 标记关键节点，方便录屏时解说 |
| 慢放 | 全局 `sleep()` 调大，确认流程正确后再提速 |
| 单步验证 | 把每个功能写成独立函数，用 `engines.stopAll()` 后单独调用 |
| 录屏 | 手机自带录屏或 `screenrecord`，用于复盘失败环节 |

## 六、常见问题排查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `app.launchPackage` 报错 | Android 11+ 包可见性限制 | `project.json` 增加 `packageNameList` |
| 点击无反应 | 控件不可点击，或点到了不可见区域 | 改点 `bounds().centerX/Y`，确认控件 `visibleToUser()` |
| 找不到控件 | 文字含空格/前缀不同，或页面未加载完 | 用 `textContains`、`descContains`，加长 `findOne` 超时 |
| 中文输入失败 | 输入法未就绪 / 控件只读 | `click()` 聚焦后 `setText()`，或剪贴板粘贴 |
| 悬浮窗不显示 | 无悬浮窗权限 | 系统设置中打开“显示在其他应用上层” |
| 脚本跑一会就停 | 后台被系统杀 / 异常退出 | 电池白名单、自启动；`try/catch` 包裹主循环 |
| App 越点越卡 | 点赞过快、页面动画堆积 | 提高间隔、限制单轮次数、定期 `back()` 清理 |
| 服务自动关闭 | 无障碍被系统回收 | 演示前重开服务，脚本开头 `auto.waitFor()` |

## 七、注意事项

1. **隐私**：演示前清理通知栏、相册、聊天列表；关闭消息预览，避免录屏/直播泄露隐私。
2. **频率**：所有自动操作加随机延时，模拟真人节奏；点赞间隔 ≥300ms，评论间隔 ≥3s。
3. **演示自检**：开机 → 开无障碍 → 开悬浮窗 → 启动小红书 → 跑脚本，五步清单走一遍。
4. **合规**：脚本仅用于课程演示，不用于刷量、刷赞等违规行为。
