import type {RawTextTokenizeResult, RawTokenizeResult, TokenizeInput} from '../../tokenization.ts'

import {toTokenizeText} from '../../tokenization.ts'

const utf8TextEncoder = new TextEncoder

export abstract class BaseTokenizer<TState> {
  #isLoaded = false
  #state?: TState

  protected abstract createState(): TState

  protected disposeState(_state: TState) {}

  encode(input: TokenizeInput) {
    return this.encodeWithState(toTokenizeText(input), this.getState())
  }

  protected abstract encodeWithState(text: string, state: TState): Array<number>

  free() {
    if (!this.#isLoaded) {
      return
    }
    this.disposeState(this.#state as TState)
    this.#state = undefined
    this.#isLoaded = false
  }

  protected getState() {
    if (!this.#isLoaded) {
      this.#state = this.createState()
      this.#isLoaded = true
    }
    return this.#state as TState
  }

  getTokenCount(input: TokenizeInput) {
    return this.encode(input).length
  }

  tokenize<InputGeneric extends TokenizeInput>(input: InputGeneric): RawTokenizeResult<InputGeneric> {
    const rawResult = this.tokenizeWithState(toTokenizeText(input), this.getState())
    if (typeof input === 'string' || rawResult.processedInput === undefined) {
      return rawResult as unknown as RawTokenizeResult<InputGeneric>
    }
    return {
      ...rawResult,
      processedInput: utf8TextEncoder.encode(rawResult.processedInput),
    } as unknown as RawTokenizeResult<InputGeneric>
  }

  protected abstract tokenizeWithState(text: string, state: TState): RawTextTokenizeResult
}
