<template>
  <canvas ref="canvas" class="w-full"></canvas>
</template>

<script lang="ts">
import { ref, onMounted } from 'vue'
import { processImage } from '@/controllers/images'

export default {
  setup() {
    const imagePath = ref('/apples.png') // Store image path
    const canvas = ref<HTMLCanvasElement | null>(null)

    onMounted(() => {
      if (!canvas.value) throw new Error('Canvas not found')

      const ctx = canvas.value.getContext('2d')
      if (ctx) {
        const img = new Image()

        img.onload = () => {
          if (!canvas.value) throw new Error('Canvas not found')

          const ratio = img.width / img.height
          canvas.value.height = canvas.value.width / ratio

          ctx.drawImage(img, 0, 0, canvas.value.width, canvas.value.height)
          processImage(ctx, img)
        }

        img.src = imagePath.value
      }
    })

    

    return {
      imagePath,
      canvas,
    }
  },
}
</script>
