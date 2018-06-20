// filterExpression/lexems.js
// LayerRenamer
//
// created by Leonard Pauli, jun 2018
// copyright © Leonard Pauli 2018
//
// based on rim / towards rim

import {log} from 'string-from-object'
import {stupidIterativeObjectDependencyResolve} from '../object'

import {flags, expand} from './lexemUtils'
const {autoInsertIfNeeded, optional, repeat, usingOr} = flags


// lexems definition

const root = stupidIterativeObjectDependencyResolve(({
	lexems, paren, num, spv, spvo, expr, text, dot, comma, id,
})=> ({
	lexems: [expr],
	paren: {
		lexems: [paren.open, spvo, expr, spvo, [paren.close, {autoInsertIfNeeded}]],
		open: {regex: /^\(/},
		close: {regex: /^\)/},
	},
	num: {regex: /^[1-9][0-9]*(\.[0-9]+)?/, description: 'number'},
	spv: {regex: /^[\t ]+/, description: 'space-vertical (optional for formatting / min 1 req for separation / elastic tab for alignment)'},
	spvo: {...spv, optional},
	expr: {
		description: 'expression',
		lexems: [expr.single, {repeat, optional, usingOr, lexems: [spvo, expr.single]}],
		single: {
			usingOr, lexems: [
				num,
				text,
				paren,
				id.strip,
				id.special,
			],
		},
	},
	text: {
		open: {regex: /^"/},
		close: {regex: /^"/},
		raw: {regex: /^(([^\\"]|\\[\\"])*)/},
		expr: {
			open: {regex: /^\\\(/, retain: -1},
			lexems: [text.expr.open, expr],
		},
		inner: {
			lexems: [{repeat, optional, usingOr, lexems: [text.raw, text.expr]}],
		},
		lexems: [text.open, text.inner, {...text.close, autoInsertIfNeeded}],
	},
	dot: {regex: /^\./},
	comma: {regex: /^,/},
	id: {
		regex: /^[^ .(){}[\]\n\t"]+/,
		strip: {
			usingOr, lexems: [id, {lexems: [{...id, optional}, // abc, .a."b".("b"+c)
				{lexems: [dot, {usingOr, lexems: [id, text, paren]}], optional, repeat}]}],
		},
		special: {
			regex: /^[-<>=+*/!,]+/, // !%&\/=?^*<>@$§|≈±~–,≤≥•‰≠·
		},
	},
}))


// TODO: expand (fn -> obj, name, validate) + test
expand(root)
export default root
