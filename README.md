<br>
<p align="center">
  <a >
    <img src="public/favicon.ico" alt="Logo" width="60" height="60">
  </a>
  <h2 align="center" style="color: #2ca7b7ff;">Turquoise</h3>
  <p align="center">
    一个本地EPUB阅读工具，提供丰富的辅助阅读功能
  </p>
</p>

<br>

## 小说一句
本项目是一个本地运行的EPUB阅读工具。当然，这并非重点，主要是为了解决阅读文言文的困难，后续将开发丰富的辅助功能，例如可进行查词和AI翻译，更可以写注解或者译文，提高文言文的阅读效率（也是我原先项目ClassicTrans的升级版）  
以上皆为展望，项目刚刚起步  

## 使用技术栈
Vue3 ( 框架 ) + Vite ( 构建工具 ) + Element-Plus ( UI组件库 )

## 开发日志
`2025.7.20` 创建了这个项目，决定使用 Element-Plus 作为UI组件库  
`2025.7.21` 使用 Splitter 分隔面板 进行页面布局 写了部分关于侧边栏的 UI   
`2025.7.22` 给 Aside 侧边栏添加了青色样式  
`2025.7.23` 往 Main Interface 写一丢丢东西，写了一点点样式，然后一直在搞关于存储和解析的东西，却始终没有运行起来，deepseek实在太过弱智，明天自己写吧  
`2025.7.24` 干了超多事情，把EPUB存储模块写在了`.src/epubStorage.ts` 使用 IndexedDB 作为数据库，然后写了一点关于 BookViewer 的样式和动画，明天写书本自动排版和增删逻辑

## 预览图
<img src="public/progress.png" alt="progress" >
