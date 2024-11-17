// model.ts
import { pipeline, PipelineType, Text2TextGenerationPipeline } from '@huggingface/transformers';

export class Model{
  static model_name: string = "Xenova/LaMini-Flan-T5-783M";
  static task: PipelineType = "text2text-generation";
  static model: Text2TextGenerationPipeline;

  /**
   * This function is used to retrieve the tokenizer and model
   * @param progress_callback - optional callback to monitor progress
   * @param signal - optional AbortSignal for cancellation
   * @returns the model to use for text generation
   */
  static async getInstance(progress_callback?: Function, signal?: AbortSignal): Promise<Text2TextGenerationPipeline>{
    if (signal?.aborted) {
      throw new Error("Model loading was cancelled");
    }
    
    this.model = await pipeline(this.task, this.model_name, { progress_callback, device: "wasm", dtype: "q8" }) as Text2TextGenerationPipeline;
    return this.model;
  }
}
