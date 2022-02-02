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
from keras.callbacks import ModelCheckpoint
from nltk.translate.bleu_score import corpus_bleu

# read from local
file = open('eng_to_eld.txt', mode='rt', encoding='utf-8')
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

# shuffle data
dataset = np.array(pairs)
np.random.shuffle(dataset)
# train, test = dataset[:475,:], dataset[475:,:]
train, test = dataset[:400,:], dataset[400:,:]

# prepare training data
trainX = encode_sequences(en_tokenizer, en_length, train[:, 1])
trainY = encode_sequences(elv_tokenizer, elv_length, train[:, 0])
trainY = encode_output(trainY, elv_vocab_size)

# prepare validation data
testX = encode_sequences(en_tokenizer, en_length, test[:, 1])
testY = encode_sequences(elv_tokenizer, elv_length, test[:, 0])
testY = encode_output(testY, elv_vocab_size)

# define seq2seq model
def define_model(src_vocab, tar_vocab, source_steps, target_steps, 
		 embedding_dim):
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
	model.summary()
	return model

model = define_model(en_vocab_size, elv_vocab_size, en_length, elv_length, 256)

# checkpoint = ModelCheckpoint('model_en_elv.ckpt', monitor='val_loss', 
#                               verbose=1, save_best_only=True, mode='min')

# history = model.fit(trainX, trainY, epochs=600, batch_size=16, 
#                     validation_data=(testX, testY), 
#                     callbacks=[checkpoint], verbose=2)

# model.save_weights('model/model_en_elv')

model.load_weights('model/model_en_elv')

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

# evaluate the model
def evaluate_model(model, sources, raw_dataset):
	actual, predicted = list(), list()
	for i, source in enumerate(sources):
		# translate encoded source text
		source = source.reshape((1, source.shape[0]))
		translation = predict_sequence(model, elv_tokenizer, source)
		raw_target, raw_src = raw_dataset[i]
		if i < 10:
			print('src=[%s], target=[%s], predicted=[%s]' % (raw_src, raw_target, translation))
		actual.append(raw_target.split())
		predicted.append(translation.split())
	# calculate BLEU score
	print('BLEU-1: %f' % corpus_bleu(actual, predicted, weights=(1.0, 0, 0, 0)))
	print('BLEU-2: %f' % corpus_bleu(actual, predicted, weights=(0.5, 0.5, 0, 0)))
	print('BLEU-3: %f' % corpus_bleu(actual, predicted, weights=(0.3, 0.3, 0.3, 0)))
	print('BLEU-4: %f' % corpus_bleu(actual, predicted, weights=(0.25, 0.25, 0.25, 0.25)))
	
evaluate_model(model, testX, test)