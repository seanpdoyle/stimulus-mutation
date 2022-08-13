export interface MutationDescriptor {
  target: Element
  mutationObserverInit: MutationObserverInit
  attributeName: string
  identifier: string
  methodName: string
  declaration: string
}

// capture nos.:            12   23 4               43   1 5   56 7      768 9  98
const descriptorPattern = /^((.+?)(@(window|document))?->)?(.+?)(#([^:]+?))(:(.+))?$/

export function parseMutationDescriptorString(target: Element, descriptorString: string): Partial<MutationDescriptor> {
  const source = descriptorString.trim()
  const matches = source.match(descriptorPattern) || []
  return {
    target:                   parseMutationTarget(matches[4]) || target,
    attributeName:            matches[2],
    mutationObserverInit:     matches[9] ? parseMutationObserverInit(matches[9]) : {},
    identifier:               matches[5],
    methodName:               matches[7],
    declaration:              descriptorString
  }
}

export function toCacheKey(descriptor: Partial<MutationDescriptor>): string {
  const mutationObserverInit: Record<string, any> = descriptor.mutationObserverInit || {}
  const parts = [ descriptor.attributeName, descriptor.identifier, descriptor.methodName ]
  Object.keys(mutationObserverInit).sort().forEach(key => {
    parts.push(`${mutationObserverInit[key] ? "" : "!"}${key}`)
  })
  return parts.join(":")
}

function parseMutationTarget(mutationTargetName: string): Element | undefined {
  if (mutationTargetName == "window") {
    console.warn("Routing to @window is equivalent to routing to @document")
    return document.documentElement
  } else if (mutationTargetName == "document") {
    return document.documentElement
  }
}

function parseMutationObserverInit(mutationObserverInit: string): MutationObserverInit {
  return mutationObserverInit.split(":").reduce((options, token) =>
    Object.assign(options, { [token.replace(/^!/, "")]: !/^!/.test(token) })
  , {})
}
