declare module 'draftjs-to-html';
declare module 'react-currency-format';
declare module 'react-draft-wysiwyg';
declare module 'mongoose-aggregate-paginate-v2';
declare module 'folio/coinbaseWallet' {
	export function coinbaseWallet(parameters?: any): any;
}
declare module 'folio/walletConnect' {
	export function walletConnect(parameters?: any): any;
}

declare module '*.json' {
	const value: any;
	export default value;
}

interface HttpError extends Error {
	statusCode?: number;
}
