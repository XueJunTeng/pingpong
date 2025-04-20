import { computed, ref, type Ref } from 'vue'

interface FilterableItem {
  tags: number[]
}

export const useTagFilter = <T extends FilterableItem>(
  items: Ref<T[]>,
  selectedTags: Ref<number[]>,
  mode: Ref<'and' | 'or'> = ref('and')
) => {
  return computed(() => {
    if (selectedTags.value.length === 0) return items.value

    return items.value.filter(item => {
      const itemTags = new Set(item.tags)
      return mode.value === 'and'
        ? selectedTags.value.every(t => itemTags.has(t))
        : selectedTags.value.some(t => itemTags.has(t))
    })
  })
}