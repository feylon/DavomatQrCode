<script setup>
import { fullName, initials } from '@/utils/format'

defineProps({
  user: { type: Object, required: true },
  sub: { type: String, default: '' },
})
</script>

<template>
  <div class="person">
    <span class="avatar">{{ initials(user) }}</span>
    <div>
      <div class="name">{{ fullName(user) }}</div>
      <div class="sub">{{ sub || (user.login ? '@' + user.login : '') }}</div>
    </div>
  </div>
</template>
