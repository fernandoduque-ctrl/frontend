import type { ThemeConfig } from '@/ds';

/** Paleta espelhada de `public/documentation/styles.css` */
export const SOL_BRAND = '#702670';
export const SOL_ACTION = '#c91ad8';
export const SOL_BG = '#ffffff';
export const SOL_BG_SUBTLE = '#f9f9f9';
export const SOL_TEXT = '#333333';
export const SOL_MUTED = '#666666';
export const SOL_BORDER = '#e8e8e8';
export const SOL_SUCCESS = '#2e7d32';

export const solidesDocTheme: ThemeConfig = {
  token: {
    colorPrimary: SOL_BRAND,
    colorSuccess: SOL_SUCCESS,
    colorLink: SOL_BRAND,
    colorLinkHover: SOL_ACTION,
    colorInfo: SOL_ACTION,
    colorText: SOL_TEXT,
    colorTextSecondary: SOL_MUTED,
    colorBorder: SOL_BORDER,
    colorBorderSecondary: SOL_BORDER,
    colorBgLayout: SOL_BG_SUBTLE,
    colorBgContainer: SOL_BG,
    borderRadius: 8,
    fontFamily: `'DM Sans', system-ui, -apple-system, sans-serif`,
    fontFamilyCode: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  components: {
    Layout: {
      bodyBg: SOL_BG_SUBTLE,
      headerBg: SOL_BG,
    },
    Menu: {
      itemSelectedBg: SOL_BG_SUBTLE,
      itemSelectedColor: SOL_BRAND,
      itemHoverBg: SOL_BG_SUBTLE,
      itemHoverColor: SOL_BRAND,
      itemActiveBg: SOL_BG_SUBTLE,
      darkItemSelectedBg: SOL_BRAND,
      darkItemSelectedColor: '#ffffff',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.08)',
    },
  },
};
