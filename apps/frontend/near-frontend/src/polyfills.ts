import { Buffer } from 'buffer';
import process from 'process';
import util from 'util';

// Make Buffer available globally
globalThis.Buffer = Buffer;
globalThis.process = process;
globalThis.util = util;

// Ensure TextEncoder is available
if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = util;
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
} 