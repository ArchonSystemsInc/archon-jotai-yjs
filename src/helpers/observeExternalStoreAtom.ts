import { Getter, Setter, WritableAtom, atom } from "jotai"

interface ObserveExternalStoreAtom<TObservable, TState> {
  subscribe: (get: Getter, observable: TObservable, forceRefresh: () => void) => () => void //Returns a cleanup method
  getObservable: (get: Getter) => TObservable
  getState?: (observable: TObservable) => TState
  setState?: (observable: TObservable, state: TState) => void
}

export const observeExternalStoreAtom = <TObservable, TState = { state: TObservable }>(
  props: ObserveExternalStoreAtom<TObservable, TState>
) => {
  const { subscribe, getObservable, getState, setState } = props

  const mount = Symbol()
  const unmount = Symbol()

  const versionAtom = atom(0)

  const incrementVersionAtom = atom<(() => void) | undefined>(undefined)

  type PreviousRefs = {
    subscribedObservable: TObservable
    unsubscribe: () => void
  }

  const previousRefsAtom = atom<PreviousRefs | undefined>(undefined)
  const setPreviousRefsAtom = atom<((refs: PreviousRefs | undefined) => void) | undefined>(undefined)

  const incrementVersionFactory = (set: Setter) => () => {
    set(versionAtom, v => v + 1)
  }

  const anAtom = atom(
    get => {
      get(versionAtom) //Used to force a refresh
      const observable = getObservable(get)
      const incrementVersion = get(incrementVersionAtom)
      const setPreviousRefs = get(setPreviousRefsAtom)

      const prevRefs = get(previousRefsAtom)
      if (prevRefs?.subscribedObservable !== observable && incrementVersion && setPreviousRefs) {
        prevRefs?.unsubscribe?.()

        setPreviousRefs({
          subscribedObservable: observable,
          unsubscribe: subscribe(get, observable, incrementVersion),
        })
      }

      let value = getState?.(observable)
      //Null is a legit value
      if (value === undefined) value = { state: observable } as TState //Need to return this as a new object each time incase the observable is always the same reference
      return value
    },
    (get, set, update: typeof mount | typeof unmount | TState) => {
      if (update === mount) {
        set(incrementVersionAtom, () => incrementVersionFactory(set))
        set(
          setPreviousRefsAtom,
          () =>
            (
              refs:
                | {
                    subscribedObservable: TObservable
                    unsubscribe: () => void
                  }
                | undefined
            ) =>
              set(previousRefsAtom, refs)
        )
        set(versionAtom, v => v + 1)
      } else if (update === unmount) {
        const prevRefs = get(previousRefsAtom)
        prevRefs?.unsubscribe()
        set(previousRefsAtom, undefined)
        set(setPreviousRefsAtom, undefined)
      } else {
        const observable = getObservable(get)
        setState?.(observable, update)
      }
    }
  )

  anAtom.onMount = dispatch => {
    dispatch(mount)
    return () => dispatch(unmount)
  }
  return anAtom as WritableAtom<TState, [TState], void>
}
