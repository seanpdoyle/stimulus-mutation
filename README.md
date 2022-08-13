# Stimulus Mutation

Route mutations to attributes and child lists like Events

## Usage

Declare `[data-mutation]` in the same style as `[data-action]`.

Attribute mutations
---

```html
<div data-controller="my-controller" data-mutation="aria-busy->controller#doSomethingAboutIt">
  <!-- ... -->
</div>
```

```html
<div data-controller="my-controller" data-mutation="aria-busy->controller#doSomethingAboutIt:!subtree">
  <!-- ... -->
</div>
```

```html
<div data-controller="my-controller" data-mutation="controller#doSomethingAboutIt:attributes">
  <!-- ... -->
</div>
```

ChildList mutations
---

```html
<div data-controller="my-controller" data-mutation="controller#doSomethingAboutIt:childList">
  <!-- ... -->
</div>
```

```html
<div data-controller="my-controller" data-mutation="controller#doSomethingAboutIt:childList:!subtree">
  <!-- ... -->
</div>
```

All mutations
---

```html
<div data-controller="my-controller" data-mutation="controller#doSomethingAboutIt:attributes:childList">
  <!-- ... -->
</div>
```

## Callbacks

Declare `attributeChanged` callback to listen for changes to the
element with `[data-controller]`:

```js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  attributeChanged(attributeName, newValue, oldValue) {
   // ...
  }
}
```

Declare `[name]TargetAttributeChanged` callback to listen for changes to an
element with `[data-$IDENTIFIER-target~="name"]`:

```js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["observed"]

  observedTagretAttributeChanged(target, attributeName, newValue, oldValue) {
   // ...
  }
}
```

## Installation

```javascript
import { Application } from "@hotwired/stimulus"
import { install } from "@seanpdoyle/stimulus-mutation"

const application = Application.start()
// ...

install(application)
```

`[data-mutation]` by default, but can be overridden by passing `{
mutationAttribute: "..." }` to `install`:

```javascript
import { Application } from "@hotwired/stimulus"
import { install } from "@seanpdoyle/stimulus-mutation"

const application = Application.start()
// ...

install(application, { mutationAttribute: "data-mutation-routes" })
```
