import { AutoTokenizer, AutoModelForCausalLM, PreTrainedTokenizer, PreTrainedModel } from '@huggingface/transformers';

export class Model{
  static model_name: string = "Llama_TOS";
  static tokenizer: PreTrainedTokenizer;
  static model: PreTrainedModel;
  
  /**
   * This function is used to retrive the tokenizer and and the model
   * @returns an tuple containg the tokenizer and the model
   */
  static async getInstances(): Promise<[PreTrainedTokenizer, PreTrainedModel]>{
    if (this.tokenizer === undefined || this.model === undefined) {
      this.tokenizer = await AutoTokenizer.from_pretrained(this.model_name);
      this.model = await AutoModelForCausalLM.from_pretrained(this.model_name);
    }

    return [this.tokenizer, this.model];
  }
}