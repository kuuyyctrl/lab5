// 全局配置：所有可调参数集中在这里，业务代码只读不写
// TODO 现场按实测调整默认值

module.exports = {
    // 目标应用
    pkg: "com.xingin.xhs",

    // 运行状态（由主流程与悬浮窗写入，业务方法只读）
    running: false,

    // 节奏参数（毫秒）
    interval: 600,          // 点赞基础间隔
    intervalMin: 300,       // 点赞间隔下限，防止卡死
    commentInterval: 3000,  // 评论间隔下限
    waitTimeout: 3000,      // 控件查找超时

    // 单轮上限
    maxLikesPerRound: 300,  // TODO 按需调整

    // 评论池（静态评论，5.1）
    commentPool: [
        // TODO 填入正能量短句，每条不同
    ],

    // 运行统计（用于悬浮窗展示）
    stats: {
        likes: 0,
        comments: 0,
        rooms: 0,
        posts: 0
    }
};
