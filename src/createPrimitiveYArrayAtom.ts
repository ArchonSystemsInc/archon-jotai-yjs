import { observeExternalStoreAtom } from "@archon/jotai-hocuspocus/helpers/observeExternalStoreAtom"
import { Atom, WritableAtom, atom } from "jotai"
import * as Y from "yjs"

export const insertYArray = Symbol()
export const deleteYArray = Symbol()
export const pushYArray = Symbol()
export const unshiftYArray = Symbol()
export const sliceYArray = Symbol()

interface InsertYArrayAction<TValue> {
  type: typeof insertYArray
  index: number
  contents: TValue[]
}

interface DeleteYArrayAction {
  type: typeof deleteYArray
  index: number
  length?: number
}

interface PushYArrayAction<TValue> {
  type: typeof pushYArray
  contents: TValue[]
}

interface UnshiftYArrayAction<TValue> {
  type: typeof unshiftYArray
  contents: TValue[]
}

interface SliceYArrayAction {
  type: typeof sliceYArray
  start?: number
  end?: number
}

export type YArrayAtom<TValue> = WritableAtom<
  TValue[],
  [
    | InsertYArrayAction<TValue>
    | DeleteYArrayAction
    | PushYArrayAction<TValue>
    | UnshiftYArrayAction<TValue>
    | SliceYArrayAction
  ],
  TValue[] | undefined
>

export const createPrimitiveYArrayAtom = <TValue>(arrayAtom: Atom<Y.Array<unknown>>): YArrayAtom<TValue> => {
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

  const writableAtom = atom(
    get => {
      const { state: yArray } = get(anAtom)
      return (yArray.toArray() ?? []) as TValue[]
    },
    (
      get,
      set,
      update:
        | InsertYArrayAction<TValue>
        | DeleteYArrayAction
        | PushYArrayAction<TValue>
        | UnshiftYArrayAction<TValue>
        | SliceYArrayAction
    ) => {
      const { state: yArray } = get(anAtom)
      if (update.type === insertYArray) {
        yArray.insert(update.index, update.contents)
      } else if (update.type === deleteYArray) {
        yArray.delete(update.index, update.length)
      } else if (update.type === pushYArray) {
        yArray.push(update.contents)
      } else if (update.type === unshiftYArray) {
        yArray.unshift(update.contents)
      } else if (update.type === sliceYArray) {
        return yArray.slice(update.start, update.end) as TValue[]
      }
      return undefined
    }
  )

  return writableAtom
}
