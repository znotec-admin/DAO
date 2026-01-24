import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import formidable from 'formidable';
import type { NextApiRequest, NextApiResponse } from 'next';

import connectMongo from '../../../db/connect';
import { verifyWalletSignature } from '../../../utils/auth';
import { consumeAuthNonce } from '../../../utils/consumeAuthNonce';
import { requireMethod, sendError } from '../../../utils/proposalApi';

export const config = {
	api: {
		bodyParser: false,
	},
};

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.doc', '.docx', '.txt']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const parseForm = (req: NextApiRequest, uploadDir: string) => new Promise<{ fields: any; files: any }>((resolve, reject) => {
	const form = new formidable.IncomingForm({
		uploadDir,
		keepExtensions: true,
		maxFileSize: MAX_FILE_SIZE,
	});
	form.parse(req, (err, fields, files) => {
		if (err) {
			reject(err);
			return;
		}
		resolve({ fields, files });
	});
});

const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (!requireMethod(req, res, 'POST')) return;

	const uploadDir = path.join(process.cwd(), 'public/uploads');
	fs.mkdirSync(uploadDir, { recursive: true });

	try {
		const { fields, files } = await parseForm(req, uploadDir);
		await connectMongo();
		const action = String(firstValue(fields.action) || 'attachfile');
		const signer = verifyWalletSignature({
			address: String(firstValue(fields.address) || ''),
			signature: String(firstValue(fields.signature) || ''),
			timestamp: firstValue(fields.timestamp) as string,
			action,
			extra: String(firstValue(fields.extra) || ''),
			nonce: String(firstValue(fields.nonce) || ''),
		});
		await consumeAuthNonce({
			nonce: String(firstValue(fields.nonce) || ''),
			address: signer,
			action,
		});

		const file = firstValue(files.file) as { originalFilename?: string; filepath?: string; mimetype?: string; size?: number } | undefined;
		if (!file) {
			const error: HttpError = new Error('No file uploaded.');
			error.statusCode = 400;
			throw error;
		}

		const ext = path.extname(file.originalFilename || '').toLowerCase();
		if (!ALLOWED_EXTENSIONS.has(ext)) {
			if (file.filepath && fs.existsSync(file.filepath)) {
				fs.unlinkSync(file.filepath);
			}
			const error: HttpError = new Error('File type is not allowed.');
			error.statusCode = 400;
			throw error;
		}

		const safeName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
		const dest = path.join(uploadDir, safeName);
		fs.renameSync(file.filepath, dest);

		res.send({
			status: 'success',
			message: 'File is uploaded',
			data: {
				path: `/uploads/${safeName}`,
				name: safeName,
				mimetype: file.mimetype,
				size: file.size,
			},
		});
	} catch (err) {
		console.log(err);
		sendError(res, err, 'File upload failed');
	}
}
