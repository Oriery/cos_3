<template>
  <div class="flex flex-row gap-2 p-2 bg-amber-700 rounded">
    <ImageComponent image-path="/apples.png" />
    <div class="flex flex-col gap-2 w-[30rem]">
      <div>
        <v-select
          :items="possibleProcessorsIds"
          v-model="selectedProcessorId"
          label="Processor"
          item-title="name"
          item-value="id"
        ></v-select>
      </div>
    </div>
    <ImageComponent
      image-path="/apples.png"
      :image-processor="processors[selectedProcessorId]"
      :key="selectedProcessorId"
    />
  </div>
</template>

<script setup lang="ts">
import ImageComponent from '@/components/ImageComponent.vue'
import { processors } from '@/controllers/imageProcessors'
import { ref } from 'vue'
import type { Ref } from 'vue'

const selectedProcessorId : Ref<string> = ref(processors.boxBlur.id)
const possibleProcessorsIds = ref(Object.values(processors))

</script>
