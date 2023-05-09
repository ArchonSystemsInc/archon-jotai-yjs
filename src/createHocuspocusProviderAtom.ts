import { localAwarenessStateAtom } from "@archon/jotai-hocuspocus/awareness"
import { observeExternalStoreAtom } from "@archon/jotai-hocuspocus/helpers/observeExternalStoreAtom"
import { Atom, atom } from "jotai"
import { HocuspocusProviderConfiguration, HocuspocusProvider } from "@hocuspocus/provider"
import * as Y from "yjs"

export type CreateHocuspocusProviderAtomConfig = Omit<HocuspocusProviderConfiguration, "document">

export const createHocuspocusProviderAtom = (config: Atom<CreateHocuspocusProviderAtomConfig>) => {
  const ydocAtom = atom(get => {
    get(config) //Get a new doc everytime the config changes
    return new Y.Doc()
  })

  const hocuspocusProviderConfigAtom = atom<HocuspocusProviderConfiguration>(get => {
    return {
      ...get(config),
      document: get(ydocAtom),
    } as HocuspocusProviderConfiguration
  })

  const mount = Symbol()
  const unmount = Symbol()
  const versionAtom = atom(0)
  const beenDestroyed = atom(false)
  const providerAtom = atom(
    get => {
      get(versionAtom)
      const config = get(hocuspocusProviderConfigAtom)
      console.log("Getting new provider for ", config.name)
      return new HocuspocusProvider(config)
    },
    (get, set, update: typeof mount | typeof unmount) => {
      if (update === mount) {
        if (get(beenDestroyed)) {
          set(versionAtom, v => v + 1)
          set(beenDestroyed, false)
        }
      } else if (update === unmount) {
        set(beenDestroyed, true)
      }
    }
  )
  providerAtom.onMount = dispatch => {
    dispatch(mount)
    return () => dispatch(unmount)
  }

  const observedProviderAtom = observeExternalStoreAtom({
    getObservable: get => get(providerAtom),
    subscribe: (get, provider) => {
      return () => {
        provider.destroy()
      }
    },
  })

  const syncLocalAwarenessAtom = atom(get => {
    const localAwarenessState = get(localAwarenessStateAtom)
    const { state: provider } = get(observedProviderAtom)
    provider.awareness.setLocalState(localAwarenessState)

    return {
      localAwarenessState,
      provider,
    }
  })

  const finalAtom = atom(get => {
    const { provider } = get(syncLocalAwarenessAtom)
    return provider
  })

  return finalAtom
}
