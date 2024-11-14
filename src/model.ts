import { pipeline, PipelineType, Text2TextGenerationPipeline } from '@huggingface/transformers';

export class Model{
  static model_name: string = "Xenova/LaMini-Flan-T5-783M";
  static task: PipelineType = "text2text-generation";
  static model: Text2TextGenerationPipeline;
  /**
   * This function is used to retrive the tokenizer and and the model
   * @returns the model to use for text generation
   */
  static async getInstance(progress_callback?: Function): Promise<Text2TextGenerationPipeline>{
    this.model = await pipeline(this.task, this.model_name, {progress_callback: progress_callback, device: "wasm", dtype:"q8"}) as Text2TextGenerationPipeline;

    return this.model;
  }
}