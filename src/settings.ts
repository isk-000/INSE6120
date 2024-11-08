import { env } from '@huggingface/transformers';

/**
 * This function is used to set some local settings used by hugging face
 * to disable loading remote models  
 */
export const setEnviromnent = () => {
    // Specify a custom location for models (defaults to '/models/').
    env.localModelPath = "";

    // Disable the loading of remote models from the Hugging Face Hub:
    env.allowRemoteModels = false;
    env.allowLocalModels = true;

}
