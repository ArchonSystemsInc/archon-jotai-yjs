import { HocuspocusProvider } from "@hocuspocus/provider"
import { Atom, atom } from "jotai"

export const createDocAtom = (providerAtom: Atom<HocuspocusProvider>) => {
  return atom(get => get(providerAtom).document)
}
