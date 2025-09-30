import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

/**
 * Enhanced Huacat Pink theme color palette
 * ----------------------------------------
 * Colors organized by function from the Huacat Pink VS Code theme
 */

// Core UI colors
const base00 = '#f5eaf5', // Background (soft pink background)
	base01 = '#72696f', // Foreground (main text color)
	base03 = '#978c94', // Comments, subdued text
	// Primary accent
	base05 = '#dd71b9', // Primary pink accent
	// Syntax highlighting colors
	base06 = '#5782df', // Keywords - blue
	base07 = '#db6363', // Other keywords, constants - red
	base08 = '#62ad44', // Types - green
	base09 = '#e2b213', // Classes, namespaces - yellow
	base0A = '#a770db', // Functions - purple
	base0B = '#64afa9', // Strings - cyan
	base0C = '#dba15e', // Operators - orange
	base0D = '#e45d1e', // Parameters - orange-red
	base0E = '#559fe4', // String escapes - light blue
	base0F = '#3d8b1c'; // Markdown quotes - dark green

// Special state colors
const invalid = '#d14040', // Error red
	cursor = '#54494b', // Caret color - dark gray
	selection = '#ecc3e198', // Selection color
	selectionMatch = '#d6c6d398', // Selection match background
	lineHighlight = '#ecc3e158', // Active line highlight
	searchMatchBackground = '#ecc3e15d', // Search match background
	searchMatchBorder = '#dd71b9bb', // Search match border
	activeBracketBg = '#f5eaf5', // Active bracket background
	activeBracketBorder = '#ecc3e1', // Active bracket border
	gutterBackground = '#f5eaf5', // Gutter background
	gutterForeground = '#72696f', // Gutter text
	gutterActiveForeground = '#dd71b9', // Active line number
	tooltipBackground = '#f3e1f1', // Tooltip background
	panelBackground = '#f5eaf5', // Panel background
	diagnosticWarning = '#e2b213', // Warning color - yellow
	linkColor = '#dd71b9'; // Links - pink

// Diff/merge specific colors
const addedBackground = '#72c45b33', // Light green with transparency
	removedBackground = '#d1404033', // Light red with transparency
	addedText = '#62ad44', // Green for added text
	removedText = '#d14040'; // Red for removed text

/**
 * General styling configuration
 */
export const generalContent = {};

export const generalCursor = {
	borderLeftWidth: '2px'
};

export const generalDiff = {
	insertedTextDecoration: 'none',
	deletedTextDecoration: 'line-through',
	insertedLinePadding: '1px 3px',
	borderRadious: '3px',
	ins_del_linePadding: '1px 3px'
};

export const generalGutter = {
	border: 'none',
	paddingRight: '8px',
	fontSize: '0.9em',
	fontWeight: '500'
};

export const generalPanel = {
	border: 'none',
	borderRadius: '4px',
	padding: '2px 10px'
};

export const generalLine = {
	borderRadius: '2px'
};

export const generalMatching = {
	borderRadius: '2px'
};

export const generalPlaceholder = {
	borderRadius: '4px',
	padding: '0 5px',
	margin: '0 2px'
};

export const generalScroller = {
	width: '12px',
	height: '12px',
	borderRadius: '6px'
};

export const generalSearchField = {
	borderRadius: '4px',
	padding: '2px 6px'
};

export const generalTooltip = {
	borderRadius: '4px',
	borderRadiusSelected: '3px',
	lineHeight: '1.3',
	padding: '4px 8px',
	paddingRight: '8px'
};

/**
 * Enhanced editor theme styles for Huacat Pink
 */
const huacatPinkTheme = EditorView.theme(
	{
		// Base editor styles
		'&': {
			color: base01,
			backgroundColor: base00
			// fontSize: generalContent.fontSize,
			// fontFamily: generalContent.fontFamily
		},

		// Content and cursor
		'.cm-content': {
			caretColor: cursor
			// lineHeight: generalContent.lineHeight
		},
		'.cm-cursor, .cm-dropCursor': {
			borderLeftColor: cursor,
			borderLeftWidth: generalCursor.borderLeftWidth
		},
		'.cm-fat-cursor': {
			backgroundColor: `${cursor}99`,
			color: base00
		},

		// Selection
		'&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
			{
				backgroundColor: selection,
				color: base01
			},

		// Make sure selection appears above active line
		'.cm-selectionLayer': {
			zIndex: 100
		},

		// Search functionality
		'.cm-searchMatch': {
			backgroundColor: searchMatchBackground,
			outline: `1px solid ${searchMatchBorder}`,
			color: base01,
			borderRadius: generalSearchField.borderRadius,

			'& span': {
				color: base01
			}
		},
		'.cm-searchMatch.cm-searchMatch-selected': {
			backgroundColor: selection,
			color: base01,
			padding: generalSearchField.padding,

			'& span': {
				color: base01
			}
		},
		'.cm-search.cm-panel.cm-textfield': {
			color: base01,
			borderRadius: generalSearchField.borderRadius,
			padding: generalSearchField.padding
		},

		// Panels
		'.cm-panels': {
			backgroundColor: panelBackground,
			color: base01,
			borderRadius: '0 0 4px 4px'
		},
		'.cm-panels.cm-panels-top': {
			borderBottom: `1px solid ${base05}77`
		},
		'.cm-panels.cm-panels-bottom': {
			borderTop: `1px solid ${base05}77`
		},
		'.cm-panel button': {
			backgroundColor: base00,
			color: base01,
			border: generalPanel.border,
			borderRadius: generalPanel.borderRadius,
			padding: generalPanel.padding
		},
		'.cm-panel button:hover': {
			backgroundColor: '#ecc3e158'
		},

		// Line highlighting
		'.cm-activeLine': {
			backgroundColor: lineHighlight,
			borderRadius: generalLine.borderRadius,
			zIndex: 1
		},

		// Gutters
		'.cm-gutters': {
			backgroundColor: gutterBackground,
			color: gutterForeground,
			border: generalGutter.border,
			borderRight: `1px solid ${base05}33`,
			paddingRight: generalGutter.paddingRight
		},
		'.cm-activeLineGutter': {
			backgroundColor: lineHighlight,
			color: gutterActiveForeground,
			fontWeight: generalGutter.fontWeight
		},
		'.cm-lineNumbers': {
			fontSize: generalGutter.fontSize
		},
		'.cm-foldGutter': {
			fontSize: generalGutter.fontSize
		},
		'.cm-foldGutter .cm-gutterElement': {
			color: base03,
			cursor: 'pointer'
		},
		'.cm-foldGutter .cm-gutterElement:hover': {
			color: base05
		},

		// Diff/Merge View Styles
		// Inserted/Added Content
		'.cm-insertedLine': {
			textDecoration: generalDiff.insertedTextDecoration,
			backgroundColor: addedBackground,
			color: addedText,
			padding: generalDiff.insertedLinePadding,
			borderRadius: generalDiff.borderRadious
		},
		'ins.cm-insertedLine, ins.cm-insertedLine:not(:has(.cm-changedText))': {
			textDecoration: generalDiff.insertedTextDecoration,
			backgroundColor: `${addedBackground} !important`,
			color: addedText,
			padding: generalDiff.insertedLinePadding,
			borderRadius: generalDiff.borderRadious,
			border: `1px solid ${addedText}30`
		},
		'ins.cm-insertedLine .cm-changedText': {
			background: 'transparent !important'
		},

		// Deleted/Removed Content
		'.cm-deletedLine': {
			textDecoration: generalDiff.deletedTextDecoration,
			backgroundColor: removedBackground,
			color: removedText,
			padding: generalDiff.insertedLinePadding,
			borderRadius: generalDiff.borderRadious
		},
		'del.cm-deletedLine, del, del:not(:has(.cm-deletedText))': {
			textDecoration: generalDiff.deletedTextDecoration,
			backgroundColor: `${removedBackground} !important`,
			color: removedText,
			padding: generalDiff.insertedLinePadding,
			borderRadius: generalDiff.borderRadious,
			border: `1px solid ${removedText}30`
		},
		'del .cm-deletedText, del .cm-changedText': {
			background: 'transparent !important'
		},

		// Tooltips and autocomplete
		'.cm-tooltip': {
			backgroundColor: tooltipBackground,
			border: `1px solid ${base05}77`,
			borderRadius: generalTooltip.borderRadius,
			padding: generalTooltip.padding,
			boxShadow: '0 1px 5px rgba(221, 113, 185, 0.15)'
		},
		'.cm-tooltip-autocomplete': {
			'& > ul': {
				backgroundColor: tooltipBackground,
				border: 'none'
			},
			'& > ul > li': {
				padding: generalTooltip.padding,
				lineHeight: generalTooltip.lineHeight
			},
			'& > ul > li[aria-selected]': {
				backgroundColor: '#ecc3e162',
				color: base05,
				borderRadius: generalTooltip.borderRadiusSelected
			},
			'& > ul > li:hover': {
				backgroundColor: '#ecc3e135'
			},
			'& > ul > li > span.cm-completionIcon': {
				color: base05,
				paddingRight: generalTooltip.paddingRight
			},
			'& > ul > li > span.cm-completionDetail': {
				color: base03,
				fontStyle: 'italic'
			}
		},
		'.cm-tooltip .cm-tooltip-arrow:before': {
			borderTopColor: 'transparent',
			borderBottomColor: 'transparent'
		},
		'.cm-tooltip .cm-tooltip-arrow:after': {
			borderTopColor: tooltipBackground,
			borderBottomColor: tooltipBackground
		},

		// Diagnostics styling
		'.cm-diagnostic': {
			'&-error': {
				borderLeft: `3px solid ${invalid}`
			},
			'&-warning': {
				borderLeft: `3px solid ${diagnosticWarning}`
			},
			'&-info': {
				borderLeft: `3px solid ${linkColor}`
			}
		},
		'.cm-lintPoint-error': {
			borderBottom: `2px wavy ${invalid}`
		},
		'.cm-lintPoint-warning': {
			borderBottom: `2px wavy ${diagnosticWarning}`
		},

		// Matching brackets
		'.cm-matchingBracket': {
			backgroundColor: activeBracketBg,
			outline: `1px solid ${activeBracketBorder}`,
			borderRadius: generalMatching.borderRadius
		},
		'.cm-nonmatchingBracket': {
			backgroundColor: '#ffeef080',
			outline: `1px solid ${invalid}`,
			borderRadius: generalMatching.borderRadius
		},

		// Selection matches
		'.cm-selectionMatch': {
			backgroundColor: selectionMatch,
			outline: `1px solid ${selection}50`,
			borderRadius: generalMatching.borderRadius
		},

		// Fold placeholder
		'.cm-foldPlaceholder': {
			backgroundColor: selectionMatch,
			color: base05,
			border: `1px dotted ${base05}70`,
			borderRadius: generalPlaceholder.borderRadius,
			padding: generalPlaceholder.padding,
			margin: generalPlaceholder.margin
		},

		// Focus outline
		'&.cm-focused': {
			outline: 'none',
			boxShadow: `0 0 0 2px ${base00}, 0 0 0 3px ${linkColor}40`
		},

		// Scrollbars
		'& .cm-scroller::-webkit-scrollbar': {
			width: generalScroller.width,
			height: generalScroller.height
		},
		'& .cm-scroller::-webkit-scrollbar-track': {
			background: '#f0cef1aa'
		},
		'& .cm-scroller::-webkit-scrollbar-thumb': {
			backgroundColor: '#bbbbbb80',
			borderRadius: generalScroller.borderRadius,
			border: `3px solid #f0cef1aa`
		},
		'& .cm-scroller::-webkit-scrollbar-thumb:hover': {
			backgroundColor: '#f0b7f0cc'
		},

		// Ghost text
		'.cm-ghostText': {
			opacity: '0.5',
			color: base03
		}
	},
	{ dark: false }
);

/**
 * Enhanced syntax highlighting for Huacat Pink theme
 */
const huacatPinkHighlightStyle = HighlightStyle.define([
	// Keywords and control flow
	{ tag: t.keyword, color: base06, fontStyle: 'italic' },
	{ tag: t.controlKeyword, color: base06, fontStyle: 'italic' },
	{ tag: t.moduleKeyword, color: base06, fontStyle: 'italic' },

	// Names and variables
	{ tag: [t.name, t.deleted, t.character, t.macroName], color: base01 },
	{ tag: [t.variableName], color: base01 },
	{ tag: [t.propertyName], color: base01, fontStyle: 'normal' },

	// Classes and types
	{ tag: [t.typeName], color: base09 },
	{ tag: [t.className], color: base09, fontStyle: 'normal' },
	{ tag: [t.namespace], color: base09, fontStyle: 'normal' },

	// Operators and punctuation
	{ tag: [t.operator, t.operatorKeyword], color: base0C },
	{ tag: [t.bracket], color: base05 },
	{ tag: [t.brace], color: base05 },
	{ tag: [t.punctuation], color: base05 },

	// Functions and parameters
	{ tag: [t.function(t.variableName), t.labelName], color: base0A },
	{ tag: [t.definition(t.variableName)], color: base01 },

	// Parameters
	{ tag: t.special(t.variableName), color: base0D },

	// Constants and literals
	{ tag: t.number, color: base07 },
	{ tag: t.changed, color: base07 },
	{ tag: t.annotation, color: base0A, fontStyle: 'italic' },
	{ tag: t.modifier, color: base08, fontStyle: 'normal' },
	{ tag: t.self, color: base05, fontStyle: 'italic' },
	{ tag: [t.color, t.constant(t.name), t.standard(t.name)], color: base07 },
	{ tag: [t.atom, t.bool, t.special(t.variableName)], color: base07 },

	// Strings and regex
	{ tag: [t.processingInstruction, t.inserted], color: base0B },
	{ tag: [t.special(t.string), t.regexp], color: base0B },
	{ tag: t.string, color: base0B },
	{ tag: t.escape, color: base0E },

	// Storage/Type keywords
	{ tag: t.definition(t.typeName), color: base08, fontStyle: 'normal' },

	// Comments and documentation
	{ tag: t.meta, color: base03 },
	{ tag: t.comment, fontStyle: 'italic', color: base03 },
	{ tag: t.docComment, fontStyle: 'italic', color: base03 },

	// HTML/XML elements
	{ tag: [t.tagName], color: base06 },
	{ tag: [t.attributeName], color: base07 },
	{ tag: t.angleBracket, color: base05 },

	// Markdown and text formatting
	{
		tag: [t.heading, t.heading1, t.heading2, t.heading3, t.heading4, t.heading5, t.heading6],
		color: base06,
		fontWeight: 'bold'
	},
	{ tag: [t.strong], fontWeight: 'bold', color: base07 },
	{ tag: [t.emphasis], fontStyle: 'italic', color: base07 },

	// Links and URLs
	{
		tag: [t.link],
		color: base0A,
		fontWeight: '400',
		textDecoration: 'underline',
		textUnderlinePosition: 'under'
	},
	{
		tag: [t.url],
		color: linkColor,
		textDecoration: 'underline',
		textUnderlineOffset: '2px'
	},

	// Special states
	{
		tag: [t.invalid],
		color: invalid,
		textDecoration: 'underline wavy',
		borderBottom: `1px wavy ${invalid}`
	},
	{ tag: [t.strikethrough], color: base01, textDecoration: 'line-through' },

	// Enhanced syntax highlighting
	{ tag: t.constant(t.name), color: base07 },
	{ tag: t.squareBracket, color: base05 },

	// Additional specific styles
	{ tag: t.monospace, color: base08 },
	{ tag: [t.contentSeparator], color: base05 },
	{ tag: t.quote, color: base0F, fontStyle: 'italic' }
]);

/**
 * Combined Huacat Pink theme extension
 */
export const huacatPink: Extension = [
	huacatPinkTheme,
	syntaxHighlighting(huacatPinkHighlightStyle)
];

/**
 * Huacat Pink merge revert styles configuration
 */
export interface IMergeRevertStyles {
	backgroundColor: string;
	borderColor: string;
	buttonColor: string;
	buttonHoverColor: string;
}

export const huacatPinkMergeStyles: IMergeRevertStyles = {
	backgroundColor: tooltipBackground,
	borderColor: `${base05}77`,
	buttonColor: base01,
	buttonHoverColor: '#ecc3e158'
};

/**
 * Function to apply merge revert styles for a theme
 * @param styles Styles for the merge revert buttons
 * @param styles.backgroundColor Background color of the revert area
 * @param styles.borderColor Border color of the revert area
 * @param styles.buttonColor Color of the revert buttons
 * @param styles.buttonHoverColor Hover color of the revert buttons
 */
export function applyMergeRevertStyles(styles: IMergeRevertStyles) {
	// Create a stylesheet
	const styleEl = document.createElement('style');
	styleEl.id = 'cm-merge-revert-styles';

	// Define CSS with the theme-specific values
	styleEl.textContent = `
		.cm-merge-revert {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: flex-start;
			padding: 4px;
			background-color: ${styles.backgroundColor};
			border-left: 1px solid ${styles.borderColor};
			border-right: 1px solid ${styles.borderColor};
			width: 32px;
		}
		
		.cm-merge-revert button {
			width: 100%;
			height: auto;
			background-color: transparent;
			border: none;
			color: ${styles.buttonColor};
			cursor: pointer;
			margin: 0 auto;
			font-size: 20px;
		}
		
		.cm-merge-revert button:hover {
			background-color: ${styles.buttonHoverColor};
		}
	`;

	// Remove any existing merge styles
	const existingStyle = document.getElementById('cm-merge-revert-styles');
	if (existingStyle) existingStyle.remove();

	// Add the new styles
	document.head.appendChild(styleEl);
}
