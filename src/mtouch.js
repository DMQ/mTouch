/**
 * @desc 手势操作库 https://github.com/DMQ/mTouch/
 * @author kindeng
 */

 /* eslint-disable no-underscore-dangle,no-param-reassign */
 const ua = navigator.userAgent;
 const noop = () => { /* 空函数 */ };
 const config = {
     tapMaxDistance: 5, // 单击事件允许的滑动距离
     doubleTapDelay: 200, // 双击事件的延时时长（两次单击的最大时间间隔）
     longTapDelay: 700, // 长按事件的最小时长
     swipeMinDistance: 5, // 触发方向滑动的最小距离
     swipeTime: 300, // 触发方向滑动允许的最长时长
     lockDirection: true, // 是否锁定方向，一旦触发横向/竖向滑动后，就一直锁定这个方向，如不需要锁定，设置为false
 };
 
 const mobileChecker = {
     ios: () => ua.match(/\((i[^;]+);.+OS\s([\d_.]+)/),
 
     android: () => ua.match(/(Android)[\s/]+([\d.]+)/),
 
     wp: () => ua.match(/(Windows\s+Phone)\s([\d.]+)/),
 
     getMobile () {
         return this.ios || this.android || this.wp;
     },
 };
 
 const util = {
     // 是否具有touch事件
     hasTouch: !!('ontouchstart' in window && mobileChecker.getMobile()),
 
     /**
      * 判断节点是否是事件代理的目标
      * @param {object} el dom节点对象
      * @param {string} proxyStr 事件委托的选择器
      */
     isProxyTarget (el, proxyStr) {
         // class代理
         if (proxyStr.indexOf('.') === 0) {
             return new RegExp(`(\\s|^)${proxyStr.substring(1)}(\\s|$)`).test(el.className);
         // id代理
         }
 
         if (proxyStr.indexOf('#') === 0) {
             return el.id === proxyStr.substring(1);
         }
 
         return el.tagName.toLocaleLowerCase() === proxyStr;
     },
 
     /**
      * 获取滑动方向
      * @param {number} x1 滑动开始的x坐标
      * @param {number} y1 滑动开始的y坐标
      * @param {number} x2 滑动结束的x坐标
      * @param {number} y2 滑动结束的y坐标
      * @param {string} directionLocked 锁定的滑动方向
      */
     swipeDirection (x1, y1, x2, y2, directionLocked) {
         // eslint-disable-next-line no-nested-ternary
         return (config.lockDirection && directionLocked === 'horizontal') || (!config.lockDirection && Math.abs(x1 - x2) >= Math.abs(y1 - y2))
             ? (x1 > x2 ? 'LEFT' : 'RIGHT')
             : (y1 > y2 ? 'UP' : 'DOWN');
     },
 
     /**
      * 触发事件，支持事件委托冒泡处理
      * @param {string} eventType 事件类型
      * @param {object} el 绑定了touch事件的dom元素
      * @param {object} event 原生事件对象
      */
     _trigger (eventType, el, event) {
         let { target } = event;
         const currentTarget = el || event.currentTarget || event.target;
 
         if (!target || !currentTarget._m_touch_events[eventType]) {
             return;
         }
 
         const _events = currentTarget._m_touch_events;
         let handlerList = _events[eventType]; // 事件回调数组
 
         // 开始冒泡循环
         while (1) { // eslint-disable-line no-constant-condition
             if (!target) {
                 return;
             }
 
             // 已冒泡至顶，检测是否需要执行回调
             if (target === currentTarget) {
                 // 处理（执行）事件回调列表
                 this._execHandler(handlerList, eventType, target, event, true);
 
                 return; // 已冒泡至顶，无需再冒泡
             }
 
             // 存放临时回调数组
             const tempHandlerList = handlerList;
             //  // 清空事件回调数组
             //  handlerList = [];
             // 处理（执行）事件回调列表，并返回未执行的回调列表重新赋值给handlerList继续冒泡
             handlerList = this._execHandler(tempHandlerList, eventType, target, event, false);
             // 如果执行结果返回false，则跳出冒泡及后续事件
             if (handlerList === false) {
                 return;
             }
 
             // 向上冒泡
             target = target.parentNode;
         }
     },
 
     /**
      * 执行事件回调
      * @param {array} handlerList 事件回调列表
      * @param {string} eventType 事件类型
      * @param {object} target 当前目标dom节点
      * @param {object} event 原生事件对象
      * @param {boolean} isBubbleTop 是否冒泡至顶了
      * @return {array} unExecHandlerList 返回不符合执行条件的未执行回调列表
      */
     _execHandler (handlerList, eventType, target, event, isBubbleTop) {
         let i;
         let len;
         let handlerObj;
         let proxyStr;
         const execList = [];
         const unExecHandlerList = [];
 
         for (i = 0, len = handlerList.length; i < len; i++) {
             handlerObj = handlerList[i];
             proxyStr = handlerObj.proxyStr || '';
 
             // 如果冒泡至顶
             if (isBubbleTop) {
                 // 将符合执行条件的（没有事件委托）推进执行列表
                 if (!proxyStr) {
                     execList.push(handlerObj);
                 }
                 // 未冒泡至顶, 将符合执行条件的（有事件委托且是委托目标）推进执行列表
             } else if (proxyStr && this.isProxyTarget(target, proxyStr)) {
                 execList.push(handlerObj);
             } else {
                 unExecHandlerList.push(handlerObj);
             }
         }
 
         let handler;
 
         if (execList.length) {
             // 执行符合条件的回调
             for (i = 0, len = execList.length; i < len; i++) {
                 handler = execList[i].handler || noop;
                 // 如果回调执行后返回false，则跳出冒泡及后续事件
                 if (this._callback(eventType, handler, target, event) === false) {
                     return false;
                 }
             }
         }
 
         return unExecHandlerList;
     },
 
     /**
      * 事件回调的最终处理函数
      * @param {string} eventType 事件类型
      * @param {function} handler 回调函数
      * @param {object} el 目标dom节点
      * @param {object} event 原生事件对象
      */
     _callback (eventType, handler, el, event) {
         // eslint-disable-next-line no-nested-ternary
         const touch = this.hasTouch
             ? (event.touches.length ? event.touches[0] : event.changedTouches[0])
             : event;
 
         const mTouchData = event._m_touch_data || {};
         const startX = mTouchData.startX || 0;
         const startY = mTouchData.startY || 0;
         const pageX = touch.pageX || 0;
         const pageY = touch.pageY || 0;
 
         // 构建新的事件对象
         const mTouchEvent = {
             type: eventType,
             target: event.target,
             startX,
             startY,
             pageX,
             pageY,
             moveX: pageX - startX,
             moveY: pageY - startY,
             startTime: mTouchData.touchStartTime || 0,
             direction: event._m_touch_data ? event._m_touch_data.directionLocked : '',
         };
 
         // 将新的事件对象拓展到原生事件对象里
         event.mTouchEvent = mTouchEvent;
 
         const result = handler.call(el, event);
         // 如果回调执行后返回false，则阻止默认行为和阻止冒泡
         if (result === false) {
             event.preventDefault();
             event.stopPropagation();
         }
 
         return result;
     },
 
     stopFilter (handler) {
         return function stopHandler (e) {
             e.stopPropagation();
             return handler.call(this, e);
         };
     },
 
     preventFilter (handler) {
         return function preventHandler (e) {
             e.preventDefault();
             return handler.call(this, e);
         };
     },
 };
 
 // 事件类型列表
 const eventList = {
     TOUCH_START: util.hasTouch ? 'touchstart' : 'mousedown',
     TOUCH_MOVE: util.hasTouch ? 'touchmove' : 'mousemove',
     TOUCH_END: util.hasTouch ? 'touchend' : 'mouseup',
     TOUCH_CANCEL: 'touchcancel',
     TAP: 'tap',
     DOUBLE_TAP: 'doubletap',
     LONG_TAP: 'longtap',
     SWIPE_START: 'swipestart',
     SWIPING: 'swiping',
     SWIPE_END: 'swipeend',
     SWIPE_LEFT: 'swipeleft',
     SWIPE_RIGHT: 'swiperight',
     SWIPE_UP: 'swipeup',
     SWIPE_DOWN: 'swipedown',
     CANCEL: 'cancel',
 };
 
 
 /**
  * 绑定原生touch事件
  * @param {object} el 对应的dom节点
  */
 function bindTouchEvents (el) {
     if (el._m_touch_is_bind) {
         return;
     }
 
     // 触屏开始时间
     let touchStartTime = 0;
 
     // 最后一次触屏时间
     let lastTouchTime = 0;
 
     // 坐标位置
     let [x1, x2, y1, y2] = [];
 
     // 单击、长按定时器
     let tapTimer;
     let longTapTimer;
 
     // 记录是否触屏开始
     let isTouchStart = false;
     // 锁定的方向
     let directionLocked;
     // 记录move过程中，位移最大值
     // let maxMoveDis = 0;
     // 记录滑动的方向
     let moveDirection = ''; // LEFT/RIGHT/UP/DOWN
 
     // 重置所有定时器
     const resetTimer = () => {
         clearTimeout(tapTimer);
         clearTimeout(longTapTimer);
     };
 
     // 触发单击事件
     const triggerSingleTap = (event) => {
         isTouchStart = false;
         resetTimer();
         util._trigger(eventList.TAP, el, event);
     };
 
     // 滑动被取消
     const cancel = (event) => {
         resetTimer();
 
         // 记录滑动初始值，为swipe事件传递更多值
         event._m_touch_data = {
             startX: x1,
             startY: y1,
             touchStartTime,
             directionLocked,
         };
 
         util._trigger(eventList.CANCEL, el, event);
     };
 
     // 开始触屏监听函数
     const touchstart = (event) => {
         const touch = util.hasTouch ? event.touches[0] : event;
 
         x1 = touch.pageX;
         y1 = touch.pageY;
         x2 = 0;
         y2 = 0;
 
         isTouchStart = true;
         touchStartTime = Date.now();
         directionLocked = '';
         // maxMoveDis = 0;
         moveDirection = '';
 
         // 记录滑动初始值，为swipe事件传递更多值
         event._m_touch_data = {
             startX: x1,
             startY: y1,
             touchStartTime,
             directionLocked: '',
         };
 
         // 触发滑动开始事件
         util._trigger(eventList.SWIPE_START, el, event);
 
         clearTimeout(longTapTimer);
         // 设置长按事件定时器
         longTapTimer = setTimeout(() => {
             isTouchStart = false;
             // 清楚定时器
             resetTimer();
             util._trigger(eventList.LONG_TAP, el, event);
         }, config.longTapDelay);
     };
 
     // 手指滑动监听函数
     const touchmove = (event) => {
         if (!isTouchStart) {
             return;
         }
 
         const now = Date.now();
         const touch = util.hasTouch ? event.touches[0] : event;
         const oldX2 = x2 || touch.pageX;
         const oldY2 = y2 || touch.pageY;
         // let now = +new Date();
 
         // 记录滑动初始值，为swipe事件传递更多值
         event._m_touch_data = {
             startX: x1,
             startY: y1,
             touchStartTime,
             directionLocked: '',
         };
 
         x2 = touch.pageX;
         y2 = touch.pageY;
 
         const distanceX = Math.abs(x1 - x2);
         const distanceY = Math.abs(y1 - y2);
 
         // move位置不超过配置的tapMaxDisatance，退出
         if (distanceX < config.tapMaxDistance && distanceY < config.tapMaxDistance) {
             return;
         }
 
         // 锁定滑动方向
         if (config.lockDirection && !directionLocked) {
             // 锁定滑动方向为横向滑动
             if (distanceX > distanceY) {
                 directionLocked = 'horizontal';
             // 默认情况是竖向滑动
             } else {
                 directionLocked = 'vertical';
             }
         }
 
         // 滑动方向
         moveDirection = util.swipeDirection(oldX2, oldY2, x2, y2, directionLocked);
 
         event._m_touch_data.directionLocked = directionLocked;
 
         // 横向滑动且x轴滑动的值比旧值大的话，更新一下最大值
         // if (directionLocked === 'horizontal') {
         //     maxMoveDis = Math.max(maxMoveDis, distanceX);
         // // 竖向滑动且y轴滑动的值比旧值大的话，更新一下最大值
         // } else if (directionLocked === 'vertical') {
         //     maxMoveDis = Math.max(maxMoveDis, distanceY);
         // // 不锁定滑动方向的话，取x轴和y轴中最大的值，更新一下
         // } else {
         //     maxMoveDis = Math.max(maxMoveDis, distanceX, distanceY);
         // }
 
         // 滑动则取消单击的延时事件
         resetTimer();
 
         // 触发滑动中事件
         util._trigger(eventList.SWIPING, el, event);
 
         // 滑动时差超过300ms时，重置一下开始时间
         if (now - touchStartTime > 300) {
             touchStartTime = now;
             event._m_touch_data.touchStartTime = touchStartTime;
         }
 
         //  if (distanceX > config.tapMaxDistance) {
         //      event.preventDefault();
         //  }
     };
 
     // 触屏结束函数
     const touchend = (event) => {
         if (!isTouchStart) {
             return;
         }
 
         const now = Date.now();
         const touch = util.hasTouch ? event.changedTouches[0] : event;
 
         x2 = touch.pageX;
         y2 = touch.pageY;
 
         // 记录滑动初始值，为swipe事件传递更多值
         event._m_touch_data = {
             startX: x1,
             startY: y1,
             touchStartTime,
             directionLocked,
         };
 
         // 触发滑动结束事件
         util._trigger(eventList.SWIPE_END, el, event);
 
         const distanceX = Math.abs(x1 - x2);
         const distanceY = Math.abs(y1 - y2);
 
         // 如果开始跟结束坐标距离在允许范围内则触发单击事件
         if (distanceX <= config.tapMaxDistance && distanceY <= config.tapMaxDistance) {
             // 如果没有绑定双击事件，则立即触发单击事件
             if (!el._m_touch_events[eventList.DOUBLE_TAP] || !el._m_touch_events[eventList.DOUBLE_TAP].length) {
                 triggerSingleTap(event);
                 lastTouchTime = now;
 
                 // 如果距离上一次触屏的时长大于双击延时时长，延迟触发单击事件
             } else if (now - lastTouchTime > config.doubleTapDelay) {
                 tapTimer = setTimeout(() => {
                     triggerSingleTap(event);
                 }, config.doubleTapDelay);
 
                 lastTouchTime = now;
 
                 // 如果距离上一次触屏的时长在双击延时时长内
                 // 则清除单击事件计时器，并触发双击事件
             } else {
                 resetTimer();
                 util._trigger(eventList.DOUBLE_TAP, el, event);
                 // 双击后重置最后触屏时间为0，是为了从新开始计算下一次双击时长
                 lastTouchTime = 0;
             }
         // 触发方向滑动事件
         // 如果滑动时长在允许的范围内，且滑动距离超过了最小控制阀值，触发方向滑动事件
         } else if (now - touchStartTime <= config.swipeTime && (distanceX > config.swipeMinDistance || distanceY > config.swipeMinDistance)) {
             // 滑动方向LEFT, RIGHT, UP, DOWN
             const direction = util.swipeDirection(x1, y1, x2, y2, directionLocked);
 
             resetTimer();
 
             // 滑动结束时的方向和滑动时方向一样则触发swipexxx事件
             if (direction === moveDirection) {
                 util._trigger(eventList[`SWIPE_${moveDirection}`], el, event);
             // 否则认为是取消滑动
             } else {
                 cancel(event);
             }
         } else {
             cancel(event);
         }
 
         isTouchStart = false;
     };
 
     // 绑定触屏开始事件
     el.addEventListener(eventList.TOUCH_START, touchstart);
     // 绑定触屏滑动事件
     el.addEventListener(eventList.TOUCH_MOVE, touchmove);
     // 绑定触屏结束事件
     el.addEventListener(eventList.TOUCH_END, touchend);
     // 绑定触屏取消事件
     el.addEventListener(eventList.TOUCH_CANCEL, cancel);
 
     // 标记该节点已经绑定过touch事件了
     el._m_touch_is_bind = true;
 }
 
 /**
  * touch相关主函数
  * @param {object} el dom节点
  */
 class Mtouch {
     constructor (elems) {
         [].forEach.call(elems, (el, index) => {
             // 将事件结合保存在dom节点上，以达到共享的目的
             el._m_touch_events = el._m_touch_events || {};
             bindTouchEvents(el);
             this[index] = el;
         });
 
         this.length = elems.length;
     }
 
     each (handler) {
         let i = 0;
         const len = this.length;
 
         for (; i < len; i++) {
             handler.call(this[i], i);
         }
 
         return this;
     }
 
     /**
      * 绑定事件函数，支持事件委托
      * @param {string} eventType 事件类型，可同时绑定多个事件，用空格隔开
      * @param [string] proxyStr 事件委托选择器（可选）
      * @param {function} 事件监听回调函数
      */
     on (eventType, proxyStr, handler) {
         // 参数预处理
         if (typeof proxyStr === 'function') {
             handler = proxyStr;
             proxyStr = null;
         }
         if (typeof handler !== 'function' || !eventType || !eventType.length) {
             return this;
         }
 
         // 拆分多个事件类型
         const eventTypesArr = eventType.split(/\s+/);
 
         this.each(function _ () {
             const _events = this._m_touch_events;
 
             eventTypesArr.forEach((type) => {
                 // 如果未绑定过该事件，则创建一个
                 if (!_events[type]) {
                     _events[type] = [];
                 }
 
                 _events[type].push({
                     handler,
                     proxyStr,
                 });
             });
         });
 
         return this;
     }
 
     /**
      * 解绑事件
      * @param {string} eventType 事件类型
      * @param {string} proxyStr 事件委托选择器
      */
     off (eventType, proxyStr, handler) {
         if (typeof proxyStr === 'function') {
             handler = proxyStr;
             proxyStr = null;
         }
 
         this.each(function _ () {
             const _events = this._m_touch_events;
 
             // 没有传事件类型，则解绑所有事件
             if (!eventType) {
                 this._m_touch_events = {};
                 return;
             }
 
             if (!_events[eventType] || !_events[eventType].length) {
                 return;
             }
 
             // 如果不需解绑代理及特定的回调，直接清空绑定的所有事件
             if (!proxyStr && !handler) {
                 _events[eventType] = [];
                 return;
             }
 
             const handlerList = _events[eventType];
             let len = handlerList.length - 1;
             let handlerObj;
 
             // 遍历事件数组，删除相应事件
             while (len >= 0) {
                 handlerObj = handlerList[len];
 
                 if (proxyStr && typeof handler === 'function') {
                     if (handlerObj.proxyStr === proxyStr && handlerObj.handler === handler) {
                         handlerList.splice(len, 1);
                     }
                 } else if (proxyStr && handlerObj.proxyStr === proxyStr) {
                     handlerList.splice(len, 1);
                 } else if (typeof handler === 'function' && handlerObj.handler === handler) {
                     handlerList.splice(len, 1);
                 }
 
                 len -= 1;
             }
         });
 
         return this;
     }
 
     static config (cfg) {
         Object.assign(config, cfg);
     }
 }
 
 export default Mtouch;
 