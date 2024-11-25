from flask import Flask, make_response, request
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForCausalLM

from constants import ANALYIS_KEY, PRIVACY_POLICY_KEY, MESSAGE_KEY, ERROR_MESSAGE

# Initialize the Flask app
app = Flask(__name__)
CORS(app)

model = None
tokenizer = None

# Configuration
app.config['DEBUG'] = True 

# Route for analysis
@app.route('/analyze', methods=["POST"])
def analyze():
    data: dict =  request.get_json()

    if not data or PRIVACY_POLICY_KEY not in data:
        return make_response({MESSAGE_KEY: ERROR_MESSAGE}, 400)
    
    privacy_policy = data.get(PRIVACY_POLICY_KEY, "")
    
    inputs = tokenizer("Analyize this privacy policy and give me a score from 1 to 10: " + privacy_policy, return_tensors="pt")
    outputs = model.generate(**inputs, max_new_tokens=100)
    
    return make_response({ANALYIS_KEY: tokenizer.decode(outputs[0])}, 200)

def init_model():
    with app.app_context():
        global model
        global tokenizer
        model = AutoModelForCausalLM.from_pretrained(
            "Qwen/Qwen2.5-0.5B-Instruct",
            torch_dtype="auto",
            device_map="auto",
        )
        tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-0.5B-Instruct")

# Run the app
if __name__ == '__main__':
    init_model()
    app.run(port=5000) 
