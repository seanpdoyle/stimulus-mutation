import { isAttributeMutationRecord } from "./mutation_record"
import { MutationDescriptor, parseMutationDescriptorString } from "./mutation_descriptor"
import { parseTokenString } from "./utilities"

export interface MutationDescriptorObserverDelegate {
  mutationDescriptorsChanged(element: Element, newValues: Partial<MutationDescriptor>[], oldValues: Partial<MutationDescriptor>[]): void
  mutationDescriptorsAdded(element: Element, descriptors: Partial<MutationDescriptor>[]): void
  mutationDescriptorsRemoved(element: Element, descriptors: Partial<MutationDescriptor>[]): void
}

export class MutationDescriptorObserver {
  readonly delegate: MutationDescriptorObserverDelegate
  readonly element: Element
  readonly mutationAttribute: string
  readonly observer: MutationObserver

  constructor(delegate: MutationDescriptorObserverDelegate, element: Element, mutationAttribute: string) {
    this.delegate = delegate
    this.element = element
    this.mutationAttribute = mutationAttribute
    this.observer = new MutationObserver(this.mutationDescriptorObserved)
  }

  start() {
    this.observer.observe(this.element, { subtree: true, childList: true, attributeFilter: [this.mutationAttribute], attributeOldValue: true })
  }

  stop() {
    this.observer.disconnect()
  }

  mutationDescriptorObserved = (mutationRecords: MutationRecord[]) => {
    for (const record of mutationRecords) {
      if (isAttributeMutationRecord(record)) {
        const changedNode = record.target
        const newValues = parseMutationDescriptors(changedNode, this.mutationAttribute)
        const oldValues = parseTokenString(record.oldValue).map((token) => parseMutationDescriptorString(changedNode, token))

        if (oldValues.length > 0 || newValues.length > 0) {
          this.delegate.mutationDescriptorsChanged(changedNode, newValues, oldValues)
        }
      }
      else {
        for (const addedNode of record.addedNodes) {
          if (addedNode instanceof Element) {
            for (const [element, descriptors] of queryDescriptorAll(addedNode, this.mutationAttribute)) {
              this.delegate.mutationDescriptorsAdded(element, descriptors)
            }
          }
        }

        for (const removedNode of record.removedNodes) {
          if (removedNode instanceof Element) {
            for (const [element, descriptors] of queryDescriptorAll(removedNode, this.mutationAttribute)) {
              this.delegate.mutationDescriptorsAdded(element, descriptors)
            }
          }
        }
      }
    }
  }
}

function queryDescriptorAll(element: Element, mutationAttribute: string): Map<Element, Partial<MutationDescriptor>[]> {
  const entries = new Map([[element, parseMutationDescriptors(element, mutationAttribute)]])

  for (const descendant of element.querySelectorAll(`[${mutationAttribute}]`)) {
    entries.set(descendant, parseMutationDescriptors(descendant, mutationAttribute))
  }

  return entries
}

function parseMutationDescriptors(element: Element, mutationAttribute: string): Partial<MutationDescriptor>[] {
  const tokens = element.getAttribute(mutationAttribute)
  return parseTokenString(tokens).map((token) => parseMutationDescriptorString(element, token))
}
