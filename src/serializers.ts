export interface Serializer<TValue> {
  deserialize: (value: unknown) => TValue
  serialize: (value: TValue) => string | number | boolean | null | undefined
}

const DateSerializer: Serializer<Date> = {
  deserialize: (value: unknown) => new Date(value as string),
  serialize: (value: Date) => value.toISOString(),
}

const NullableDateSerializer: Serializer<Date | null> = {
  deserialize: (value: unknown) => (!value ? null : new Date(value as string)),
  serialize: (value: Date | null) => value?.toISOString(),
}

const Serializers = {
  Date: DateSerializer,
  NullableDate: NullableDateSerializer,
}

export default Serializers
