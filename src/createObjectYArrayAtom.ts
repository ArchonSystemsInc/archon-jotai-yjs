import { observeExternalStoreAtom } from "@archon/jotai-hocuspocus/helpers/observeExternalStoreAtom"
import { atom, Atom } from "jotai"
import { atomFamily } from "jotai/utils"
import * as Y from "yjs"

export const ADD_OBJECT_TO_ARRAY = Symbol()
export const DELETE_OBJECT_FROM_ARRAY = Symbol()

interface AddObjectToArrayAction {
  type: typeof ADD_OBJECT_TO_ARRAY
  initialize: (map: Y.Map<unknown>) => void
}

interface DeleteObjectFromArrayAction {
  type: typeof DELETE_OBJECT_FROM_ARRAY
  index: number
}

//Memorizes to the same atom per map
const mapFamily = atomFamily((map: Y.Map<unknown>) => atom(map))

export const createObjectYArrayAtom = <TValue>(
  arrayAtom: Atom<Y.Array<Y.Map<unknown>>>,
  mapper: (map: Atom<Y.Map<unknown>>) => TValue
) => {
  const anAtom = observeExternalStoreAtom({
    getObservable: get => {
      const yArray = get(arrayAtom)
      return yArray
    },
    subscribe: (_get, yArray, refresh) => {
      const onNext = () => {
        console.log("refreshing array")
        refresh()
      }
      yArray.observe(onNext)
      return () => yArray.unobserve(onNext)
    },
  })

  const writeableAtom = atom(
    get => {
      const { state: array } = get(anAtom)
      const maps = array.toArray()
      return maps.map(mapFamily).map(mapper)
    },
    (get, set, update: AddObjectToArrayAction | DeleteObjectFromArrayAction) => {
      const { state: array } = get(anAtom)
      if (update.type === ADD_OBJECT_TO_ARRAY) {
        const newMap = new Y.Map()
        update.initialize(newMap)
        array.push([newMap])
      } else if (update.type === DELETE_OBJECT_FROM_ARRAY) {
        array.delete(update.index)
      }
    }
  )

  return writeableAtom
}
