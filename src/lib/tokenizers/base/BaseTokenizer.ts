export abstract class BaseTokenizer<TState> {
  #isLoaded = false
  #state?: TState

  protected abstract createState(): TState

  encode(text: string) {
    return this.encodeWithState(text, this.getState())
  }

  protected abstract encodeWithState(text: string, state: TState): Array<number>

  protected getState() {
    if (!this.#isLoaded) {
      this.#state = this.createState()
      this.#isLoaded = true
    }
    return this.#state as TState
  }

  getTokenCount(text: string) {
    return this.encode(text).length
  }
}
