<template>
<div>
  <img :src="src" alt='city screenshot' />
</div>
</template>
<script>
import config from './config';

export default {
  props: ['data'],
  data() {
    return {
      src: config.imageEndpoint + this.data.data + '.png'
    }
  },
  methods: {
  }
}
</script>