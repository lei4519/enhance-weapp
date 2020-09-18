
export function decoratorPage() {
  const $Page = Page
  Page = function decoratorPage(config: LooseObject) {
    processConfig(config, 'page')
    $Page(config)
  }
}
export function decoratorComponent() {}

function processConfig(config: LooseObject, type: 'page' | 'component') {

}