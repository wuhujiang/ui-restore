export interface ComponentIndexEntry {
  name: string
  /** Path relative to project root (posix-style). */
  path: string
  export?: string
  props: string[]
}

export type ComponentIndex = Record<string, ComponentIndexEntry>

/** Built-in DSL type → preferred project component names (first hit wins). */
export const DEFAULT_COMPONENT_ALIASES: Record<string, string[]> = {
  Button: ['Button', 'AppButton', 'BaseButton', 'UiButton'],
  Input: ['Input', 'AppInput', 'BaseInput', 'UiInput'],
  Image: ['Image', 'AppImage', 'BaseImage'],
  Text: ['Text', 'AppText', 'Typography', 'BaseText'],
  Avatar: ['Avatar', 'AppAvatar'],
  Icon: ['Icon', 'AppIcon'],
  List: ['List', 'AppList'],
}
