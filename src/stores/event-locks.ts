import type { Id } from '@feathersjs/feathers'
import { reactive } from 'vue'
import type { MaybeArray } from '../types.js'
import { getArray } from '../utils/index.js'
import type { EventLocks, EventName } from './types.js'

export function useServiceEventLocks() {
  const eventLocks = reactive<EventLocks>({
    created: {},
    patched: {},
    updated: {},
    removed: {},
  })

  function toggleEventLock(data: MaybeArray<Id>, event: EventName) {
    const { items: ids } = getArray(data)
    ids.forEach((id) => {
      const currentLock = eventLocks[event][id]
      if (currentLock) {
        clearEventLock(data, event)
      }
      else {
        eventLocks[event][id] = true
        // auto-clear event lock after 250 ms
        setTimeout(() => {
          clearEventLock(data, event)
        }, 250)
      }
    })
  }
  function clearEventLock(data: MaybeArray<Id>, event: EventName) {
    const { items: ids } = getArray(data)
    ids.forEach((id) => {
      delete eventLocks[event][id]
    })
  }
  return { eventLocks, toggleEventLock, clearEventLock }
}
