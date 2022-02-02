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

# read from local
file = open('engine/eng_to_eld.txt', mode='rt', encoding='utf-8')
text = file.read()

# convert to list
lines = text.strip().split('\n')
pairs = [line.split(' - ') for line in lines]

# convert to array
pairs = np.array(pairs)

# fit a tokenizer
def create_tokenizer(lines):
	tokenizer = Tokenizer()
	tokenizer.fit_on_texts(lines)
	return tokenizer

# max sentence length
def max_length(lines):
	return max(len(line.split()) for line in lines)

def encode_sequences(tokenizer, length, lines):
	# integer encode sequences
	X = tokenizer.texts_to_sequences(lines)
	# pad sequences with 0 values
	X = pad_sequences(X, maxlen=length, padding='post')
	return X

en_tokenizer = create_tokenizer(pairs[:, 1])
en_vocab_size = len(en_tokenizer.word_index) + 1
en_length = max_length(pairs[:, 1])

elv_tokenizer = create_tokenizer(pairs[:, 0])
elv_vocab_size = len(elv_tokenizer.word_index) + 1
elv_length = max_length(pairs[:, 0])

# one hot encode target sequence
def encode_output(sequences, vocab_size):
	ylist = list()
	for sequence in sequences:
		encoded = to_categorical(sequence, num_classes=vocab_size)
		ylist.append(encoded)
	y = np.array(ylist)
	y = y.reshape(sequences.shape[0], sequences.shape[1], vocab_size)
	return y

# define seq2seq model
def define_model(src_vocab, tar_vocab, source_steps, target_steps, embedding_dim):
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
def word_for_id(integer, tokenizer):
	for word, index in tokenizer.word_index.items():
		if index == integer:
			return word
	return None
  
# generate target given source sequence
def predict_sequence(model, tokenizer, source):
	prediction = model.predict(source, verbose=0)[0]
	integers = [argmax(vector) for vector in prediction]
	target = list()
	for i in integers:
		word = word_for_id(i, tokenizer)
		if word is None:
			break
		target.append(word)
	return ' '.join(target)

# shuffle data
dataset = np.array(pairs)
np.random.shuffle(dataset)
train, test = dataset[:400,:], dataset[400:,:] # 475 total

# prepare validation data
testX = encode_sequences(en_tokenizer, en_length, test[:, 1])
testY = encode_sequences(elv_tokenizer, elv_length, test[:, 0])
testY = encode_output(testY, elv_vocab_size)

model = define_model(en_vocab_size, elv_vocab_size, en_length, elv_length, 256)
model.load_weights('engine/elvish/model_en_elv')

my_testX = encode_sequences(en_tokenizer, en_length, ["Rise up"])
uwu = my_testX[0]
source = uwu.reshape((1, uwu.shape[0]))
translation = predict_sequence(model, elv_tokenizer, source)
print(translation)