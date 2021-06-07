<template>
  <div id="app">
    <div class='loading' v-if='!loaded'>
      Downloading the graph of cities...
    </div>
    <div class="sidebar" v-if='loaded'>
      <div v-if='!details'>
        <div class='control-panel'>
          <a href="#" @click.prevent='listVisible = !listVisible' class='btn-header'>{{listToggleHeader}}</a>
        </div>
        <div v-if='listVisible' class='list-container'>
          <input type='search' placeholder="Filter" v-model='filterValue' class='filter-box'/>
          <virtual-list style="height: 360px; overflow-y: auto;"
            :estimate-size="32"
            :data-key="'id'"
            :data-sources="filteredNodes"
            :data-component="itemComponent"
          />
        </div>
        <div v-if='!details && !listVisible' class='about'>
          <p>
          Each dot is a city. Cities that have similar road networks are connected by an edge.
          </p>
          <p class='byline'>
            Created by <a href='https://twitter.com/anvaka'>@anvaka</a>
            <a class='more-info' href='https://github.com/anvaka/similar-cities'>more info</a>
          </p>
        </div>
      </div>
      <div v-if='details'>
        <a href="#" @click.prevent='details=null' class='btn-header'>{{goBackHeader}}</a>
        <div>
          <p class='main-title' :title='details.main.name'>{{details.main.name}}</p>
          <a :href='getLink(details.main.id)' target="_blank">
            <img :src='details.main.image' :alt='details.main.name' class='main-image'/>
          </a>
        </div>
        <p class='info'>
        City roads below are sorted by decreasing <span class='score'>similarity</span>.
        </p>
        <div class='secondary'>
          <div class='related' v-for="(related, index) in details.related" :key="index">
            <p :title='related.name'><span class='score'>{{related.score}}</span> {{related.name}}</p>
            <a :href='getLink(related.id)' @click='handleImageClick(related.id, $event)' target="_blank" :title='related.name'>
              <img :src='related.image' :alt='related.name' class='related-image' />
            </a>
          </div>
        </div>
      </div>
    </div>
    <transition name="fade">
      <tooltip v-if="tooltip"
        :style="{left: tooltip.x + 'px', top: tooltip.y + 'px'}"
        :data="tooltip"
        class="tooltip"
      ></tooltip>
    </transition>
  </div>
</template>

<script>
import createGraphScene from './lib/createGraphScene';
import bus from "./lib/bus";
import Tooltip from "./Tooltip";
import VirtualList from 'vue-virtual-scroll-list';
import CityName from './CityName.vue';


export default {
  name: 'app',
  components: {
    Tooltip,
    VirtualList
  },
  data() {
    return {
      itemComponent: CityName,
      filterValue: '',
      tooltip: null,
      details: null,
      loaded: false,
      listVisible: false,
      nodes: [],
    };
  },
  computed: {
    listToggleHeader() {
      return this.listVisible ? 'Hide city list': 'Show city list';
    },
    goBackHeader() {
      return 'Close'; 
    },
    filteredNodes() {
      let filterValue = this.filterValue;
      let testRegex = new RegExp(filterValue, 'i');
      return this.nodes.filter(x => !filterValue || x.name.match(testRegex));
    }
  },
  methods: {
    showTooltip(e) {
      if (e) {
        clearTimeout(this.tooltipTimeout);
        this.tooltipTimeout = setTimeout(() => {
          let windowWidth = window.innerWidth;
          let windowHeight = window.innerHeight;
          let maxSize = windowHeight > 900 ? 800 : windowHeight * .5;
          if (e.y < maxSize) e.y += maxSize - e.y
          if (e.x + maxSize > windowWidth) e.x -= maxSize;
          if (e.x < 0) e.x = 0;
          this.tooltip = e;
        }, 150)
      } else {
        this.hideTooltip();
      }
    },
    showPanel(graph) {
      this.loaded = true;
      let unsorted = [];
      graph.forEachNode(node => {
        unsorted.push({
          name: node.data.name,
          id: node.id
        });
      });
      let ourNodes = this.nodes;
      unsorted.sort((a, b) => {
        return a.name.localeCompare(b.name)
      }).forEach(x => ourNodes.push(x));
    },
    showDetails(nodeId, updateViewBox) {
      this.details = this.scene.getDetails(nodeId);
      this.hideTooltip();

      this.scene.showNode(nodeId, updateViewBox);
    },
    hideTooltip() {
      this.tooltip = null;
      clearTimeout(this.tooltipTimeout);
    },
    handleImageClick(nodeId, event) {
      if (event.ctrlKey || event.metaKey) {
        return;
      } else {
        event.preventDefault();
        this.showDetails(nodeId, true);
      }
    },
    getLink(nodeId) {
      let details = this.scene.getDetails(nodeId);
      return `https://anvaka.github.io/city-roads/?areaId=${nodeId}&q=${details.main.name}`;
    }
  },
  mounted() {
    const canvas = document.getElementById('cnv');
    this.scene = createGraphScene(canvas);
    bus.on('show-tooltip', this.showTooltip);
    bus.on('graph-ready', this.showPanel);
    bus.on('focus-node', this.showDetails);
  },
  beforeDestroy() {
    if (this.scene) {
      this.scene.dispose();
    }
    bus.off('show-tooltip', this.showTooltip);
    bus.off('graph-ready', this.showPanel);
    bus.off('focus-node', this.showDetails);
  }

}
</script>

<style>
#app {
  position: absolute;
  width: 420px;
}
.control-panel {
  display: flex;
}
.control-panel .btn-header {
  flex: 1;
}
.sidebar {
  width: 100%;
  overflow-y: auto;
  max-height: 100vh;
  background: #010129;
  border: 1px solid #343536;
  padding: 8px;
}

.btn-command {
  display: block;
  padding: 4px;
  margin-top: 10px;
  border: 1px solid;
}

a {
  color: rgb(244, 244, 244);
  text-decoration: none;
}

.city-name {
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
  display: block;
  height: 32px;
  line-height: 32px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.city-name:hover {
  border-color: #90ee90;
  color: #90ee90;
}

.tooltip {
  position: fixed;
  background: rgba(33,33,33, 0.2);
  border: 1px solid border-hover;
  color: white;
  padding: 8px;
  pointer-events: none;
  transform: translateY(calc(-100% - 8px));
  font-family: monospace;
}

.tooltip img {
  width: 800px;
}

.main-image {
  width: 100%;
}
.filter-box {
  appearance: none;
  outline: none;
  background-color: #001b42;
  border: 1px solid #002b52;
  border-radius: 4px;
  color: white;
  padding-left: 8px;
  caret-color: #90ee90;
  width: 100%;
  height: 32px;
}

.filter-box:focus, .filter-box:hover {
  border-color: #90ee90;
}

.secondary {
  display: flex;
  flex-flow: row wrap;
  justify-content: space-around;
}

.secondary .related{
  padding: 4px;
  width: calc( (100% / 2) - 8px );
}
.secondary .related a {
  display: block;
}

/* .secondary .related {
  width: 180px;
  height: 180px;
  margin: 4px;
} */
.secondary .related p {
  margin: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  color: white;
}
.secondary .related img {
  width: 100%;
}
.btn-header {
  display: flex;
  height: 42px;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
}
.score {
  color: #90ee90;
}
.main-title {
  color: #F6F2E9;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .30s
}
.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0
}
.list-container {
  margin-top: 12px;
}
.info {
  color: #efefef;
  text-align: center;
}

.loading {
  font-size: 21;
  margin: 8px;
  color: #90ee90;
}
.about {
  padding-top: 8px;
  color: #efefef;
}
.about p{
  margin: 4px 0;
}
.about .byline{
  font-size: 12px;
}
.about a{
  color: #90ee90;
}
.more-info {
  float: right;
}
@media (max-height: 900px) {
  .tooltip img {
    max-width: 50vh;
  }
}
@media (max-width: 600px) {
  #app {
    width: 100%;
  }
}
</style>
