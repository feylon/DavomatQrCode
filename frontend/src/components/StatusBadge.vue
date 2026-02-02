<script setup>
import { computed } from 'vue'
import { STATUS_META } from '@/utils/format'

const props = defineProps({ status: { type: String, required: true } })
const meta = computed(() => STATUS_META[props.status] ?? { label: props.status, cls: '' })
</script>

<template>
  <span class="badge" :class="meta.cls">{{ meta.label }}</span>
</template>
