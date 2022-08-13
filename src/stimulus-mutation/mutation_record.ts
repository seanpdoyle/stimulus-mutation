export type AttributeMutationRecord = MutationRecord & {
  target: Element
  type: "attributes"
  attributeName: string
}

export type ChildListMutationRecord = MutationRecord & {
  type: "childList"
  target: Element
}

export function isAttributeMutationRecord(record: MutationRecord): record is AttributeMutationRecord {
  return record.type == "attributes" && record.target instanceof Element
}

export function isChildListMutationRecord(record: MutationRecord): record is ChildListMutationRecord {
  return record.type == "childList" && record.target instanceof Element
}
