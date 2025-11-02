import * as bip39 from 'bip39';

const mnemonic = "guitar install shoulder web twin provide electric edit animal want seminar day"
const seed = bip39.mnemonicToSeedSync(mnemonic);

import { derivePath, getPublicKey } from 'ed25519-hd-key';

// Dùng một đường dẫn tùy chỉnh cho app của bạn
const path = "m/9999'/0'/0'";

// Dẫn xuất
const { key, chainCode } = derivePath(path, seed.toString('hex'));

// Đây chính là cặp khóa E2EE của người dùng
const chatPrivateKey = key; // 32 bytes (dạng Buffer hoặc Uint8Array)
const chatPublicKey = getPublicKey(chatPrivateKey); // Lấy public key
const chatPublicKey = getPublicKey(chatPrivateKey); // Lấy public key

console.log(chatPrivateKey);
console.log(chatPublicKey);