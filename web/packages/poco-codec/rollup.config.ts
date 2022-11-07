import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
import externals from "rollup-plugin-node-externals";
import OMT from "@surma/rollup-plugin-off-main-thread";
// import strip from "@rollup/plugin-strip";
import replace from "@rollup/plugin-replace";
import babel from "@rollup/plugin-babel";
import nodePolyfills from "rollup-plugin-polyfill-node";
//这里因为找不到plugin-wasm的ts描述，所以先强行正确？
//@ts-ignore
import { wasm } from '@rollup/plugin-wasm';
import * as pkg from "./package.json";
// import webWorkerLoader from 'rollup-plugin-web-worker-loader';

export default defineConfig({
    //input: "./src/index.ts",
    input: "./src/index.ts",
    
    output: [
        //要写入的文件。也可用于生成 sourcemaps，如果适用
        // {
        //     //通用模块定义，以amd，cjs 和 iife 为一体
        //     dir: "./dist",
        //     format: "system",
        //     sourcemap: true,
        //     name: pkg.name,
        //     globals: {
        //         "mp4box":"mp4box"
        //     }
        // },
        // {
        //     //将软件包保存为 ES 模块文件，在现代浏览器中可以通过 <script type=module> 标签引入
        //     file: "./dist/index.esm.js",
        //     format: "esm",
        //     sourcemap: true,
        //     globals: {
        //         "mp4box":"mp4box"
        //     }
        // },
        {
            //将软件包保存为 ES 模块文件，在现代浏览器中可以通过 <script type=module> 标签引入
            dir: "./dist",
            format: "esm",
            sourcemap: true,
            globals: {
                "mp4box":"mp4box"
            }
        },
        // {
        //     file: "./dist/index.cjs.js",
        //     format: "cjs",
        //     sourcemap: true,
        //     globals: {
        //         "mp4box":"mp4box"
        //     }
        // }
    ],
    plugins: [
        json(),
        OMT(),
        resolve(),
        nodePolyfills(),
        wasm(),
        // webWorkerLoader(),
        commonjs({
            sourceMap: true
        }),
        typescript({
            sourceMap: true,
            resolveJsonModule: true
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