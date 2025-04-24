<template>
  <div class="waveform-wrapper">
    <div ref="waveformContainer" class="waveform-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import WaveSurfer from "wavesurfer.js";

const props = defineProps({
  src: { type: String, required: true },
});

const waveformContainer = ref(null);
let wave = null;

onMounted(async () => {
  await nextTick();

  if (!waveformContainer.value) {
    console.error("❌ Waveform container is missing");
    return;
  }

  wave = WaveSurfer.create({
    container: waveformContainer.value,
    waveColor: "#ccc",
    progressColor: "#2196f3",
    height: 80,
    responsive: true,
  });

  wave.load(props.src);
});

onBeforeUnmount(() => {
  if (wave) wave.destroy();
});
</script>

<style scoped>
.waveform-wrapper {
  width: 100%;
}
.waveform-container {
  width: 100%;
  height: 80px;
  background-color: #f4f4f4;
}
</style>
