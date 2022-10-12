import {MP4Demuxer} from './type'
import {WebVideoDecoder} from './decoder'
// import  'dom-webcodecs';

export async function decode(location: string) {
    let demuxer = new MP4Demuxer("./bbb.mp4");
    let framecount: number = 0;
    let deocodeInit: VideoDecoderInit = {
        output : frame => {
            frame.close();
            framecount++;
            console.log(framecount);
        },
        error : e => console.error(e)
    };
    let decoder = WebVideoDecoder.getInstance(deocodeInit)
    

    demuxer.getConfig().then((config) => {        
        decoder.configure(config);
        demuxer.start((chunk: EncodedVideoChunk) => { decoder.decode(chunk); })
      })
} 