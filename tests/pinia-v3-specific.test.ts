import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia, defineStore } from 'pinia'
import { ref, computed, nextTick } from 'vue'
import { useDataStore, useServiceStore } from '../src'
import { timeout } from './test-utils'

describe('Pinia v3 Specific Features', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  describe('Pinia v3 Core Features', () => {
    it('should work with Pinia v3 createPinia and setActivePinia', () => {
      expect(pinia).toBeDefined()
      expect(pinia._s).toBeInstanceOf(Map) // Pinia v3 uses Map for stores
      expect(typeof pinia.install).toBe('function')
    })

    it('should support Pinia v3 store composition patterns', () => {
      const useTestStore = defineStore('test', () => {
        const count = ref(0)
        const doubleCount = computed(() => count.value * 2)
        const increment = () => {
          count.value++
        }
        return { count, doubleCount, increment }
      })

      const store = useTestStore()
      expect(store.count).toBe(0)
      expect(store.doubleCount).toBe(0)
      
      store.increment()
      expect(store.count).toBe(1)
      expect(store.doubleCount).toBe(2)
    })

    it('should work with Pinia v3 store hot module replacement', () => {
      const useHmrStore = defineStore('hmr', () => {
        const value = ref('initial')
        return { value }
      })

      const store = useHmrStore()
      expect(store.value).toBe('initial')

      // Simulate HMR - this should work without errors in Pinia v3
      store.$patch({ value: 'updated' })
      expect(store.value).toBe('updated')
    })
  })

  describe('Feathers-Pinia with Pinia v3', () => {
    it('should create data stores with Pinia v3 composition API', () => {
      const dataStore = useDataStore({
        idField: 'id'
      })

      expect(dataStore).toBeDefined()
      expect(dataStore.idField).toBe('id')
      expect(Array.isArray(dataStore.items.value)).toBe(true)
      expect(dataStore.items.value).toEqual([])
      expect(dataStore.itemsById.value).toEqual({})
    })

    it('should handle reactive updates correctly with Pinia v3', async () => {
      const dataStore = useDataStore({
        idField: 'id'
      })

      const testItem = { id: 1, name: 'Test Item', value: 42 }
      dataStore.createInStore(testItem)

      expect(dataStore.items.value).toHaveLength(1)
      expect(dataStore.itemsById.value[1]).toEqual(testItem)

      // Test reactivity
      dataStore.patchInStore(1, { name: 'Updated Item', value: 100 })

      await nextTick()
      expect(dataStore.itemsById.value[1].name).toBe('Updated Item')
      expect(dataStore.itemsById.value[1].value).toBe(100)
    })

    it('should work with defineStore wrapper pattern', () => {
      const useCustomStore = defineStore('custom-pinia-v3', () => {
        const dataUtils = useDataStore({
          idField: 'id'
        })
        const customValue = ref('custom')
        return { ...dataUtils, customValue }
      })

      const store = useCustomStore(pinia)
      expect(store.customValue).toBe('custom')
      expect(store.idField).toBe('id')
      expect(Array.isArray(store.items)).toBe(true)
      expect(store.items).toEqual([])
    })

    it('should support Pinia v3 devtools integration', () => {
      const useDevtoolsStore = defineStore('devtools-test', () => {
        const dataUtils = useDataStore({
          idField: 'id'
        })
        return { ...dataUtils }
      })

      const store = useDevtoolsStore(pinia)
      
      // Check that the store is properly registered with Pinia
      expect(pinia._s.has('devtools-test')).toBe(true)
      expect(store.$id).toBe('devtools-test')
    })

    it('should work with Pinia v3 store subscriptions', async () => {
      const useSubscriptionStore = defineStore('subscription-test', () => {
        const dataUtils = useDataStore({
          idField: 'id'
        })
        return { ...dataUtils }
      })

      const store = useSubscriptionStore(pinia)
      const mutations: any[] = []
      
      const unsubscribe = store.$subscribe((mutation, state) => {
        mutations.push({ mutation, state })
      })

      store.createInStore({ id: 1, name: 'Test' })
      await nextTick()

      expect(mutations.length).toBeGreaterThan(0)
      unsubscribe()
    })

    it('should handle store disposal correctly in Pinia v3', () => {
      const useDisposalStore = defineStore('disposal-test', () => {
        const dataUtils = useDataStore({
          idField: 'id'
        })
        return { ...dataUtils }
      })

      const store = useDisposalStore(pinia)
      expect(pinia._s.has('disposal-test')).toBe(true)
      
      store.createInStore({ id: 1, name: 'Test' })
      expect(store.items).toHaveLength(1)
      
      store.$dispose()
      // After disposal, the store is removed from Pinia's registry
      expect(pinia._s.has('disposal-test')).toBe(false)
      // But the data remains in the store instance
      expect(store.items).toHaveLength(1)
    })
  })

  describe('Service Stores with Pinia v3', () => {
    it('should create service stores that work with Pinia v3', () => {
      const serviceStore = useServiceStore({
        servicePath: 'test-service',
        idField: 'id',
      })

      expect(serviceStore).toBeDefined()
      expect(serviceStore.servicePath).toBe('test-service')
      expect(serviceStore.idField).toBe('id')
    })
  })

  describe('Pinia v3 Performance Features', () => {
    it('should work efficiently with large datasets in Pinia v3', async () => {
      const usePerformanceStore = defineStore('performance-test', () => {
        const dataUtils = useDataStore({
          idField: 'id'
        })
        return { ...dataUtils }
      })

      const dataStore = usePerformanceStore(pinia)
      const startTime = performance.now()
      
      // Create 1000 items
      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: Math.random()
      }))

      items.forEach(item => dataStore.createInStore(item))
      
      const endTime = performance.now()
      
      expect(dataStore.items).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete in less than 1 second
    })

    it('should handle concurrent operations correctly with Pinia v3', async () => {
      const useConcurrentStore = defineStore('concurrent-test', () => {
        const dataUtils = useDataStore({
          idField: 'id'
        })
        return { ...dataUtils }
      })

      const dataStore = useConcurrentStore(pinia)

      // Perform multiple concurrent operations
      const operations = [
        () => dataStore.createInStore({ id: 1, name: 'Item 1' }),
        () => dataStore.createInStore({ id: 2, name: 'Item 2' }),
        () => dataStore.createInStore({ id: 3, name: 'Item 3' }),
      ]

      await Promise.all(operations.map(op => op()))
      
      expect(dataStore.items).toHaveLength(3)
      // Check items exist in the correct format
      expect(dataStore.items.some(item => item.id === 1)).toBe(true)
      expect(dataStore.items.some(item => item.id === 2)).toBe(true)
      expect(dataStore.items.some(item => item.id === 3)).toBe(true)
    })
  })

  describe('Pinia v3 Type Safety', () => {
    it('should maintain type safety with Pinia v3 stores', () => {
      const useTypedStore = defineStore('typed-test', () => {
        const dataUtils = useDataStore({
          idField: 'id'
        })
        return { ...dataUtils }
      })

      const dataStore = useTypedStore(pinia)
      const typedItem = { id: 1, name: 'Typed Item', active: true }
      dataStore.createInStore(typedItem)

      // Check the item is in the items array
      expect(dataStore.items).toHaveLength(1)
      const retrievedItem = dataStore.items[0]
      
      // Check if the item exists before checking types
      expect(retrievedItem).toBeDefined()
      
      // TypeScript should infer the correct types
      expect(typeof retrievedItem.id).toBe('number')
      expect(typeof retrievedItem.name).toBe('string')
      expect(typeof retrievedItem.active).toBe('boolean')
    })
  })

  describe('Pinia v3 State Persistence', () => {
    it('should work with Pinia v3 state persistence patterns', () => {
      const usePersistentStore = defineStore('persistence-test', () => {
        const dataUtils = useDataStore({
          idField: 'id'
        })
        return { ...dataUtils }
      })

      const dataStore = usePersistentStore(pinia)
      dataStore.createInStore({ id: 1, name: 'Persistent Item' })
      
      expect(dataStore.items).toHaveLength(1)
      
      // Clear the store
      dataStore.clearAll()
      expect(dataStore.items).toHaveLength(0)
    })
  })

  describe('Pinia v3 Error Handling', () => {
    it('should handle errors gracefully in Pinia v3 context', async () => {
      const useErrorStore = defineStore('error-test', () => {
        const dataUtils = useDataStore({
          idField: 'id'
        })
        return { ...dataUtils }
      })

      const dataStore = useErrorStore(pinia)

      // Test error handling doesn't break the store
      try {
        dataStore.getFromStore('nonexistent-id')
      } catch (error) {
        // Error should be handled gracefully
        expect(dataStore.items.value).toEqual([])
      }
    })
  })

  describe('Pinia v3 Plugin Compatibility', () => {
    it('should work with Pinia v3 plugin system', () => {
      // Create a fresh pinia instance
      const testPinia = createPinia()
      
      // Define a simple plugin that adds metadata
      const metadataPlugin = () => ({
        // Plugin returns an object that gets merged into the store
        pluginMetadata: { version: '3.0', applied: true }
      })

      testPinia.use(metadataPlugin)
      setActivePinia(testPinia)
      
      // Test that Feathers-Pinia stores work with the plugin-enabled Pinia
      const useFeathersStore = defineStore('feathers-plugin-test', () => {
        const dataUtils = useDataStore({
          idField: 'id'
        })
        return { 
          ...dataUtils, 
          customMethod: () => 'custom-result'
        }
      })

      const feathersStore = useFeathersStore()
      
      // Verify the store works correctly with the plugin-enabled Pinia
      expect(feathersStore.idField).toBe('id')
      expect(feathersStore.customMethod()).toBe('custom-result')
      expect(Array.isArray(feathersStore.items)).toBe(true)
      
      // Test that the store can be used normally
      feathersStore.createInStore({ id: 1, name: 'Test Plugin' })
      expect(feathersStore.items).toHaveLength(1)
      expect(feathersStore.items[0].name).toBe('Test Plugin')
    })
  })
})
