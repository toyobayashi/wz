import { WzImageProperty } from './WzImageProperty'

export interface IPropertyContainer {
  addProperty(prop: WzImageProperty): void
  addProperties(props: Set<WzImageProperty>): void
  removeProperty(prop: WzImageProperty): void
  clearProperties(): void
  readonly wzProperties: Set<WzImageProperty>
  at (name: string): WzImageProperty | null
  set<T extends WzImageProperty> (name: string, value: T): void
}
