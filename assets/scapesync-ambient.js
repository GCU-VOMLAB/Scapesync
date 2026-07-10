(function () {
  "use strict";

  function initAmbientTiles() {
    var ambientField = document.getElementById("ambient-tile-field");
    if (!ambientField || ambientField.dataset.ambientReady === "true") return;

    ambientField.dataset.ambientReady = "true";

    var ambientTiles = [];
    var affectedTiles = [];
    var ambientColumns = 0;
    var ambientRows = 0;
    var ambientCellWidth = 0;
    var ambientCellHeight = 0;
    var mouseX = -9999;
    var mouseY = -9999;
    var ambientFrame = null;

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function smoothstep(value) {
      return value * value * (3 - 2 * value);
    }

    function clearAmbientTile(tile) {
      tile.classList.remove("is-near");
      tile.style.removeProperty("--tile-z");
      tile.style.removeProperty("--tile-rx");
      tile.style.removeProperty("--tile-ry");
      tile.style.removeProperty("--tile-hue");
      tile.style.removeProperty("--tile-alpha");
      tile.style.removeProperty("--tile-border");
      tile.style.removeProperty("--tile-opacity");
      tile.style.removeProperty("--tile-glow");
      tile.style.removeProperty("--tile-inner-glow");
    }

    function rebuildAmbientTiles() {
      affectedTiles.length = 0;
      var targetSize = window.innerWidth < 768 ? 30 : 48;
      ambientColumns = Math.max(1, Math.ceil(window.innerWidth / targetSize));
      ambientRows = Math.max(1, Math.ceil(window.innerHeight / targetSize));
      ambientCellWidth = window.innerWidth / ambientColumns;
      ambientCellHeight = window.innerHeight / ambientRows;

      ambientField.style.setProperty("--ambient-columns", ambientColumns);
      ambientField.style.setProperty("--ambient-rows", ambientRows);

      var targetTileCount = ambientColumns * ambientRows;
      while (ambientTiles.length < targetTileCount) {
        var tile = document.createElement("div");
        tile.className = "ambient-tile";
        ambientField.appendChild(tile);
        ambientTiles.push(tile);
      }

      while (ambientTiles.length > targetTileCount) {
        var oldTile = ambientTiles.pop();
        oldTile.remove();
      }
    }

    function resetAmbientTiles() {
      ambientTiles.forEach(clearAmbientTile);
      affectedTiles.length = 0;
    }

    function updateAmbientTiles() {
      ambientFrame = null;

      // Reset only the tiles lit last frame; they are re-lit below if still in range.
      for (var i = 0; i < affectedTiles.length; i += 1) {
        clearAmbientTile(affectedTiles[i]);
      }
      affectedTiles.length = 0;

      if (mouseX < 0 || mouseY < 0) return;

      var pointerReach = window.innerWidth < 768 ? 166 : 226;
      var maxDepth = window.innerWidth < 768 ? 48 : 78;

      // Visit only the block of tiles within pointerReach of the pointer (was: all ~900 tiles).
      var reachCols = Math.ceil(pointerReach / ambientCellWidth) + 1;
      var reachRows = Math.ceil(pointerReach / ambientCellHeight) + 1;
      var pointerCol = Math.floor(mouseX / ambientCellWidth);
      var pointerRow = Math.floor(mouseY / ambientCellHeight);
      var minCol = Math.max(0, pointerCol - reachCols);
      var maxCol = Math.min(ambientColumns - 1, pointerCol + reachCols);
      var minRow = Math.max(0, pointerRow - reachRows);
      var maxRow = Math.min(ambientRows - 1, pointerRow + reachRows);

      for (var row = minRow; row <= maxRow; row += 1) {
        for (var col = minCol; col <= maxCol; col += 1) {
          var tile = ambientTiles[row * ambientColumns + col];
          if (!tile) continue;

          var centerX = (col + 0.5) * ambientCellWidth;
          var centerY = (row + 0.5) * ambientCellHeight;
          var dx = mouseX - centerX;
          var dy = mouseY - centerY;
          var distance = Math.hypot(dx, dy);
          if (distance > pointerReach) continue;

          var intensity = clamp(smoothstep(1 - distance / pointerReach), 0, 1);
          if (intensity < 0.014) continue;

          var depth = 1.5 + intensity * maxDepth;
          var hue = 184 + intensity * 62;

          tile.classList.add("is-near");
          tile.style.setProperty("--tile-z", depth.toFixed(1) + "px");
          tile.style.setProperty("--tile-rx", ((-dy / pointerReach) * 8.5 * intensity).toFixed(2) + "deg");
          tile.style.setProperty("--tile-ry", ((dx / pointerReach) * 8.5 * intensity).toFixed(2) + "deg");
          tile.style.setProperty("--tile-hue", hue.toFixed(1));
          tile.style.setProperty("--tile-alpha", (0.024 + intensity * 0.15).toFixed(3));
          tile.style.setProperty("--tile-border", (0.045 + intensity * 0.42).toFixed(3));
          tile.style.setProperty("--tile-opacity", (0.5 + intensity * 0.5).toFixed(3));
          tile.style.setProperty("--tile-glow", (intensity * 38).toFixed(1));
          tile.style.setProperty("--tile-inner-glow", (intensity * 24).toFixed(1));
          affectedTiles.push(tile);
        }
      }
    }

    function queueAmbientUpdate() {
      if (!ambientFrame) {
        ambientFrame = window.requestAnimationFrame(updateAmbientTiles);
      }
    }

    rebuildAmbientTiles();

    // Single pointer listener (covers mouse, pen and touch). Previously a separate
    // 'mousemove' listener ran identical work, doubling handler cost on every mouse move.
    window.addEventListener("pointermove", function (event) {
      mouseX = event.clientX;
      mouseY = event.clientY;
      queueAmbientUpdate();
    }, { passive: true });

    window.addEventListener("mouseleave", resetAmbientTiles);
    window.addEventListener("resize", function () {
      rebuildAmbientTiles();
      if (mouseX > -1 && mouseY > -1) queueAmbientUpdate();
    }, { passive: true });

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAmbientTiles);
  } else {
    initAmbientTiles();
  }
})();
