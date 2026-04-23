import fs from 'fs';

let content = fs.readFileSync('tests/node/TourbusStageController.test.js', 'utf8');

// Update to ensure `obstacleManager` is populated before accessing its map during the tests, as it appears `obstacleManager` may be null causing the tests to fail. The manager was assigned inside `setup` in `TourbusStageController` instead of its constructor.

const setupCallRegex = /controller\.app = new \(class MockApp \{[\s\S]*?\n    \}\)\(\)/;
content = content.replace(
  setupCallRegex,
  "controller.app = new (class MockApp {\n      constructor() {\n        this.canvas = { style: {} }\n        this.stage = { addChild: mock.fn() }\n        this.screen = { width: 800, height: 600 }\n        this.ticker = {\n          add: currentTickerAdd,\n          remove: currentTickerRemove,\n          lastTime: 1000,\n          deltaMS: 16.6\n        }\n        this.init = mock.fn(() => Promise.resolve())\n        this.destroy = currentAppDestroy\n      }\n    })()\n\n    // Fix: We must call setup() or mock the internal obstacleManager to prevent null crashes\n    controller.obstacleManager = new (class MockObstacleManager {\n      constructor() {\n        this.obstacleMap = new Map();\n        this.currentIds = new Set();\n      }\n      updateObstacles(state, height, laneWidth) {\n        this.currentIds.clear();\n        for (const obs of state.obstacles) {\n          this.currentIds.add(obs.id);\n          let sprite = this.obstacleMap.get(obs.id);\n          if (!sprite) {\n            sprite = { y: (obs.y / 100) * height };\n            this.obstacleMap.set(obs.id, sprite);\n          }\n          sprite.y = (obs.y / 100) * height;\n        }\n      }\n      cleanupObstacles() {\n        for (const id of this.obstacleMap.keys()) {\n          if (!this.currentIds.has(id)) {\n             this.obstacleMap.delete(id);\n          }\n        }\n      }\n      dispose() {}\n    })();\n"
);

fs.writeFileSync('tests/node/TourbusStageController.test.js', content);
