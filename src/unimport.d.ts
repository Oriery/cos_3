export {}
declare global {
  const pushNotify: typeof import('/Users/sasha/repositories/cos_3/src/main')['pushNotify']
}
// for vue template auto import
import { UnwrapRef } from 'vue'
declare module 'vue' {
  interface ComponentCustomProperties {
    readonly pushNotify: UnwrapRef<typeof import('/Users/sasha/repositories/cos_3/src/main.ts')['pushNotify']>
  }
}
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    readonly pushNotify: UnwrapRef<typeof import('/Users/sasha/repositories/cos_3/src/main.ts')['pushNotify']>
  }
}
