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

