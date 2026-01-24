import sanitizeHtmlModule from 'sanitize-html';

const sanitizeHtmlLib = (sanitizeHtmlModule as { default?: typeof sanitizeHtmlModule }).default || sanitizeHtmlModule;

const ALLOWED_TAGS = [
	'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li',
	'h1', 'h2', 'h3', 'h4', 'blockquote', 'a', 'span', 'div',
];

const isSafeHref = (href: string): boolean => (
	/^https?:\/\//i.test(href) || String(href).startsWith('/uploads/')
);

export const sanitizeHtml = (html?: string | null): string => {
	if (!html) return '';

	return sanitizeHtmlLib(String(html), {
		allowedTags: ALLOWED_TAGS,
		allowedAttributes: {
			a: ['href', 'target', 'rel'],
		},
		allowedSchemes: ['http', 'https'],
		allowProtocolRelative: false,
		disallowedTagsMode: 'discard',
		transformTags: {
			a: (_tagName, attribs) => {
				const href = attribs.href || '';
				if (!isSafeHref(href)) {
					return { tagName: 'a', attribs: {} };
				}
				return {
					tagName: 'a',
					attribs: {
						href,
						target: '_blank',
						rel: 'noopener noreferrer',
					},
				};
			},
		},
	});
};
