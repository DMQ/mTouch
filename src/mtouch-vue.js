import Mtouch from './mtouch';

const dir = {
    bind (el) {
        if (!el._m_touch) {
            el._m_touch = new Mtouch([el]);
        }
    },

    inserted (...args) {
        dir.update(...args);
    },

    update (el, binding) {
        const event = binding.arg;
        const selector = el.getAttribute(`${event}-selector`);
        let handler = binding.value;

        if (el[`_m_touch_handler_${binding.arg}`]) {
            el._m_touch.off(event, selector || el[`_m_touch_handler_${binding.arg}`], el[`_m_touch_handler_${binding.arg}`]);
        }

        if (!event) {
            console.warn('[vue-mtouch] event type argument is required.');
        }
        if (typeof handler !== 'function') {
            console.warn('[vue-mtouch] handler must is a function');
        }

        if (binding.modifiers.stop) {
            handler = util.stopFilter(handler);
        }
        if (binding.modifiers.prevent) {
            handler = util.preventFilter(handler);
        }

        el[`_m_touch_handler_${binding.arg}`] = handler;

        el._m_touch.on(event, selector, handler);
    },

    unbind (el, binding) {
        el[`_m_touch_handler_${binding.arg}`] = null;

        if (!el._m_touch) return;

        el._m_touch.off();
        el._m_touch = null;
    },
};

//  指令安装器
const plugin = {};

plugin.config = Mtouch.config;

plugin.install = function mTouchInstall () {
    Vue.directive('touch', dir);
};

export default plugin;

