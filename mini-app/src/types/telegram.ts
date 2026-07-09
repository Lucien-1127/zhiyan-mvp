export interface TelegramThemeState {
  colorScheme: 'light' | 'dark';
  bgColor?: string;
  textColor?: string;
  hintColor?: string;
  linkColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  secondaryBgColor?: string;
}

export interface TelegramViewportState {
  width: number;
  height: number;
  isExpanded: boolean;
  isStable: boolean;
}

export interface MainButtonConfig {
  text: string;
  isVisible: boolean;
  isEnabled: boolean;
  isLoading?: boolean;
  hasShineEffect?: boolean;
  onClick?: () => void;
}

export interface BackButtonConfig {
  isVisible: boolean;
  onClick?: () => void;
}

export interface SettingsButtonConfig {
  isVisible: boolean;
  onClick?: () => void;
}
