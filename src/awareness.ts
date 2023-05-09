import { AwarenessState } from "@archon/jotai-hocuspocus/types"
import { Atom, atom } from "jotai"
import { HocuspocusProvider } from "@hocuspocus/provider"
import { observeExternalStoreAtom } from "@archon/jotai-hocuspocus/helpers/observeExternalStoreAtom"

export const localAwarenessStateAtom = atom<AwarenessState>({})

export const createAwarenessStatesAtom = (providerAtom: Atom<HocuspocusProvider>) => {
  return observeExternalStoreAtom({
    getObservable: get => get(providerAtom),
    subscribe: (get, provider, refresh) => {
      provider.awareness.on("change", refresh)
      return () => {
        provider.awareness.off("change", refresh)
      }
    },
    getState: x => new Map<number, AwarenessState>([...x.awareness.states]), //Make this to return a new reference each time or else react doesn't properly re-render
  }) as Atom<Map<number, AwarenessState>>
}
