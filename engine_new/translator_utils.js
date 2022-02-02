const { lexicon } = require("en-lexicon");
const { stemmer } = require("en-stemmer")
const inflectors = require("en-inflectors").Inflectors;

const voiced = ['b', 'd', 'g', 'j', 'l', 'm', 'n', 'ng', 'r', 'sz', 'th', 'v', 'w', 'y', 'z']
const voiceless = ['ch', 'f', 'k',' p', 's', 'sh', 't', 'th']
const vowels = ['a', 'e', 'i',' o', 'u']
const first_person = ["i", "we", "me", "us", "my", "mine", "ours"]
const second_person = ["you", "your", "yours"]
const third_person = ['he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves']
const plural = ['they', 'them', 'their', 'theirs', "y'all", 'our', 'ours', 'us', 'we']

module.exports = 
{
    rephraseToBase : function (sentence)
    {
        sentence = this.clean(sentence)
        if(this.isEmpty(sentence)) return undefined

        sentence.match(/[a-zA-Z]+/g).forEach(word => {
            sentence = sentence.replace(word, new inflectors(word).toPresent())
        });

        return sentence
    },

    getConjugationTags : function(sentence)
    {
        sentence = this.clean(sentence)
        if(this.isEmpty(sentence)) return undefined
        // (1p|2p|3p, present|past, singular|plural)

        const tags = {d:[]}
        const verbs = this.getVerbs(sentence)

        if(this.isFirstPerson(sentence))
            tags['d'].push('1p')
        else if(this.isSecondPerson(sentence))
            tags['d'].push('2p')
        else if(this.isThirdPerson(sentence))
            tags['d'].push('3p')

        if(this.isPlural(sentence))
            tags['d'].push('pl')
        else
            tags['d'].push('si')

        if(verbs === undefined)
            return undefined
        
        verbs.forEach(verb => {
            if(this.isPresentFormVerb(verb))
                tags[verb] = 'pr'
            if(this.isPastTenseVerb(verb) || this.isPastParticipleVerb(verb))
                tags[verb] = 'pa'
        });

        return tags
    },

    breakDown : function(sentence)
    {
        sentence = this.clean(sentence)
        if(this.isEmpty(sentence)) return undefined

        const words = sentence.split(' ')

        // const verbs = {}
        // let subject = {}
        // let predicate = {}

        // for (let i = 0; i < words.length; i++) 
        // {
        //     const word = words[i]

        //     if(this.isVerb(word))
        //     {
        //         verbs[word] = i
                
        //         if(Object.keys(subject).length === 0)
        //         {
        //             for (let i1 = 0; i1 < i + 1; i1++) 
        //                 subject[words[i1]] = lexicon[words[i1]]
        //             for (let i1 = i; i1 < words.length; i1++) 
        //                 predicate[words[i1]] = lexicon[words[i1]]
        //         }
        //     }
        // }

        // return [ subject, predicate, verbs ]
    
        let data = {}

        for (let i = 0; i < words.length; i++) 
        {
            const word = words[i]
            data[word] = lexicon[word].split('|')
        }

        return data
    },

    analyze : function(word, sentence)
    {
        word = this.clean(word)
        if(this.isEmpty(word)) return undefined
        sentence = this.clean(sentence)
        if(this.isEmpty(sentence)) return undefined

        const words = sentence.toLowerCase().split(' ')

        console.clear()

        const isVerb = this.getVerbs(sentence) != undefined

        console.log(`-- Sentence`)
        console.log(`Person    -->  ${this.isFirstPerson(sentence)? 'First' : this.isSecondPerson(sentence)? 'Second' : this.isThirdPerson(sentence)? 'Third' : 'Error'}`)
        console.log(`Is plural -->  ${this.isPlural(sentence)? "Yes" : "No"}`)
        console.log(`-- Word`)
        console.log(`Voice     -->  ${this.isVoiced(word)? 'Voiced' : this.isVoiceless(word)? 'Voiceless' : 'None'}`)
        console.log(`Ends in   -->  ${this.isVowelFinal(word)? 'Vowel' : 'Consonant'}`)
        if(isVerb)
        {
            console.log(`Verb Type -->  ${this.isRegularVerb(word)? 'Regular' : 'Irregular'}`)
            console.log(`Voice     -->  ${this.isPassiveVoice(sentence)? 'Passive' : this.isActiveVoice(sentence)? 'Active' : 'None'}`)
            console.log(`Tense     -->  ${this.isPastTenseVerb(word)? 'Past' : this.isPastParticipleVerb(word)? 'Past participle' : 'Present'}`)
            console.log(`Present   -->  ${new inflectors(word).toPresent()}`)
            const connected = this.getConnectedVerb(word, sentence)
            if(connected)
            {
                console.log(`Verb:     -->  ${connected} ${word}`)
                console.log(`Converted -->  to ${word}`)
            }
        }
    }, 
    
    annoteReplace : function (annotations, sentence, haveAll = false)
    {
        sentence = this.clean(sentence)
        if(this.isEmpty(sentence)) return undefined

        sentence.match(/[a-zA-Z]+/g).forEach(text => {

            if(this.hasAnnotaions(text, annotations, haveAll = haveAll))
                sentence = sentence.replace(text, '')
        });

        return sentence.trim()
    },

    // look for a combination of annotations
    annoteSearch : function(annotations, sentence, spacing = true, toBase = false)
    {
        sentence = this.clean(sentence)
        if(this.isEmpty(sentence)) return undefined
        
        let count = 0
        let output = []

        const words = sentence.split(' ')

        for (let i = 0; i < words.length; i++) {
            const word = words[i];

            if(typeof(annotations[count]) === 'string')
            {
                if(this.hasAnnotaion(toBase? new inflectors(word).toPresent() : word, annotations[count]))
                {
                    output.push(word)
                    count++
                }
            }
            else if(Array.isArray(annotations[count]))
            {
                for (let i2 = 0; i2 < annotations[count].length; i2++) {
                    
                    if(this.hasAnnotaion(toBase? new inflectors(word).toPresent() : word, annotations[count][i2]))
                    {
                        output.push(word)
                        count++
                        break
                    }
                };
            }
            else if(annotations[count](toBase? new inflectors(word).toPresent() : word))
            {
                output.push(word)
                count++
            }
            else if(!spacing && count != 0)
                return undefined

            if(count === annotations.length) 
                return output
        };

        return undefined
    },

    // anna painted the house
    // the house was painted by anna

    // active:  subject + verb + object
    // passive: object + verb + subject

    isActiveVoice : function(sentence)
    {
        sentence = this.clean(sentence)
        if(this.isEmpty(sentence)) return false

        if(this.isPassiveVoice(sentence))
            return false

        if(this.annoteSearch([v => this.hasAnnotaion(v, ['NN', 'PRP']), v => this.isVerb(v)], sentence) != undefined)
            return true

        return false
    },

    isPassiveVoice : function(sentence)
    {
        sentence = this.clean(sentence)
        if(this.isEmpty(sentence)) return false
        
        if(sentence.includes('by') || 
        sentence.includes('be') ||
        sentence.includes('been') ||
        sentence.includes('was being'))
            return true

        return false
    },

    isPlural : function(sentence)
    {
        if(this.isEmpty(sentence)) return false
        sentence = this.clean(sentence)
        return this.boolLoop(plural, v => sentence.includes(v))
    },

    isFirstPerson : function(sentence)
    {
        if(this.isEmpty(sentence)) return false
        sentence = this.clean(sentence)
        return this.boolLoop(first_person, (v) => sentence.includes(v))
    },

    isSecondPerson : function(sentence)
    {
        if(this.isEmpty(sentence)) return false
        sentence = this.clean(sentence)
        return this.boolLoop(second_person, (v) => sentence.includes(v))
    },

    isThirdPerson : function(sentence)
    {
        if(this.isEmpty(sentence)) return false
        sentence = this.clean(sentence)
        return this.boolLoop(third_person, (v) => sentence.includes(v))
    },

    isExtraVerb : function(word, sentence)
    {
        if(this.isEmpty(sentence)) return false
        if(!this.isVerb(word)) return false

        const words = this.clean(sentence).split(' ')
        const index = words.indexOf(this.clean(word))

        return index != -1 && index + 1 != words.length && this.isVerb(words[index + 1]) && !this.hasAnnotaion(words[index + 1], 'PR')
    },

    isPresentFormVerb : function(word)
    {
        word = this.clean(word)
        if(this.isEmpty(word)) return false
        return this.isVerb(word) && this.hasAnnotaion(word, 'VBZ') || this.hasAnnotaion(word, 'VBP')
    },

    isPastTenseVerb : function(word) 
    { 
        word = this.clean(word)
        if(this.isEmpty(word)) return false
        return this.isVerb(word) && this.hasAnnotaion(word, 'VBD') 
    },

    isPastParticipleVerb : function(word) 
    { 
        word = this.clean(word)
        if(this.isEmpty(word)) return false
        return this.isVerb(word) && this.hasAnnotaion(word, 'VBN') 
    },
    
    isVerb : function(word) 
    { 
        word = this.clean(word)
        if(this.isEmpty(word)) return false
        return this.hasAnnotaion(word, 'VB')
    },

    hasVerb : function(sentence = undefined) 
    { 
        sentence = this.clean(sentence)
        if(this.isEmpty(sentence)) return false

        if(this.annoteSearch([v => this.hasAnnotaion(v, ['POS', 'PRP$']), 'VB'], sentence, spacing = false) != undefined)
            return false

        return this.annoteSearch(['VB'], sentence) != undefined
    },

    isRegularVerb : function(word)
    {
        word = this.clean(word)
        if(this.isEmpty(word)) return false
        return (word.endsWith('ed') || word.endsWith('d')) && this.isVerb(word)
    },

    isVoiced : function(word, skip = false)
    {
        word = this.clean(word)
        if(this.isEmpty(word)) return false

        if(skip)
            for (let i = 0; i < voiceless.length; i++) 
                if(word.startsWith(voiceless[i])) 
                    return false

        return this.boolLoop(voiced, item => word.includes(item))
    },

    isVoiceless : function(word)
    {
        word = this.clean(word)
        if(this.isEmpty(word)) return false
        return this.boolLoop(voiceless, item => word.startsWith(item))
    },

    isVowelFinal : function(word)
    {
        word = this.clean(word)
        if(this.isEmpty(word)) return false
        return this.boolLoop(vowels, item => word.endsWith(item))
    },

    getConnectedVerb : function(word, sentence)
    {
        if(!this.isVerb(word)) return undefined
        word = this.clean(word)
        if(this.isEmpty(word)) return undefined
        sentence = this.clean(sentence)
        if(this.isEmpty(sentence)) return undefined

        const words = this.clean(sentence).split(' ')
        const index = words.indexOf(this.clean(word))

        if(index != 0 && this.isVerb(words[index - 1]))
            return words[index - 1]
        return undefined
    },

    getVerbs : function(sentence)
    {
        sentence = this.clean(sentence)
        if(this.isEmpty(sentence)) return undefined

        const broken = this.breakDown(sentence)
        const verbs = []

        Object.keys(broken).forEach(key => {
            if(!broken[key].toString().includes('VB'))
                return
            
            if(this.getConnectedVerb(key, sentence) === undefined)
                verbs.push(key)
        });

        return verbs
    },

    //////

    clean : function(word)
    {
        if(this.isEmpty(word)) return undefined
        word = word.toLowerCase().trim()
        word = word.replace(/ /g,'X').replace(/[\W\d]+/g,'')
        return word.replace(/X+/g, ' ')
    },

    isEmpty : function(word)
    {
        return word === undefined || word === "" || word.match(/^ *$/) !== null
    },

    hasAnnotaion : function(word, annotation)
    {
        if(this.isEmpty(word))
            return false

        word = this.clean(word)
        const annotations = lexicon[word]

        if(Array.isArray(annotation))
            return annotations != undefined && this.boolLoop(annotation, a => annotations.includes(a))
        
        return annotations != undefined && annotations.includes(annotation)
    },

    hasAnnotaions : function(word, annotations, haveAll = false)
    {
        let count = 0
        
        for (let i = 0; i < annotations.length; i++)
        {
            const anns = lexicon[word]
            if(this.boolLoop(annotations[i], a => anns.includes(a)))
            {
                if(haveAll)
                    count++
                else
                    return true
            }
        }

        return count == annotations.length
    },

    boolLoop : function(array, predicate)
    {
        for (let i = 0; i < array.length; i++) 
            if(predicate(array[i])) 
                return true
        return false
    }
}