const { lexicon } = require('en-lexicon');
const { readFileSync } = require('fs')
var { compareTwoStrings } = require("string-similarity");
var utils = require('./translator_utils')
const inflectors = require("en-inflectors").Inflectors;

const data = JSON.parse(readFileSync('./data/eng2eld_registry.json'))
const conjugation = JSON.parse(readFileSync('./data/eld_conjugation.json'))
const keys = Object.keys(data)

//#region old translator
/*

const sentence = 'I allowed it to happen'
const goal = 'keidmil mine'

const length = sentence.split(' ').length
var translation = ''
var accuracy = 0

for (let i = 0; i < length; i++) 
{
    let best_match = ''
    let word = words[i]
    let distance = 0

    keys.forEach(key => {
    
        Object.keys(data[key]).forEach(pointer => {
    
            let similarity = compareTwoStrings(word, pointer);
            
            if(similarity > distance)
            {
                distance = similarity
                // get the translation

                let obj = data[key][pointer]

                if(typeof(obj) === 'object')
                    best_match = obj['v']
                else
                    best_match = obj
            }
        });
    });

    translation += best_match + ' '
    accuracy += distance
}

accuracy /= length
accuracy *= 100

console.log(`
-------------------------
Source:         ${sentence}
Goal:           ${goal}
Translation:    ${translation}
Accuracy:       ${accuracy}%
-------------------------`)

*/
//#endregion

function translate(sentence)
{
    let rephrased = sentence.toLowerCase().replace('have', '').trim()

    // remove 'does'
    // remove 'a'

    rephrased = rephrased.replace(/does/g, '')
    rephrased = rephrased.replace(/ a /g, '')
    rephrased = rephrased.replace(/  +/g, ' ')

    // remove the from "... the NN ..." 
    let replacer = utils.annoteSearch([a => a === 'the', 'NN'], rephrased, false)
    if(replacer !== undefined)
    {
        let replacer2 = replacer.toString().replace(/,/g, ' ')
        rephrased = rephrased.replace(replacer2, replacer[replacer.length - 1]) 
    }

    // PRP or PRP$ surrouned by 2 verbs
    // He claims he knows the child.
    // He claims that-he knows child.
    search = utils.annoteSearch(['VBP', ['PRP', 'PRP$'], 'VBP'], rephrased, false, true)
    if(search != undefined)
    {
        const begin = rephrased.slice(0, rephrased.indexOf(search[0]) + search[0].length)
        const end = rephrased.slice(rephrased.indexOf(search[2]))
        rephrased = `${begin} that-${search[1]} ${end}`.replace(/  +/g, ' ')
    }
    else
    {
        // I allowed it
        // -->
        // I it-have allowed
        var search = utils.annoteSearch([['PRP','NNP'], 'VB', ['PRP','NNP']], rephrased, false)
        if(search != undefined)
        {
            const verb = search[1]
            const begin = rephrased.slice(0, rephrased.indexOf(verb) - 1)
            const end = rephrased.slice(rephrased.indexOf(verb) + verb.length + search[2].length + 1)
            rephrased = `${begin} ${search[2]}-have ${verb} ${end}`.replace(/  +/g, ' ')
        }
    }

    return rephrased.trim()
}

console.log(translate('he claims he knows the child'))
console.log(translate('does he know him'))

// Het dike kwe't veshen wed.

// he claims that-he knows child
// Het dike kwe het vesh wed
// Het dike kwe't veshen wed

console.log(lexicon.knows) // VBZ = Present form, 3rd person (Present Participle?)

//Present Participle = verb ending in 'ing'