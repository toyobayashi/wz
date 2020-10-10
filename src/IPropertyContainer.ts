import { WzImageProperty } from './WzImageProperty'

export interface IPropertyContainer {
  addProperty(prop: WzImageProperty): void
  addProperties(props: Map<string, WzImageProperty>): void
  removeProperty(prop: WzImageProperty): void
  clearProperties(): void
  readonly wzProperties: Map<string, WzImageProperty>
  at (name: string): WzImageProperty | null
  set<T extends WzImageProperty> (name: string, value: T): void
}
