<template>
  <div>
    <div>
      <v-text-field
        v-model="imageUrl"
        label="Image URL"
      />
    </div>
    <div class="flex flex-row gap-2 p-2 bg-blue-700 rounded align-start">
      <ImageComponent
        :image-path="imageUrl"
        :key="imageUrl"
      />
      <div class="flex flex-col gap-2 w-[30rem]">
        <div>
          <v-select
            :items="possibleProcessorsIds"
            v-model="selectedProcessorId"
            label="Processor"
            item-title="name"
            item-value="id"
          />
        </div>
        <div
          v-for="optDescr in selectedProcessor.options"
          :key="optDescr.id"
        >
          <v-slider
            v-model="selectedProcessorOptions[optDescr.id]"
            :label="optDescr.name"
            :min="optDescr.min"
            :max="optDescr.max"
            :step="optDescr.step"
            thumb-label
            @update:model-value="debouncedTriggerToUpdateProcessedImage"
          ></v-slider>
        </div>
      </div>
      <ImageComponent
        :image-path="imageUrl"
        :image-processor="processors[selectedProcessorId]"
        :key="selectedProcessorId + triggerToUpdateProcessedImage + imageUrl"
        :processor-options="selectedProcessorOptions"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ImageComponent from '@/components/ImageComponent.vue'
import { processors } from '@/controllers/imageProcessors'
import type { ProcessorOptions } from '@/controllers/imageProcessors'
import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'
import { debounce } from 'advanced-throttle-debounce'

const imageUrl = ref(localStorage.getItem('imageUrl') ?? '/apples_100.png')

watch(imageUrl, (newImageUrl) => {
  localStorage.setItem('imageUrl', newImageUrl)
})

const selectedProcessorId: Ref<string> = ref(
  processors[Object.keys(processors)[Object.keys(processors).length - 1]].id,
) // select the last processor by default
const possibleProcessorsIds = ref(Object.values(processors))
const selectedProcessor = computed(() => processors[selectedProcessorId.value])
const selectedProcessorOptions: Ref<ProcessorOptions> = ref({})

const triggerToUpdateProcessedImage = ref(0)

watch(selectedProcessor, resetOptions, { immediate: true })

function resetOptions() {
  selectedProcessorOptions.value = {}
  selectedProcessor.value.options.forEach((option) => {
    selectedProcessorOptions.value[option.id] = option.defaultValue
  })
}

const debouncedTriggerToUpdateProcessedImage = debounce(
  () => triggerToUpdateProcessedImage.value++,
  { wait: 200, differentArgs: false },
)
</script>
