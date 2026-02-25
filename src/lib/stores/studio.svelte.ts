// Studio state management - Svelte 5 runes store
// Persists activeTab + openPanel + preview settings in localStorage

import type {
  PreviewOrientation,
  PreviewZoomMode,
} from '$lib/types.js';

export type BottomTab = 'editor' | 'appearance' | 'analytics' | 'billing' | 'settings' | 'templates';

export type EditorPanel =
  | 'components'
  | 'header'
  | 'title'
  | 'contacts'
  | 'theme'
  | 'background'
  | 'customize'
  | 'fonts'
  | 'branding'
  | null;

const EDITOR_PANELS: NonNullable<EditorPanel>[] = ['components', 'header', 'title', 'contacts'];
const APPEARANCE_PANELS: NonNullable<EditorPanel>[] = [
  'theme',
  'background',
  'customize',
  'fonts',
  'branding',
];

export const PANEL_LABELS: Record<NonNullable<EditorPanel>, string> = {
  components: 'Components',
  header: 'Header',
  title: 'Title & Bio',
  contacts: 'Contact Buttons',
  theme: 'Theme',
  background: 'Background',
  customize: 'Customize',
  fonts: 'Fonts',
  branding: 'Branding',
};

/** Map preview click zones to panels */
export const SECTION_TO_PANEL: Record<string, NonNullable<EditorPanel>> = {
  'header-media': 'header',
  'title-bio': 'title',
  contacts: 'contacts',
  'main-links': 'components',
};

class StudioState {
  activeTab = $state<BottomTab>('editor');
  openPanel = $state<EditorPanel>(null);
  previewZoomMode = $state<PreviewZoomMode>('FIT');
  previewOrientation = $state<PreviewOrientation>('portrait');

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
          const {
            tab,
            panel,
            previewZoomMode,
            previewOrientation,
            previewPreset,
          } = JSON.parse(saved);
          if (tab && this.#isValidTab(tab)) this.activeTab = tab;
          if (panel !== undefined) this.openPanel = panel;
          if (previewZoomMode && this.#isValidZoomMode(previewZoomMode)) {
            this.previewZoomMode = previewZoomMode;
          } else if (previewPreset && this.#isValidLegacyPreset(previewPreset)) {
            this.previewZoomMode = this.#mapLegacyPresetToZoom(previewPreset);
          }
          if (
            previewOrientation &&
            this.#isValidOrientation(previewOrientation)
          ) {
            this.previewOrientation = previewOrientation;
          }
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

  setPreviewZoomMode(mode: PreviewZoomMode) {
    this.previewZoomMode = mode;
    this.#persist();
  }

  setPreviewOrientation(orientation: PreviewOrientation) {
    this.previewOrientation = orientation;
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
    return ['editor', 'appearance', 'analytics', 'billing', 'settings', 'templates'].includes(tab);
  }

  #isValidZoomMode(mode: string): mode is PreviewZoomMode {
    return ['FIT', '90', '100', '110'].includes(mode);
  }

  #isValidLegacyPreset(preset: string): preset is 'AUTO' | 'S' | 'M' | 'L' {
    return ['AUTO', 'S', 'M', 'L'].includes(preset);
  }

  #isValidOrientation(
    orientation: string,
  ): orientation is PreviewOrientation {
    return ['portrait', 'landscape'].includes(orientation);
  }

  #mapLegacyPresetToZoom(
    preset: 'AUTO' | 'S' | 'M' | 'L',
  ): PreviewZoomMode {
    if (preset === 'S') return '90';
    if (preset === 'L') return '110';
    if (preset === 'M') return '100';
    return 'FIT';
  }

  #persist() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'lnksy_studio',
        JSON.stringify({
          tab: this.activeTab,
          panel: this.openPanel,
          previewZoomMode: this.previewZoomMode,
          previewOrientation: this.previewOrientation,
        }),
      );
    }
  }
}

export const studio = new StudioState();
