// Studio state management — Svelte 5 runes store
// Persists activeTab + openPanel in localStorage

export type BottomTab = 'editor' | 'appearance' | 'analytics' | 'billing' | 'settings';

export type EditorPanel =
  | 'links'
  | 'header'
  | 'title'
  | 'contacts'
  | 'themes'
  | 'background'
  | 'fonts'
  | 'colors'
  | 'branding'
  | null;

const EDITOR_PANELS: NonNullable<EditorPanel>[] = ['links', 'header', 'title', 'contacts'];
const APPEARANCE_PANELS: NonNullable<EditorPanel>[] = [
  'themes',
  'background',
  'fonts',
  'colors',
  'branding',
];

export const PANEL_LABELS: Record<NonNullable<EditorPanel>, string> = {
  links: 'Links',
  header: 'Header',
  title: 'Title & Bio',
  contacts: 'Contact Buttons',
  themes: 'Themes',
  background: 'Background',
  fonts: 'Fonts',
  colors: 'Customize Colors',
  branding: 'Branding',
};

/** Map preview click zones to panels */
export const SECTION_TO_PANEL: Record<string, NonNullable<EditorPanel>> = {
  'header-media': 'header',
  'title-bio': 'title',
  contacts: 'contacts',
  'main-links': 'links',
};

class StudioState {
  activeTab = $state<BottomTab>('editor');
  openPanel = $state<EditorPanel>(null);

  // Toast
  toastMessage = $state('');
  toastType = $state<'info' | 'success' | 'error'>('info');
  toastVisible = $state(false);
  #toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('lnksy_studio');
        if (saved) {
          const { tab, panel } = JSON.parse(saved);
          if (tab && this.#isValidTab(tab)) this.activeTab = tab;
          if (panel !== undefined) this.openPanel = panel;
        }
      } catch {
        // Ignore invalid saved state
      }
    }
  }

  get isStudioMode(): boolean {
    return this.activeTab === 'editor' || this.activeTab === 'appearance';
  }

  get railPanels(): NonNullable<EditorPanel>[] {
    if (this.activeTab === 'editor') return EDITOR_PANELS;
    if (this.activeTab === 'appearance') return APPEARANCE_PANELS;
    return [];
  }

  setTab(tab: BottomTab) {
    this.activeTab = tab;
    if (tab !== 'editor' && tab !== 'appearance') {
      this.openPanel = null;
    } else {
      // Close panel if it doesn't belong to new tab
      const valid = tab === 'editor' ? EDITOR_PANELS : APPEARANCE_PANELS;
      if (this.openPanel && !valid.includes(this.openPanel as NonNullable<EditorPanel>)) {
        this.openPanel = null;
      }
    }
    this.#persist();
  }

  togglePanel(panel: NonNullable<EditorPanel>) {
    if (this.openPanel === panel) {
      this.openPanel = null;
    } else {
      this.openPanel = panel;
      this.#autoSwitchTab(panel);
    }
    this.#persist();
  }

  setPanel(panel: EditorPanel) {
    this.openPanel = panel;
    if (panel) this.#autoSwitchTab(panel);
    this.#persist();
  }

  closePanel() {
    this.openPanel = null;
    this.#persist();
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    if (this.#toastTimer) clearTimeout(this.#toastTimer);
    this.#toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  #autoSwitchTab(panel: NonNullable<EditorPanel>) {
    if (EDITOR_PANELS.includes(panel) && this.activeTab !== 'editor') {
      this.activeTab = 'editor';
    } else if (APPEARANCE_PANELS.includes(panel) && this.activeTab !== 'appearance') {
      this.activeTab = 'appearance';
    }
  }

  #isValidTab(tab: string): tab is BottomTab {
    return ['editor', 'appearance', 'analytics', 'billing', 'settings'].includes(tab);
  }

  #persist() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'lnksy_studio',
        JSON.stringify({
          tab: this.activeTab,
          panel: this.openPanel,
        }),
      );
    }
  }
}

export const studio = new StudioState();
