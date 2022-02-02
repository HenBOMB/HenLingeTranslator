const { readFileSync, writeFileSync } = require('fs')
// const lines = readFileSync('./data/eng2eld_raw.txt').toString().split('\n')
const lines = readFileSync('./engine_new/data/eld_conjugation.txt').toString().split('\n')
const data = {}

const reg = /\([a-zA-Z, 1-9\/]+\)/gm

let key = 'default'

lines.forEach(line => {

    // Remove all comments
    // TODO: prevent duplicates from re-inserting themselves
    
    if(line[0] === '?')
        return

    line = line.replace(/(#.+)/gm, '')

    if(line.length < 5) 
        return

    // Key separator
    if(line[0] === '-')
    {
        key = line.slice(1).trim()
        data[key] = {}
        return
    }

    // Split the word and it's translation
    let v = line.split('-')
    
    // Make sure the word has a translation
    if(v.length != 2) 
        return

    const insert_value = (pointer, value, tag) => 
    {
        let pointers = pointer.split(',')
        
        if(pointers.length > 1)
            return pointers.forEach(pointer => {
                insert_value(pointer, value, tag)
            });

        pointer = pointer.trim()
        value = value.trim()

        pointer = pointer.replace(reg, '').trim()
        
        let t = { v: value }
        if(tag != undefined)
            t['t'] = tag.split(',') 
            
        if(pointer in data[key])
        {
            if(Array.isArray(data[key][pointer]))
            {
                if(!data[key][pointer].includes(t))
                    data[key][pointer].push(t)
            }
            else
                data[key][pointer] = [data[key][pointer], t]
        }
        else
            data[key][pointer] = t

        // if(pointer in data[key])
        //     data[key][pointer].push(t)
        // else
        //     data[key][pointer] = [t]
    }
    
    let tag = v[0].match(reg)

    v[0] = v[0].replace(reg, '').trim()
    v[1] = v[1].trim()

    if(tag === null)
        tag = undefined
    else
        tag = tag[tag.length-1].slice(1, -1).replace(/ /g,'').trim()

    let pointers = v[0].split('/')
    let values = v[1].split('/')

    // him / his / her, hers (pron) - it / 'et / 't
    // pointers = ["him", "his", "her, hers"]
    // values = ["it", "'et", "'t"]

    // under / underneath (prep) - ys
    // pointers = ["under", "underneath"]
    // values = ["ys"]

    if(pointers.length > 1 && pointers.length === values.length)
    {
        for (let i = 0; i < pointers.length; i++) 
            insert_value(pointers[i], values[i], tag)
    }
    else if(pointers.length > 1)
    {
        pointers.forEach(pointer => {
            insert_value(pointer, v[1], tag)
        });
    }
    else
        insert_value(v[0], v[1], tag)
});

// cleanup for single item arrays and single key dictionaries?

const keys = Object.keys(data)

keys.forEach(key => {
    const pointers = Object.keys(data[key])

    pointers.forEach(pointer => {
        if(data[key][pointer].length == 1)
            data[key][pointer] = data[key][pointer][0]

        if(Object.keys(data[key][pointer]).length === 1)
            data[key][pointer] = data[key][pointer]['v']

        if(data[key][pointer]['t'] != undefined && data[key][pointer]['t'].length === 1)
            data[key][pointer]['t'] = data[key][pointer]['t'][0]
    });
});

// writeFileSync('./data/eng2eld_registry.json', JSON.stringify(data, null, 2))
writeFileSync('./engine_new/data/eld_conjugation.json', JSON.stringify(data, null, 2))