import { observeExternalStoreAtom } from "@archon/jotai-hocuspocus/helpers/observeExternalStoreAtom"
import { Atom } from "jotai"
import * as Y from "yjs"

export const createMapAtom = <TKey extends string | number>(
  key: TKey,
  parentAtom: Atom<TKey extends string ? Y.Doc | Y.Map<unknown> : Y.Array<unknown>>
) => {
  const observedMapAtom = observeExternalStoreAtom({
    getObservable: get => {
      const parent = get(parentAtom)
      return parent
    },
    subscribe: (_get, parent, refresh) => {
      console.log("subscribing on", key)
      if (!parent || parent instanceof Y.Doc)
        return () => {
          //Do nothing here
        }
      else if (parent instanceof Y.Map) {
        const onNext = (e: Y.YMapEvent<unknown>) => {
          if (e.keysChanged.has(key)) {
            console.log("refreshing atom", key)
            refresh()
          }
        }
        parent.observe(onNext)
        return () => parent.unobserve(onNext)
      } else if (parent instanceof Y.Array) {
        const onNext = (_e: Y.YArrayEvent<unknown>) => {
          //Just refresh? not sure if we can get more specific here
          refresh()
        }
        parent.observe(onNext)
        return () => parent.unobserve(onNext)
      }

      throw new Error("not implemented")
    },
    getState: parent => {
      if (parent instanceof Y.Doc) return parent.getMap(key as string)
      else if (parent instanceof Y.Map) {
        return (parent.get(key as string) as Y.Map<unknown>) ?? new Y.Map()
      } else if (parent instanceof Y.Array) {
        return (parent.get(key as number) as Y.Map<unknown>) ?? new Y.Map()
      }
      throw new Error("not implemented")
    },
  })

  return observedMapAtom as Atom<Y.Map<unknown>>
}
