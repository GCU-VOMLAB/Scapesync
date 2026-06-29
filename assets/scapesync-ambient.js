(function () {
  "use strict";

  function initAmbientTiles() {
    var ambientField = document.getElementById("ambient-tile-field");
    if (!ambientField || ambientField.dataset.ambientReady === "true") return;

    ambientField.dataset.ambientReady = "true";

    var ambientTiles = [];
    var ambientColumns = 0;
    var ambientRows = 0;
    var ambientCellWidth = 0;
    var ambientCellHeight = 0;
    var mouseX = -9999;
    var mouseY = -9999;
    var ambientFrame = null;
    var reducedMotion = false;

    function clearAmbientTile(tile) {
      tile.classList.remove("is-near");
      tile.style.removeProperty("--tile-z");
      tile.style.removeProperty("--tile-rx");
      tile.style.removeProperty("--tile-ry");
      tile.style.removeProperty("--tile-alpha");
      tile.style.removeProperty("--tile-border");
      tile.style.removeProperty("--tile-opacity");
      tile.style.removeProperty("--tile-glow");
    }

    function rebuildAmbientTiles() {
      var targetSize = window.innerWidth < 768 ? 32 : 52;
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
    }

    function updateAmbientTiles() {
      ambientFrame = null;
      if (reducedMotion) {
        resetAmbientTiles();
        return;
      }

      var reach = window.innerWidth < 768 ? 138 : 178;
      var maxDepth = window.innerWidth < 768 ? 34 : 54;

      ambientTiles.forEach(function (tile, index) {
        var column = index % ambientColumns;
        var row = Math.floor(index / ambientColumns);
        var centerX = (column + 0.5) * ambientCellWidth;
        var centerY = (row + 0.5) * ambientCellHeight;
        var dx = mouseX - centerX;
        var dy = mouseY - centerY;
        var distance = Math.hypot(dx, dy);

        if (distance > reach) {
          clearAmbientTile(tile);
          return;
        }

        var falloff = 1 - distance / reach;
        var intensity = falloff * falloff * (3 - 2 * falloff);
        var depth = 1.5 + intensity * maxDepth;

        tile.classList.add("is-near");
        tile.style.setProperty("--tile-z", depth.toFixed(1) + "px");
        tile.style.setProperty("--tile-rx", ((-dy / reach) * 7 * intensity).toFixed(2) + "deg");
        tile.style.setProperty("--tile-ry", ((dx / reach) * 7 * intensity).toFixed(2) + "deg");
        tile.style.setProperty("--tile-alpha", (0.026 + intensity * 0.13).toFixed(3));
        tile.style.setProperty("--tile-border", (0.045 + intensity * 0.36).toFixed(3));
        tile.style.setProperty("--tile-opacity", (0.54 + intensity * 0.46).toFixed(3));
        tile.style.setProperty("--tile-glow", (intensity * 26).toFixed(1));
      });
    }

    function queueAmbientUpdate() {
      if (reducedMotion) return;
      if (!ambientFrame) {
        ambientFrame = window.requestAnimationFrame(updateAmbientTiles);
      }
    }

    rebuildAmbientTiles();

    window.addEventListener("mousemove", function (event) {
      if (reducedMotion) return;
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
