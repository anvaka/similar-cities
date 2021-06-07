<template>
  <a @click.prevent='focusNode()' class='city-name' href='#'>{{ source.name }}</a>
</template>

<script>
import bus from './lib/bus';

export default {
    name: 'city-name',
    props: {
      index: { // index of current item
        type: Number
      },
      source: { // here is: {uid: 'unique_1', text: 'abc'}
        type: Object,
        default () {
          return {}
        }
      }
    },
    methods: {
      focusNode() {
        bus.fire('focus-node', this.source.id, true);
      }
    }
  }
</script>