// filterExpression/lexemUtils.js
// LayerRenamer
//
// created by Leonard Pauli, jun 2018
// copyright © Leonard Pauli 2018
//
// based on rim / towards rim

import sfo, {log} from 'string-from-object'
const concat = xxs=> xxs.reduce((a, xs)=> (a.push(...xs), a), [])


// Philosofy:
// 	- expressions should always parse, syntax errors reported back + skipped gracefully, warnings auto fixed (+ reported back)
// 	- parsed code should always be evaluatable


// lexems flags

export const flags = {
	autoInsertIfNeeded: true, // if no other paths are valid, insert token even if it didn't exist, useful for eg. autoclose
	optional: true,
	repeat: true, // is one or more (+) by default, combine repeat + optional to get 0 or more (*)
	usingOr: true,
}

// lexems example
const keysMeta = 'name,description'.split(',')
const keysMatch = 'regex,retain,lexems,usingOr'.split(',')
const keysTokenizerReserved = 'matched,tokens,match,location'.split(',')
export const keysReserved = concat([keysMeta, keysMatch, keysTokenizerReserved, Object.keys(flags)])

/*
const lexem = {}
const lexemMatch = {
	regex: /^((g1)|(g2))/,
	retain: true, // true (all), n (retain n chars), -n (retain match.length-n chars), false | 0 (retain no chars)
} || {
	...{usingOr: true}||{lexemsModeAnd: false}, // match one of them || match all of them after each other (default)
	lexems: [lexem, lexem, ...lexem],
}
const lexemBase = {
	name: '...', // autogenerated from lexems tree structure, eg. text.expr.open
	description: 'what this lexem is...',
	someSubLexem: lexem,
}
const lexemExample = { ...lexemBase, ...lexemMatch, ...flags }
*/


// process lexems
const lexemValidateFix = lexem=> {
	if (!lexem.name) throw new Error(
		`lexem(${sfo(lexem, 2)}).name not set`)

	if (lexem.regex) {
		if (!(lexem.regex instanceof RegExp)) throw new Error(
			`lexem(${lexem.name}).regex (should be) instanceof RegExp (was ${lexem.regex})`)
		lexem.retain = lexem.retain === void 0? true: lexem.retain===false? 0: lexem.retain
	} else if (lexem.lexems) {
		if (!Array.isArray(lexem.lexems)) throw new Error(
			`lexem(${lexem.name}).lexems has to be array`)
		lexem.usingOr = lexem.usingOr || false
		if (lexem.usingOr && lexem.lexems.some(l=> l.optional)) throw new Error(
			`lexem(${lexem.name}).lexems has one optional, not allowed + ambiguos/doesn't make sense when usingOr`)
	} else throw new Error(
		`lexem(${lexem.name}) has to have a matcher (.regex/.lexems)`)
}
const _process = (lexem, k, parent=null, state={named: new Set(), noname: new Set()})=> {
	// process meta
	lexem.name = lexem.name || (parent && parent.name+'.' || '')+k
	state.named.add(lexem)

	// validate matcher + set defaults
	lexemValidateFix(lexem)
	if (lexem.lexems) lexem.lexems.forEach((l, k)=>
		!l.name && state.noname.add([l, k, lexem]))

	// process children
	const keysChildren = Object.keys(lexem).filter(k=> !keysReserved.includes(k))
	keysChildren.forEach(k=> _process(lexem[k], k, lexem, state))
}

const recursivelyAddNameToLexems = ([lexem, k, parent])=> {
	if (!lexem.name) {
		lexem.name = (parent && parent.name+'.' || '')+k
		lexem.lexems && lexem.lexems.forEach((l, k)=> recursivelyAddNameToLexems([l, k, lexem]))
	}
	lexemValidateFix(lexem)
}

export const expand = root=> {
	const state = {named: new Set(), noname: new Set()}
	_process(root, '@', null, state)
	state.noname.forEach(recursivelyAddNameToLexems)
	// intermediate lexems = named through recursivelyAddNameToLexems
	// all lexems = state.named + intermediate lexems
}


/* Notes
§1234567890+´¨'-.,<
°!"#€%&/()=?`^*_:;>
¶©@£$∞§|[]≈±´~™–…‚≤
•¡”¥¢‰¶\{}≠¿`^’—·„≥
•Ω®†ıπ˙ß∂ƒ¸˛√ªﬁøæ÷≈‹›‘’°˜ˆ∏˚◊∫¯˘¬º«»”

<>≤≥
'"„”`´’‘«»‹›
§1234567890
±+-/=≈^*~√÷≈≠
,‚:;
#‰%&|
!?¡¿
¶@§–…
¶—•·
©™®†ı¸˛
°˜ˆ˘˚˙¨¯
∞Ω¥¢£$€
πß∂ƒªﬁøæ
∏◊∫¬º

()[]{}\\
*/
