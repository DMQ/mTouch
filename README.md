# mTouch
mTouch移动端 ( 兼容pc端) 手势操作库


支持的事件：
* `tap`  单击
* `doubletap` 双击
* `longtap`  长按
* `swipestart`  滑动开始
* `swipeend`  滑动结束
* `swiping` 滑动
* `swipeleft` 向左划
* `swiperight` 向右划
* `swipeup` 向上划
* `swipedown` 向下划

# 提供的接口
#### 1、mTouch.config（配置项）

```javascript
  mTouch.config({
    tapMaxDistance: 10,    // 单击事件允许的滑动距离
    doubleTapDelay: 200,   // 双击事件的延时时长（两次单击的最大时间间隔）
    longTapDelay: 700,     // 长按事件的最小时长
    swipeMinDistance: 20,  // 触发方向滑动的最小距离
    swipeTime: 300	       // 触发方向滑动允许的最长时长
  })
```

以上是默认值，可根据具体使用场景自行配制配置项，但需要注意每个配置项之间的约束关系，比如`longTapDelay`不能比`doubleTapDelay`小...

#### 2、.on(eventType, [proxyStr], handler(event))

绑定事件方法，使用方式类似`jQuery`的`on`方法，支持链式调用，支持事件委托，回调函数返回`false`阻止冒泡及默认行为，同样可以用原生的`e.stoPropagation()`和`e.preventDefault()`

> 注：回调函数中被注入的参数`event`是拓展了的原生事件对象, 添加了属性`event.mTouchEvent`

```javascript
mTouchEvent = {
  type: string,
  target: dom,
  pageX: number,
  pageY: number,
  startX: number,
  startY: number,
  moveX: number,
  moveY: number
}

// 其中 startX、startY、moveX、moveY 只有 swiping 事件才有
```

使用方法
```javascript
mTouch('.btn').on('tap', function (e) {
  //...
}).on('doubletap', function (e) {
  //...
})
.on('longtap', function (e) {
  //...
});

mTouch('.btn-group').on('tap', '.btn', function (e) {
  //...
});
```

#### 3、.off(eventType, proxyStr, handler)
取消绑定事件方法，使用方式类似`jQuery`的`off`，有一点需要注意，通过事件委托绑定的事件必须得由实际绑定事件的节点取消绑定，如：
```javascript
mTouch('.btn-group').on('tap', '.btn', function (e) {
  //...
});

// .btn的tap事件委托到.btn-group，要取消该tap事件，要这样做:
mTouch('.btn-group').off('tap', '.btn');

// 暂没有实现这种方式：
mTouch('.btn').off('tap'); //错误的方式
```

更多用法请查看 [demo](http://htmlpreview.github.io/?https://github.com/DMQ/mTouch/blob/master/src/demo.html) 为了你的更佳体验，请用Chrome模拟mobile或手机打开

# vue 版本
```html
<body>
  ...
  <div class="demo">
    <span v-touch:tap="onTap">点我</span>
  </div>
  ...
  <script>
    Vue.use(mTouch);
    var vue = new Vue({
      el: '.demo',
      data: {},
      methods: {
        onTap: function () {
          console.log('你点击了一下');
        }
      }
    })
  </script>
</body>
```

感谢您的阅读！
