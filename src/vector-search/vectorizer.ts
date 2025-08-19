/**
 * Vectorizer wraps a sentence transformer model from @xenova/transformers
 * to generate vector embeddings for text. Used for semantic search and similarity.
 *
 * Usage:
 *   const vectorizer = new Vectorizer();
 *   await vectorizer.init();
 *   const embedding = await vectorizer.embed('your text');
 */
import { pipeline } from '@xenova/transformers';

export class Vectorizer {
  /**
   * The loaded embedding pipeline instance.
   */
  private embedder: any;

  /**
   * Construct a new Vectorizer. Model is loaded on first use.
   */
  constructor() {}

  /**
   * Loads the sentence transformer model for feature extraction.
   * Model: Xenova/all-MiniLM-L6-v2 (small, fast, general-purpose)
   * Call this before embedding, or it will auto-load on first embed.
   */
  async init() {
    this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }

  /**
   * Generate a vector embedding for the given text.
   * @param text - The input string to embed.
   * @returns A flattened 1D array of numbers representing the embedding.
   */
  async embed(text: string): Promise<number[]> {
    if (!this.embedder) {
      await this.init();
    }
    const embedding = await this.embedder(text);
    // The output is a nested array; flatten to 1D for storage/search.
    return Array.isArray(embedding) ? embedding.flat(2) : embedding;
  }
}
