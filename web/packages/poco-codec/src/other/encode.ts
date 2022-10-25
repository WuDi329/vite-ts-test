import {max_video_config} from './resolution.js';

import { WebMWriter } from './webm-writer.js';

function onerror(e: ErrorEvent) {
    console.error(e);
}

let video_track: MediaStreamVideoTrack;
let audio_track: MediaStreamAudioTrack | null;
let video_readable: ReadableStream;
let audio_readable: ReadableStream;
let video_settings: MediaTrackSettings;
let audio_settings: MediaTrackSettings;
let writer: WebMWriter;


// See https://www.webmproject.org/vp9/mp4/
// and also https://googlechrome.github.io/samples/media/vp9-codec-string.html
//以下是vp9的codec设置
const vp9_params = {
    profile: 0,
    level: 10,
    bit_depth: 8,
    //fixed 1
    chroma_subsampling: 1
    // chroma_subsampling: chroma_el.value ? 2 : 1
};
const vp9c = Object.fromEntries(Object.entries(vp9_params).map(
    ([k, v]) => [k, v.toString().padStart(2, '0')]));
    //这里的chroma_subsampling也许是要根据输入来确定？
const vp9_codec = `vp09.${vp9c.profile}.${vp9c.level}.${vp9c.bit_depth}.${vp9c.chroma_subsampling}`;//vp09.00.10.08.01

// See https://github.com/ietf-wg-cellar/matroska-specification/blob/master/codec/av1.md
    // and also https://aomediacodec.github.io/av1-isobmff/#codecsparam
    //以下是av1的codec设置
    const av1_params = {
        profile: 0,
        level: 0,
        tier: 0,
        high_bitdepth: 0,
        twelve_bit: false,
        monochrome: false,
        chroma_subsampling_x: 0,
        chroma_subsampling_y: 0,
        // chroma_subsampling_x: !!chroma_el.value,
        // chroma_subsampling_y: !!chroma_el.value,
        chroma_sample_position: 0,
    };
    const av1_bitdepth = 8 + av1_params.high_bitdepth * (av1_params.profile === 2 && av1_params.twelve_bit ? 4 : 2)
    const av1_codec = `av01.${av1_params.profile}.${av1_params.level.toString().padStart(2, '0')}${av1_params.tier === 0 ? 'M' : 'H'}.${av1_bitdepth.toString().padStart(2, '0')}.${av1_params.chroma_subsampling_x+0}${av1_params.chroma_subsampling_y+0}${av1_params.chroma_sample_position}`;//.${av1_params.chroma_subsampling_x+0}${av1_params.chroma_subsampling_y+0}${av1_params.chroma_sample_position}`;


    //这个是encoder的config，应该整体传入encode方法
    const encoder_constraints = {
        //codec: 'avc1.42E01E',
        // codec: codec === 'av01' ? av1_codec : vp9_codec,
        codec: av1_codec,
        //width应该和原来的width相同，但是这里先写死成640
        width: 640,
        //height应该和原来的height相同，但是这里先写死成360
        height: 360,
        bitrate: 2500 * 1000,
        //framerate应该和原来的framerate相同，但是这里先写死成30
        framerate: 30,
        latencyMode: 'realtime',
    };



    const video_worker = new Worker('./worker/encoder-worker.js');
    video_worker.onerror = onerror;
    video_worker.onmessage = relay_data;

    const audio_worker = new Worker('./worker/encoder-worker.js');
    audio_worker.onerror = onerror;
    audio_worker.onmessage = relay_data;

    
    let num_exits = 0;
    let video_encoder_config : {width: number, height: number, label: string, ratio: number} | null;


    function relay_data(ev: MessageEvent) {
        const msg = ev.data;
        switch (msg.type) {
            case 'error':
                onerror(msg.detail)
                break;

            case 'exit':
                if (++num_exits === 2) {
                    webm_worker.postMessage({ type: 'end' });
                }
                break;

            default:
                webm_worker.postMessage(msg, [msg.data]);
                break;
        }
    }

    //主要需要改动的地方是这些。。他们使用message相互交互
    const webm_worker = new Worker('./webm-worker.js');
    webm_worker.onerror = onerror;
    webm_worker.onmessage = async ev => {
        const msg = ev.data;
        switch (msg.type) {
            case 'exit':
                if (msg.code !== 0) {
                    onerror(new ErrorEvent('muxer exited with status ${msg.code}'));
                }
                webm_worker.terminate();
                video_worker.terminate();
                audio_worker.terminate();
                exited = true;

                //如果record按钮被记录，现在假定所有都需要记录
                // if (record_el.checked) {
                    const r = await writer.finish();
                    //这一块直接用log输出
                    // rec_info.innerText = `Finished: Duration ${writer.duration}ms, Size ${writer.size} bytes`;
                    console.log(`Finished: Duration ${writer.duration}ms, Size ${writer.size} bytes`);

                    console.log(`Filename ${writer.name}, Cues at ${r ? 'start' : 'end'}`);

                    // //这里是如果选中了in-memory button
                    // if (inmem_el.checked) {
                    //     const blob = new Blob(r, { type: 'video/webm' });
                    //     const a = document.createElement('a');
                    //     const filename = 'camera.webm';
                    //     a.textContent = filename;
                    //     a.href = URL.createObjectURL(blob);
                    //     a.download = filename;
                    //     document.body.appendChild(a);
                    //     a.click();
                    //     document.body.removeChild(a);
                    // } else {
                    //     //这句被我提出来了
                        //console.log(`Filename ${writer.name}, Cues at ${r ? 'start' : 'end'}`);
                    // }
                // }

                break;

            case 'start-stream':
                //under start-stream ,main thread post message to video_worker&audio_worker
                video_worker.postMessage({message: {
                    type: 'start',
                    readable: video_readable,
                    key_frame_interval,
                    config: video_encoder_config
                }, transferable: [video_readable]});

                audio_worker.postMessage({message: {
                    type: 'start',
                    audio: true,
                    readable: audio_readable,
                    config: {
                        // codec: pcm_el.checked ? 'pcm' : 'opus',
                        codec: 'opus',
                        bitrate: 128 * 1000,
                        sampleRate: audio_settings.sampleRate,
                        // numberOfChannels: audio_settings.numberOfChannels
                    }
                }, transferable: [audio_readable]});
                break;

            case 'muxed-data':
                // if (record_el.checked) {
                    await writer.write(msg.data);
                    console.log(`Recorded ${writer.size} bytes`);
                // }
                queue.push(msg.data);
                // if (!pcm_el.checked) {
                //     remove_append();
                // }
                break;

            case 'stats':
                console.log(msg.data);
                break;

            case 'error':
                onerror(msg.detail);
                break;
        }
    };

export async function beginEncode(mediaStream: MediaStream){
    video_track = <MediaStreamVideoTrack>mediaStream.getVideoTracks()[0];
    audio_track = <MediaStreamAudioTrack>mediaStream.getAudioTracks()[0];
    video_readable = (new MediaStreamTrackProcessor({track: video_track})).readable;
    audio_readable = (new MediaStreamTrackProcessor({track: audio_track})).readable;
    video_settings = video_track.getSettings();


    console.log(`video resolution: ${video_settings.width}x${video_settings.height}`);
    console.log(`encoder resolution: ${video_encoder_config?.width}x${video_encoder_config?.height}`);
    audio_settings = audio_track.getSettings();

    await getVideoConfig();
    
    writer = new WebMWriter();
    try {
        //这里直接给camera.webm，也就是采用disk的方式运行
        await writer.start('camera.webm');
    } catch (ex) {
        throw ex;
    }

    start();

    
}

// let video_track, audio_track;

async function getVideoConfig(){
    //这个config应该是上层传下来的参数，如果只是做演示，可以写死？
    video_encoder_config = await max_video_config({
        ...encoder_constraints,
        //ratio应该是用原来的数据进行运算，但是这里先写死
        // ratio: 640 / 360
        ratio: (<number>video_settings.width) / (<number>video_settings.height)
    }) || await max_video_config(encoder_constraints);
}


    
    

    // const stream = await navigator.mediaDevices.getUserMedia({
    //     audio: {
    //       echoCancellation: false,
    //       channelCount: 2
    //     },
    //     video: {
    //         width: 4096,
    //         height: 2160,
    //         frameRate: {
    //             ideal: 30,
    //             max: 30
    //         }
    //     }
    // });







    //应该是用原来的数据进行log，但是这里先注释






    let exited = false;
    const queue = [];
    const key_frame_interval = 1;

    


    //这个start需要靠别的地方调用了，也许暴露出来的就是start，codec_id等传入进来
    function start() {
        //这里需要改，连带着webm_worker，和code_worker也需要改
        webm_worker.postMessage({
            type: 'start',
            webm_stats_interval: 1000,
            //webm_receiver: './test-receiver.js',
            webm_metadata: {
                max_cluster_duration: BigInt(2000000000),
                video: {
                    width: video_encoder_config?.width,
                    height: video_encoder_config?.height,
                    //video_settings从video_track而来
                    frame_rate: video_settings.frameRate,
                    //codec_id: 'V_MPEG4/ISO/AVC'
                    //等待修改：这里先写死成V_AV1
                    // codec_id: codec === 'av01' ? 'V_AV1' : 'V_VP9',
                    codec_id: 'V_AV1',
                    //等待修改：这里先写死成av1_params
                    ...(av1_params)
                    // ...(codec === 'av01' ? av1_params : vp9_params)
                },
                audio: {
                    // bit_depth: pcm_el.checked ? 32 : 0,
                    bit_depth: 0,
                    //audio_settings从audio_track而来
                    sample_rate: audio_settings.sampleRate,
                    // 报错audio_settings没有channelcount
                    // channels: audio_settings.channelCount,
                    // codec_id: pcm_el.checked ? 'A_PCM/FLOAT/IEEE' : 'A_OPUS'
                    codec_id: 'A_OPUS'
                }
            }
        });
    }


    //媒体资源对象接口
    // const source = new MediaSource();


    //Fired when the MediaSource instance has been opened by a media element 
    // and is ready for data to be appended to the SourceBuffer objects in sourceBuffers.
    // source.addEventListener('sourceopen', function () {
    //     //source represents a chunk of media to be passed into an HTMLMediaElement and played, via a MediaSource object. 
    //     buffer = this.addSourceBuffer(`video/webm; codecs=${codec === 'av01' ? av1_codec : vp9_codec},opus`);
    //     //updateend: Fired after SourceBuffer.appendBuffer() or SourceBuffer.remove() ends. This event is fired after update.
    //     //update: Fired whenever SourceBuffer.appendBuffer() or SourceBuffer.remove() completes. 
    //     //SourceBuffer.updating changes from true to false. This event is fired before updateend.
    //     buffer.addEventListener('updateend', remove_append);
    //     start();
    // });


