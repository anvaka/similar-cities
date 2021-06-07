import {createScene} from 'w-gl';
import LineCollection from './LineCollection';
import PointCollection from './PointCollection';
import bus from './bus';
import RBush from 'rbush';
import knn from 'rbush-knn';
import fromDot from 'ngraph.fromdot';
import config from '../config';

export default function createGraphScene(canvas) {
  const spatialIndex = new RBush();
  const nodeSize = 4;

  // Since graph can be loaded dynamically, we have these uninitialized
  // and captured into closure. loadGraph will do the initialization
  let graph, layout = {
    getNodePosition(nodeId) {
      return graph.getNode(nodeId).data.position;
    }
  };
  let scene, nodes, lines;
  let highlightedNodes;
  let firstLevelArrows;


  fetch('distance.dot', {mode: 'cors'}).then(x => x.text()).then(x => {
    loadGraph(fromDot(x));
  });

  return {
    dispose,
    getDetails,
    showNode
  };
  
  function clearHighlights() {
    highlightedNodes.clear();
    firstLevelArrows.clear();
  }
  function showNode(nodeId, updateViewBox) {
    clearHighlights();
    let node = graph.getNode(nodeId);
    const hlNode = {...node.ui};
    hlNode.color = 0xBF2172ff;
    hlNode.size *= 1.2;
    highlightedNodes.add(hlNode);


    graph.forEachLinkedNode(nodeId, (other, link) => {
      let color = 0x90ee90ff;

      const hlNode = {...other.ui};
      hlNode.color = color;
      highlightedNodes.add(hlNode);
      let linkUI = {...link.ui};
      linkUI.color = 0xffffffff;
      firstLevelArrows.add(linkUI);
    });

    if (updateViewBox) {
      let { x, y } = node.data;
      let size = 20;
      scene.setViewBox({
        left: x - size,
        top: y - size,
        right: x + size,
        bottom: y + size,
      });
    }
    scene.renderFrame()
  }

  function getDetails(nodeId) {
    let related = [];
    graph.forEachLinkedNode(nodeId, (other, link) => {
      let info = getNodeDetails(other.id);
      info.score = link.data.weight;
      related.push(info);
    });
    related.sort((a, b) => b.score - a.score);
    return {
      main: getNodeDetails(nodeId),
      related
    }
  }

  function getNodeDetails(nodeId) {
    let from = graph.getNode(nodeId);
    return {
      id: nodeId,
      name: from.data.name,
      image: getImageForId(nodeId)
    }
  }

  function getImageForId(id) {
    return config.imageEndpoint + id+ '.png'
  }

  function loadGraph(newGraph) {
    if (scene) {
      disposeScene();
    }
    scene = initScene();
    scene.on('click', handleClick);
    scene.on('mousemove', handleMove);
    graph = newGraph
    window.graph = graph;

    initUIElements();
    updateSpatialIndex();

    // drawGraph();
    scene.renderFrame();
    bus.fire('graph-ready', graph)
  }

  function initScene() {
    let scene = createScene(canvas);
    scene.setClearColor(12/255, 41/255, 82/255, 1)
    let initialSceneSize = 200;
    scene.setViewBox({
      left:  -initialSceneSize,
      top:   -initialSceneSize,
      right:  initialSceneSize,
      bottom: initialSceneSize,
    });
    return scene;
  }
  
  function initUIElements() {
    nodes = new PointCollection(scene.getGL(), {
      capacity: graph.getNodesCount()
    });

    graph.forEachNode(node => {
      let size = nodeSize;
      if (node.data && node.data.size) {
        size = node.data.size;
      } else {
        if (!node.data) node.data = {};
        node.data.size = size;
      }
      let {x, y} = node.data;
      node.data.position = [x, y, 0];
      node.ui = {size, position: node.data.position, color: node.data.color || 0x90f8fcff};
      node.uiId = nodes.add(node.ui);
    });

    lines = new LineCollection(scene.getGL(), { capacity: graph.getLinksCount() });
    highlightedNodes = new PointCollection(scene.getGL());
    firstLevelArrows = new LineCollection(scene.getGL(), {width: 6})

    graph.forEachLink(link => {
      var from = layout.getNodePosition(link.fromId);
      var to = layout.getNodePosition(link.toId);
      var line = { from, to, color: 0xFFFFFF20 };
      link.ui = line;
      link.uiId = lines.add(link.ui);
    });

    scene.appendChild(lines);
    scene.appendChild(nodes);
    scene.appendChild(firstLevelArrows);
    scene.appendChild(highlightedNodes);
  }

  function updateSpatialIndex() {
    spatialIndex.clear();
    graph.forEachNode(node => {
      var {x, y} = node.data;
      spatialIndex.insert({
        minX: x - nodeSize,
        minY: y - nodeSize,
        maxX: x + nodeSize,
        maxY: y + nodeSize,
        point: node.data,
        id: node.id
      });
    })
  }

  function handleClick(e) {
    let id = findNearest(e.x, e.y);
    if (id !== undefined) {
      bus.fire('focus-node', id);
    }
  }

  function handleMove(e) {
    let id = findNearest(e.x, e.y);
    if (id !== undefined) {
      bus.fire('show-tooltip', {
        x: e.originalEvent.clientX,
        y: e.originalEvent.clientY,
        data: id,
      });
      return;
    }

    bus.fire('show-tooltip', null);
  }

  function findNearest(x, y) {
    const neighborIds = knn(spatialIndex, x, y, 1);
    let neighbor = neighborIds[0];
    if (neighbor === undefined) return;
    let point = neighbor.point;
    let dist = Math.hypot(x - point.x, y - point.y);
    if (dist < nodeSize / 2) return neighbor.id;
  }

  function dispose() {
    if (scene) scene.dispose();
    bus.off('load-graph', loadGraph);
  }

  function disposeScene() {
    scene.off('click', handleClick);
    scene.off('mousemove', handleMove);
    scene.dispose();
    scene = null
  }
}