//单例设计videoDecoder？
export class WebVideoEncoder{
    private static videoEncoder: VideoEncoder;

    private constructor(init: VideoEncoderInit){
        WebVideoEncoder.videoEncoder = new VideoEncoder(init)
    }

    static getInstance(init: VideoEncoderInit) {
        if (!WebVideoEncoder.videoEncoder) {
             new WebVideoEncoder(init)
        }
        return WebVideoEncoder.videoEncoder;
    }

}