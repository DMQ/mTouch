import Mtouch from './mtouch';

/** 
 * @param {string} selector 元素选择器
 */
function mTouch(selector) {
    let elems;
    if (selector === document || selector.nodeType === 1) {
        elems = [selector];
    } else {
        elems = document.querySelectorAll(selector);
    }

    return new Mtouch(elems);
};
//配置touch事件相关控制的接口
mTouch.config = Mtouch.config;

export default mTouch;
