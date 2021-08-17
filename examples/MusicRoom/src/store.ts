import type { ITreeNode } from 'react-treebeard'
import type {
  WzMapleVersion,
  WzObject,
  WzBinaryProperty,
  WzImage,
  WzFile,
  WzFileParseStatus
} from '@tybys/wz'

import { ObjectId } from '@tybys/oid'
import { computed, effectScope, reactive, shallowRef } from '@vue/reactivity'

import { collectDir, debugLog, parseProperties } from './util'
import { audio } from './audio'

let wz: typeof import('@tybys/wz')

async function initWz (): Promise<typeof import('@tybys/wz')> {
  if (wz) return wz
  const wzWasmBase64DataUrl = await import('@tybys/wz/dist/wz.wasm')
  const emscriptenModuleOverrides: Partial<EmscriptenModule> = {
    locateFile () {
      return wzWasmBase64DataUrl.default
    }
  }
  const wzModule = await import('@tybys/wz')
  await wzModule.init(emscriptenModuleOverrides)
  wz = wzModule
  return wz
}

const scope = effectScope()
const store = scope.run(() => {
  const playingWzBinrary = shallowRef<WzBinaryProperty | null>(null)

  const state = reactive({
    mapleVersion: 2 as WzMapleVersion.BMS,
    trees: [] as ITreeNode[],
    treeLoading: false
  })

  const playingName = computed(() => {
    return playingWzBinrary.value ? playingWzBinrary.value.name : ''
  })

  const deleteTree = () => {
    for (let i = 0; i < state.trees.length; i++) {
      const node = state.trees[i]
      if (node.active) {
        const obj: WzObject = node.data!()
        obj.dispose()
        state.trees.splice(i, 1)
      }
    }
  }

  const parseImg = async function (file: File): Promise<WzImage> {
    const wzModule = await initWz()
    const img = wzModule.WzImage.createFromFile(file, state.mapleVersion)
    const tree: ITreeNode = {
      id: new ObjectId().toHexString(),
      name: img.name,
      children: [],
      active: false,
      toggled: false,
      data: () => img
    }
    debugLog(img)
    state.trees.push(tree)
    return img
  }

  const parseWz = async function (file: File): Promise<WzFile> {
    const wzModule = await initWz()
    const wz = new wzModule.WzFile(file, state.mapleVersion)
    let r: WzFileParseStatus
    state.treeLoading = true
    try {
      r = await wz.parseWzFile()
    } catch (err) {
      state.treeLoading = false
      throw err
    }
    state.treeLoading = false
    if (r !== wzModule.WzFileParseStatus.SUCCESS) {
      wz.dispose()
      throw new Error(wzModule.getErrorDescription(r))
    }

    const tree: ITreeNode = {
      id: new ObjectId().toHexString(),
      name: wz.name,
      children: [],
      active: false,
      toggled: false,
      data: () => wz
    }

    collectDir(wz.wzDirectory!, tree)
    debugLog(wz)
    state.trees.push(tree)

    return wz
  }

  const tryExpandNode = async function (node: ITreeNode): Promise<void> {
    const wzModule = await initWz() 
    const wzData = node.data ? node.data() : null
    if (wzData) {
      debugLog(wzData)
      if (wzData instanceof wzModule.WzImage) {
        if (!node.children || !node.children.length) {
          node.children = node.children || []
          node.loading = true
          node.toggled = true
          const r = await wzData.parseImage()
          if (r) {
            for (const prop of wzData.wzProperties.values()) {
              const propNode: ITreeNode = {
                id: new ObjectId().toHexString(),
                name: prop.name,
                active: false,
                data: () => prop
              }
              node.children.push(propNode)
            }
            node.loading = false
          } else {
            node.toggled = false
            throw new Error('Image parse failed. Ensure it is a valid img or try to change the maple version')
          }
        }
      } else if (wzData instanceof wzModule.WzBinaryProperty) {
        const buffer = await wzData.getBytes(false)
        await audio.playRaw(buffer)
        playingWzBinrary.value = wzData
      } else {
        parseProperties(wzData, node)
      }
    }
  }

  const saveMp3 = async () => {
    if (playingWzBinrary.value) {
      await playingWzBinrary.value.saveToFile(playingName.value + '.mp3')
    }
  }

  return {
    state,
    getters: {
      playingName
    },
    mutations: {
      deleteTree
    },
    actions: {
      parseImg,
      parseWz,
      tryExpandNode,
      saveMp3
    }
  }
})!

document.addEventListener('keyup', (e) => {
  if (e.key === 'Delete') {
    store.mutations.deleteTree()
  }
})

export default store
