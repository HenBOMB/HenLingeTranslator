import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 
from keras.preprocessing.text import Tokenizer
from tensorflow.keras.utils import to_categorical
from keras.preprocessing.sequence import pad_sequences
import numpy as np
from numpy import argmax
from keras.models import Sequential
from keras.layers import LSTM
from keras.layers import Dense
from keras.layers import Embedding
from keras.layers import RepeatVector
from keras.layers import TimeDistributed
from nltk.translate.bleu_score import corpus_bleu

class TranslateEngine():

    class TrasnslatorData:
        def __init__(self, from_token, from_length, to_token, model) -> None:
            self.from_token = from_token
            self.from_length = from_length
            self.to_token = to_token
            self.model = model

    def __init__(self) -> None:
        self.registry = {}

    # fit a tokenizer
    def create_tokenizer(self, lines):
        tokenizer = Tokenizer()
        tokenizer.fit_on_texts(lines)
        return tokenizer

    # max sentence length
    def max_length(self, lines):
        return max(len(line.split()) for line in lines)

    def encode_sequences(self, tokenizer, length, lines):
        # integer encode sequences
        X = tokenizer.texts_to_sequences(lines)
        # pad sequences with 0 values
        X = pad_sequences(X, maxlen=length, padding='post')
        return X

    # one hot encode target sequence
    def encode_output(self, sequences, vocab_size):
        ylist = list()
        for sequence in sequences:
            encoded = to_categorical(sequence, num_classes=vocab_size)
            ylist.append(encoded)
        y = np.array(ylist)
        y = y.reshape(sequences.shape[0], sequences.shape[1], vocab_size)
        return y

    # define seq2seq model
    def define_model(self, src_vocab, tar_vocab, source_steps, target_steps, embedding_dim):
        model = Sequential()
        # encoder
        model.add(Embedding(src_vocab, embedding_dim, 
                    input_length=source_steps, mask_zero=True))
        model.add(LSTM(embedding_dim))
        model.add(RepeatVector(target_steps))
        # decoder
        model.add(LSTM(embedding_dim, return_sequences=True))
        model.add(TimeDistributed(Dense(tar_vocab, activation='softmax')))
        # compile model
        model.compile(optimizer='adam', loss='categorical_crossentropy')
        # summarize defined model
        #model.summary()
        return model

    # map an integer to a word
    def word_for_id(self, integer, tokenizer):
        for word, index in tokenizer.word_index.items():
            if index == integer:
                return word
        return None
    
    # generate target given source sequence
    def predict_sequence(self, model, tokenizer, source):
        prediction = model.predict(source, verbose=0)[0]
        integers = [argmax(vector) for vector in prediction]
        target = list()
        for i in integers:
            word = self.word_for_id(i, tokenizer)
            if word is None:
                break
            target.append(word)
        return ' '.join(target)

    def load_translator(self, translate_name, data_path, weights_path):
		# read from local
        file = open(data_path, mode='rt', encoding='utf-8')
        text = file.read()

        # convert to list
        lines = text.strip().split('\n')
        pairs = [line.split(' - ') for line in lines]

        # convert to array
        pairs = np.array(pairs)

        en_tokenizer = self.create_tokenizer(pairs[:, 1])
        en_vocab_size = len(en_tokenizer.word_index) + 1
        en_length = self.max_length(pairs[:, 1])

        elv_tokenizer = self.create_tokenizer(pairs[:, 0])
        elv_vocab_size = len(elv_tokenizer.word_index) + 1
        elv_length = self.max_length(pairs[:, 0])

        model = self.define_model(en_vocab_size, elv_vocab_size, en_length, elv_length, 256)
        model.load_weights(weights_path)

        self.registry[translate_name] = self.TrasnslatorData(en_tokenizer, en_length, elv_tokenizer, model)

        print('Loaded %s translator successfully' % translate_name)

    def translate(self, translate_name, text):

        translator = self.registry[translate_name]
        
        
        text = text.replace("don't", "do not")
        text = text.replace("dont", "do not")

        text = text.replace("it's", "it is")
        text = text.replace("its", "it is")

        text = text.replace("what's", "what is")
        text = text.replace("whats", "what is")

        # my_testX = self.encode_sequences(translator.from_token, translator.from_length, text.split(' '))
        out = self.encode_sequences(translator.from_token, translator.from_length, [ text ])

        sentence = ''
        # for i in out:
        #     source = i.reshape((1, i.shape[0]))
        #     sentence += self.predict_sequence(translator.model, translator.to_token, source) + ' '

        return self.predict_sequence(translator.model, translator.to_token, out[0].reshape((1, out[0].shape[0])))