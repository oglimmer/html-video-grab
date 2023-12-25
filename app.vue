<script setup lang="ts">
import { ref } from 'vue';
import type { Ref } from 'vue';

const devicesList : Ref<MediaDeviceInfo[]> = ref([]);
const videoRef : Ref<HTMLVideoElement | null> = ref(null);
const listOfImages : Ref<HTMLImageElement[]> = ref([]);
const videoActive = ref(false);

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

const playVideo = async () => {
  videoRef.value?.play();
}

const pauseVideo = async () => {
  videoRef.value?.pause();
}

const grabFrame = async () => {
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.value!.videoWidth;
    canvas.height = videoRef.value!.videoHeight;
    canvas.getContext('2d')!.drawImage(videoRef.value!, 0, 0);
    const data = canvas.toDataURL('image/png');
    const image = new Image();
    image.src = data;
    if (listOfImages.value.length > 2) {
      listOfImages.value.shift();
    }
    listOfImages.value.push(image);
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

</script>

<template>
  <h1>Pinky promise! This page does not send any data anywhere!</h1>
  <div>
    Devices:
  </div>
  
  <ul>
    <li v-for="d in devicesList">
      {{ d.label }} ({{ d.deviceId }}) 
      <button v-if="d.kind==='videoinput'" @click="useDevice(d.deviceId)">use</button>
      <span v-if="d.kind!=='videoinput'">[{{ d.kind }}]</span>
    </li>
  </ul>
  <button @click="listDevicesPermission">list devices (with permission)</button> &nbsp;
  <button @click="listDevicesNoPermission">list devices (without permission)</button>
  
  <hr>
  
  <div>
    <video ref="videoRef"></video>
  </div>
  <button v-if="videoActive" @click="playVideo">play</button> &nbsp;
  <button v-if="videoActive" @click="pauseVideo">pause</button> &nbsp;
  <button v-if="videoActive" @click="grabFrame">grabFrame</button> &nbsp;
  <hr>

  <div>
    <img v-for="img in listOfImages" :src="img.src" />
  </div>
  
</template>

<style scoped>
img {
  width: 200px;
}
</style>
