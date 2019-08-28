const babel = require('rollup-plugin-babel');
const { uglify } = require('rollup-plugin-uglify');
// const sourcemaps = require('rollup-plugin-sourcemaps');

const isProd = process.env.NODE_ENV === 'production';
const entrys = ['mtouch-vue', 'mtouch-dom'];

const configsArr = entrys.map(entry => {
    const config = {
        input: `src/${entry}.js`,
        output: [{
            file: isProd ? `./dist/${entry}.min.js` : `./dist/${entry}.js`,
            format: 'umd',
            name: 'mTouch',
        }],
        plugins: [
            babel(),
        ],
    };

    if (!isProd) {
        config.output.push( {
            file: `./dist/${entry}.es.js`,
            format: 'es',
        });
    } else {
        config.plugins.push(uglify());
    }

    return config;
});

module.exports = configsArr;