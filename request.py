import sys
from flask import Flask, request
from engine.translate_engine import TranslateEngine

engine = TranslateEngine()

engine.load_translator('eng2elv', 'engine/eng_to_eld.txt', 'engine/elvish/model_en_elv')


def work(test):
    test += 's'
    return test

app = Flask(__name__)
@app.route('/')
def home():
    if request.args.get('eng') is None:
        return 'ass'
    return engine.translate('eng2elv', request.args.get('eng'))

if __name__ == '__main__':
    app.run(debug=True)

