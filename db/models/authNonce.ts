import { Schema, model, models } from 'mongoose';

const AuthNonceSchema = new Schema({
	_id: {
		type: String,
	},
	address: {
		type: String,
		default: '',
	},
	action: {
		type: String,
		default: '',
	},
}, { timestamps: true });

AuthNonceSchema.index({ createdAt: 1 }, { expireAfterSeconds: 10 * 60 });

const AuthNonce = models.AuthNonce || model('AuthNonce', AuthNonceSchema, 'auth_nonces');

export default AuthNonce;
