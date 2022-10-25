import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
import externals from "rollup-plugin-node-externals";
// import strip from "@rollup/plugin-strip";
import replace from "@rollup/plugin-replace";
import babel from "@rollup/plugin-babel";
import nodePolyfills from "rollup-plugin-polyfill-node";
// import * as pkg from "./package.json";
// import webWorkerLoader from 'rollup-plugin-web-worker-loader';

export default defineConfig({
    //input: "./src/index.ts",
    input: "./src/index.ts",
    
    output: [
        //要写入的文件。也可用于生成 sourcemaps，如果适用
        {
            //通用模块定义，以amd，cjs 和 iife 为一体
            file: "./dist/index.umd.js",
            format: "umd",
            sourcemap: true,
            name: "poco-codec",
            globals: {
                "mp4box":"mp4box"
            }
        },
        {
            //将软件包保存为 ES 模块文件，在现代浏览器中可以通过 <script type=module> 标签引入
            file: "./dist/index.esm.js",
            format: "esm",
            sourcemap: true,
            globals: {
                "mp4box":"mp4box"
            }
        },
        {
            file: "./dist/index.cjs.js",
            format: "cjs",
            sourcemap: true,
            globals: {
                "mp4box":"mp4box"
            }
        }
    ],
    // external: ['mp4box','webcodecs'],
    plugins: [
        json(),
        resolve(),
        nodePolyfills(),
        // webWorkerLoader(),
        commonjs({
            sourceMap: true
        }),
        typescript({
            sourceMap: true,
        }),
        externals({
            devDeps: false,
        }),
        replace({
            preventAssignment: true,
            __PROTOCOL_VERSION__: JSON.stringify("poco-0.1")
        }),
        babel({ babelHelpers: "bundled" }),
    ],
    watch: {
        exclude: "node_modules/**",
    },
});