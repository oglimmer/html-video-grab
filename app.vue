<script setup lang="ts">
import { ref } from 'vue';
import type { Ref } from 'vue';

const devicesList : Ref<MediaDeviceInfo[]> = ref([]);
const videoRef : Ref<HTMLVideoElement | null> = ref(null);
const listOfImages : Ref<HTMLImageElement[]> = ref([]);
const videoActive = ref(false);
const aliveStatus = ref(false);

const stopStream = (stream: MediaStream) => {
  videoActive.value = false;
  stream.getTracks().forEach((track: any) => {
    track.stop();
    stream.removeTrack(track);
  });
}

const listDevicesPermission = async () => {
  let stream: MediaStream|null = null;
  if ((await navigator.mediaDevices.enumerateDevices()).every((camera: any) => !camera.label)) {
    stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
  }
  const d = await navigator.mediaDevices.enumerateDevices();
  devicesList.value = d;
  if (stream) {
    stopStream(stream);
  }
}


const listDevicesNoPermission = async () => {
  const d = await navigator.mediaDevices.enumerateDevices();
  devicesList.value = d;
}

const useDevice = async (deviceId: string) => {
  if(videoRef.value!.srcObject) {
    stopStream(videoRef.value!.srcObject as MediaStream);
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { deviceId } });
  videoRef.value!.srcObject = stream;
  videoActive.value = true;
}

let interval : any = null;
const playVideo = async () => {
  videoRef.value?.play();
  interval = setInterval(check, 250);
}

const pauseVideo = async () => {
  videoRef.value?.pause();
  aliveStatus.value = false;
  if (interval) {
    clearInterval(interval);
  }
}

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const numberArray = Array.from(new Uint8Array(buffer));
  // String.fromCharCode.apply(null, numberArray); // this is limited to 2^16 - 1 bytes (see mdn docs)
  let stringData = '';
  for(var i = 0; i < Math.ceil(numberArray.length / 65536.0); i++) {
    stringData += String.fromCharCode.apply(null, numberArray.slice(i * 65536, Math.min((i+1) * 65536, numberArray.length)))
  }
  return btoa(stringData);
}

const grabFrame = async () => {
  if (videoRef.value) {
    const canvas = new OffscreenCanvas(videoRef.value.videoWidth, videoRef.value.videoHeight);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.value, 0, 0);
      const data = await canvas.convertToBlob({ type: 'image/png' });    
      const arrayBuffer = await data.arrayBuffer();
      const base64String = arrayBufferToBase64(arrayBuffer);
      const image = new Image();
      image.src = `data:image/png;base64,${base64String}`;
      if (listOfImages.value.length > 2) {
        listOfImages.value.shift();
      }
      listOfImages.value.push(image);
    }
  }
}

const onVisibilityChange = () => {
  if (typeof document !== 'undefined' && document.hidden) {
    pauseVideo();
    stopStream(videoRef.value!.srcObject as MediaStream);
    videoRef.value!.srcObject = null;
  }
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', onVisibilityChange);
}

function equalArrayBuffer(buf1: ArrayBuffer, buf2: ArrayBuffer) {
  if (buf1.byteLength != buf2.byteLength) {
    return false;
  }
  const dv1 = new Int8Array(buf1);
  const dv2 = new Int8Array(buf2);
  for (let i = 0; i != buf1.byteLength; i++) {
    if (dv1[i] != dv2[i]) {
      return false;
    }
  }
  return true;
}

let lastData = new ArrayBuffer(0);
const check = async () => {
  if (videoRef.value) {
    if (videoRef.value!.srcObject) {
      // those are not working on iPhone
      // aliveStatus.value = (<MediaStream>videoRef.value!.srcObject).active; 
      // aliveStatus.value = (<MediaStream>videoRef.value!.srcObject).getTracks().every((track: any) => track.readyState === 'live');

      const canvas = new OffscreenCanvas(videoRef.value.videoWidth, videoRef.value.videoHeight);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.value, 0, 0);
        const data = await canvas.convertToBlob({ type: 'image/png' });
        const arrayBuffer = await data.arrayBuffer();
        aliveStatus.value = !equalArrayBuffer(arrayBuffer, lastData);
        lastData = arrayBuffer;
      }
    } else {
      aliveStatus.value = false;
    }
  } else {
    aliveStatus.value = false;
  }
}

</script>

<template>
  <h1>Pinky promise! This page does not send any data anywhere!</h1>
  <div>
    Devices:
  </div>
  
  <ul>
    <li v-for="d in devicesList">
      {{ d.label }} ({{ d.deviceId }}) 
      <button v-if="d.kind==='videoinput'" @click="useDevice(d.deviceId)">use this source</button>
      <span v-if="d.kind!=='videoinput'">[{{ d.kind }}]</span>
    </li>
  </ul>
  <button @click="listDevicesPermission">list devices (with permission)</button> &nbsp;
  <button @click="listDevicesNoPermission">list devices (without permission)</button>
  
  <hr>
  Alive: {{ aliveStatus }}
  <hr>
  
  <div>
    <video ref="videoRef" playsinline disable-remote-playback disable-picture-in-picture></video>
  </div>
  <button v-if="videoActive" @click="playVideo">start video</button> &nbsp;
  <button v-if="videoActive" @click="pauseVideo">pause video</button> &nbsp;
  <button v-if="videoActive" @click="grabFrame">grab frame</button> &nbsp;
  <hr>

  <div>
    <img v-for="img in listOfImages" :src="img.src" />
  </div>
  
</template>

<style scoped>
img {
  width: 200px;
}
video {
  width: 360px;
}
</style>
