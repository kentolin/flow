/**
 * menuManager.js
 * Builds the top menubar and integrates with themeManager.
 */

import { themeManager } from './themeManager.js';

export const menuManager = {
  init() {
    this.createMenuBar();
  },

  createMenuBar() {
    let menubar = document.getElementById('menubar');
    if (!menubar) {
        menubar = document.createElement('div');
        menubar.id = 'menubar';
        document.body.prepend(menubar);
    }

    // File Menu
    menubar.innerHTML = `
      <div class="menu-item">
        File
        <div class="menu-dropdown">
          <div data-action="new">New</div>
          <div data-action="open">Open...</div>
          <div data-action="save">Save</div>
          <div data-action="export">Export as JSON</div>
        </div>
      </div>

      <div class="menu-item">
        View
        <div class="menu-dropdown">
          <div data-action="toggle-grid">Toggle Grid</div>
          <div class="menu-separator"></div>
          <div class="submenu">
            Theme →
            <div class="submenu-dropdown">
              <div data-theme="light">☀️ Light</div>
              <div data-theme="dark">🌙 Dark</div>
            </div>
          </div>
        </div>
      </div>

      <div class="menu-item">
        Help
        <div class="menu-dropdown">
          <div data-action="about">About Flowchart Editor</div>
        </div>
      </div>
    `;

    document.body.prepend(menubar);

    // Menu toggle hover logic
    const menuItems = menubar.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
      item.addEventListener('mouseenter', () => item.classList.add('open'));
      item.addEventListener('mouseleave', () => item.classList.remove('open'));
    });

    // Theme click handler
    menubar.querySelectorAll('[data-theme]').forEach(item => {
      item.addEventListener('click', e => {
        const theme = e.target.dataset.theme;
        themeManager.apply(theme);
      });
    });
  },
};
