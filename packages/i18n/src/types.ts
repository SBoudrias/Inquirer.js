/**
 * Localized strings for the confirm prompt
 */
export interface ConfirmStrings {
  /** Default label for "Yes" option */
  yesLabel: string;
  /** Default label for "No" option */
  noLabel: string;
  /** Hint text when default is true (e.g., "Y/n") */
  hintYes: string;
  /** Hint text when default is false (e.g., "y/N") */
  hintNo: string;
}

/**
 * Localized strings for the select prompt
 */
export interface SelectStrings {
  /** Help text for navigation keys */
  helpNavigate: string;
  /** Help text for selection key */
  helpSelect: string;
}

/**
 * Localized strings for the checkbox prompt
 */
export interface CheckboxStrings {
  /** Help text for navigation keys */
  helpNavigate: string;
  /** Help text for selection key */
  helpSelect: string;
  /** Help text for submit key */
  helpSubmit: string;
  /** Help text for "select all" key */
  helpAll: string;
  /** Help text for "invert selection" key */
  helpInvert: string;
}

/**
 * Localized strings for the search prompt
 */
export interface SearchStrings {
  /** Help text for navigation keys */
  helpNavigate: string;
  /** Help text for selection key */
  helpSelect: string;
}

/**
 * Localized strings for the editor prompt
 */
export interface EditorStrings {
  /** Message shown while waiting for user to open editor (receives formatted enter key) */
  waitingMessage: (enterKey: string) => string;
}

/**
 * Localized strings for the password prompt
 */
export interface PasswordStrings {
  /** Text shown instead of typed input to indicate it is hidden */
  maskedText: string;
}

/**
 * Complete locale definition containing all prompt strings
 */
export interface Locale {
  confirm: ConfirmStrings;
  select: SelectStrings;
  checkbox: CheckboxStrings;
  search: SearchStrings;
  editor: EditorStrings;
  password: PasswordStrings;
}
