// import {VideoDecoder, VideoDecoderInit} from "dom-webcodecs"
// import "dom-webcodecs"
// import "webrtc"
// import {} 

//单例设计videoDecoder？
export class WebVideoDecoder{
    private static videoDecoder: VideoDecoder;

    private constructor(init: VideoDecoderInit){
        WebVideoDecoder.videoDecoder = new VideoDecoder(init)
    }

    static getInstance(init: VideoDecoderInit) {
        if (!WebVideoDecoder.videoDecoder) {
             new WebVideoDecoder(init)
        }
        return WebVideoDecoder.videoDecoder;
    }

}



// let decoder = new VideoDecoder({
//     output : frame => {
//       ctx.drawImage(frame, 0, 0, offscreen.width, offscreen.height);

//       // Close ASAP.
//       frame.close();

//       // Draw some optional stats.
//       ctx.font = '35px sans-serif';
//       ctx.fillStyle = "#ffffff";
//       ctx.fillText(getFrameStats(), 40, 40, offscreen.width);
//     },
//     error : e => console.error(e),
//   });

//   demuxer.getConfig().then((config) => {
//     offscreen.height = config.codedHeight;
//     offscreen.width = config.codedWidth;

//     decoder.configure(config);
//     demuxer.start((chunk) => { decoder.decode(chunk); })
//   });
// })