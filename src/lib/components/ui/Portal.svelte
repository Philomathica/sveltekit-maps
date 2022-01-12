<script lang="ts">
  function portal(node: HTMLElement, target = 'body') {
    function update() {
      const targetElement = document.querySelector(target);
      if (!targetElement) {
        return;
      }

      targetElement.appendChild(node);
      node.hidden = false;
    }

    function destroy() {
      if (node.parentNode) {
        // Child tells parent to remove itself
        node.parentNode.removeChild(node);
      }
    }

    update();

    return { update, destroy };
  }
</script>

<div use:portal hidden>
  <slot />
</div>
