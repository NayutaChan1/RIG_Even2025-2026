<template>
    <div>
        <h1>Welcome To MoSec</h1>
        <p>Monitoring System</p>
    </div>
</template>

<script setup>
definePageMeta({ layout: false })
await navigateTo('/dashboard', {redirectCode : 301})
</script>

<style scoped>
    
</style>
