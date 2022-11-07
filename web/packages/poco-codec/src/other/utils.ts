import {MP4Demuxer} from './type'
import {WebVideoDecoder} from './decoder'
import {transcodeDemo} from '../tool/demo'
// import {beginEncode} from './encode'

// import  'dom-webcodecs';

let mediaStream: MediaStream;

//video decode（也许这也应该开两个worker）
export async function decode(location: string) {
    //这里直接读取一个具体的地址，获取文件
    //也许优化方案是读取一个流？
    let demuxer = new MP4Demuxer(location);
    const trackGenerator = new MediaStreamTrackGenerator({ kind: 'video' });
    let framewWriter = trackGenerator.writable.getWriter();
    mediaStream = new MediaStream([trackGenerator])
    let framecount: number = 0;
    let deocodeInit: VideoDecoderInit = {
        output : frame => {
            framewWriter.write(frame);
            framecount++;
            console.log(framecount)
        },
        error : e => console.error(e)
    };
    let decoder = WebVideoDecoder.getInstance(deocodeInit)
    

    demuxer.getConfig().then((config) => {        
        decoder.configure(config);
        demuxer.start((chunk: EncodedVideoChunk) => { decoder.decode(chunk); })
    })
} 

// export async function encode(mediaStream: MediaStream){
//     beginEncode(mediaStream)
// }

export function transcode(location: string){
    console.log(location);
   transcodeDemo();
    // encode(mediaStream);
}