import {
  CreateHocuspocusProviderAtomConfig,
  createHocuspocusProviderAtom,
} from "@archon/jotai-hocuspocus/createHocuspocusProviderAtom"
import { createLiveEditAtom } from "@archon/jotai-hocuspocus/createLiveEditAtom"
import Serializers from "@archon/jotai-hocuspocus/serializers"
import { expect } from "chai"
import { atom, createStore } from "jotai"
import { WebSocket } from "ws"

//We need this because WebSocket isnt a definied class in the nodejs context
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
global.WebSocket = WebSocket

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

describe("yjs", () => {
  it("Disconnect when changing rooms", () => {
    const jotaiStore = createStore()

    const roomNameAtom = atom("roomname")
    const configAtom = atom<CreateHocuspocusProviderAtomConfig>(get => ({
      name: get(roomNameAtom),
      url: "ws://someurl",
      token: "",
    }))

    const providerAtom = createHocuspocusProviderAtom(configAtom)
    const unsub = jotaiStore.sub(providerAtom, noop) //We need to do this to trigger onMount properly
    const ogProvider = jotaiStore.get(providerAtom)

    expect(ogProvider.isConnected).true

    jotaiStore.set(roomNameAtom, "otherroom")

    const newProvider = jotaiStore.get(providerAtom)
    expect(ogProvider).not.equal(newProvider)
    expect(newProvider.isConnected).true
    expect(ogProvider.isConnected).false
    unsub()
  })

  it("Disconnect when changing URL", () => {
    const jotaiStore = createStore()
    const roomNameAtom = atom("roomname")
    const urlAtom = atom("someUrl")
    const configAtom = atom<CreateHocuspocusProviderAtomConfig>(get => ({
      name: get(roomNameAtom),
      url: get(urlAtom),
      token: "",
    }))
    const providerAtom = createHocuspocusProviderAtom(configAtom)
    const unsub = jotaiStore.sub(providerAtom, noop) //We need to do this to trigger onMount properly
    const ogProvider = jotaiStore.get(providerAtom)
    expect(ogProvider.isConnected).true

    jotaiStore.set(urlAtom, "newUrl")

    const newProvider = jotaiStore.get(providerAtom)
    expect(ogProvider).not.equal(newProvider)
    expect(newProvider.isConnected).true
    expect(ogProvider.isConnected).false
    unsub()
  })

  it("Disconnects when there's no more active subscription to provider", () => {
    const jotaiStore = createStore()
    const roomNameAtom = atom("roomname")
    const urlAtom = atom("someUrl")
    const configAtom = atom<CreateHocuspocusProviderAtomConfig>(get => ({
      name: get(roomNameAtom),
      url: get(urlAtom),
      token: "",
    }))
    const providerAtom = createHocuspocusProviderAtom(configAtom)

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const unsubscribe1 = jotaiStore.sub(providerAtom, () => {})
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const unsubscribe2 = jotaiStore.sub(providerAtom, () => {})

    const ogProvider = jotaiStore.get(providerAtom)
    expect(ogProvider.isConnected).true

    unsubscribe1()
    expect(ogProvider.isConnected).true
    unsubscribe2()
    expect(ogProvider.isConnected).false
  })

  it("Provider should support multiple jotai stores", () => {
    const jotaiStore = createStore()
    const jotaiStore2 = createStore()
    const roomNameAtom = atom("roomname")
    const urlAtom = atom("someUrl")
    const configAtom = atom<CreateHocuspocusProviderAtomConfig>(get => ({
      name: get(roomNameAtom),
      url: get(urlAtom),
      token: "",
    }))
    const providerAtom = createHocuspocusProviderAtom(configAtom)
    const unsub = jotaiStore.sub(providerAtom, noop) //We need to do this to trigger onMount properly
    const ogProvider1 = jotaiStore.get(providerAtom)
    expect(ogProvider1.isConnected).true

    const unsub2 = jotaiStore2.sub(providerAtom, noop)
    const provider2 = jotaiStore2.get(providerAtom)
    expect(ogProvider1.isConnected).true
    jotaiStore.set(urlAtom, "newUrl")

    const newProvider1 = jotaiStore.get(providerAtom)
    expect(provider2).equal(jotaiStore2.get(providerAtom)) //Shouldn't change
    expect(provider2.isConnected).true

    expect(ogProvider1).not.equal(newProvider1)
    expect(newProvider1.isConnected).true
    expect(ogProvider1.isConnected).false
    unsub()
    unsub2()
  })

  it("String atom updates on set", () => {
    const jotaiStore = createStore()
    const roomNameAtom = atom("roomname")
    const urlAtom = atom("someUrl")
    const configAtom = atom<CreateHocuspocusProviderAtomConfig>(get => ({
      name: get(roomNameAtom),
      url: get(urlAtom),
      token: "",
    }))
    const providerAtom = createHocuspocusProviderAtom(configAtom)
    const textAtom = createLiveEditAtom<string>({ key: "text", providerAtom, defaultValue: "" })

    let text = jotaiStore.get(textAtom)
    const unsubscribe = jotaiStore.sub(textAtom, () => {
      text = jotaiStore.get(textAtom)
    })

    expect(text).equal("")
    jotaiStore.set(textAtom, "hello")
    expect(text).equal("hello")
    unsubscribe()
  })

  it("Number atom updates on set", () => {
    const jotaiStore = createStore()
    const roomNameAtom = atom("roomname")
    const urlAtom = atom("someUrl")
    const configAtom = atom<CreateHocuspocusProviderAtomConfig>(get => ({
      name: get(roomNameAtom),
      url: get(urlAtom),
      token: "",
    }))
    const providerAtom = createHocuspocusProviderAtom(configAtom)
    const numberAtom = createLiveEditAtom<number>({ key: "number1", providerAtom, defaultValue: 0 })

    let number = jotaiStore.get(numberAtom)
    const unsubscribe = jotaiStore.sub(numberAtom, () => {
      number = jotaiStore.get(numberAtom)
    })

    expect(number).equal(0)
    jotaiStore.set(numberAtom, 1)
    expect(number).equal(1)
    unsubscribe()
  })

  it("Date atom updates on set", () => {
    const jotaiStore = createStore()
    const roomNameAtom = atom("roomname")
    const urlAtom = atom("someUrl")
    const configAtom = atom<CreateHocuspocusProviderAtomConfig>(get => ({
      name: get(roomNameAtom),
      url: get(urlAtom),
      token: "",
    }))
    const providerAtom = createHocuspocusProviderAtom(configAtom)
    const dateAtom = createLiveEditAtom<Date | null>({
      key: "date",
      providerAtom,
      defaultValue: null,
      serializer: Serializers.NullableDate,
    })

    const unsubscribe = jotaiStore.sub(dateAtom, noop)
    const date = jotaiStore.get(dateAtom)

    expect(date).equal(null)
    const newDate = new Date("2022-01- 01")
    jotaiStore.set(dateAtom, newDate)
    expect(jotaiStore.get(dateAtom)?.getMilliseconds()).equal(newDate.getMilliseconds())
    unsubscribe()
  })
})
