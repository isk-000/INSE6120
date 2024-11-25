// model.ts
import { pipeline, PipelineType, Text2TextGenerationPipeline, TextClassificationPipeline, TextGenerationPipeline } from '@huggingface/transformers';

export class Model{
  static model_name: string = "onnx-community/Qwen2.5-1.5B";
  static  scoring_model_name: string = "ayaalhaj/privacy-policy-analyzer";
  static task: PipelineType = "text-generation";
  static scoringTask: PipelineType = "text-classification";
  static summaryModel: TextGenerationPipeline;
  static scoringModel: TextClassificationPipeline;

  /**
   * This function is used to retrieve the tokenizer and model
   * @param progress_callback - optional callback to monitor progress
   * @param signal - optional AbortSignal for cancellation
   * @returns the model to use for text generation
   */
  static async getSummaryInstance(progress_callback?: Function, signal?: AbortSignal): Promise<TextGenerationPipeline>{
    if (signal?.aborted) {
      throw new Error("Model loading was cancelled");
    }
    
    if (this.summaryModel === undefined)
      this.summaryModel = await pipeline(this.task, this.model_name, { progress_callback, device: "wasm", dtype: "q8" }) as TextGenerationPipeline;
    
    return this.summaryModel;
  }

  static async getScoringInstance(progress_callback?: Function, signal?: AbortSignal): Promise<TextClassificationPipeline>{
    if (signal?.aborted) {
      throw new Error("Model loading was cancelled");
    }

    if (this.scoringModel === undefined)
      this.scoringModel = await pipeline(this.scoringTask, this.scoring_model_name, {progress_callback, device: "wasm", dtype:"q8" }) as TextClassificationPipeline
    
    return this.scoringModel;
  }
}
