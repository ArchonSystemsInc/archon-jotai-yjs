import { createDocAtom } from "@archon/jotai-hocuspocus/createDocAtom"
import { createMapAtom } from "@archon/jotai-hocuspocus/createMapAtom"
import { observeExternalStoreAtom } from "@archon/jotai-hocuspocus/helpers/observeExternalStoreAtom"
import { Serializer } from "@archon/jotai-hocuspocus/serializers"
import { HocuspocusProvider } from "@hocuspocus/provider"
import { Atom, WritableAtom } from "jotai"
import * as Y from "yjs"

interface CreateLiveEditAtomConfigBase<TValue> {
  key: string
  providerAtom: Atom<HocuspocusProvider>
  defaultValue: TValue
  mapAtom?: Atom<Y.Map<unknown>> //The map that this attribute is attached to
}

type CreateLiveEditAtomConfig<TValue> = [TValue] extends [string | number | boolean | null | undefined]
  ? CreateLiveEditAtomConfigBase<TValue>
  : CreateLiveEditAtomConfigBase<TValue> & { serializer: Serializer<TValue> }

//YMap -> YMap support

export const createLiveEditAtom = <TValue>(config: CreateLiveEditAtomConfig<TValue>) => {
  const { key, providerAtom, defaultValue } = config

  const mapAtom = config.mapAtom ?? createMapAtom("", createDocAtom(providerAtom))

  const anAtom = observeExternalStoreAtom({
    getObservable: get => {
      return get(mapAtom)
    },
    subscribe: (get, map, refresh) => {
      const onNext = (e: Y.YMapEvent<unknown>) => {
        if (e.keysChanged.has(key)) refresh()
      }
      map.observe(onNext)
      return () => map.unobserve(onNext)
    },
    getState: map => {
      const value = map.get(key) ?? defaultValue
      if ("serializer" in config) {
        return config.serializer.deserialize(value)
      }

      return value as TValue
    },
    setState: (map, update) => {
      if ("serializer" in config) {
        map.set(key, config.serializer.serialize(update))
      } else {
        map.set(key, update)
      }
    },
  })

  //Would be nice to support SetStateAction<TValue> instead of just TValue
  return anAtom as WritableAtom<TValue, [TValue], void>
}
