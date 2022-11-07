import { MyAudioContext } from "./audiocontext";
import { WebMWriter } from "./webm-writer";

//dom操作元素
//   window.$ = document.querySelector.bind(document);

export async function transcodeDemo(){
  const demuxDecodeWorker: Worker = new Worker(new URL("../worker/demux_decode_worker.ts", import.meta.url), {
    type: "module"
  });

//   var canvas = document.querySelector("canvas");
//   var offscreen = canvas.transferControlToOffscreen();
//   document.body.appendChild(canvas);

  let writer = new WebMWriter();
//   let Button = $('button'); 
  const webm_worker: Worker = new Worker(new URL("../worker/webm-worker.ts", import.meta.url), {
    type: "module"
  });

  //按下按钮的时候，demuxDecodeWorker发送消息
//   button.addEventListener('click', ()=>{
    demuxDecodeWorker.postMessage({type: 'initialize'});
//   })



  let initResolver : null|((value?: unknown) =>void);
  let initDone = new Promise(resolver => (initResolver = resolver));  
  let myAudioContext = new MyAudioContext();
//   let num_exit = 0;

  //监听demuxDecodeWorker
  demuxDecodeWorker.addEventListener('message',async  (e) => {
    const msg = e.data;
    switch (msg.type){
    case 'initialize-done':
      console.log('demo: initialize-done')
      //这里使用无名式的初始化方法
      await writer.start();
      console.log('writer open over')
      //audiotext应该是播放的时候，校准时间的，这里似乎用处不大，先注释
      // myAudioContext.initialize();
    // audioController.initialize(e.data.sampleRate, e.data.channelCount,
    //                     e.data.sharedArrayBuffer);
      initResolver!();
      initResolver = null;
      webm_worker.postMessage({
        type: 'start',
        webm_stats_interval: msg.webm_stats_interval,
        webm_metadata: msg.webm_metadata
      })
      //转码时间得切换一下
      // demuxDecodeWorker.postMessage({type: 'start-transcode'});
      break;
    case 'error':
      onerror(msg.err);
      break;
    case 'exit':
      console.log('index: get message exit from demux decoder');
      webm_worker.postMessage({type: 'end'});
      break;
    case 'terminate':
      console.log('index: terminate触发')
      demuxDecodeWorker.terminate();
      break;
    default:
      webm_worker.postMessage(msg, [msg.data]);
      break;
  }
});
  await initDone;

function onerror(e: any) {
  console.error(e);
}

webm_worker.onerror = onerror;
webm_worker.onmessage = async ev => {
    const msg = ev.data;
    switch (msg.type) {
        //原本的exit由外部事件触发，在这里应该是根据demux_decode_worker的事件触发
        case 'exit':
            //这个是最后一步执行的
            console.log('demo: exit')
            if (msg.code !== 0) {
                onerror(`muxer exited with status ${msg.code}`);
            }
            //本方法并不会等待 worker 去完成它剩余的操作；worker 将会被立刻停止
            webm_worker.terminate();
            console.log('demo: webm_worker terminated')
            //这里似乎并没有执行
        

            //这里根据按钮是否被按下来决定是否要记录，现在改为需要记录，并且默认采用inmem记录的方式
            // if (record_el.checked) {
                const r = await writer.finish();
                // console.log(r);
                console.log(`Finished: Duration ${writer.duration}ms, Size ${writer.size} bytes`);
                // if (inmem_el.checked) {
                    const blob = new Blob(r, { type: 'video/webm' });
                    const a = document.createElement('a');
                    const filename = 'video-transcode.webm';
                    a.textContent = filename;
                    a.href = URL.createObjectURL(blob);
                    a.download = filename;
                    //这里可能会有问题，因为要直接操作document
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                // } else {
                //     rec_info.innerText += `, Filename ${writer.name}, Cues at ${r ? 'start' : 'end'}`;
                // }
            // }

            //按钮全部不需要，因此注释
            // start_el.disabled = false;
            // record_el.disabled = false;
            // pcm_el.disabled = !record_el.checked;
            // inmem_el.disabled = !record_el.checked;
            // demuxDecodeWorker.postMessage({type: 'terminate'});
            break;

        case 'start-stream':
            //第八步：主线程接受到webm_worker的start stream信号
            console.log('demo: start stream')
            //webm_muxer.js和我的目前一个显著区别在于：
            //webm_muxer的decodeconfig和encodeconfig等是在主线程获得的，
            //而我目前的东西都是在transcoder中获得的
            //哪个更好还不确定？
            demuxDecodeWorker.postMessage({type: 'start-transcode'})

            break;

        case 'muxed-data':
            //理论上来说，获得muxed-data时，就代表一个encodedchunkdata经过了decode-encode再mux的过程了
            console.log('demo: muxed-data')
            //默认要记录，因此checked注释
            // if (record_el.checked) {
            await writer.write(msg.data);
            console.log(`Recorded ${writer.size} bytes`);
            break;

        case 'stats':
            // console.log('demo: stats')
            console.log(msg.data);
            break;

        case 'error':
            console.log('demo: error')
            onerror(msg.detail);
            break;
    }
};
}