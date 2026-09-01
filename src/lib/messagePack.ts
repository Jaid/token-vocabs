import {Unpackr} from 'msgpackr/unpack'

type MessagePackUnpackr = {
  unpack: (value: Uint8Array) => unknown
}

type MessagePackUnpackrConstructor = new (options: {mapsAsObjects: boolean}) => MessagePackUnpackr

const UnpackrConstructor = Unpackr as unknown as MessagePackUnpackrConstructor
const unpackr = new UnpackrConstructor({
  mapsAsObjects: false,
})

export const unpackMessagePack = (value: Uint8Array) => {
  return unpackr.unpack(value)
}
