export function clickOutside(node: HTMLElement): SvelteActionReturnType {
  function handleClick(event: MouseEvent) {
    if (node && !node.contains(event.target as HTMLElement) && !event.defaultPrevented) {
      node.dispatchEvent(new CustomEvent('clickoutside'));
    }
  }
  document.addEventListener('click', handleClick, true);

  return {
    destroy: () => document.removeEventListener('click', handleClick, true),
  };
}
