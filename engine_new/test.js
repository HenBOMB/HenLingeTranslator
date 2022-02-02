const { lexicon } = require("en-lexicon");
const { readFileSync } = require("fs");
const inflectors = require("en-inflectors").Inflectors;
const utils = require('./translator_utils')
const data = JSON.parse(readFileSync('./data/eng2eld_registry.json'))

// incorrect
// we 'ran' --> plural, irregular, third person, past participle active voiced verb
// would translate to: lan es reinte (i think)

// test.analyze('love', 'i love you') // a mein the
// test.analyze('love', 'my love') // 'me mein

// utils.analyze('destroy', 'me and her love will destroy them') // me i it mein thenaperthe lan

// console.log(lexicon.olive) // ush
// console.log(lexicon.olives) // ushana
// console.log(lexicon.at)
// console.log(lexicon.your)
// console.log(lexicon.final) // ceann = voiceless, consonant
// console.log(lexicon.stronger) // ceann = voiceless, consonant


// At your final breath, a shitless death

// ends in less -> -eth

// yn 'eth ceann kess, dungeth vol
// 'eth caeannme kess, dungeth vol

// it's time to go home
// hig a vein a mor es kempte

// mor

// we'll find another way to survive, we always do.
// nina hul en ire
// we'll find another path to survival. we always do.
// nina hul en ire a eipveishen. evelig es't enet

//VBN &| VBD

// function -> if (VBN || VBD, PRP || PRP$) exists:

// Source: I allowed it. He claims he knows the child.
// Translation goal from author: A t'ave thembente. Het dike kwe't veshen wed.

// Result of translating without rephrasing: A ave thembente. Het dike veshen

// Reprased english sentence with elven grammar: I it-have allowed. He claims that-he knows child
// The '-' connects the both words, easier to parse in code (helps the translator identify words with apostrophe)
// The words basically get moved around behind the verb connectors
// Result of translating with rephrasing: A t'ave thembente. Het dike kwe't veshen wed.

// The t' | 't goes on the side of the PRP, next to the word before the verb

// Examples of case
// I allowed it     ->  I it-have allowed       ->      A t'ave thembente
// We allowed her   ->  We her-have allowed     ->      Nina aven thembente (tf do i do with 'her')

const source = 'I allowed it'
let translation = ''

// Thembente (voiceless, vowel, 1p/2p/3p)

// First source = I allowed it
// First phase = A eif thembente it

// i have
// i was

// Second source = I allowed it
// Broken down = FW|PRP, VBN|JJ|VBD, PRP
// Second source fixed = I allowed it
// Second source fixed = I it-have allowed
// Goal = A ave thembente (voiceless, vowel) it

// I allowed it
// I it-was allowed
// i it-have allowed

// I was allowed
// I was allowed

// we ran
// we have ran
// we was ran
// tom ate a fish
// tom ate a fish


// if the sentence has a personal noun (PRP) infront of the verb (VB) and that is an adjetive (JJ) aswell??
// look for: PRP - VB - PRP
// example: Henry(N) was(VBD|:) given(VBN|JJ|VBD) it(PRP)
// fixed:   Henry it-was given

// if the sentnce has a person noun next to a verb

// He(NNS|VBZ) claims(PRP|VB) he(NNS|VBZ) knows(VBZ) the(DT|VBD|VBP|NN|IN|JJ|NNP|PDT) child(NN)
// He claims that-he knows child

// He knows the child
// He knows the child


// rephrase the sentence with elvish grammar

// is rephrasable using VB-PRP method?
if(utils.annoteSearch([
    w => utils.hasAnnotaion(w, ['VBN', 'VBD']), 
    w => utils.hasAnnotaion(w, ['PRP', 'PRP$'])], source, false))
    return // undone


const sentence = 'hello dear'
let output = ''
sentence.replace(/[\.,-]/g,'').split(' ').forEach(text => {
    output += `${text}(${lexicon[text]}) `
});
console.log(output)