<template>
  <div>
  <a href="https://vitejs.dev" target="_blank">
    <img src="/vite.svg" class="logo" alt="Vite logo" />
  </a>
  <!-- <a href="https://vuejs.org/" target="_blank">
    <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
  </a> -->
</div>
<!-- <h1>{{ msg }}</h1> -->
<h1>12323131312</h1>
<button id="record" @click="onButtonClicked()">Record</button>
<video id ="src" autoplay muted width=1280 height=720></video>
<p>
  Check out
  <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
    >create-vue</a
  >, the official Vue + Vite starter
</p>
<p>
  Install
  <a href="https://github.com/johnsoncodehk/volar" target="_blank">Volar</a>
  in your IDE for a better DX
</p>
<p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<script  lang="ts">
import { getCurrentInstance, ref } from 'vue'
import {onMounted} from 'vue'
import { codec } from 'poco-codec'

export default{

  // data(){

    

  //   return {
    
  //     button,encodeWorker,stream,videoTrack,

  //     constraints : {
  //       audio: false,
  //       video: {width: 1280, height: 720, frameRate: 30}
  //     }
  //   }

  // },


  async setup () {

    let button: HTMLButtonElement;
    let encodeWorker = new Worker('js/encode-worker.js');
    let stream: MediaStream|null = null;
    let videoTrack: MediaStreamVideoTrack|null|undefined = null;
    console.log(11111)

    let constraints = {
        audio: false,
        video: {width: 1280, height: 720, frameRate: 30}
      }

    onMounted(()=>{
      afterload()
    })

    async function afterload(): Promise<void> {
        button = document.getElementById('record') as HTMLButtonElement;
        console.log(button)
        stream = await window.navigator.mediaDevices.getUserMedia(constraints);
        let video = document.getElementById('src') as HTMLVideoElement;
        console.log(video)
        video.srcObject = stream;
    }



    
    async function startRecording() {
      if (button != null)
    {
      console.assert(button.innerText == 'Record');
      button.disabled = true;

      const handle = await window.showSaveFilePicker({
          // startIn: 'videos',
          suggestedName: 'myVideo.webm',
          types: [{
            description: 'Video File',
            accept: {'video/webm' :['.webm']}
            }],
      });
      //这里看一下stream的各个轨
      console.log(stream?.getTracks())
      videoTrack = stream?.getTracks()[0] as MediaStreamVideoTrack;
      let trackSettings = videoTrack?.getSettings();

      let trackProcessor = new MediaStreamTrackProcessor({track: videoTrack});
      let frameStream = trackProcessor.readable as unknown as Transferable;
      // Encoder I/O and file writing happens in a Worker to keep the UI
      // responsive.

      // Tell the worker to start encoding the frames and writing the file.
      // NOTE: transferring frameStream and reading it in the worker is more
      // efficient than reading frameStream here and transferring VideoFrames
      // individually. This allows us to entirely avoid processing frames on the
      // main (UI) thread.
      const message : {} = {
        type: 'start',
        fileHandle: handle,
        frameStream: frameStream,
        trackSettings: trackSettings
      }
      encodeWorker.postMessage(message, [frameStream]);

      button.innerText = 'Stop';
      button.disabled = false;
    }
  }

  function stopRecording() {
    console.log("stop recording...")
    console.assert(button?.innerText == 'Stop');
    button.innerText = 'Record';
    encodeWorker.postMessage({ type: 'stop'});
    return ;
  }

  function onButtonClicked() {
      switch(button?.innerText) {
        case 'Record':
          startRecording();
          break;
        case 'Stop':
          stopRecording();
          break;
      }   
    }

    return {
      onButtonClicked
    }

  },
  
}

</script>



<style scoped>
.read-the-docs {
  color: #888;
}
</style>
